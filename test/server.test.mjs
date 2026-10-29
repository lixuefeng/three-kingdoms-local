import test from 'node:test';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createApp} from '../server.mjs';
async function fixture(t,options){const app=createApp({dataDirectory:null,...options});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));t.after(()=>{for(const room of app.rooms.values())room.game?.stop();app.server.closeAllConnections();app.server.close();});const base=`http://127.0.0.1:${app.server.address().port}`;const req=async(path,body,token,extra={})=>{const res=await fetch(base+'/api/'+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...extra},body:body===undefined?undefined:JSON.stringify(body)});return {status:res.status,data:await res.json()};};return {...app,base,req};}
test('room lifecycle, authentication, password, ready, hidden state, reconnect and reset',async t=>{
 const {req,rooms}=await fixture(t);
 const created=await req('create',{name:'Host',password:'friend-only',seconds:15});assert.equal(created.status,200);const {token,state}=created.data;const code=state.room.code;
 assert.equal((await req('join',{name:'Intruder',code,password:'wrong'})).status,400);
 const second=(await req('join',{name:'Friend',code,password:'friend-only'})).data;assert.ok(second.token);
 assert.equal((await req('state')).status,400);
 assert.equal((await req('start',{},second.token)).status,400);
 assert.equal((await req('bot',{},token)).status,200);assert.equal((await req('bot',{},token)).status,200);
 assert.equal((await req('start',{},token)).status,400);
 assert.equal((await req('ready',{ready:true},second.token)).status,200);
 assert.equal((await req('start',{},token)).status,200);
 assert.equal((await req('join',{name:'Late',code,password:'friend-only'})).status,400);
 let view=(await req('state',undefined,token)).data;assert.equal(view.room.status,'playing');assert.equal(view.game.players.filter(p=>p.hand!==undefined).length,1);assert.ok(view.game.players.filter(p=>p.id!==view.room.me&&p.role!=='lord').every(p=>p.role===null));
 const game=rooms.get(code).game;let target;for(let i=0;i<80&&!target;i++){target=game.players.find(p=>game.prompts.has(p.id));if(!target)await new Promise(r=>setTimeout(r,25));}assert.ok(target,'human general selection prompt appears');const targetToken=target.id===state.room.me?token:second.token;
 if(!target.bot){const q=game.prompts.get(target.id);assert.equal((await req('answer',{promptId:q.id,ids:[q.options[0].id]},targetToken)).status,200);}
 assert.equal((await req('answer',{promptId:'fake',ids:['fake']},token)).status,400);
 assert.equal((await req('reset',{},token)).status,400);
 assert.equal((await req('abort',{},second.token)).status,400);
 assert.equal((await req('abort',{},token)).status,200);
 view=(await req('state',undefined,token)).data;assert.equal(view.game,null);assert.equal(view.room.status,'lobby');assert.equal(view.room.players.length,4);
 assert.equal((await req('kick',{id:second.state.room.me},token)).status,200);
 assert.equal((await req('state',undefined,second.token)).status,400);
});
test('HTTP serves local assets, rejects cross-origin mutations and path traversal',async t=>{const {base,req}=await fixture(t);const page=await fetch(base);assert.equal(page.status,200);assert.match(await page.text(),/Private Table/);assert.match(page.headers.get('content-security-policy'),/frame-ancestors 'none'/);assert.equal((await fetch(base+'/server.mjs')).status,404);assert.equal((await req('create',{name:'X'},null,{Origin:'http://untrusted.example'})).status,403);});
test('authenticated event stream restores personalized state after reconnect',async t=>{const {base,req}=await fixture(t);const a=(await req('create',{name:'A'})).data;const ctrl=new AbortController();const res=await fetch(base+'/api/events',{headers:{Authorization:'Bearer '+a.token},signal:ctrl.signal});assert.equal(res.status,200);const reader=res.body.getReader();let text='';while(!text.includes('data: ')){const r=await reader.read();text+=new TextDecoder().decode(r.value);}assert.match(text, new RegExp(a.state.room.code));ctrl.abort();await reader.cancel().catch(()=>{});assert.equal((await req('state',undefined,a.token)).data.room.me,a.state.room.me);});
test('all general portraits and seating assets are served locally with safe paths and image caching',async t=>{
 const {base}=await fixture(t);const {ALL_GENERALS:GENERALS}=await import('../cards.mjs');
 for(const g of GENERALS){const res=await fetch(base+'/portraits/'+g.id+'.jpg');assert.equal(res.status,200,g.id);assert.equal(res.headers.get('content-type'),'image/jpeg');assert.match(res.headers.get('cache-control'),/max-age=86400/);assert.deepEqual([...new Uint8Array(await res.arrayBuffer()).slice(0,2)],[255,216]);}
 assert.equal((await fetch(base+'/network.mjs')).status,200);assert.equal((await fetch(base+'/tabletop.css')).status,200);assert.equal((await fetch(base+'/feedback.mjs')).status,200);assert.equal((await fetch(base+'/table.mjs')).status,200);assert.equal((await fetch(base+'/interaction.mjs')).status,200);assert.equal((await fetch(base+'/interaction.css')).status,200);assert.equal((await fetch(base+'/seating.css')).status,200);assert.equal((await fetch(base+'/fullscreen.css')).status,200);assert.equal((await fetch(base+'/portraits/not-a-general.jpg')).status,404);
});

test('exact public origins support reverse proxies without allowing arbitrary websites',async t=>{
 const {req}=await fixture(t,{publicOrigins:['https://friends.example','http://friends.example:8080']});
 assert.equal((await req('create',{name:'TunnelUser'},null,{Origin:'https://friends.example'})).status,200);
 assert.equal((await req('create',{name:'PortUser'},null,{Origin:'http://friends.example:8080'})).status,200);
 for(const origin of ['https://evil.example','http://friends.example','https://friends.example:444','https://friends.example.evil.test','null'])assert.equal((await req('create',{name:'Blocked'},null,{Origin:origin})).status,403,origin);
 assert.equal((await req('create',{name:'Spoofed'},null,{Origin:'https://evil.example','X-Forwarded-Host':'evil.example'})).status,403);
});
test('same-origin checks normalize default ports and public-origin configuration rejects wildcards',async t=>{
 const {base}=await fixture(t);const status=await new Promise((resolve,reject)=>{const req=http.request(base+'/api/create',{method:'POST',headers:{Host:'localhost:80',Origin:'http://localhost','Content-Type':'application/json'}},res=>{res.resume();resolve(res.statusCode);});req.on('error',reject);req.end(JSON.stringify({name:'DefaultPort'}));});assert.equal(status,200);
 assert.throws(()=>createApp({publicOrigins:'*'}),/PUBLIC_ORIGIN/);assert.throws(()=>createApp({publicOrigins:'https://friends.example/path'}),/PUBLIC_ORIGIN/);
});
test('host can toggle card-only Maneuver in lobby; readiness resets and setting locks during a match',async t=>{
 const {req,rooms}=await fixture(t);const host=(await req('create',{name:'Host'})).data,code=host.state.room.code;assert.equal(host.state.room.maneuver,false);assert.equal(host.state.room.totalCards,108);
 const friend=(await req('join',{name:'Friend',code})).data;await req('ready',{ready:true},friend.token);
 assert.equal((await req('settings',{maneuver:true},friend.token)).status,400);assert.equal((await req('settings',{maneuver:'true'},host.token)).status,400);
 assert.equal((await req('settings',{maneuver:true},host.token)).status,200);let state=(await req('state',undefined,friend.token)).data;assert.equal(state.room.maneuver,true);assert.equal(state.room.totalCards,160);assert.equal(state.room.players.find(p=>p.id===friend.state.room.me).ready,false);assert.equal(state.generals.length,25);assert.ok(state.cardGuide.some(c=>c.name==='Flame Tactic'));
 await req('settings',{maneuver:false},host.token);state=(await req('state',undefined,host.token)).data;assert.equal(state.room.totalCards,108);assert.ok(!state.cardGuide.some(c=>c.kind==='rattan'));
 await req('settings',{maneuver:true},host.token);await req('ready',{ready:true},friend.token);await req('bot',{},host.token);await req('bot',{},host.token);await req('start',{},host.token);const game=rooms.get(code).game;assert.equal(game.totalCards,160);assert.equal(game.maneuver,true);assert.equal((await req('settings',{maneuver:false},host.token)).status,400);
});
test('room creation can enable Maneuver explicitly and the use endpoint rejects stale and unauthorized plays',async t=>{const {req}=await fixture(t);const host=(await req('create',{name:'Host',maneuver:true})).data;assert.equal(host.state.room.totalCards,160);assert.equal((await req('use',{promptId:'fake',optionId:'fake',targetIds:[]},host.token)).status,400);assert.equal((await req('use',{promptId:'fake',optionId:'fake',targetIds:[]})).status,400);});
test('testing mode is explicit, host-only, lobby-locked, and presets reject duplicates',async t=>{
 const {req,rooms}=await fixture(t);const host=(await req('create',{name:'Host'})).data;const friend=(await req('join',{name:'Friend',code:host.state.room.code})).data;
 assert.equal(host.state.room.testing,false);assert.equal((await req('test-general',{playerId:host.state.room.me,generalId:'guanyu'},host.token)).status,400);
 assert.equal((await req('settings',{testing:true},friend.token)).status,400);assert.equal((await req('settings',{testing:true},host.token)).status,200);
 assert.equal((await req('test-general',{playerId:host.state.room.me,generalId:'guanyu'},host.token)).status,200);assert.equal((await req('test-general',{playerId:friend.state.room.me,generalId:'guanyu'},host.token)).status,400);
 assert.equal((await req('test-general',{playerId:friend.state.room.me,generalId:'invalid'},host.token)).status,400);assert.equal((await req('test-general',{playerId:friend.state.room.me,generalId:'zhangfei'},host.token)).status,200);
 const state=(await req('state',undefined,friend.token)).data;assert.equal(state.room.testing,true);assert.equal(state.room.players[0].testGeneral,'guanyu');
 await req('ready',{ready:true},friend.token);await req('bot',{},host.token);await req('bot',{},host.token);await req('start',{},host.token);
 assert.equal(rooms.get(host.state.room.code).game.testing,true);assert.equal((await req('settings',{testing:false},host.token)).status,400);assert.equal((await req('test-draw',{kind:'sha'},friend.token)).status,400);
});
test('exact testing draw pile is available only to the host in testing rooms',async t=>{
 const {req,rooms}=await fixture(t);const host=(await req('create',{name:'Host',testing:true})).data;const friend=(await req('join',{name:'Friend',code:host.state.room.code})).data;const {Game}=await import('../engine.mjs');const {ALL_GENERALS:GENERALS}=await import('../cards.mjs');const room=rooms.get(host.state.room.code);room.status='playing';const g=room.game=new Game(room.players,{testing:true,seconds:0});g.players.forEach(p=>p.general=GENERALS[0]);g.current=g.players[0];g.phase='Play';const waiting=g.ask(g.current,'Play',g.playOptions(g.current),{zone:'turn',timeout:0});
 const own=(await req('state',undefined,host.token)).data,peer=(await req('state',undefined,friend.token)).data;assert.equal(own.testCards.length,108);assert.equal(peer.testCards,undefined);const card=own.testCards[20];assert.equal((await req('test-draw',{cardId:card.id},host.token)).status,200);assert.equal(g.current.hand[0].id,card.id);assert.equal((await req('test-draw',{cardId:card.id},host.token)).status,400);g.stop();await waiting;
});
test('spectators join full or active rooms, keep private data hidden and cannot mutate the match',async t=>{
 const {req,rooms}=await fixture(t);const host=(await req('create',{name:'Host',password:'secret',testing:true})).data,code=host.state.room.code;
 assert.equal((await req('spectate',{name:'Wrong',code,password:'wrong'})).status,400);
 for(let i=0;i<7;i++)assert.equal((await req('bot',{},host.token)).status,200);
 const watcher=(await req('spectate',{name:'Watcher',code,password:'secret'})).data;assert.ok(watcher.token);assert.equal(watcher.state.room.spectator,true);assert.equal(watcher.state.room.players.length,8);assert.equal(watcher.state.room.spectatorCount,1);assert.equal(watcher.state.room.host,host.state.room.host);
 const room=rooms.get(code),{Game}=await import('../engine.mjs'),{GENERALS}=await import('../cards.mjs');room.status='playing';const g=room.game=new Game(room.players,{seconds:0});g.players.forEach((p,i)=>{p.general=GENERALS[i];p.role=i?'rebel':'lord';p.hand=[{id:'private-'+i,kind:'sha',suit:'♠',rank:7}];});g.current=g.players[0];g.phase='Play';
 const pending=g.ask(g.players[0],'Private choice',[{id:'private-choice',label:'Secret option'}],{zone:'cards',context:{kind:'private-deck'}});
 const view=(await req('state',undefined,watcher.token)).data;assert.equal(view.game.prompt,null);assert.equal(view.testCards,undefined);assert.ok(view.game.players.every(p=>p.hand===undefined));assert.equal(view.game.players[0].role,'lord');assert.ok(view.game.players.slice(1).every(p=>p.role===null));assert.ok(!JSON.stringify(view).includes('private-choice'));assert.ok(!JSON.stringify(view).includes('private-0'));
 const late=await req('spectate',{name:'Late viewer',code,password:'secret'});assert.equal(late.status,200);assert.equal(late.data.state.room.spectatorCount,2);
 for(const endpoint of ['answer','use','ready','start','bot','settings','test-draw','test-general','abort','kick','reset'])assert.equal((await req(endpoint,{},watcher.token)).status,400,endpoint);
 assert.equal((await req('leave',{},watcher.token)).status,200);assert.equal(room.players.length,8);assert.equal(room.spectators.length,1);assert.equal((await req('state',undefined,watcher.token)).status,400);g.stop();await pending;
});
test('spectators receive public live updates through their authenticated event stream',async t=>{
 const {req,base,rooms}=await fixture(t),host=(await req('create',{name:'Host'})).data,watcher=(await req('spectate',{name:'Viewer',code:host.state.room.code})).data;
 const controller=new AbortController();t.after(()=>controller.abort());const res=await fetch(base+'/api/events',{headers:{Authorization:'Bearer '+watcher.token},signal:controller.signal});assert.equal(res.status,200);const reader=res.body.getReader(),decoder=new TextDecoder();let text='';while(!text.includes('data: '))text+=decoder.decode((await reader.read()).value);assert.ok(text.includes('"spectator":true'));assert.equal(rooms.get(host.state.room.code).spectators[0].streams.size,1);controller.abort();
});
test('repeated Negation passes across eight players and multiple windows return valid JSON',async t=>{
 const {req,rooms}=await fixture(t),host=(await req('create',{name:'Host'})).data,code=host.state.room.code,tokens=[host.token];
 for(let i=1;i<8;i++)tokens.push((await req('join',{name:'Player '+i,code})).data.token);
 const room=rooms.get(code),{Game}=await import('../engine.mjs'),{GENERALS}=await import('../cards.mjs');room.status='playing';const g=room.game=new Game(room.players,{seconds:0,responseWindowMs:500});g.players.forEach((p,i)=>{p.general=GENERALS[0];p.role=i?'rebel':'lord';p.hand=[{id:'negation-'+i,kind:'negate',suit:'♠',rank:11}];});g.current=g.players[0];g.phase='Play';
 for(let round=0;round<4;round++){
  const running=g.negate(g.players[1],'Duel');
  for(let i=0;i<8;i++){
   const q=g.prompts.get(g.players[i].id);assert.ok(q,'each player receives a Negation choice');
   const answer=await req('answer',{promptId:q.id,ids:['pass']},tokens[i]);assert.equal(answer.status,200);assert.equal(answer.data.ok,true);
  }
  assert.equal(await running,false);assert.equal(g.prompts.size,0);
 }
 assert.ok(g.players.every(p=>p.hand.length===1));
});
test('authenticated room chat is shared between players and spectators',async t=>{
 const {req,rooms,base}=await fixture(t),host=(await req('create',{name:'Host'})).data,code=host.state.room.code;
 const watch=(await req('spectate',{name:'Observer',code})).data;
 assert.equal((await req('chat',{text:'unauthenticated'})).status,400);
 assert.equal((await req('chat',{text:'hello'},host.token)).status,200);
 assert.equal((await req('state',undefined,watch.token)).data.chat.messages[0].text,'hello');
 assert.equal((await req('chat',{text:'too soon'},host.token)).status,400);
 const room=rooms.get(code);room.status='playing';room.game={players:[{id:host.state.room.me,alive:true}],view:()=>({}),stop:()=>{}};
 assert.equal((await req('chat',{text:'gallery secret'},watch.token)).status,200);
 assert.equal((await req('state',undefined,host.token)).data.chat.messages.some(m=>m.text==='gallery secret'),true);
 assert.equal((await req('state',undefined,watch.token)).data.chat.messages.at(-1).text,'gallery secret');
 assert.equal((await fetch(base+'/chat.mjs')).status,200);
});
test('profile joining authenticates PIN and public profile/leaderboard endpoints never expose credentials',async t=>{
 const {req}=await fixture(t);const first=(await req('create',{name:'Regular',createProfile:true,profilePin:'2468'})).data;assert.ok(first.token);const profile=first.state.room.players[0].profileId;assert.ok(profile);
 const list=(await req('profiles')).data;assert.deepEqual(list.profiles,[{id:profile,name:'Regular'}]);assert.equal(JSON.stringify(list).includes('2468'),false);
 assert.equal((await req('create',{name:'Regular',profileId:profile,profilePin:'1111'})).status,400);const again=await req('create',{name:'Regular',profileId:profile,profilePin:'2468'});assert.equal(again.status,200);assert.equal(again.data.state.room.players[0].profileId,profile);
 const board=(await req('leaderboard')).data;assert.equal(board.players[0].matches,0);assert.ok(!JSON.stringify(board).includes('pinHash'));
});
test('finished state exposes review stats and revealed roles; failed profile signup leaves no empty room',async t=>{
 const {req,rooms}=await fixture(t);assert.equal((await req('create',{name:'Bad',createProfile:true,profilePin:'12'})).status,400);assert.equal(rooms.size,0);
 const host=(await req('create',{name:'Host'})).data,room=rooms.get(host.state.room.code);room.status='finished';room.game={matchId:'review-match',winner:'lord',turn:10,players:[{id:host.state.room.me,name:'Host',role:'lord',alive:true,general:{name:'Liu Bei'}}],stats:{[host.state.room.me]:{kills:2,damage:4,damageTaken:1}},eliminations:[],view:()=>({winner:'lord'}),stop:()=>{}};
 const state=(await req('state',undefined,host.token)).data;assert.equal(state.review.players[0].kills,2);assert.equal(state.review.players[0].role,'lord');assert.equal(state.review.players[0].won,true);
 assert.equal((await req('save-results',{},host.token)).status,200);assert.equal((await req('state',undefined,host.token)).data.review.ranked,false);
});
test('source manifests and private runtime files stay inaccessible',async t=>{const {base}=await fixture(t);for(const path of ['/CARD-IMAGE-SOURCES.json','/PORTRAIT-SOURCES.json','/archive-access.key','/data/archive-access.key'])assert.equal((await fetch(base+path)).status,404,path);});

test('selected-general switch is independent, host-controlled and removes disabled expansion presets',async t=>{
 const {req,base}=await fixture(t);const h=(await req('create',{name:'Host',testing:true})).data,host=h.token;
 assert.equal(h.state.generals.length,25);assert.equal(h.state.room.expandedGenerals,false);
 const guest=(await req('join',{name:'Friend',code:h.state.room.code})).data;
 assert.equal((await req('settings',{expandedGenerals:true},guest.token)).status,400);
 assert.equal((await req('test-general',{playerId:h.state.room.me,generalId:'zhangjiao'},host)).status,400);
 assert.equal((await req('settings',{expandedGenerals:true},host)).status,200);
 let state=(await req('state',undefined,host)).data;assert.equal(state.generals.length,44);assert.equal(state.room.maneuver,false);assert.ok(state.cardGuide.some(c=>c.kind==='chain'));
 assert.equal((await req('test-general',{playerId:h.state.room.me,generalId:'zhangjiao'},host)).status,200);
 assert.equal((await req('settings',{expandedGenerals:false},host)).status,200);state=(await req('state',undefined,host)).data;assert.equal(state.generals.length,25);assert.equal(state.room.players[0].testGeneral,null);
 assert.equal((await req('settings',{expandedGenerals:'true'},host)).status,400);
 const picture=await fetch(base+'/portraits/zhangjiao.jpg');assert.equal(picture.status,200);assert.equal(picture.headers.get('content-type'),'image/jpeg');
});

test('all human players can ban; the union is enforced and one player cannot undo another ban',async t=>{
 const {req}=await fixture(t);const h=(await req('create',{name:'Host',expandedGenerals:true,testing:true})).data,guest=(await req('join',{name:'Friend',code:h.state.room.code})).data;
 assert.equal((await req('bans',{generalIds:['yuji','dongzhuo']},guest.token)).status,200);
 assert.equal((await req('bans',{generalIds:['dongzhuo','guanyu']},h.token)).status,200);
 let state=(await req('state',undefined,h.token)).data;assert.deepEqual(new Set(state.room.bannedGenerals),new Set(['yuji','dongzhuo','guanyu']));assert.equal(state.room.banVotes.length,2);
 assert.equal((await req('test-general',{playerId:h.state.room.me,generalId:'yuji'},h.token)).status,400);
 await req('bans',{generalIds:[]},h.token);state=(await req('state',undefined,h.token)).data;assert.deepEqual(new Set(state.room.bannedGenerals),new Set(['yuji','dongzhuo']));
 assert.equal((await req('bans',{generalIds:['caopi']},h.token)).status,400);assert.equal((await req('bans',{generalIds:['yuji','yuji']},h.token)).status,400);
});
test('ban changes clear conflicting presets, reset readiness and block a depleted selection pool',async t=>{
 const {req}=await fixture(t);const h=(await req('create',{name:'Host',testing:true})).data,guest=(await req('join',{name:'Friend',code:h.state.room.code})).data;
 await req('test-general',{playerId:h.state.room.me,generalId:'guanyu'},h.token);await req('ready',{ready:true},h.token);await req('bans',{generalIds:['guanyu']},guest.token);
 let state=(await req('state',undefined,h.token)).data;assert.equal(state.room.players[0].testGeneral,null);assert.equal(state.room.players[0].ready,false);
 await req('bot',{},h.token);await req('bot',{},h.token);await req('ready',{ready:true},guest.token);
 const bans=state.generals.slice(0,16).map(g=>g.id);await req('bans',{generalIds:bans},guest.token);const result=await req('start',{},h.token);assert.equal(result.status,400);assert.match(result.data.error,/Too many banned/);
 assert.equal((await req('state',undefined,h.token)).data.room.status,'lobby');
});
test('disabled expansion bans do not prevent editing the enabled roster',async t=>{
 const {req}=await fixture(t),h=(await req('create',{name:'Host',expandedGenerals:true})).data;
 await req('bans',{generalIds:['yuji']},h.token);await req('settings',{expandedGenerals:false},h.token);
 const state=(await req('state',undefined,h.token)).data;assert.deepEqual(state.room.myBans,[]);assert.deepEqual(state.room.bannedGenerals,[]);assert.equal((await req('bans',{generalIds:['guanyu']},h.token)).status,200);
});

test('LLM seats are opt-in, host-controlled and never expose endpoint keys or private memory',async t=>{
 const {req,rooms}=await fixture(t,{llm:{enabled:true,model:'test-model',base:'http://127.0.0.1:1/v1',key:'secret-provider-key',timeoutMs:50,maxTokens:200}});const created=(await req('create',{name:'Host'})).data,{token,state}=created;const friend=(await req('join',{name:'Friend',code:state.room.code})).data;
 assert.equal((await req('bot',{mode:'llm'},friend.token)).status,400);assert.equal((await req('bot',{mode:'llm'},token)).status,200);const room=rooms.get(state.room.code),seat=room.players.find(p=>p.bot);assert.equal(seat.botMode,'llm');const publicState=(await req('state',undefined,token)).data;assert.ok(JSON.stringify(publicState).includes('test-model'));assert.ok(!JSON.stringify(publicState).includes('secret-provider-key'));assert.ok(!JSON.stringify(publicState).includes('127.0.0.1:1'));
 assert.equal((await req('bot-mode',{id:seat.id,mode:'classic'},friend.token)).status,400);assert.equal((await req('bot-mode',{id:seat.id,mode:'classic'},token)).status,200);assert.equal(seat.botMode,'classic');assert.equal((await req('llm-status',{},friend.token)).status,400);assert.equal((await req('llm-status',{},token)).status,200);
});
test('unconfigured servers reject LLM seats while regular bots remain usable',async t=>{const {req}=await fixture(t,{llm:{enabled:false,model:''}});const {token}=(await req('create',{name:'Host'})).data;assert.equal((await req('bot',{mode:'llm'},token)).status,400);assert.equal((await req('bot',{},token)).status,200);});

test('health version matches package metadata and model selectors are host-only',async t=>{
 const {readFile}=await import('node:fs/promises');const version=JSON.parse(await readFile(new URL('../package.json',import.meta.url))).version;const config={enabled:true,model:'kimi-id',base:'http://localhost/v1',key:'never-expose',timeoutMs:10,debug:true,profiles:[{id:'kimi',label:'Kimi',enabled:true,model:'kimi-id',base:'http://localhost/v1',key:'never-expose'},{id:'claude',label:'Claude',enabled:true,model:'claude-id',base:'http://localhost',transport:'bedrock-converse',key:'never-expose'},{id:'deepseek',label:'DeepSeek',enabled:true,model:'deepseek-id',base:'http://localhost/v1',key:'never-expose'}]};const {req,rooms}=await fixture(t,{llm:config});assert.equal((await req('health')).data.version,version);const {token,state}=(await req('create',{name:'Host'})).data;const friend=(await req('join',{name:'Friend',code:state.room.code})).data;await req('bot',{},token);const bot=rooms.get(state.room.code).players.find(p=>p.bot);assert.equal(bot.botMode,'classic');for(const model of ['kimi','claude','deepseek','classic']){assert.equal((await req('bot-mode',{id:bot.id,model},token)).status,200);assert.equal(bot.botModel,model);}assert.equal((await req('bot-mode',{id:bot.id,model:'evil'},token)).status,400);assert.equal((await req('bot-mode',{id:bot.id,model:'claude'},friend.token)).status,400);const status=await req('llm-status',{},token);assert.deepEqual(status.data.traces,[]);assert.ok(!JSON.stringify(status.data).includes('never-expose'));assert.equal((await req('llm-status',{},friend.token)).status,400);
});

test('addressed AI chat uses configured model asynchronously and posts exactly one public reply',async t=>{
 let requests=0,payload;const model=http.createServer(async(req,res)=>{let raw='';for await(const chunk of req)raw+=chunk;requests++;payload=JSON.parse(raw);res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{message:{content:'{"reply":"That Attack was personal. Your move!"}'}}]}));});await new Promise(r=>model.listen(0,'127.0.0.1',r));t.after(()=>{model.closeAllConnections();model.close();});
 const {req,rooms}=await fixture(t,{llm:{enabled:true,model:'test-chat',base:'http://127.0.0.1:'+model.address().port+'/v1',timeoutMs:1000,maxTokens:200}});const {token,state}=(await req('create',{name:'Host'})).data;await req('bot',{mode:'llm'},token);const bot=rooms.get(state.room.code).players.find(p=>p.bot);assert.equal((await req('chat',{text:'Why attack me?',targetId:bot.id},token)).status,200);let chat;for(let i=0;i<20;i++){chat=(await req('state',undefined,token)).data.chat;if(chat.messages.some(m=>m.ai))break;}assert.equal(requests,1);assert.equal(chat.messages.length,2);assert.equal(chat.messages[1].text,'That Attack was personal. Your move!');assert.equal(chat.messages[1].senderId,bot.id);assert.ok(payload.messages[0].content.includes('PUBLIC information only'));assert.equal(JSON.parse(payload.messages[1].content).message,'Why attack me?');assert.ok(!JSON.stringify(chat).includes('Authorization'));
});

test('host can download complete match archives after abort/reset, others cannot',async t=>{
 const {req,rooms,base}=await fixture(t),host=(await req('create',{name:'Host'})).data,code=host.state.room.code;
 const guest=(await req('join',{name:'Guest',code})).data;await req('ready',{ready:true},guest.token);await req('bot',{},host.token);await req('bot',{},host.token);
 await req('start',{},host.token);const room=rooms.get(code),id=room.game.matchId;room.game.log('Saved before returning to lobby');
 assert.equal((await req('match-logs',{},guest.token)).status,400);
 await req('abort',{},host.token);const listed=await req('match-logs',{},host.token);assert.equal(listed.data.logs[0].id,id);
 const res=await fetch(base+'/api/match-log',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+host.token},body:JSON.stringify({matchId:id})});assert.equal(res.status,200);assert.match(res.headers.get('content-type'),/ndjson/);const text=await res.text();assert.ok(text.includes('Saved before returning to lobby'));assert.ok(text.includes('aborted'));
 assert.equal((await req('match-log',{matchId:id},guest.token)).status,400);
});

test('analysis endpoints are host/room scoped and return historical bot data without hindsight',async t=>{
 const {req,rooms,matchLogs}=await fixture(t),host=(await req('create',{name:'Host'})).data,room=rooms.get(host.state.room.code),guest=(await req('join',{name:'Guest',code:room.code})).data,other=(await req('create',{name:'Other host'})).data;
 const game={matchId:'review-test',players:[],turn:1,phase:'Play'};matchLogs.begin(game,room,'test');
 const input={you:'bot',turn:1,players:[{id:'bot',name:'Liu Bei',role:'lord',hand:[]},{id:'human',role:null}],prompt:{zone:'turn',options:[{id:'end',label:'End'}]},agentState:{knowledge:{roleBeliefs:[]}}};
 matchLogs.append(game.matchId,'ai-trace',{trace:{decisionType:'turn',playerId:'bot',promptId:'q',status:'model',acceptedAction:{ids:['end'],targets:[]},request:JSON.stringify({messages:[{role:'user',content:JSON.stringify(input)}]})}});
 const review=await req('match-analysis',{matchId:game.matchId},host.token);assert.equal(review.status,200);const id=review.data.analysis.decisions[0].id;
 const detail=await req('match-decision',{matchId:game.matchId,decisionId:id},host.token);assert.equal(detail.status,200);assert.equal(detail.data.input.players[1].role,null);
 for(const token of [guest.token,other.token])for(const path of ['match-analysis','match-decision','analyze-decision'])assert.equal((await req(path,{matchId:game.matchId,decisionId:id},token)).status,400);
 assert.equal((await req('match-decision',{matchId:game.matchId,decisionId:'../'},host.token)).status,400);
 assert.equal((await req('analyze-decision',{matchId:game.matchId,decisionId:id},host.token)).status,400,'no provider is configured');
});

test('match review browser module is served without exposing server-side analysis files',async t=>{
 const {base}=await fixture(t);const module=await fetch(base+'/match-review.mjs');assert.equal(module.status,200);assert.match(module.headers.get('content-type'),/javascript/);assert.equal((await fetch(base+'/match-analysis.mjs')).status,404);
});

test('footer version module matches health and has no hardcoded release',async t=>{
 const {base,req}=await fixture(t);const health=await req('health');
 const res=await fetch(base+'/version.mjs');assert.equal(res.status,200);
 assert.equal(res.headers.get('cache-control'),'no-store');
 const module=await import('data:text/javascript,'+encodeURIComponent(await res.text()));
 assert.equal(module.APP_VERSION,health.data.version);
 const app=await (await fetch(base+'/app.js')).text();
 assert.match(app,/import \{APP_VERSION\} from '\.\/version\.mjs'/);
 assert.match(app,/LOCAL EDITION \/ v\$\{esc\(APP_VERSION\)\}/);
 assert.doesNotMatch(app,/LOCAL EDITION \/ v\d/);
});

test('host AI connection test validates a real response without game data or game stats',async t=>{
 let requests=0,seen;const model=http.createServer(async(req,res)=>{let raw='';for await(const c of req)raw+=c;seen=JSON.parse(raw);requests++;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{message:{content:'{"ids":["ready"],"targets":[]}'},finish_reason:'stop'}],usage:{prompt_tokens:12,completion_tokens:7}}));});await new Promise(r=>model.listen(0,'127.0.0.1',r));t.after(()=>{model.closeAllConnections();model.close();});
 const {req}=await fixture(t,{llm:{enabled:true,model:'test',base:'http://127.0.0.1:'+model.address().port+'/v1',timeoutMs:1000,maxTokens:1500}});
 const host=(await req('create',{name:'Host'})).data,guest=(await req('join',{name:'Guest',code:host.state.room.code})).data;
 assert.equal((await req('llm-check',{model:'custom'},guest.token)).status,400);assert.equal(requests,0);
 const result=await req('llm-check',{model:'custom'},host.token);assert.equal(result.status,200);assert.equal(result.data.ok,true);assert.equal(result.data.inputTokens,12);assert.equal(result.data.outputTokens,7);assert.equal(requests,1);assert.ok(!JSON.stringify(seen).includes('Guest'));assert.ok(!JSON.stringify(seen).includes(host.state.room.code));assert.equal((await req('llm-check',{model:'custom'},host.token)).status,400);assert.deepEqual((await req('llm-status',{},host.token)).data.seats,{});
});


test('only the host controls spontaneous chatter, with validated levels and default Occasional',async t=>{
 const {req}=await fixture(t);const h=(await req('create',{name:'Host'})).data,f=(await req('join',{name:'Friend',code:h.state.room.code})).data;
 assert.equal(h.state.room.botChatter,'occasional');assert.equal((await req('bot-chatter',{mode:'lively'},f.token)).status,400);assert.equal((await req('bot-chatter',{mode:'invalid'},h.token)).status,400);
 for(const mode of ['off','lively','occasional']){assert.equal((await req('bot-chatter',{mode},h.token)).status,200);assert.equal((await req('state',undefined,h.token)).data.room.botChatter,mode);}
});

test('host selects per-bot role-focused strategy, validation and model switches preserve it',async t=>{
 const {req,rooms}=await fixture(t,{llm:{enabled:true,model:'mock',base:'http://127.0.0.1:1/v1',timeoutMs:50,maxTokens:200}});
 const {token,state}=(await req('create',{name:'Host'})).data;
 const friend=(await req('join',{name:'Friend',code:state.room.code})).data;
 assert.equal((await req('bot',{mode:'llm'},token)).status,200);
 const room=rooms.get(state.room.code),bot=room.players.find(p=>p.bot);
 assert.equal(bot.botStrategy,'current');
 assert.equal((await req('bot-mode',{id:bot.id,strategy:'role-focus'},friend.token)).status,400);
 assert.equal((await req('bot-mode',{id:bot.id,strategy:'invented'},token)).status,400);assert.equal(bot.botStrategy,'current');
 assert.equal((await req('bot-mode',{id:bot.id,strategy:'role-focus'},token)).status,200);
 assert.equal(bot.botStrategy,'role-focus');assert.equal(bot.botMode,'llm');
 const {Game}=await import('../engine.mjs');room.game=new Game(room.players);let updated;const setMode=room.game.setBotMode.bind(room.game);room.game.setBotMode=(...args)=>{updated=args;setMode(...args);};
 assert.equal((await req('bot-mode',{id:bot.id,strategy:'current'},token)).status,200);assert.equal(updated[3],'current');
 assert.equal((await req('bot-mode',{id:bot.id,strategy:'role-focus'},token)).status,200);
 assert.equal((await req('bot-mode',{id:bot.id,mode:'classic'},token)).status,200);assert.equal(bot.botStrategy,'role-focus');
 const result=(await req('state',undefined,token)).data.room.players.find(p=>p.id===bot.id);assert.equal(result.botStrategy,'role-focus');
});
test('host role counts are lobby-only and adding a seat restores the standard preset',async t=>{
 const {req,rooms}=await fixture(t),host=(await req('create',{name:'Host'})).data,friend=(await req('join',{name:'Friend',code:host.state.room.code})).data;
 await req('bot',{},host.token);await req('bot',{},host.token);const counts={lord:1,loyal:0,rebel:3,spy:0};
 assert.equal((await req('role-counts',{counts},friend.token)).status,400);assert.equal((await req('role-counts',{counts:{...counts,spy:1}},host.token)).status,400);
 await req('ready',{ready:true},friend.token);assert.equal((await req('role-counts',{counts},host.token)).status,200);
 const view=(await req('state',undefined,friend.token)).data;assert.deepEqual(view.room.roleCounts,counts);assert.equal(view.room.customRoles,true);assert.equal(view.room.players.find(p=>p.id===friend.state.room.me).ready,false);
 await req('bot',{},host.token);const next=(await req('state',undefined,host.token)).data;assert.equal(next.room.customRoles,false);assert.deepEqual(next.room.roleCounts,{lord:1,loyal:1,rebel:2,spy:1});
 const room=rooms.get(host.state.room.code);room.status='playing';assert.equal((await req('role-counts',{counts:null},host.token)).status,400);
});
test('humans reclaim their own AFK seat; only host can change another seat, spectators cannot',async t=>{
 const {req,rooms}=await fixture(t),host=(await req('create',{name:'Host'})).data,friend=(await req('join',{name:'Friend',code:host.state.room.code})).data,watcher=(await req('spectate',{name:'Watch',code:host.state.room.code})).data;
 const room=rooms.get(host.state.room.code),{Game}=await import('../engine.mjs'),{GENERALS}=await import('../cards.mjs');room.status='playing';room.game=new Game(room.players,{seconds:0,botPacing:true});const g=room.game;g.players.forEach((p,i)=>{p.general=GENERALS[i];p.role=i?'rebel':'lord';});g.current=g.players[0];g.phase='Play';
 const pending=g.ask(g.players[1],'Choice',[{id:'yes'},{id:'no'}]);const id=friend.state.room.me;
 assert.equal((await req('takeover',{playerId:host.state.room.me,enabled:true},friend.token)).status,400);
 assert.equal((await req('takeover',{enabled:true},watcher.token)).status,400);
 assert.equal((await req('takeover',{enabled:true,model:'not-configured'},friend.token)).status,400);
 assert.equal((await req('takeover',{playerId:id,enabled:true},host.token)).status,200);const q=g.prompts.get(id);
 assert.equal((await req('answer',{promptId:q.id,ids:['yes']},friend.token)).status,400);
 assert.equal((await req('state',undefined,friend.token)).data.game.prompt,null);
 assert.equal((await req('takeover',{enabled:false},friend.token)).status,200);
 assert.ok((await req('state',undefined,friend.token)).data.game.prompt);
 assert.equal((await req('answer',{promptId:q.id,ids:['yes']},friend.token)).status,200);assert.deepEqual(await pending,['yes']);g.stop();
});
test('brief stream reconnect preserves human control; sustained disconnect enables takeover',async t=>{
 const {req,rooms,base}=await fixture(t,{disconnectGraceMs:100}),host=(await req('create',{name:'Host'})).data,room=rooms.get(host.state.room.code),{Game}=await import('../engine.mjs'),{GENERALS}=await import('../cards.mjs');
 room.status='playing';const g=room.game=new Game(room.players,{seconds:0});g.players[0].general=GENERALS[0];g.players[0].role='lord';g.current=g.players[0];
 const connect=async()=>{const controller=new AbortController(),res=await fetch(base+'/api/events',{headers:{Authorization:'Bearer '+host.token},signal:controller.signal});const reader=res.body.getReader();await reader.read();return {controller,reader};};
 const a=await connect();a.controller.abort();await a.reader.cancel().catch(()=>{});for(let i=0;i<20&&room.players[0].streams.size;i++)await new Promise(r=>setTimeout(r,2));
 const b=await connect();await new Promise(r=>setTimeout(r,130));assert.equal(!!g.players[0].takeover,false);
 b.controller.abort();await b.reader.cancel().catch(()=>{});for(let i=0;i<60&&!g.players[0].takeover;i++)await new Promise(r=>setTimeout(r,5));assert.equal(g.players[0].takeover,true);assert.equal((await req('state',undefined,host.token)).data.game.control.takeover,true);
 assert.equal((await req('takeover',{enabled:false},host.token)).status,200);g.stop();
});
