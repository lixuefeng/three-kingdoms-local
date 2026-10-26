import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../engine.mjs';
import {ALL_GENERALS} from '../cards.mjs';
import {ROLE_FOCUS,strategyGuidance} from '../bot-strategy.mjs';
import {createLLMProvider,llmConfig,gameplaySystemPrompt} from '../llm-provider.mjs';
import {prepareCase} from '../scripts/decision-bench.mjs';
const prompt={id:'end',zone:'turn',min:1,max:1,options:[{id:'end',label:'End Play Phase'}]};
function game(){const g=new Game(['a','b','c','d'].map((id,i)=>({id,name:id,bot:true,botMode:'llm',botModel:'custom',botStrategy:i===0?'role-focus':'current'})),{botPacing:false});g.players.forEach((p,i)=>{p.general=ALL_GENERALS.find(x=>x.id==='zhangfei');p.role=['rebel','lord','loyal','spy'][i];});g.current=g.players[0];g.phase='Play';return g;}
test('live role-focus prompt matches benchmark guidance exactly; no extra requests or seat leakage',async()=>{
 const g=game(),bodies=[],traces=[];const config={...llmConfig({LLM_BASE_URL:'http://localhost/v1',LLM_MODEL:'mock'}),debug:true,timeoutMs:1000};
 const provider=createLLMProvider(config,{onTrace:t=>traces.push(t),fetchImpl:async(u,r)=>{bodies.push(JSON.parse(r.body));return new Response(JSON.stringify({choices:[{message:{content:'{"action":"end_phase"}'},finish_reason:'stop'}]}));}});
 for(const botStrategy of ['role-focus','current'])assert.ok(await provider.decide({view:g.view('a'),playerId:'a',prompt,matchId:'m',botStrategy}));
 assert.equal(bodies.length,2);assert.equal(bodies[0].messages[0].content,prepareCase({id:'c',observation:{you:'a',players:[{id:'a'}],prompt}},'role-focus').system);
 assert.equal(bodies[0].messages[0].content,gameplaySystemPrompt()+strategyGuidance('role-focus'));
 assert.equal(bodies[1].messages[0].content,gameplaySystemPrompt());assert.ok(!bodies[1].messages[0].content.includes(ROLE_FOCUS));
 assert.deepEqual(traces.map(t=>t.botStrategy),['role-focus','current']);assert.throws(()=>strategyGuidance('invented'));
});
test('engine passes seat strategy to decisions and preserves it across model changes',async()=>{
 const g=game(),p=g.players[0];let input;g.decisions.set(p.id,{});g.llmProvider={enabled:true,decide:async x=>{input=x;return {ids:['end'],targets:[]};}};
 assert.deepEqual(await g.decideBot(p,prompt,['end']),['end']);assert.equal(input.botStrategy,'role-focus');
 g.setBotMode(p.id,'classic','classic');assert.equal(p.botStrategy,'role-focus');g.setBotMode(p.id,'llm','custom');assert.equal(p.botStrategy,'role-focus');
 assert.throws(()=>g.setBotMode(p.id,'llm','custom','bad'));assert.equal(p.botStrategy,'role-focus');
});
test('strategy change cancels pending request; stale strategy action never commits',async()=>{
 const g=game(),p=g.players[0];g.decisions.set(p.id,{});let entered,release;const ready=new Promise(r=>entered=r);
 g.llmProvider={enabled:true,decide:input=>{entered(input);return new Promise(r=>release=r);}};
 const pending=g.decideBot(p,prompt,['end']),input=await ready;g.setBotMode(p.id,'llm','custom','current');
 assert.equal(input.signal.aborted,true);assert.equal(input.isCurrent(),false);release({ids:['end'],targets:[]});
 await pending;assert.equal(g.plannedPlays.has(p.id),false);
});
