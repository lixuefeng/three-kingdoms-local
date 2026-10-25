import test from 'node:test';
import assert from 'node:assert/strict';
import {seatsFromViewer,nextLiving,timerState,POSITIONS} from '../public/table.mjs';
import {Game} from '../engine.mjs';
test('each viewer is at the bottom; counterclockwise seats retain original seat numbers',()=>{
 for(let n=4;n<=8;n++){
  const players=Array.from({length:n},(_,i)=>({id:'p'+i,alive:true}));
  for(let viewer=0;viewer<n;viewer++){
   const seats=seatsFromViewer(players,players[viewer].id);
   assert.equal(seats.length,n);assert.equal(seats[0].player.id,players[viewer].id);assert.equal(seats[0].position[0],50);assert.ok(seats[0].position[1]>=80);
   for(let k=0;k<n;k++){assert.equal(seats[k].seat,(viewer+k)%n+1);assert.equal(seats[k].player.id,players[(viewer+k)%n].id);}
   assert.equal(new Set(seats.map(s=>s.position.join(','))).size,n);
  }
  assert.equal(POSITIONS[n].length,n);
 }
});
test('eliminated seats stay in place but next turn skips them and wraps around',()=>{
 const players=[{id:'a',alive:true},{id:'b',alive:false},{id:'c',alive:true},{id:'d',alive:false}];
 assert.equal(nextLiving(players,'a').id,'c');assert.equal(nextLiving(players,'c').id,'a');assert.equal(nextLiving(players,'d').id,'a');assert.equal(seatsFromViewer(players,'a')[1].player.id,'b');assert.equal(nextLiving([{id:'a',alive:true}],'a'),null);assert.deepEqual(seatsFromViewer(players,'unknown'),[]);
});
test('decision countdown clamps, marks the final ten seconds, and supports unlimited prompts',()=>{
 const q={startedAt:1000,deadline:61000};assert.deepEqual(timerState(q,31000),{seconds:30,fraction:.5,urgent:false});assert.equal(timerState(q,51000).urgent,true);assert.equal(timerState(q,62000).seconds,0);assert.equal(timerState(q,62000).fraction,0);assert.equal(timerState(q,0).fraction,1);assert.equal(timerState(null).seconds,null);
});
test('all players see the same timer, while private decision details remain private',async()=>{
 const g=new Game([{id:'a',name:'Alice'},{id:'b',name:'Bob'}]);
 const wait=g.ask(g.players[0],'SECRET hand decision',[{id:'secret-card',label:'Secret Peach'}],{timeout:0});
 const a=g.view('a'),b=g.view('b');assert.deepEqual(a.decision,b.decision);assert.equal(a.decision.playerId,'a');assert.equal(b.prompt,null);assert.doesNotMatch(JSON.stringify(b),/SECRET|secret-card|Secret Peach/);assert.equal(a.prompt.startedAt,a.decision.startedAt);
 const deadline=g.decision.deadline;assert.throws(()=>g.answer('b',a.prompt.id,['secret-card']));assert.equal(g.decision.deadline,deadline);
 g.answer('a',a.prompt.id,['secret-card']);assert.deepEqual(await wait,['secret-card']);assert.equal(g.view('b').decision,null);
});
test('expired decisions apply their fallback and clear public and private timers',async()=>{
 const g=new Game([{id:'a',name:'Alice'}]);const result=await g.ask(g.players[0],'Respond',[{id:'yes',label:'Yes'},{id:'pass',label:'Pass'}],{timeout:.03,fallback:['pass']});assert.deepEqual(result,['pass']);assert.equal(g.decision,null);assert.equal(g.prompts.size,0);
});
test('Lord anchors the top seat while engine seat order and numbers stay unchanged',async()=>{const {seatsFromLord}=await import('../public/table.mjs');const players=Array.from({length:8},(_,i)=>({id:String(i),role:i===3?'lord':null}));const seats=seatsFromLord(players);assert.equal(seats[0].player.id,'3');assert.deepEqual(seats.map(s=>s.seat),[4,5,6,7,8,1,2,3]);assert.deepEqual(players.map(p=>p.id),['0','1','2','3','4','5','6','7']);});
test('edge seating excludes the local dock player and preserves every opponent in order',async()=>{
 const {opponentsFromViewer}=await import('../public/table.mjs');for(let n=4;n<=8;n++){const players=Array.from({length:n},(_,i)=>({id:String(i)}));for(const p of players){const seats=opponentsFromViewer(players,p.id);assert.equal(seats.length,n-1);assert.ok(seats.every(s=>s.player.id!==p.id));assert.deepEqual(seats.map(s=>s.offset),Array.from({length:n-1},(_,i)=>i+1));assert.equal(new Set(seats.map(s=>s.player.id)).size,n-1);}}
});
