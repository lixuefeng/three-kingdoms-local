// Match review uses archive order for linking and the recorded request for bot knowledge.
// Final state is never merged into the model's historical observation.
export function recordedInput(trace){
 try{const req=typeof trace.request==='string'?JSON.parse(trace.request):trace.request;const user=req?.messages?.find(m=>m.role==='user');const text=typeof user?.content==='string'?user.content:user?.content?.filter(b=>typeof b.text==='string').map(b=>b.text).join('\n');return text?JSON.parse(text):null;}catch{return null;}
}
const warnings=new Set(['request-timeout','decision-expired','window-closed','model-switched','match-ended','cancelled','stale']);
const key=(pid,qid)=>pid+':'+qid;
export function inspectMatch(records){
 const turns=new Map(),decisions=[],byPrompt=new Map(),names=new Map(),evaluations=new Map();let currentTurn=0,status='in progress',winner=null,meta=null;
 const group=n=>{const turn=Number.isFinite(n)?n:0;if(!turns.has(turn))turns.set(turn,{turn,playerId:null,events:[],decisionIds:[]});return turns.get(turn);};
 records.forEach((r,index)=>{
  if(r.type==='match-start')meta=r;
  if(r.type==='state'){currentTurn=r.turn||0;const t=group(currentTurn);t.playerId=r.current||t.playerId;for(const p of r.players||[])names.set(p.id,{id:p.id,name:p.general||p.name,playerName:p.name});if(r.winner)winner=r.winner;}
  if(r.type==='match-status'){if(['finished','aborted','error'].includes(r.status)||status==='in progress')status=r.status;winner=r.winner||winner;if(winner)status='finished';}
  if(r.type==='game-event'){
   const e=r.event||{};if(e.type==='log')group(e.turn??currentTurn).events.push({order:index,time:r.time,text:e.text||e.displayMessage||e.message||'',groupId:e.groupId||null,action:e.groupLabel||e.actionLabel||null,type:e.eventType||'event'});
   if(e.type==='bot-decision'){const d=byPrompt.get(key(e.playerId,e.promptId));if(d){d.executed={source:e.source,ids:e.ids,targets:e.targets,...(e.costs?{costs:e.costs}:{}),...(e.mode?{mode:e.mode}:{})};d.actionLabel=(e.ids||[]).map(id=>d.choiceLabels[id]||id).join(' + ');}else group(e.turn??currentTurn).events.push({order:index,time:r.time,text:'Practice decision: '+(e.ids||[]).join(', '),playerId:e.playerId,type:'practice'});}
  }
  if(r.type==='chat')group(currentTurn).events.push({order:index,time:r.time,text:r.message?.text||'',playerId:r.message?.senderId,name:r.message?.name,type:'chat'});
  if(r.type==='ai-trace'&&r.trace?.decisionType!=='analysis'){
   const trace=r.trace,input=recordedInput(trace),turn=Number.isFinite(input?.turn)?input.turn:currentTurn,id=String(index),d={id,order:index,turn,time:r.time,playerId:trace.playerId,model:trace.model,zone:trace.decisionType,status:trace.status,elapsedMs:trace.elapsedMs||0,inputTokens:trace.usage?.prompt_tokens||0,outputTokens:trace.usage?.completion_tokens||0,validationReason:trace.validationReason||null,normalization:trace.normalization||null,acceptedAction:trace.acceptedAction||null,promptId:trace.promptId,issues:[]};
   if(!['model','chat-model'].includes(d.status))d.issues.push({kind:'technical',severity:warnings.has(d.status)?'warning':'error',text:d.validationReason||d.status});
   if(d.normalization)d.issues.push({kind:'normalization',severity:'notice',text:d.normalization});
   Object.defineProperty(d,'choiceLabels',{value:Object.fromEntries((input?.prompt?.options||[]).map(o=>[o.id,o.label||o.id]))});d.actionLabel=(trace.acceptedAction?.ids||[]).map(id=>d.choiceLabels[id]||id).join(' + ');
   decisions.push(d);byPrompt.set(key(d.playerId,d.promptId),d);group(turn).decisionIds.push(id);
  }
  if(r.type==='ai-plan'){const d=byPrompt.get(key(r.playerId,r.promptId));if(d)d.plan=r.plan;}
  if(r.type==='decision-analysis')evaluations.set(r.decisionId,{time:r.time,model:r.model,result:r.result});
 });
 const list=[...turns.values()].sort((a,b)=>a.turn-b.turn).map(t=>({...t,name:names.get(t.playerId)?.name||(t.turn?'Unknown player':'Setup')}));
 for(const t of list){const repeated=new Map();for(const e of t.events)if(/calls Influencing|calls Entourage/.test(e.text))repeated.set(e.text,(repeated.get(e.text)||0)+1);t.flags=[...repeated].filter(([,n])=>n>=3).map(([text,count])=>({kind:'review',text:count+' repeated requests: '+text}));}
 for(const d of decisions){d.name=names.get(d.playerId)?.name||d.playerId;d.evaluation=evaluations.get(d.id)||null;}
 return {matchId:meta?.matchId,startedAt:meta?.time,version:meta?.version,status,winner,players:[...names.values()],turns:list,decisions,summary:{decisions:decisions.length,modelSuccesses:decisions.filter(d=>['model','chat-model'].includes(d.status)).length,failedRequests:decisions.filter(d=>!['model','chat-model'].includes(d.status)).length,inputTokens:decisions.reduce((n,d)=>n+d.inputTokens,0),outputTokens:decisions.reduce((n,d)=>n+d.outputTokens,0)}};
}
export function decisionDetail(records,id){
 if(typeof id!=='string'||!/^\d+$/.test(id))throw Error('Choose a recorded AI decision.');const record=records[Number(id)];if(record?.type!=='ai-trace'||record.trace?.decisionType==='analysis')throw Error('That AI decision was not found.');
 const index=inspectMatch(records),decision=index.decisions.find(d=>d.id===id),input=recordedInput(record.trace);return {decision,trace:record.trace,input,ownPlayer:input?.players?.find(p=>p.id===input.you)||null,roleBeliefs:input?.agentState?.knowledge?.roleBeliefs||[],planBefore:input?.agentState?.knowledge?.plan||null,legalOptions:input?.prompt?.options||[],tactics:input?.agentState?.tactics||null};
}
export function decisionAnalysisContext(detail){
 if(!detail.input?.prompt)throw Error('This record has no gameplay input to analyze.');
 // Whitelist historical bot data; never include archive states or later revealed roles.
 let response=detail.trace.response;try{const payload=JSON.parse(response);response=payload.choices?.[0]?.message?.content??payload.output?.message?.content?.filter(b=>typeof b.text==='string').map(b=>b.text).join('')??response;}catch{}
 return {instruction:'Assess this decision using only the historical observation below. Distinguish technical validity from strategic quality. Identity probabilities are guesses, not revealed facts.',observation:detail.input,modelResponse:response,status:detail.trace.status,validationReason:detail.trace.validationReason||null,acceptedAction:detail.trace.acceptedAction||null,executed:detail.decision.executed||null};
}
