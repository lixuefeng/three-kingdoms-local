import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../engine.mjs';
import {GENERALS} from '../cards.mjs';
const flush=()=>new Promise(r=>setImmediate(r));
const players=()=>Array.from({length:4},(_,i)=>({id:String(i),name:'Player '+i}));
function setup(options={}){const g=new Game(players(),{seconds:0,...options});g.players.forEach((p,i)=>{p.role=i?'rebel':'lord';p.general=GENERALS.find(x=>x.id==='zhangfei');});g.current=g.players[0];g.phase='Play';return g;}
test('pass-all Negation persists within a spell and expires on the next spell in the same turn',async()=>{
 let asked=0;const g=setup({ask:(p,q,f)=>{if(q.context?.kind==='negation'){asked++;return p.id==='0'?['pass-turn']:asked===2?[q.options[0].id]:['pass'];}return f;}});
 g.players[0].hand=[{id:'n1',kind:'negate'}];g.players[1].hand=[{id:'n2',kind:'negate'}];g.turn=1;
 assert.equal(await g.negate(g.players[2],'Duel'),true);assert.equal(asked,3);assert.equal(g.players[0].hand.length,1);assert.equal(g.view('0').negationPassed,true);assert.equal(g.view('2').negationPassed,false);
 await g.negate(g.players[2],'Duel');assert.equal(asked,3);g.beginAction('Steal');assert.equal(g.view('0').negationPassed,false);await g.negate(g.players[2],'Steal');assert.equal(asked,4);
});
test('test presets select exact unique generals while unassigned players keep normal selection',async()=>{
 const g=setup({testing:true,ask:(p,q)=>[q.options[0].id]});g.players[0].testGeneral='zhugeliang';g.players[2].testGeneral='guanyu';await g.selectGenerals();assert.equal(g.players[0].general.id,'zhugeliang');assert.equal(g.players[0].hp,4);assert.equal(g.players[2].general.id,'guanyu');assert.equal(new Set(g.players.map(p=>p.general.id)).size,4);
 g.players[1].testGeneral='guanyu';await assert.rejects(g.selectGenerals(),/unique/);
});
test('test draw conserves cards and refreshes legal options while rejecting stale submissions',async()=>{
 const g=setup({testing:true});const p=g.current;g.used={sha:0};const count=g.deck.length;const pending=g.ask(p,'Play',[...g.playOptions(p)],{zone:'turn',timeout:0});const old=g.prompts.get(p.id).id;
 const c=g.testDraw('harvest');assert.equal(g.deck.length,count-1);assert.equal(p.hand[0],c);const q=g.prompts.get(p.id);assert.notEqual(q.id,old);assert.ok(q.options.some(o=>o.kind==='harvest'));assert.throws(()=>g.answer(p.id,old,['end']),/expired/);g.answer(p.id,q.id,['end']);await pending;
 assert.throws(()=>g.testDraw('sha'),/Play Phase/);const normal=setup();assert.throws(()=>normal.testDraw('sha'),/disabled/);
});
test('test draw keeps response deadline and valid timer fallback after refreshing prompt',async()=>{
 const g=setup({testing:true});const p=g.current;const pending=g.ask(p,'Play',g.playOptions(p),{zone:'turn',timeout:.02,fallback:['end']});const deadline=g.prompts.get(p.id).deadline;g.testDraw('sha');assert.equal(g.prompts.get(p.id).deadline,deadline);assert.deepEqual(await pending,['end']);assert.equal(g.prompts.size,0);
});
test('Bumper Harvest exposes public pool as direct table choices, one choice removes that card',async()=>{
 const g=setup();g.negate=async()=>false;g.players[0].hand=[g.deck.splice(g.deck.findIndex(c=>c.kind==='harvest'),1)[0]];g.current=g.players[0];g.used={sha:0};const opt=g.playOptions(g.current).find(o=>o.kind==='harvest');const running=g.play(g.current,opt.id);await flush();
 const q=g.prompts.get('0');assert.equal(q.zone,'harvest');assert.equal(q.options.length,4);const poolids=new Set(q.options.map(o=>o.id));assert.ok(g.view('2').table.filter(c=>poolids.has(c.id)).length===4);const chosen=q.options[1].id;g.answer('0',q.id,[chosen]);await flush();assert.ok(g.current.hand.some(c=>c.id===chosen));assert.ok(!g.table.some(c=>c.id===chosen));
 for(const p of g.players.slice(1)){const prompt=g.prompts.get(p.id);g.answer(p.id,prompt.id,[prompt.options[0].id]);await flush();}await running;assert.equal(g.table.length,0);
});
test('exact test draws distinguish identical card types by physical card id and suit/rank',async()=>{
 const g=setup({testing:true});const p=g.current;const cards=g.deck.filter(c=>c.kind==='sha');const chosen=cards[2];const pending=g.ask(p,'Play',g.playOptions(p),{zone:'turn',timeout:0});assert.equal(g.testDraw(undefined,chosen.id),chosen);assert.equal(p.hand[0].suit,chosen.suit);assert.equal(p.hand[0].rank,chosen.rank);assert.ok(g.deck.includes(cards[0]));assert.throws(()=>g.testDraw(undefined,chosen.id),/no longer/);g.answer(p.id,g.prompts.get(p.id).id,['end']);await pending;
});

test('adapter Negation chain lets an original pass-all player counter the counterspell',async()=>{
 let calls=0;const depths=[];const g=setup({ask:(p,q,f)=>{if(q.context?.kind!=='negation')return f;depths.push(q.context.negationDepth);if(p.id==='0')return [++calls===1?'pass-turn':'n1'];return [q.options[0].id];}});
 g.players[0].hand=[{id:'n1',kind:'negate'}];g.players[1].hand=[{id:'n2',kind:'negate'}];g.beginAction('Barbarian Invasion');
 assert.equal(await g.negate(g.players[2],'Barbarian Invasion'),false);assert.equal(calls,2);assert.deepEqual(depths,[0,0,1]);assert.equal(g.discard.filter(c=>c.kind==='negate').length,2);
});
