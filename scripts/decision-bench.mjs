import {decisionTool,TOOL_INSTRUCTIONS} from './decision-tools.mjs';
import {evaluateSavedDecision,gameplaySystemPrompt} from '../llm-provider.mjs';
export function prepareCase(testCase,variant='current'){
 const observation=structuredClone(testCase.observation);
 if(!observation?.prompt?.options?.length||!Array.isArray(observation.players)||!observation.players.some(p=>p.id===observation.you))throw Error('Invalid fixture: '+testCase.id);
 // Saved wall-clock deadlines must not expire replayed decisions.
 delete observation.prompt.deadline;
 if(!['current','focused','tools'].includes(variant))throw Error('Unknown variant: '+variant);
 if(variant==='focused'){
  // Experimental ordering only: preserve every fact and the exact action contract.
  const {you,players,prompt,decisionBriefing,agentState,...rest}=observation;
  return {system:gameplaySystemPrompt(),observation:JSON.parse(JSON.stringify({you,players,prompt,decisionBriefing,agentState,...rest}))};
 }
 return {system:gameplaySystemPrompt(),observation};
}
export function gradeAction(testCase,result){
 if(result.status!=='model')return {legality:'fail',strategy:'not-scored'};
 const rubric=testCase.expected;
 if(!rubric)return {legality:'pass',strategy:'review'};
 const action=result.action;
 const pass=(!rubric.anyIds||action.ids.some(id=>rubric.anyIds.includes(id)))&&(!rubric.avoidIds||action.ids.every(id=>!rubric.avoidIds.includes(id)))&&(!rubric.targets||JSON.stringify(action.targets)===JSON.stringify(rubric.targets));
 return {legality:'pass',strategy:pass?'pass':'fail'};
}
export async function runCase(testCase,config,variant='current',options={}){
 const input=prepareCase(testCase,variant);
 if(variant==='tools'){input.system=TOOL_INSTRUCTIONS+'\n\n'+input.system;input.toolHandler=call=>decisionTool(input.observation,call);}
 const result=await evaluateSavedDecision(config,{...input,...options});
 return {caseId:testCase.id,variant,...result,grade:gradeAction(testCase,result)};
}
export function markdownReport(rows){
 const groups=new Map();for(const r of rows){const key=r.profile+' / '+r.variant;const g=groups.get(key)||{n:0,legal:0,scored:0,pass:0,ms:0,input:0,output:0};g.n++;g.legal+=r.grade.legality==='pass';if(['pass','fail'].includes(r.grade.strategy)){g.scored++;g.pass+=r.grade.strategy==='pass';}g.ms+=r.elapsedMs;g.input+=r.usage?.prompt_tokens||0;g.output+=r.usage?.completion_tokens||0;groups.set(key,g);}
 return '# Decision benchmark\n\nStrategy scores use fixture rubrics, not win rates. Review raw responses in results.json. No game-engine fallback is substituted.\n\n| Model / variant | Legal | Strategy | Mean ms | Input tokens | Output tokens |\n|---|---:|---:|---:|---:|---:|\n'+[...groups].map(([key,g])=>`| ${key} | ${g.legal}/${g.n} | ${g.pass}/${g.scored} | ${Math.round(g.ms/g.n)} | ${g.input} | ${g.output} |`).join('\n')+'\n';
}
