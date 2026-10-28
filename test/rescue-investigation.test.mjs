import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {llmConfig,evaluateDiagnosticPrompt} from '../llm-provider.mjs';
import {focusRescue,readRescueObservation,investigate} from '../scripts/rescue-investigation.mjs';
const observation={you:'lord',turn:18,players:[{id:'lord',name:'Lord',role:'lord',hp:5,maxHp:5,alive:true,hand:[{id:'peach',kind:'tao'}],equip:{},judge:[]},{id:'target',name:'Target',role:null,hp:0,maxHp:4,alive:true,equip:{},judge:[]}],prompt:{id:'q',zone:'options',title:'Rescue Target',context:{kind:'rescue',targetId:'target'},min:1,max:1,options:[{id:'peach',cardIds:['peach']},{id:'pass'}],deadline:42},events:['Lord uses Flame Tactic → Target.','Target takes damage from Lord.'],decisionBriefing:{relations:[{playerId:'target',identityAssessment:{probabilities:{loyal:0.03,rebel:0.73,spy:0.24}}}]}};
const cfg={...llmConfig({LLM_BASE_URL:'http://localhost/v1',LLM_MODEL:'mock'}),timeoutMs:1000};
test('failed probes preserve raw output, validation reason, usage and redact credentials',async()=>{
 let calls=0;const raw='<invoke_json>{"lordWin":"secret-token"}</invoke_json>';
 const result=await evaluateDiagnosticPrompt({...cfg,key:'secret-token'},{system:'probe',observation:{test:true},fetchImpl:async()=>{calls++;return new Response(JSON.stringify({choices:[{message:{content:raw},finish_reason:'stop'}],usage:{prompt_tokens:33,completion_tokens:12}}));}});
 assert.equal(calls,1);assert.equal(result.status,'invalid-response');assert.match(result.validationReason,/plain JSON/);assert.match(result.textResponse,/invoke_json/);assert.match(result.response,/invoke_json/);assert.equal(result.usage.inputTokens,33);assert.equal(result.usage.outputTokens,12);assert.equal(result.providerUsage.prompt_tokens,33);assert.equal(JSON.stringify(result).includes('secret-token'),false);assert.ok(result.request);
 const primitive=await evaluateDiagnosticPrompt(cfg,{system:'probe',observation:{},fetchImpl:async()=>new Response(JSON.stringify({choices:[{message:{content:'[]'},finish_reason:'stop'}]}))});assert.match(primitive.validationReason,/array or primitive/);
});
test('focus uses only observer facts and describes both outcomes without revealing hidden role',()=>{
 const copy=focusRescue(observation);assert.equal(copy.decisionContext.target.role,null);assert.equal(copy.decisionContext.target.hp,0);assert.match(copy.decisionContext.alternatives[1].effect,/other responses may still rescue/);assert.match(copy.decisionContext.alternatives[0].effect,/restore 1 HP/);assert.equal(observation.decisionContext,undefined);
 const deep=focusRescue({...observation,players:[observation.players[0],{...observation.players[1],hp:-1}]});assert.match(deep.decisionContext.alternatives[0].effect,/1 additional HP/);
});
test('extractor reads only selected bot observation, not omniscient archive state',async()=>{
 const d=await mkdtemp(join(tmpdir(),'rescue-investigation-'));try{
  const file=join(d,'match.jsonl'),trace={type:'ai-trace',trace:{promptId:'q',attempts:[{request:{messages:[{content:JSON.stringify(observation)}]}}]}};
  await writeFile(file,JSON.stringify({type:'state',players:[{id:'target',role:'spy'}]})+'\n'+JSON.stringify(trace)+'\n');
  const o=await readRescueObservation(file,'q');assert.equal(o.players[1].role,null);assert.equal(o.prompt.deadline,undefined);await assert.rejects(readRescueObservation(file,'absent'),/not found/);
 }finally{await rm(d,{recursive:true,force:true});}
});
test('probes and decisions are independent and comparison order alternates',async()=>{
 const sent=[],fetchImpl=async(u,r)=>{const body=JSON.parse(r.body);sent.push(body);let value;
  if(sent.length===1)value={lordWin:'answer',peach:'answer',pass:'answer'};
  else if(sent.length===2)value={recentSequence:'answer',targetIdentityEvidence:'answer',availableChoices:'answer',uncertainty:'answer'};
  else value={action:'choose_options',option_ids:['pass']};
  return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(value)},finish_reason:'stop'}],usage:{prompt_tokens:1,completion_tokens:1}}));};
 const result=await investigate(observation,cfg,{fetchImpl,focusedFirst:true});assert.deepEqual(result.order,['focused','original']);assert.equal(result.original.status,'model');assert.equal(result.focused.status,'model');assert.equal(result.knowledge.answer.lordWin,'answer');
 const inputs=sent.map(b=>JSON.parse(b.messages[1].content));assert.ok(inputs[2].decisionContext);assert.equal(inputs[3].decisionContext,undefined);assert.equal(inputs[3].knowledge,undefined);assert.equal(inputs[3].comprehension,undefined);assert.equal(inputs[1].players[1].role,null);
});
