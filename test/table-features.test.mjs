import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,Finished} from '../engine.mjs';
import {LORD_GENERALS,GENERALS,defaultRoleCounts,validateRoleCounts} from '../cards.mjs';
import {BotKnowledge} from '../bot-knowledge.mjs';
const people=()=>Array.from({length:4},(_,i)=>({id:String(i),name:'P'+i}));
const wait=()=>new Promise(r=>setImmediate(r));
function game(options={}){const g=new Game(people(),{seconds:0,botPacing:false,...options});g.players.forEach((p,i)=>{p.general=GENERALS[i];p.role=i===0?'lord':i===1?'loyal':'rebel';});g.current=g.players[0];g.phase='Play';return g;}
test('custom role composition validates counts and game starts with the configured deck of roles',async()=>{
 const counts={lord:1,loyal:0,rebel:3,spy:0};assert.deepEqual(validateRoleCounts(counts,4),counts);
 for(const value of [{...counts,lord:2},{...counts,spy:2},{...counts,rebel:2},{...counts,rebel:2.5},{lord:1,loyal:3,rebel:0,spy:0}])assert.throws(()=>validateRoleCounts(value,4));
 const g=game({roleCounts:counts});g.selectGenerals=async()=>{assert.deepEqual(g.players.map(p=>p.role).sort(),['lord','rebel','rebel','rebel']);g.stopped=true;};await g.start();assert.deepEqual(g.view('2').roleCounts,counts);
});
test('remaining-role counter subtracts public eliminations but never identifies living roles',()=>{
 const g=game({roleCounts:{lord:1,loyal:0,rebel:3,spy:0}});g.players.forEach((p,i)=>p.role=i?'rebel':'lord');g.players[2].alive=false;
 const a=g.view('spectator'),b=g.view('1');assert.deepEqual(a.remainingRoles,{lord:1,loyal:0,rebel:2,spy:0});assert.deepEqual(a.remainingRoles,b.remainingRoles);assert.equal(a.players[1].role,null);assert.equal(a.players[2].role,'rebel');
 const k=new BotKnowledge('0');k.observeOwn({turn:1,current:'0',phase:'Play',player:g.players[0]});const beliefs=k.beliefs(g.view('0'));assert.equal(beliefs.find(x=>x.playerId==='1').probabilities.rebel,1);
});
test('Lord always sees enabled unbanned Lord candidates, plus random candidates without duplicates',async()=>{
 for(const expandedGenerals of [false,true]){
  const g=game({expandedGenerals,bannedGenerals:['caocao']});let lordOptions;
  g.askAdapter=async(p,q)=>{if(p.role==='lord')lordOptions=q.options.map(x=>x.id);return [q.options[0].id];};await g.selectGenerals();
  const enabled=expandedGenerals?LORD_GENERALS:LORD_GENERALS.filter(x=>['liubei','sunquan','caocao'].includes(x));
  for(const id of enabled.filter(x=>x!=='caocao'))assert.ok(lordOptions.includes(id),id);
  assert.ok(!lordOptions.includes('caocao'));assert.equal(new Set(lordOptions).size,lordOptions.length);assert.equal(new Set(g.players.map(p=>p.general.id)).size,4);
 }
});
test('AFK takeover resolves the pending decision, preserves seat and can hand back the next prompt',async()=>{
 const g=game(),p=g.players[0];const pending=g.ask(p,'Choose',[{id:'yes'},{id:'no'}],{fallback:['no']});g.setTakeover(p.id,true);assert.equal(g.view(p.id).prompt,null);assert.equal(g.view(p.id).control.takeover,true);await pending;
 assert.equal(p.bot,undefined);const next=g.ask(p,'Next',[{id:'yes'},{id:'no'}],{fallback:['no']});g.setTakeover(p.id,false);const q=g.view(p.id).prompt;assert.ok(q);g.answer(p.id,q.id,['yes']);assert.deepEqual(await next,['yes']);g.stop();
});
test('reclaim cancels a pending model and cannot apply its late action or plan',async()=>{
 let release,started;const ready=new Promise(r=>started=r);const provider={enabled:true,decide:async input=>{started(input);return await new Promise(r=>release=r);},forget:()=>{}};
 const g=game({llmProvider:provider}),p=g.players[0],pending=g.ask(p,'Choose',[{id:'yes'},{id:'no'}]);g.setTakeover(p.id,true,'claude');const input=await ready;
 g.setTakeover(p.id,false);assert.equal(input.signal.aborted,true);release({ids:['yes'],targets:[]});await wait();assert.ok(g.prompts.has(p.id));assert.equal(g.plannedPlays.size,0);const q=g.prompts.get(p.id);g.answer(p.id,q.id,['no']);assert.deepEqual(await pending,['no']);g.stop();
});
test('first expired human decision keeps its fallback and enables takeover for subsequent decisions',async()=>{
 const g=game(),p=g.players[0];assert.deepEqual(await g.ask(p,'Choose',[{id:'yes'},{id:'no'}],{timeout:.01,fallback:['no']}),['no']);assert.equal(p.takeover,true);g.stop();
});
test('takeover also answers shared windows and reclaim never extends a shared deadline',async()=>{
 const g=game({responseWindowMs:1000}),p=g.players[0];const task=g.sharedResponses('rescue','Rescue',x=>x===p?[{id:'peach'},{id:'pass'}]:[{id:'pass'}],{kind:'rescue',targetId:'1'});
 const deadline=g.responseWindow.deadline;g.setTakeover(p.id,true);g.setTakeover(p.id,false);assert.equal(g.responseWindow.deadline,deadline);const q=g.prompts.get(p.id);g.answer(p.id,q.id,['pass']);await task;g.stop();
});
test('AI takeover retains earlier public history while receiving only its own hand and role',async()=>{
 let received;const provider={enabled:true,decide:async input=>{received=input;return {ids:['pass'],targets:[]};},forget:()=>{}};
 const g=game({llmProvider:provider}),p=g.players[0];p.hand=[{id:'own-peach',kind:'tao',suit:'♥',rank:3}];g.players[1].hand=[{id:'hidden-enemy-card',kind:'sha',suit:'♠',rank:7}];
 g.log('Earlier public move.');const pending=g.ask(p,'Choose',[{id:'pass'},{id:'yes'}]);g.setTakeover(p.id,true,'claude');await pending;
 assert.ok(received.agentState.knowledge.eventsObservedSinceStart>0);assert.ok(JSON.stringify(received.view).includes('own-peach'));assert.ok(!JSON.stringify(received.view).includes('hidden-enemy-card'));assert.equal(received.view.players[1].role,null);assert.ok(received.view.logs.some(l=>l.message==='Earlier public move.'));g.stop();
});
test('multiple Spies are valid and compete for a sole-survivor win',async()=>{
 const counts={lord:1,loyal:0,rebel:1,spy:2};assert.deepEqual(validateRoleCounts(counts,4),counts);
 const g=game({roleCounts:counts});g.players.forEach((p,i)=>{p.role=['lord','rebel','spy','spy'][i];p.alive=i!==1;});
 g.checkWin();assert.equal(g.winner,null);
 g.players[2].alive=false;g.checkWin();assert.equal(g.winner,null);
 g.players[0].alive=false;assert.throws(()=>g.checkWin(),Finished);assert.equal(g.winner,'spy');
});
