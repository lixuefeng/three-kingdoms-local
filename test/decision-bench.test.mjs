import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {prepareCase,runCase,gradeAction,markdownReport} from '../scripts/decision-bench.mjs';
import {llmConfig,botDecisionError} from '../llm-provider.mjs';
const cases=JSON.parse(await readFile(new URL('./fixtures/decision-cases.json',import.meta.url),'utf8'));
const config={...llmConfig({LLM_BASE_URL:'http://localhost/v1',LLM_MODEL:'mock',LLM_API_KEY:'secret-token'}),timeoutMs:50};
const mock=(action,finish='stop')=>async()=>new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(action)},finish_reason:finish}],usage:{prompt_tokens:100,completion_tokens:12}}));
test('fixture variants preserve every fact and action constraint',()=>{
 for(const c of cases){const a=prepareCase(c),b=prepareCase(c,'focused');assert.deepEqual(a.observation,b.observation);assert.equal(a.system,b.system);}
 assert.throws(()=>prepareCase(cases[0],'unknown'));
});
test('benchmark distinguishes strategy failure from illegal output and retains usage on failure',async()=>{
 const c=cases[0];
 const good=await runCase(c,config,'current',{fetchImpl:mock({ids:['play:tao:c1'],targets:[]})});assert.deepEqual(good.grade,{legality:'pass',strategy:'pass'});
 const bad=await runCase(c,config,'current',{fetchImpl:mock({ids:['end'],targets:[]})});assert.deepEqual(bad.grade,{legality:'pass',strategy:'fail'});
 const invalid=await runCase(c,config,'current',{fetchImpl:mock({ids:['missing'],targets:[]})});assert.equal(invalid.status,'invalid-choice');assert.equal(invalid.usage.completion_tokens,24);assert.equal(invalid.grade.strategy,'not-scored');
});
test('production normalization is reported separately from raw legality',async()=>{
 const result=await runCase(cases[0],config,'current',{fetchImpl:mock({ids:['play:tao:c1','end'],targets:[]})});
 assert.equal(result.status,'model');assert.ok(result.rawValidationReason);assert.match(result.normalization,/trailing end/);
});
test('truncation, credential redaction, timeout, Converse and independent runs',async()=>{
 const c=cases[0],truncated=await runCase(c,config,'current',{fetchImpl:mock({ids:[],targets:[]},'length')});assert.equal(truncated.status,'truncated-response');assert.equal(truncated.usage.prompt_tokens,100);
 const redacted=await runCase(c,config,'current',{fetchImpl:mock({ids:['end'],targets:[],memory:'secret-token'})});assert.ok(!JSON.stringify(redacted).includes('secret-token'));
 const timeout=await runCase(c,config,'current',{fetchImpl:()=>new Promise(()=>{})});assert.equal(timeout.status,'request-timeout');
 const result=await runCase(c,{...config,transport:'bedrock-converse'},'current',{fetchImpl:async()=>new Response(JSON.stringify({output:{message:{content:[{text:'{"ids":["end"],"targets":[]}'}]}},stopReason:'end_turn',usage:{inputTokens:3,outputTokens:4}}))});assert.equal(result.status,'model');assert.equal(result.usage.completion_tokens,4);
 let first;for(let i=0;i<2;i++)await runCase(c,config,'current',{fetchImpl:async(u,o)=>{const body=JSON.parse(o.body);if(first)assert.deepEqual(body,first);first=body;return mock({ids:['end'],targets:[],memory:'new memory'})();}});
});
test('all scored expectations offer at least one legal action; complete Rende is accepted',()=>{
 for(const c of cases.filter(c=>c.expected)){const ids=c.expected?.anyIds||[c.observation.prompt.options.find(o=>!c.expected?.avoidIds?.includes(o.id)).id];assert.equal(botDecisionError(c.observation.prompt,{ids:[ids[0]],targets:[]}),null);}
 const c=cases.find(c=>c.id==='rende-complete-action');assert.equal(botDecisionError(c.observation.prompt,{ids:['skill:rende'],targets:['p2'],costs:['c1','c2']}),null);
 assert.equal(gradeAction(c,{status:'model',action:{ids:['end'],targets:[]}}).strategy,'review');
 assert.match(markdownReport([{profile:'mock',variant:'current',elapsedMs:10,status:'model',grade:{legality:'pass',strategy:'review'}}]),/0\/0/);
});

test('tool mode investigates and submits without prescribing a move; usage includes every call',async()=>{
 let count=0;const row=await runCase(cases[0],config,'tools',{fetchImpl:async(u,o)=>{
  const body=JSON.parse(o.body),input=JSON.parse(body.messages[1].content);count++;
  if(count===1)return mock({tool:'preview',optionId:'play:tao:c1'})();
  assert.equal(input.toolHistory[0].result.option.id,'play:tao:c1');
  assert.ok(input.toolHistory[0].result.preview);return mock({ids:['play:tao:c1'],targets:[]})();
 }});
 assert.equal(row.status,'model');assert.equal(row.modelCalls,2);assert.equal(row.usage.prompt_tokens,200);assert.equal(row.rounds[0].toolCall.tool,'preview');
});
test('tool budget, invalid tools, cancellation and recorded follow-up boundaries',async()=>{
 const {decisionTool}=await import('../scripts/decision-tools.mjs');const observation=cases[0].observation;
 assert.match(decisionTool(observation,{tool:'preview',optionId:'invented'}).error,/Unknown/);
 assert.match(decisionTool(observation,{tool:'explore',optionId:'play:tao:c1',followUpId:'invented'}).error,/not in recorded/);
 const row=await runCase(cases[0],config,'tools',{fetchImpl:mock({tool:'inspect',subject:'self'})});assert.equal(row.status,'tool-budget-exhausted');assert.equal(row.modelCalls,4);assert.equal(row.usage.completion_tokens,48);
 const controller=new AbortController();controller.abort();let calls=0;const cancelled=await runCase(cases[0],config,'tools',{signal:controller.signal,fetchImpl:()=>{calls++;}});assert.equal(cancelled.status,'cancelled');assert.equal(calls,0);
});
test('corrected synthetic positions expose exact economy and consistent public state',()=>{
 const heal=cases[0].observation,tactics=heal.agentState.tactics;
 const peach=tactics.actionPreviews.find(p=>p.optionId==='play:tao:c1');assert.equal(peach.hpAfter,4);assert.equal(peach.handCountAfterKnownChanges,3);assert.equal(peach.handLimitAfterKnownChanges,4);assert.equal(peach.discardCountAfterKnownChanges,0);
 assert.equal(tactics.attackUsesRemaining,0);assert.equal(heal.players[0].handCount,4);
 assert.equal(tactics.actionPreviews.find(p=>p.optionId==='end').discardCountIfNoOtherEffects,1);
 const discard=cases[1].observation;assert.equal(discard.phase,'Discard');assert.equal(discard.players[0].handCount,4);
 assert.equal(cases[3].observation.players[0].equip.armor.kind,'bagua');
 assert.equal(cases[4].observation.players[1].handCount,1);assert.equal(cases[4].observation.players[1].hand,undefined);
});
