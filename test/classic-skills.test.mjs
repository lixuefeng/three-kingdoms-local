import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../engine.mjs';
import {GENERALS} from '../cards.mjs';
let seq=0;const c=(kind='sha',suit='♠',rank=7)=>({id:'classic'+seq++,kind,suit,rank});
const general=(p,id)=>{p.general=GENERALS.find(g=>g.id===id);p.maxHp=p.hp=p.general.hp;};
function setup(ask){const g=new Game(Array.from({length:4},(_,i)=>({id:String(i),name:'P'+i})),{ask:ask||((p,q,f)=>f)});g.players.forEach((p,i)=>{general(p,'zhangfei');p.role=['lord','loyal','rebel','spy'][i];});g.current=g.players[0];g.phase='Play';g.used={sha:0};return g;}
const yes=(p,q,f)=>q.options.some(o=>o.id==='yes')?['yes']:f;
test('the original roster contains 25 distinct generals with sex metadata',()=>{assert.equal(GENERALS.length,25);assert.equal(new Set(GENERALS.map(g=>g.id)).size,25);assert.ok(GENERALS.every(g=>['m','f'].includes(g.sex)));});
test('Cao Cao takes the actual resolving damage card once, preserving ownership',async()=>{const g=setup(yes),[a,b]=g.players;general(b,'caocao');const hit=c();g.table=[hit];await g.damage(a,b,1,{kind:'sha',cards:[hit]});g.finishCards([hit]);assert.deepEqual(b.hand,[hit]);assert.equal(g.discard.length,0);assert.equal(g.table.length,0);await g.damage(a,b,1,{cards:[hit]});assert.equal(b.hand.length,1);});
test('Cao Cao Lord request consumes a willing Wei ally Dodge; non-Lord has no request',async()=>{const g=setup((p,q,f)=>q.zone==='response'?[q.options.find(o=>o.id!=='pass')?.id||'pass']:f),[a,b]=g.players;general(a,'caocao');general(b,'simayi');const dodge=c('shan');b.hand=[dodge];assert.ok(await g.response(a,'shan','Defend'));assert.deepEqual(g.discard,[dodge]);assert.equal(b.hand.length,0);a.role='loyal';assert.ok(!g.virtual(a,'shan').some(v=>v.lordRequest));});
test('Sima Yi replaces a judgment using hand only; Guo Jia obtains the final card',async()=>{let replacement;const g=setup((p,q,f)=>q.context?.kind==='judgment-replace'?[replacement.id]:yes(p,q,f)),[a,b]=g.players;general(a,'guojia');general(b,'simayi');const old=c('sha','♠');replacement=c('shan','♥');const gear=c('bagua');b.hand=[replacement];b.equip.armor=gear;g.deck=[old];assert.equal(await g.judgment(a,'test'),replacement);assert.deepEqual(a.hand,[replacement]);assert.deepEqual(g.discard,[old]);assert.equal(b.equip.armor,gear);assert.deepEqual(g.reserved,[]);});
test('Sima Yi retaliates once per damage event and cannot take judgment cards',async()=>{const g=setup((p,q,f)=>q.zone==='area'?[q.options[0].id]:yes(p,q,f)),[a,b]=g.players;general(b,'simayi');a.hand=[c(),c()];a.judge=[c('lightning')];await g.damage(a,b,2);assert.equal(b.hand.length,1);assert.equal(a.hand.length,1);assert.equal(a.judge.length,1);});
test('Xiahou Dun nonheart judgment allows two-card discard or one retaliation damage',async()=>{const g=setup((p,q,f)=>q.context?.selectionKind==='staucness'?(q.context.modeIds.includes('mode:discard')?[...q.context.cardIds.slice(0,2),'mode:discard']:['mode:damage']):q.zone==='cards'?q.options.slice(0,2).map(o=>o.id):yes(p,q,f)),[a,b]=g.players;general(b,'xiahoudun');g.deck=[c('shan','♣'),c('shan','♣')];a.hand=[c(),c()];await g.damage(a,b,1);assert.equal(a.hp,4);assert.equal(a.hand.length,0);await g.damage(a,b,1);assert.equal(a.hp,3);});
test('Zhang Liao takes only hidden hand cards from two characters instead of drawing',async()=>{const g=setup((p,q,f)=>q.context?.kind==='raid'?['1','2']:q.zone==='area'?[q.options[0].id]:f),[a,b,d]=g.players;general(a,'zhangliao');const x=c(),y=c('shan');b.hand=[x];d.hand=[y];b.equip.armor=c('bagua');const n=g.deck.length;assert.equal(await g.drawGeneral(a),true);assert.deepEqual(a.hand,[x,y]);assert.equal(g.deck.length,n);assert.ok(b.equip.armor);});
test('Guo Jia distributes two private deck cards per damage point, including to self',async()=>{const g=setup((p,q,f)=>q.context?.kind==='gift-recipient'?['1']:yes(p,q,f)),[a,b]=g.players;general(b,'guojia');const cards=[c(),c('shan'),c('tao'),c('duel')];g.deck=[...cards];await g.damage(a,b,2);assert.deepEqual(b.hand,cards);assert.equal(g.reserved.length,0);assert.equal(g.table.length,0);const publicState=JSON.stringify(g.view(a.id));for(const card of cards)assert.ok(!publicState.includes(card.id));});
test('Zhen Ji keeps black judgments, stops on red, and converts black hand cards to Dodge',async()=>{const g=setup(yes),[a]=g.players;general(a,'zhenji');const x=c(),y=c('duel','♣'),z=c('shan','♥');g.deck=[x,y,z];await g.prepareGeneral(a);assert.deepEqual(a.hand,[x,y]);assert.deepEqual(g.discard,[z]);assert.equal(g.virtual(a,'shan').length,2);});
test('Liu Bei cumulative gifts heal once after two cards and never publish card identities',async()=>{const g=setup((p,q,f)=>q.context?.actionKind==='rende'?[q.context.cardIds[0],'1']:f),[a,b]=g.players;general(a,'liubei');a.hp=2;const cards=[c(),c('shan'),c('duel')];a.hand=[...cards];await g.skill(a,'rende');assert.equal(a.hp,2);await g.skill(a,'rende');assert.equal(a.hp,3);await g.skill(a,'rende');assert.equal(a.hp,3);assert.deepEqual(b.hand,cards);assert.equal(g.table.length,0);for(const card of cards)assert.ok(!JSON.stringify(g.view('2')).includes(card.id));});
test('Liu Bei allied Attack attributes damage to Lord and failed requests do not loop practice bots',async()=>{const g=setup((p,q,f)=>q.zone==='response'?[q.options.find(o=>o.id!=='pass')?.id||'pass']:q.title.includes('Choose a target')?['1']:f),[a,b,d]=g.players;general(a,'liubei');general(d,'guanyu');const hit=c();d.hand=[hit];await g.play(a,'play:sha:jijiang');assert.equal(b.hp,3);assert.equal(g.used.sha,1);assert.deepEqual(g.discard,[hit]);g.used.sha=0;await g.play(a,'play:sha:jijiang');assert.equal(g.used.sha,0);assert.equal(g.used.jijiangFailed,true);assert.deepEqual(g.botAnswer(a,{zone:'turn',options:g.playOptions(a)},['end']),['end']);});
test('Zhuge Liang arranges private top/bottom cards and Empty Fortress blocks new Attack/Duel targets',async()=>{const g=setup((p,q,f)=>q.zone==='stargazing'?[q.options[1].id,'bottom',q.options[3].id,q.options[2].id,q.options[0].id]:yes(p,q,f)),[a,b]=g.players;general(a,'zhugeliang');const cards=Array.from({length:6},()=>c());g.deck=[...cards];await g.prepareGeneral(a);assert.deepEqual(g.deck,[cards[1],cards[4],cards[5],cards[3],cards[2],cards[0]]);assert.equal(g.reserved.length,0);assert.equal(g.canSha(b,a),false);assert.ok(!g.candidates(b,'duel').includes(a));a.hand=[c()];assert.equal(g.canSha(b,a),true);});
test('Da Qiao diamond equipment becomes Acedia then returns to its physical type',async()=>{const g=setup((p,q,f)=>q.options.some(o=>o.id==='1')?['1']:f),[a,b]=g.players;general(a,'daqiao');const gear=c('kylin','♦');a.equip.weapon=gear;await g.play(a,`play:indulgence:guose:${gear.id}`);assert.equal(b.judge[0].kind,'indulgence');assert.equal(a.equip.weapon,undefined);await g.remove(b,b.judge[0],a.hand);assert.deepEqual(a.hand,[gear]);assert.equal(a.hand[0].kind,'kylin');});
test('Da Qiao redirects an Attack and cannot use a weapon cost to retain its lost range',async()=>{let cost;const g=setup((p,q,f)=>q.context?.selectionKind==='deflection'?[cost.id,'2']:f),[a,b,d,e]=g.players;general(b,'daqiao');cost=c('shan');b.hand=[cost];await g.sha(a,b,{cards:[],suit:'♥'});assert.equal(b.hp,3);assert.equal(d.hp,3);assert.ok(g.discard.includes(cost));b.hand=[];cost=c('kylin');b.equip.weapon=cost;general(d,'zhugeliang'); // Empty Fortress removes the nearby target; seat 3 requires range 2.
 const before=e.hp;await g.sha(a,b,{cards:[],suit:'♥'});assert.equal(e.hp,before);assert.equal(b.hp,2);assert.equal(b.equip.weapon,cost);});
test('Sun Shangxiang equipment loss draws two and Betrothment heals both for two hand cards',async()=>{const g=setup((p,q,f)=>q.context?.actionKind==='jieyin'?[...q.context.cardIds.slice(0,2),'1']:q.zone==='cards'?q.options.slice(0,2).map(o=>o.id):yes(p,q,f)),[a,b]=g.players;general(a,'sunshangxiang');a.hp=1;b.hp=2;a.equip.armor=c('bagua');await g.remove(a,a.equip.armor);assert.equal(a.hand.length,2);await g.skill(a,'jieyin');assert.equal(a.hand.length,0);assert.equal(a.hp,2);assert.equal(b.hp,3);assert.ok(!g.playOptions(a).some(o=>o.id==='skill:jieyin'));});
test('Hua Tuo First Aid can use red equipment outside his turn and Prodigal Healer is once per Play Phase',async()=>{const g=setup((p,q,f)=>q.context?.kind==='rescue'?[q.options[0].id]:q.context?.actionKind==='qingnang'?[q.context.cardIds[0],p.id]:q.zone==='cards'?[q.options[0].id]:f),[a,b]=g.players;general(b,'huatuo');const gear=c('kylin','♥');b.equip.weapon=gear;a.hp=0;await g.dying(a,null);assert.equal(a.hp,1);assert.ok(g.discard.includes(gear));g.current=b;assert.ok(!g.virtual(b,'tao').some(v=>v.id.startsWith('jijiu')));b.hp=1;b.hand=[c()];await g.skill(b,'qingnang');assert.equal(b.hp,2);assert.equal(b.hand.length,0);assert.ok(g.used.qingnang);});
test('Diao Chan forces uncounterable Duel with chosen first responder and draws at end',async()=>{const g=setup((p,q,f)=>q.context?.kind==='lust-plan'?[q.context.cardIds[0],'2','1']:q.zone==='turn'?['end']:yes(p,q,f)),[a,b,d]=g.players;general(a,'diaochan');a.hand=[c()];b.hand=[c('negate')];await g.skill(a,'lijian');assert.equal(d.hp,3);assert.equal(b.hand[0].kind,'negate');assert.ok(g.used.lijian);assert.ok(!g.generalPlayOptions(a).some(o=>o.id==='skill:lijian'));await g.takeTurn(a);assert.equal(a.hand.length,3);});
test('Legacy puts both new cards in hand before selecting and only offers those cards for distribution',async()=>{
 let original,drawn,step=0;
 const g=setup((p,q,f)=>{
  if(q.context?.kind==='legacy-distribute'){
   assert.equal(q.zone,'skill-plan');assert.ok(p.hand.includes(original));
   assert.deepEqual(q.context.cardIds,drawn.slice(step).map(c=>c.id));
   assert.ok(drawn.slice(step).every(c=>p.hand.includes(c)));
   assert.ok(!JSON.stringify(g.view('0')).includes(drawn[step].id));
   const id=drawn[step].id;return [id,step++===0?'2':'1'];
  }
  if(q.context?.kind==='gift-recipient')return [step++===0?'2':'1'];
  return yes(p,q,f);
 }),[a,b,recipient]=g.players;general(b,'guojia');original=c();drawn=[c('tao'),c('shan')];b.hand=[original];g.deck=[...drawn];
 await g.damage(a,b,1);assert.deepEqual(b.hand,[original,drawn[1]]);assert.deepEqual(recipient.hand,[drawn[0]]);assert.deepEqual(g.reserved,[]);
});
test('Legacy can give both new cards together and keep the rest without selecting recipients',async()=>{
 let calls=0;const g=setup((p,q,f)=>{if(q.context?.kind==='legacy-distribute')return calls++===0?[...q.context.cardIds,'2']:[];if(q.context?.kind==='gift-recipient')return ['2'];return yes(p,q,f);});const [a,b,t]=g.players;general(b,'guojia');const cards=[c(),c('shan'),c('tao'),c('duel')];g.deck=[...cards];await g.damage(a,b,2);assert.deepEqual(t.hand,cards.slice(0,2));assert.deepEqual(b.hand,cards.slice(2));assert.equal(g.reserved.length,0);assert.equal(calls,2);
});


test('Betrothment and Prodigal Healer can cancel at the cost step without spending or using the skill',async()=>{
 for(const [name,skill,used] of [['sunshangxiang','jieyin','jieyin'],['huatuo','qingnang','qingnang']]){
  const g=setup((p,q,f)=>q.context?.kind==='optional-cost'?[]:q.title.includes('Choose a wounded')?['1']:f),[a,b]=g.players;
  general(a,name);a.hp=1;b.hp=2;const hand=[c(),c()];a.hand=[...hand];
  await g.skill(a,skill);
  assert.deepEqual(a.hand,hand);assert.equal(a.hp,1);assert.equal(b.hp,2);assert.ok(!g.used[used]);assert.equal(g.discard.length,0);
 }
});
test('canceling Axe cost leaves a successful Dodge intact and spends no cards',async()=>{
 const g=setup((p,q,f)=>q.context?.kind==='optional-cost'?[]:q.zone==='response'?[q.options.find(o=>o.id!=='pass').id]:yes(p,q,f)),[a,b]=g.players;
 a.equip.weapon=c('axe');a.hand=[c(),c()];const hand=[...a.hand],dodge=c('shan');b.hand=[dodge];
 await g.sha(a,b,{id:'virtual',kind:'sha',cards:[],suit:'♠'});
 assert.equal(b.hp,b.maxHp);assert.deepEqual(a.hand,hand);assert.ok(!g.discard.some(x=>hand.includes(x)));
});
test('Assault empty selection declines replacement draw and keeps other hands unchanged',async()=>{
 const g=setup((p,q,f)=>q.context?.kind==='raid'?[]:f),[a,b]=g.players;general(a,'zhangliao');b.hand=[c()];
 const hand=[...b.hand];assert.equal(await g.drawGeneral(a),false);assert.deepEqual(b.hand,hand);assert.equal(a.hand.length,0);
});

test('Liu Bei bot cannot repeatedly request an allied Attack after everyone declines',async()=>{
 let requests=0;
 const g=setup((p,q,f)=>{if(q.zone==='response'){requests++;return ['pass'];}return q.title.includes('Choose a target')?['1']:f;}),[lord,,ally]=g.players;
 general(lord,'liubei');general(ally,'guanyu');lord.bot=true;lord.botMode='llm';ally.hand=[c()];lord.hand=[c()];
 assert.ok(g.playOptions(lord).some(o=>o.id==='play:sha:jijiang'));
 await g.play(lord,'play:sha:jijiang');assert.equal(requests,1);assert.equal(g.used.sha,0);
 assert.ok(!g.playOptions(lord).some(o=>o.id==='play:sha:jijiang'));
 assert.ok(g.playOptions(lord).some(o=>o.cardIds?.includes(lord.hand[0].id)));
 await g.play(lord,'play:sha:jijiang');assert.equal(requests,1,'stale direct action cannot reopen allied requests');
 assert.ok(g.virtual(lord,'sha',{response:true}).some(v=>v.id==='jijiang'),'independent Attack responses still work');
 lord.bot=false;assert.ok(g.playOptions(lord).some(o=>o.id==='play:sha:jijiang'),'human rules unchanged');
 lord.bot=true;g.used={sha:0};assert.ok(g.playOptions(lord).some(o=>o.id==='play:sha:jijiang'),'fresh turn resets guard');
});
