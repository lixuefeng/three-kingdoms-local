import {info,red,META,isAttack} from './cards.mjs';
import {expansionSkills} from './expansion-skills.mjs';
export const extraExpansionSkills={
 extraVirtual(p,kind,{response=false}={}){
  const out=[],g=p.general.id;
  if(g==='yanliangwenchou'&&kind==='duel'&&p===this.current&&this.used.shuangxiongColor!==undefined)for(const c of p.hand)if(this.isRed(p,c)!==this.used.shuangxiongColor)out.push({id:`shuangxiong:${c.id}`,cards:[c],kind,suit:this.effectiveCard(p,c).suit,label:`Heroic Duo · ${this.label(c)}`});
  if(g==='yuanshao'&&kind==='arrows')for(let i=0;i<p.hand.length;i++)for(let j=i+1;j<p.hand.length;j++){const a=p.hand[i],b=p.hand[j];if(this.effectiveCard(p,a).suit===this.effectiveCard(p,b).suit)out.push({id:`luanji:${a.id}:${b.id}`,cards:[a,b],kind,suit:this.effectiveCard(p,a).suit,label:`Raving Slash · ${this.label(a)} + ${this.label(b)}`});}
  if(g==='dongzhuo'&&kind==='wine')for(const c of p.hand)if(this.effectiveCard(p,c).suit==='♠')out.push({id:`jiuchi:${c.id}`,cards:[c],kind,suit:'♠',label:`Drunkard · ${this.label(c)}`});
  if(g==='yuji'&&(META[kind]?.[1]==='basic'||META[kind]?.[1]==='trick')&&(response||!['shan','negate'].includes(kind)))for(const c of p.hand)out.push({id:`guhuo:${kind}:${c.id}`,cards:[c],kind,suit:null,nature:kind==='sha'?'normal':undefined,bluff:true,label:`Bewilder · Claim ${META[kind][0]} with ${this.label(c)}`});
  if(g==='yuji'&&kind==='sha')for(const c of p.hand)for(const claimKind of ['fireSha','thunderSha'])out.push({id:`guhuo:${claimKind}:${c.id}`,cards:[c],kind,claimKind,suit:null,nature:claimKind==='fireSha'?'fire':'thunder',bluff:true,label:`Bewilder · Claim ${META[claimKind][0]} with ${this.label(c)}`});
  return out;
 },
 async drawGeneral(p){
  if(p.general.id==='yanliangwenchou'&&await this.yes(p,'Heroic Duo: Replace your draw with a judgment?')){
   const c=await this.judgment(p,'Heroic Duo',{keep:true});if(c)this.used.shuangxiongColor=red(c);this.trigger(p,'Heroic Duo',c?(red(c)?'Use black hand cards as Duel':'Use red hand cards as Duel'):'No judgment card');return true;
  }
  return expansionSkills.drawGeneral.call(this,p);
 },
 async swiftFirst(p){
  if(p.general.id!=='xiahouyuan')return false;
  const t=await this.target(p,'God Speed: Skip Judgment and Draw to Attack without a distance limit?',this.alive().filter(t=>t!==p&&this.canBeTarget(t,'sha')),{optional:true});if(!t)return false;
  this.beginAction('God Speed');this.effect(p,t,'skill','God Speed');await this.useAttack(p,[t],{id:'shensu:first',kind:'sha',cards:[],suit:null,nature:'normal'});return true;
 },
 async swiftSecond(p){
  if(p.general.id!=='xiahouyuan')return false;
  const costs=[...p.hand,...Object.values(p.equip)].filter(c=>['weapon','armor','plus','minus'].includes(META[c.kind][1]));if(!costs.length)return false;
  const targets=this.alive().filter(t=>t!==p&&this.canBeTarget(t,'sha'));if(!targets.length)return false;
  const plan=await this.skillPlan(p,'God Speed: Discard equipment and select an Attack target to skip Play, or Cancel',costs,targets,{kind:'shensu',skillName:'God Speed'});if(!plan.cards.length)return false;
  const c=costs.find(c=>c.id===plan.cards[0]),t=this.players.find(t=>t.id===plan.targets[0]);this.beginAction('God Speed');await this.remove(p,c);this.effect(p,t,'skill','God Speed');await this.useAttack(p,[t],{id:'shensu:second',kind:'sha',cards:[],suit:null,nature:'normal'});return true;
 },
 handLimit(p){return Math.max(0,p.hp)+(p.role==='lord'&&p.general.id==='yuanshao'?2*this.alive().filter(t=>t!==p&&t.general.kingdom==='Qun').length:0);},
 async endGeneral(p){
  if(p.general.id==='dongzhuo'&&this.alive().some(t=>t.hp<p.hp)){
   const [choice]=await this.ask(p,'Breakdown: Lose 1 HP or 1 maximum HP',[{id:'hp',label:'Lose 1 HP'},{id:'maxhp',label:'Lose 1 maximum HP'}],{fallback:['hp'],context:{kind:'collapse'}});
   this.trigger(p,'Breakdown',choice==='maxhp'?'Maximum HP −1':'HP −1');
   if(choice==='maxhp'){p.maxHp=Math.max(0,p.maxHp-1);p.hp=Math.min(p.hp,p.maxHp);}else p.hp--;
   if(p.hp<=0)await this.dying(p,null);
  }
 },
 async extraSourceDamageSkills(source){
  const lord=this.alive().find(t=>t.role==='lord'&&t.general.id==='dongzhuo');
  if(lord&&source?.alive&&source!==lord&&source.general.kingdom==='Qun'&&await this.yes(source,`Tyrant: Judge to heal Lord ${lord.name}?`)){
   const c=await this.judgment(source,'Tyrant');if(c?.suit==='♠'&&lord.alive)await this.recover(lord);
  }
 },
 async resolveBluff(p,v){
  const physical=v.cards[0];if(!p.hand.includes(physical))return null;
  const claim=v.claimKind||v.kind;const state={actorId:p.id,claimKind:claim,challengers:[],revealed:false,success:null};this.bluffState=state;this.log(`${p.name} claims ${META[claim][0]} with Bewilder.`);this.effect(p,p,'skill','Bewilder');
  const people=this.order().filter(t=>t!==p&&t.hp>0),replies=[];
  const options=[{id:'challenge',label:'Challenge Bewilder'},{id:'pass',label:'Believe · Do not challenge'}];
  const context={kind:'guhuo-challenge',actorId:p.id,claimKind:claim};
  for(const t of people){if(!t.alive||t.hp<=0)continue;const [id]=await this.ask(t,`Bewilder: ${p.name} claims ${META[claim][0]}. Challenge?`,options,{fallback:['pass'],context});replies.push({p:t,id});if(id==='challenge'){state.challengers.push(t.id);this.log(`${t.name} challenges Bewilder.`);}this.changed();}
  if(this.stopped)return null;
  state.challengers=replies.filter(x=>x.id==='challenge').map(x=>x.p.id);
  const truth=physical.kind===claim||(claim==='sha'&&isAttack(physical.kind)),success=!state.challengers.length||(truth&&physical.suit==='♥');
  await this.spend(p,[physical],{action:'Revealed · Bewilder · '+META[claim][0]});state.revealed=true;state.actual=info(physical);state.truth=truth;state.success=success;this.changed();
  this.log(`Bewilder reveals ${this.label(physical)}: ${truth?'true':'false'} claim; ${success?'resolves':'fails'}.`);await this.pause(3000);
  for(const {p:challenger,id}of replies)if(id==='challenge'&&challenger.alive){
   if(truth){challenger.hp--;this.effect(p,challenger,'skill','Bewilder',undefined,undefined,'Challenge lost · Lose 1 HP');if(challenger.hp<=0)await this.dying(challenger,null);}else this.draw(challenger,1);
  }
  if(!success){this.finishCards([physical]);return null;}
  return {...v,bluff:false,suit:physical.suit,nature:v.nature||'normal'};
 },
};
