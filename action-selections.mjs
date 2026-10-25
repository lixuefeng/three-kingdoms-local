import {META} from './cards.mjs';
import {validSkillPlan,skillPlanParts,actionSelectionIds} from './public/skill-plan.mjs';
export const atomicSkills=['rende','jieyin','qingnang','qiangxi','tianyi','zhiheng','lijian','fanjian','huangtian'];
export const actionSelections={
 actionSpec(p,kind){
  const hand=p.hand,all=[...hand,...Object.values(p.equip)],others=this.alive().filter(t=>t!==p);
  const spec={actionKind:kind,kind:kind==='lijian'?'lust-plan':kind+'-plan',skillName:{rende:'Benevolence',jieyin:'Betrothment',qingnang:'Prodigal Healer',qiangxi:'Forceful Assault',tianyi:'Justice of Heaven',zhiheng:'Equilibrium',lijian:'Lust',fanjian:'Sowing Distrust',huangtian:'Yellow Heaven'}[kind],cardIds:[],cardMin:0,cardMax:0,targetIds:[],targetCount:0};
  let cards=[],targets=[];
  if(kind==='rende'){cards=hand;targets=others;Object.assign(spec,{cardMin:1,cardMax:hand.length,targetCount:1,facts:{givenThisPhase:this.used.rendeCount||0,healedThisPhase:!!this.used.rendeHealed,healThreshold:2,recovery:1,drawsCards:false,rule:'Giving 2 total this phase heals once; this skill never draws cards.'}});}
  if(kind==='jieyin'){cards=hand;targets=others.filter(t=>t.general.sex==='m'&&t.hp<t.maxHp);Object.assign(spec,{cardMin:2,cardMax:2,targetCount:1});}
  if(kind==='qingnang'){cards=hand;targets=this.alive().filter(t=>t.hp<t.maxHp);Object.assign(spec,{cardMin:1,cardMax:1,targetCount:1});}
  if(kind==='zhiheng'){cards=all;Object.assign(spec,{cardMin:1,cardMax:all.length});}
  if(kind==='lijian'){cards=all;targets=others.filter(t=>t.general.sex==='m');Object.assign(spec,{cardMin:1,cardMax:1,targetCount:2,firstTargetIds:targets.filter(t=>this.canBeTarget(t,'duel')).map(t=>t.id)});}
  if(kind==='fanjian'){targets=others;spec.targetCount=1;spec.facts={cardIsRandom:true,recipientGuessesAfterCommit:true};}
  if(kind==='huangtian'){cards=hand.filter(c=>['shan','lightning'].includes(c.kind));Object.assign(spec,{cardMin:1,cardMax:1,facts:{recipientId:others.find(t=>t.role==='lord'&&t.general.id==='zhangjiao')?.id}});}
  if(kind==='tianyi'){cards=hand;targets=others.filter(t=>t.hand.length);Object.assign(spec,{cardMin:1,cardMax:1,targetCount:1,facts:{commitOwnCardPrivately:true,opponentChoosesIndependently:true}});}
  if(kind==='qiangxi'){cards=all.filter(c=>META[c.kind][1]==='weapon');targets=others.filter(t=>this.canDamageInRange(p,t)||cards.some(c=>this.canDamageInRange(p,t,[c])));Object.assign(spec,{cardMin:0,cardMax:1,targetCount:1,modeIds:['mode:hp','mode:weapon'],modeLabels:{'mode:hp':'Lose 1 HP','mode:weapon':'Discard weapon'},cardMinByMode:{'mode:hp':0,'mode:weapon':1},cardMaxByMode:{'mode:hp':0,'mode:weapon':1},targetIdsByCard:Object.fromEntries(cards.map(c=>[c.id,targets.filter(t=>this.canDamageInRange(p,t,[c])).map(t=>t.id)])),targetIdsByMode:{'mode:hp':targets.filter(t=>this.canDamageInRange(p,t)).map(t=>t.id)}});}
  spec.cardIds=cards.map(c=>c.id);spec.targetIds=targets.map(t=>t.id);return spec;
 },
 async selectAction(p,spec,title=spec.skillName){
  const cards=[...p.hand,...Object.values(p.equip)],opts=[...spec.cardIds.map(id=>({id,label:this.label(cards.find(c=>c.id===id)),cardIds:[id]})),...spec.targetIds.map(id=>this.option(this.players.find(t=>t.id===id))),...(spec.modeIds||[]).map(id=>({id,label:spec.modeLabels?.[id]||id}))];
  const ids=await this.ask(p,title+': Select the cost, targets and mode together, or Cancel',opts,{min:spec.mandatory?1:0,max:spec.cardMax+spec.targetCount+(spec.modeIds?.length?1:0),fallback:spec.mandatory?[spec.defaultMode]:[],zone:'skill-plan',context:spec});
  if(!ids.length)return null;if(!validSkillPlan(spec,ids,{allowEmpty:false}))throw Error('Invalid combined skill selection.');return skillPlanParts(spec,ids);
 },
 async executeAction(p,kind,plan){
  if(!this.playOptions(p).some(o=>o.id==='skill:'+kind))return;
  const spec=this.actionSpec(p,kind);let chosen;
  if(plan){const ids=actionSelectionIds(plan);if(!validSkillPlan(spec,ids,{allowEmpty:false}))throw Error('This skill selection is no longer legal.');chosen=skillPlanParts(spec,ids);}else chosen=await this.selectAction(p,spec);
  if(!chosen||this.stopped||!p.alive)return;
  const cards=[...p.hand,...Object.values(p.equip)].filter(c=>chosen.cards.includes(c.id)),targets=chosen.targets.map(id=>this.players.find(t=>t.id===id)),t=targets[0],label=spec.skillName;
  this.beginAction(label);
  if(kind==='rende'){this.effect(p,t,'skill',label);await this.giveCards(p,t,cards);this.used.rendeCount=(this.used.rendeCount||0)+cards.length;this.log(`${p.name} gives ${cards.length} hand card(s) to ${t.name} with Benevolence.`);if(this.used.rendeCount>=2&&!this.used.rendeHealed){this.used.rendeHealed=true;await this.recover(p,1);}return;}
  if(kind==='zhiheng'){this.used.zhiheng=true;this.effect(p,p,'skill',label);await this.spend(p,cards,{action:'Discarded'});this.finishCards(cards);this.draw(p,cards.length);this.log(`${p.name} activates Equilibrium and replaces ${cards.length} cards.`);return;}
  if(kind==='jieyin'||kind==='qingnang'){this.used[kind]=true;this.effect(p,t,'skill',label);await this.spend(p,cards,{action:'Discarded'});this.finishCards(cards);if(kind==='jieyin')await this.recover(p);await this.recover(t);this.log(`${p.name} activates ${label} on ${t.name}.`);return;}
  if(kind==='lijian'){const source=targets[1];this.used.lijian=true;this.effect(p,t,'skill',label);this.effect(p,source,'skill',label);await this.remove(p,cards[0]);this.log(`${p.name} forces ${source.name} to Duel ${t.name} with Lust.`);await this.resolveDuel(source,t,{negatable:false});return;}
  if(kind==='qiangxi'){this.used.qiangxi=true;this.effect(p,t,'skill',label);if(cards.length)await this.remove(p,cards[0]);else{p.hp--;if(p.hp<=0)await this.dying(p,null);}if(t.alive)await this.damage(p,t,1);return;}
  if(kind==='tianyi'){this.used.tianyi=true;const won=await this.pindian(p,t,label,{cardId:cards[0].id});if(won===null)return;this.used.tianyiWin=won;this.used.tianyiLost=!won;return;}
  if(kind==='huangtian'){const lord=this.players.find(t=>t.id===spec.facts.recipientId);if(!lord?.alive)return;this.used.huangtian=true;this.effect(p,lord,'skill',label);await this.giveCards(p,lord,cards);return;}
  if(kind==='fanjian'){this.used.fanjian=true;this.effect(p,t,'skill',label);const [suit]=await this.ask(t,`${p.name} activates Sowing Distrust: Guess the suit of a random hand card`,['♠','♥','♣','♦'].map(id=>({id,label:id})),{context:{kind:'suit-guess',sourceId:p.id}});if(this.stopped||!p.alive||!t.alive||!p.hand.length)return;const c=p.hand[Math.floor(Math.random()*p.hand.length)];this.recordCards(p,[c],'Revealed · Sowing Distrust');await this.remove(p,c,t.hand);this.log(`${t.name} guesses ${suit} and receives ${this.label(c)}.`);if(c.suit!==suit)await this.damage(p,t,1);}
 }
};
