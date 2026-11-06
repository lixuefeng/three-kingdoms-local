import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../engine.mjs';
import {ROLES,GENERALS,LORD_GENERALS,defaultRoleCounts,validateRoleCounts} from '../cards.mjs';
import {minimumGenerals,generalChoiceCount,roomCapacity,validateModeSeats} from '../game-modes.mjs';
import {POSITIONS,largeTableScale,opponentsFromViewer} from '../public/table.mjs';
import {botObservation} from '../llm-provider.mjs';
import {BotKnowledge} from '../bot-knowledge.mjs';

const players=n=>Array.from({length:n},(_,i)=>({id:'p'+i,name:'Player '+i}));
test('nine and ten player identity compositions include every seat, with two Spies at ten',()=>{
 assert.deepEqual(defaultRoleCounts(9),{lord:1,loyal:3,rebel:4,spy:1});
 assert.deepEqual(defaultRoleCounts(10),{lord:1,loyal:3,rebel:4,spy:2});
 for(const n of [9,10])assert.deepEqual(validateRoleCounts(defaultRoleCounts(n),n),defaultRoleCounts(n));
 assert.equal(roomCapacity('identity'),10);assert.equal(roomCapacity('2v2'),4);assert.equal(roomCapacity('3v3'),6);
 assert.throws(()=>validateModeSeats('identity',11));assert.throws(()=>validateModeSeats('3v3',10));
});
for(const [n,expanded,banned] of [[9,false,0],[10,false,0],[10,true,0],[10,false,6]])test(`${n}-seat identity starts with expanded=${expanded}, bans=${banned}, unique general offers and private hands`,async()=>{
 const offers=[];let dealt=false;const g=new Game(players(n),{expandedGenerals:expanded,bannedGenerals:GENERALS.slice(0,banned).map(g=>g.id),botPacing:false,pause:async()=>{},ask:async(p,q)=>{assert.equal(q.zone,'general');offers.push({id:p.id,options:q.options.map(o=>o.id)});return [q.options[0].id];}});
 g.takeTurn=async p=>{assert.equal(p.role,'lord');assert.ok(g.players.every(x=>x.hand.length===4));dealt=true;g.stopped=true;};
 await g.start();assert.equal(dealt,true);assert.equal(offers.length,n);assert.equal(offers[0].id,g.players.find(p=>p.role==='lord').id);
 const count=generalChoiceCount('identity',n,g.generalPool.length);assert.ok(offers.slice(1).every(o=>o.options.length===count));
 const choices=offers.slice(1).flatMap(o=>o.options);assert.equal(new Set(choices).size,choices.length);
 for(const id of LORD_GENERALS.filter(id=>g.generalPool.some(x=>x.id===id)))assert.ok(offers[0].options.includes(id));
 assert.equal(new Set(g.players.map(p=>p.general.id)).size,n);assert.ok(g.players.every(p=>p.hp===p.general.hp+(p.role==='lord'?1:0)));
 const me=g.players.find(p=>p.role!=='lord'),view=g.view(me.id);assert.equal(view.players.filter(p=>p.hand!==undefined).length,1);assert.equal(view.players.filter(p=>p.id!==me.id&&p.role!==null).length,1);
 const knowledge=new BotKnowledge(me.id);knowledge.observeOwn({turn:view.turn,current:view.current,phase:view.phase,player:view.players.find(p=>p.id===me.id),mode:view.mode});const beliefs=knowledge.beliefs(view);assert.equal(beliefs.length,n);
 const q={zone:'turn',title:'Play',min:1,max:1,options:[{id:'end',label:'End phase'}]};const obs=botObservation(view,me.id,q);assert.equal(obs.players.length,n);assert.deepEqual(obs.roleCounts,defaultRoleCounts(n));
 assert.equal(ROLES[n].length,n);
});
test('ten-player pool threshold prevents empty choices without requiring expansions',async()=>{
 assert.equal(minimumGenerals('identity',10),19);assert.equal(generalChoiceCount('identity',10,25),2);assert.equal(generalChoiceCount('identity',10,28),3);
 const g=new Game(players(10),{bannedGenerals:GENERALS.slice(0,7).map(g=>g.id)});await assert.rejects(()=>g.selectGenerals(),/Too many banned/);
});
test('ten-player distance wraps, shrinks after elimination, and respects horses',()=>{
 const g=new Game(players(10));g.players.forEach(p=>p.general=GENERALS.find(g=>g.id==='caocao'));const [a,b]=g.players;
 assert.equal(g.distance(a,g.players[9]),1);assert.equal(g.distance(a,g.players[5]),5);
 b.alive=false;assert.equal(g.distance(a,g.players[2]),1);assert.equal(g.distance(a,g.players[5]),4);
 g.players[5].equip.plus={kind:'plus'};assert.equal(g.distance(a,g.players[5]),5);a.equip.minus={kind:'minus'};assert.equal(g.distance(a,g.players[5]),4);
});
test('large-table perimeter cells fit all opponents without overlap at desktop sizes',()=>{
 for(const n of [9,10])for(const [width,height] of [[1900,700],[1420,500],[1000,350]]){
  const scale=largeTableScale(width,height),boxes=POSITIONS[n].slice(1).map(([x,y])=>({x:x*width/100,y:y*height/100,w:230*scale,h:240*scale}));
  for(const b of boxes){assert.ok(b.x-b.w/2>=0&&b.x+b.w/2<=width);assert.ok(b.y-b.h/2>=0&&b.y+b.h/2<=height);}
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];assert.ok(Math.abs(a.x-b.x)>=(a.w+b.w)/2||Math.abs(a.y-b.y)>=(a.h+b.h)/2,`${n} seats overlap at ${width}×${height}`);}
  assert.equal(opponentsFromViewer(players(n),'p0').length,n-1);
 }
});
