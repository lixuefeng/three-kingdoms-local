import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,Finished} from '../engine.mjs';
import {GENERALS,EXPANSION_GENERALS,ALL_GENERALS,makeDeck} from '../cards.mjs';
import {validSkillPlan,optionalDecisionLabel} from '../public/skill-plan.mjs';
let sequence=0;
const c=(kind='sha',suit='♠',rank=7)=>({id:'exp-'+sequence++,kind,suit,rank});
function general(p,id){p.general=ALL_GENERALS.find(g=>g.id===id);p.maxHp=p.hp=p.general.hp;}
function setup(ask){const g=new Game(Array.from({length:4},(_,i)=>({id:String(i),name:'P'+i})),{ask:ask||((p,q,f)=>f),expandedGenerals:true,seedDeck:makeDeck({maneuver:true})});g.players.forEach((p,i)=>{general(p,'zhangfei');p.role=['lord','loyal','rebel','spy'][i];});g.current=g.players[0];g.phase='Play';return g;}
const activate=(p,q,f)=>q.options.some(o=>o.id==='yes')?['yes']:f;

test('selected expansion roster has 19 distinct classic generals and excludes rejected generals',()=>{
 assert.equal(GENERALS.length,25);assert.equal(EXPANSION_GENERALS.length,19);assert.equal(ALL_GENERALS.length,44);assert.equal(new Set(ALL_GENERALS.map(g=>g.id)).size,44);
 for(const id of ['caopi','jiaxu'])assert.ok(!ALL_GENERALS.some(g=>g.id===id));
 assert.ok(ALL_GENERALS.some(g=>g.id==='zhangjiao'));
 const g=new Game([]);assert.equal(g.generalPool.length,25);assert.equal(new Game([],{expandedGenerals:true}).generalPool.length,44);
});
test('disabled expansion rejects test presets, enabled pool offers them without duplicates',async()=>{
 const players=Array.from({length:4},(_,i)=>({id:String(i),testGeneral:['zhangjiao','pangtong','zhoutai','taishici'][i]}));
 const blocked=new Game(players,{testing:true});blocked.players.forEach((p,i)=>p.role=i?'rebel':'lord');await assert.rejects(()=>blocked.selectGenerals(),/valid/);
 const g=new Game(players,{testing:true,expandedGenerals:true});g.players.forEach((p,i)=>p.role=i?'rebel':'lord');await g.selectGenerals();assert.deepEqual(g.players.map(p=>p.general.id),players.map(p=>p.testGeneral));assert.equal(g.players[0].hp,4);
});
test('Fiery Bow prevents Dodge only when its classic condition holds in the owner Play Phase',async()=>{
 const g=setup(activate),[a,b]=g.players;general(a,'huangzhong');b.hand=[c('shan')];await g.sha(a,b,{kind:'sha',cards:[],suit:'♥'});assert.equal(b.hp,3);assert.equal(b.hand.length,1);
 b.hp=4;b.hand=[c('shan'),c(),c()];await g.sha(a,b,{kind:'sha',cards:[],suit:'♥'});assert.equal(b.hp,3); // fallback passes; no Fiery Bow trigger on three cards at HP4/range1.
 const triggers=g.effects.filter(e=>e.label==='Fiery Bow');assert.equal(triggers.length,1);
});
test('Rebellious Spine uses distance immediately before HP loss, including a removed +1 horse',async()=>{
 const g=setup((p,q,f)=>q.title.startsWith('Kirin Bow')?[q.options[0].id]:f),[a,b,,d]=g.players;general(a,'weiyan');a.hp=1;
 await g.damage(a,b,2);assert.equal(a.hp,3);a.hp=1;await g.damage(a,g.players[2],1);assert.equal(a.hp,1);
 b.equip.plus=c('plusHorse');a.equip.weapon=c('kylin');await g.damage(a,b,1,{kind:'sha'});assert.equal(a.hp,2);assert.ok(!b.equip.plus);
});
test('Cut Off Rations converts black basic/equipment cards, respects effective range 2 and preserves physical cards',async()=>{
 const g=setup((p,q,f)=>q.title.includes('Choose a target')?['2']:f),[a]=g.players;general(a,'xuhuang');const x=c('shan'),bad=c('duel'),red=c('sha','♥');a.hand=[x,bad,red];
 assert.equal(g.virtual(a,'supply').length,1);assert.ok(g.candidates(a,'supply').includes(g.players[2]));await g.play(a,`play:supply:convert:supply:${x.id}`);
 const delayed=g.players[2].judge[0];assert.equal(delayed.kind,'supply');assert.equal(delayed.original,x);assert.equal(g.physical(delayed),x);
});
test('Pang De has reduced distance and discards a hand/equipment card after Dodge',async()=>{
 const g=setup((p,q,f)=>q.zone==='response'?[q.options[0].id]:q.zone==='area'?[q.options[0].id]:activate(p,q,f)),[a,b]=g.players;general(a,'pangde');b.hand=[c('shan'),c('tao')];
 assert.equal(g.distance(a,g.players[2]),1);await g.sha(a,b,{kind:'sha',cards:[],suit:'♥'});assert.equal(b.hp,4);assert.equal(b.hand.length,0);assert.ok(g.effects.some(e=>e.label==='Horse Archery'));
});
test('Forceful Assault can cancel its cost and does not count Empty Fortress as damage immunity',async()=>{
 const g=setup(),[a,b]=g.players;general(a,'dianwei');general(b,'zhugeliang');assert.ok(g.generalPlayOptions(a).some(o=>o.id==='skill:qiangxi'));
 await g.skill(a,'qiangxi');assert.equal(a.hp,4);assert.ok(!g.used.qiangxi);
});
test('Forceful Assault weapon cost uses attack range after losing that weapon',async()=>{
 let weapon;const g=setup((p,q,f)=>q.context?.actionKind==='qiangxi'?[weapon.id,'1','mode:weapon']:f),[a,b]=g.players;general(a,'dianwei');weapon=c('kylin');a.equip.weapon=weapon;
 await g.skill(a,'qiangxi');assert.equal(b.hp,3);assert.equal(a.hp,4);assert.ok(g.discard.includes(weapon));assert.ok(g.used.qiangxi);
});
test('Heroic Spirit supports draw-X/discard-one and draw-one/discard-X, including equipment costs',async()=>{
 for(const mode of ['assist','disrupt']){
  const g=setup((p,q,f)=>q.context?.selectionKind==='yinghun'?['1','mode:'+mode]:q.zone==='cards'?q.options.slice(0,q.min).map(o=>o.id):f),[a,b]=g.players;
  general(a,'sunjian');a.hp=2;b.hand=[c(),c()];await g.prepareGeneral(a);assert.equal(b.hand.length,mode==='assist'?3:1);
 }
});
test('Wolong has virtual armor only when armorless and converts only red/black hand cards',async()=>{
 const g=setup((p,q,f)=>q.zone==='response'&&q.options.some(o=>o.id==='bagua')?['bagua']:f),[a]=g.players;general(a,'wolong');a.hand=[c('sha','♥'),c('shan','♠')];a.equip.weapon=c('kylin');
 assert.equal(g.virtual(a,'fireAttack').length,1);assert.equal(g.virtual(a,'negate').length,1);assert.equal(g.hasBagua(a),true);g.deck=[c('sha','♥')];assert.ok(await g.response(a,'shan','Dodge'));
 a.equip.armor=c('renwang');assert.equal(g.hasBagua(a),false);
});
test('Wolong converted Negation resolves and spends its physical cost in adapter windows',async()=>{
 const g=setup((p,q,f)=>q.context?.kind==='negation'?[q.options[0].id]:f),[a,b]=g.players;general(a,'wolong');const x=c('shan');a.hand=[x];assert.equal(await g.negate(b,'Duel'),true);assert.ok(g.discard.includes(x));assert.equal(a.hand.length,0);
});
test('Wolong converted Negation works in real shared windows without exposing other private cards',async()=>{
 const g=setup(),[a,b]=g.players;general(a,'wolong');const x=c('shan');a.hand=[x];g.askAdapter=null;g.responseWindowMs=1000;
 const pending=g.negate(b,'Duel'),q=g.prompts.get(a.id);assert.ok(q.options.some(o=>o.id===`convert:negate:${x.id}`));assert.equal(g.view(b.id).players.find(p=>p.id===a.id).hand,undefined);
 g.answer(a.id,q.id,[`convert:negate:${x.id}`]);assert.equal(await pending,true);assert.ok(g.discard.includes(x));
});
test('Pindian hides both selections until both commit; both cards reveal together and ties do not win',async()=>{
 const g=setup(),[a,b]=g.players;g.askAdapter=null;g.seconds=0;const x=c('sha','♥',9),y=c('shan','♣',9);a.hand=[x];b.hand=[y];
 const pending=g.pindian(a,b,'Justice of Heaven');const qa=g.prompts.get(a.id),qb=g.prompts.get(b.id);g.answer(a.id,qa.id,[x.id]);await Promise.resolve();
 const v=g.view(g.players[2].id);assert.equal(v.pindian.result,null);assert.ok(!JSON.stringify(v).includes(x.id));assert.ok(!JSON.stringify(v).includes(y.id));assert.equal(g.table.length,0);
 g.answer(b.id,qb.id,[y.id]);assert.equal(await pending,false);assert.equal(g.pindianState.result.winnerId,null);assert.ok(g.discard.includes(x)&&g.discard.includes(y));
});
test('Justice of Heaven win grants range, extra use and target; loss/tie forbids use but not responding',async()=>{
 for(const won of [true,false]){
  const g=setup((p,q,f)=>q.context?.actionKind==='tianyi'?[q.context.cardIds[0],'1']:q.context?.kind==='pindian'?[q.options[0].id]:f),[a,b]=g.players;general(a,'taishici');a.hand=[c('shan','♥',won?13:1),c('sha')];b.hand=[c('sha','♣',7)];
  await g.skill(a,'tianyi');assert.equal(g.used.tianyiWin,won);assert.equal(g.used.tianyiLost,!won);
  if(won){g.used.sha=1;const o=g.playOptions(a).find(o=>o.kind==='sha');assert.ok(o);assert.equal(o.targetMax,2);assert.ok(o.targetIds.includes('2'));g.used.sha=2;assert.ok(!g.playOptions(a).some(o=>o.kind==='sha'));}
  else{assert.ok(!g.playOptions(a).some(o=>o.kind==='sha'));assert.ok(g.virtual(a,'sha',{response:true}).length);}
 }
});
test('Pang Tong converts/recasts Clubs and Nirvana is a once-per-game dying intervention',async()=>{
 const g=setup(activate),[a]=g.players;general(a,'pangtong');const club=c('shan','♣');a.hand=[club];assert.ok(g.playOptions(a).some(o=>o.id===`recast:chain:${club.id}`));await g.recastChains(a,club.id);assert.ok(g.discard.includes(club));
 a.hp=1;a.chained=true;const equip=c('kylin'),delay=c('indulgence');a.equip.weapon=equip;a.judge=[delay];await g.damage(g.players[1],a,2);
 assert.equal(a.hp,3);assert.equal(a.hand.length,3);assert.equal(a.chained,false);assert.ok(a.nirvanaUsed);assert.equal(a.judge.length,0);assert.ok(g.discard.includes(equip)&&g.discard.includes(delay));
});
test('Culprit and Giant Elephant provide immunity, correct damage attribution and post-resolution ownership',async()=>{
 const g=setup((p,q,f)=>q.title.includes('Choose a target')?['1']:f),[a,b,m,z]=g.players;general(m,'menghuo');general(z,'zhurong');const spell=c('barbarian');a.hand=[spell];
 await g.play(a,`play:barbarian:${spell.id}`);assert.equal(m.hp,4);assert.equal(z.hp,4);assert.equal(b.hp,3);assert.equal(g.stats[m.id].damage,1);assert.equal(g.stats[a.id].damage,0);assert.ok(z.hand.includes(spell));assert.ok(!g.discard.includes(spell));
});
test('Giant Elephant cannot duplicate a Barbarian already obtained by Cao Cao',async()=>{
 const g=setup(activate),[a,b,,z]=g.players;general(b,'caocao');general(z,'zhurong');const spell=c('barbarian');a.hand=[spell];await g.play(a,`play:barbarian:${spell.id}`);assert.ok(b.hand.includes(spell));assert.ok(!z.hand.includes(spell));
});
test('Arise replaces drawing with public lost-HP reveals, heals Hearts and gains non-Hearts',async()=>{
 const g=setup(activate),[p]=g.players;general(p,'menghuo');p.hp=2;const heart=c('sha','♥'),black=c('shan');g.deck=[heart,black];assert.equal(await g.drawGeneral(p),true);assert.equal(p.hp,3);assert.deepEqual(p.hand,[black]);assert.ok(g.discard.includes(heart));assert.ok(g.view('1').recentCards.some(r=>r.card.id===heart.id));
});
test('Fiery Blade uses simultaneous Pindian after Attack damage, including outside the owner turn',async()=>{
 const g=setup((p,q,f)=>q.context?.selectionKind==='lieren'?[q.context.cardIds[0]]:q.context?.kind==='pindian'?[q.options[0].id]:q.zone==='area'?[q.options[0].id]:activate(p,q,f)),[a,b]=g.players;general(a,'zhurong');g.current=g.players[2];a.hand=[c('sha','♥',13)];b.hand=[c('sha','♣',1),c('tao')];
 await g.damage(a,b,1,{kind:'sha'});assert.ok(a.hand.some(c=>c.kind==='tao'));assert.equal(b.hand.length,0);
});
test('Rosy Cheeks changes effective suits and judgments without mutating physical cards',async()=>{
 const g=setup(),[p]=g.players;general(p,'xiaoqiao');const x=c('sha','♠',5);p.hand=[x];assert.equal(g.view(p.id).players[0].hand[0].suit,'♥');assert.equal(x.suit,'♠');assert.equal(g.virtual(p,'sha')[0].suit,'♥');
 g.deck=[x];p.hand=[];const result=await g.judgment(p,'Lightning');assert.equal(result.suit,'♥');assert.equal(x.suit,'♠');assert.equal(g.discard[0],x);assert.equal(g.judgments[0].cards[0].card.suit,'♥');
});
test('Heavenly Scent transfers damage and source attribution, applies recipient armor, then draws lost HP',async()=>{
 const g=setup((p,q,f)=>q.context?.kind==='tianxiang'?[q.context.cardIds[0],'2']:f),[source,xq,t]=g.players;general(xq,'xiaoqiao');const cost=c('shan','♠');xq.hand=[cost];t.equip.armor=c('rattan');
 await g.damage(source,xq,1,{nature:'fire'});assert.equal(xq.hp,3);assert.equal(t.hp,2);assert.equal(t.hand.length,2);assert.equal(g.stats[source.id].damage,2);assert.equal(g.stats[xq.id].damageTaken,0);assert.ok(g.discard.includes(cost));
});
test('Heavenly Scent cancellation spends nothing and its combined prompt retains a proper cancel button',async()=>{
 const g=setup(),[a,xq]=g.players;general(xq,'xiaoqiao');const cost=c('shan','♥');xq.hand=[cost];await g.damage(a,xq,1);assert.equal(xq.hp,2);assert.deepEqual(xq.hand,[cost]);assert.equal(optionalDecisionLabel({min:0,zone:'skill-plan',context:{kind:'tianxiang',skillName:'Heavenly Scent'}},true),'Cancel Heavenly Scent');
});
test('Old Wind Undying survives distinct wounds at negative HP and recovery removes chosen wounds',async()=>{
 const g=setup((p,q,f)=>q.context?.kind==='wound-remove'?[q.options.at(-1).id]:activate(p,q,f)),[a,b]=g.players;general(b,'zhoutai');b.hp=1;const x=c('sha','♣',3),y=c('shan','♦',5);g.deck=[x,y];await g.damage(a,b,2);assert.equal(b.hp,-1);assert.equal(b.alive,true);assert.deepEqual(b.wounds,[x,y]);assert.ok(g.survivesDying(b));assert.equal(g.view(a.id).players[1].wounds.length,2);
 await g.recover(b);assert.equal(b.hp,0);assert.deepEqual(b.wounds,[x]);await g.recover(b);assert.equal(b.hp,1);assert.deepEqual(b.wounds,[]);assert.ok(g.discard.includes(x)&&g.discard.includes(y));
});
test('duplicate wounds require rescue; removing a duplicate can save Zhou Tai without reaching positive HP',async()=>{
 let saved=false;const g=setup((p,q,f)=>q.context?.kind==='rescue'&&!saved?(saved=true,[q.options[0].id]):q.context?.kind==='wound-remove'?[q.options[0].id]:activate(p,q,f)),[a,b]=g.players;general(b,'zhoutai');b.hp=1;a.hand=[c('tao')];g.deck=[c('sha','♣',7),c('shan','♦',7)];await g.damage(a,b,2);assert.equal(b.alive,true);assert.equal(b.hp,0);assert.equal(b.wounds.length,1);assert.ok(g.survivesDying(b));
});
test('unrescued duplicate wounds eliminate Zhou Tai and discard his entire wound pile',async()=>{
 const g=setup(activate),[a,b]=g.players;general(b,'zhoutai');b.hp=1;const pool=[c('sha','♣',7),c('shan','♦',7)];g.deck=[...pool];await g.damage(a,b,2);assert.equal(b.alive,false);assert.equal(b.wounds.length,0);assert.ok(pool.every(c=>g.discard.includes(c)));
});
test('Devilish Arts may spend equipped black cards and obtains the old physical judgment',async()=>{
 let black;const g=setup((p,q,f)=>q.context?.kind==='judgment-replace'?[black.id]:f),[a,z]=g.players;general(z,'zhangjiao');black=c('kylin','♠');const old=c('sha','♥');z.equip.weapon=black;g.deck=[old];assert.equal(await g.judgment(a,'Lightning'),black);assert.ok(z.hand.includes(old));assert.ok(g.discard.includes(black));assert.ok(!z.equip.weapon);
});
test('Thunder Strike triggers for a physical Dodge, with original Spade/2-thunder rules',async()=>{
 const g=setup((p,q,f)=>q.zone==='response'?[q.options[0].id]:q.title.includes('Choose a character to judge')?['2']:f),[a,z,t]=g.players;general(z,'zhangjiao');z.hand=[c('shan')];g.deck=[c('sha','♠',1)];assert.ok(await g.response(z,'shan','Dodge'));assert.equal(t.hp,2);assert.equal(g.stats[z.id].damage,2);
});
test('Yellow Heaven is offered to other Qun generals, transfers the chosen card and is once per giver turn',async()=>{
 const g=setup((p,q,f)=>q.title.startsWith('Yellow Heaven')?[q.options[0].id]:f),[lord,giver]=g.players;general(lord,'zhangjiao');general(giver,'pangde');g.current=giver;const dodge=c('shan');giver.hand=[dodge];assert.ok(g.generalPlayOptions(giver).some(o=>o.id==='skill:huangtian'));await g.skill(giver,'huangtian');assert.ok(lord.hand.includes(dodge));assert.ok(!g.generalPlayOptions(giver).some(o=>o.id==='skill:huangtian'));
});

test('expanded-roster complete matches keep answers legal, progress and conserve cards including wound piles',async()=>{
 const groups=[['zhangjiao','pangtong','zhoutai','taishici','xiaoqiao','menghuo','zhurong','sunjian'],['dianwei','xuhuang','huangzhong','weiyan','pangde','wolong','zhoutai','xiaoqiao']];
 for(const maneuver of [false,true])for(const roster of groups){
  let turns=0;const g=new Game(roster.map((id,i)=>({id:String(i),name:'Bot'+i,testGeneral:id})),{expandedGenerals:true,testing:true,maneuver,ask:(p,q,f)=>{
   assert.ok(++turns<20000,`match must progress: ${roster}`);const ids=g.botAnswer(p,q,f);
   assert.ok(ids.length>=q.min&&ids.length<=q.max,`${q.title}: ${JSON.stringify(ids)}`);assert.equal(new Set(ids).size,ids.length);assert.ok(ids.every(id=>q.options.some(o=>o.id===id)),q.title);
   if(q.zone==='skill-plan')assert.ok(validSkillPlan(q.context,ids),q.title);if(q.context?.kind==='optional-cost')assert.ok(!ids.length||ids.length===q.context.cardCount);return ids;
  }});await g.start();assert.ok(g.winner);const all=[...g.deck,...g.discard,...g.table,...g.reserved,...g.players.flatMap(p=>[...g.allCards(p),...p.wounds])];assert.equal(all.length,maneuver?160:108);assert.equal(new Set(all.map(c=>c.id)).size,all.length);
 }
});

test('Cut Off Rations cannot rely on the -1 horse spent as its conversion cost',()=>{
 const g=setup(),p=g.players[0],t=g.players[2];general(p,'xuhuang');const horse=c('minusHorse');p.equip.minus=horse;t.equip.plus=c('plusHorse');assert.equal(g.distance(p,t),2);assert.equal(g.supplyWithCost(p,t,[horse]),false);const v=g.virtual(p,'supply').find(v=>v.cards.includes(horse));assert.ok(v);assert.ok(!g.targetSpec(p,'supply',v).targetIds.includes(t.id));
});
test('tactical bot commits Forceful Assault against armor instead of repeatedly canceling it',async()=>{
 const g=setup(),p=g.players[0];general(p,'dianwei');p.hp=3;for(const t of g.players.slice(1))t.equip.armor=c('rattan');g.askAdapter=(p,q,f)=>g.botAnswer(p,q,f);
 assert.equal(g.botAnswer(p,{zone:'turn',options:g.playOptions(p)},['end'])[0],'skill:qiangxi');await g.skill(p,'qiangxi');assert.equal(g.used.qiangxi,true);assert.equal(p.hp,2);assert.equal(g.stats[p.id].damage,1);
});
