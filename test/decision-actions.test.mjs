import test from 'node:test';
import assert from 'node:assert/strict';
import {decodeAction,decisionContract} from '../decision-actions.mjs';
import {createLLMProvider,llmConfig} from '../llm-provider.mjs';
import {BotKnowledge} from '../bot-knowledge.mjs';
const spec={kind:'rende-plan',cardIds:['peach','attack'],cardMin:1,cardMax:2,targetIds:['ally'],targetCount:1};
const prompt={id:'q',zone:'turn',min:1,max:1,options:[{id:'skill:rende',label:'Benevolence',targetIds:['ally'],targetMin:1,targetMax:1,actionSpec:spec},{id:'end'}]};
const view={turn:1,current:'me',phase:'Play',players:[{id:'me',name:'Me',hp:3,maxHp:4,alive:true,role:'loyal',general:null,hand:[{id:'peach',kind:'tao',name:'Peach'},{id:'attack',kind:'sha',name:'Attack'}],equip:{},judge:[]},{id:'ally',name:'Lord',hp:2,maxHp:5,alive:true,role:'lord',general:null,hand:[],equip:{},judge:[]}],logs:[]};
const config={...llmConfig({LLM_BASE_URL:'http://localhost/v1',LLM_MODEL:'mock'}),debug:true,timeoutMs:500};
const response=action=>new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(action)},finish_reason:'stop'}],usage:{prompt_tokens:50,completion_tokens:10}}));
test('explicit actions have deterministic fields; metadata cannot supply missing arguments',()=>{
 assert.deepEqual(decodeAction(prompt,{action:'use_skill',option_id:'skill:rende',card_ids:['peach'],target_ids:['ally']}),{ids:['skill:rende'],costs:['peach'],targets:['ally']});
 for(const wire of [{action:'use_skill',option_id:'skill:rende',card_ids:['peach'],plan:{target_ids:['ally']}},{action:'use_skill',option_id:'skill:rende',card_ids:['peach'],target_ids:['ally'],mode_id:null},{action:'end_phase',ids:['skill:rende']}])assert.throws(()=>decodeAction(prompt,wire));
 const q={id:'discard',zone:'cards',title:'Discard one',min:1,max:1,options:[{id:'peach',label:'Peach'},{id:'attack',label:'Attack'}]};
 assert.equal(decisionContract(q).selectionAction,'select_cards');assert.deepEqual(decodeAction(q,{action:'select_cards',card_ids:['peach']}),{ids:['peach'],targets:[]});
 assert.deepEqual(decodeAction({...q,zone:'skill-plan',context:spec},{action:'use_skill',card_ids:['peach'],target_ids:['ally']}),{ids:['peach','ally'],targets:[]});
 assert.deepEqual(decodeAction({...q,zone:'response'},{action:'choose_options',option_ids:['bagua']}),{ids:['bagua'],targets:[]});
 assert.deepEqual(decodeAction({...q,zone:'stargazing'},{action:'arrange_cards',option_ids:['peach','bottom','attack']}),{ids:['peach','bottom','attack'],targets:[]});
});
test('response choices share one contract and copied metadata is rejected',async()=>{
 for(const zone of ['response','options']){
  const q={id:'choice',zone,min:1,max:1,options:[{id:'pass'},{id:'accept'}]};
  assert.equal(decisionContract(q).selectionAction,'choose_options');
  assert.deepEqual(decodeAction(q,{action:'choose_options',option_ids:['pass']}),{ids:['pass'],targets:[]});
  assert.throws(()=>decodeAction(q,{action:'choose_options',option_ids:['pass'],response_fields:['action','option_ids']}),/Unexpected/);
 }
 const q={id:'discard',zone:'cards',title:'Discard a card',min:1,max:1,options:[{id:'peach'}]};
 assert.equal(decisionContract(q).selectionAction,decisionContract({...q,title:'Choose a card to lose'}).selectionAction);
});
test('invalid submission receives factual correction; only final valid action returns; costs count both requests',async()=>{
 const bodies=[],traces=[];const provider=createLLMProvider(config,{onTrace:t=>traces.push(t),fetchImpl:async(u,r)=>{
  const body=JSON.parse(r.body);bodies.push(JSON.parse(body.messages[1].content));
  return response(bodies.length===1?{action:'use_skill',option_id:'skill:rende',card_ids:['peach'],plan:{target_ids:['ally']}}:{action:'use_skill',option_id:'skill:rende',card_ids:['peach'],target_ids:['ally']});
 }});
 const result=await provider.decide({view,playerId:'me',matchId:'m',prompt});assert.deepEqual(result,{ids:['skill:rende'],targets:['ally'],costs:['peach']});
 assert.equal(bodies.length,2);assert.equal(bodies[1].validationFeedback.executed,false);assert.match(bodies[1].validationFeedback.error,/target_ids/);assert.equal(traces[0].attempts.length,2);assert.equal(traces[0].usage.prompt_tokens,100);
});
test('legal poor choices execute unchanged; retries stop on budget or stale window',async()=>{
 const q={id:'discard',zone:'cards',title:'Discard',min:1,max:1,options:[{id:'peach'},{id:'attack'}]};let calls=0;
 const provider=createLLMProvider(config,{fetchImpl:async()=>{calls++;return response({action:'select_cards',card_ids:['peach'],memory:'Keep Peach'});}});
 assert.deepEqual((await provider.decide({view,playerId:'me',matchId:'m',prompt:q})).ids,['peach']);assert.equal(calls,1);
 let current=true;calls=0;const p=createLLMProvider(config,{fetchImpl:async()=>{calls++;current=false;return response({action:'use_skill'});}});
 assert.equal(await p.decide({view,playerId:'me',matchId:'m',prompt,isCurrent:()=>current}),null);assert.equal(calls,1);
 calls=0;const capped=createLLMProvider({...config,requestLimit:1},{fetchImpl:async()=>{calls++;return response({action:'use_skill'});}});assert.equal(await capped.decide({view,playerId:'me',matchId:'m',prompt}),null);assert.equal(calls,1);
});
test('feedback reports observed loss and public discard separately from submitted intentions',()=>{
 const k=new BotKnowledge('me'),p=structuredClone(view.players[0]);k.observeOwn({turn:1,current:'me',phase:'Play',player:p});
 k.noteChoice({id:'discard',zone:'cards',options:[{id:'peach',label:'Peach'}]},{ids:['peach'],targets:[]});
 k.consume({type:'cards',turn:1,playerId:'me',action:'Discarded',cards:[p.hand[0]]});p.hand=p.hand.slice(1);k.observeOwn({turn:1,current:'me',phase:'Discard',player:p});
 const f=k.snapshot({...view,players:[p,view.players[1]]}).executionFeedback;assert.equal(f.observedSincePreviousSnapshot.lost[0].name,'Peach');assert.equal(f.currentHand[0].name,'Attack');assert.equal(f.recentOwnCardEvents[0].action,'Discarded');assert.match(f.note,/submission only/);
});
