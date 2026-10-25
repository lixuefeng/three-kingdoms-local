import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectMatch,decisionDetail,decisionAnalysisContext} from '../match-analysis.mjs';
import {createLLMProvider,createModelRouter,llmConfig} from '../llm-provider.mjs';
const observation={you:'lord',turn:2,phase:'Play',players:[{id:'lord',name:'Liu Bei',role:'lord',hp:1,hand:[{id:'c1',name:'Peach'}]},{id:'other',name:'Zhao Yun',role:null,handCount:3}],prompt:{id:'q',zone:'turn',min:1,max:1,options:[{id:'gift',label:'Benevolence'},{id:'end',label:'End'}]},agentState:{knowledge:{roleBeliefs:[{playerId:'other',probabilities:{rebel:.7,spy:.3}}],plan:{objective:'Heal'}}}};
function records(){return [
 {type:'match-start',matchId:'m',time:1},
 {type:'state',turn:2,current:'lord',players:[{id:'lord',name:'Bot 1',general:'Liu Bei',role:'lord'},{id:'other',name:'Human',general:'Zhao Yun',role:'rebel'}]},
 {type:'game-event',event:{type:'log',turn:2,text:'Liu Bei uses Benevolence.'}},
 {type:'ai-trace',time:3,trace:{playerId:'lord',promptId:'q',decisionType:'turn',model:'Kimi',status:'model',request:JSON.stringify({messages:[{role:'user',content:JSON.stringify(observation)}]}),response:JSON.stringify({choices:[{message:{content:'{"ids":["gift"],"targets":[]}'}}]}),acceptedAction:{ids:['gift'],targets:[]},usage:{prompt_tokens:100,completion_tokens:20}}},
 {type:'ai-plan',playerId:'lord',promptId:'q',plan:{objective:'Heal'}},
 {type:'game-event',event:{type:'bot-decision',turn:2,playerId:'lord',promptId:'q',source:'model',ids:['gift'],targets:[]}},
 {type:'state',turn:3,current:'other',winner:'lord',players:[{id:'other',name:'Human',general:'Zhao Yun',role:'rebel',hand:[{id:'future-secret'}]}]},
 {type:'match-status',status:'finished',winner:'lord'},
 {type:'decision-analysis',decisionId:'3',model:'Claude',result:{assessment:'Uncertain',concerns:[],alternatives:[],confidence:'low'}}];}
test('timeline groups turns, links decisions/plans/executed choices and saved evaluations',()=>{
 const a=inspectMatch(records());assert.equal(a.turns.find(t=>t.turn===2).name,'Liu Bei');assert.equal(a.decisions[0].actionLabel,'Benevolence');assert.equal(a.decisions[0].executed.source,'model');assert.equal(a.decisions[0].plan.objective,'Heal');assert.equal(a.decisions[0].evaluation.model,'Claude');assert.equal(a.summary.inputTokens,100);assert.equal(a.status,'finished');assert.equal(inspectMatch([...records(),{type:'match-status',status:'lobby'}]).status,'finished');
});
test('analysis context uses only historical bot view, never later roles or archive private state',()=>{
 const d=decisionDetail(records(),'3'),ctx=decisionAnalysisContext(d);assert.equal(d.roleBeliefs[0].probabilities.rebel,.7);assert.equal(ctx.observation.players[1].role,null);assert.ok(!JSON.stringify(ctx).includes('future-secret'));assert.ok(!JSON.stringify(ctx).includes('"role":"rebel"'));assert.equal(ctx.executed.ids[0],'gift');assert.equal(ctx.modelResponse,'{"ids":["gift"],"targets":[]}');assert.throws(()=>decisionDetail(records(),'../3'));assert.throws(()=>decisionDetail(records(),'1'));
});
test('technical flags distinguish request failure from strategy, analysis traces do not inflate gameplay metrics',()=>{
 const r=records();r[3].trace.status='invalid-choice';r[3].trace.validationReason='Incorrect selection count';r.push({type:'ai-trace',trace:{decisionType:'analysis',status:'analysis-model'}});const a=inspectMatch(r);assert.equal(a.decisions.length,1);assert.equal(a.summary.failedRequests,1);assert.equal(a.decisions[0].issues[0].kind,'technical');
});
test('both transports run optional decision analysis with separate counters and no gameplay action',async()=>{
 for(const transport of ['openai','bedrock-converse']){let sent;const c={...llmConfig({LLM_BASE_URL:'http://localhost/v1',LLM_MODEL:'test'}),transport,debug:true},provider=createLLMProvider(c,{fetchImpl:async(u,o)=>{sent=JSON.parse(o.body);const content=JSON.stringify({assessment:'Healing may justify giving weak cards, but strengthens a likely enemy.',concerns:['Recipient may be Rebel.'],alternatives:['Keep Peach.'],confidence:'medium'});return new Response(JSON.stringify(transport==='bedrock-converse'?{output:{message:{content:[{text:content}]}},usage:{inputTokens:10,outputTokens:20}}:{choices:[{message:{content}}],usage:{prompt_tokens:10,completion_tokens:20}}));}});
  const result=await provider.analyze({context:decisionAnalysisContext(decisionDetail(records(),'3')),playerId:'lord',matchId:'m'});assert.equal(result.result.confidence,'medium');assert.ok(!JSON.stringify(sent).includes('future-secret'));const stats=provider.status().seats['m:lord'];assert.equal(stats.analysisSuccesses,1);assert.equal(stats.requests,0);assert.equal(stats.outputTokens,20);
 }
});
test('analysis request limit is independent of game decisions and rejects malformed assessments',async()=>{
 const config={...llmConfig({LLM_BASE_URL:'http://localhost/v1',LLM_MODEL:'test'}),debug:true},router=createModelRouter(config,{fetchImpl:async()=>new Response(JSON.stringify({choices:[{message:{content:'{"ids":["end"],"targets":[]}'}}]}))});
 const input={context:{},playerId:'b',matchId:'m'};for(let i=0;i<30;i++)assert.equal(await router.analyze(input),null);await assert.rejects(()=>router.analyze(input),/limit/);assert.equal(router.status().seats['m:b'].requests,0);assert.equal(router.status().seats['m:b'].analysisFailures,30);
});
