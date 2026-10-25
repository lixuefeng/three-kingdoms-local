import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../engine.mjs';
import {ALL_GENERALS,makeDeck} from '../cards.mjs';
import {validSkillPlan} from '../public/skill-plan.mjs';
let seq=0;const c=(kind='sha',suit='♠',rank=7)=>({id:'extra-'+seq++,kind,suit,rank});
function gen(p,id){p.general=ALL_GENERALS.find(g=>g.id===id);p.hp=p.maxHp=p.general.hp;}
function setup(ask){const g=new Game(Array.from({length:4},(_,i)=>({id:String(i),name:'P'+i})),{expandedGenerals:true,ask:ask||((p,q,f)=>f),seedDeck:makeDeck({maneuver:true})});g.players.forEach((p,i)=>{gen(p,'zhangfei');p.role=['lord','loyal','rebel','spy'][i];});g.current=g.players[0];g.phase='Play';return g;}
const yes=(p,q,f)=>q.options.some(o=>o.id==='yes')?['yes']:f;
test('Heroic Duo obtains its public judgment and converts only opposite-color hand cards for that turn',async()=>{
 const g=setup(yes),[p]=g.players;gen(p,'yanliangwenchou');const j=c('shan','♥'),black=c('sha','♠'),red=c('sha','♦');g.deck=[j];p.hand=[black,red];assert.ok(await g.drawGeneral(p));assert.ok(p.hand.includes(j));assert.equal(g.used.shuangxiongColor,true);assert.deepEqual(g.virtual(p,'duel').map(v=>v.cards[0].id),[black.id]);g.used={};assert.equal(g.virtual(p,'duel').length,0);
});
test('Raving Slash requires two hand cards with the same suit; Bloodline counts other living Qun only',()=>{
 const g=setup(),[p,a,b,d]=g.players;gen(p,'yuanshao');gen(a,'pangde');gen(b,'dongzhuo');gen(d,'xiaoqiao');p.hand=[c('sha','♠'),c('shan','♠'),c('tao','♥')];assert.equal(g.virtual(p,'arrows').length,1);assert.equal(g.virtual(p,'arrows')[0].cards.length,2);assert.equal(g.handLimit(p),8);b.alive=false;assert.equal(g.handLimit(p),6);p.role='rebel';assert.equal(g.handLimit(p),4);
});
test('God Speed first mode skips judgments and drawing, retains delayed spells and ignores Attack distance',async()=>{
 const g=setup((p,q,f)=>q.title.startsWith('God Speed: Skip Judgment')?['2']:f),[a,,b]=g.players;gen(a,'xiahouyuan');const delay=c('indulgence');a.judge=[delay];const deck=g.deck.length;await g.takeTurn(a);assert.equal(b.hp,3);assert.equal(a.judge[0],delay);assert.equal(g.deck.length,deck);assert.equal(g.used.sha,0);
});
test('God Speed second mode consumes one Equipment and skips Play; cancellation consumes nothing',async()=>{
 for(const active of [false,true]){
  let gear;const g=setup((p,q,f)=>q.context?.kind==='shensu'&&active?[gear.id,'2']:f),[a,,b]=g.players;gen(a,'xiahouyuan');gear=c('crossbow');a.hand=[gear];assert.equal(await g.swiftSecond(a),active);assert.equal(b.hp,active?3:4);assert.equal(a.hand.includes(gear),!active);
 }
});
test('Drunkard converts a Spade hand card to Wine and classic Breakdown has no Wine exemption',async()=>{
 const g=setup((p,q,f)=>q.context?.kind==='collapse'?['maxhp']:f),[p]=g.players;gen(p,'dongzhuo');const card=c('shan');p.hand=[card];assert.ok(g.virtual(p,'wine').some(v=>v.id===`jiuchi:${card.id}`));await g.play(p,`play:wine:jiuchi:${card.id}`);assert.equal(p.wineBoost,1);await g.endGeneral(p);assert.equal(p.maxHp,7);assert.equal(p.hp,7);
});
test('Lust requires two Dodges both when Dong Zhuo attacks women and when women attack him',async()=>{
 for(const reverse of [false,true]){
  const g=setup((p,q,f)=>q.zone==='response'&&q.options.some(o=>o.id!=='pass')?[q.options.find(o=>o.id!=='pass').id]:f),[dong,woman]=g.players;gen(dong,'dongzhuo');gen(woman,'xiaoqiao');const source=reverse?woman:dong,target=reverse?dong:woman;target.hand=[c('shan')];const hp=target.hp;await g.sha(source,target,{kind:'sha',cards:[],suit:'♥'});assert.equal(target.hp,hp-1);assert.ok(g.effects.some(e=>e.label==='Lust'&&e.sourceId===dong.id));
 }
});
test('Tyrant offers a Qun damage source a judgment that heals Lord Dong Zhuo on Spade',async()=>{
 const g=setup(yes),[lord,source,target]=g.players;gen(lord,'dongzhuo');gen(source,'pangde');lord.hp=4;g.deck=[c('sha','♠',1)];await g.damage(source,target,1);assert.equal(lord.hp,5);
});
function bluffFixture(kind,suit,challenge){const g=setup((p,q,f)=>q.context?.kind==='guhuo-challenge'&&p.id==='1'?[challenge?'challenge':'pass']:f),[p]=g.players;gen(p,'yuji');const physical=c(kind,suit);p.hand=[physical];return {g,p,physical};}
test('unchallenged Bewilder resolves even a false claim, spending the real card only once',async()=>{
 const {g,p,physical}=bluffFixture('shan','♣',false);const v=g.virtual(p,'draw2').find(v=>v.bluff),result=await g.commitVirtual(p,v);assert.equal(result.kind,'draw2');assert.equal(g.bluffState.truth,false);assert.equal(g.bluffState.success,true);assert.ok(g.table.includes(physical));g.finishCards(result.cards);assert.equal(g.discard.filter(c=>c===physical).length,1);
});
test('challenged true Heart resolves; true non-Heart fails; both cost challengers HP without damage triggers',async()=>{
 for(const suit of ['♥','♣']){const {g,p,physical}=bluffFixture('sha',suit,true);const challenger=g.players[1],result=await g.commitVirtual(p,g.virtual(p,'sha').find(v=>v.bluff&&!v.claimKind));assert.equal(!!result,suit==='♥');assert.equal(challenger.hp,3);assert.equal(g.stats[challenger.id].damageTaken,0);assert.equal(g.bluffState.truth,true);if(!result)assert.ok(g.discard.includes(physical));}
});
test('challenged false Bewilder fails, draws for the challenger and does not consume an Attack use',async()=>{
 const {g,p,physical}=bluffFixture('shan','♥',true);const before=g.players[1].hand.length;const result=await g.commitVirtual(p,g.virtual(p,'sha').find(v=>v.bluff&&!v.claimKind));assert.equal(result,null);assert.equal(g.players[1].hand.length,before+1);assert.ok(g.discard.includes(physical));assert.equal(g.used.sha,undefined);
});
test('Bewilder does not offer delayed spells or equipment and supports distinct elemental Attack claims',()=>{
 const {g,p}=bluffFixture('sha','♥',false);assert.equal(g.virtual(p,'supply').filter(v=>v.bluff).length,0);assert.equal(g.virtual(p,'crossbow').filter(v=>v.bluff).length,0);assert.ok(g.virtual(p,'sha').some(v=>v.claimKind==='fireSha'&&v.nature==='fire'));
});
test('Bewilder keeps the physical card hidden throughout challenge decisions',async()=>{
 const {g,p,physical}=bluffFixture('shan','♠',false);g.askAdapter=null;g.pause=async()=>{};g.seconds=0;
 const pending=g.commitVirtual(p,g.virtual(p,'draw2').find(v=>v.bluff));
 for(const opponent of g.players.slice(1)){
  const q=g.prompts.get(opponent.id);assert.ok(q);const view=g.view(opponent.id);assert.equal(view.bluff.revealed,false);assert.ok(!JSON.stringify(view).includes(physical.id));g.answer(opponent.id,q.id,['pass']);await new Promise(r=>setImmediate(r));
 }
 const result=await pending;assert.ok(result);assert.equal(g.bluffState.actual.id,physical.id);
});
test('five newly added generals finish legal full matches with cards conserved, including old Wind skills',async()=>{
 for(const maneuver of [false,true]){
  let asks=0;const roster=['yuji','dongzhuo','xiahouyuan','yanliangwenchou','yuanshao','zhoutai'];const g=new Game(roster.map((x,i)=>({id:String(i),name:'B'+i,testGeneral:x})),{expandedGenerals:true,testing:true,maneuver,ask:(p,q,f)=>{
   assert.ok(++asks<30000,'must progress');const ids=g.botAnswer(p,q,f);assert.ok(ids.length>=q.min&&ids.length<=q.max,`${q.title}: ${ids}`);assert.ok(ids.every(id=>q.options.some(o=>o.id===id)),q.title);if(q.zone==='skill-plan')assert.ok(validSkillPlan(q.context,ids));return ids;
  }});await g.start();assert.ok(g.winner);const all=[...g.deck,...g.discard,...g.table,...g.reserved,...g.players.flatMap(p=>[...g.allCards(p),...p.wounds])];assert.equal(all.length,maneuver?160:108);assert.equal(new Set(all.map(c=>c.id)).size,all.length);
 }
});

test('bans are removed before offering generals and rejected if the pool cannot supply choices',async()=>{
 const banned=['yuji','dongzhuo','guanyu'];const g=new Game(Array.from({length:4},(_,i)=>({id:String(i)})),{expandedGenerals:true,bannedGenerals:banned,ask:(p,q,f)=>{assert.ok(q.options.every(o=>!banned.includes(o.id)));return f;}});g.players.forEach((p,i)=>p.role=i?'rebel':'lord');await g.selectGenerals();assert.ok(g.players.every(p=>!banned.includes(p.general.id)));
 const bad=new Game(g.players,{bannedGenerals:ALL_GENERALS.map(g=>g.id)});await assert.rejects(()=>bad.selectGenerals(),/Too many banned/);
});
test('Nirvana finishes at 3 HP even when a Lord loses Silver Lion during its discard',async()=>{
 const g=setup(yes),[p]=g.players;gen(p,'pangtong');p.maxHp=4;p.hp=0;p.equip.armor=c('silverLion');await g.dying(p,null);assert.equal(p.hp,3);assert.ok(p.nirvanaUsed);
});
test('Heavenly Scent draw uses zero effective HP for an Undying recipient',async()=>{
 let cost;const g=setup((p,q,f)=>q.context?.kind==='tianxiang'?[cost.id,'2']:yes(p,q,f)),[source,xq,zhou]=g.players;gen(xq,'xiaoqiao');gen(zhou,'zhoutai');cost=c('shan','♥');xq.hand=[cost];zhou.hp=1;g.deck=[c('sha','♣',3),c('sha','♦',5),...makeDeck()];await g.damage(source,xq,2);assert.equal(zhou.hp,-1);assert.equal(zhou.hand.length,4);
});
