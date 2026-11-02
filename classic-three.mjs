import {GENERALS,ALL_GENERALS,META,shuffle} from './cards.mjs';
import {generalName} from './public/event-history.mjs';
export const CLASSIC_THREE_RULES={edition:'Classic 3v3 (pre-2012)',objective:'Defeat the opposing commander. Surviving vanguards do not prevent defeat; eliminated teammates share the victory.',teamsArePublic:true,commanderBonusHp:1,lordSkills:false,killReward:3,turnOrder:'Teams alternate action units: commander once, or both living vanguards consecutively in commander-chosen order. Everyone acts once per round; skip exhausted teams. Opening unit must be a commander.',draft:'Warm commander chooses who drafts first. Draft 16 public generals in 1-2-2-2-2-2-2-2-1 order, then secretly deploy 3 from each team’s 8. Cold commander chooses starting side before hands are dealt.',groupSpells:'User chooses clockwise or counterclockwise resolution.',lightning:false};
export const classicRoster=expanded=>expanded?ALL_GENERALS.filter(g=>GENERALS.includes(g)||(g.pack==='Wind'&&g.id!=='yuji')):GENERALS;
export function validateClassicSeats(ids,players){if(!Array.isArray(ids)||ids.length!==6||new Set(ids).size!==6||ids.some(id=>!players.some(p=>p.id===id)))throw Error('Arrange all six seated players exactly once.');return [...ids];}
const other=team=>team==='red'?'blue':'red';
const teamName=team=>team==='red'?'Warm / Red':'Cold / Blue';
export const classicThree={
 setupClassicTeams(){
  if(this.classicSeatIds)this.players=validateClassicSeats(this.classicSeatIds,this.players).map(id=>this.players.find(p=>p.id===id));
  this.players.forEach((p,i)=>{p.role=i<3?'red':'blue';p.commander=i===1||i===4;});
  const teams=Object.fromEntries(['red','blue'].map(team=>[team,{commanderId:this.players.find(p=>p.role===team&&p.commander).id,vanguardIds:this.players.filter(p=>p.role===team&&!p.commander).map(p=>p.id),roster:[]}]));
  this.threeVThree={stage:'draft-order',round:0,teams,available:[],actedIds:[],activeTeam:null,unit:null};this.changed();
 },
 classicCommander(team){return this.players.find(p=>p.id===this.threeVThree.teams[team].commanderId);},
 async selectClassicGenerals(){
  if(this.generalPool.length<16)throw Error('Classic 3v3 needs at least 16 unbanned supported generals.');
  const state=this.threeVThree,warm=this.classicCommander('red'),cold=this.classicCommander('blue');
  state.available=shuffle(this.generalPool).slice(0,16).map(g=>g.id);this.phase='3v3 Draft';this.changed();
  const[first]=await this.ask(warm,'Classic 3v3: Choose which team drafts first',[{id:'red',label:'Warm / Red drafts first'},{id:'blue',label:'Cold / Blue drafts first'}],{context:{kind:'3v3-draft-order'}});
  let team=first;state.stage='draft';
  for(const count of [1,2,2,2,2,2,2,2,1]){
   const captain=this.classicCommander(team);state.activeTeam=team;this.changed();
   const ids=await this.ask(captain,`${teamName(team)} draft: Choose ${count} general${count===1?'':'s'} for your team`,state.available.map(id=>{const g=this.generalPool.find(g=>g.id===id);return {id,label:g.name,description:`${g.kingdom} · ${g.hp} HP · ${g.skills}`};}),{min:count,max:count,zone:'general',context:{kind:'3v3-draft',team,count}});
   state.teams[team].roster.push(...ids);state.available=state.available.filter(id=>!ids.includes(id));this.log(`${teamName(team)} drafts ${ids.map(id=>this.generalPool.find(g=>g.id===id).name).join(', ')}.`);team=other(team);
  }
  state.stage='deployment';state.activeTeam=null;this.phase='3v3 Deployment';this.changed();
  const plans=await Promise.all(['red','blue'].map(async team=>{
   const remaining=[...state.teams[team].roster],assignments=[];
   const captain=this.classicCommander(team),slots=[captain,...this.players.filter(p=>p.role===team&&!p.commander)];
   for(const player of slots){
    const[id]=await this.ask(captain,`Deploy ${teamName(team)}: Choose ${player.commander?'Commander':'Vanguard'} general for ${player.name}`,remaining.map(id=>{const g=this.generalPool.find(g=>g.id===id);return {id,label:g.name,description:`${g.kingdom} · ${g.hp} HP${player.commander?' +1 commander HP':''} · ${g.skills}`};}),{zone:'general',context:{kind:'3v3-deploy',team,playerId:player.id,commander:!!player.commander}});
    assignments.push({player,id});remaining.splice(remaining.indexOf(id),1);
   }return assignments;
  }));
  for(const {player,id}of plans.flat()){player.general=this.generalPool.find(g=>g.id===id);player.maxHp=player.general.hp+(player.commander?1:0);player.hp=player.maxHp;}
  state.stage='initiative';this.phase='3v3 Initiative';this.changed();
  const[start]=await this.ask(cold,'Classic 3v3: Which commander takes the first turn?',[{id:'red',label:`${generalName(warm)} · Warm commander first`},{id:'blue',label:`${generalName(cold)} · Cold commander first`}],{context:{kind:'3v3-initiative'}});
  state.startingTeam=start;state.activeTeam=start;state.stage='battle';this.changed();
 },
 async runClassicBattle(){
  const state=this.threeVThree;let team=state.startingTeam,opening=true;state.round=1;state.actedIds=[];
  while(!this.stopped&&!this.winner){
   const eligible=p=>p.alive&&!state.actedIds.includes(p.id);
   if(!this.players.some(eligible)){state.round++;state.actedIds=[];this.log(`Classic 3v3 · Round ${state.round}: action markers reset.`);}
   const captain=this.classicCommander(team);if(!captain.alive){this.checkWin();return;}
   const fronts=this.players.filter(p=>p.role===team&&!p.commander&&eligible(p));
   if(!eligible(captain)&&!fronts.length){team=other(team);continue;}
   state.activeTeam=team;state.unit=null;this.current=captain;this.phase='3v3 Action choice';this.changed();
   let unit='commander';
   if(!opening){const opts=[...(eligible(captain)?[{id:'commander',label:`Commander · ${generalName(captain)}`}]:[]),...(fronts.length?[{id:'vanguards',label:`Vanguards · ${fronts.map(generalName).join(' + ')}`}]:[])];
    [unit]=opts.length===1?[opts[0].id]:await this.ask(captain,'Classic 3v3: Choose your team’s action unit',opts,{context:{kind:'3v3-unit',team,round:state.round}});
   }
   let queue=unit==='commander'?[captain]:fronts;
   if(unit==='vanguards'&&queue.length===2){const[id]=await this.ask(captain,'Vanguard linkage: Choose who acts first',queue.map(p=>({id:p.id,label:`${generalName(p)} acts first`})),{context:{kind:'3v3-vanguard-order',team}});queue=[queue.find(p=>p.id===id),queue.find(p=>p.id!==id)];}
   state.unit={kind:unit,playerIds:queue.map(p=>p.id)};this.log(`${teamName(team)} chooses ${unit==='commander'?'Commander':'Vanguard linkage'}: ${queue.map(generalName).join(' → ')}.`);
   for(const p of queue){if(!eligible(p))continue;this.current=p;state.actedIds.push(p.id);this.changed();await this.takeTurn(p);if(this.stopped||this.winner)return;}
   opening=false;state.unit=null;team=other(team);
  }
 },
 async groupSpellOrder(p,kind){
  if(this.mode!=='3v3')return this.order(p);
  const[direction]=await this.ask(p,`${META[kind]?.[0]||kind}: Choose resolution direction`,[{id:'counterclockwise',label:'Counterclockwise · Increasing seats'},{id:'clockwise',label:'Clockwise · Decreasing seats'}],{context:{kind:'3v3-spell-direction',cardKind:kind}});
  const start=this.players.indexOf(p),step=direction==='clockwise'?-1:1;
  const order=Array.from({length:this.players.length},(_,i)=>this.players[(start+step*i+this.players.length)%this.players.length]).filter(p=>p.alive);
  this.log(`${generalName(p)} resolves ${META[kind]?.[0]||kind} ${direction}: ${order.filter(t=>!['barbarian','arrows'].includes(kind)||t!==p).map(generalName).join(' → ')}.`);return order;
 }
};
