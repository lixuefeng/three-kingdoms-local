import test from 'node:test';
import assert from 'node:assert/strict';
import {createAutonomousChat} from '../autonomous-chat.mjs';
import {createLLMProvider,llmConfig} from '../llm-provider.mjs';
import {Game} from '../engine.mjs';
import {ALL_GENERALS} from '../cards.mjs';
const tick=()=>new Promise(r=>setImmediate(r));
function fixture(){
 const human={id:'h',name:'Human'},bot={id:'b',name:'Bot',bot:true,botMode:'llm',botModel:'kimi'};
 const room={code:'TEST',status:'playing',players:[human,bot],messages:[],game:{matchId:'match',turn:3,phase:'Play',current:{id:'b'},logs:[],players:[{...human,general:{name:'Zhao Yun'},role:'lord',alive:true,hp:2,maxHp:4,hand:[{id:'human-secret',kind:'tao'}],equip:{},judge:[]},{...bot,general:{name:'Zhang Fei'},role:'rebel',alive:true,hp:3,maxHp:4,hand:[{id:'bot-secret',kind:'negate'}],equip:{},judge:[]}]}};
 const before=[{id:'h',general:'Zhao Yun',hp:4,handCount:1,alive:true,equipment:[]},{id:'b',general:'Zhang Fei',hp:3,handCount:2,alive:true,equipment:[]}];
 const event={type:'action-complete',actorId:'b',turn:3,label:'Attack',chatIntent:'celebrate_if_successful',before,after:before.map(p=>({...p,hp:p.id==='h'?2:3,handCount:1})),publicEvents:['Zhang Fei attacked Zhao Yun; Zhao Yun took 2 damage.']};
 return {room,bot,event};
}
test('resolved good play offers one public-only asynchronous celebration and obeys cooldowns',async()=>{
 const {room,event}=fixture();let finish,calls=0,context;let time=100000;
 const consider=createAutonomousChat({provider:{reply:async input=>{calls++;context=input.context;return await new Promise(r=>finish=r);}},broadcast:()=>{},now:()=>time});
 consider(room,event);assert.equal(calls,1);assert.equal(room.messages.length,0);assert.equal(context.spontaneous,true);assert.equal(context.opportunity.changes[0].hpAfter,2);
 assert.ok(!JSON.stringify(context).includes('human-secret'));assert.ok(!JSON.stringify(context).includes('bot-secret'));assert.equal(context.players.find(p=>p.id==='b').role,null);
 consider(room,event);assert.equal(calls,1);finish('Exactly as planned.');await tick();assert.equal(room.messages.length,1);assert.equal(room.messages[0].spontaneous,true);assert.equal(room.messages[0].name,'Zhang Fei');assert.equal(room.chatJobs.size,0);
 time+=1000;consider(room,event);assert.equal(calls,1);time+=40000;room.game.turn=4;consider(room,{...event,turn:4});assert.equal(calls,1);
 room.game.turn=5;consider(room,{...event,turn:5});assert.equal(calls,2);finish('A second good play.');await tick();
});
test('silence, failure, off, death, model changes and stale turns never post a filler',async()=>{
 for(const change of ['silence','failure','off','death','model','turn','reset']){
  const {room,bot,event}=fixture();let finish;
  const consider=createAutonomousChat({provider:{reply:async()=>await new Promise(r=>finish=r)},broadcast:()=>{},now:()=>100000});
  consider(room,event);
  if(change==='off')room.botChatter='off';if(change==='death')room.game.players[1].alive=false;if(change==='model')bot.botModel='claude';if(change==='turn')room.game.turn++;if(change==='reset')room.game=null;
  finish(change==='silence'?'':change==='failure'?null:'must not appear');await tick();assert.equal(room.messages.length,0,change);assert.equal(room.chatJobs.size,0,change);
 }
});
test('chat messages never trigger spontaneous replies and Off starts no jobs',()=>{
 const {room,event}=fixture();let n=0;const consider=createAutonomousChat({provider:{reply:async()=>{n++;}},broadcast:()=>{}});
 consider(room,{type:'chat',ai:true});room.botChatter='off';consider(room,event);assert.equal(n,0);
});
test('provider accepts explicit spontaneous silence but not empty addressed replies',async()=>{
 const provider=createLLMProvider(llmConfig({LLM_BASE_URL:'http://localhost/v1',LLM_MODEL:'mock'}),{fetchImpl:async()=>new Response(JSON.stringify({choices:[{message:{content:'{"reply":""}'}}]}))});
 assert.equal(await provider.reply({context:{spontaneous:true},playerId:'b',matchId:'one'}),'');assert.equal(provider.status().seats['one:b'].lastStatus,'chat-silent');
 assert.equal(await provider.reply({context:{message:'Hello'},playerId:'b',matchId:'two'}),null);
});
test('engine emits one completion after the whole play resolves, never before the response',async()=>{
 const events=[],game=new Game(['a','b','c','d'].map(id=>({id,name:id})),{onEvent:e=>events.push(e),pause:async()=>{}});
 game.players.forEach(p=>{p.general=ALL_GENERALS.find(g=>g.id==='zhangfei');p.role=p.id==='b'?'lord':'rebel';p.hand=[];});const [a,b]=game.players;
 a.hand=[{id:'attack',kind:'sha',suit:'♠',rank:7}];game.current=a;game.phase='Play';game.turn=1;game.plannedPlays.set(a.id,{optionId:'play:sha:attack',targetIds:[b.id],chatIntent:'celebrate_if_successful'});
 let resolve;game.useAttack=async()=>{await new Promise(r=>resolve=r);b.hp--;};const running=game.play(a,'play:sha:attack');await tick();assert.equal(events.filter(e=>e.type==='action-complete').length,0);resolve();await running;
 const completed=events.filter(e=>e.type==='action-complete');assert.equal(completed.length,1);assert.equal(completed[0].after.find(p=>p.id===b.id).hp,3);assert.equal(completed[0].chatIntent,'celebrate_if_successful');assert.ok(!JSON.stringify(completed[0]).includes('"hand":'));
});
