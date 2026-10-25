import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../engine.mjs';
import {GENERALS,ALL_GENERALS} from '../cards.mjs';
import {validSkillPlan} from '../public/skill-plan.mjs';
let seq=0;
const c=(kind,suit='♠')=>({id:'bot-test-'+seq++,kind,suit,rank:7});
function setup(){const g=new Game(['lord','loyal','rebel','spy'].map((role,i)=>({id:String(i),name:'Player'+i})),{seconds:0});g.players.forEach((p,i)=>{p.role=['lord','loyal','rebel','spy'][i];p.general=GENERALS.find(x=>x.id==='zhangfei');});g.current=g.players[2];g.phase='Play';return g;}
const play=(g,p)=>g.botAnswer(p,{zone:'turn',options:g.playOptions(p)},['end']);
test('bot heals first, then plans an Attack against the Lord as a rebel',()=>{
 const g=setup(),p=g.players[2];p.equip.weapon=c('kylin');p.hp=2;p.hand=[c('sha'),c('tao')];
 assert.match(play(g,p)[0],/^play:tao:/);p.hp=4;p.hand=p.hand.filter(c=>c.kind!=='tao');
 assert.match(play(g,p)[0],/^play:sha:/);assert.deepEqual(g.plannedPlays.get(p.id).targetIds,['0']);
});
test('bot choices cannot change with hidden role swaps, opponent card identities or deck order',()=>{
 const g=setup(),p=g.players[1];g.current=p;p.hand=[c('sha')];p.equip.weapon=c('kylin');
 g.players[2].hand=[c('shan')];g.players[3].hand=[c('tao')];const first=play(g,p),targets=[...g.plannedPlays.get(p.id).targetIds];
 g.players[2].role='spy';g.players[3].role='rebel';g.players[2].hand=[c('negate')];g.players[3].hand=[c('sha')];g.deck.reverse();
 assert.deepEqual(play(g,p),first);assert.deepEqual(g.plannedPlays.get(p.id).targetIds,targets);
});
test('bot discards redundant Attack before Peach or its only Dodge',()=>{
 const g=setup(),p=g.players[2];p.general=GENERALS.find(x=>x.id==='caocao');p.hand=[c('tao'),c('shan'),c('sha'),c('sha')];
 const q={zone:'cards',title:'Discard Phase',min:1,max:1,options:p.hand.map(x=>({id:x.id}))};assert.deepEqual(g.botAnswer(p,q,[]),[p.hand[3].id]);
});
test('bot uses visible armor to avoid blocked attacks and chooses Steal to remove allied Acedia',()=>{
 const g=setup(),p=g.players[1],lord=g.players[0];g.current=p;p.hand=[c('steal')];lord.judge=[c('indulgence')];
 assert.match(play(g,p)[0],/^play:steal:/);assert.deepEqual(g.plannedPlays.get(p.id).targetIds,[lord.id]);
 const r=g.players[2];g.current=r;r.hand=[c('sha')];r.equip.weapon=c('kylin');lord.equip.armor=c('renwang');g.players[1].equip.armor=c('rattan');g.players[3].equip.armor=c('rattan');
 assert.deepEqual(play(g,r),['end']);
});
test('Negation protects allies, ignores harmful spells on enemies, and handles counter-Negation parity',()=>{
 const g=setup(),p=g.players[1];p.hand=[c('negate')];const q={zone:'options',context:{kind:'negation',targetId:'0',spell:'Duel',canceled:false},options:[{id:p.hand[0].id,cardIds:[p.hand[0].id]},{id:'pass'}]};
 assert.deepEqual(g.botAnswer(p,q,[]),[p.hand[0].id]);q.context.canceled=true;assert.deepEqual(g.botAnswer(p,q,[]),['pass']);
 q.context.targetId=p.id;q.context.spell='Something Out of Nothing';assert.deepEqual(g.botAnswer(p,q,[]),[p.hand[0].id]);
});
test('bots use Lust with one cost and two ordered legal male targets',()=>{
 const g=setup(),p=g.players[2];p.general=GENERALS.find(x=>x.id==='diaochan');p.hand=[c('sha')];
 const ctx={kind:'lust-plan',cardIds:[p.hand[0].id],targetIds:['0','1','3'],firstTargetIds:['1','3'],cardMin:1,cardMax:1,targetCount:2};
 const answer=g.botAnswer(p,{zone:'skill-plan',context:ctx,options:[]},[]);
 // The rebel has only one confident enemy without public evidence: no illegal or friendly Duel.
 assert.ok(validSkillPlan(ctx,answer));
 p.role='loyal';const result=g.botAnswer(p,{zone:'skill-plan',context:ctx,options:[]},[]);assert.ok(validSkillPlan(ctx,result));assert.equal(result.length,3);assert.ok(ctx.firstTargetIds.includes(result[1]));
});
test('bot Equilibrium replaces redundant cards and respects the keep value of defensive cards',()=>{
 const g=setup(),p=g.players[2];p.general=GENERALS.find(x=>x.id==='sunquan');p.hand=[c('sha'),c('sha'),c('tao'),c('shan')];
 const q={zone:'cards',title:'Equilibrium: Choose cards',min:0,max:4,options:p.hand.map(x=>({id:x.id}))};assert.deepEqual(g.botAnswer(p,q,[]),[p.hand[1].id]);
});
test('complete games produce legal answers and conserve the deck with tactical bot decisions',async()=>{
 for(const maneuver of [false,true]){
  let decisions=0;
  const g=new Game(Array.from({length:6},(_,i)=>({id:String(i),name:'Bot'+i})),{maneuver,ask:(p,q,f)=>{
   assert.ok(++decisions<20000,'game must progress');const answer=g.botAnswer(p,q,f);
   assert.ok(answer.length>=q.min&&answer.length<=q.max,`${q.title}: invalid count ${answer}`);
   assert.equal(new Set(answer).size,answer.length);assert.ok(answer.every(id=>q.options.some(o=>o.id===id)),q.title);
   if(q.zone==='skill-plan')assert.ok(validSkillPlan(q.context,answer));
   if(q.context?.kind==='optional-cost')assert.ok(!answer.length||answer.length===q.context.cardCount);
   return answer;
  }});
  await g.start();assert.ok(g.winner);const all=[...g.deck,...g.discard,...g.table,...g.reserved,...g.players.flatMap(p=>g.allCards(p))];assert.equal(all.length,maneuver?160:108);assert.equal(new Set(all.map(c=>c.id)).size,all.length);
 }
});


test('Taishi Ci does not activate Pindian when every eligible opponent would be declined',()=>{
 const g=setup(),p=g.players[3];g.current=p;p.general=ALL_GENERALS.find(x=>x.id==='taishici');p.hand=[{...c('sha'),rank:13}];g.players[1].alive=false;g.players[0].hand=[c('shan')];g.players[2].hand=[];
 assert.ok(g.playOptions(p).some(o=>o.id==='skill:tianyi'));assert.notEqual(play(g,p)[0],'skill:tianyi');
 g.players[2].hand=[c('shan')];assert.equal(play(g,p)[0],'skill:tianyi');
});
