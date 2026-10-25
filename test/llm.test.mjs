import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {Game} from '../engine.mjs';
import {ALL_GENERALS,makeDeck} from '../cards.mjs';
import {llmConfig,botObservation,validBotDecision,createLLMProvider} from '../llm-provider.mjs';
const config=()=>({...llmConfig({LLM_BASE_URL:'http://127.0.0.1:1234/v1',LLM_MODEL:'test'}),timeoutMs:1000});
const prompt={id:'q',zone:'turn',title:'Play',min:1,max:1,options:[{id:'hit',targetIds:['b'],targetMin:1,targetMax:1},{id:'end',targetIds:[],targetMin:0,targetMax:0}]};
function game(){const g=new Game(['a','b','c','d'].map(id=>({id,name:id,bot:true,botMode:id==='a'?'llm':'classic'})),{seedDeck:makeDeck()});g.players.forEach((p,i)=>{p.general=ALL_GENERALS.find(x=>x.id==='zhangfei');p.role=['rebel','lord','loyal','spy'][i];});g.current=g.players[0];g.phase='Play';return g;}
const response=d=>new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(d)}}],usage:{prompt_tokens:100,completion_tokens:10}}),{status:200});
test('Deflection accepts the captured legal card/target split but rejects incomplete or illegal redirects',async()=>{
 const target='6b66f7303cb1b8e7',q={id:'deflect',zone:'skill-plan',min:0,max:2,context:{kind:'deflection-plan',cardIds:['c73','weapon'],cardMin:1,cardMax:1,targetIds:[target,'c'],targetCount:1,targetIdsByCard:{c73:[target,'c'],weapon:['c']}},options:[{id:'c73'},{id:'weapon'},{id:target},{id:'c'}]},view=game().view('a');
 for(const [d,ok] of [[{ids:['c73'],targets:[target]},true],[{ids:['c73',target],targets:[]},true],[{ids:['weapon'],targets:[target]},false],[{ids:[],targets:[target]},false],[{ids:['c73'],targets:['unknown']},false],[{ids:['c73',target],targets:[target]},false]]){
  const traces=[],provider=createLLMProvider({...config(),debug:true},{fetchImpl:async()=>response(d),onTrace:t=>traces.push(t)}),result=await provider.decide({view,playerId:'a',prompt:q,matchId:'redirect'});
  assert.equal(!!result,ok,JSON.stringify(d));if(ok)assert.deepEqual(result,{ids:['c73',target],targets:[]});if(ok&&d.targets.length)assert.match(traces[0].normalization,/validated/);
 }
});
test('response contract explicitly offers armor activation; empty response never invents armor use',async()=>{
 const q={id:'dodge',zone:'response',min:1,max:1,options:[{id:'bagua'},{id:'pass'}]},view=game().view('a'),contract=botObservation(view,'a',q).prompt.responseContract;
 assert.deepEqual(contract.armorActivation,{ids:['bagua'],targets:[]});
 const provider=createLLMProvider(config(),{fetchImpl:async()=>response({ids:[],targets:[],memory:'Use armor'})});
 assert.equal(await provider.decide({view,playerId:'a',prompt:q,matchId:'empty'}),null);
 assert.equal(botObservation(view,'a',{...q,options:[{id:'pass'}]}).prompt.responseContract.armorActivation,undefined);
});
test('config is opt-in, validates endpoints and clamps limits',()=>{assert.equal(llmConfig({}).enabled,false);assert.throws(()=>llmConfig({LLM_BASE_URL:'file:///secret'}));assert.throws(()=>llmConfig({LLM_BASE_URL:'http://user:pass@localhost'}));assert.equal(llmConfig({LLM_TIMEOUT_MS:'999999'}).timeoutMs,60000);});
test('observation excludes opponent secrets, deck, private prompts, catalog and memories',()=>{const g=game();g.players[0].hand=[{id:'own-card',kind:'sha'}];g.players[2].hand=[{id:'secret-card',kind:'tao'}];const view=g.view('a');view.players[2].hand=g.players[2].hand;view.players[2].role='loyal';view.deck=[{id:'secret-deck'}];view.testingCards=['secret-test'];view.privateChat='secret-chat';view.otherMemory='secret-memory';const o=botObservation(view,'a',prompt,'own-plan'),s=JSON.stringify(o);for(const secret of ['secret-card','secret-deck','secret-test','secret-chat','secret-memory'])assert.ok(!s.includes(secret));assert.ok(s.includes('own-card'));assert.equal(o.players[2].role,null);assert.equal(o.players[1].role,'lord');assert.equal(o.memory,'own-plan');});
test('validation enforces legal ids, ordered targets, optional costs and skill plans',()=>{assert.ok(validBotDecision(prompt,{ids:['hit'],targets:['b']}));for(const d of [{ids:['hit'],targets:[]},{ids:['end'],targets:['b']},{ids:['unknown']},{ids:['hit'],targets:['b','b']}])assert.equal(validBotDecision(prompt,d),false);const q={...prompt,zone:'cards',min:0,max:2,context:{kind:'optional-cost',cardCount:2},options:[{id:'x'},{id:'y'}]};assert.ok(validBotDecision(q,{ids:[],targets:[]}));assert.equal(validBotDecision(q,{ids:['x'],targets:[]}),false);assert.ok(validBotDecision(q,{ids:['x','y'],targets:[]}));const plan={...q,zone:'skill-plan',min:0,max:3,options:[{id:'x'},{id:'b'},{id:'c'}],context:{cardIds:['x'],targetIds:['b','c'],cardMin:1,cardMax:1,targetCount:2,firstTargetIds:['b']}};assert.ok(validBotDecision(plan,{ids:['x','b','c'],targets:[]}));assert.equal(validBotDecision(plan,{ids:['x','c','b'],targets:[]}),false);});
test('HTTP adapter sends compatible requests, validates responses and isolates memory by seat/match',async t=>{const bodies=[];const server=http.createServer(async(req,res)=>{let text='';for await(const chunk of req)text+=chunk;assert.equal(req.url,'/v1/chat/completions');bodies.push(JSON.parse(text));res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{message:{content:JSON.stringify({ids:['end'],targets:[],memory:'private-plan'})}}],usage:{prompt_tokens:2,completion_tokens:3}}));});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>{server.closeAllConnections();server.close();});const provider=createLLMProvider({...config(),base:'http://127.0.0.1:'+server.address().port+'/v1'}),view=game().view('a');for(const [matchId,playerId] of [['one','a'],['one','a'],['two','a'],['one','b']])assert.deepEqual((await provider.decide({view,playerId,prompt,matchId})).ids,['end']);const obs=bodies.map(b=>JSON.parse(b.messages[1].content));assert.equal(obs[0].memory,'');assert.equal(obs[1].memory,'private-plan');assert.equal(obs[2].memory,'');assert.equal(obs[3].memory,'');assert.equal(provider.status().seats['one:a'].inputTokens,4);assert.ok(!JSON.stringify(provider.status()).includes('private-plan'));});
test('malformed, illegal, stale, HTTP failures and hanging requests return safe fallback',async()=>{for(const fetchImpl of [async()=>new Response('oops'),async()=>response({ids:['hit'],targets:['secret']}),async()=>new Response('key-secret',{status:401}),()=>new Promise(()=>{})]){const provider=createLLMProvider({...config(),timeoutMs:20},{fetchImpl});const result=await provider.decide({view:game().view('a'),playerId:'a',prompt,matchId:'x'});assert.equal(result,null);assert.equal(provider.status().seats['x:a'].fallbacks,1);assert.ok(!JSON.stringify(provider.status()).includes('key-secret'));}let current=true;const provider=createLLMProvider(config(),{fetchImpl:async()=>{current=false;return response({ids:['end'],targets:[]});}});assert.equal(await provider.decide({view:game().view('a'),playerId:'a',prompt,matchId:'x',isCurrent:()=>current}),null);});
test('engine uses valid model targets and falls back without spending cards on invalid choices',async()=>{const g=game(),p=g.players[0];g.decisions.set(p.id,{});let body;g.llmProvider=createLLMProvider(config(),{fetchImpl:async(u,o)=>{body=JSON.parse(o.body);return response({ids:['hit'],targets:['b']});}});assert.deepEqual(await g.decideBot(p,prompt,['end']),['hit']);assert.deepEqual(g.plannedPlays.get('a').targetIds,['b']);assert.ok(body.messages[1].content);g.plannedPlays.clear();g.llmProvider=createLLMProvider(config(),{fetchImpl:async()=>response({ids:['invalid']})});const q={...prompt,options:[{id:'end',label:'End Play Phase'}]};assert.deepEqual(await g.decideBot(p,q,['end']),['end']);assert.equal(g.plannedPlays.size,0);});
test('request cap and cancellation prevent additional network use',async()=>{let requests=0;const provider=createLLMProvider({...config(),requestLimit:1},{fetchImpl:async()=>{requests++;return response({ids:['end'],targets:[]});}}),input={view:game().view('a'),playerId:'a',prompt,matchId:'x'};assert.ok(await provider.decide(input));assert.equal(await provider.decide(input),null);assert.equal(requests,1);const controller=new AbortController();controller.abort();assert.equal(await provider.decide({...input,matchId:'new',signal:controller.signal}),null);assert.equal(requests,1);});

test('LLM decisions participate in real shared response windows without extending the deadline',async()=>{const g=game();g.botPacing=false;g.responseWindowMs=200;g.llmProvider=createLLMProvider(config(),{fetchImpl:async()=>response({ids:['pass'],targets:[]})});const start=Date.now(),answers=await g.sharedResponses('negation','Negation?',p=>p.id==='a'?[{id:'negate',label:'Negation'},{id:'pass',label:'Pass'}]:[{id:'pass',label:'Pass'}],{kind:'negation'});assert.equal(answers[0].id,'pass');assert.equal(g.llmProvider.status().seats[g.matchId+':a'].successes,1);assert.ok(Date.now()-start<200);assert.equal(g.prompts.size,0);});
test('stopping a game cancels an outstanding model decision',async()=>{const g=game();g.botPacing=false;let began;const entered=new Promise(r=>began=r);g.llmProvider=createLLMProvider(config(),{fetchImpl:()=>{began();return new Promise(()=>{});}});const pending=g.ask(g.players[0],'Choose',[{id:'yes'},{id:'no'}]);await entered;g.stop();await assert.rejects(pending);});
test('complete matches cover model decisions and fallback with expanded interaction types',async()=>{
 const {botDecision}=await import('../bots.mjs');let successes=0;
 const sets=[['guojia','diaochan','sunquan','zhangliao'],['yuji','taishici','zhangjiao','xiaoqiao'],['zhoutai','pangtong','menghuo','zhurong']];
 for(const generals of sets){let g,asks=0;const provider=createLLMProvider({...config(),requestLimit:1000},{fetchImpl:async(url,req)=>{const o=JSON.parse(JSON.parse(req.body).messages[1].content);const d=botDecision(g.view(o.you),o.you,o.prompt,g.used)||{ids:o.prompt.options.slice(0,o.prompt.min).map(x=>x.id)};return response({...d,targets:d.targets||[]});}});
  g=new Game(generals.map((general,i)=>({id:String(i),name:'Bot '+i,bot:true,botMode:i===0?'llm':'classic',testGeneral:general})),{testing:true,expandedGenerals:true,maneuver:true,llmProvider:provider,botPacing:false,ask:async(p,q,f)=>{assert.ok(++asks<10000);return g.decideBot(p,q,f);}});
  await g.start();assert.ok(g.winner);assert.ok(provider.status().seats[g.matchId+':0'].successes>0);successes+=provider.status().seats[g.matchId+':0'].successes;
  const cards=[...g.deck,...g.discard,...g.table,...g.reserved,...g.players.flatMap(p=>[...g.allCards(p),...(p.wounds||[])])];assert.equal(new Set(cards.map(c=>c.id)).size,g.totalCards);
 }
 assert.ok(successes>3);
});
test('switching to a practice bot cancels a pending request and immediately returns fallback',async()=>{const g=game();g.botPacing=false;let began;const entered=new Promise(r=>began=r);g.llmProvider=createLLMProvider(config(),{fetchImpl:()=>{began();return new Promise(()=>{});}});const p=g.players[0],pending=g.ask(p,'Play',[{id:'end',label:'End Play Phase'}],{zone:'turn'});await entered;g.setBotMode(p.id,'classic');assert.deepEqual(await pending,['end']);assert.equal(g.botRequests.size,0);});

test('Bedrock catalog reuses the existing endpoint/token and keeps local/custom models compatible',async()=>{
 const {createModelRouter}=await import('../llm-provider.mjs');const c=llmConfig({LLM_BASE_URL:'https://bedrock-runtime.us-east-1.amazonaws.com/openai/v1',LLM_MODEL:'moonshotai.kimi-k2.5',LLM_API_KEY:'secret'});assert.deepEqual(c.profiles.map(p=>p.id),['kimi','claude','deepseek']);assert.equal(c.defaultProfile,'kimi');assert.equal(c.profiles[1].transport,'bedrock-converse');assert.equal(c.profiles[1].base,'https://bedrock-runtime.us-east-1.amazonaws.com');const router=createModelRouter(c);assert.ok(router.supports('claude'));assert.ok(!JSON.stringify(router.models).includes('secret'));assert.ok(!JSON.stringify(router.models).includes('https://'));const local=llmConfig({LLM_BASE_URL:'http://localhost:1234/v1',LLM_MODEL:'local'});assert.deepEqual(local.profiles.map(p=>p.id),['custom']);assert.equal(local.profiles[0].key,'');
});
test('Claude Converse request, text blocks and token usage normalize to validated bot choices',async()=>{
 const c={...config(),transport:'bedrock-converse',base:'https://bedrock-runtime.us-east-1.amazonaws.com',model:'us.anthropic.claude-haiku-5-5',key:'private-key'};let request;const p=createLLMProvider(c,{fetchImpl:async(url,options)=>{request={url,...options};return new Response(JSON.stringify({output:{message:{role:'assistant',content:[{reasoningContent:{text:'ignored'}},{text:'{"ids":["end"],"targets":[]}' }]}},usage:{inputTokens:21,outputTokens:8},stopReason:'end_turn'}));}});assert.deepEqual((await p.decide({view:game().view('a'),playerId:'a',prompt,matchId:'x'})).ids,['end']);assert.equal(request.url,c.base+'/model/us.anthropic.claude-haiku-5-5/converse');const body=JSON.parse(request.body);assert.ok(body.system[0].text);assert.ok(body.messages[0].content[0].text);assert.equal(body.inferenceConfig.maxTokens,c.maxTokens);assert.ok(!body.response_format);assert.ok(!body.model);assert.equal(request.headers.Authorization,'Bearer private-key');assert.equal(p.status().seats['x:a'].inputTokens,21);
});
test('model switching routes to different transports and shares the per-seat request cap',async()=>{
 const {createModelRouter}=await import('../llm-provider.mjs');const base=config(),urls=[];const router=createModelRouter({...base,requestLimit:2,defaultProfile:'kimi',profiles:[{...base,id:'kimi',label:'Kimi'},{...base,id:'claude',label:'Claude',transport:'bedrock-converse'}]},{fetchImpl:async(url)=>{urls.push(url);return url.endsWith('/converse')?new Response(JSON.stringify({output:{message:{content:[{text:'{"ids":["end"],"targets":[]}'}]}},usage:{inputTokens:2,outputTokens:1}})):response({ids:['end'],targets:[]});}});const input={view:game().view('a'),playerId:'a',prompt,matchId:'x'};assert.ok(await router.decide({...input,modelProfile:'kimi'}));assert.ok(await router.decide({...input,modelProfile:'claude'}));assert.equal(await router.decide({...input,modelProfile:'kimi'}),null);assert.equal(urls.length,2);assert.ok(urls[0].endsWith('/chat/completions'));assert.ok(urls[1].endsWith('/converse'));assert.equal(router.status().seats['x:a'].successes,2);assert.equal(router.status().seats['x:a'].lastStatus,'request-limit');
});
test('debug traces are opt-in, match scoped, bounded and redact credentials',async()=>{
 const {createModelRouter}=await import('../llm-provider.mjs');for(const debug of [false,true]){const c={...config(),profiles:undefined,debug,key:'secret-token',requestLimit:100};const router=createModelRouter(c,{fetchImpl:async()=>response({ids:['end'],memory:'secret-token'})});const input={view:game().view('a'),playerId:'a',prompt,matchId:'x'};for(let i=0;i<22;i++)await router.decide(input);assert.equal(router.traces('x').length,debug?20:0);assert.deepEqual(router.traces('other'),[]);const text=JSON.stringify(router.traces('x'));assert.ok(!text.includes('secret-token'));assert.ok(!text.includes('Authorization'));if(debug){assert.ok(text.includes('You play Three Kingdoms'));assert.ok(router.traces('x')[0].response);}router.forget('x');assert.deepEqual(router.traces('x'),[]);}
});
test('LLM requests carry persistent agent state and return optional plans without bypassing choice validation',async()=>{let body;const provider=createLLMProvider(config(),{fetchImpl:async(url,req)=>{body=JSON.parse(req.body);return response({ids:['end'],targets:[],plan:{objective:'Preserve Peach',steps:[],reserveCardIds:[]}});}});const result=await provider.decide({view:game().view('a'),playerId:'a',prompt,matchId:'x',agentState:{knowledge:{eventsObservedSinceStart:9000,plan:{objective:'Earlier goal'}},tactics:{attackUsesRemaining:1}}});assert.equal(JSON.parse(body.messages[1].content).agentState.knowledge.eventsObservedSinceStart,9000);assert.equal(result.plan.objective,'Preserve Peach');assert.ok(body.messages[0].content.includes('roleBeliefs are heuristic guesses'));});

test('complete action contract requires both arrays and rejects plan-only responses',()=>{
 assert.equal(llmConfig({}).maxTokens,1500);
 assert.equal(llmConfig({LLM_MAX_TOKENS:'700'}).maxTokens,700);
 for(const d of [{plan:{objective:'wait'}},{ids:['end']}])assert.equal(validBotDecision(prompt,d),false);
 assert.ok(validBotDecision(prompt,{ids:['end'],targets:[],plan:{objective:'wait'}}));
});
test('card selection ignores only redundant known player targets, never changes costs or turn targets',async()=>{
 const q={id:'pindian',zone:'cards',min:1,max:1,options:[{id:'c160'}]},view=game().view('a');
 for(const [zone,ids,targets,ok] of [['cards',['c160'],['b'],true],['cards',['bad'],['b'],false],['cards',['c160'],['secret'],false],['cards',['c160'],['b','b'],false],['cards',['c160'],null,false],['skill-plan',['c160'],['b'],false],['turn',['end'],['b'],false]]){
  const traces=[],provider=createLLMProvider({...config(),debug:true},{fetchImpl:async()=>response({ids,targets}),onTrace:t=>traces.push(t)});
  const result=await provider.decide({view,playerId:'a',prompt:zone==='turn'?prompt:{...q,zone},matchId:'x'});
  assert.equal(!!result,ok,JSON.stringify({zone,ids,targets}));
  if(ok){assert.deepEqual(result,{ids:['c160'],targets:[]});assert.ok(traces[0].normalization);}
  else{assert.equal(provider.status().seats['x:a'].inputTokens,100);assert.ok(traces[0].validationReason);}
 }
});
test('truncated Claude and OpenAI output preserve usage and stop reason before JSON parsing',async()=>{
 for(const converse of [false,true]){
  const traces=[],payload=converse?{output:{message:{content:[{reasoningContent:{reasoningText:{text:''}}},{text:'{"ids":["end"],"targets":[],"plan":{"reserveCard'}]}},stopReason:'max_tokens',usage:{inputTokens:9769,outputTokens:700}}:{choices:[{message:{content:'{"ids":'},finish_reason:'length'}],usage:{prompt_tokens:9769,completion_tokens:700}};
  const provider=createLLMProvider({...config(),debug:true,...(converse?{transport:'bedrock-converse'}:{})},{fetchImpl:async()=>new Response(JSON.stringify(payload)),onTrace:t=>traces.push(t)});
  assert.equal(await provider.decide({view:game().view('a'),playerId:'a',prompt,matchId:'x'}),null);
  const s=provider.status().seats['x:a'];assert.equal(s.lastStatus,'truncated-response');assert.equal(s.inputTokens,9769);assert.equal(s.outputTokens,700);assert.equal(traces[0].stopReason,converse?'max_tokens':'length');
 }
});
test('JSON failures and invalid actions retain provider token usage and detailed reasons',async()=>{
 for(const [content,status,reason] of [['not json','invalid-response','valid JSON'],[JSON.stringify({plan:{objective:'wait'}}),'invalid-choice','ids'],[JSON.stringify({ids:['hit'],targets:['secret']}),'invalid-choice','Illegal target']]){
  const traces=[],p=createLLMProvider({...config(),debug:true},{fetchImpl:async()=>new Response(JSON.stringify({choices:[{message:{content},finish_reason:'stop'}],usage:{prompt_tokens:3743,completion_tokens:82}})),onTrace:t=>traces.push(t)});
  assert.equal(await p.decide({view:game().view('a'),playerId:'a',prompt,matchId:'x'}),null);
  assert.equal(p.status().seats['x:a'].lastStatus,status);assert.equal(p.status().seats['x:a'].outputTokens,82);assert.ok(traces[0].validationReason.includes(reason));
 }
});
test('chat parse failures also retain usage and truncation status',async()=>{
 for(const finish_reason of ['stop','length']){
  const p=createLLMProvider(config(),{fetchImpl:async()=>new Response(JSON.stringify({choices:[{message:{content:'{"reply":'},finish_reason}],usage:{prompt_tokens:50,completion_tokens:12}}))});
  assert.equal(await p.reply({context:{},playerId:'a',matchId:'x'}),null);const s=p.status().seats['x:a'];assert.equal(s.chatFallbacks,1);assert.equal(s.inputTokens,50);assert.equal(s.outputTokens,12);assert.equal(s.lastStatus,finish_reason==='length'?'truncated-response':'invalid-response');
 }
});

test('optional metadata is sanitized without weakening action validation',async()=>{
 const view=game().view('a');view.players[0].hand=[{id:'c54',kind:'shan'}];
 for(const optional of [{plan:{objective:'Protect Lord',steps:[]},reserveCardIds:['c54','secret']},{plan:'wrong',extra:'ignored'},{plan:{objective:42,steps:[null,{kind:'unknown'}]},memory:{wrong:true}}]){
  const traces=[],p=createLLMProvider({...config(),debug:true},{fetchImpl:async()=>response({ids:['hit'],targets:['b'],...optional}),onTrace:t=>traces.push(t)});
  const d=await p.decide({view,playerId:'a',prompt,matchId:'x'});assert.deepEqual(d.ids,['hit']);assert.deepEqual(d.targets,['b']);
  if(optional.reserveCardIds){assert.deepEqual(d.plan.reserveCardIds,['c54']);assert.ok(traces[0].normalization.includes('Moved reserveCardIds'));}
 }
 const p=createLLMProvider(config(),{fetchImpl:async()=>response({ids:['hit'],targets:['secret'],reserveCardIds:['c54']})});assert.equal(await p.decide({view,playerId:'a',prompt,matchId:'x'}),null);
});
test('timeouts retain their cause even when fetch rejects immediately on abort',async()=>{
 for(const deadlineLimited of [false,true]){
  const traces=[],p=createLLMProvider({...config(),debug:true,timeoutMs:deadlineLimited?1000:15},{fetchImpl:(url,{signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new Error('AbortError')),{once:true})),onTrace:t=>traces.push(t)});
  assert.equal(await p.decide({view:game().view('a'),playerId:'a',prompt:deadlineLimited?{...prompt,deadline:Date.now()+175}:prompt,matchId:'x'}),null);
  assert.equal(traces[0].status,deadlineLimited?'decision-expired':'request-timeout');
 }
});
test('explicit external abort reasons survive transport errors and pre-aborted signals',async()=>{
 for(const reason of ['window-closed','model-switched','match-ended','decision-expired','cancelled'])for(const early of [false,true]){
  const c=new AbortController(),traces=[];let started;const ready=new Promise(r=>started=r);
  const p=createLLMProvider({...config(),debug:true},{fetchImpl:(url,{signal})=>{started();return new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new Error('AbortError')),{once:true}));},onTrace:t=>traces.push(t)});
  if(early)c.abort(new Error(reason));const job=p.decide({view:game().view('a'),playerId:'a',prompt,matchId:'x',signal:c.signal});
  if(!early){await ready;c.abort(new Error(reason));}assert.equal(await job,null);assert.equal(traces[0].status,reason);
 }
});
test('engine model switch and shared response deadline propagate cancellation reasons',async()=>{
 for(const mode of ['switch','window']){
  const g=game(),traces=[];let started;const ready=new Promise(r=>started=r);g.botPacing=false;
  g.llmProvider=createLLMProvider({...config(),debug:true},{fetchImpl:(url,{signal})=>{started();return new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new Error('AbortError')),{once:true}));},onTrace:t=>traces.push(t)});
  if(mode==='switch'){g.decisions.set('a',{});const job=g.decideBot(g.players[0],prompt,['end']);await ready;g.setBotMode('a','classic','practice');await job;assert.equal(traces[0].status,'model-switched');}
  else{g.responseWindowMs=190;g.autoResponseWindow=false;await g.sharedResponses('negation','Negation?',p=>p.id==='a'?[{id:'negate'},{id:'pass'}]:[{id:'pass'}],{kind:'negation'});assert.equal(traces[0].status,'decision-expired');}
 }
});

test('one legal action followed by end is normalized, never auto-ends or repairs illegal targets',async()=>{
 for(const [ids,targets,ok] of [[['hit','end'],['b'],true],[['hit','end'],['secret'],false],[['hit','hit'],['b'],false],[['end','hit'],[],false],[['bad','end'],[],false]]){
  const traces=[],p=createLLMProvider({...config(),debug:true},{fetchImpl:async()=>response({ids,targets}),onTrace:t=>traces.push(t)});
  const d=await p.decide({view:game().view('a'),playerId:'a',prompt,matchId:'x'});assert.equal(!!d,ok);if(ok){assert.deepEqual(d.ids,['hit']);assert.deepEqual(d.targets,['b']);assert.ok(traces[0].normalization.includes('trailing end'));}
 }
});
test('LLM shared windows use a uniform 15 seconds regardless of response-card ownership',async()=>{
 for(const holder of ['a','b']){
  const g=game();g.botPacing=false;g.players[1].botMode='classic';let deadline;
  g.llmProvider={enabled:true,decide:async({prompt:q})=>{deadline=q.deadline-q.startedAt;return {ids:['pass'],targets:[]};}};
  // Everyone is a bot; practice seats resolve immediately, including when the LLM holds no card.
  const original=g.botAnswer.bind(g);g.botAnswer=(p,q,defaults)=>{deadline=q.deadline-q.startedAt;return defaults;};
  await g.sharedResponses('negation','Negation?',p=>p.id===holder?[{id:'negate'},{id:'pass'}]:[{id:'pass'}],{kind:'negation'});
  assert.equal(deadline,15000);g.botAnswer=original;
 }
 const g=game();g.botPacing=false;g.players.forEach(p=>p.botMode='classic');g.llmProvider={enabled:true};let deadline;g.botAnswer=(p,q,defaults)=>{deadline=q.deadline-q.startedAt;return defaults;};
 await g.sharedResponses('rescue','Rescue?',p=>p.id==='a'?[{id:'tao'},{id:'pass'}]:[{id:'pass'}],{kind:'rescue'});assert.equal(deadline,5000);
});
