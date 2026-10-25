import {META,attackNature} from './cards.mjs';

export const maneuverSkills={
 async prepareAttack(source,v){
  if(v.prepared)return v;
  const next={...v,prepared:true,nature:v.nature||attackNature(v.cards?.[0]?.kind),damageBonus:source.wineBoost||0};
  source.wineBoost=0;
  // Feathered Fan converts an ordinary physical Attack, not a skill conversion.
  if(next.nature==='normal'&&source.equip.weapon?.kind==='fan'&&v.cards?.length===1&&v.cards[0].kind==='sha'&&v.id===v.cards[0].id&&await this.yes(source,'Feathered Fan: Use this Attack as Fire Attack?'))next.nature='fire';
  return next;
 },
 async attackDamage(source,target,v,ignoreArmor){return this.damage(source,target,1+(v.damageBonus||0),{kind:'sha',nature:v.nature||'normal',ignoreArmor,cards:v.cards||[]});},
 async fireTactic(source,target,cards){
  if(!target.hand.length)return;
  const [id]=await this.ask(target,'Flame Tactic: Reveal one hand card',target.hand.map(c=>({id:c.id,label:this.label(c)})),{zone:'cards'});
  if(this.stopped)return;
  const physical=target.hand.find(c=>c.id===id);if(!physical)return;const revealed=this.effectiveCard(target,physical);this.recordCards(target,[revealed],'Revealed · Flame Tactic');
  this.log(`${target.name} reveals ${this.label(revealed)} for Flame Tactic.`);
  this.effect(target,target,'reveal',this.label(revealed));
  const matches=source.hand.filter(c=>this.effectiveCard(source,c).suit===revealed.suit);
  const [costId]=await this.ask(source,`Flame Tactic: Discard a ${revealed.suit} hand card to deal fire damage?`,[...matches.map(c=>({id:c.id,label:this.label(c)})),{id:'pass',label:'Do not deal damage'}],{fallback:['pass'],zone:'cards'});
  const cost=matches.find(c=>c.id===costId);if(!cost)return;
  await this.remove(source,cost);await this.damage(source,target,1,{nature:'fire',cards});
 },
 async recastChains(p,id){const card=p.hand.find(c=>c.id===id&&(c.kind==='chain'||(p.general.id==='pangtong'&&this.effectiveCard(p,c).suit==='♣')));if(!card)return;await this.remove(p,card);this.draw(p,1);this.log(`${p.name} recasts Iron Chains and draws 1 card.`);},
 async frostSword(source,target){
  if(![...target.hand,...Object.values(target.equip)].length||!await this.yes(source,'Frost Sword: Prevent this damage and discard up to 2 target hand/equipment cards?'))return false;
  for(let i=0;i<2;i++){
   if(![...target.hand,...Object.values(target.equip)].length)break;
   const card=await this.chooseArea(source,target,`Frost Sword: Discard target card ${i+1}/2`,{includeJudge:false});if(card)await this.remove(target,card);
  }
  this.log(`${source.name} prevents the Attack damage with Frost Sword.`);this.effect(source,target,'spell','Frost Sword');return true;
 },
};
