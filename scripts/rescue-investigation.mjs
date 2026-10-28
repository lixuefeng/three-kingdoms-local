import {createReadStream} from 'node:fs';
import {createInterface} from 'node:readline';
import {evaluateSavedDecision,evaluateDiagnosticPrompt,gameplaySystemPrompt} from '../llm-provider.mjs';

const PROBE_FORMAT=' Return exactly one plain JSON object. No XML tags, invoke blocks, Markdown fences, prose outside the object, or extra characters. Do not return a game action. Put brief factual answers in the requested string fields; do not output private reasoning.';
export const KNOWLEDGE_SYSTEM='Answer the Three Kingdoms identity-mode rules questions from your own knowledge. Return one JSON object with string fields lordWin, peach, pass. Explain uncertainty. Do not assume any hidden roles.'+PROBE_FORMAT;
export const COMPREHENSION_SYSTEM='Read the supplied historical player observation. Return one JSON object with string fields recentSequence, targetIdentityEvidence, availableChoices, uncertainty. Use only visible facts; do not infer hidden roles as known. Do not make a game move.'+PROBE_FORMAT;
export async function readRescueObservation(path,promptId){
 for await(const line of createInterface({input:createReadStream(path),crlfDelay:Infinity})){
  let row;try{row=JSON.parse(line);}catch{throw Error('Archive contains invalid JSON');}
  if(row.type!=='ai-trace'||row.trace?.promptId!==promptId)continue;
  const attempt=row.trace.attempts?.[0],request=attempt?.request;
  const content=request?.messages?.at(-1)?.content;
  const text=typeof content==='string'?content:Array.isArray(content)?content.find(x=>typeof x.text==='string')?.text:null;
  if(!text)throw Error('Original observation is missing; archive needs debug traces');
  const observation=JSON.parse(text);
  if(observation.prompt?.context?.kind!=='rescue')throw Error('Selected prompt is not a rescue decision');
  if(!Array.isArray(observation.players)||observation.players.some(p=>p.id!==observation.you&&p.alive&&p.role&&p.role!=='lord'))throw Error('Observation may expose a living opponent role; refusing to send it');
  delete observation.prompt.deadline;delete observation.validationFeedback;
  return observation;
 }
 throw Error('Prompt not found in archive');
}
export function focusRescue(observation){
 const o=structuredClone(observation),p=o.prompt,ctx=p?.context;
 if(ctx?.kind!=='rescue')throw Error('Expected rescue prompt');
 const target=o.players.find(x=>x.id===ctx.targetId),self=o.players.find(x=>x.id===o.you);
 if(!target||!self||target.hp>0)throw Error('Dying player or observer missing from observation');
 const peachIds=(self.hand||[]).filter(x=>x.kind==='tao').map(x=>x.id);
 const peachOptions=p.options.filter(x=>(x.cardIds||[]).some(id=>peachIds.includes(id)));
 if(!peachOptions.length||!p.options.some(x=>x.id==='pass'))throw Error('This investigation requires an offered Peach and Pass');
 const belief=o.decisionBriefing?.relations?.find(x=>x.playerId===target.id)?.identityAssessment||null;
 o.decisionContext={kind:'rescue',target:{id:target.id,name:target.name,hp:target.hp,role:target.role||null,identityAssessment:belief},recentPublicEvents:(o.events||[]).slice(-12),alternatives:[
  {optionIds:peachOptions.map(x=>x.id),effect:`Spend the selected Peach and restore 1 HP to ${target.name}; ${Math.max(0,1-(target.hp+1))} additional HP may still be needed to leave the dying state.`},
  {optionId:'pass',effect:`Do not spend a card. ${target.name} remains dying; other responses may still rescue them. If the rescue process ends without enough healing, they are eliminated and their role is revealed.`}
 ],note:'Identity assessments are uncertain; other responses are unknown. The alternatives describe immediate effects, not recommended actions.'};
 return o;
}
export async function investigate(observation,profile,{fetchImpl=fetch,signal,focusedFirst=false}={}){
 const focused=focusRescue(observation);
 const knowledge=await evaluateDiagnosticPrompt(profile,{system:KNOWLEDGE_SYSTEM,observation:{questions:['In classic identity mode, how does the Lord win?','What does playing Peach on a dying player do?','What happens when one player passes on a rescue?']},fetchImpl,signal});
 const comprehension=await evaluateDiagnosticPrompt(profile,{system:COMPREHENSION_SYSTEM,observation,fetchImpl,signal});
 const results={};for(const variant of (focusedFirst?['focused','original']:['original','focused'])){
  results[variant]=await evaluateSavedDecision(profile,{observation:variant==='focused'?focused:observation,system:gameplaySystemPrompt(),fetchImpl,signal});
 }
 return {knowledge,comprehension,...results,order:focusedFirst?['focused','original']:['original','focused']};
}
