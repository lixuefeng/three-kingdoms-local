import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../engine.mjs';
import {GENERALS,info} from '../cards.mjs';
import {actionPreview,gearLabel,recapTitle} from '../public/usability.mjs';
const setup=()=>{const g=new Game([{id:'a',name:'Alice'},{id:'b',name:'Bob'}],{ask:(p,q,f)=>f});g.players.forEach(p=>{p.general=GENERALS.find(x=>x.id==='zhangfei');p.role='rebel';});g.current=g.players[0];g.phase='Play';return g;};
test('unavailable hand reasons use private state without exposing hand IDs to others',()=>{
 const g=setup(),p=g.players[0];p.general=GENERALS.find(x=>x.id==='guanyu');p.hp=p.maxHp=4;p.hand=[{id:'secret-peach',kind:'tao',suit:'♥',rank:3},{id:'secret-hit',kind:'sha',suit:'♠',rank:7}];g.used.sha=1;
 const q={zone:'turn',options:[]};g.prompts.set(p.id,q);const own=g.view(p.id);assert.match(own.availability.cards['secret-peach'],/full health/);assert.match(own.availability.cards['secret-hit'],/already used/);assert.ok(!JSON.stringify(g.view('b')).includes('secret-hit'));assert.equal(g.view('watcher').availability,null);
 q.options=[{cardIds:['secret-hit']}];assert.equal(g.view('a').availability.cards['secret-hit'],null);
});
test('action previews preserve target order and equipment exposes short identity and range',()=>{
 const players=[{id:'a',name:'Alice'},{id:'b',name:'Bob'}];assert.equal(actionPreview({label:'Iron Chains',targetMax:2},['b','a'],players),'Iron Chains → Bob → Alice');
 assert.deepEqual(gearLabel(info({kind:'serpent'}),'weapon'),{icon:'♆',name:'Serpent',range:3});assert.equal(gearLabel(info({kind:'bagua'}),'armor').name,'Trigrams');
});
test('recap archives public plays and responses, never an unplayed hand card or private draw',()=>{
 const g=setup(),[a,b]=g.players;b.general=GENERALS.find(x=>x.id==='zhaoyun');a.hand=[{id:'secret-unplayed',kind:'tao',suit:'♥',rank:3}];g.beginAction('Attack');g.recordCards(a,[{id:'public-hit',kind:'sha',suit:'♠',rank:7}]);g.effect(a,b,'attack','Attack');g.recordCards(b,[{id:'public-dodge',kind:'shan',suit:'♦',rank:8}]);g.effect(b,b,'dodge','Dodged');g.beginAction('Next');
 const h=g.view('observer').actionHistory;assert.equal(h.length,1);assert.equal(h[0].cards.length,2);assert.ok(!JSON.stringify(h).includes('secret-unplayed'));assert.match(recapTitle(h[0],g.players),/Zhang Fei · Attack → Zhao Yun.*Zhao Yun Dodged/);
 for(let i=0;i<12;i++){g.effect(a,b,'skill','Test');g.beginAction('Next');}assert.equal(g.actionHistory.length,8);
});
test('Borrowed Sword preview and recap identify the ordered attacker and victim by general',()=>{
 const players=[{id:'a',name:'Alice',general:{name:'Cao Cao'}},{id:'b',name:'Bob',general:{name:'Zhang Fei'}},{id:'c',name:'Carol',general:{name:'Zhao Yun'}}];
 assert.match(actionPreview({kind:'borrow'},[],players),/weapon holder first/);
 assert.match(actionPreview({kind:'borrow'},['b'],players),/Zhang Fei.*Choose who/);
 assert.match(actionPreview({kind:'borrow'},['b','c'],players),/Zhang Fei must Attack Zhao Yun/);
 assert.match(recapTitle({borrowedSword:{sourceId:'a',attackerId:'b',targetId:'c'}},players),/Cao Cao.*Zhang Fei.*Zhao Yun/);
});
