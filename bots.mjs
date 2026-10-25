import {validSkillPlan} from './public/skill-plan.mjs';
// Decisions consume a player's public view, never the authoritative game/deck.
import {META} from './cards.mjs';
const attack=c=>['sha','fireSha','thunderSha'].includes(c.kind);
export function botDecision(view,meId,q,used={}){
 const me=view.players.find(p=>p.id===meId),live=view.players.filter(p=>p.alive),own=me.hand||[],options=q.options,ids=options.map(o=>o.id),ctx=q.context||{},title=q.title||'';
 const player=id=>view.players.find(p=>p.id===id),card=id=>[...own,...Object.values(me.equip)].find(c=>c.id===id);
 const lord=live.find(p=>p.role==='lord');
 function enemy(t){
  if(!t||t.id===meId)return -1;
  if(t.role==='lord')return me.role==='rebel'?1.5:me.role==='spy'?(live.length===2?1.5:-.7):-1;
  let alignment=0;const seen=new Set();
  for(const e of [...(view.actionHistory||[]).flatMap(g=>g.effects||[]),...(view.effects||[])]){
   if(e.id&&seen.has(e.id))continue;if(e.id)seen.add(e.id);
   if(e.sourceId!==t.id||e.targetId!==lord?.id)continue;
   if(e.kind==='damage'||e.kind==='attack'||(e.kind==='spell'&&['Duel','Burning Bridges','Steal','Acedia','Rations Depleted','Flame Tactic'].includes(e.label)))alignment+=.35;
   if(e.kind==='heal')alignment-=.6;
  }
  alignment=Math.max(-1,Math.min(1,alignment));
  return me.role==='rebel'?.12-alignment*.8:me.role==='spy'?.35: .25+alignment*.8;
 }
 function value(c){
  if(!c)return 0;
  const type=META[c.kind]?.[1];let v=c.kind==='tao'?9+(me.hp<=2?3:0):c.kind==='shan'?7:c.kind==='negate'?7:c.kind==='draw2'?8:attack(c)?4:c.kind==='wine'?4:c.kind==='lightning'?1:c.kind==='chain'?3:5;
  if(['weapon','armor','plus','minus'].includes(type))v=me.equip[type]?2:6;
  if(c.kind==='shan'&&own.filter(x=>x.kind==='shan').indexOf(c)>0)v=4;
  if(attack(c)&&own.filter(attack).indexOf(c)>0&&me.general?.id!=='zhangfei'&&me.equip.weapon?.kind!=='crossbow')v=2;
  if(Object.values(me.equip).some(x=>x.id===c.id))v+=3;
  return v;
 }
 function inRange(t,costId=null){
  if(t.id===meId)return false;let d=Math.abs(live.indexOf(me)-live.indexOf(t));d=Math.min(d,live.length-d);
  d=Math.max(1,d-(me.equip.minus&&me.equip.minus.id!==costId?1:0)-(['machao','pangde'].includes(me.general?.id)?1:0)+(t.equip.plus?1:0));
  const w=me.equip.weapon&&me.equip.weapon.id!==costId?me.equip.weapon:null;return d<=(w?META[w.kind][3]:1);
 }
 const cost=o=>(o.cardIds||[o.id]).reduce((n,id)=>n+value(card(id)),0);
 const cheapest=opts=>[...opts].sort((a,b)=>cost(a)-cost(b))[0];
 const pick=(id,targets)=>({ids:[id],...(targets?{targets}: {})});
 function targetValue(t,kind,nature='normal'){
  const hostility=enemy(t);
  if(kind==='chain')return t.chained?-hostility:hostility*.55;
  if(['steal','dismantle'].includes(kind)&&hostility<0&&t.judge.length)return 8;
  if(hostility<=0)return -20;
  let n=hostility*5+(kind==='sha'||kind==='duel'?Math.max(0,4-t.hp)*1.2:0);
  if(kind==='sha'){
   if(t.equip.armor?.kind==='rattan'&&!['fire','thunder'].includes(nature)&&me.equip.weapon?.kind!=='qinggang')return -20;
   if(t.equip.armor?.kind==='renwang'&&nature==='black'&&me.equip.weapon?.kind!=='qinggang')return -20;
   n-=Math.min(3,t.handCount)*.4;
   if(nature==='fire'&&t.equip.armor?.kind==='rattan')n+=3;
  }
  if(kind==='duel')n-=t.handCount*.35;
  return n;
 }
 function targetsFor(o){
  const physical=card(o.cardIds?.[0]),nature=physical?.kind==='fireSha'?'fire':physical?.kind==='thunderSha'?'thunder':['♠','♣'].includes(physical?.suit)?'black':'normal';
  if(o.secondaryTargets){let best=null;for(const a of o.targetIds)for(const b of o.secondaryTargets[a]||[]){const score=enemy(player(b))*5+enemy(player(a))*2;if(!best||score>best.score)best={score,ids:[a,b]};}return best||{score:-20,ids:[]};}
  const choices=(o.targetIds||[]).map(id=>({id,score:targetValue(player(id),o.kind,nature)})).sort((a,b)=>b.score-a.score);
  const good=choices.filter(x=>x.score>0).slice(0,o.targetMax||1);
  return {score:good[0]?.score??-20,ids:good.map(x=>x.id)};
 }
 function combinedSelection(spec){
  const pool=spec.cardIds.map(card).filter(Boolean).sort((a,b)=>value(a)-value(b)),ts=spec.targetIds.map(player).filter(Boolean),kind=spec.actionKind;
  let chosen=[],targets=[],mode;
  const friends=ts.filter(t=>enemy(t)<-.4).sort((a,b)=>(a.hp+a.handCount)-(b.hp+b.handCount));
  const foes=ts.filter(t=>enemy(t)>0).sort((a,b)=>targetValue(b,'effect')-targetValue(a,'effect'));
  if(kind==='rende'){if(!friends.length)return null;const n=Math.min(pool.length,Math.max(0,own.length-Math.max(2,me.hp)));if(!n)return null;chosen=pool.slice(0,n);targets=[friends[0].id];}
  else if(kind==='zhiheng')chosen=pool.filter(c=>value(c)<=2);
  else if(kind==='jieyin'||kind==='qingnang'){const t=friends[0];if(!t)return null;chosen=pool.slice(0,spec.cardMin);targets=[t.id];}
  else if(kind==='lijian'){const first=foes.find(t=>spec.firstTargetIds.includes(t.id)),second=foes.find(t=>t!==first);if(!first||!second)return null;chosen=pool.slice(0,1);targets=[first.id,second.id];}
  else if(kind==='tianyi'){if(!foes.length)return null;chosen=[...pool].sort((a,b)=>b.rank-a.rank).slice(0,1);targets=[foes[0].id];}
  else if(kind==='fanjian'){if(!foes.length)return null;targets=[foes[0].id];}
  else if(kind==='huangtian')chosen=pool.slice(0,1);
  else if(kind==='qiangxi'){
   const weapon=pool.find(c=>value(c)<=6&&foes.some(t=>spec.targetIdsByCard[c.id].includes(t.id)));
   if(weapon){chosen=[weapon];targets=[foes.find(t=>spec.targetIdsByCard[weapon.id].includes(t.id)).id];mode='mode:weapon';}
   else{const t=foes.find(t=>spec.targetIdsByMode['mode:hp'].includes(t.id));if(!t||me.hp<3)return null;targets=[t.id];mode='mode:hp';}
  }else return null;
  const selection={costs:chosen.map(c=>c.id),targets,...(mode?{mode}:{})};
  return validSkillPlan(spec,[...selection.costs,...targets,...(mode?[mode]:[])],{allowEmpty:false})?selection:null;
 }
 if(q.zone==='turn'){
  const candidates=[];const friendlyWounded=live.filter(t=>enemy(t)<-.4&&t.hp<t.maxHp);
  for(const o of options){let score=-100,targets=[];
   if(o.id.startsWith('play:')){
    if(o.id.includes(':guhuo:')){const physical=card(o.cardIds?.[0]);if(!physical||physical.suit!=='♥'||(physical.kind!==o.kind&&!(o.kind==='sha'&&attack(physical))))continue;}
    if(o.id==='play:sha:jijiang'&&used.jijiangFailed)continue;
    const type=META[o.kind]?.[1];
    if(o.targetMax){const plan=targetsFor(o);targets=plan.ids;if(targets.length<(o.targetMin||1))continue;score=plan.score+2-cost(o)*.35;}
    else if(o.kind==='tao')score=me.hp<me.maxHp?14+(me.hp<=2?4:0):-100;
    else if(o.kind==='draw2')score=13;
    else if(o.kind==='wine')score=options.some(x=>x.kind==='sha'&&targetsFor(x).score>0)?8:-100;
    else if(['weapon','armor','plus','minus'].includes(type))score=!me.equip[type]?9:me.equip[type].kind===o.kind?-100: o.kind==='crossbow'&&own.filter(attack).length>1?10:-2;
    else if(['barbarian','arrows'].includes(o.kind))score=live.filter(t=>t!==me&&t.equip.armor?.kind!=='rattan').reduce((n,t)=>n+enemy(t)*(t.hp<=1?4:2),0)-1;
    else if(o.kind==='feast')score=live.reduce((n,t)=>n+(t.hp<t.maxHp?-enemy(t)*2:0),0);
   }else if(o.id.startsWith('recast:'))score=2;
   else if(o.id==='skill:zhiheng')score=own.some(c=>value(c)<=2)?6:-100;
   else if(o.id==='skill:kurou')score=me.hp>=3&&own.length<4?3:-100;
   else if(o.id==='skill:rende')score=own.length>Math.max(2,me.hp)&&live.some(t=>t!==me&&enemy(t)<-.4)?4:-100;
   else if(o.id==='skill:jieyin')score=me.hp<me.maxHp&&own.length>=2&&friendlyWounded.some(t=>t!==me&&t.general?.sex==='m')?9:-100;
   else if(o.id==='skill:qingnang')score=friendlyWounded.length&&own.some(c=>value(c)<=6)?8:-100;
   else if(o.id==='skill:fanjian')score=own.length&&own.reduce((s,c)=>s+value(c),0)/own.length<6&&live.some(t=>enemy(t)>.4)?3:-100;
   else if(o.id==='skill:tianyi')score=own.some(c=>c.rank>=10)&&options.some(x=>x.kind==='sha')&&live.some(t=>t!==me&&t.handCount>0&&targetValue(t,'effect')>0)?10:-100;
   else if(o.id==='skill:qiangxi')score=(me.hp>=3&&live.some(t=>enemy(t)>0&&inRange(t)))||[...own,...Object.values(me.equip)].some(c=>META[c.kind]?.[1]==='weapon'&&value(c)<=6&&live.some(t=>enemy(t)>0&&inRange(t,c.id)))?7:-100;
   else if(o.id==='skill:huangtian')score=lord&&enemy(lord)<-.4?6:-100;
   else if(o.id==='skill:lijian')score=live.filter(t=>t!==me&&t.general?.sex==='m'&&enemy(t)>.2).length>=2&&[...own,...Object.values(me.equip)].some(c=>value(c)<7)?5:-100;
   if(score>0){const selection=o.actionSpec?combinedSelection(o.actionSpec):null;if(o.actionSpec&&!selection)continue;candidates.push({o,score,targets,selection});}
  }
  candidates.sort((a,b)=>b.score-a.score);const best=candidates[0];return best?(best.selection?{ids:[best.o.id],...best.selection}:pick(best.o.id,best.o.targetMax?best.targets:undefined)):pick('end');
 }
 if(q.zone==='general'){
  const strength={sunquan:10,zhugeliang:9,zhenji:9,guojia:9,huangyueying:8,liubei:8,zhangliao:8,huatuo:8,caocao:8};
  return pick([...options].sort((a,b)=>(strength[b.id]||5)-(strength[a.id]||5))[0].id);
 }
 if(ctx.kind==='guhuo-challenge')return pick(enemy(player(ctx.actorId))>.4&&me.hp>=3?'challenge':'pass');
 if(ctx.kind==='collapse')return pick(me.hp<=2&&me.maxHp>me.hp?'maxhp':'hp');
 if(ctx.kind==='rescue')return pick(enemy(player(ctx.targetId))<-.4?cheapest(options.filter(o=>o.id!=='pass'))?.id||'pass':'pass');
 if(ctx.kind==='negation'){
  const t=player(ctx.targetId);if(!t)return pick('pass');
  const beneficial=['Brotherhood','Something Out of Nothing','Bumper Harvest'].includes(ctx.spell);
  const impact=enemy(t)*(beneficial?-1:1)*(ctx.canceled?-1:1);
  return pick(impact<-.5?cheapest(options.filter(o=>!['pass','pass-turn'].includes(o.id)))?.id||'pass':'pass');
 }
 if(q.zone==='response'){
  const recipient=live.find(t=>title.includes('for '+t.name+'?'));
  if(recipient&&enemy(recipient)>-.4)return pick('pass');
  const good=options.filter(o=>o.id!=='pass');return pick(ids.includes('bagua')?'bagua':cheapest(good)?.id||'pass');
 }
 if(ctx.kind==='raid')return {ids:options.filter(o=>enemy(player(o.id))>0).sort((a,b)=>enemy(player(b.id))-enemy(player(a.id))).slice(0,q.max).map(o=>o.id)};
 if(q.zone==='skill-plan'){
  if(ctx.selectionKind){
   const pool=ctx.cardIds.map(card).filter(Boolean).sort((a,b)=>value(a)-value(b)),targets=ctx.targetIds.map(player).filter(Boolean);
   if(ctx.selectionKind==='deflection'){const c=pool.find(c=>targets.some(t=>ctx.targetIdsByCard[c.id]?.includes(t.id)&&enemy(t)>0));const t=c&&targets.filter(t=>ctx.targetIdsByCard[c.id].includes(t.id)&&enemy(t)>0).sort((a,b)=>enemy(b)-enemy(a))[0];return {ids:t?[c.id,t.id]:[]};}
   if(ctx.selectionKind==='yinghun'){const friend=targets.filter(t=>enemy(t)<0).sort((a,b)=>a.hp-b.hp)[0],t=friend||targets.sort((a,b)=>enemy(b)-enemy(a))[0];return {ids:t?[t.id,friend?'mode:assist':'mode:disrupt']:[]};}
   if(ctx.selectionKind==='lieren'){const best=[...pool].sort((a,b)=>b.rank-a.rank)[0];return {ids:best&&enemy(player(ctx.facts.opponentId))>0?[best.id]:[]};}
   if(ctx.selectionKind==='staucness')return {ids:pool.length>=2&&me.hp<=1?[...pool.slice(0,2).map(c=>c.id),'mode:discard']:['mode:damage']};
  }
  if(ctx.actionKind){const s=combinedSelection(ctx);return {ids:s?[...s.costs,...s.targets,...(s.mode?[s.mode]:[])]:[]};}
  const pool=ctx.cardIds.map(card).filter(Boolean).sort((a,b)=>value(a)-value(b));
  if(ctx.kind==='shensu'){const t=ctx.targetIds.map(player).filter(t=>enemy(t)>0).sort((a,b)=>enemy(b)-enemy(a))[0];return t&&pool.length?{ids:[pool[0].id,t.id]}:{ids:[]};}
  if(ctx.kind==='tianxiang'){
   const t=ctx.targetIds.map(player).filter(t=>enemy(t)>.2).sort((a,b)=>(enemy(b)*4-b.hp)-(enemy(a)*4-a.hp))[0];
   return t&&pool.length?{ids:[pool[0].id,t.id]}:{ids:[]};
  }
  if(ctx.kind==='legacy-distribute'){
   const friend=ctx.targetIds.map(player).filter(t=>t.id!==meId&&enemy(t)<-.4).sort((a,b)=>(a.hp+a.handCount)-(b.hp+b.handCount))[0];
   if(!friend||own.length<=Math.max(2,me.hp))return {ids:[]};
   return {ids:[...pool.slice(0,Math.min(ctx.cardMax,own.length-Math.max(2,me.hp))).map(c=>c.id),friend.id]};
  }
  const ts=ctx.targetIds.map(player).filter(t=>enemy(t)>.2).sort((a,b)=>a.hp-b.hp);
  const first=ts.find(t=>!ctx.firstTargetIds||ctx.firstTargetIds.includes(t.id)),second=ts.find(t=>t!==first);
  return first&&second&&pool.length?{ids:[pool[0].id,first.id,second.id]}:{ids:[]};
 }
 if(q.zone==='stargazing'){
  const ordered=options.filter(o=>o.card).sort((a,b)=>value(b.card)-value(a.card));
  // Avoid interfering with unknown future judgments; retain their original top cards.
  if(me.judge.length)return {ids:[...options.filter(o=>o.card).map(o=>o.id),'bottom']};
  return {ids:[...ordered.slice(0,2).map(o=>o.id),'bottom',...ordered.slice(2).map(o=>o.id)]};
 }
 if(q.zone==='harvest')return pick([...options].sort((a,b)=>value((view.table||[]).find(c=>c.id===b.id))-value((view.table||[]).find(c=>c.id===a.id)))[0].id);
 if(ctx.kind==='area'){
  const t=player(ctx.targetId);const scores=options.map(o=>{const judge=t.judge.find(c=>c.id===o.id),equip=Object.values(t.equip).find(c=>c.id===o.id);return {id:o.id,score:judge?(enemy(t)<0?10:-5):equip?(enemy(t)>0?7: -6):enemy(t)>0?4:-3};});
  return pick(scores.sort((a,b)=>b.score-a.score)[0].id);
 }
 if(ctx.kind==='judgment-replace'){
  const t=player(ctx.judgedId),friendly=enemy(t)<-.4;
  const good=c=>{let suit=c.printedSuit||c.suit;if(t?.general?.id==='xiaoqiao'&&suit==='♠')suit='♥';
   if(ctx.reason==='Acedia')return suit==='♥';if(ctx.reason==='Rations Depleted')return suit==='♣';
   if(ctx.reason==='Lightning')return !(suit==='♠'&&c.rank>=2&&c.rank<=9);
   if(ctx.reason==='Thunder Strike')return suit!=='♠';
   if(ctx.reason==='Eight Trigrams Formation')return ['♥','♦'].includes(suit);
   if(ctx.reason==='Goddess of Luo River')return !['♥','♦'].includes(suit);return null;};
  if(!t||!ctx.currentCard||good(ctx.currentCard)===null||good(ctx.currentCard)===friendly)return pick('pass');
  return pick(cheapest(options.filter(o=>card(o.id)&&good(card(o.id))===friendly))?.id||'pass');
 }
 if(ctx.kind==='yinghun-mode')return pick(enemy(player(ctx.targetId))<0?'assist':'disrupt');
 if(ctx.kind==='wound-remove'){
  const counts=new Map();for(const o of options)counts.set(o.card.rank,(counts.get(o.card.rank)||0)+1);
  return {ids:[...options].sort((a,b)=>counts.get(b.card.rank)-counts.get(a.card.rank)).slice(0,q.max||1).map(o=>o.id)};
 }
 if(ctx.kind==='pindian')return pick([...options].sort((a,b)=>(card(b.id)?.rank||0)-(card(a.id)?.rank||0))[0].id);
 if(ctx.kind==='suit-guess')return pick('♠');
 if(ids.includes('yes')&&ids.includes('no')){
  let yes=true;
  if(title.startsWith('Bared Bodied'))yes=own.some(attack)&&own.length>=3;
  if(title.startsWith('Rock Cleaving Axe'))yes=own.length>=3&&player(view.current)?.id===meId;
  if(title.startsWith('Frost Sword'))yes=false;
  if(title.startsWith('Heroic Duo'))yes=own.length>=2;
  if(title.startsWith('Tyrant'))yes=lord&&enemy(lord)<0;
  if(title.startsWith('Arise'))yes=me.maxHp-me.hp>=2;
  return pick(yes?'yes':'no');
 }
 const targets=options.filter(o=>player(o.id));
 if(targets.length){
  const helpful=/Benevolence|Betrothment|Prodigal Healer/.test(title);
  const ranked=targets.map(o=>({id:o.id,score:helpful?-enemy(player(o.id))*5+(player(o.id).maxHp-player(o.id).hp):targetValue(player(o.id),/Forceful Assault|Pindian|Thunder Strike|God Speed/.test(title)?'effect':'sha')})).sort((a,b)=>b.score-a.score);
  return ranked[0]?.score>0?pick(ranked[0].id):ids.includes('cancel')?pick('cancel'):{ids:[]};
 }
 if(q.zone==='cards'){
  const ranked=options.filter(o=>card(o.id)).sort((a,b)=>value(card(a.id))-value(card(b.id)));
  if(title.startsWith('Equilibrium'))return {ids:ranked.filter(o=>value(card(o.id))<=2).map(o=>o.id)};
  if(ctx.kind==='rende-cost')return {ids:ranked.slice(0,Math.max(0,own.length-Math.max(2,me.hp))).map(o=>o.id)};
  if(ctx.kind==='optional-cost'&&title.startsWith('Rock Cleaving Axe')&&ranked.slice(0,ctx.cardCount).reduce((n,o)=>n+value(card(o.id)),0)>10)return {ids:[]};
  if(ctx.kind==='optional-cost')return {ids:ranked.slice(0,ctx.cardCount).map(o=>o.id)};
  if(ids.includes('pass'))return pick(ranked[0]&&value(card(ranked[0].id))<7?ranked[0].id:'pass');
  return {ids:ranked.slice(0,q.min??1).map(o=>o.id)};
 }
 if(title.startsWith('Forceful Assault: Choose a weapon')){const weapon=cheapest(options.filter(o=>card(o.id)&&live.some(t=>enemy(t)>0&&inRange(t,o.id))));return pick(weapon&&cost(weapon)<=6?weapon.id:me.hp>=3?'hp':'cancel');}
 if(ids.includes('draw'))return pick('draw');
 if(ids.includes('damage'))return pick(me.hp<=1?'discard':'damage');
 if(ids.includes('pass'))return pick('pass');
 return null;
}
