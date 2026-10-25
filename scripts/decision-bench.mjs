import {decisionTool,TOOL_INSTRUCTIONS} from './decision-tools.mjs';
import {evaluateSavedDecision,gameplaySystemPrompt} from '../llm-provider.mjs';
export const VARIANT_BUDGETS={current:2,focused:2,tools:4,'role-focus':2,'consequence-focus':2,review:4};
const ROLE_FOCUS='Evaluate actions by progress toward your own role win condition. Card use, damage and reducing discards are means, not objectives. Use public role evidence and uncertain role beliefs when comparing recipients and targets. Friendly damage or transfers can be useful when a concrete observable team benefit outweighs their cost; do not assume every friendly interaction is good or every attack on an ally is wrong. Do not treat heuristic probabilities as revealed roles.';
const CONSEQUENCE_FOCUS='Before submitting, compare the consequences of the actual legal alternatives: HP, hand size, hand limit, equipment replacement, range, attack allowance, resource transfer, follow-up availability and ending. Supplied engine projections are conditional facts, not recommendations. Consider both the intended target and alternative targets. A future unknown draw or successful hit is not guaranteed.';
export function prepareCase(testCase,variant='current'){
 const observation=structuredClone(testCase.observation);
 if(!observation?.prompt?.options?.length||!Array.isArray(observation.players)||!observation.players.some(p=>p.id===observation.you))throw Error('Invalid fixture: '+testCase.id);
 // Saved wall-clock deadlines must not expire replayed decisions.
 delete observation.prompt.deadline;
 if(!Object.hasOwn(VARIANT_BUDGETS,variant))throw Error('Unknown variant: '+variant);
 if(variant==='focused'){
  // Experimental ordering only: preserve every fact and the exact action contract.
  const {you,players,prompt,decisionBriefing,agentState,...rest}=observation;
  return {system:gameplaySystemPrompt(),observation:JSON.parse(JSON.stringify({you,players,prompt,decisionBriefing,agentState,...rest}))};
 }
 const extra=variant==='role-focus'?ROLE_FOCUS:variant==='consequence-focus'?CONSEQUENCE_FOCUS:'';
 return {system:gameplaySystemPrompt()+(extra?'\n\n'+extra:''),observation};
}
export function gradeAction(testCase,result){
 if(result.status!=='model')return {legality:'fail',strategy:'not-scored'};
 const rubric=testCase.expected;
 if(!rubric)return {legality:'pass',strategy:'review'};
 const action=result.action;
 const pass=(!rubric.anyIds||action.ids.some(id=>rubric.anyIds.includes(id)))&&(!rubric.avoidIds||action.ids.every(id=>!rubric.avoidIds.includes(id)))&&(!rubric.targets||JSON.stringify(action.targets)===JSON.stringify(rubric.targets))&&(!rubric.avoidActionTargets||!rubric.avoidActionTargets.some(pair=>action.ids.includes(pair.optionId)&&action.targets.includes(pair.targetId)));
 return {legality:'pass',strategy:pass?'pass':'fail'};
}
export async function runCase(testCase,config,variant='current',options={}){
 const input=prepareCase(testCase,variant);
 if(variant==='tools'){input.system=TOOL_INSTRUCTIONS+'\n\n'+input.system;input.toolHandler=call=>decisionTool(input.observation,call);}
 let result=await evaluateSavedDecision(config,{...input,...options});
 let firstPass=null;
 if(variant==='review'&&result.status==='model'){
  const initial=result;
  // No fixture rubric, historical answer or grader feedback enters the review.
  const reviewed=await evaluateSavedDecision(config,{...input,system:input.system+'\n\nReview the candidateAction against the unchanged board, current role objective, legal alternatives and supplied consequences. Nothing has executed. Keep it or replace it with a better complete explicit action. Do not output analysis or assume the candidate is correct.',observation:{...input.observation,candidateAction:initial.action},...options});
  firstPass={status:initial.status,action:initial.action,grade:gradeAction(testCase,initial)};
  result={...reviewed,elapsedMs:initial.elapsedMs+reviewed.elapsedMs,modelCalls:initial.modelCalls+reviewed.modelCalls,usage:{prompt_tokens:(initial.usage?.prompt_tokens||0)+(reviewed.usage?.prompt_tokens||0),completion_tokens:(initial.usage?.completion_tokens||0)+(reviewed.usage?.completion_tokens||0)},rounds:[...initial.rounds.map(r=>({...r,stage:'initial'})),...reviewed.rounds.map(r=>({...r,stage:'review'}))]};
 }
 return {caseId:testCase.id,variant,...result,...(firstPass?{firstPass}:{}),grade:gradeAction(testCase,result)};
}
export function markdownReport(rows){
 const groups=new Map();for(const r of rows){const key=r.profile+' / '+r.variant;const g=groups.get(key)||{n:0,legal:0,scored:0,pass:0,ms:0,input:0,output:0,calls:0};g.calls+=r.modelCalls||1;g.n++;g.legal+=r.grade.legality==='pass';if(['pass','fail'].includes(r.grade.strategy)){g.scored++;g.pass+=r.grade.strategy==='pass';}g.ms+=r.elapsedMs;g.input+=r.usage?.prompt_tokens||0;g.output+=r.usage?.completion_tokens||0;groups.set(key,g);}
 return '# Decision benchmark\n\nStrategy scores use fixture rubrics, not win rates. Review raw responses in results.json. No game-engine fallback is substituted.\n\n| Model / variant | Legal | Strategy | Mean ms | Calls | Input tokens | Output tokens |\n|---|---:|---:|---:|---:|---:|---:|\n'+[...groups].map(([key,g])=>`| ${key} | ${g.legal}/${g.n} | ${g.pass}/${g.scored} | ${Math.round(g.ms/g.n)} | ${g.calls} | ${g.input} | ${g.output} |`).join('\n')+'\n\n| Case | Model / variant | Legal | Strategy |\n|---|---|---:|---:|\n'+[...new Set(rows.map(r=>r.caseId+'|'+r.profile+'|'+r.variant))].map(key=>{const [id,profile,variant]=key.split('|'),rs=rows.filter(r=>r.caseId===id&&r.profile===profile&&r.variant===variant),scored=rs.filter(r=>['pass','fail'].includes(r.grade.strategy));return `| ${id} | ${profile} / ${variant} | ${rs.filter(r=>r.grade.legality==='pass').length}/${rs.length} | ${scored.filter(r=>r.grade.strategy==='pass').length}/${scored.length} |`;}).join('\n')+'\n';
}
