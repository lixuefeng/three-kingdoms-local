import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,Finished} from '../engine.mjs';
import {GENERALS} from '../cards.mjs';
function setup(){const g=new Game(Array.from({length:4},(_,i)=>({id:String(i),name:'P'+i})),{seconds:0,responseWindowMs:30});g.players.forEach((p,i)=>{p.general=GENERALS.find(g=>g.id==='zhangfei');p.role=i?'rebel':'lord';});g.current=g.players[0];return g;}
test('Negation only prompts cardholders while all players share the public window, hides individual decisions and closes after all responses',async()=>{
 const g=setup();g.players[1].hand=[{id:'secret-negation',kind:'negate',suit:'♠',rank:11}];const running=g.negate(g.players[2],'Duel');
 const publicView=g.view('observer');assert.equal(publicView.responseWindow.kind,'negation');assert.equal(publicView.decision,null);assert.deepEqual(publicView.decisions,[]);assert.equal(publicView.prompt,null);assert.ok(!JSON.stringify(publicView).includes('secret-negation'));
 assert.equal(g.prompts.size,1);const deadlines=new Set([...g.prompts.values()].map(q=>q.deadline));assert.equal(deadlines.size,1);
 for(const p of g.players){const q=g.prompts.get(p.id);if(q)g.answer(p.id,q.id,['pass']);}assert.equal(await running,false);assert.equal(g.responseWindow,null);
});
test('rescue includes players without Peach and consumes only the chosen legal response',async()=>{
 const g=setup(),[a,b]=g.players;a.hp=0;b.hand=[{id:'peach',kind:'tao',suit:'♥',rank:3}];const run=g.rescueShared(a);assert.equal(g.prompts.size,1);
 for(const p of g.players){const q=g.prompts.get(p.id);if(q)g.answer(p.id,q.id,[p===b?'peach':'pass']);}await run;assert.equal(a.hp,1);assert.equal(b.hand.length,0);assert.equal(g.discard[0].id,'peach');
});
test('private pass-all preference does not shorten or remove the public window',async()=>{
 const g=setup();g.negationPassTurn.set('0',g.turn);const run=g.negate(g.players[1],'Steal');assert.equal(g.prompts.has('0'),false);assert.equal(g.view('0').responseWindow.kind,'negation');assert.equal(g.view('1').negationPassed,false);for(const p of g.players.slice(1)){const q=g.prompts.get(p.id);if(q)g.answer(p.id,q.id,['pass']);}assert.equal(await run,false);
});
test('stopping a shared response window clears prompts and timers',async()=>{const g=setup(),run=g.negate(g.players[1],'Duel');g.stop();await assert.rejects(run,Finished);assert.equal(g.prompts.size,0);assert.equal(g.responseWindow,null);});
test('players without legal responses see only the shared countdown, with no private buttons',async()=>{
 const g=setup();let run=g.negate(g.players[1],'Acedia');assert.equal(g.prompts.size,0);assert.equal(g.view('0').prompt,null);assert.ok(g.view('0').responseWindow);assert.equal(await run,false);
 g.players[0].hp=0;run=g.rescueShared(g.players[0]);assert.equal(g.prompts.size,0);assert.equal(g.view('1').prompt,null);assert.equal(g.view('1').responseWindow.kind,'rescue');await run;assert.equal(g.players[0].hp,0);
});

test('Negation waits for the last holder, then closes without waiting for its deadline',async()=>{
 const g=setup();g.responseWindowMs=1000;
 for(const p of g.players.slice(0,2))p.hand=[{id:'neg-'+p.id,kind:'negate',suit:'♠',rank:11}];
 const run=g.negate(g.players[2],'Duel');let ended=false;run.then(()=>ended=true);
 let q=g.prompts.get('0');g.answer('0',q.id,['pass']);await Promise.resolve();assert.equal(ended,false);assert.ok(g.responseWindow);
 q=g.prompts.get('1');g.answer('1',q.id,['pass']);
 const outcome=await Promise.race([run,new Promise(resolve=>{const timer=setTimeout(()=>resolve('deadline-wait'),100);timer.unref();})]);assert.equal(outcome,false);assert.equal(g.responseWindow,null);assert.equal(g.prompts.size,0);
});

test('Peach rescue closes after the last response instead of waiting for the deadline',async()=>{
 const g=setup();g.responseWindowMs=1000;const [a,b]=g.players;a.hp=0;b.hand=[{id:'quick-peach',kind:'tao',suit:'♥',rank:3}];
 const run=g.rescueShared(a),q=g.prompts.get(b.id);g.answer(b.id,q.id,['quick-peach']);
 const outcome=await Promise.race([run.then(()=>true),new Promise(resolve=>{const timer=setTimeout(()=>resolve(false),100);timer.unref();})]);assert.equal(outcome,true);assert.equal(a.hp,1);assert.equal(g.responseWindow,null);
});
test('pass-for-spell suppresses counters but asks again for a new spell in the same player turn',async()=>{
 const g=setup(),[a,b,t]=g.players;g.beginAction('Duel');a.hand=[{id:'saved-negation',kind:'negate',suit:'♠',rank:11}];b.hand=[{id:'counter',kind:'negate',suit:'♥',rank:12}];
 const first=g.negate(t,'Duel');let q=g.prompts.get(a.id);assert.equal(q.options.find(o=>o.id==='pass-turn').label,'Pass for this spell');g.answer(a.id,q.id,['pass-turn']);q=g.prompts.get(b.id);g.answer(b.id,q.id,['counter']);assert.equal(await first,true);assert.equal(g.view(a.id).negationPassed,true);
 assert.equal(await g.negate(b,'Duel'),false,'same spell skips another target');
 const turn=g.turn;g.beginAction('Steal');assert.equal(g.turn,turn);assert.equal(g.view(a.id).negationPassed,false);
 const next=g.negate(t,'Steal');q=g.prompts.get(a.id);assert.ok(q,'new spell asks the cardholder again');g.answer(a.id,q.id,['pass']);assert.equal(await next,false);assert.equal(a.hand[0].id,'saved-negation');
});
