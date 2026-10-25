// Local archive -> anonymized bot-observation regressions. Never reads full game state.
import {readFile,writeFile} from 'node:fs/promises';
const [mainFile,allyFile,outFile]=process.argv.slice(2);
if(!mainFile||!allyFile||!outFile)throw Error('Usage: node scripts/build-log-regressions.mjs MAIN_ARCHIVE ALLY_ARCHIVE OUTPUT.json');
const load=async file=>(await readFile(file,'utf8')).split('\n').filter(Boolean).map(l=>JSON.parse(l));
const main=await load(mainFile),ally=await load(allyFile);
function extract(rows,index,general){
 const t=rows[index]?.trace;if(!t?.request)throw Error('Missing recorded request at row '+index);
 const req=typeof t.request==='string'?JSON.parse(t.request):t.request,m=req.messages.findLast(m=>m.role==='user'),text=typeof m.content==='string'?m.content:m.content.filter(x=>x.text).map(x=>x.text).join('');
 const observation=JSON.parse(text),self=observation.players.find(p=>p.id===observation.you);if(self.general.id!==general)throw Error('Wrong source position at row '+index);
 // Remove human chat; preserve reviewed strategic memory/plans to reproduce stale-plan effects.
 observation.publicChat=[];
 if(observation.agentState?.knowledge){observation.agentState.knowledge.tableTalkSinceStart=[];}
 const aliases=new Map(observation.players.map((p,i)=>[p.id,'p'+(i+1)]));
 const names=new Map(observation.players.filter(p=>p.name&&p.name!==p.general?.name).map(p=>[p.name,p.general?.name||aliases.get(p.id)]));
 const redact=value=>{
  if(Array.isArray(value))return value.map(redact);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([k])=>!['deadline','startedAt','matchId','roomCode','ownerToken','archiveKey','apiKey'].includes(k)).map(([k,v])=>[redact(k),redact(v)]));
  if(typeof value!=='string')return value;
  for(const [id,alias] of aliases)value=value.split(id).join(alias);
  for(const [name,alias] of names)value=value.split(name).join(alias);
  return value.replace(/\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/gi,'saved-decision').replace(/\b[0-9a-f]{16}\b/gi,'unknown-player');
 };
 const o=redact(observation);o.prompt.id='recorded-position';o.players.forEach(p=>{p.name=p.general?.name||p.id;});
 return {observation:o,historicalAction:t.acceptedAction?redact(t.acceptedAction):null,alias:id=>aliases.get(id)};
}
const definitions=[
 ['recorded-luxun-attack-ally',ally,150,'luxun','Avoid attacking the 92.4%-likely fellow Rebel without an observable team benefit; belief is uncertain, not revealed identity.',x=>({avoidActionTargets:x.observation.prompt.options.filter(o=>['sha','duel','steal'].includes(o.kind)&&o.targetIds?.includes(x.observation.players.find(p=>p.general?.id==='xiahouyuan').id)).map(o=>({optionId:o.id,targetId:x.observation.players.find(p=>p.general?.id==='xiahouyuan').id}))} )],
 ['recorded-luxun-steal-ally',ally,186,'luxun','Avoid stripping a likely fellow Rebel with no harmful delayed spell to remove. Another legal Steal target and End remain available.',x=>({avoidActionTargets:[{optionId:'play:steal:c95',targetId:x.observation.players.find(p=>p.general?.id==='xiahouyuan').id}]} )],
 ['recorded-weiyan-play-peach',main,665,'weiyan','Original wounded Wei Yan position. Healing is a preferred resource line; Duel or Harvest require manual strategic review.',()=>null],
 ['recorded-weiyan-discard-peach',main,670,'weiyan','Discard two from the original five-card hand while wounded. Rubric prefers retaining Peach, allowing several other discard combinations.',()=>({avoidIds:['c150']})],
 ['recorded-pangde-replace-weapon',main,1029,'pangde','Replacing Fan with Guding reduces range from four to two. Costs, damage benefits and target choice need manual review; replacement is not automatically wrong.',()=>null],
 ['recorded-liubei-equip-horse',main,1121,'liubei','Original position where equipping -1 Horse unlocks additional Rations Depleted targets. Several skill/card lines are legal; manual review.',()=>null],
 ['recorded-liubei-benevolence',main,1098,'liubei','Original complete Benevolence decision with a wounded Lord. Measure contract legality separately from gift strategy.',()=>null]
];
const cases=definitions.map(([id,rows,index,general,description,rubric])=>{const x=extract(rows,index,general);return {id,description,source:{type:'redacted-recorded-observation',gameVersion:'0.69.0',changes:['Player IDs anonymized','Human chat removed; strategic model memory and plan retained with IDs redacted','Deadline removed; current action contract supplied at evaluation'],limitations:'Historical input, not a reconstructed game. Original engine facts and previews are retained; no future outcome or hidden-state labels supplied.'},expected:rubric(x),historicalAction:x.historicalAction,observation:x.observation};});
await writeFile(outFile,JSON.stringify(cases,null,2)+'\n',{flag:'wx',mode:0o600});
console.log('Wrote '+cases.length+' anonymized recorded positions. Inspect before publishing; raw archives stay local.');
