import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,Finished} from '../engine.mjs';
import {GENERALS,ALL_GENERALS} from '../cards.mjs';
import {CLASSIC_THREE_RULES,validateClassicSeats} from '../classic-three.mjs';
import {botObservation} from '../llm-provider.mjs';
import {matchReview} from '../results.mjs';
import {botDecision} from '../bots.mjs';
const people=()=>Array.from({length:6},(_,i)=>({id:String(i),name:'P'+i}));
const fixture=(opts={})=>new Game(people(),{mode:'3v3',seconds:0,botPacing:false,pause:async()=>{},...opts});
const cards=(kind,id)=>({id,kind,suit:'♠',rank:7});
function ready(g){g.setupClassicTeams();g.players.forEach((p,i)=>{p.general=GENERALS[i];p.maxHp=p.hp=p.general.hp+(p.commander?1:0);});g.current=g.players[1];g.phase='Play';g.threeVThree.stage='battle';g.threeVThree.startingTeam='red';}
const defaults=(p,q,f)=>f;
test('classic setup uses grouped seats, two commanders, fixed deck and a supported classic roster',()=>{
 const g=fixture({maneuver:true,expandedGenerals:true});g.setupClassicTeams();
 assert.deepEqual(g.players.map(p=>p.role),['red','red','red','blue','blue','blue']);assert.deepEqual(g.players.filter(p=>p.commander).map(p=>p.id),['1','4']);
 assert.equal(g.totalCards,106);assert.equal(g.maneuver,false);assert.ok(!g.deck.some(c=>['lightning','wine','fireSha'].includes(c.kind)));
 assert.ok(!g.generalPool.some(g=>g.id==='yuji'||g.pack==='Fire'));assert.ok(g.generalPool.some(g=>g.id==='xiaoqiao'));
 assert.throws(()=>validateClassicSeats(['0','1','2','3','4','4'],g.players));
 const h=fixture({classicSeatIds:['4','0','2','3','1','5']});h.setupClassicTeams();assert.equal(h.classicCommander('red').id,'0');assert.equal(h.classicCommander('blue').id,'1');
});
test('draft follows 1-2-2-2-2-2-2-2-1, deploys privately, and chooses initiative before dealing',async()=>{
 let g;const drafts=[],deploymentViews=[];
 g=fixture({ask:(p,q,f)=>{
  const ctx=q.context;
  if(ctx?.kind==='3v3-draft-order'){assert.equal(p.id,'1');return ['blue'];}
  if(ctx?.kind==='3v3-draft'){drafts.push({team:p.role,count:q.min});return q.options.slice(0,q.min).map(o=>o.id);}
  if(ctx?.kind==='3v3-deploy'){deploymentViews.push(g.view('spectator'));return [q.options[0].id];}
  if(ctx?.kind==='3v3-initiative'){assert.equal(p.id,'4');assert.ok(g.players.every(p=>p.hand.length===0));assert.ok(g.players.every(p=>p.general));return ['blue'];}
  return f;
 }});
 const turns=[];g.takeTurn=async p=>{turns.push(p.id);g.stopped=true;};await g.start();
 assert.deepEqual(drafts.map(d=>d.count),[1,2,2,2,2,2,2,2,1]);assert.deepEqual(drafts.map(d=>d.team),['blue','red','blue','red','blue','red','blue','red','blue']);
 assert.deepEqual(Object.values(g.threeVThree.teams).map(t=>t.roster.length),[8,8]);assert.equal(new Set(Object.values(g.threeVThree.teams).flatMap(t=>t.roster)).size,16);
 assert.ok(deploymentViews.every(v=>v.players.every(p=>p.general===null)));assert.equal(new Set(g.players.map(p=>p.general.id)).size,6);
 assert.ok(g.players.every(p=>p.hp===p.general.hp+(p.commander?1:0)));assert.ok(g.players.every(p=>p.hand.length===4));assert.deepEqual(turns,['4']);
});
test('real private prompts let only commanders draft, enforce counts and keep hands hidden',async()=>{
 const g=fixture();const pending=g.start();
 assert.equal(g.prompts.size,1);let q=g.prompts.get('1');assert.equal(q.context.kind,'3v3-draft-order');g.answer('1',q.id,['red']);await new Promise(r=>setImmediate(r));
 q=g.prompts.get('1');assert.equal(q.context.kind,'3v3-draft');assert.equal(g.view('0').prompt,null);assert.equal(g.view('spectator').threeVThree.available.length,16);
 g.answer('1',q.id,[q.options[0].id]);await new Promise(r=>setImmediate(r));q=g.prompts.get('4');assert.equal(q.min,2);
 assert.throws(()=>g.answer('4',q.id,[q.options[0].id]));assert.throws(()=>g.answer('0',q.id,[q.options[0].id,q.options[1].id]));g.stop();await pending;
});
test('action units link two vanguards and reset markers once everyone has acted',async()=>{
 const choices=[];const g=fixture({ask:(p,q,f)=>{choices.push(q.context?.kind);if(q.context?.kind==='3v3-unit')return [p.role==='blue'?'vanguards':'commander'];if(q.context?.kind==='3v3-vanguard-order')return [q.options[1].id];return f;}});ready(g);
 const turns=[],rounds=[];g.takeTurn=async p=>{turns.push(p.id);rounds.push(g.threeVThree.round);if(turns.length===7)g.stopped=true;};await g.runClassicBattle();
 assert.deepEqual(turns.slice(0,6),['1','5','3','2','0','4']);assert.deepEqual(rounds,[1,1,1,1,1,1,2]);assert.equal(turns[6],'1');assert.equal(g.threeVThree.actedIds.length,1);
 assert.ok(choices.includes('3v3-vanguard-order'));
});
test('exhausted teams yield, and dead vanguards are skipped during linkage',async()=>{
 const g=fixture({ask:defaults});ready(g);g.players[0].alive=false;g.players[2].alive=false;
 const turns=[];g.takeTurn=async p=>{turns.push(p.id);if(turns.length===5)g.stopped=true;};await g.runClassicBattle();assert.deepEqual(turns,['1','4','3','5','1']);
 const h=fixture({ask:(p,q,f)=>q.context?.kind==='3v3-unit'?['vanguards']:f});ready(h);const linked=[];
 h.takeTurn=async p=>{linked.push(p.id);if(p.id==='3')h.players[5].alive=false;if(linked.length===3)h.stopped=true;};await h.runClassicBattle();assert.deepEqual(linked,['1','3','0']);
});
test('commander death ends the game immediately while opposing vanguards can remain alive',async()=>{
 const g=fixture({ask:defaults});ready(g);g.players[4].hp=0;await assert.rejects(g.dying(g.players[4],g.players[0]),Finished);
 assert.equal(g.winner,'red');assert.equal(g.players[3].alive,true);assert.equal(g.players[5].alive,true);
 assert.ok(matchReview(g).players.filter(p=>p.won).every(p=>p.role==='red'));
});
test('enemy and friendly vanguard kills award three cards; Lord-only skills stay disabled',async()=>{
 for(const victimId of ['0','3']){const g=fixture({ask:defaults});ready(g);const source=g.players[1],victim=g.players[Number(victimId)];source.general=ALL_GENERALS.find(g=>g.id==='liubei');victim.hp=0;
  await g.dying(victim,source);assert.equal(source.hand.length,3);assert.equal(g.winner,null);assert.ok(!g.virtual(source,'sha').some(v=>v.lordRequest));}
});
test('group spells allow both directions, and harvest chooses before revealing cards',async()=>{
 for(const direction of ['clockwise','counterclockwise']){const g=fixture({ask:(p,q,f)=>q.context?.kind==='3v3-spell-direction'?[direction]:f});ready(g);const p=g.players[1];const order=await g.groupSpellOrder(p,'barbarian');assert.deepEqual(order.map(p=>p.id),direction==='clockwise'?['1','0','5','4','3','2']:['1','2','3','4','5','0']);}
 let chose=false;const h=fixture({ask:(p,q,f)=>{if(q.context?.kind==='3v3-spell-direction'){chose=true;assert.equal(h.table.length,1);assert.equal(h.table[0].kind,'harvest');return ['clockwise'];}return f;}});ready(h);const a=h.players[1],c=cards('harvest','harvest');a.hand=[c];await h.play(a,'play:harvest:harvest');assert.equal(chose,true);
});
test('model and practice captain choices carry commander rules and exact draft counts',()=>{
 const g=fixture();ready(g);const captain=g.players[1],q={zone:'general',min:2,max:2,title:'Draft 2',context:{kind:'3v3-draft'},options:GENERALS.slice(0,4).map(g=>({id:g.id,label:g.name}))};
 assert.equal(botDecision(g.view(captain.id),captain.id,q).ids.length,2);const obs=botObservation(g.view(captain.id),captain.id,q);
 assert.equal(obs.gameRules.objective,CLASSIC_THREE_RULES.objective);assert.equal(obs.players.find(p=>p.id==='4').commander,true);assert.ok(obs.threeVThree.teams.blue.commanderId);
 assert.match(obs.decisionBriefing.objective,/opposing commander/);assert.ok(obs.players.filter(p=>p.id!==captain.id).every(p=>!p.hand));
});
