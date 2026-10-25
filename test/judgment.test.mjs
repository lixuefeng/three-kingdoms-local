import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../engine.mjs';
import {GENERALS} from '../cards.mjs';
function setup(ask=(p,q,f)=>f){const g=new Game([{id:'a',name:'Alice'},{id:'b',name:'Bob'},{id:'c',name:'Carol'},{id:'d',name:'Dan'}],{ask});g.players.forEach(p=>{p.general=GENERALS.find(x=>x.id==='zhangfei');p.role='rebel';});g.current=g.players[0];return g;}
test('Luo River black judgment stays public after entering Zhen Ji hand, without exposing her other cards',async()=>{
 const g=setup(),p=g.players[0];p.general=GENERALS.find(x=>x.id==='zhenji');p.hand=[{id:'private-other',kind:'tao',suit:'♥',rank:2}];const c=g.deck.find(c=>c.suit==='♠');g.deck.splice(g.deck.indexOf(c),1);g.deck.unshift(c);
 await g.judgment(p,'Goddess of Luo River',{keepBlack:true});assert.ok(p.hand.includes(c));assert.ok(!g.table.includes(c));
 for(const viewer of g.players){const v=g.view(viewer.id);assert.equal(v.judgments[0].cards[0].card.id,c.id);assert.equal(v.judgments[0].final,true);assert.equal(v.judgments[0].cards[0].card.suit,'♠');if(viewer!==p)assert.ok(!JSON.stringify(v).includes('private-other'));}
});
test('all judgment types leave a public reveal after their physical card leaves the table',async()=>{
 for(const why of ['Goddess of Luo River','Eight Trigrams Formation','Lightning','Acedia','Rations Depleted','Cavalry']){const g=setup(),c=g.deck[0];await g.judgment(g.players[0],why);assert.equal(g.table.length,0);assert.equal(g.view('b').judgments[0].reason,why);assert.equal(g.view('b').judgments[0].cards[0].card.id,c.id);assert.ok(g.discard.includes(c));}
});
test('Necromancy publishes initial and replacement judgments, but keeps unplayed hand cards private',async()=>{
 const g=setup((p,q,f)=>q.context?.kind==='judgment-replace'?['replacement']:f),s=g.players[1];s.general=GENERALS.find(x=>x.id==='simayi');s.hand=[{id:'replacement',kind:'sha',suit:'♦',rank:9},{id:'sima-secret',kind:'tao',suit:'♥',rank:3}];const original=g.deck[0];await g.judgment(g.players[0],'Lightning');
 const v=g.view('c');assert.deepEqual(v.judgments[0].cards.map(r=>r.card.id),[original.id,'replacement']);assert.equal(v.judgments[0].cards[1].by,'b');assert.equal(v.judgments[0].finalCardId,'replacement');assert.ok(!JSON.stringify(v).includes('sima-secret'));
 v.judgments[0].cards[0].card.name='changed';assert.notEqual(g.judgments[0].cards[0].card.name,'changed');
});
test('final judgments pause visibly before the card is gained or discarded',async()=>{
 for(const reason of ['Goddess of Luo River','Lightning','Acedia']){
  const g=setup(),p=g.players[0],c=g.deck.find(c=>c.suit==='♠');g.deck.splice(g.deck.indexOf(c),1);g.deck.unshift(c);let held=false;
  g.pause=async ms=>{held=true;assert.equal(ms,3500);assert.equal(g.judgments.at(-1).final,true);assert.equal(g.view('b').judgments.at(-1).finalCardId,c.id);assert.ok(g.table.includes(c));assert.ok(!g.discard.includes(c));assert.ok(!p.hand.includes(c));};
  await g.judgment(p,reason,{keepBlack:reason==='Goddess of Luo River'});assert.equal(held,true);assert.ok(reason==='Goddess of Luo River'?p.hand.includes(c):g.discard.includes(c));
 }
});
test('judgments stay in one group with their reasons and replacement status',async()=>{
 const g=setup();g.beginAction('Judgment Phase');await g.judgment(g.players[0],'Acedia');await g.judgment(g.players[0],'Lightning');assert.equal(g.recentCards.length,2);assert.ok(g.recentCards[0].action.includes('Acedia'));assert.ok(g.recentCards[1].action.includes('Lightning'));assert.ok(g.recentCards.every(r=>r.action.includes('Final')));
});
