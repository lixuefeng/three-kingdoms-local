import test from 'node:test';
import assert from 'node:assert/strict';
import {ALL_GENERALS} from '../cards.mjs';
import {GENERAL_STRATEGIES,generalStrategyContext} from '../general-strategy.mjs';
import {botObservation,createLLMProvider,llmConfig} from '../llm-provider.mjs';
test('every supported general has a sourced version-aware strategic playbook',()=>{
 assert.deepEqual(Object.keys(GENERAL_STRATEGIES).sort(),ALL_GENERALS.map(g=>g.id).sort());
 for(const g of ALL_GENERALS){const s=GENERAL_STRATEGIES[g.id];assert.ok(s.plan&&s.avoid&&s.facing&&s.version,g.id);assert.equal(s.priorities.length,3,g.id);assert.ok(s.sources.length,g.id);assert.ok(s.sources.every(x=>/^https:\/\/(www\.sanguosha\.(com|cn)|sanguosha\.com|gltjk\.com)\//.test(x.url)),g.id);}
});
test('only own full guide and living public matchup summaries enter the observation',()=>{
 const players=['zhangliao','liubei','yuji','dongzhuo'].map((id,i)=>({id:String(i),name:'name',general:ALL_GENERALS.find(g=>g.id===id),alive:i!==3,role:i===0?'loyal':i===1?'lord':null,hp:3,handCount:2,hand:i===0?[]:undefined})),view={players},q={id:'raid',zone:'options',options:[]};
 const o=botObservation(view,'0',q),s=o.generalStrategy;assert.equal(s.generalId,'zhangliao');assert.equal(s.matchups.length,2);assert.ok(s.priorities.some(t=>t.includes('Lord')));assert.equal(s.matchups[0].priorities,undefined);assert.ok(!JSON.stringify(s).includes(GENERAL_STRATEGIES.yuji.plan));
 const before=JSON.stringify(s);players[2].role='spy';players[2].hand=[{id:'SECRET'}];assert.equal(JSON.stringify(generalStrategyContext(view,'0',q)),before);
});
test('selection provides only offered candidate plans and excludes unoffered generals',()=>{
 const s=generalStrategyContext({players:[{id:'a'}]},'a',{zone:'general',options:[{id:'sunquan'},{id:'xuchu'}]});assert.deepEqual(s.candidateNotes.map(x=>x.generalId),['sunquan','xuchu']);assert.equal(s.priorities,undefined);
});
test('old-version guidance excludes revised skills and highlights resource tradeoffs',()=>{
 assert.match(GENERAL_STRATEGIES.huangzhong.avoid,/OLD/);assert.match(GENERAL_STRATEGIES.weiyan.avoid,/No Qimou/);assert.match(GENERAL_STRATEGIES.zhoutai.avoid,/No Fenji/);assert.match(GENERAL_STRATEGIES.yuji.avoid,/truthful non-Heart fails/);assert.match(GENERAL_STRATEGIES.xiahouyuan.priorities.join(' '),/entire Play Phase/);assert.match(GENERAL_STRATEGIES.zhouyu.avoid,/choose the gift/);assert.match(GENERAL_STRATEGIES.xuchu.avoid,/expires this turn/);
});
test('researched own guide reaches the model in one normal decision request',async()=>{
 let count=0,request;const p={id:'a',name:'Bot',general:ALL_GENERALS.find(g=>g.id==='sunquan'),role:'rebel',alive:true,hp:4,handCount:0,hand:[]},provider=createLLMProvider(llmConfig({LLM_BASE_URL:'http://localhost/v1',LLM_MODEL:'mock'}),{fetchImpl:async(u,r)=>{count++;request=JSON.parse(r.body);return new Response(JSON.stringify({choices:[{message:{content:'{"ids":["end"],"targets":[]}'}}]}));}});
 assert.ok(await provider.decide({view:{players:[p]},playerId:'a',matchId:'guide',prompt:{id:'q',zone:'turn',min:1,max:1,options:[{id:'end'}]}}));assert.equal(count,1);const obs=JSON.parse(request.messages[1].content);assert.equal(obs.generalStrategy.generalId,'sunquan');assert.match(obs.generalStrategy.priorities.join(' '),/cost IDs/);assert.match(request.messages[0].content,/generalStrategy/);
});
