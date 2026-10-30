import {META} from './cards.mjs';

// A read-only projection: no opponent hand identities, secret roles, or deck.
function projection(game,own){
 const g=Object.create(game);
 g.players=game.players.map(p=>({id:p.id,name:p.name,general:{...p.general},role:game.mode&&game.mode!=='identity'?p.role:p===own?p.role:p.role==='lord'||!p.alive?p.role:null,hp:p.hp,maxHp:p.maxHp,alive:p.alive,chained:p.chained,wineBoost:p.wineBoost||0,nirvanaUsed:p.nirvanaUsed,wounds:p.wounds?.map(c=>({...c}))||[],hand:p===own?p.hand.map(c=>({...c})):Array.from({length:p.hand.length},()=>({})),equip:Object.fromEntries(Object.entries(p.equip).map(([k,c])=>[k,{...c}])),judge:p.judge.map(c=>({...c})),bot:p.bot}));
 g.current=g.players.find(p=>p.id===game.current?.id);g.used={...game.used};
 g.deck=[];g.discard=[];g.table=[];return g;
}
const remaining=(g,p)=>{const n=g.attackLimit(p);return g.attackForbidden(p)?0:Number.isFinite(n)?Math.max(0,n-(g.used.sha||0)):null;};
const brief=o=>({optionId:o.id,kind:o.kind||null,costCardIds:o.cardIds||[],targetIds:o.targetIds||[],...(o.targetMin!==undefined?{targetMin:o.targetMin,targetMax:o.targetMax}:{}),...(o.actionSpec?{actionSpec:o.actionSpec}:{})});

export function actionPreviews(game,p,q,attackFacts=()=>[]){
 if(q.zone!=='turn'||game.current!==p)return [];
 const before=q.options||[],previews=[];
 for(const o of before){
  const cards=p.hand.filter(c=>o.cardIds?.includes(c.id)),card=cards[0],type=card&&META[card.kind]?.[1];
  if(o.id==='end'){previews.push({optionId:o.id,effect:'End Play Phase',discardCountIfNoOtherEffects:p.general.id==='lvmeng'&&!game.used.shaDuringPlay?0:Math.max(0,p.hand.length-game.handLimit(p))});continue;}
  if(['weapon','armor','plus','minus'].includes(type)&&cards.length===1&&o.kind===card.kind){
   const g=projection(game,p),a=g.players.find(x=>x.id===p.id),old=a.equip[type];
   a.hand=a.hand.filter(c=>c.id!==card.id);a.equip[type]={...card};
   if(old?.kind==='silverLion')a.hp=Math.min(a.maxHp,a.hp+1);
   const pending=[];
   if(old&&a.general.id==='sunshangxiang')pending.push('Daredevil draws 2 unknown cards on equipment loss.');
   if(!a.hand.length&&a.general.id==='luxun')pending.push('Second Wind draws 1 unknown card when the last hand card is lost.');
   const after=g.playOptions(a),byId=new Map(before.map(x=>[x.id,x]));
   const changed=after.filter(x=>{const prev=byId.get(x.id);return !prev||JSON.stringify(prev.targetIds||[])!==JSON.stringify(x.targetIds||[])||JSON.stringify(prev.cardIds||[])!==JSON.stringify(x.cardIds||[])||JSON.stringify(prev.actionSpec)!==JSON.stringify(x.actionSpec);});
   const expanded=changed.map(x=>({...brief(x),newlyAvailable:!byId.has(x.id),addedTargetIds:(x.targetIds||[]).filter(id=>!(byId.get(x.id)?.targetIds||[]).includes(id))}));
   // Spear pairs grow quadratically: exact count, bounded sample, explicit truncation.
   const sample=expanded.slice(0,16);
   const projectedAttacks=after.filter(x=>x.kind==='sha');
   const attacksAfter=attackFacts(g,a,projectedAttacks.slice(0,8));
   previews.push({optionId:o.id,effect:'Equip '+META[card.kind][0],slot:type,replacedCardId:old?.id||null,equipmentRule:META[card.kind][2],handCountAfterKnownChanges:a.hand.length,hpAfterKnownChanges:a.hp,rangeBefore:game.range(p),rangeAfter:g.range(a),attackUsesRemainingAfter:remaining(g,a),unlimitedAttacksAfter:!g.attackForbidden(a)&&!Number.isFinite(g.attackLimit(a)),discardCountAfterKnownChanges:a.general.id==='lvmeng'&&!g.used.shaDuringPlay?0:Math.max(0,a.hand.length-g.handLimit(a)),distancesAfter:g.alive().filter(t=>t!==a).map(t=>({playerId:t.id,distance:g.distance(a,t),inAttackRange:g.canSha(a,t)})),attacksAfter,attackOptionsAfterCount:projectedAttacks.length,attackFactsTruncated:projectedAttacks.length>8,newOrChangedFollowUps:sample,totalNewOrChangedFollowUps:expanded.length,followUpsTruncated:expanded.length>sample.length,removedOptionIds:before.filter(x=>!after.some(y=>y.id===x.id)).map(x=>x.id),pendingUnknownEffects:pending,certainty:'Projected options from known cards after replacement; unknown draws and later reactions are unresolved. Follow-up IDs are hypothetical, not legal selections for the current prompt.'});
  }else if(o.kind==='draw2'||o.kind==='recast'){
   const n=o.kind==='draw2'?2:1,extra=o.kind==='draw2'&&p.general.id==='huangyueying'?1:0;
   previews.push({optionId:o.id,handCardsSpent:cards.length,unknownCardsDrawn:n+extra,handCountAfterDrawIfNoOtherEffects:p.hand.length-cards.length+n+extra,certainty:'Draw identities are unknown. Recompute options after drawing; no future card or target is assumed.'});
  }else if(o.kind==='wine'){
   previews.push({optionId:o.id,handCardsSpent:cards.length,nextAttackBonus:1,expires:'End of this turn',attackUsesRemaining:remaining(game,p),certainty:'Does not grant another Attack use. Damage depends on armor, responses and skills.'});
  }else if(o.kind==='tao'){
   const g=projection(game,p),a=g.players.find(x=>x.id===p.id);
   a.hand=a.hand.filter(c=>!cards.some(x=>x.id===c.id));a.hp=Math.min(a.maxHp,a.hp+1);
   previews.push({optionId:o.id,handCardsSpent:cards.length,hpAfter:a.hp,handCountAfterKnownChanges:a.hand.length,handLimitAfterKnownChanges:g.handLimit(a),discardCountAfterKnownChanges:a.general.id==='lvmeng'&&!g.used.shaDuringPlay?0:Math.max(0,a.hand.length-g.handLimit(a)),pendingUnknownEffects:!a.hand.length&&a.general.id==='luxun'?['Second Wind draws 1 unknown card when the last hand card is lost.']:[],certainty:'Known self-heal and hand-limit changes if this play resolves. Unknown skill draws and later actions are unresolved.'});
  }
 }
 return previews;
}
