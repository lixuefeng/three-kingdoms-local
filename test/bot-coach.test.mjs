import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../engine.mjs';
import {ALL_GENERALS} from '../cards.mjs';
import {tacticalFacts} from '../bot-knowledge.mjs';
import {decisionBriefing} from '../bot-coach.mjs';
import {botObservation,createLLMProvider,llmConfig} from '../llm-provider.mjs';
function setup(general='xuchu'){
 const g=new Game(['a','b','c','d'].map(id=>({id,name:id})),{pause:async()=>{},botPacing:false});g.players.forEach((p,i)=>{p.general=ALL_GENERALS.find(x=>x.id===(i===0?general:'zhangfei'));p.role=['loyal','lord','rebel','spy'][i];p.hp=p.maxHp=4;});g.current=g.players[0];g.phase='Play';g.used={sha:0};return g;
}
test('end-phase briefing exposes the reported Xu Zhu forced-discard trap and playable draw',()=>{
 const g=setup(),p=g.players[0];p.hp=1;p.hand=[{id:'dodge',kind:'shan'},{id:'draw',kind:'draw2'},{id:'burn',kind:'dismantle'}];const q={zone:'turn',options:g.playOptions(p)},tactics=tacticalFacts(g,p,q),o=botObservation(g.view(p.id),p.id,q,'',{tactics});
 assert.equal(o.decisionBriefing.endPhaseForecast.discardCountIfEndNow,2);assert.equal(o.decisionBriefing.yourRole,'loyal');assert.ok(o.decisionBriefing.availableResourceActions.some(a=>a.optionId==='play:draw2:draw'));assert.equal(o.decisionBriefing.lord.playerId,'b');
});
test('discard forecast uses Composure state and expanded Lord hand limit',()=>{
 const g=setup('lvmeng'),p=g.players[0];p.hp=1;p.hand=[{id:'one'},{id:'two'},{id:'three'}];let facts=tacticalFacts(g,p,{zone:'turn',options:[]});assert.equal(facts.handEconomy.discardCountIfEndNow,0);assert.equal(facts.handEconomy.excessBeforeOptionalSkip,2);
 g.used.shaDuringPlay=true;assert.equal(tacticalFacts(g,p,{zone:'turn',options:[]}).handEconomy.discardCountIfEndNow,2);
 p.general=ALL_GENERALS.find(x=>x.id==='yuanshao');p.role='lord';g.players[1].general=ALL_GENERALS.find(x=>x.id==='lvbu');assert.equal(tacticalFacts(g,p,{zone:'turn',options:[]}).handEconomy.handLimit,3);
 g.current=g.players[1];assert.equal(tacticalFacts(g,p,{zone:'response',options:[]}).handEconomy.forecastAppliesToCurrentPlayPhase,false);
});
test('Assault coaching preserves alliance and exact draw tradeoff without invented hidden identities',()=>{
 const g=setup('zhangliao'),p=g.players[0],view=g.view(p.id),q={zone:'options',context:{kind:'raid'},options:[]},knowledge={roleBeliefs:[{playerId:'c',probabilities:{rebel:1,loyal:0,spy:0},basis:'Remaining public role counts'}]};
 const brief=decisionBriefing(view,p.id,q,{knowledge});assert.equal(brief.assaultTradeoff.normalDrawReplaced,true);assert.equal(brief.assaultTradeoff.declineDraws,2);assert.equal(brief.assaultTradeoff.cardsPerTarget,1);assert.equal(brief.relations.find(p=>p.playerId==='b').alliedProbability,1);assert.equal(brief.relations.find(p=>p.playerId==='c').alliedProbability,0);assert.equal(brief.relations.find(p=>p.playerId==='d').identityAssessment,undefined);
 // Even an over-complete source view must not leak another player's role/hand.
 view.players[2].role='rebel';view.players[2].hand=[{id:'SECRET'}];const before=decisionBriefing(view,p.id,q,null);view.players[2].role='spy';view.players[2].hand=[{id:'OTHER-SECRET'}];assert.deepEqual(decisionBriefing(view,p.id,q,null),before);assert.ok(!JSON.stringify(before).includes('SECRET'));
});
test('coaching is sent in the existing single request, and legal end is still accepted',async()=>{
 const g=setup(),p=g.players[0],q={id:'coach',zone:'turn',min:1,max:1,options:[{id:'end'}]};let calls=0,body;
 const provider=createLLMProvider(llmConfig({LLM_BASE_URL:'http://localhost/v1',LLM_MODEL:'mock'}),{fetchImpl:async(u,req)=>{calls++;body=JSON.parse(req.body);return new Response(JSON.stringify({choices:[{message:{content:'{"ids":["end"],"targets":[]}'}}]}));}});
 const result=await provider.decide({view:g.view(p.id),playerId:p.id,prompt:q,matchId:'coach',agentState:{tactics:tacticalFacts(g,p,q)}});assert.equal(calls,1);assert.deepEqual(result.ids,['end']);assert.match(body.messages[0].content,/maintain cover/);assert.match(body.messages[0].content,/Composure/);assert.match(body.messages[0].content,/costs/);assert.ok(JSON.parse(body.messages[1].content).decisionBriefing.endPhaseForecast);
});
