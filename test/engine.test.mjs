import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,Finished} from '../engine.mjs';
import {makeDeck,GENERALS,META} from '../cards.mjs';
let seq=1000;
const card=(kind,suit='♠',rank=7)=>({id:`t${seq++}`,kind,suit,rank});
function game(adapter){const g=new Game(Array.from({length:4},(_,i)=>({id:String(i),name:'P'+i})),{ask:adapter||((p,q,f)=>f)});g.players.forEach((p,i)=>{p.general=GENERALS.find(x=>x.id==='zhangfei');p.role=['lord','loyal','rebel','spy'][i];});g.current=g.players[0];g.phase='Play';g.used={sha:0};return g;}
test('standard deck: 108 unique cards, correct card counts and EX',()=>{const deck=makeDeck();assert.equal(deck.length,108);assert.equal(new Set(deck.map(c=>c.id)).size,108);for(const [kind,n]of Object.entries({sha:30,shan:15,tao:8,dismantle:6,negate:4,lightning:2})){assert.equal(deck.filter(c=>c.kind===kind).length,n,kind);}for(const c of deck){assert.ok(META[c.kind]);assert.ok(c.rank>=1&&c.rank<=13);}});
test('private view never sends other hands or hidden identities',()=>{const g=game();g.players.forEach(p=>g.draw(p,4));const view=g.view('1');assert.equal(view.players[0].role,'lord');assert.equal(view.players[2].role,null);assert.equal(view.players[2].hand,undefined);assert.equal(view.players[1].hand.length,4);assert.equal(view.players[1].role,'loyal');});
test('server rejects wrong, duplicate, and stale prompt answers',async()=>{const g=game();g.askAdapter=null;const promise=g.ask(g.players[0],'choose',[{id:'a',label:'a'},{id:'b',label:'b'}],{min:1,max:2,timeout:0});const q=g.prompts.get('0');assert.throws(()=>g.answer('1',q.id,['a']));assert.throws(()=>g.answer('0',q.id,['x']));assert.throws(()=>g.answer('0',q.id,['a','a']));g.answer('0',q.id,['a']);assert.deepEqual(await promise,['a']);assert.throws(()=>g.answer('0',q.id,['b']));});
test('distance uses living seats, horses, and Ma Chao',()=>{const g=game();const [a,b,c]=g.players;assert.equal(g.distance(a,c),2);a.equip.minus=card('minusHorse');assert.equal(g.distance(a,c),1);c.equip.plus=card('plusHorse');assert.equal(g.distance(a,c),2);a.general=GENERALS.find(x=>x.id==='machao');assert.equal(g.distance(a,c),1);delete a.equip.minus;delete c.equip.plus;b.alive=false;a.general=GENERALS.find(x=>x.id==='zhangfei');assert.equal(g.distance(a,c),1);});
test('Lu Bu requires two dodges; one is insufficient',async()=>{let n=0;const g=game((p,q,f)=>{if(q.zone==='response'){n++;return [q.options.find(o=>o.id!=='pass')?.id||'pass'];}return f;});const [a,b]=g.players;a.general=GENERALS.find(x=>x.id==='lvbu');b.hand=[card('shan')];await g.sha(a,b,{suit:'♥'});assert.equal(n,1);assert.equal(b.hp,3);assert.equal(b.hand.length,0);});
test('Qinggang bypasses Renwang; black attack otherwise has no effect',async()=>{const g=game();const[a,b]=g.players;b.equip.armor=card('renwang');await g.sha(a,b,{suit:'♠'});assert.equal(b.hp,4);a.equip.weapon=card('qinggang');await g.sha(a,b,{suit:'♠'});assert.equal(b.hp,3);});
test('rescue raises a negative HP target to one, consumes enough peaches',async()=>{const g=game((p,q,f)=>q.context?.kind==='rescue'?[q.options[0].id]:f);const p=g.players[2];p.hp=-1;g.players[0].hand=[card('tao'),card('tao')];await g.dying(p,g.players[0]);assert.equal(p.hp,1);assert.equal(p.alive,true);assert.equal(g.players[0].hand.length,0);});
test('Sun Quan lord rescue gives extra recovery only for another Wu general',async()=>{const g=game((p,q,f)=>q.context?.kind==='rescue'?[q.options[0].id]:f);const [lord,loyal]=g.players;lord.general=GENERALS.find(x=>x.id==='sunquan');loyal.general=GENERALS.find(x=>x.id==='ganning');lord.hp=-1;loyal.hand=[card('tao')];await g.dying(lord,null);assert.equal(lord.hp,1);});
test('death rewards: rebel killer draws three; lord killing loyal loses hand/equipment',async()=>{let g=game();const[a,,b]=g.players;b.hp=0;await g.dying(b,a);assert.equal(b.alive,false);assert.equal(a.hand.length,3);g=game();const[lord,loyal]=g.players;lord.hand=[card('sha')];lord.equip.weapon=card('crossbow');loyal.hp=0;await g.dying(loyal,lord);assert.equal(lord.hand.length,0);assert.deepEqual(lord.equip,{});});
test('victory: spy wins only as sole survivor; otherwise lord death gives rebel win',()=>{for(const [survivors,winner]of [[[2,3],'rebel'],[[3],'spy'],[[0,1],'lord']]){const g=game();g.players.forEach((p,i)=>p.alive=survivors.includes(i));assert.throws(()=>g.checkWin(),Finished);assert.equal(g.winner,winner);}});
test('counterspell can be countered; neither card disappears',async()=>{const g=game((p,q,f)=>q.context?.kind==='negation'?[q.options[0].id]:f);g.players[0].hand=[card('negate')];g.players[1].hand=[card('negate')];assert.equal(await g.negate(g.players[2],'Duel'),false);assert.equal(g.discard.length,2);assert.equal(g.table.length,0);});
test('Lu Xun loses last card and may immediately draw; cannot be stolen/indulged',async()=>{const g=game((p,q,f)=>q.options.some(o=>o.id==='yes')?['yes']:f);const[a,b]=g.players;b.general=GENERALS.find(x=>x.id==='luxun');b.hand=[card('sha')];await g.remove(b,b.hand[0]);assert.equal(b.hand.length,1);assert.ok(!g.candidates(a,'steal').includes(b));assert.ok(!g.candidates(a,'indulgence').includes(b));});
test('virtual responses: Wusheng red equipment, Longdan, and serpent two cards',()=>{const g=game();const p=g.players[0];p.general=GENERALS.find(x=>x.id==='guanyu');p.hand=[card('shan','♥')];p.equip.weapon=card('kylin','♥');assert.equal(g.virtual(p,'sha').length,2);p.general=GENERALS.find(x=>x.id==='zhaoyun');assert.equal(g.virtual(p,'sha').length,1);p.equip.weapon=card('serpent');p.hand=[card('tao'),card('shan')];assert.ok(g.virtual(p,'sha').some(v=>v.cards.length===2));});
test('reshuffle excludes cards currently resolving',()=>{const g=game();g.deck=[];g.discard=[card('sha')];g.table=[card('duel')];g.draw(g.players[0],2);assert.equal(g.players[0].hand.length,1);assert.equal(g.table.length,1);});
test('normal kill count and Crossbow/Zhang Fei exceptions',()=>{const g=game();const p=g.players[0];p.general=GENERALS.find(x=>x.id==='guanyu');p.hand=[card('sha')];g.used.sha=1;assert.ok(!g.playOptions(p).some(x=>x.kind==='sha'));p.equip.weapon=card('crossbow');assert.ok(g.playOptions(p).some(x=>x.kind==='sha'));});
test('full matches finish with all 108 cards conserved',async()=>{
 for(let round=0;round<6;round++){
  let prompts=0;
  const g=new Game(Array.from({length:4+round%5},(_,i)=>({id:String(i),name:'P'+i})),{ask:(p,q,f)=>{
   if(++prompts>30000)throw new Error('Match did not finish');
   assert.doesNotMatch(JSON.stringify({title:q.title,options:q.options}),/\p{Script=Han}/u,'all decisions use English');
   return g.botAnswer(p,q,f);
  }});
  await g.start();assert.ok(g.winner);assert.doesNotMatch(JSON.stringify(g.logs),/\p{Script=Han}/u,'all match log messages use English');const cards=[...g.deck,...g.discard,...g.table,...g.players.flatMap(p=>g.allCards(p))];assert.equal(cards.length,108,`round ${round}`);assert.equal(new Set(cards.map(c=>c.id)).size,108);assert.equal(g.alive().length>0,true);
 }
});
test('Wusheng equipment cost is removed before checking attack distance',()=>{const g=game();const[a,,c]=g.players;a.general=GENERALS.find(x=>x.id==='guanyu');a.equip.weapon=card('kylin','♥');assert.equal(g.canSha(a,c),true);assert.equal(g.canShaWithCost(a,c,[a.equip.weapon]),false);a.equip.minus=card('minusHorse','♥');assert.equal(g.canShaWithCost(a,c,[a.equip.minus]),true);delete a.equip.weapon;assert.equal(g.canShaWithCost(a,c,[a.equip.minus]),false);});
test('delayed tricks are negated during judgment, not when placed',async()=>{let asks=0;const g=game((p,q,f)=>{asks++;return q.options.some(o=>o.id==='1')?['1']:f;});const[a,b]=g.players;a.hand=[card('indulgence')];b.hand=[card('negate')];const c=a.hand[0];await g.play(a,`play:indulgence:${c.id}`);assert.equal(asks,1);assert.equal(b.judge.length,1);assert.equal(b.hand.length,1);});
test('practice bots use rescue context rather than translated prompt text',()=>{const g=game();const[lord,loyal,rebel]=g.players;const q={title:'Any translated title',zone:'options',context:{kind:'rescue',targetId:lord.id},options:[{id:'peach',label:'Peach'},{id:'pass',label:'Pass'}]};assert.deepEqual(g.botAnswer(loyal,q,['pass']),['peach']);assert.deepEqual(g.botAnswer(rebel,q,['pass']),['pass']);q.context.targetId=rebel.id;assert.deepEqual(g.botAnswer(rebel,q,['pass']),['peach']);q.context={kind:'negation'};assert.deepEqual(g.botAnswer(loyal,q,['peach']),['pass']);});
test('Lightning needs no other target and enters only its user judgment area',async()=>{
 const g=game(),[a,b]=g.players,c=card('lightning');a.hand=[c];const option=g.playOptions(a).find(o=>o.kind==='lightning');assert.equal(option.targetMax,0);assert.deepEqual(option.targetIds,[]);await g.play(a,option.id);assert.ok(a.judge.includes(c));assert.equal(b.judge.length,0);assert.ok(g.effects.some(e=>e.sourceId===a.id&&e.targetId===a.id&&e.label==='Lightning'));assert.ok(!g.playOptions(a).some(o=>o.kind==='lightning'));
});
test('targeted skill and delayed spell announce source and target',async()=>{
 const g=game((p,q,f)=>q.context?.actionKind==='fanjian'?['1']:f),[a,b]=g.players;a.general=GENERALS.find(x=>x.id==='zhouyu');a.hand=[card('sha')];await g.skill(a,'fanjian');assert.ok(g.effects.some(e=>e.kind==='skill'&&e.label==='Sowing Distrust'&&e.sourceId===a.id&&e.targetId===b.id));
 const c=card('indulgence');a.hand=[c];g.askAdapter=(p,q,f)=>q.title.includes('Choose a target')?['1']:f;await g.play(a,`play:indulgence:${c.id}`);assert.ok(g.effects.some(e=>e.kind==='spell'&&e.label==='Acedia'&&e.sourceId===a.id&&e.targetId===b.id));
});
test('Play decisions honor the selected room timeout without a two-minute minimum',async()=>{
 for(const seconds of [0,15,30,60,120,300]){let prompt;const g=game((p,q,f)=>{if(q.zone==='turn'){prompt=q;return ['end'];}return f;});g.seconds=seconds;await g.takeTurn(g.players[0]);assert.ok(prompt);assert.equal(prompt.deadline===null?0:prompt.deadline-prompt.startedAt,seconds*1000);}
});
test('discard review holds public discarded cards before End and clears its countdown afterward',async()=>{
 const g=game((p,q,f)=>q.zone==='turn'?['end']:f),p=g.players[0];p.hand=Array.from({length:5},()=>card('sha'));let reviewed=false;
 g.pause=async ms=>{reviewed=true;assert.equal(ms,3000);assert.equal(g.phase,'Discard');const view=g.view('1');assert.equal(view.discardReview.playerId,p.id);assert.equal(view.discardReview.deadline-view.discardReview.startedAt,3000);assert.ok(view.recentCards.some(r=>r.action==='Discarded'&&r.playerId===p.id));assert.equal(view.prompt,null);};
 await g.takeTurn(p);assert.equal(reviewed,true);assert.equal(g.discardReview,null);assert.equal(g.phase,'End');
});
test('Nio Shield visibly announces a black Attack block without prompting Dodge',async()=>{
 let responses=0;const g=game((p,q,f)=>{if(q.zone==='response')responses++;return f;}),[a,b]=g.players;b.equip.armor=card('renwang');const hp=b.hp;await g.sha(a,b,{kind:'sha',cards:[],suit:'♠',nature:'normal'});assert.equal(b.hp,hp);assert.equal(responses,0);const event=g.view('2').effects.find(e=>e.kind==='trigger'&&e.label==='Nio Shield');assert.equal(event.targetId,b.id);assert.equal(event.detail,'Black Attack blocked');
 g.effects=[];await g.sha(a,b,{kind:'sha',cards:[],suit:'♥',nature:'normal'});assert.ok(!g.effects.some(e=>e.label==='Nio Shield'));assert.equal(b.hp,hp-1);
});
test('Zhou Yu Sowing Distrust transfers and reveals exactly one card, checks suit, and is once per phase',async()=>{
 for(const guess of ['♥','♠']){const g=game((p,q,f)=>q.context?.actionKind==='fanjian'?['1']:q.context?.kind==='suit-guess'?[guess]:f),[a,b]=g.players;a.general=GENERALS.find(x=>x.id==='zhouyu');const c=card('shan','♥');a.hand=[c];const hp=b.hp;await g.skill(a,'fanjian');assert.ok(b.hand.includes(c));assert.equal(a.hand.length,0);assert.equal(b.hp,hp-(guess==='♥'?0:1));assert.ok(g.recentCards.some(r=>r.card.id===c.id&&r.action.includes('Sowing Distrust')));a.hand=[card('sha')];const before=b.hand.length;await g.skill(a,'fanjian');assert.equal(b.hand.length,before);assert.ok(!g.playOptions(a).some(o=>o.id==='skill:fanjian'));}
});
test('Zhou Yu Heroic draws three and empty-handed Sowing Distrust does nothing',async()=>{
 const g=game((p,q,f)=>q.zone==='turn'?['end']:f),p=g.players[0];p.general=GENERALS.find(x=>x.id==='zhouyu');await g.skill(p,'fanjian');assert.equal(g.used.fanjian,undefined);await g.takeTurn(p);assert.equal(p.hand.length,3);
});
test('a committed play starts a new center group while all its responses remain together',async()=>{
 const g=game((p,q,f)=>q.title.includes('Choose a target')?['1']:q.zone==='response'?[q.options[0].id]:f),[a,b]=g.players;const attack=card('sha'),dodge=card('shan'),weapon=card('crossbow');a.hand=[attack,weapon];b.hand=[dodge];await g.play(a,`play:sha:${attack.id}`);assert.deepEqual(g.recentCards.map(r=>r.card.id),[attack.id,dodge.id]);assert.equal(g.actionGroup.label,'Attack');const id=g.actionGroup.id;await g.play(a,`play:crossbow:${weapon.id}`);assert.notEqual(g.actionGroup.id,id);assert.deepEqual(g.recentCards.map(r=>r.card.id),[weapon.id]);
});
test('card movements expose counts and endpoints without hidden identities',async()=>{
 const g=game(),[a,b]=g.players;g.draw(a,2);assert.equal(g.movements.at(-1).count,2);const c=a.hand[0];await g.remove(a,c,b.hand);assert.equal(g.movements.at(-1).kind,'transfer');assert.equal(g.movements.at(-1).from,a.id);assert.equal(g.movements.at(-1).to,b.id);const publicMoves=g.view('observer').movements;for(const movement of publicMoves){assert.deepEqual(Object.keys(movement).sort(),['count','from','id','kind','to']);assert.ok(!Object.values(movement).includes(c.id));}await g.spend(a,[a.hand[0]],{action:'Discarded'});assert.equal(g.movements.at(-1).kind,'discard');assert.equal(g.movements.at(-1).count,1);
});

test('successful Attack responses announce their card, while passing does not',async()=>{
 const g=new Game([{id:'a',name:'A'},{id:'b',name:'B'}],{ask:(p,q)=>[q.options.find(o=>o.id!=='pass')?.id||'pass']});
 for(const p of g.players){p.general={id:'zhangfei',kingdom:'Shu',hp:4};p.hp=p.maxHp=4;}
 const p=g.players[1];p.hand=[{id:'response-attack',kind:'sha',suit:'♠',rank:7}];
 assert.equal(await g.response(p,'sha','Barbarian Invasion: Play Attack'),true);
 assert.ok(g.effects.some(e=>e.kind==='announce'&&e.label==='Attack'&&e.sourceId===p.id));
 const count=g.effects.length;assert.equal(await g.response(p,'sha','Duel: Play Attack'),false);assert.equal(g.effects.length,count);
});
