import {actionPreviews} from './action-previews.mjs';
import {atomicSkills} from './action-selections.mjs';
import {ROLES,META} from './cards.mjs';
const roles=['loyal','rebel','spy'];
const face=c=>Object.fromEntries(['id','kind','name','suit','rank','printedSuit'].filter(k=>c[k]!==undefined).map(k=>[k,c[k]]));
const bounded=(s,n)=>typeof s==='string'?s.slice(0,n):'';
// Receives only public event records and THIS seat's private observations.
// It never receives the authoritative player list, opponent hands or deck.
export class BotKnowledge{
 constructor(playerId){this.playerId=playerId;this.eventCount=0;this.pairs=new Map();this.turns=new Map();this.sightings=new Map();this.knownHands=new Map();this.ownCards=new Map();this.lastHand=new Set();this.ownChanges=[];this.own=null;this.lastSelection=null;this.ownCardEvents=[];this.observedFeedback=null;this.plan=null;this.statements=new Map();this.ownDrawn=0;this.ownLost=0;}
 consume(e){
  this.eventCount++;let turn=this.turns.get(e.turn);if(!turn){turn={turn:e.turn,playerId:e.turnPlayerId||null,events:0,actions:0,damage:0,healing:0,drawn:0,discarded:0,highlights:[]};this.turns.set(e.turn,turn);}turn.events++;
  if(e.type==='log'){if(e.eventType==='action')turn.actions++;if(e.eventType==='action'||/eliminated|dying|skips|Game over/.test(e.text||'')){turn.highlights.push(bounded(e.text,220));turn.highlights=turn.highlights.slice(-6);}}
  if(e.type==='chat'){const prior=this.statements.get(e.speakerId)||{speakerId:e.speakerId,name:e.name,count:0,early:[],recent:[]};prior.count++;const quote={turn:e.turn,text:bounded(e.text,500),ai:!!e.ai};if(prior.early.length<2)prior.early.push(quote);prior.recent.push(quote);prior.recent=prior.recent.slice(-4);this.statements.set(e.speakerId,prior);}
  if(e.type==='cards'){
   if(e.playerId===this.playerId){this.ownCardEvents.push({turn:e.turn,action:e.action,cards:e.cards.map(face)});this.ownCardEvents=this.ownCardEvents.slice(-8);}
   if(!e.action.startsWith('Revealed'))this.knownHands.delete(e.playerId);
   for(const card of e.cards){const f=face(card);this.sightings.set(f.id,{card:f,lastSeenTurn:e.turn,observedPlayerId:e.playerId,action:e.action,location:e.action.startsWith('Revealed')?'Revealed in hand at that time':'Public sighting only; not current ownership'});if(e.action.startsWith('Revealed')){const known=this.knownHands.get(e.playerId)||new Map();known.set(f.id,f);this.knownHands.set(e.playerId,known);}}
  }
  if(e.type==='movement'){
   if(e.from)this.knownHands.delete(e.from);if(e.kind==='draw')turn.drawn+=e.count;if(e.kind==='discard')turn.discarded+=e.count;
  }
  if(e.type==='effect'&&e.kind==='damage')turn.damage+=Math.max(0,Number(e.amount)||0);
  if(e.type==='effect'&&e.kind==='heal'&&e.sourceId===e.targetId&&/HP/.test(e.label||''))turn.healing+=Number((e.label||'').match(/\d+/)?.[0])||0;
  if(e.type==='effect'&&e.sourceId&&e.targetId&&e.sourceId!==e.targetId){
   const key=e.sourceId+'>'+e.targetId,pair=this.pairs.get(key)||{sourceId:e.sourceId,targetId:e.targetId,attacks:0,harmfulSpells:0,damage:0,healing:0,support:0,pressure:0,lastTurn:e.turn};pair.lastTurn=e.turn;
   if(e.kind==='attack'){pair.attacks++;pair.pressure+=.2;}
   if(e.kind==='spell'&&['Duel','Burning Bridges','Steal','Acedia','Rations Depleted','Flame Tactic'].includes(e.label)){pair.harmfulSpells++;pair.pressure+=.25;}
   if(e.kind==='damage'){const n=Math.max(0,Number(e.amount)||0);pair.damage+=n;pair.pressure+=n*(['Barbarian Invasion','Arrow Barrage'].includes(e.actionLabel)?.15:.5);}
   if(e.kind==='heal'){const n=Math.max(1,Number(e.amount)||Number((e.label||'').match(/\d+/)?.[0])||1);pair.healing+=n;pair.pressure-=n*.55;}
   if(e.kind==='skill'&&['Legacy','Benevolence','Yellow Heaven','Betrothment','Prodigal Healer'].includes(e.label)){pair.support++;pair.pressure-=.3;}
   this.pairs.set(key,pair);
  }
 }
 observeOwn({turn,current,phase,player}){
  if(!player)return;const hand=player.hand||[],ids=new Set(hand.map(c=>c.id)),gained=hand.filter(c=>!this.lastHand.has(c.id)),lost=[...this.lastHand].filter(id=>!ids.has(id));
  for(const c of hand)this.ownCards.set(c.id,face(c));
  if(gained.length||lost.length){this.ownDrawn+=gained.length;this.ownLost+=lost.length;this.ownChanges.push({turn,phase,gained:gained.map(face),lostCardIds:lost});this.ownChanges=this.ownChanges.slice(-16);}
  if(!this.observedFeedback||gained.length||lost.length||this.own?.hp!==player.hp||this.observedFeedback.phase!==phase||this.observedFeedback.turn!==turn||this.observedFeedback.lastSubmittedSelection!==this.lastSelection)this.observedFeedback={turn,phase,lastSubmittedSelection:this.lastSelection,observedSincePreviousSnapshot:{gained:gained.map(face),lost:lost.map(id=>this.ownCards.get(id)||{id}),hpBefore:this.own?.hp??null,hpNow:player.hp},currentHand:hand.map(face),note:'Selection records submission only. Changes are observed facts since the previous feedback snapshot and may include other actions; do not infer cause or successful damage from submission.'};
  this.lastHand=ids;this.own={role:player.role,hp:player.hp,alive:player.alive};
  if(current===this.playerId&&turn>0&&this.plan?.turn!==turn)this.plan={turn,objective:['red','blue'].includes(player.role)?'Eliminate the opposing team while supporting surviving teammates.':player.role==='rebel'?'Pressure the Lord while retaining enough defense.':player.role==='spy'?'Survive and balance the sides until a final duel with the Lord.':'Protect the Lord and pressure likely Rebels.',steps:[],reserveCardIds:[],source:'baseline',revision:0,status:'active'};
 }
 beliefs(view){
  if(view.gameRules?.teamsArePublic)return view.players.map(p=>({playerId:p.id,knownRole:p.role,probabilities:{[p.role]:1},basis:'Public team'}));
  const counts={lord:0,loyal:0,rebel:0,spy:0};if(view.roleCounts)Object.assign(counts,view.roleCounts);else for(const role of ROLES[view.players.length]||['lord','loyal','rebel','spy'])counts[role]++;
  const known=new Map();for(const p of view.players){const role=p.id===this.playerId?(this.own?.role||p.role):p.role==='lord'||!p.alive?p.role:null;if(role){known.set(p.id,role);counts[role]=Math.max(0,counts[role]-1);}}
  const unknown=view.players.filter(p=>!known.has(p.id)),details=new Map();
  for(const p of unknown){let bias=0;const evidence=[];for(const pair of this.pairs.values())if(pair.sourceId===p.id&&known.has(pair.targetId)){const targetRole=known.get(pair.targetId);if(['lord','loyal','rebel'].includes(targetRole)){bias+=pair.pressure*(targetRole==='rebel'?1:-1);evidence.push({...pair,targetKnownRole:targetRole});}}details.set(p.id,{bias:Math.max(-3,Math.min(3,bias)),evidence});}
  const marginals=new Map(unknown.map(p=>[p.id,{loyal:0,rebel:0,spy:0}]));let total=0;
  const visit=(i,left,assignment,weight)=>{if(i===unknown.length){if(roles.some(r=>left[r]))return;total+=weight;for(let j=0;j<unknown.length;j++)marginals.get(unknown[j].id)[assignment[j]]+=weight;return;}const bias=details.get(unknown[i].id).bias;for(const role of roles)if(left[role]>0){left[role]--;assignment.push(role);visit(i+1,left,assignment,weight*Math.exp(role==='loyal'?bias*.8:role==='rebel'?-bias*.8:-Math.abs(bias)*.2));assignment.pop();left[role]++;}};
  if(roles.reduce((n,r)=>n+counts[r],0)===unknown.length)visit(0,{...counts},[],1);
  return view.players.map(p=>{
   if(known.has(p.id))return {playerId:p.id,knownRole:known.get(p.id),probabilities:{[known.get(p.id)]:1},basis:p.id===this.playerId?'Own identity':'Public identity'};
   const sum=roles.reduce((n,r)=>n+counts[r],0),m=marginals.get(p.id);return {playerId:p.id,probabilities:Object.fromEntries(roles.map(r=>[r,total?m[r]/total:sum?counts[r]/sum:1/3])),basis:'Heuristic belief, not calibrated certainty. Joint assignments respect remaining role counts; public actions can deceive.',evidence:details.get(p.id).evidence};
  });
 }
 updatePlan(proposal,view,q){
  if(q.zone!=='turn'||view.current!==this.playerId||!proposal||typeof proposal!=='object')return;
  const own=view.players.find(p=>p.id===this.playerId),players=new Set(view.players.map(p=>p.id)),kinds=new Set([...Object.keys(META),...atomicSkills.map(k=>'skill:'+k)]);
  const objective=bounded(proposal.objective,240);if(!objective.trim())return;
  const steps=(Array.isArray(proposal.steps)?proposal.steps:[]).map(s=>s&&typeof s==='object'?{...s,kind:atomicSkills.includes(s.kind)?'skill:'+s.kind:s.kind}:s).slice(0,4).filter(s=>s&&typeof s==='object'&&kinds.has(s.kind)&&Array.isArray(s.targetIds)&&new Set(s.targetIds).size===s.targetIds.length&&s.targetIds.every(id=>players.has(id))).map(s=>({kind:s.kind,targetIds:s.targetIds.slice(0,8)}));
  const reserveCardIds=[...new Set(Array.isArray(proposal.reserveCardIds)?proposal.reserveCardIds:[])].filter(id=>own?.hand?.some(c=>c.id===id));
  this.plan={turn:view.turn,objective,steps,reserveCardIds,source:'model',revision:(this.plan?.revision||0)+1,status:'active'};
 }
 noteChoice(q,decision){this.lastSelection={promptId:q.id,zone:q.zone,selected:decision.ids.map(id=>{const o=q.options.find(o=>o.id===id);return {id,label:o?.label||id,cardIds:o?.cardIds||[]};}),targetIds:decision.targets||[],costCardIds:decision.costs||[],mode:decision.mode||null};if(!this.plan||q.zone!=='turn')return;const option=q.options.find(o=>o.id===decision.ids[0]);if(option?.id==='end')this.plan.status='completed';else{this.plan.lastChoice={kind:option?.kind||option?.label,targetIds:decision.targets||[]};}}
 snapshot(view){
  const turns=[...this.turns.values()],early=turns.slice(0,-12),recent=turns.slice(-12);return {executionFeedback:{...this.observedFeedback,recentOwnCardEvents:this.ownCardEvents},eventsObservedSinceStart:this.eventCount,turnsObserved:turns.length,olderTurns:early.length?{from:early[0].turn,to:early.at(-1).turn,actions:early.reduce((n,t)=>n+t.actions,0),damage:early.reduce((n,t)=>n+t.damage,0),drawn:early.reduce((n,t)=>n+t.drawn,0),discarded:early.reduce((n,t)=>n+t.discarded,0)}:null,recentTurns:recent,interactionsSinceStart:[...this.pairs.values()].map(x=>({...x})),roleBeliefs:this.beliefs(view),tableTalkSinceStart:[...this.statements.values()],publicCardSightings:[...this.sightings.values()].map(x=>({...x,card:{...x.card}})),confirmedRevealedHandCards:[...this.knownHands].map(([playerId,cards])=>({playerId,cards:[...cards.values()].map(c=>({...c})),note:'Conservatively invalidated when this holder loses cards.'})),ownHistory:{cardsSeen:[...this.ownCards.values()].map(c=>({...c})),cardsGained:this.ownDrawn,cardsLost:this.ownLost,recentChanges:this.ownChanges},plan:this.plan?JSON.parse(JSON.stringify(this.plan)):null};
 }
}

export function tacticalFacts(game,p,q,{preview=true}={}){
 if(!p.general)return {legalChoicesAreAuthoritative:true};
 const ownTurn=game.current===p,limit=game.attackLimit(p),spent=ownTurn?(game.used.sha||0):0,ownCards=[...p.hand,...Object.values(p.equip)],virtuals=(q.options||[]).some(o=>o.kind==='sha')?game.virtual(p,'sha'):[];
 const handLimit=game.handLimit(p),skipDiscardAvailable=p.general.id==='lvmeng'&&!game.used.shaDuringPlay;
 const handEconomy={handCount:p.hand.length,handLimit,excessBeforeOptionalSkip:Math.max(0,p.hand.length-handLimit),discardCountIfEndNow:skipDiscardAvailable?0:Math.max(0,p.hand.length-handLimit),optionalComposureSkip:skipDiscardAvailable,forecastAppliesToCurrentPlayPhase:ownTurn&&q.zone==='turn',assumption:'Current HP, equipment and skill state; ignores future triggered effects. If Composure is offered, zero discard assumes accepting it.'};
 const distances=game.alive().filter(t=>t!==p).map(t=>({playerId:t.id,distance:game.distance(p,t),inCurrentAttackRange:game.canSha(p,t),hp:t.hp,handCount:t.hand.length,armor:t.equip.armor?.kind||null,chained:!!t.chained}));
 const attacks=(q.options||[]).filter(o=>o.kind==='sha').map(o=>{
  const virtual=virtuals.find(v=>o.id==='play:sha:'+v.id),cost=ownCards.filter(c=>o.cardIds?.includes(c.id)),weapon=p.equip.weapon&&!cost.includes(p.equip.weapon)?p.equip.weapon:null,nature=virtual?.nature||'normal',suit=virtual?.bluff?game.effectiveCard(p,virtual.cards[0]).suit:virtual?.suit;
  const afterLimit=p.general.id==='zhangfei'||weapon?.kind==='crossbow'?Infinity:1+(p===game.current&&game.used.tianyiWin?1:0);
  return {optionId:o.id,attackUsesRemainingAfterThisPlay:Number.isFinite(afterLimit)?Math.max(0,afterLimit-spent-1):null,unlimitedAfterThisPlay:!Number.isFinite(afterLimit),requiresAllyResponse:!!virtual?.lordRequest,requiresSuccessfulBluff:!!virtual?.bluff,nature,suit:suit||null,rangeAfterCost:weapon?META[weapon.kind][3]:1,equipmentSpent:Object.entries(p.equip).filter(([,c])=>cost.includes(c)).map(([slot,c])=>({slot,kind:c.kind})),targets:(o.targetIds||[]).map(id=>{
   const t=game.players.find(t=>t.id===id),ignored=weapon?.kind==='qinggang',armor=t.equip.armor?.kind;
   const blocked=!ignored&&((armor==='renwang'&&['♠','♣'].includes(suit))||(armor==='rattan'&&nature==='normal'));
   let damage=1+(p.wineBoost||0)+(p===game.current&&game.used.luoyi?1:0)+(weapon?.kind==='guding'&&!t.hand.length?1:0);
   if(!ignored&&armor==='rattan'&&nature==='fire')damage++;if(!ignored&&armor==='silverLion')damage=Math.min(1,damage);
   const bow=p.general.id==='huangzhong'&&p===game.current&&game.phase==='Play'&&(t.hand.length>=p.hp||t.hand.length<=game.range(p));
   return {playerId:id,legal:game.canShaWithCost(p,t,cost),armorIgnored:ignored,blockedByArmor:virtual?.lordRequest?null:!!blocked,damageIfHitBeforeOtherSkills:virtual?.lordRequest?null:blocked?0:damage,dodgesRequired:p.general.id==='lvbu'||p.general.id==='dongzhuo'&&t.general.sex==='f'||t.general.id==='dongzhuo'&&p.general.sex==='f'?2:1,fieryBowAvailable:!!bow,optionalFireConversion:weapon?.kind==='fan'&&nature==='normal'&&cost.length===1&&cost[0].kind==='sha',possibleRedirection:t.general.id==='daqiao'||t.general.id==='xiaoqiao'};
  })};
 });
 return {legalChoicesAreAuthoritative:true,handEconomy,...(preview?{actionPreviews:actionPreviews(game,p,q,(g,a,options)=>tacticalFacts(g,a,{...q,options},{preview:false}).attackChoices)}:{}),turnBonuses:{baredBodiedActive:ownTurn&&!!game.used.luoyi,wineBonus:p.wineBoost||0,expireAtTurnEnd:true},attackPlayRestrictionsApply:ownTurn&&q.zone==='turn',responsesDoNotConsumeAttackLimit:true,attackUsesRemaining:ownTurn&&Number.isFinite(limit)?Math.max(0,limit-spent):null,unlimitedAttacks:!Number.isFinite(limit),attackForbidden:game.attackForbidden(p),currentRange:game.range(p),distances,attackChoices:attacks,caveat:'Attack range and usage limits apply to Attack plays, not Attack responses in Duel or Barbarian Invasion. Damage figures assume a hit and exclude responses, judgments, optional prevention, damage transfer and chained spread. Reconsider after every result. Future plan steps are intentions, never pre-authorized actions.'};
}
