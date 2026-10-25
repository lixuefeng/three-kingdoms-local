import {actionSelections,atomicSkills} from './action-selections.mjs';
import {BotKnowledge,tacticalFacts} from './bot-knowledge.mjs';
import {eventText,generalName} from './public/event-history.mjs';
import {extraExpansionSkills} from './extra-expansion-skills.mjs';
import {expansionSkills} from './expansion-skills.mjs';
import {botDecision} from './bots.mjs';
import {validSkillPlan,skillPlanParts,actionSelectionIds} from './public/skill-plan.mjs';
import {maneuverSkills} from './maneuver-skills.mjs';
import {classicSkills} from './classic-skills.mjs';
import {randomUUID} from 'node:crypto';
import {META,GENERALS,ALL_GENERALS,ROLES,ROLE_NAMES,makeDeck,shuffle,red,info,isAttack,attackNature} from './cards.mjs';
export class Finished extends Error {}
export class Game {
 constructor(players,{ask,onChange=()=>{},onEvent=()=>{},seconds=60,seedDeck,maneuver=false,expandedGenerals=false,bannedGenerals=[],testing=false,pause,responseWindowMs=null,llmProvider=null,botPacing=true,publicChatFor=null}={}){
  this.onEvent=onEvent;this.publicChatFor=publicChatFor;this.llmProvider=llmProvider;this.botPacing=botPacing;this.botAbort=new AbortController();this.botRequests=new Map();
  this.delayedPlacements=new Map();
  this.players=players.map(p=>({...p,hand:[],equip:{},judge:[],alive:true,hp:4,maxHp:4,wounds:[],nirvanaUsed:false,chained:false,wineBoost:0}));
  this.botKnowledge=new Map(this.players.filter(p=>p.bot).map(p=>[p.id,new BotKnowledge(p.id)]));
  this.stats=Object.fromEntries(players.map(p=>[p.id,{kills:0,damage:0,damageTaken:0}]));this.eliminations=[];this.matchId=randomUUID();this.responseWindowMs=responseWindowMs??5000;this.autoResponseWindow=responseWindowMs==null;this.responseWindow=null;this.cancelResponseWindow=null;this.pause=pause||(ask?async()=>{}:ms=>new Promise(resolve=>setTimeout(resolve,ms)));this.discardReview=null;this.testing=!!testing;this.expandedGenerals=!!expandedGenerals;this.bannedGenerals=new Set(bannedGenerals);this.generalPool=(this.expandedGenerals?ALL_GENERALS:GENERALS).filter(g=>!this.bannedGenerals.has(g.id));this.pindianState=null;this.bluffState=null;this.negationPassTurn=new Map();this.askAdapter=ask;this.onChange=onChange;this.seconds=seconds;this.maneuver=!!maneuver;this.deck=seedDeck||shuffle(makeDeck({maneuver:this.maneuver}));this.totalCards=this.deck.length;this.discard=[];this.table=[];this.reserved=[];this.logs=[];this.effects=[];this.judgments=[];this.recentCards=[];this.actionHistory=[];this.actionGroup=null;this.movements=[];this.current=null;this.phase='General Selection';this.winner=null;this.turn=0;this.used={};this.prompts=new Map();this.plannedPlays=new Map();this.decision=null;this.decisions=new Map();this.stopped=false;
 }
 effect(source,target,kind,label,amount,nature,detail){this.effects.push({id:randomUUID(),sourceId:source?.id||null,targetId:target?.id||null,kind,label,amount,nature,groupId:this.actionGroup?.id,...(detail?{detail}: {})});this.effects=this.effects.slice(-32);this.remember({type:'effect',sourceId:source?.id||null,targetId:target?.id||null,kind,label,amount,nature,...(detail?{detail}:{})});this.changed();}
 trigger(p,name,result){this.effect(p,p,'trigger',name,undefined,undefined,result);this.log(`${p.name} · ${name}${result?' · '+result:''}`,{eventType:'trigger',actorId:p.id,actorName:p.name,skill:name});}
 log(message,details={}){this.logs.push({...details,id:randomUUID(),message,displayMessage:eventText(message,this.players),turn:this.turn,turnPlayerId:this.current?.id||null,turnGeneral:this.current?generalName(this.current):null,groupId:this.actionGroup?.id||null,groupLabel:this.actionGroup?.label||null});this.logs=this.logs.slice(-2000);this.remember({type:'log',...this.logs.at(-1),text:eventText(message,this.players)});this.changed();}
 remember(event){const e={turn:this.turn,turnPlayerId:this.current?.id||null,actionLabel:this.actionGroup?.label,phase:this.phase,groupId:this.actionGroup?.id,...event};this.onEvent(e);for(const knowledge of this.botKnowledge?.values()||[])knowledge.consume(e);}
 rememberChat(message,botIds){for(const id of botIds)this.botKnowledge.get(id)?.consume({type:'chat',turn:this.turn,turnPlayerId:this.current?.id||null,speakerId:message.senderId,name:message.name,text:message.text,ai:!!message.ai});}
 changed(){for(const [id,k] of this.botKnowledge||[]){const p=this.players.find(p=>p.id===id);k.observeOwn({turn:this.turn,current:this.current?.id,phase:this.phase,player:{...p,hand:p.hand.map(c=>this.cardInfo(p,c))}});}this.onChange();}
 alive(){return this.players.filter(p=>p.alive);}
 order(start=this.current){const i=this.players.indexOf(start);return Array.from({length:this.players.length},(_,n)=>this.players[(Math.max(i,0)+n)%this.players.length]).filter(p=>p.alive);}
 label(c){return `${c.suit}${c.rank===1?'A':c.rank===11?'J':c.rank===12?'Q':c.rank===13?'K':c.rank} ${META[c.kind][0]}`;}
 option(p){return {id:p.id,label:`${p.name} · ${p.general?.name||''} (${p.hp}/${p.maxHp})`};}
 async ask(p,title,options,{min=1,max=1,fallback,zone='options',timeout=this.seconds,context=null}={}){
  if(this.stopped||this.winner)throw new Finished();
  if(!options.length)return [];
  if(options.length===1&&options[0].id==='pass'&&min<=1&&max>=1)return ['pass'];
  const startedAt=Date.now();
  const q={id:randomUUID(),title,options,min,max,zone,context,startedAt,deadline:timeout?startedAt+timeout*1000:null};
  const defaults=fallback??(min?options.slice(0,min).map(o=>o.id):[]);
  // Public timing information excludes the private prompt, options, and card IDs.
  const action=context?.kind==='attack-response'?{kind:'attack',sourceId:context.sourceId,targetId:p.id,label:context.label}:null;
  this.decisions.set(p.id,{playerId:p.id,startedAt,deadline:q.deadline,...(action?{action}: {})});
  this.decision=this.decisions.values().next().value||null;
  try{
   if(this.askAdapter){this.changed();return await this.askAdapter(p,q,defaults);}
   if(p.bot){this.changed();if(this.botPacing)await new Promise(r=>setTimeout(r,q.zone==='turn'?2200:q.zone==='general'?1800:1400));if(this.stopped||this.winner)throw new Finished();return await this.decideBot(p,q,defaults);}
   return await new Promise(resolve=>{
    const timer=timeout?setTimeout(()=>this.answer(p.id,q.id,defaults),timeout*1000):null;
    this.prompts.set(p.id,{...q,resolve,timer});this.changed();
   });
  }finally{this.decisions.delete(p.id);this.decision=this.decisions.values().next().value||null;this.changed();}
 }
 async decideBot(p,q,defaults){
  if(p.botMode==='llm'&&this.llmProvider?.enabled){
   const shared=this.prompts.get(p.id)?.id===q.id,modelProfile=p.botModel;
   const ownView=this.view(p.id),knowledge=this.botKnowledge.get(p.id);const agentState=knowledge?{knowledge:knowledge.snapshot(ownView),tactics:tacticalFacts(this,p,q)}:null;
   const request=new AbortController();this.botRequests.set(p.id,request);let decision;
   const invalidReason=()=>this.stopped||this.winner?'match-ended':p.botMode!=='llm'||p.botModel!==modelProfile?'model-switched':q.deadline&&Date.now()>=q.deadline?'decision-expired':shared&&this.prompts.get(p.id)?.id!==q.id?'window-closed':!shared&&!this.decisions.has(p.id)?'decision-expired':null;
   try{decision=await this.llmProvider.decide({view:{...ownView,publicChat:this.publicChatFor?.(p)||[]},agentState,playerId:p.id,prompt:q,matchId:this.matchId,modelProfile,signal:AbortSignal.any([this.botAbort.signal,request.signal]),isCurrent:()=>!invalidReason(),invalidReason});}finally{if(this.botRequests.get(p.id)===request)this.botRequests.delete(p.id);}
   if(this.stopped||this.winner)throw new Finished();
   if(decision&&p.botMode==='llm'&&p.botModel===modelProfile){this.onEvent({type:'bot-decision',turn:this.turn,playerId:p.id,source:'model',promptId:q.id,zone:q.zone,ids:decision.ids,targets:decision.targets,costs:decision.costs||[],mode:decision.mode});knowledge?.updatePlan(decision.plan,ownView,q);knowledge?.noteChoice(q,decision);this.llmProvider.recordPlan?.(this.matchId,p.id,q.id,knowledge?.plan);if(q.zone==='turn')this.plannedPlays.set(p.id,{optionId:decision.ids[0],targetIds:decision.targets||[],costIds:decision.costs||[],mode:decision.mode,chatIntent:decision.chatIntent});return decision.ids;}
  }
  const result=this.botAnswer(p,q,defaults);const plan=this.plannedPlays.get(p.id);this.onEvent({type:'bot-decision',turn:this.turn,playerId:p.id,source:p.botMode==='llm'?'fallback':'practice',promptId:q.id,zone:q.zone,ids:result,targets:plan?.targetIds||[],costs:plan?.costIds||[],mode:plan?.mode});this.botKnowledge.get(p.id)?.noteChoice(q,{ids:result,targets:plan?.targetIds||[],costs:plan?.costIds||[],mode:plan?.mode});return result;
 }
 botAnswer(p,q,defaults){
  const decision=botDecision(this.view(p.id),p.id,q,this.used);
  if(!decision)return defaults;
  if(decision.targets)this.plannedPlays.set(p.id,{optionId:decision.ids[0],targetIds:decision.targets,costIds:decision.costs||[],mode:decision.mode});
  return decision.ids;
 }
 answer(pid,qid,ids){
  const q=this.prompts.get(pid);if(!q||q.id!==qid)throw new Error('That decision has expired. Please use the current prompt.');
  if(!Array.isArray(ids)||ids.length<q.min||ids.length>q.max||new Set(ids).size!==ids.length||ids.some(id=>!q.options.some(o=>o.id===id)))throw new Error('Invalid selection.');
  if(q.context?.kind==='optional-cost'&&ids.length&&ids.length!==q.context.cardCount)throw new Error('Select the required number of cards or Cancel.');
  if(q.zone==='skill-plan'&&!validSkillPlan(q.context,ids))throw new Error('Select the required cards and targets before confirming.');
  clearTimeout(q.timer);this.prompts.delete(pid);q.resolve(ids);this.changed();
 }
 setBotMode(pid,mode,model){const p=this.players.find(p=>p.id===pid&&p.bot);if(!p)return;p.botMode=mode;p.botModel=model;this.botRequests.get(pid)?.abort(new Error('model-switched'));}
 stop(){this.stopped=true;this.botAbort.abort(new Error('match-ended'));this.botKnowledge.clear();this.llmProvider?.forget(this.matchId);this.cancelResponseWindow?.();for(const q of this.prompts.values()){clearTimeout(q.timer);q.resolve([]);}this.prompts.clear();this.decisions.clear();this.plannedPlays.clear();this.decision=null;}
 targetSpec(p,kind,v){
  if(kind==='chain')return {targetIds:this.alive().map(t=>t.id),targetMin:1,targetMax:Math.min(2,this.alive().length)};
  if(!['sha','duel','dismantle','steal','indulgence','borrow','fireAttack','supply'].includes(kind))return {targetIds:[],targetMin:0,targetMax:0};
  const candidates=this.candidates(p,kind).filter(t=>kind==='sha'?this.canShaWithCost(p,t,v.cards):kind==='supply'?this.supplyWithCost(p,t,v.cards):true);
  const max=kind==='sha'?Math.min(candidates.length,(p.equip.weapon?.kind==='halberd'&&p.hand.length===1&&v.cards.length===1&&p.hand.includes(v.cards[0])?3:1)+(p===this.current&&this.used.tianyiWin?1:0)):1;
  return {targetIds:candidates.map(t=>t.id),targetMin:kind==='borrow'?2:1,targetMax:kind==='borrow'?2:max,...(kind==='borrow'?{secondaryTargets:Object.fromEntries(candidates.map(t=>[t.id,this.alive().filter(x=>this.canSha(t,x)).map(x=>x.id)]))}:{})};
 }
 answerPlay(pid,qid,optionId,targetIds=[],costIds=[],mode){
  const q=this.prompts.get(pid),option=q?.options.find(o=>o.id===optionId);
  if(!q||q.id!==qid||q.zone!=='turn'||!option)throw new Error('That play has expired or is not available.');
  if(!Array.isArray(targetIds)||new Set(targetIds).size!==targetIds.length||targetIds.length<(option.targetMin||0)||targetIds.length>(option.targetMax||0))throw new Error('Select the required number of legal targets.');
  if(option.secondaryTargets){if(!option.targetIds.includes(targetIds[0])||!option.secondaryTargets[targetIds[0]]?.includes(targetIds[1]))throw new Error('That target combination is not legal.');}
  else if(targetIds.some(id=>!option.targetIds?.includes(id)))throw new Error('That target is not legal.');
  if(option.actionSpec&&!validSkillPlan(option.actionSpec,actionSelectionIds({targetIds,costIds,mode}),{allowEmpty:false}))throw Error('Select the required skill cards, targets and mode.');
  if(!option.actionSpec&&(costIds.length||mode))throw Error('This action has no extra cost or mode.');
  this.plannedPlays.set(pid,{optionId,targetIds,costIds,mode});
  this.answer(pid,qid,[optionId]);
 }
 testDraw(kind,cardId=null){
  if(!this.testing)throw new Error('Testing mode is disabled.');
  const p=this.current,q=p&&this.prompts.get(p.id);
  if(this.phase!=='Play'||!p?.alive||q?.zone!=='turn')throw new Error('Wait for a human player’s Play Phase before drawing a test card.');
  const index=this.deck.findIndex(c=>cardId?c.id===cardId: c.kind===kind);if(index<0)throw new Error('That card is no longer in the draw pile.');
  const [card]=this.deck.splice(index,1);p.hand.push(card);clearTimeout(q.timer);q.id=randomUUID();q.options=this.playOptions(p);
  q.timer=q.deadline?setTimeout(()=>{if(this.prompts.get(p.id)===q)this.answer(p.id,q.id,['end']);},Math.max(1,q.deadline-Date.now())):null;
  this.log(`Testing: ${p.name} draws ${this.label(card)}.`);this.changed();return card;
 }
 async skillPlan(p,title,cards,targets,{kind,cardMin=1,cardMax=1,targetCount=1,firstTargetIds,skillName}={}){
  const context={kind,skillName,cardIds:cards.map(c=>c.id),targetIds:targets.map(t=>t.id),cardMin,cardMax,targetCount,...(firstTargetIds?{firstTargetIds}: {})};
  const ids=await this.ask(p,title,[...cards.map(c=>({id:c.id,label:this.label(c),cardIds:[c.id]})),...targets.map(t=>this.option(t))],{min:0,max:cardMax+targetCount,fallback:[],zone:'skill-plan',context});
  if(!validSkillPlan(context,ids))throw new Error('Invalid skill card and target selection.');return skillPlanParts(context,ids);
 }
 async yes(p,title){const active=(await this.ask(p,title,[{id:'yes',label:'Activate'},{id:'no',label:'Pass'}],{fallback:['no']}))[0]==='yes';if(active)this.effect(p,p,'skill',title.split(':')[0]);return active;}
 async target(p,title,candidates,{optional=false}={}){const opts=candidates.map(x=>this.option(x));if(optional)opts.push({id:'cancel',label:'Cancel'});const [id]=await this.ask(p,title,opts,{fallback:optional?['cancel']:undefined});return candidates.find(x=>x.id===id);}
 async selectGenerals(){
  if(this.generalPool.length<3*this.players.length-2)throw new Error('Too many banned generals for three choices per player.');
  const lord=this.players.find(p=>p.role==='lord'),reserved=this.testing?this.players.filter(p=>p.testGeneral).map(p=>p.testGeneral):[];
  if(new Set(reserved).size!==reserved.length||reserved.some(id=>!this.generalPool.some(g=>g.id===id)))throw new Error('Testing generals must be valid and unique.');
  const pool=shuffle(this.generalPool.filter(g=>!reserved.includes(g.id)));const preset=p=>this.testing&&p.testGeneral?this.generalPool.find(g=>g.id===p.testGeneral):null;
  const choose=async(p,candidates)=>{
   if(preset(p))return preset(p);
   const [id]=await this.ask(p,'Choose your general',candidates.map(g=>({id:g.id,label:g.name,description:`${g.kingdom} · ${g.hp} HP · ${g.skills}`})),{zone:'general'});
   if(this.stopped)throw new Finished();
   return candidates.find(g=>g.id===id)||candidates[0];
  };
  const assign=(p,g)=>{p.general=g;p.maxHp=g.hp+(p.role==='lord'?1:0);p.hp=p.maxHp;};
  const lordCandidates=preset(lord)?[preset(lord)]:pool.splice(0,3),chosen=await choose(lord,lordCandidates);
  assign(lord,chosen);pool.push(...lordCandidates.filter(g=>g!==chosen));this.changed();
  // Reserve disjoint candidate sets before opening concurrent private prompts.
  const offers=this.players.filter(p=>p!==lord).map(p=>({p,candidates:preset(p)?[preset(p)]:pool.splice(0,3)}));
  const results=await Promise.all(offers.map(async({p,candidates})=>({p,general:await choose(p,candidates)})));
  // Reveal the other generals together, after every selection is settled.
  if(this.stopped)throw new Finished();
  for(const {p,general}of results)assign(p,general);
  this.changed();
 }
 async start(){
  try{
   const roles=shuffle([...ROLES[this.players.length]]);this.players.forEach((p,i)=>p.role=roles[i]);
   await this.selectGenerals();if(this.stopped)return;
   for(const p of this.players)this.draw(p,4);
   this.current=this.players.find(p=>p.role==='lord');this.log('Roles assigned. The Lord takes the first turn.');
   while(!this.winner&&!this.stopped){const p=this.current;if(p.alive)await this.takeTurn(p);if(this.stopped)break;this.current=this.order(p).find(x=>x!==p)||p;}
  }catch(e){if(!(e instanceof Finished))throw e;}
 }
 beginAction(label){this.pindianState=null;this.bluffState=null;this.negationPassTurn.clear();if(this.actionGroup&&(this.recentCards.length||this.effects.some(e=>e.groupId===this.actionGroup.id))){this.actionHistory.push({...this.actionGroup,cards:this.recentCards.map(r=>({...r,card:{...r.card}})),effects:this.effects.filter(e=>e.groupId===this.actionGroup.id)});this.actionHistory=this.actionHistory.slice(-8);}this.actionGroup={id:randomUUID(),label,playerId:this.current?.id||null,turn:this.turn};this.recentCards=[];this.changed();}
 movement(from,to,count,kind){if(count>0){this.movements.push({id:randomUUID(),from:from?.id||null,to:to?.id||null,count,kind});this.movements=this.movements.slice(-64);this.remember({type:'movement',from:from?.id||null,to:to?.id||null,count,kind});if(kind==='draw'&&to)this.log(`${to.name} draws ${count} card(s).`,{eventType:'movement',actorId:to.id,actorName:to.name,movementKind:kind,count});else if(kind==='transfer'&&from&&to)this.log(`${from.name} → ${to.name}: transfers ${count} card(s).`,{eventType:'movement',actorId:from.id,actorName:from.name,recipientName:to.name,movementKind:kind,count});else if(kind==='discard'&&from)this.log(`${from.name} discards ${count} card(s).`,{eventType:'movement',actorId:from.id,actorName:from.name,movementKind:kind,count});this.changed();}}
 draw(p,n){const before=p.hand.length;for(let i=0;i<n;i++){
  if(!this.deck.length){this.deck=shuffle(this.discard.splice(0));if(!this.deck.length)break;this.log('The discard pile has been shuffled into the draw pile.');}
  p.hand.push(this.deck.shift());
 }this.movement(null,p,p.hand.length-before,'draw');this.changed();}
 async lianying(p,had){if(had&&p.alive&&!p.hand.length&&p.general.id==='luxun'&&await this.yes(p,'Second Wind: You lost your last hand card. Draw 1?')){this.draw(p,1);this.log(`${p.name} activates Second Wind.`);}}
 allCards(p){return [...p.hand,...Object.values(p.equip),...p.judge];}
 recordCards(p,cards,action='Played'){
  this.remember({type:'cards',playerId:p?.id||null,cards:cards.map(c=>this.cardInfo(p,c)),action});
  this.recentCards.push(...cards.map(c=>({id:randomUUID(),card:this.cardInfo(p,c),playerId:p?.id||null,action,turn:this.turn})));this.changed();
 }
 async remove(p,c,dest=this.discard){
  const had=p.hand.length;let equipmentLost=0,i=p.hand.indexOf(c);
  if(i>=0)p.hand.splice(i,1);
  else if((i=p.judge.indexOf(c))>=0)p.judge.splice(i,1);
  else{const slot=Object.keys(p.equip).find(k=>p.equip[k]===c);if(!slot)throw new Error('Card ownership violation');delete p.equip[slot];equipmentLost=1;}
  if(dest)dest.push(this.physical(c));const recipient=this.players.find(p=>p.hand===dest);this.movement(p,recipient||null,1,recipient?'transfer':'discard');if(dest===this.discard)this.recordCards(p,[c],'Discarded');this.changed();await this.afterLoss(p,had,equipmentLost,equipmentLost?[c]:[]);
 }
 async spend(p,cards,{action='Played'}={}){
  const had=p.hand.length;let lost=0;const lostEquipment=[];
  for(const c of cards){const i=p.hand.indexOf(c);if(i>=0)p.hand.splice(i,1);else{const slot=Object.keys(p.equip).find(k=>p.equip[k]===c);if(!slot)throw new Error('Invalid cost');delete p.equip[slot];lost++;lostEquipment.push(c);}this.table.push(c);}
  this.recordCards(p,cards,action);this.movement(p,null,cards.length,action==='Discarded'?'discard':'play');
  this.changed();await this.afterLoss(p,had,lost,lostEquipment);
 }
 finishCards(cards){for(const c of cards){const i=this.table.indexOf(c);if(i>=0){this.table.splice(i,1);this.discard.push(this.physical(c));}}this.changed();}
 distance(a,b){const ps=this.alive();let d=Math.abs(ps.indexOf(a)-ps.indexOf(b));d=Math.min(d,ps.length-d);return Math.max(1,d-(a.equip.minus?1:0)-(['machao','pangde'].includes(a.general.id)?1:0)+(b.equip.plus?1:0));}
 range(p){return p.equip.weapon?META[p.equip.weapon.kind][3]:1;}
 canSha(a,b){return a!==b&&this.canBeTarget(b,'sha')&&((a===this.current&&this.used.tianyiWin)||this.distance(a,b)<=this.range(a));}
 canShaWithCost(p,t,cards=[]){
  if(p===t||!this.canBeTarget(t,'sha'))return false;
  const ps=this.alive();let d=Math.abs(ps.indexOf(p)-ps.indexOf(t));d=Math.min(d,ps.length-d);
  d=Math.max(1,d-(p.equip.minus&&!cards.includes(p.equip.minus)?1:0)-(p.general.id==='machao'?1:0)+(t.equip.plus?1:0));
  const w=p.equip.weapon&&!cards.includes(p.equip.weapon)?p.equip.weapon:null;
  return (p===this.current&&this.used.tianyiWin)||d<=(w?META[w.kind][3]:1);
 }
 virtual(p,kind,{response=false}={}){
  const out=[];
  for(const c of p.hand){if(c.kind===kind||(kind==='sha'&&isAttack(c.kind)))out.push({id:c.id,cards:[c],kind,label:this.label(this.effectiveCard(p,c)),suit:this.effectiveCard(p,c).suit,nature:kind==='sha'?attackNature(c.kind):undefined});
   else if(kind==='sha'&&p.general.id==='guanyu'&&this.isRed(p,c))out.push({id:`wusheng:${c.id}`,cards:[c],kind,label:`God of War · ${this.label(this.effectiveCard(p,c))}`,suit:this.effectiveCard(p,c).suit});
   else if(p.general.id==='zhaoyun'&&((kind==='sha'&&c.kind==='shan')||(kind==='shan'&&isAttack(c.kind))))out.push({id:`longdan:${c.id}`,cards:[c],kind,label:`Braveheart · ${this.label(this.effectiveCard(p,c))}`,suit:this.effectiveCard(p,c).suit});
   else if(kind==='dismantle'&&p.general.id==='ganning'&&!this.isRed(p,c))out.push({id:`qixi:${c.id}`,cards:[c],kind,label:`Ambushment · ${this.label(this.effectiveCard(p,c))}`,suit:this.effectiveCard(p,c).suit});
  }
  for(const c of Object.values(p.equip)){
   if(kind==='sha'&&p.general.id==='guanyu'&&this.isRed(p,c))out.push({id:`wusheng:${c.id}`,cards:[c],kind,label:`God of War · ${this.label(this.effectiveCard(p,c))}`,suit:this.effectiveCard(p,c).suit});
   if(kind==='dismantle'&&p.general.id==='ganning'&&!this.isRed(p,c))out.push({id:`qixi:${c.id}`,cards:[c],kind,label:`Ambushment · ${this.label(this.effectiveCard(p,c))}`,suit:this.effectiveCard(p,c).suit});
  }
  if(kind==='sha'&&p.equip.weapon?.kind==='serpent')for(let i=0;i<p.hand.length;i++)for(let j=i+1;j<p.hand.length;j++){const a=p.hand[i],b=p.hand[j];out.push({id:`serpent:${a.id}:${b.id}`,cards:[a,b],kind,label:`Serpent Spear · ${this.label(a)} + ${this.label(b)}`,suit:this.isRed(p,a)===this.isRed(p,b)?this.effectiveCard(p,a).suit:null});}
  if(p.general.id==='zhenji'&&kind==='shan')for(const c of p.hand)if(!this.isRed(p,c)&&c.kind!=='shan')out.push({id:`qingguo:${c.id}`,cards:[c],kind,label:`Empress Dowager · ${this.label(this.effectiveCard(p,c))}`,suit:this.effectiveCard(p,c).suit});
  if(p.general.id==='daqiao'&&kind==='indulgence')for(const c of [...p.hand,...Object.values(p.equip)])if(c.suit==='♦'&&c.kind!=='indulgence')out.push({id:`guose:${c.id}`,cards:[c],kind,label:`Captivating · ${this.label(this.effectiveCard(p,c))}`,suit:this.effectiveCard(p,c).suit});
  if(p.general.id==='huatuo'&&kind==='tao'&&p!==this.current)for(const c of [...p.hand,...Object.values(p.equip)])if(this.isRed(p,c)&&c.kind!=='tao')out.push({id:`jijiu:${c.id}`,cards:[c],kind,label:`First Aid · ${this.label(this.effectiveCard(p,c))}`,suit:this.effectiveCard(p,c).suit});
  if(!(p.bot&&!response&&p===this.current&&kind==='sha'&&this.used.jijiangFailed)&&p.role==='lord'&&((kind==='sha'&&p.general.id==='liubei')||(kind==='shan'&&p.general.id==='caocao'))){const kingdom=kind==='sha'?'Shu':'Wei';if(this.alive().some(t=>t!==p&&t.general.kingdom===kingdom))out.push({id:kind==='sha'?'jijiang':'hujia',cards:[],kind,suit:null,lordRequest:true,label:kind==='sha'?'Influencing · Ask Shu allies for Attack':'Entourage · Ask Wei allies for Dodge'});}
  out.push(...this.expansionVirtual(p,kind),...this.extraVirtual(p,kind,{response}));return out;
 }
 async judgment(p,why,{keepBlack=false,keep=false}={}){
  const[c0]=this.reserveTop(1);if(!c0)return null;this.reserved.splice(this.reserved.indexOf(c0),1);this.table.push(c0);let c=c0;
  const reveal={id:randomUUID(),playerId:p.id,reason:why,startedAt:Date.now(),cards:[{card:this.cardInfo(p,c),by:null}],final:false};this.recordCards(p,[this.effectiveCard(p,c)],'Judgment · '+why);this.judgments.push(reveal);this.judgments=this.judgments.slice(-16);
  this.log(`${p.name} judges for ${why}: ${this.label(c)}`);
  for(const actor of this.order().filter(t=>['simayi','zhangjiao'].includes(t.general.id))){
   const ghost=actor.general.id==='zhangjiao',pool=ghost?[...actor.hand,...Object.values(actor.equip)].filter(x=>!this.isRed(actor,x)):actor.hand;
   if(!pool.length)continue;const skill=ghost?'Devilish Arts':'Necromancy';
   const[id]=await this.ask(actor,`${skill}: Replace ${p.name}'s ${why} judgment (${this.label(this.effectiveCard(p,c))})?`,[...pool.map(x=>({id:x.id,label:this.label(this.effectiveCard(actor,x))})),{id:'pass',label:'Keep the current judgment'}],{fallback:['pass'],context:{kind:'judgment-replace',judgedId:p.id,reason:why,currentCard:this.cardInfo(p,c)}});
   const replacement=pool.find(x=>x.id===id);if(!replacement)continue;
   await this.spend(actor,[replacement],{action:'Judgment · '+why+' · Replacement'});
   if(ghost)this.takeResolving(actor,[c]);else this.finishCards([c]);c=replacement;
   for(const r of this.recentCards)if(r.card.id===c.id&&r.action.startsWith('Judgment'))r.card=this.cardInfo(p,c);
   reveal.cards.push({card:this.cardInfo(p,c),by:actor.id});this.effect(actor,p,'skill',skill);this.log(`${actor.name} replaces the judgment with ${this.label(this.effectiveCard(p,c))}.`);
  }
  reveal.final=true;reveal.finalCardId=c.id;for(const r of this.recentCards)if(reveal.cards.some(x=>x.card.id===r.card.id)&&r.action.startsWith('Judgment'))r.action+=' · '+(r.card.id===c.id?'Final':'Replaced');this.changed();
  await this.pause(3500);if(this.stopped||this.winner)throw new Finished();
  const result=this.effectiveCard(p,c);
  if(keep||(keepBlack&&!red(result))){this.takeResolving(p,[c]);this.log(`${p.name} keeps the black Goddess of Luo River judgment.`);}
  else if(p.alive&&p.general.id==='guojia'&&await this.yes(p,'Jealousy of God: Take the final judgment card?')){this.takeResolving(p,[c]);this.log(`${p.name} takes the judgment with Jealousy of God.`);}
  this.finishCards([c]);return result;
 }
 async response(p,kind,title,options={}){
  const v=await this.requestCard(p,kind,title,options);if(!v)return false;if(kind!=='shan'||options.context?.kind!=='attack-response')this.effect(p,p,'announce',META[kind][0]);this.finishCards(v.cards);return true;
 }
 async sharedResponses(kind,title,optionsFor,context){
  if(this.stopped||this.winner)throw new Finished();
  const windowMs=this.autoResponseWindow&&this.llmProvider?.enabled&&this.alive().some(p=>p.bot&&p.botMode==='llm')?Math.max(15000,this.responseWindowMs):this.responseWindowMs;
  const people=this.order(),startedAt=Date.now(),deadline=startedAt+windowMs,responses=new Map(),ids=new Map(),bots=[];
  let finishEarly=()=>{};
  this.responseWindow={kind,title,startedAt,deadline};
  for(const p of people){
   const options=optionsFor(p),q={id:randomUUID(),title,options,min:1,max:1,zone:'options',context,startedAt,deadline,timer:null,resolve:answers=>{responses.set(p.id,answers[0]||'pass');if(responses.size===people.length)finishEarly();}};
   ids.set(p.id,q.id);if(!options.some(o=>!['pass','pass-turn'].includes(o.id))){responses.set(p.id,'pass');continue;}if(kind==='negation'&&this.negationPassTurn.get(p.id)===this.turn){responses.set(p.id,'pass');continue;}this.prompts.set(p.id,q);
   if(p.bot)bots.push(setTimeout(async()=>{try{if(this.prompts.get(p.id)?.id===q.id){const answer=await this.decideBot(p,q,['pass']);if(this.prompts.get(p.id)?.id===q.id)this.answer(p.id,q.id,answer[0]?[answer[0]]:['pass']);}}catch{if(this.prompts.get(p.id)?.id===q.id)this.answer(p.id,q.id,['pass']);}},this.botPacing?Math.min(1400,windowMs/2):0));
  }
  await new Promise(resolve=>{const timer=setTimeout(resolve,windowMs);finishEarly=()=>{clearTimeout(timer);resolve();};this.cancelResponseWindow=finishEarly;this.changed();if(responses.size===people.length)finishEarly();});
  for(const timer of bots)clearTimeout(timer);
  for(const p of people)if(this.prompts.get(p.id)?.id===ids.get(p.id))this.prompts.delete(p.id);
  for(const p of people)if(ids.has(p.id))this.botRequests.get(p.id)?.abort(new Error(Date.now()>=deadline?'decision-expired':'window-closed'));
  this.cancelResponseWindow=null;this.responseWindow=null;this.changed();
  if(this.stopped||this.winner)throw new Finished();
  return people.map(p=>({p,id:responses.get(p.id)||'pass'}));
 }
 async negateShared(target,title){let canceled=false;
  for(let depth=0;depth<109;depth++){
   const responses=await this.sharedResponses('negation',`${title} → ${target.name}: Waiting for Negation responses`,p=>[
    ...(this.negationPassTurn.get(p.id)===this.turn?[]:this.virtual(p,'negate',{response:true}).map(v=>({id:v.id,label:v.label,cardIds:v.cards.map(c=>c.id)}))),{id:'pass',label:'Pass once'},{id:'pass-turn',label:'Pass for this spell'}
   ],{kind:'negation',targetId:target.id,spell:title,canceled});
   for(const {p,id} of responses)if(id==='pass-turn')this.negationPassTurn.set(p.id,this.turn);
   const play=responses.find(({p,id})=>p.alive&&this.virtual(p,'negate',{response:true}).some(v=>v.id===id));
   if(!play)return canceled;
   const v=this.virtual(play.p,'negate',{response:true}).find(v=>v.id===play.id),committed=await this.commitVirtual(play.p,v);if(!committed)continue;this.effect(play.p,target,'spell','Negation');this.log(`${play.p.name} uses Negation.`);if(play.p.general.id==='huangyueying')this.draw(play.p,1);this.finishCards(committed.cards);canceled=!canceled;
  }return canceled;
 }
 async rescueShared(target){
  while(!this.survivesDying(target)){
   const choices=new Map(this.order().map(p=>[p.id,[...this.virtual(p,'tao',{response:true}),...(p===target?this.virtual(p,'wine',{response:true}):[])]]));
   const responses=await this.sharedResponses('rescue',`Rescue ${target.name}: Waiting for rescue responses`,p=>[...choices.get(p.id).map(v=>({id:v.id,label:v.label,cardIds:v.cards.map(c=>c.id)})),{id:'pass',label:'Pass'}],{kind:'rescue',targetId:target.id});
   const play=responses.find(({p,id})=>choices.get(p.id).some(v=>v.id===id));if(!play)return;
   const v=choices.get(play.p.id).find(v=>v.id===play.id),committed=await this.commitVirtual(play.p,v);if(!committed)continue;
   const bonus=v.kind==='tao'&&target.role==='lord'&&target.general.id==='sunquan'&&play.p!==target&&play.p.general.kingdom==='Wu'?1:0;
   await this.recover(target,1+bonus);this.finishCards(committed.cards);this.effect(play.p,target,'heal',META[v.kind][0]);this.log(`${play.p.name} rescues ${target.name} with ${META[v.kind][0]}.`);
  }
 }
 async negate(target,title){if(!this.askAdapter)return this.negateShared(target,title);let canceled=false;let start=this.current;
  // Ask every eligible player in seat order; each counterspell opens a fresh window.
  for(let depth=0;depth<109;depth++){
   let played=false;
   for(const p of this.order(start)){
    if(this.negationPassTurn.get(p.id)===this.turn)continue;
    const cards=this.virtual(p,'negate',{response:true});if(!cards.length)continue;
    const [id]=await this.ask(p,`${title} → ${target.name}: ${canceled?'Counter Negation to restore the effect?':'Use Negation to cancel this effect?'}`,[...cards.map(v=>({id:v.id,label:v.label,cardIds:v.cards.map(c=>c.id)})),{id:'pass',label:'Pass once'},{id:'pass-turn',label:'Pass for this spell'}],{fallback:['pass'],context:{kind:'negation',targetId:target.id,spell:title,canceled}});
    if(id==='pass-turn'){this.negationPassTurn.set(p.id,this.turn);continue;}
    const v=cards.find(v=>v.id===id);if(!v)continue;const committed=await this.commitVirtual(p,v);if(!committed)continue;this.effect(p,target,'spell','Negation');this.log(`${p.name} uses Negation.`);if(p.general.id==='huangyueying')this.draw(p,1);this.finishCards(committed.cards);canceled=!canceled;start=p;played=true;break;
   }
   if(!played)return canceled;
  }return canceled;
 }
 async damage(source,target,n,{kind='effect',ignoreArmor=false,cards=[],nature='normal',chain=false,transfer=false}={}){
  if(!target.alive||n<=0)return;
  if(!chain&&!transfer&&kind==='sha'&&source?.equip.weapon?.kind==='frost'&&await this.frostSword(source,target))return;
  if(!chain&&!transfer&&source===this.current&&this.used.luoyi&&(kind==='sha'||kind==='duel')){n++;this.trigger(source,'Bared Bodied','Damage +1');}
  if(!chain&&!transfer&&kind==='sha'&&source?.equip.weapon?.kind==='guding'&&!target.hand.length){n++;this.trigger(source,META.guding[0],'Damage +1');}
  if(!chain&&!transfer&&kind==='sha'&&source?.alive&&source.equip.weapon?.kind==='kylin'){
   const horses=[target.equip.plus,target.equip.minus].filter(Boolean);
   if(horses.length){const [id]=await this.ask(source,'Kirin Bow: Discard one of the target’s mounts?',[...horses.map(c=>({id:c.id,label:this.label(c)})),{id:'pass',label:'Pass'}],{fallback:['pass']});const c=horses.find(c=>c.id===id);if(c){this.trigger(source,'Kirin Bow','Mount discarded');await this.remove(target,c);this.log(`${source.name} activates Kirin Bow.`);}}
  }
  if(!ignoreArmor&&target.equip.armor?.kind==='rattan'&&nature==='fire'){n++;this.trigger(target,'Rattan Armor','Fire damage +1');}
  if(!ignoreArmor&&target.equip.armor?.kind==='silverLion'&&n>1){n=1;this.trigger(target,'Silver Lion Helmet','Damage reduced to 1');}
  if(await this.transferDamage(source,target,n,{kind,cards,nature,ignoreArmor:false}))return;
  const close=source&&this.distance(source,target)<=1;
  const spreads=nature!=='normal'&&target.chained&&!chain;
  const recipients=spreads?this.order().filter(p=>p!==target&&p.chained):[];
  if(nature!=='normal'&&target.chained){target.chained=false;this.log(`${target.name} is released from Iron Chains.`);}
  if(source&&source!==target)this.stats[source.id].damage+=n;this.stats[target.id].damageTaken+=n;this.effect(source,target,'damage','−'+n+' HP',n,nature);target.hp-=n;
  this.log(`${target.name} takes ${n}${nature==='normal'?'':' '+nature} damage${source?' from '+source.name:' (no source)'}.${chain?' [Iron Chains]':''}`);
  if(target.hp<=0)await this.dying(target,source);
  if(target.alive)await this.afterDamage(source,target,n,cards);
  await this.sourceDamageSkills(source,target,n,{kind,close,directAttack:kind==='sha'&&!chain&&!transfer});
  await this.extraSourceDamageSkills(source);
  // Each recipient starts with the original target's final damage. Its own armor applies;
  // source bonuses and weapon effects do not apply a second time.
  for(const recipient of recipients)if(recipient.alive&&recipient.chained)await this.damage(source,recipient,n,{kind,cards,nature,chain:true});
 }
 async dying(p,source){
  if(await this.expansionDying(p))return;
  this.log(`${p.name} is dying and needs ${1-p.hp} HP to survive.`);
  if(p.maxHp>0&&!this.askAdapter){await this.rescueShared(p);if(this.survivesDying(p))return;}
  else if(p.maxHp>0)for(const rescuer of this.order()){
   while(!this.survivesDying(p)&&rescuer.alive){const choices=[...this.virtual(rescuer,'tao',{response:true}),...(rescuer===p?this.virtual(rescuer,'wine',{response:true}):[])];if(!choices.length)break;
    const [id]=await this.ask(rescuer,`Rescue ${p.name}: ${1-p.hp} more HP needed`,[...choices.map(v=>({id:v.id,label:v.label,cardIds:v.cards.map(c=>c.id)})),{id:'pass',label:'Do not rescue'}],{fallback:['pass'],context:{kind:'rescue',targetId:p.id}});
    const v=choices.find(v=>v.id===id);if(!v)break;await this.commitVirtual(rescuer,v);const bonus=v.kind==='tao'&&p.role==='lord'&&p.general.id==='sunquan'&&rescuer!==p&&rescuer.general.kingdom==='Wu'?1:0;await this.recover(p,1+bonus);this.finishCards(v.cards);this.effect(rescuer,p,'heal',META[v.kind][0]);this.log(`${rescuer.name} uses ${META[v.kind][0]} on ${p.name}${bonus?' (Deliverance +1 HP)':''}.`);
   }if(this.survivesDying(p))return;
  }
  if(source&&source!==p)this.stats[source.id].kills++;this.eliminations.push({killerId:source?.id||null,victimId:p.id,turn:this.turn});p.alive=false;p.chained=false;p.wineBoost=0;this.log(`${p.name} is eliminated. Their role was ${ROLE_NAMES[p.role]}.`);
  this.movement(p,null,p.hand.length+Object.keys(p.equip).length+p.judge.length+(p.wounds?.length||0),'discard');this.recordCards(p,[...p.hand,...Object.values(p.equip),...p.judge,...(p.wounds||[])],'Discarded');this.discard.push(...p.hand,...Object.values(p.equip),...p.judge,...(p.wounds||[]));p.wounds=[];p.hand=[];p.equip={};p.judge=[];
  this.checkWin();
  if(source?.alive){if(p.role==='rebel'){this.draw(source,3);this.log(`${source.name} eliminated a Rebel and draws 3 cards.`);}else if(p.role==='loyal'&&source.role==='lord'){
   const had=source.hand.length,lostEquipment=Object.values(source.equip),lost=lostEquipment.length;this.recordCards(source,[...source.hand,...Object.values(source.equip)],'Discarded');this.discard.push(...source.hand,...Object.values(source.equip));source.hand=[];source.equip={};this.log('The Lord eliminated a Loyalist and discards all hand cards and equipment.');await this.afterLoss(source,had,lost,lostEquipment);
  }}this.changed();
 }
 checkWin(){const live=this.alive(),lord=live.find(p=>p.role==='lord');if(!lord)this.winner=live.length===1&&live[0].role==='spy'?'spy':'rebel';else if(!live.some(p=>p.role==='rebel'||p.role==='spy'))this.winner='lord';if(this.winner){this.phase='End';this.log(`Game over: ${this.winner==='lord'?'Lord and Loyalists':ROLE_NAMES[this.winner]} win!`);throw new Finished();}}
 async sha(source,target,v,{follow=false,redirect=true,armorIgnored}={}){
  if(!target.alive)return;
  v=await this.prepareAttack(source,v);
  if(redirect)target=await this.redirectAttack(source,target);
  this.effect(source,target,'attack',v.nature==='fire'?'Fire Attack':v.nature==='thunder'?'Thunder Attack':'Attack',undefined,v.nature);
  const ignoreArmor=armorIgnored??(source.equip.weapon?.kind==='qinggang');if(ignoreArmor&&target.equip.armor)this.trigger(source,'Blue Steel Sword','Target armor ignored');
  if(source.equip.weapon?.kind==='doubleSword'&&source.general.sex!==target.general.sex&&await this.yes(source,`Yin-Yang Swords: Activate against ${target.name}?`)){
   const [id]=await this.ask(target,'Yin-Yang Swords: Discard a hand card or let the attacker draw 1',[...target.hand.map(c=>({id:c.id,label:this.label(c)})),{id:'draw',label:'Let the attacker draw'}],{fallback:['draw']});const c=target.hand.find(c=>c.id===id);if(c)await this.remove(target,c);else this.draw(source,1);
  }
  let noShan=false;
  if(source.general.id==='huangzhong'&&source===this.current&&this.phase==='Play'&&(target.hand.length>=source.hp||target.hand.length<=this.range(source))&&await this.yes(source,`Fiery Bow: Prevent ${target.name} from playing Dodge?`))noShan=true;
  if(source.general.id==='machao'&&await this.yes(source,`Cavalry: Activate against ${target.name}?`)){const c=await this.judgment(source,'Cavalry');noShan=c&&red(c);}
  if(!ignoreArmor&&target.equip.armor?.kind==='renwang'&&v.suit&&!red({suit:v.suit})){this.trigger(target,'Nio Shield','Black Attack blocked');this.log(`${target.name}'s Nio Shield cancels the black Attack.`);return;}
  if(!ignoreArmor&&target.equip.armor?.kind==='rattan'&&v.nature==='normal'){this.trigger(target,'Rattan Armor','Normal Attack blocked');this.log(`${target.name}'s Rattan Armor cancels the normal Attack.`);return;}
  let dodged=!noShan;const required=source.general.id==='lvbu'||(source.general.id==='dongzhuo'&&target.general.sex==='f')||(target.general.id==='dongzhuo'&&source.general.sex==='f')?2:1;if(required===2)this.trigger(source.general.id==='lvbu'||source.general.id==='dongzhuo'?source:target,source.general.id==='lvbu'?'Unrivaled':'Lust','Two Dodges required');
  for(let i=0;i<required&&dodged&&source.alive&&target.alive;i++)dodged=await this.response(target,'shan',`${source.name} uses Attack on you: play Dodge (${i+1}/${required})`,{ignoreArmor,context:{kind:'attack-response',sourceId:source.id,label:v.nature==='fire'?'Fire Attack':v.nature==='thunder'?'Thunder Attack':'Attack'}});
  if(!source.alive||!target.alive)return;
  if(!dodged){await this.attackDamage(source,target,v,ignoreArmor);return;}
  if(!source.alive||!target.alive)return;
  if(source.general.id==='pangde'&&[...target.hand,...Object.values(target.equip)].length){const c=await this.chooseArea(source,target,'Horse Archery: Choose a card to discard, or Pass',{includeJudge:false,action:'dismantle',optional:true});if(c){this.effect(source,target,'skill','Horse Archery');await this.remove(target,c);}}
  this.effect(target,target,'dodge','Dodged');this.log(`${target.name} dodges the Attack.`,{eventType:'dodge-result',actorId:target.id});
  if(source.alive&&target.alive&&source.equip.weapon?.kind==='axe'){
   const costs=this.allCards(source).filter(c=>c!==source.equip.weapon&&!source.judge.includes(c));
   if(costs.length>=2){const ids=await this.ask(source,'Rock Cleaving Axe: Choose 2 cards to discard',costs.map(c=>({id:c.id,label:this.label(c)})),{min:0,max:2,fallback:[],zone:'cards',context:{kind:'optional-cost',cardCount:2}});if(!ids.length)return;this.trigger(source,'Rock Cleaving Axe','Discard 2 cards to force damage');for(const id of ids){const c=costs.find(c=>c.id===id);await this.remove(source,c);}await this.attackDamage(source,target,v,ignoreArmor);return;}
  }
  if(source.alive&&target.alive&&source.equip.weapon?.kind==='greenDragon'){
   const next=await this.requestCard(source,'sha','Green Dragon Blade: Attack the same target again?',{target});if(next){this.trigger(source,'Green Dragon Blade','Follow-up Attack');this.log(`${source.name} activates Green Dragon Blade.`);await this.sha(source,target,next,{follow:true});this.finishCards(next.cards);}
  }
 }
 candidates(p,kind){return this.alive().filter(t=>{
  if(kind==='sha')return this.canSha(p,t);
  if(kind==='chain')return true;
  if(kind==='fireAttack')return t.hand.length>(t===p?1:0);
  if(kind==='supply')return t!==p&&!t.judge.some(c=>c.kind==='supply')&&(p.general.id==='huangyueying'||this.distance(p,t)<=(p.general.id==='xuhuang'?2:1));
  if(kind==='duel')return t!==p&&this.canBeTarget(t,'duel');
  if(kind==='dismantle')return t!==p&&this.allCards(t).length;
  if(kind==='steal')return t!==p&&this.allCards(t).length&&t.general.id!=='luxun'&&(p.general.id==='huangyueying'||this.distance(p,t)<=1);
  if(kind==='indulgence')return t!==p&&t.general.id!=='luxun'&&!t.judge.some(c=>c.kind===kind);
  if(kind==='borrow')return t!==p&&t.equip.weapon&&this.alive().some(x=>this.canSha(t,x));
  return false;
 });}
 async chooseArea(actor,t,title,{includeJudge=true,includeEquip=true,action=null,optional=false}={}){
  const opts=[...t.hand.map((c,i)=>({id:`hidden:${i}`,label:`Hand · Hidden card ${i+1}`})),...(includeEquip?Object.values(t.equip).map(c=>({id:c.id,label:`Equipment · ${this.label(c)}`})):[]),...(includeJudge?t.judge.map(c=>({id:c.id,label:`Judgment · ${this.label(c)}`})):[])];
  if(optional)opts.push({id:'pass',label:'Pass'});const[id]=await this.ask(actor,title,opts,{fallback:optional?['pass']:undefined,zone:'area',context:{kind:'area',targetId:t.id,action}});return id?.startsWith('hidden:')?t.hand[Number(id.split(':')[1])]:this.allCards(t).find(c=>c.id===id);
 }
 async trick(p,t,kind,{cards=[]}={}){
  if(kind!=='duel')this.effect(p,t,'spell',META[kind][0]);
  if(kind==='duel')return this.resolveDuel(p,t,{cards});
  if(kind==='barbarian'&&['menghuo','zhurong'].includes(t.general.id)){this.trigger(t,t.general.id==='menghuo'?'Culprit':'Giant Elephant','Barbarian Invasion has no effect');return;}
  if(!t.alive||await this.negate(t,META[kind][0])){this.log(`${META[kind][0]} has no effect on ${t.name}.`);return;}
  if(['barbarian','arrows'].includes(kind)&&t.equip.armor?.kind==='rattan'){this.trigger(t,'Rattan Armor',META[kind][0]+' blocked');this.log(`${t.name}'s Rattan Armor cancels ${META[kind][0]}.`);return;}
  if(kind==='chain'){t.chained=!t.chained;this.effect(p,t,'chain',t.chained?'Chained':'Released');this.log(`${t.name} is ${t.chained?'chained':'released'} by Iron Chains.`);this.changed();}
  else if(kind==='fireAttack')await this.fireTactic(p,t,cards);
  else if(kind==='draw2')this.draw(t,2);
  else if(kind==='feast'){await this.recover(t);}
  else if(kind==='dismantle'||kind==='steal'){if(!this.allCards(t).length)return;const c=await this.chooseArea(p,t,`${META[kind][0]}: Choose a card from ${t.name}'s area`,{action:kind});if(c){const wasHidden=t.hand.includes(c);await this.remove(t,c,kind==='steal'?p.hand:this.discard);this.log(`${p.name} ${kind==='steal'?'takes':'discards'} ${wasHidden?'a hand card':META[c.kind][0]} from ${t.name}.`);}}
  else if(kind==='barbarian'||kind==='arrows'){if(!await this.response(t,kind==='barbarian'?'sha':'shan',`${META[kind][0]}: Play ${kind==='barbarian'?'Attack':'Dodge'}`))await this.damage(kind==='barbarian'?(this.barbarianSource||p):p,t,1,{cards});}
 }
 playOptions(p){const opts=[];
  for(const kind of Object.keys(META)){
   if(['shan','negate','fireSha','thunderSha'].includes(kind))continue;
   if(kind==='wine'&&this.used.wine)continue;
   if(kind==='sha'&&(this.attackForbidden(p)||this.used.sha>=this.attackLimit(p)))continue;
   if(['sha','duel','dismantle','steal','indulgence','borrow','fireAttack','supply'].includes(kind)&&!this.candidates(p,kind).length)continue;
   if(kind==='tao'&&p.hp>=p.maxHp)continue;
   if(kind==='lightning'&&p.judge.some(c=>c.kind==='lightning'))continue;
   const vs=this.virtual(p,kind).filter(v=>kind==='sha'?this.alive().some(t=>this.canShaWithCost(p,t,v.cards)):kind==='supply'?this.candidates(p,kind).some(t=>this.supplyWithCost(p,t,v.cards)):true);for(const v of vs)opts.push({id:`play:${kind}:${v.id}`,label:v.label,description:META[kind][2],cardIds:v.cards.map(c=>c.id),kind,...this.targetSpec(p,kind,v)});
  }
  for(const c of p.hand.filter(c=>c.kind==='chain'||(p.general.id==='pangtong'&&this.effectiveCard(p,c).suit==='♣')))opts.push({id:`recast:chain:${c.id}`,label:'Recast Iron Chains',description:'Discard this card and draw 1. This is not a spell use.',cardIds:[c.id],kind:'recast'});
  const g=p.general.id;
  if(g==='sunquan'&&!this.used.zhiheng&&[...p.hand,...Object.values(p.equip)].length)opts.push({id:'skill:zhiheng',label:'Equilibrium',description:'Discard any number of hand or equipment cards, then draw that many.'});
  if(g==='huanggai')opts.push({id:'skill:kurou',label:'Self Sacrifice',description:'Lose 1 HP, then draw 2 cards.'});
  if(g==='zhouyu'&&!this.used.fanjian&&p.hand.length)opts.push({id:'skill:fanjian',label:'Sowing Distrust',description:'Another character guesses a suit and gains a random card from your hand. A wrong guess deals 1 damage.'});
  opts.push(...this.generalPlayOptions(p));opts.push({id:'end',label:'End Play Phase'});for(const o of opts)if(atomicSkills.includes(o.id.slice(6))&&o.id.startsWith('skill:')){const spec=this.actionSpec(p,o.id.slice(6));o.actionSpec=spec;o.targetIds=spec.targetIds;o.targetMin=o.targetMax=spec.targetCount;}return opts;
 }
 publicChatSnapshot(){return this.players.map(p=>({id:p.id,general:p.general?.name||p.name,hp:p.hp,alive:p.alive,handCount:p.hand.length,equipment:Object.values(p.equip).map(c=>META[c.kind]?.[0]||c.kind)}));}
 async play(p,id){
  const before=this.publicChatSnapshot(),group=this.actionGroup?.id,logId=this.logs.at(-1)?.id,intent=this.plannedPlays.get(p.id)?.chatIntent;
  await this.playAction(p,id);
  if(!this.stopped&&this.actionGroup?.id!==group){const index=this.logs.findIndex(e=>e.id===logId);this.remember({type:'action-complete',actorId:p.id,label:this.actionGroup?.label||'Play',chatIntent:intent==='celebrate_if_successful'?intent:null,before,after:this.publicChatSnapshot(),publicEvents:this.logs.slice(index<0?-20:index+1).slice(-20).map(e=>e.displayMessage||e.message)});}
 }
 async playAction(p,id){
  const plan=this.plannedPlays.get(p.id);this.plannedPlays.delete(p.id);const planned=plan?.optionId===id?plan:null;
  if(id.startsWith('recast:chain:')){this.beginAction('Recast Iron Chains');return this.recastChains(p,id.slice('recast:chain:'.length));}
  if(id.startsWith('skill:'))return this.skill(p,id.slice(6),planned);
  const [,kind,...parts]=id.split(':');const vid=parts.join(':');let v=this.virtual(p,kind).find(v=>v.id===vid);if(!v)return;
  let targets=[];let victim;
  if(kind==='chain'){const ids=planned?planned.targetIds:await this.ask(p,'Iron Chains: Choose 1–2 characters (none to cancel)',this.alive().map(t=>this.option(t)),{min:0,max:Math.min(2,this.alive().length),fallback:[]});if(!ids.length)return;targets=this.order(p).filter(t=>ids.includes(t.id));}
  if(['sha','duel','dismantle','steal','indulgence','borrow','fireAttack','supply'].includes(kind)){
   const candidates=this.candidates(p,kind).filter(t=>kind==='sha'?this.canShaWithCost(p,t,v.cards):kind==='supply'?this.supplyWithCost(p,t,v.cards):true);
   if(planned){targets=candidates.filter(t=>kind==='borrow'?t.id===planned.targetIds[0]:planned.targetIds.includes(t.id));if(!targets.length)return;if(kind==='borrow')victim=this.players.find(t=>t.id===planned.targetIds[1]);}
   else if(kind==='sha'&&this.targetSpec(p,kind,v).targetMax>1){
    const ids=await this.ask(p,'Attack: Choose targets (or cancel)',candidates.map(x=>this.option(x)),{min:0,max:this.targetSpec(p,kind,v).targetMax,fallback:[]});targets=candidates.filter(x=>ids.includes(x.id));if(!targets.length)return;
   }else{const t=await this.target(p,`${META[kind][0]}: Choose a target`,candidates,{optional:true});if(!t)return;targets=[t];}
   if(kind==='borrow'&&!planned){victim=await this.target(p,'Borrowed Sword: Choose the Attack target',this.alive().filter(t=>this.canSha(targets[0],t)),{optional:true});if(!victim)return;}
  }
  this.beginAction(META[kind][0]);v=await this.commitVirtual(p,v);if(!v)return;this.log(`${p.name} uses ${META[kind][0]}${targets.length?' → '+targets.map(t=>t.name).join(', '):''}.`,{eventType:'action',actorId:p.id,cardKind:kind});
  if(p.general.id==='huangyueying'&&META[kind][1]==='trick'){this.trigger(p,'Cultivation','Draw 1 card');this.draw(p,1);}
  const type=META[kind][1];
  if(['weapon','armor','plus','minus'].includes(type)){this.effect(p,p,'announce',META[kind][0]);
   if(p.equip[type])await this.remove(p,p.equip[type]);p.equip[type]=v.cards[0];this.table.splice(this.table.indexOf(v.cards[0]),1);
  }else if(kind==='sha'){this.used.sha++;this.used.shaDuringPlay=true;await this.useAttack(p,targets,v);}
  else if(kind==='tao'){await this.recover(p);}
  else if(kind==='wine'){this.used.wine=true;p.wineBoost=(p.wineBoost||0)+1;this.effect(p,p,'wine','Wine +1 Attack');}
  else if(kind==='chain'){for(const t of targets)await this.trick(p,t,kind,{cards:v.cards});}
  else if(kind==='indulgence'||kind==='lightning'||kind==='supply'){
   const t=kind==='lightning'?p:targets[0],c=v.cards[0];this.effect(p,t,'spell',META[kind][0]);if(kind==='lightning')this.log(`${p.name} places Lightning in their own judgment area.`);this.delayedPlacements.set(c.id,{playerId:p.id,playerName:p.name});t.judge.push(c.kind===kind?c:{...c,kind,original:c});this.table.splice(this.table.indexOf(c),1);
  }else if(kind==='borrow'){
   const t=targets[0];this.effect(p,t,'spell','Borrowed Sword');if(!await this.negate(t,'Borrowed Sword')){
    const next=await this.requestCard(t,'sha',`Borrowed Sword: Attack ${victim.name} or surrender your weapon`,{target:victim,passLabel:'Surrender weapon'});
    if(next){await this.sha(t,victim,next);this.finishCards(next.cards);}else if(t.equip.weapon)await this.remove(t,t.equip.weapon,p.hand);
   }
  }else if(kind==='harvest'){
   for(const t of this.alive())this.effect(p,t,'spell','Bumper Harvest');const pool=[];for(let i=0;i<this.alive().length;i++){if(!this.deck.length)this.deck=shuffle(this.discard.splice(0));if(this.deck.length)pool.push(this.deck.shift());}
   this.table.push(...pool);this.log(`Bumper Harvest reveals: ${pool.map(c=>this.label(c)).join(', ')}`);
   for(const t of this.order(p)){if(!pool.length)break;if(await this.negate(t,'Bumper Harvest'))continue;const [cid]=await this.ask(t,'Bumper Harvest: Choose a card',pool.map(c=>({id:c.id,label:this.label(c)})),{zone:'harvest',context:{kind:'harvest'}});const i=pool.findIndex(c=>c.id===cid);const c=pool.splice(i,1)[0];t.hand.push(c);this.movement(null,t,1,'gain');this.table.splice(this.table.indexOf(c),1);this.log(`${t.name} takes ${this.label(c)}.`);}
   this.finishCards(pool);
  }else if(['barbarian','arrows','feast'].includes(kind)){if(kind==='barbarian'){this.barbarianSource=this.alive().find(t=>t.general.id==='menghuo')||p;if(this.barbarianSource!==p)this.trigger(this.barbarianSource,'Culprit','Barbarian damage source');}for(const t of this.order(p).filter(t=>kind==='feast'||t!==p))await this.trick(p,t,kind,{cards:v.cards});}
  else await this.trick(p,kind==='draw2'?p:targets[0],kind,{cards:v.cards});
  const finishing=v.cards.filter(c=>this.table.includes(c));this.finishCards(v.cards);
  if(kind==='barbarian'){const zhu=this.alive().find(t=>t!==p&&t.general.id==='zhurong');if(zhu)for(const c of finishing.filter(c=>c.kind==='barbarian')){const i=this.discard.indexOf(c);if(i>=0){this.discard.splice(i,1);zhu.hand.push(c);this.movement(null,zhu,1,'gain');this.trigger(zhu,'Giant Elephant','Obtained Barbarian Invasion');}}this.barbarianSource=null;}
  this.changed();
 }
 async skill(p,kind,plan=null){
  if(atomicSkills.includes(kind))return this.executeAction(p,kind,plan);
  if(kind==='kurou'){this.beginAction('Self Sacrifice');this.effect(p,p,'skill','Self Sacrifice');p.hp--;this.log(`${p.name} activates Self Sacrifice and loses 1 HP.`);if(p.hp<=0)await this.dying(p,null);if(p.alive)this.draw(p,2);}
 }
 async reviewDiscards(p){
  const startedAt=Date.now();this.discardReview={playerId:p.id,startedAt,deadline:startedAt+3000};this.changed();
  try{await this.pause(3000);}finally{this.discardReview=null;this.changed();}
  if(this.stopped||this.winner)throw new Finished();
 }
 async takeTurn(p){
  p.wineBoost=0;this.turn++;this.beginAction('Preparation');this.used={sha:0,shaDuringPlay:false};this.phase='Preparation';this.log(`Turn ${this.turn} · ${p.general.name}`);
  await this.prepareGeneral(p);if(!p.alive)return;
  const swift=await this.swiftFirst(p);if(!p.alive)return;
  this.phase='Judgment';this.beginAction('Judgment Phase');let skipPlay=false,skipDraw=swift;
  for(const c of (swift?[]:[...p.judge].reverse())){
   if(!p.alive)break;this.negationPassTurn.clear();p.judge.splice(p.judge.indexOf(c),1);this.table.push(c);this.changed();
   const canceled=await this.negate(p,META[c.kind][0]);
   if(c.kind==='indulgence'){
    if(!canceled){const j=await this.judgment(p,'Acedia');if(j&&j.suit!=='♥'){skipPlay=true;this.log(`${p.name} skips the Play Phase.`);}}this.finishCards([c]);
   }else if(c.kind==='supply'){
    if(!canceled){const j=await this.judgment(p,'Rations Depleted');if(j&&j.suit!=='♣'){skipDraw=true;this.log(`${p.name} skips the Draw Phase.`);}}this.finishCards([c]);
   }else{
    let hit=false;if(!canceled){const j=await this.judgment(p,'Lightning');hit=j?.suit==='♠'&&j.rank>=2&&j.rank<=9;}
    if(hit){await this.damage(null,p,3,{cards:[c],nature:'thunder'});this.finishCards([c]);}else{const next=this.order(p).find(t=>t!==p&&!t.judge.some(x=>x.kind==='lightning'));if(next){this.table.splice(this.table.indexOf(c),1);next.judge.push(c);this.effect(p,next,'spell','Lightning passes');this.log(`Lightning passes to ${next.name}.`);}else this.finishCards([c]);}
   }
  }
  if(!p.alive)return;
  this.phase='Draw';this.beginAction('Draw Phase');
  if(!skipDraw){
  let n=p.general.id==='zhouyu'?3:2;
  if(p.general.id==='xuchu'&&await this.yes(p,'Bared Bodied: Draw 1 fewer card for +1 Attack and Duel damage this turn?')){n--;this.used.luoyi=true;}
  if(!await this.drawGeneral(p)){this.draw(p,n);this.log(`${p.name} draws ${n} cards.`);}
  }
  skipPlay=skipPlay||await this.swiftSecond(p);if(!p.alive)return;
  if(!skipPlay){this.phase='Play';while(p.alive&&!this.stopped){const opts=this.playOptions(p);const [id]=await this.ask(p,'Your Play Phase',opts,{fallback:['end'],zone:'turn',timeout:this.seconds});if(id==='end'||!id)break;await this.play(p,id);}}
  if(!p.alive||this.stopped)return;
  this.phase='Discard';this.beginAction('Discard Phase');
  if(p.general.id==='lvmeng'&&!this.used.shaDuringPlay&&await this.yes(p,'Composure: Skip your Discard Phase?')){this.log(`${p.name} activates Composure.`);}else{
   const excess=p.hand.length-this.handLimit(p);if(excess>0){const ids=await this.ask(p,`Discard Phase: Discard ${excess} hand cards`,p.hand.map(c=>({id:c.id,label:this.label(c)})),{min:excess,max:excess,zone:'cards'});await this.spend(p,p.hand.filter(c=>ids.includes(c.id)),{action:'Discarded'});this.finishCards([...this.table]);this.log(`${p.name} discards ${excess} hand cards.`);await this.reviewDiscards(p);}
  }
  p.wineBoost=0;this.phase='End';await this.endGeneral(p);if(!p.alive)return;if(p.bot&&!this.askAdapter){this.changed();if(this.botPacing)await new Promise(r=>setTimeout(r,2500));if(this.stopped||this.winner)throw new Finished();}if(p.alive&&p.general.id==='diaochan'&&await this.yes(p,'Beauty Outshining the Moon: Draw 1 card at the end of your turn?')){this.draw(p,1);this.log(`${p.name} activates Beauty Outshining the Moon.`);}this.changed();
 }
 availability(p,prompt){
  if(!p)return null;
  const cards={};for(const c of p.hand){
   if(prompt?.options.some(o=>o.id===c.id||o.cardIds?.includes(c.id))){cards[c.id]=null;continue;}
   let reason=!p.alive?'You are eliminated.':!prompt?'Waiting for another player.':prompt.zone!=='turn'?'This card cannot answer the current request.':null;
   if(!reason){if(c.kind==='shan')reason='Dodge is a response card.';else if(c.kind==='negate')reason='Negation is used during a Negation window.';else if(c.kind==='tao'&&p.hp>=p.maxHp)reason='You already have full health.';else if(['sha','fireSha','thunderSha'].includes(c.kind))reason=(this.attackForbidden(p)||this.used.sha>=this.attackLimit(p))?'Attack already used this Play Phase.':'No legal target in your attack range.';else if(c.kind==='wine'&&this.used.wine)reason='Wine already used this Play Phase.';else if(c.kind==='lightning')reason='Lightning is already in your Judgment zone.';else reason='No legal target or use is available now.';}
   cards[c.id]=reason;
  }
  const skills={};for(const part of (p.general?.skills||'').split(/(?<=\.) (?=[A-Z][A-Za-z ()-]+:)/)){const i=part.indexOf(':');if(i<0)continue;const name=part.slice(0,i),desc=part.slice(i+1).trim();if(prompt?.options.some(o=>o.label===name))continue;
   const usedKey={'Equilibrium':'zhiheng','Sowing Distrust':'fanjian','Prodigal Healer':'qingnang','Betrothment':'jieyin','Lust':'lijian'}[name];
   skills[name]=!p.alive?'You are eliminated.':usedKey&&this.used[usedKey]?'Already used this Play Phase.':/Once per Play Phase|During your Play Phase/.test(desc)?prompt?.zone==='turn'?'Its card or target requirements are not met.':'Available during your Play Phase.':'Triggered or conversion skill · '+desc;
  }return {cards,skills};
 }
 view(pid){const viewer=this.players.find(p=>p.id===pid);const prompt=this.prompts.get(pid);return {
  availability:this.availability(viewer,prompt),pindian:this.pindianState,bluff:this.bluffState,expandedGenerals:this.expandedGenerals,actionHistory:this.actionHistory,matchId:this.matchId,testing:this.testing,actionGroup:this.actionGroup,movements:this.movements,responseWindow:this.responseWindow?{...this.responseWindow}:null,discardReview:this.discardReview?{...this.discardReview}:null,negationPassed:this.negationPassTurn.get(pid)===this.turn,maneuver:this.maneuver,totalCards:this.totalCards,decision:this.responseWindow?null:this.decision?{...this.decision}:null,decisions:this.responseWindow?[]:[...this.decisions.values()].map(d=>({...d})),current:this.current?.id,phase:this.phase,turn:this.turn,winner:this.winner,deckCount:this.deck.length,discardCount:this.discard.length,table:this.table.map(info),logs:this.logs,effects:this.effects,recentCards:this.recentCards.map(r=>({...r,card:{...r.card}})),judgments:this.judgments.map(j=>({...j,cards:j.cards.map(r=>({...r,card:{...r.card}}))})),
  players:this.players.map(p=>({id:p.id,name:p.name,alive:p.alive,chained:!!p.chained,wineBoost:p.wineBoost||0,hp:p.hp,maxHp:p.maxHp,wounds:(p.wounds||[]).map(info),nirvanaUsed:!!p.nirvanaUsed,general:p.general||null,role:p.id===pid||p.role==='lord'||!p.alive||this.winner?p.role:null,handCount:p.hand.length,hand:p.id===pid?p.hand.map(c=>this.cardInfo(p,c)):undefined,equip:Object.fromEntries(Object.entries(p.equip).map(([k,c])=>[k,this.cardInfo(p,c)])),judge:p.judge.map(c=>({...info(c),placedBy:this.delayedPlacements.get(c.id)||null}))})),
  prompt:prompt?{id:prompt.id,title:prompt.title,options:prompt.options,min:prompt.min,max:prompt.max,zone:prompt.zone,context:prompt.context,startedAt:prompt.startedAt,deadline:prompt.deadline}:null
 };}
}

Object.assign(Game.prototype,actionSelections,classicSkills,maneuverSkills,expansionSkills,extraExpansionSkills);
