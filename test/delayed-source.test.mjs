import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../engine.mjs';
import {ALL_GENERALS,makeDeck} from '../cards.mjs';
function setup(){const g=new Game(['a','b','c','d'].map(id=>({id,name:'Player '+id})),{seedDeck:makeDeck({maneuver:true}),ask:(p,q,f)=>f,pause:async()=>{}});g.players.forEach((p,i)=>{p.general=ALL_GENERALS.find(x=>x.id==='zhangfei');p.role=['lord','loyal','rebel','spy'][i];});g.current=g.players[0];g.phase='Play';return g;}
test('delayed spell preview exposes the placer to every viewer and updates on replay',async()=>{
 const g=setup(),[a,b]=g.players,c={id:'delay-source',kind:'indulgence',suit:'♥',rank:6};a.hand=[c];let option='play:indulgence:'+c.id;g.plannedPlays.set(a.id,{optionId:option,targetIds:[b.id]});await g.play(a,option);
 for(const viewer of g.players)assert.deepEqual(g.view(viewer.id).players[1].judge[0].placedBy,{playerId:a.id,playerName:a.name});
 assert.equal(c.placedBy,undefined);await g.remove(b,c,b.hand);assert.equal(g.view(b.id).players[1].hand[0].placedBy,undefined);
 g.current=b;g.plannedPlays.set(b.id,{optionId:option,targetIds:[a.id]});await g.play(b,option);assert.equal(g.view(a.id).players[0].judge[0].placedBy.playerId,b.id);
});
test('Lightning retains its original placer after passing to the next judgment zone',async()=>{
 const g=setup(),[a,b]=g.players,c={id:'lightning-source',kind:'lightning',suit:'♠',rank:1};a.hand=[c];await g.play(a,'play:lightning:'+c.id);g.deck=[{id:'safe-judgment',kind:'sha',suit:'♥',rank:5},...g.deck];await g.takeTurn(a);assert.ok(b.judge.includes(c));assert.equal(g.view(b.id).players[1].judge[0].placedBy.playerId,a.id);
});
