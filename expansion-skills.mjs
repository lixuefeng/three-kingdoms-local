import {info,red,META} from './cards.mjs';
import {classicSkills} from './classic-skills.mjs';

export const expansionSkills={
 effectiveCard(p,c){return p?.general?.id==='xiaoqiao'&&c.suit==='♠'?{...c,suit:'♥',printedSuit:c.suit}:c;},
 cardInfo(p,c){return info(this.effectiveCard(p,c));},
 isRed(p,c){return red(this.effectiveCard(p,c));},
 hasBagua(p){return p.equip.armor?.kind==='bagua'||(!p.equip.armor&&p.general?.id==='wolong');},
 supplyWithCost(p,t,cards=[]){
  if(p.general.id==='huangyueying')return true;const ps=this.alive();let d=Math.abs(ps.indexOf(p)-ps.indexOf(t));d=Math.min(d,ps.length-d);
  d=Math.max(1,d-(p.equip.minus&&!cards.includes(p.equip.minus)?1:0)-(['machao','pangde'].includes(p.general.id)?1:0)+(t.equip.plus?1:0));return d<=(p.general.id==='xuhuang'?2:1);
 },
 attackLimit(p){return p.general.id==='zhangfei'||p.equip.weapon?.kind==='crossbow'?Infinity:1+(p===this.current&&this.used.tianyiWin?1:0);},
 attackForbidden(p){return p===this.current&&!!this.used.tianyiLost;},
 expansionVirtual(p,kind){
  const out=[],g=p.general.id;
  for(const c of [...p.hand,...Object.values(p.equip)]){
   const hand=p.hand.includes(c),black=!this.isRed(p,c);let skill;
   if(g==='xuhuang'&&kind==='supply'&&black&&['basic','weapon','armor','plus','minus'].includes(META[c.kind][1]))skill='Cut Off Rations';
   if(g==='pangtong'&&kind==='chain'&&hand&&this.effectiveCard(p,c).suit==='♣')skill='Chain Stratagem';
   if(g==='wolong'&&kind==='fireAttack'&&hand&&!black)skill='Fire Stratagem';
   if(g==='wolong'&&kind==='negate'&&hand&&black)skill='See Through';
   if(skill&&c.kind!==kind)out.push({id:`convert:${kind}:${c.id}`,cards:[c],kind,suit:this.effectiveCard(p,c).suit,label:`${skill} · ${this.label(this.effectiveCard(p,c))}`});
  }return out;
 },
 async pindian(a,b,skill,committed={}){
  if(!a.alive||!b.alive||!a.hand.length||!b.hand.length)return null;
  const contest={skill,playerIds:[a.id,b.id],committed:[],result:null};this.pindianState=contest;this.changed();
  const choose=async p=>{if(p===a&&committed.cardId){contest.committed.push(p.id);this.changed();return p.hand.find(c=>c.id===committed.cardId);}const [id]=await this.ask(p,`${skill}: Select one hand card for Pindian against ${p===a?b.name:a.name}`,p.hand.map(c=>({id:c.id,label:this.label(this.effectiveCard(p,c)),cardIds:[c.id]})),{zone:'cards',context:{kind:'pindian',opponentId:p===a?b.id:a.id}});contest.committed.push(p.id);this.changed();return p.hand.find(c=>c.id===id);};
  const [ca,cb]=await Promise.all([choose(a),choose(b)]);if(this.stopped||!ca||!cb)return null;
  const hands=[a.hand.length,b.hand.length];a.hand.splice(a.hand.indexOf(ca),1);b.hand.splice(b.hand.indexOf(cb),1);this.table.push(ca,cb);
  this.recordCards(a,[this.effectiveCard(a,ca)],'Pindian · '+skill);this.recordCards(b,[this.effectiveCard(b,cb)],'Pindian · '+skill);
  this.movement(a,null,1,'play');this.movement(b,null,1,'play');
  const won=ca.rank>cb.rank;contest.result={cards:[this.cardInfo(a,ca),this.cardInfo(b,cb)],winnerId:ca.rank===cb.rank?null:won?a.id:b.id};this.effect(a,b,'skill',skill,undefined,undefined,`${ca.rank} vs ${cb.rank} · ${ca.rank===cb.rank?'Tie':(won?a.name:b.name)+' wins'}`);
  this.log(`${skill}: ${a.name} reveals ${this.label(this.effectiveCard(a,ca))}; ${b.name} reveals ${this.label(this.effectiveCard(b,cb))}. ${ca.rank===cb.rank?'Tie':(won?a.name:b.name)+' wins'}.`);
  await this.pause(3000);await this.afterLoss(a,hands[0]);await this.afterLoss(b,hands[1]);this.finishCards([ca,cb]);return won;
 },
 async prepareGeneral(p){
  await classicSkills.prepareGeneral.call(this,p);
  if(p.general.id==='sunjian'&&p.hp<p.maxHp){
   const x=p.maxHp-p.hp,plan=await this.selectAction(p,{kind:'yinghun-plan',skillName:'Heroic Spirit',selectionKind:'yinghun',cardIds:[],cardMin:0,cardMax:0,targetIds:this.alive().filter(t=>t!==p).map(t=>t.id),targetCount:1,modeIds:['mode:assist','mode:disrupt'],modeLabels:{'mode:assist':`Draw ${x}, discard 1`,'mode:disrupt':`Draw 1, discard ${x}`}});if(!plan)return;const t=this.players.find(t=>t.id===plan.targets[0]),mode=plan.modes[0].slice(5);
   this.effect(p,t,'skill','Heroic Spirit');this.draw(t,mode==='assist'?x:1);const n=Math.min(mode==='assist'?1:x,t.hand.length+Object.keys(t.equip).length);
   if(n){const ids=await this.ask(t,`Heroic Spirit: Discard ${n} cards`,[...t.hand,...Object.values(t.equip)].map(c=>({id:c.id,label:this.label(this.effectiveCard(t,c))})),{min:n,max:n,zone:'cards'});await this.spend(t,[...t.hand,...Object.values(t.equip)].filter(c=>ids.includes(c.id)),{action:'Discarded · Heroic Spirit'});this.finishCards([...this.table]);}
  }
 },
 async drawGeneral(p){
  if(p.general.id==='menghuo'&&p.hp<p.maxHp&&await this.yes(p,'Arise: Replace your draw with lost-HP reveals?')){
   const pool=this.reserveTop(p.maxHp-p.hp);for(const c of pool){this.reserved.splice(this.reserved.indexOf(c),1);this.table.push(c);}
   this.recordCards(p,pool,'Revealed · Arise');await this.pause(3000);
   const hearts=pool.filter(c=>c.suit==='♥');await this.recover(p,hearts.length);this.takeResolving(p,pool.filter(c=>c.suit!=='♥'));this.finishCards(hearts);return true;
  }
  return classicSkills.drawGeneral.call(this,p);
 },
 async afterDamage(source,p,n,cards){
  await classicSkills.afterDamage.call(this,source,p,n,cards);
 },
 async sourceDamageSkills(source,target,n,{kind,close,directAttack}){
  if(source?.alive&&source.general.id==='weiyan'&&close){this.trigger(source,'Rebellious Spine','Recover '+n+' HP');await this.recover(source,n);}
  if(source?.alive&&target.alive&&source.general.id==='zhurong'&&directAttack&&source.hand.length&&target.hand.length){
   const plan=await this.selectAction(source,{kind:'lieren-plan',skillName:'Fiery Blade',selectionKind:'lieren',cardIds:source.hand.map(c=>c.id),cardMin:1,cardMax:1,targetIds:[],targetCount:0,facts:{opponentId:target.id}});
   if(plan&&await this.pindian(source,target,'Fiery Blade',{cardId:plan.cards[0]})){if([...target.hand,...Object.values(target.equip)].length){const c=await this.chooseArea(source,target,'Fiery Blade: Choose a card to take',{includeJudge:false,action:'steal'});if(c)await this.remove(target,c,source.hand);}}
  }
 },
 async thunderStrike(p){
  if(!p.alive||p.general.id!=='zhangjiao')return;
  const t=await this.target(p,'Thunder Strike: Choose a character to judge, or Cancel',this.alive(),{optional:true});if(!t)return;
  this.effect(p,t,'skill','Thunder Strike');const c=await this.judgment(t,'Thunder Strike');if(c?.suit==='♠'&&t.alive)await this.damage(p,t,2,{nature:'thunder'});
 },
 async transferDamage(source,p,n,options){
  if(p.general.id!=='xiaoqiao')return false;
  const hearts=p.hand.filter(c=>this.effectiveCard(p,c).suit==='♥');if(!hearts.length)return false;
  const plan=await this.skillPlan(p,'Heavenly Scent: Discard a Heart and select a recipient, or Cancel',hearts,this.alive().filter(t=>t!==p),{kind:'tianxiang',skillName:'Heavenly Scent'});
  if(!plan.cards.length)return false;const c=hearts.find(c=>c.id===plan.cards[0]),t=this.players.find(t=>t.id===plan.targets[0]);
  await this.remove(p,c);this.effect(p,t,'skill','Heavenly Scent');await this.damage(source,t,n,{...options,transfer:true,chain:false});
  if(t.alive)this.draw(t,t.maxHp-Math.max(0,t.hp));return true;
 },
 survivesDying(p){return p.hp>0||(p.general.id==='zhoutai'&&p.wounds?.length===1-p.hp&&p.wounds.length>0&&new Set(p.wounds.map(c=>c.rank)).size===p.wounds.length);},
 async expansionDying(p){
  if(p.general.id==='pangtong'&&!p.nirvanaUsed&&await this.yes(p,'Nirvana: Use your once-per-game revival?')){
   p.nirvanaUsed=true;this.trigger(p,'Nirvana','Used · Recover to 3 HP');
   // Discard all areas as one cost before any equipment-loss effects resolve.
   const lost=this.allCards(p),had=p.hand.length,equipment=Object.values(p.equip);p.hand=[];p.equip={};p.judge=[];
   this.discard.push(...lost.map(c=>this.physical(c)));this.recordCards(p,lost,'Discarded · Nirvana');this.movement(p,null,lost.length,'discard');await this.afterLoss(p,had,equipment.length,equipment);p.chained=false;p.hp=Math.min(3,p.maxHp);this.draw(p,3);return true;
  }
  if(p.general.id==='zhoutai'&&await this.yes(p,'Undying: Reveal wounds and survive if their ranks are distinct?')){
   p.wounds??=[];const pool=this.reserveTop(Math.max(0,1-p.hp-p.wounds.length));
   for(const c of pool){this.reserved.splice(this.reserved.indexOf(c),1);p.wounds.push(c);}
   this.recordCards(p,pool,'Revealed · Undying');this.trigger(p,'Undying',this.survivesDying(p)?'Distinct ranks · Survives':'Duplicate ranks · Rescue needed');await this.pause(3000);return this.survivesDying(p);
  }
  return false;
 },
 async recover(p,n=1){
  if(!p.alive||n<=0)return;const before=p.hp;
  if(p.general.id==='zhoutai'&&p.wounds?.length){
   while(n>0&&p.hp<1-p.wounds.length){p.hp++;n--;}
   if(n>0&&p.wounds.length){
    const count=Math.min(n,p.wounds.length),ids=await this.ask(p,`Undying: Choose ${count} wound(s) to remove`,p.wounds.map(c=>({id:c.id,label:this.label(c),card:info(c)})),{min:count,max:count,zone:'public-cards',context:{kind:'wound-remove'}});
    for(const id of ids){const i=p.wounds.findIndex(c=>c.id===id);if(i<0)throw Error('Invalid wound selection');const [c]=p.wounds.splice(i,1);this.discard.push(c);this.recordCards(p,[c],'Discarded · Undying');p.hp++;n--;}
   }
  }
  p.hp=Math.min(p.maxHp,p.hp+n);if(p.hp>before){this.effect(p,p,'heal','+'+(p.hp-before)+' HP');this.log(`${p.name} recovers ${p.hp-before} HP.`);}
 },
 generalPlayOptions(p){
  const opts=classicSkills.generalPlayOptions.call(this,p),g=p.general.id;
  if(g==='taishici'&&!this.used.tianyi&&p.hand.length&&this.alive().some(t=>t!==p&&t.hand.length))opts.push({id:'skill:tianyi',label:'Justice of Heaven',description:'Pindian. Win: one extra Attack and target, no Attack distance limit. Otherwise no Attacks this turn.'});
  if(g==='dianwei'&&!this.used.qiangxi&&this.alive().some(t=>this.canDamageInRange(p,t)))opts.push({id:'skill:qiangxi',label:'Forceful Assault',description:'Lose 1 HP or discard a weapon, then deal 1 damage to someone in your resulting attack range.'});
  if(!this.used.huangtian&&p.general.kingdom==='Qun'&&p.hand.some(c=>['shan','lightning'].includes(c.kind))&&this.alive().some(t=>t!==p&&t.role==='lord'&&t.general.id==='zhangjiao'))opts.push({id:'skill:huangtian',label:'Yellow Heaven',description:'Give one Dodge or Lightning to Lord Zhang Jiao.'});
  return opts;
 },
 async skillGeneral(p,kind,plan=null){return this.executeAction(p,kind,plan);},
 canDamageInRange(p,t,cost=[]){
  if(p===t||!t.alive)return false;
  const ps=this.alive();let d=Math.abs(ps.indexOf(p)-ps.indexOf(t));d=Math.min(d,ps.length-d);
  d=Math.max(1,d-(p.equip.minus&&!cost.includes(p.equip.minus)?1:0)-(['machao','pangde'].includes(p.general.id)?1:0)+(t.equip.plus?1:0));
  const weapon=p.equip.weapon&&!cost.includes(p.equip.weapon)?p.equip.weapon:null;return d<=(weapon?META[weapon.kind][3]:1);
 },
};
