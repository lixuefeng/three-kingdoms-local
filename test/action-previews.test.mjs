import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../engine.mjs';
import {ALL_GENERALS} from '../cards.mjs';
import {tacticalFacts} from '../bot-knowledge.mjs';
let id=0;
const card=(kind,suit='♠')=>({id:'preview-'+id++,kind,suit,rank:7});
function setup(general='pangtong'){
 const g=new Game(['a','b','c','d'].map(id=>({id,name:id,bot:true})),{botPacing:false,pause:async()=>{}});
 g.players.forEach((p,i)=>{p.general=ALL_GENERALS.find(x=>x.id===(i?'zhangfei':general));p.role=i===1?'lord':'rebel';p.hp=p.maxHp=4;p.hand=[];p.equip={};p.judge=[];});
 g.current=g.players[0];g.phase='Play';g.turn=1;return g;
}
const preview=(g,kind)=>{const p=g.current;return tacticalFacts(g,p,{zone:'turn',options:g.playOptions(p)}).actionPreviews.find(x=>x.effect?.startsWith('Equip ')&&x.optionId.startsWith('play:'+kind+':'));};

test('weapon previews expose new targets and agree with engine options without changing live state',()=>{
 const g=setup(),[a,,enemy]=g.players;a.hand=[card('serpent'),card('sha'),card('shan')];
 assert.ok(!g.playOptions(a).find(o=>o.kind==='sha').targetIds.includes(enemy.id));
 const before=JSON.stringify({players:g.players,used:g.used,deck:g.deck,logs:g.logs});
 const v=preview(g,'serpent');assert.equal(v.rangeAfter,3);assert.equal(v.handCountAfterKnownChanges,2);
 assert.ok(v.attacksAfter.find(o=>o.optionId.includes(a.hand[1].id)).targets.some(t=>t.playerId===enemy.id));
 assert.ok(v.newOrChangedFollowUps.some(o=>o.addedTargetIds.includes(enemy.id)));
 assert.ok(v.newOrChangedFollowUps.some(o=>o.optionId.includes('serpent:')));
 assert.equal(JSON.stringify({players:g.players,used:g.used,deck:g.deck,logs:g.logs}),before);
 const spear=a.hand.shift();a.equip.weapon=spear;const actual=g.playOptions(a);
 for(const o of v.newOrChangedFollowUps){const found=actual.find(x=>x.id===o.optionId);assert.ok(found,o.optionId);assert.deepEqual(found.targetIds||[],o.targetIds);}
});
test('Crossbow enables attacks after normal allowance, but does not override a Pindian prohibition',()=>{
 const g=setup(),a=g.current;a.hand=[card('crossbow'),card('sha')];g.used.sha=1;
 assert.ok(!g.playOptions(a).some(o=>o.kind==='sha'));
 const v=preview(g,'crossbow');assert.equal(v.unlimitedAttacksAfter,true);assert.ok(v.newOrChangedFollowUps.some(o=>o.kind==='sha'));
 g.used.tianyiLost=true;const forbidden=preview(g,'crossbow');assert.equal(forbidden.attackUsesRemainingAfter,0);assert.equal(forbidden.unlimitedAttacksAfter,false);assert.equal(forbidden.attacksAfter.length,0);
});
test('weapon replacement can remove reach and equipment costs must not retain their own range',()=>{
 const g=setup('guanyu'),a=g.current;a.equip.weapon=card('kylin');a.hand=[card('crossbow','♥'),card('sha')];
 const v=preview(g,'crossbow');assert.equal(v.rangeBefore,5);assert.equal(v.rangeAfter,1);
 const converted=v.attacksAfter.find(x=>x.equipmentSpent.some(c=>c.kind==='crossbow'));assert.ok(converted);assert.equal(converted.unlimitedAfterThisPlay,false);
});
test('armor preview updates damage facts and mount preview changes distance-restricted spells',()=>{
 const g=setup(),[a,,enemy]=g.players;enemy.equip.armor=card('renwang');enemy.hand=[card('sha')];a.hand=[card('qinggang'),card('sha'),card('minusHorse'),card('steal')];
 const sword=preview(g,'qinggang');assert.ok(sword.attacksAfter[0].targets.some(t=>t.playerId===enemy.id&&t.armorIgnored&&!t.blockedByArmor));
 const horse=preview(g,'minusHorse');assert.equal(horse.distancesAfter.find(x=>x.playerId===enemy.id).distance,1);assert.ok(horse.newOrChangedFollowUps.some(x=>x.kind==='steal'&&x.addedTargetIds.includes(enemy.id)));
});
test('replacements flag unknown skill draws and do not reveal secret cards, roles or deck',()=>{
 const g=setup('sunshangxiang'),a=g.current;a.hp=2;a.equip.armor=card('silverLion');a.hand=[card('bagua')];
 const first=preview(g,'bagua');assert.equal(first.hpAfterKnownChanges,3);assert.match(first.pendingUnknownEffects.join(' '),/unknown/);
 const other=g.players[2];other.hand=[card('tao')];const before=JSON.stringify(preview(g,'bagua'));
 other.hand=[{id:'PRIVATE-SECRET',kind:'negate',suit:'♥',rank:13}];other.role='spy';g.deck=[{id:'SECRET-DECK',kind:'sha'}];
 assert.equal(JSON.stringify(preview(g,'bagua')),before);assert.ok(!before.includes('PRIVATE-SECRET'));
});
test('draw counts, healing, Wine and end effects are factual rather than planned actions',()=>{
 const g=setup(),a=g.current;a.hp=2;a.hand=[card('draw2'),card('chain'),card('wine'),card('tao')];
 const facts=tacticalFacts(g,a,{zone:'turn',options:g.playOptions(a)}).actionPreviews;
 assert.equal(facts.find(x=>x.optionId.startsWith('play:draw2')).handCountAfterDrawIfNoOtherEffects,5);
 assert.equal(facts.find(x=>x.optionId.startsWith('recast:')).handCountAfterDrawIfNoOtherEffects,4);
 assert.equal(facts.find(x=>x.optionId.startsWith('play:tao')).hpAfter,3);
 assert.equal(facts.find(x=>x.optionId==='end').discardCountIfNoOtherEffects,2);
 assert.equal(facts.find(x=>x.optionId.startsWith('play:wine')).expires,'End of this turn');
 assert.deepEqual(tacticalFacts(g,a,{zone:'response',options:[]}).actionPreviews,[]);
 assert.ok(!JSON.stringify(facts).includes('recommended'));
});

test('all 44 general projections can use equipment previews without modifying engine state',()=>{
 for(const general of ALL_GENERALS){
  const g=setup(general.id),a=g.current;a.hand=[card('serpent'),card('sha'),card('shan'),card('minusHorse')];
  const before=JSON.stringify({players:g.players,used:g.used,deck:g.deck});
  assert.ok(preview(g,'serpent'),general.id);assert.ok(preview(g,'minusHorse'),general.id);
  assert.equal(JSON.stringify({players:g.players,used:g.used,deck:g.deck}),before,general.id);
 }
});
