import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,Finished} from '../engine.mjs';
const flush=()=>new Promise(r=>setImmediate(r));
function setup(n=8){const g=new Game(Array.from({length:n},(_,i)=>({id:String(i),name:'P'+i})),{seconds:0});g.players.forEach((p,i)=>p.role=i===2?'lord':'rebel');return g;}
function answer(g,p){const q=g.prompts.get(p.id);g.answer(p.id,q.id,[q.options[0].id]);}
test('Lord chooses first, then all seven others choose concurrently with private disjoint offers',async()=>{
 const g=setup(),lord=g.players[2],run=g.selectGenerals();
 assert.deepEqual([...g.prompts.keys()],[lord.id]);assert.equal(g.decisions.size,1);
 answer(g,lord);await flush();
 assert.ok(lord.general);assert.equal(lord.maxHp,lord.general.hp+1);assert.equal(g.prompts.size,7);assert.equal(g.decisions.size,7);
 const offers=[...g.prompts.values()].flatMap(q=>q.options.map(o=>o.id));assert.equal(offers.length,21);assert.equal(new Set(offers).size,21);assert.ok(!offers.includes(lord.general.id));
 for(const p of g.players.filter(p=>p!==lord)){
  const v=g.view(p.id);assert.equal(v.prompt.id,g.prompts.get(p.id).id);assert.equal(v.decisions.length,7);
  const peer=g.players.find(t=>t!==p&&t!==lord);for(const option of g.prompts.get(peer.id).options)assert.ok(!JSON.stringify(v).includes(option.id));
 }
 const first=g.players[0];answer(g,first);await flush();assert.equal(g.prompts.size,6);assert.equal(g.decisions.size,6);assert.equal(first.general,undefined);assert.equal(g.view(first.id).prompt,null);assert.ok(g.decision);
 for(const p of g.players.filter(p=>p!==lord&&p!==first))answer(g,p);
 await run;assert.equal(new Set(g.players.map(p=>p.general.id)).size,8);assert.equal(g.decisions.size,0);assert.equal(g.decision,null);assert.equal(g.prompts.size,0);assert.ok(g.players.every(p=>p.hp===p.maxHp));
});
test('parallel selection timeouts autochoose and clear every timer',async()=>{const g=setup(4);g.seconds=.01;await g.selectGenerals();assert.ok(g.players.every(p=>p.general));assert.equal(g.prompts.size,0);assert.equal(g.decisions.size,0);assert.equal(new Set(g.players.map(p=>p.general.id)).size,4);});
test('aborting simultaneous selection settles all waits without assigning late choices',async()=>{const g=setup(),run=g.selectGenerals();answer(g,g.players[2]);await flush();g.stop();await assert.rejects(run,Finished);assert.equal(g.prompts.size,0);assert.equal(g.decisions.size,0);assert.ok(g.players.filter(p=>p.role!=='lord').every(p=>!p.general));});
test('Lord starts with one extra current and maximum health in every supported room size',async()=>{
 for(let n=4;n<=8;n++){
  const g=setup(n);g.askAdapter=(p,q)=>[q.options[0].id];await g.selectGenerals();
  for(const p of g.players){assert.equal(p.maxHp,p.general.hp+(p.role==='lord'?1:0),`${n} seats, ${p.role}`);assert.equal(p.hp,p.maxHp);}
 }
});
