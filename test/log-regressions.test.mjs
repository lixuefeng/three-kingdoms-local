import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {prepareCase,runCase,gradeAction,VARIANT_BUDGETS} from '../scripts/decision-bench.mjs';
import {botDecisionError,llmConfig} from '../llm-provider.mjs';
const cases=JSON.parse(await readFile(new URL('./fixtures/log-regressions.json',import.meta.url),'utf8'));
const config={...llmConfig({LLM_BASE_URL:'http://localhost/v1',LLM_MODEL:'mock'}),timeoutMs:1000};
const response=action=>new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(action)},finish_reason:'stop'}],usage:{prompt_tokens:20,completion_tokens:5}}));
test('recorded inputs preserve legal choices and uncertain beliefs without labels or private identities',()=>{
 assert.equal(cases.length,7);
 for(const c of cases){
  const o=c.observation,text=JSON.stringify(o);
  JSON.stringify(o,(key,value)=>{if(typeof value==='string')assert.ok(!/\b[0-9a-f]{16}\b/i.test(value));return value;});assert.deepEqual(o.publicChat,[]);assert.equal(typeof o.memory,'string');assert.equal(o.prompt.deadline,undefined);
  for(const p of o.players){assert.match(p.id,/^p\d+$/);if(p.id!==o.you)assert.equal(p.hand,undefined);}
  assert.ok(o.agentState.knowledge.plan);
  if(c.historicalAction)assert.equal(botDecisionError(o.prompt,c.historicalAction),null,c.id);
  for(const v of Object.keys(VARIANT_BUDGETS)){const input=prepareCase(c,v);assert.equal(input.expected,undefined);assert.equal(input.observation.expected,undefined);assert.equal(input.observation.historicalAction,undefined);assert.deepEqual(input.observation,o);}
 }
 const ally=cases[0].observation.decisionBriefing.relations.find(r=>r.general==='Xiahou Yuan');assert.ok(ally.alliedProbability>.92&&ally.alliedProbability<1);assert.equal(ally.publicRole,null);
});
test('target rubric catches harmful alternatives, while accepting other legal actions',()=>{
 for(const c of cases.slice(0,2)){
  assert.equal(gradeAction(c,{status:'model',action:c.historicalAction}).strategy,'fail');
  assert.equal(gradeAction(c,{status:'model',action:{ids:['end'],targets:[]}}).strategy,'pass');
 }
 const c=cases[0],ally=c.expected.avoidActionTargets[0].targetId;
 assert.equal(gradeAction(c,{status:'model',action:{ids:['play:duel:c1'],targets:[ally]}}).strategy,'fail');
 assert.equal(gradeAction(c,{status:'invalid-choice'}).strategy,'not-scored');
 assert.equal(gradeAction(cases[4],{status:'model',action:cases[4].historicalAction}).strategy,'review');
});
test('review compares two model decisions without exposing rubric or executing a candidate',async()=>{
 const c=cases[0],bodies=[],ally=c.expected.avoidActionTargets[0].targetId;
 const row=await runCase(c,config,'review',{fetchImpl:async(u,r)=>{const body=JSON.parse(r.body);bodies.push(JSON.parse(body.messages[1].content));return response(bodies.length===1?{action:'play_card',option_id:'play:sha:c139',target_ids:[ally]}:{action:'end_phase'});}});
 assert.equal(row.firstPass.grade.strategy,'fail');assert.equal(row.grade.strategy,'pass');assert.equal(row.modelCalls,2);assert.equal(row.usage.prompt_tokens,40);
 assert.deepEqual(bodies[1].candidateAction.targets,[ally]);
 for(const input of bodies){assert.equal(input.expected,undefined);assert.equal(input.historicalAction,undefined);assert.equal(input.source,undefined);assert.equal(input.description,undefined);}
 assert.deepEqual(row.rounds.map(r=>r.stage),['initial','review']);
});
test('review does not silently retain an initial action if final review fails',async()=>{
 let n=0;const row=await runCase(cases[0],config,'review',{fetchImpl:async()=>++n===1?response({action:'end_phase'}):new Response('',{status:503})});
 assert.equal(row.status,'http-503');assert.equal(row.action,undefined);assert.equal(row.firstPass.status,'model');assert.equal(row.grade.legality,'fail');assert.equal(row.modelCalls,2);
});
test('prompt variants change guidance but not observed facts or allowed moves',()=>{
 const c=cases[0],baseline=prepareCase(c);
 for(const v of ['role-focus','consequence-focus']){const x=prepareCase(c,v);assert.deepEqual(x.observation,baseline.observation);assert.notEqual(x.system,baseline.system);}
 assert.throws(()=>prepareCase(c,'constructor'));
});
