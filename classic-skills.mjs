import {META,shuffle,red,info} from './cards.mjs';

// Classic standard-general hooks. Methods run on the authoritative Game instance.
export const classicSkills={
 physical(c){return c.original||c;},
 reserveTop(n){
  const cards=[];
  for(let i=0;i<n;i++){
   if(!this.deck.length){this.deck=shuffle(this.discard.splice(0));if(!this.deck.length)break;this.log('The discard pile has been shuffled into the draw pile.');}
   cards.push(this.deck.shift());
  }
  this.reserved.push(...cards);this.changed();return cards;
 },
 giveReserved(c,target){const i=this.reserved.indexOf(c);if(i<0)throw new Error('Reserved card no longer available');this.reserved.splice(i,1);target.hand.push(c);this.movement(null,target,1,'draw');this.changed();},
 takeResolving(p,cards){
  let count=0;for(const c of cards){const i=this.table.indexOf(c);if(i>=0){this.table.splice(i,1);p.hand.push(this.physical(c));count++;}}
  this.movement(null,p,count,'gain');this.changed();return count;
 },
 async afterLoss(p,hadHand,equipmentLost=0,lostCards=[]){
  if(p.alive&&p.hp<p.maxHp&&lostCards.some(c=>c.kind==='silverLion')){this.trigger(p,'Silver Lion Helmet','Recover 1 HP after losing armor');await this.recover(p);}
  await this.lianying(p,hadHand);
  if(p.alive&&p.general?.id==='sunshangxiang')for(let i=0;i<equipmentLost;i++){
   if(await this.yes(p,'Daredevil: You lost an equipped card. Draw 2?')){this.draw(p,2);this.log(`${p.name} activates Daredevil and draws 2.`);}
  }
 },
 recover(p,n=1){if(!p.alive)return;const before=p.hp;p.hp=Math.min(p.maxHp,p.hp+n);if(p.hp>before){this.effect(p,p,'heal','+'+(p.hp-before)+' HP');}if(p.hp>before)this.log(`${p.name} recovers ${p.hp-before} HP.`);},
 canBeTarget(p,kind){return p.alive&&!(p.general?.id==='zhugeliang'&&!p.hand.length&&['sha','duel'].includes(kind));},
 async afterDamage(source,p,n,cards){
  if(!p.alive)return;
  if(p.general.id==='caocao'&&cards.some(c=>this.table.includes(c))&&await this.yes(p,'Treachery: Take the card(s) that caused this damage?')){
   const count=this.takeResolving(p,cards);this.log(`${p.name} activates Treachery and takes ${count} card(s).`);
  }
  if(p.general.id==='simayi'&&source?.alive&&[...source.hand,...Object.values(source.equip)].length){
   const c=await this.chooseArea(p,source,'Retaliation: Choose a card to take, or Pass',{includeJudge:false,optional:true});if(c){this.effect(p,source,'skill','Retaliation');await this.remove(source,c,p.hand);this.log(`${p.name} takes a card from ${source.name} with Retaliation.`);}
  }
  if(p.general.id==='xiahoudun'&&source?.alive&&await this.yes(p,'Staucness: Judge to retaliate against the damage source?')){
   const c=await this.judgment(p,'Staucness');
   if(c&&c.suit!=='♥'&&source.alive){this.effect(p,source,'skill','Staucness');
    const selected=await this.selectAction(source,{kind:'staucness-plan',skillName:'Staucness',selectionKind:'staucness',cardIds:source.hand.map(c=>c.id),targetIds:[],targetCount:0,cardMin:0,cardMax:2,modeIds:source.hand.length>=2?['mode:discard','mode:damage']:['mode:damage'],modeLabels:{'mode:discard':'Discard 2 cards','mode:damage':'Take 1 damage'},cardMinByMode:{'mode:discard':2,'mode:damage':0},cardMaxByMode:{'mode:discard':2,'mode:damage':0},mandatory:true,defaultMode:'mode:damage'});
    if(selected?.modes?.[0]==='mode:discard'){const costs=source.hand.filter(c=>selected.cards.includes(c.id));await this.spend(source,costs,{action:'Discarded'});this.finishCards(costs);}else await this.damage(p,source,1);
   }
  }
  if(p.general.id==='guojia')for(let point=0;point<n&&p.alive;point++){
   if(!await this.yes(p,`Legacy: Distribute 2 cards for damage point ${point+1}/${n}?`))continue;
   const pool=this.reserveTop(2);
   for(const c of pool)this.giveReserved(c,p);
   while(pool.length){
    const plan=await this.skillPlan(p,'Legacy: Select 1–2 new cards and a recipient, then Distribute',pool,this.alive(),{kind:'legacy-distribute',cardMax:pool.length});
    if(!plan.cards.length){this.log(`${p.name} keeps the remaining Legacy cards.`);break;}
    const chosen=pool.filter(c=>plan.cards.includes(c.id)),to=plan.targets[0];
    const recipient=this.players.find(t=>t.id===to);this.effect(p,recipient,'skill','Legacy');if(recipient!==p)await this.giveCards(p,recipient,chosen);
    for(const c of chosen)pool.splice(pool.indexOf(c),1);
    this.log(`${p.name} ${recipient===p?'keeps':`gives to ${recipient.name}`} ${chosen.length} Legacy card(s).`);
   }
  }
 },
 async prepareGeneral(p){
  if(p.general.id==='zhenji'){
   while(p.alive&&await this.yes(p,'Goddess of Luo River: Judge again? Keep a black result; stop on red.')){
    const c=await this.judgment(p,'Goddess of Luo River',{keepBlack:true});if(!c||red(c))break;
   }
  }
  if(p.general.id==='zhugeliang'&&await this.yes(p,'Stargazing: Arrange the top cards of the deck?')){
   const pool=this.reserveTop(Math.min(5,this.alive().length));
   if(!pool.length)return;
   const ids=await this.ask(p,'Stargazing: Arrange the top and bottom of the deck',[
    ...pool.map(c=>({id:c.id,label:this.label(c),card:info(c)})),{id:'bottom',label:'Bottom of deck'}
   ],{min:pool.length+1,max:pool.length+1,zone:'stargazing',fallback:[...pool.map(c=>c.id),'bottom'],context:{kind:'private-deck'}});
   if(this.stopped)return;
   const split=ids.indexOf('bottom'),byId=new Map(pool.map(c=>[c.id,c]));
   const top=ids.slice(0,split).map(id=>byId.get(id)),bottom=ids.slice(split+1).map(id=>byId.get(id));
   for(const c of pool)this.reserved.splice(this.reserved.indexOf(c),1);
   this.deck.unshift(...top);this.deck.push(...bottom);this.log(`${p.name} finishes Stargazing: ${top.length} on top, ${bottom.length} at the bottom.`);
  }
 },
 async drawGeneral(p){
  if(p.general.id!=='zhangliao')return false;
  const others=this.alive().filter(t=>t!==p&&t.hand.length);if(!others.length)return false;
  const ids=await this.ask(p,'Assault: Choose up to 2 characters to take a hand card from, or skip to draw normally',others.map(t=>this.option(t)),{min:0,max:Math.min(2,others.length),fallback:[],context:{kind:'raid'}});
  if(!ids.length)return false;
  for(const t of this.order(p).filter(t=>ids.includes(t.id))){
   if(!t.hand.length)continue;const c=t.hand[Math.floor(Math.random()*t.hand.length)];this.effect(p,t,'skill','Assault');await this.remove(t,c,p.hand);this.log(`${p.name} takes one hand card from ${t.name} with Assault.`);
  }
  return true;
 },
 async resolveDuel(source,target,{cards=[],negatable=true}={}){
  if(!source.alive||!target.alive)return;
  this.effect(source,target,'spell','Duel');
  if(negatable&&await this.negate(target,'Duel'))return;
  let a=target,b=source;
  while(a.alive&&b.alive){
   const required=b.general.id==='lvbu'?2:1;if(required===2)this.trigger(b,'Unrivaled','Two Attacks required');let ok=true;
   for(let i=0;i<required;i++)if(!await this.response(a,'sha',`Duel with ${b.name}: play Attack (${i+1}/${required})`)){ok=false;break;}
   if(!ok){await this.damage(b,a,1,{kind:'duel',cards});break;}[a,b]=[b,a];
  }
 },
 async redirectAttack(source,target){
  if(target.general.id!=='daqiao')return target;
  const costs=[...target.hand,...Object.values(target.equip)];
  const legal=c=>this.alive().filter(t=>t!==source&&t!==target&&this.canShaWithCost(target,t,[c])&&this.canBeTarget(t,'sha'));
  const possible=costs.filter(c=>legal(c).length);if(!possible.length)return target;
  const plan=await this.selectAction(target,{kind:'deflection-plan',skillName:'Deflection',selectionKind:'deflection',cardIds:possible.map(c=>c.id),cardMin:1,cardMax:1,targetIds:[...new Set(possible.flatMap(c=>legal(c).map(t=>t.id)))],targetCount:1,targetIdsByCard:Object.fromEntries(possible.map(c=>[c.id,legal(c).map(t=>t.id)]))});if(!plan)return target;
  const c=possible.find(c=>c.id===plan.cards[0]),next=this.players.find(p=>p.id===plan.targets[0]);
  this.effect(target,next,'skill','Deflection');await this.remove(target,c);this.log(`${target.name} redirects the Attack to ${next.name} with Deflection.`);return next;
 },
 async useAttack(source,targets,v){
  v=await this.prepareAttack(source,v);
  const resolved=[];
  for(const target of this.order().filter(t=>targets.includes(t)))resolved.push(await this.redirectAttack(source,target));
  const ignoreArmor=source.equip.weapon?.kind==='qinggang';
  for(const target of this.order())for(const match of resolved.filter(t=>t===target))await this.sha(source,match,v,{redirect:false,armorIgnored:ignoreArmor});
 },
 async giveCards(owner,recipient,cards){
  const had=owner.hand.length;
  for(const c of cards){const i=owner.hand.indexOf(c);if(i<0)throw new Error('Gift card is not in hand');owner.hand.splice(i,1);recipient.hand.push(c);}
  this.movement(owner,recipient,cards.length,'transfer');this.changed();await this.afterLoss(owner,had);
 },
 async alliedCard(lord,kind){
  const kingdom=kind==='shan'?'Wei':'Shu',skill=kind==='shan'?'Entourage':'Influencing';
  this.log(`${lord.name} calls ${skill}.`);
  for(const ally of this.order(lord).filter(p=>p!==lord&&p.general.kingdom===kingdom)){
   const v=await this.requestCard(ally,kind,`${skill}: Supply ${META[kind][0]} for ${lord.name}?`,{allowLord:false});
   if(v){this.effect(ally,lord,'skill',skill);this.log(`${ally.name} supplies ${META[kind][0]} for ${lord.name}.`);return v;}
  }
  this.log(`No ally supplies ${META[kind][0]} for ${lord.name}.`);
  if(kind==='sha'&&lord===this.current)this.used.jijiangFailed=true;
  return null;
 },
 async commitVirtual(p,v){
  if(v.bluff)return this.resolveBluff(p,v);
  if(v.lordRequest)return this.alliedCard(p,v.kind);
  await this.spend(p,v.cards);return v;
 },
 async requestCard(p,kind,title,{ignoreArmor=false,allowBagua=true,allowLord=true,target=null,passLabel='Pass',context=null}={}){
  const vs=this.virtual(p,kind,{response:true}).filter(v=>(allowLord||!v.lordRequest)&&(!target||this.canShaWithCost(p,target,v.cards)));
  const opts=vs.map(v=>({id:v.id,label:v.label,cardIds:v.cards.map(c=>c.id)}));
  if(kind==='shan'&&allowBagua&&!ignoreArmor&&this.hasBagua(p))opts.push({id:'bagua',label:'Activate Eight Trigrams Formation'});
  opts.push({id:'pass',label:passLabel});
  const[id]=await this.ask(p,title,opts,{fallback:['pass'],zone:'response',context});
  if(id==='bagua'){this.trigger(p,'Eight Trigrams Formation','Judging for Dodge');
   const c=await this.judgment(p,'Eight Trigrams Formation');if(c&&red(c)){await this.thunderStrike(p);return {kind,cards:[],suit:c.suit,id:'bagua'};}
   return this.requestCard(p,kind,title,{ignoreArmor,allowBagua:false,allowLord,target,passLabel,context});
  }
  const v=vs.find(v=>v.id===id);if(!v)return null;
  const committed=await this.commitVirtual(p,v);
  if(!committed)return this.requestCard(p,kind,title,{ignoreArmor,allowBagua,allowLord:false,target,passLabel,context});
  if(p===this.current&&this.phase==='Play'&&kind==='sha')this.used.shaDuringPlay=true;
  if(kind==='shan')await this.thunderStrike(p);
  this.log(`${p.name} plays ${META[kind][0]}${v.id.includes(':')||v.lordRequest?' (skill)':''}.`,{eventType:'response',actorId:p.id,cardKind:kind});return committed;
 },
 generalPlayOptions(p){
  const opts=[],g=p.general.id;
  if(g==='liubei'&&p.hand.length)opts.push({id:'skill:rende',label:'Benevolence',description:'Give hand cards to another character. Giving 2 in total heals you once this Play Phase.'});
  if(g==='sunshangxiang'&&!this.used.jieyin&&p.hand.length>=2&&this.alive().some(t=>t!==p&&t.general.sex==='m'&&t.hp<t.maxHp))opts.push({id:'skill:jieyin',label:'Betrothment',description:'Discard 2 hand cards to heal yourself and a wounded male character by 1 HP each.'});
  if(g==='huatuo'&&!this.used.qingnang&&p.hand.length&&this.alive().some(t=>t.hp<t.maxHp))opts.push({id:'skill:qingnang',label:'Prodigal Healer',description:'Discard 1 hand card to heal a wounded character by 1 HP.'});
  if(g==='diaochan'&&!this.used.lijian&&[...p.hand,...Object.values(p.equip)].length){const males=this.alive().filter(t=>t!==p&&t.general.sex==='m');if(males.length>=2&&males.some(t=>this.canBeTarget(t,'duel')))opts.push({id:'skill:lijian',label:'Lust',description:'Discard 1 hand or equipment card to force a Duel between 2 male characters. Negation cannot counter it.'});}
  return opts;
 },
 async skillGeneral(p,kind,plan=null){return this.executeAction(p,kind,plan);},
};
