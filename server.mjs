import {createArchiveAccess} from './archive-access.mjs';
import {inspectMatch,decisionDetail,decisionAnalysisContext} from './match-analysis.mjs';
import {createMatchLogs} from './match-logs.mjs';
import {addressedBot,chatBots,createAIChat,cancelAIChat} from './ai-chat.mjs';
import {createModelRouter,llmConfig} from './llm-provider.mjs';
import http from 'node:http';
import {createResults,matchReview} from './results.mjs';
import {chatView,postChat} from './chat.mjs';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';
import {networkInterfaces} from 'node:os';
import {Game} from './engine.mjs';
import {GENERALS,ALL_GENERALS,META,info} from './cards.mjs';
const {version:APP_VERSION}=JSON.parse(await readFile(new URL('./package.json',import.meta.url),'utf8'));
const root=fileURLToPath(new URL('./public/',import.meta.url));
function parsePublicOrigins(value){
 const values=Array.isArray(value)?value:String(value||'').split(',');
 return new Set(values.map(v=>String(v).trim()).filter(Boolean).map(v=>{
  let u;try{u=new URL(v);}catch{throw new Error('PUBLIC_ORIGIN must contain full http(s) URLs, separated by commas.');}
  if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.pathname!=='/'||u.search||u.hash)throw new Error('PUBLIC_ORIGIN must be an exact http(s) origin without a path, credentials, query, or wildcard.');
  return u.origin;
 }));
}
function acceptsOrigin(origin,host,publicOrigins){
 if(!origin)return true;
 try{
  const u=new URL(origin);
  if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.pathname!=='/'||u.search||u.hash)return false;
  if(publicOrigins.has(u.origin))return true;
  // Normalize explicit default ports; do not trust client-supplied forwarded headers.
  const direct=new URL(`${u.protocol}//${host}`);
  return u.host===direct.host;
 }catch{return false;}
}
export function createApp({dataDirectory=process.env.SGS_DATA_DIR||fileURLToPath(new URL('./data/',import.meta.url)),publicOrigins=process.env.PUBLIC_ORIGIN||process.env.ALLOWED_ORIGINS||'',llm=llmConfig()}={}){
 const archiveAccess=createArchiveAccess(dataDirectory);
 const matchLogs=createMatchLogs(dataDirectory,{secrets:[llm.key,...(llm.profiles||[]).map(p=>p.key)]});
 const llmProvider=createModelRouter({...llm,debug:true},{onTrace:t=>matchLogs.append(t.matchId,'ai-trace',{trace:t}),onPlan:(matchId,playerId,promptId,plan)=>matchLogs.append(matchId,'ai-plan',{playerId,promptId,plan}),onDiagnostic:d=>{const matchId=d.seat?.split(':')[0];matchLogs.append(matchId,'ai-diagnostic',{diagnostic:d});}});
 const allowedOrigins=parsePublicOrigins(publicOrigins),results=createResults(dataDirectory);
 const rooms=new Map(),sessions=new Map(),rates=new Map();
 function broadcast(room){matchLogs.snapshot(room.game);room.updated=Date.now();for(const p of [...room.players,...(room.spectators||[])]){const data=JSON.stringify(state(room,p));for(const res of p.streams)res.write(`data: ${data}\n\n`);}}
 const rememberTableTalk=(room,p,message)=>{if(room.game)matchLogs.append(room.game.matchId,'chat',{message});room.game?.rememberChat?.(message,chatBots(room,p).map(b=>b.id));};
 const scheduleAIChat=createAIChat({provider:llmProvider,broadcast,onMessage:rememberTableTalk});
 function eligibleGenerals(room){return room.expandedGenerals?ALL_GENERALS:GENERALS;}
 function combinedBans(room){const enabled=new Set(eligibleGenerals(room).map(g=>g.id));return [...new Set(room.players.flatMap(p=>p.bans||[]))].filter(id=>enabled.has(id));}
 function state(room,p){return {review:room.review||(room.game?.winner?{...matchReview(room.game),reason:'Results not saved yet'}:null),chat:{...chatView(room,p),bots:chatBots(room,p)},room:{llm:{enabled:llmProvider.enabled,model:llmProvider.model,models:llmProvider.models,debug:!!llm.debug},code:room.code,host:room.host,me:p.id,spectator:!!p.spectator,spectatorCount:room.spectators?.length||0,status:room.status,seconds:room.seconds,bannedGenerals:combinedBans(room),myBans:(p.bans||[]).filter(id=>eligibleGenerals(room).some(g=>g.id===id)),banVotes:room.players.filter(p=>!p.bot).map(p=>({playerId:p.id,name:p.name,generalIds:p.bans||[]})),testing:!!room.testing,expandedGenerals:!!room.expandedGenerals,maneuver:!!room.maneuver,totalCards:room.maneuver?160:108,error:room.error||null,players:room.players.map(x=>({id:x.id,name:x.name,profileId:x.profileId||null,ready:x.ready,online:x.streams.size>0,bot:!!x.bot,botMode:x.botMode||'classic',botModel:x.botMode==='llm'?(x.botModel||llmProvider.defaultProfile):'classic',testGeneral:room.testing&&!p.spectator?x.testGeneral||null:undefined})),protected:!!room.passwordHash},testCards:room.testing&&room.host===p.id&&room.game?room.game.deck.map(info).sort((a,b)=>a.name.localeCompare(b.name)||a.suit.localeCompare(b.suit)||a.rank-b.rank):undefined,game:room.game?.view(p.id)||null,generals:room.expandedGenerals?ALL_GENERALS:GENERALS,cardGuide:Object.entries(META).filter(([kind])=>room.expandedGenerals&&['fireAttack','chain','supply','wine','fireSha','thunderSha'].includes(kind)||room.maneuver||!['fireSha','thunderSha','wine','fireAttack','chain','supply','rattan','silverLion','fan','guding'].includes(kind)).map(([kind,m])=>({kind,name:m[0],type:m[1],text:m[2]}))};}
 function auth(req){const token=req.headers.authorization?.replace(/^Bearer /,'');const s=sessions.get(token);if(!s)throw new Error('Please create or join a room first.');const room=rooms.get(s.code),p=[...(room?.players||[]),...(room?.spectators||[])].find(p=>p.id===s.id);if(!room||!p)throw new Error('This room has closed.');return {room,p,token};}
 function host(room,p){if(room.host!==p.id)throw new Error('Only the host can do that.');}
 function lobby(room){if(room.status!=='lobby')throw new Error('A match has already started. Please wait until it ends.');}
 const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'");
  const url=new URL(req.url,'http://localhost');
  function json(status,body){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(body));}
  try{
   if(req.method==='GET'&&url.pathname==='/api/profiles'){json(200,{profiles:results.profiles()});return;}
   if(req.method==='GET'&&url.pathname==='/api/leaderboard'){json(200,{players:results.leaderboard()});return;}
   if(url.pathname==='/api/health'){json(200,{ok:true,version:APP_VERSION});return;}
   if(url.pathname.startsWith('/api/')){
    if(!acceptsOrigin(req.headers.origin,req.headers.host,allowedOrigins)){json(403,{error:'Only same-origin requests are allowed. For a tunnel or reverse proxy, set PUBLIC_ORIGIN to the exact browser URL (scheme, host and port).'});return;}
    if(req.method==='GET'&&url.pathname==='/api/events'){
     const {room,p}=auth(req);res.writeHead(200,{'Content-Type':'text/event-stream','Connection':'keep-alive','X-Accel-Buffering':'no'});res.write(': connected\n\n');p.streams.add(res);broadcast(room);
     const timer=setInterval(()=>res.write(': heartbeat\n\n'),15000);req.on('close',()=>{clearInterval(timer);p.streams.delete(res);broadcast(room);});return;
    }
    if(req.method==='GET'&&url.pathname==='/api/state'){const {room,p}=auth(req);json(200,state(room,p));return;}
    if(req.method!=='POST'){json(405,{error:'Method not allowed'});return;}
    const ip=req.socket.remoteAddress;const now=Date.now();let rate=rates.get(ip);if(!rate||now-rate.time>60000){rate={time:now,n:0};rates.set(ip,rate);}if(++rate.n>240){json(429,{error:'Too many requests. Please try again shortly.'});return;}
    let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>16384){json(413,{error:'Request too large.'});return;}}
    let body;try{body=JSON.parse(raw||'{}');}catch{json(400,{error:'Invalid request.'});return;}
    const text=(v,max=24)=>String(v??'').trim().slice(0,max);
    if(url.pathname==='/api/create'||url.pathname==='/api/join'||url.pathname==='/api/spectate'){
     let name=text(body.name);if(!name)throw new Error('Please enter a nickname.');let room;const watching=url.pathname==='/api/spectate';
     if(url.pathname==='/api/create'){
      if(rooms.size>=30)throw new Error('The server has reached its room limit. Close an unused room first.');let code;do{code=randomBytes(3).toString('hex').toUpperCase();}while(rooms.has(code));
      const password=text(body.password,80),salt=randomBytes(16).toString('hex');
      room={archiveOwner:archiveAccess(req.headers['x-sgs-archive-key']).archiveOwner,code,players:[],spectators:[],status:'lobby',host:null,testing:body.testing===true,expandedGenerals:body.expandedGenerals===true,maneuver:body.maneuver===true,seconds:[15,30,60,120,300].includes(body.seconds)?body.seconds:60,updated:now,salt,passwordHash:password?scryptSync(password,salt,32):null};
     }else{
      room=rooms.get(text(body.code,6).toUpperCase());if(!room)throw new Error('Room not found. Check the room code.');if(!watching)lobby(room);
      if(room.passwordHash&&!timingSafeEqual(scryptSync(text(body.password,80),room.salt,32),room.passwordHash))throw new Error('Incorrect room password.');
     }
     if(!watching&&room.players.length>=8)throw new Error('This room is full (8 players maximum).');if(watching&&(room.spectators?.length||0)>=32)throw new Error('This room has reached its spectator limit.');if([...room.players,...(room.spectators||[])].some(p=>p.name===name))throw new Error('That nickname is already taken.');
     const profile=watching?null:results.claim({profileId:body.profileId,pin:body.profilePin,newProfileName:body.createProfile?name:null});if(profile){name=profile.name;if(room.players.some(p=>p.profileId===profile.id||p.name===name))throw new Error('That profile is already seated in this room.');}
     const token=randomBytes(32).toString('hex');const p={id:randomBytes(8).toString('hex'),name,profileId:profile?.id||null,ready:false,spectator:watching,streams:new Set()};if(watching)(room.spectators??=[]).push(p);else{room.players.push(p);room.host||=p.id;}rooms.set(room.code,room);sessions.set(token,{code:room.code,id:p.id});broadcast(room);json(200,{token,state:state(room,p)});return;
    }
    const {room,p,token}=auth(req);
    const archiveContext={...room,...archiveAccess(req.headers['x-sgs-archive-key'])};
    if(url.pathname==='/api/chat'){const bot=addressedBot(room,p,body.text,body.targetId),message=postChat(room,p,body.text);if(bot){message.targetId=bot.id;message.targetName=chatBots(room,p).find(b=>b.id===bot.id)?.name;}rememberTableTalk(room,p,message);const notice=scheduleAIChat(room,p,message,bot);broadcast(room);json(200,{ok:true,...(notice?{notice}:{})});return;}
    if(p.spectator&&url.pathname!=='/api/leave')throw new Error('Spectators can watch but cannot perform game actions.');
    switch(url.pathname){
     case '/api/settings':{
      host(room,p);lobby(room);
      if(body.maneuver!==undefined&&typeof body.maneuver!=='boolean')throw new Error('Expansion setting must be true or false.');
      if(body.testing!==undefined&&typeof body.testing!=='boolean')throw new Error('Testing setting must be true or false.');
      if(body.expandedGenerals!==undefined&&typeof body.expandedGenerals!=='boolean')throw new Error('General expansion setting must be true or false.');
      if(body.testing===undefined&&body.maneuver===undefined&&body.expandedGenerals===undefined)throw new Error('Choose a setting to change.');
      let changed=false;for(const key of ['maneuver','testing','expandedGenerals'])if(body[key]!==undefined&&room[key]!==body[key]){room[key]=body[key];changed=true;}
      if(body.expandedGenerals===false)for(const player of room.players)if(!GENERALS.some(g=>g.id===player.testGeneral))player.testGeneral=null;
      if(changed)for(const player of room.players)if(!player.bot&&player!==p)player.ready=false;break;
     }
     case '/api/bans':{
      lobby(room);if(!Array.isArray(body.generalIds)||body.generalIds.length>ALL_GENERALS.length||new Set(body.generalIds).size!==body.generalIds.length||body.generalIds.some(id=>!eligibleGenerals(room).some(g=>g.id===id)))throw new Error('Choose valid generals from the enabled roster.');
      p.bans=[...body.generalIds];const banned=new Set(combinedBans(room));for(const player of room.players){if(banned.has(player.testGeneral))player.testGeneral=null;if(!player.bot&&player!==p)player.ready=false;}break;
     }
     case '/api/test-general':{
      host(room,p);lobby(room);if(!room.testing)throw new Error('Testing mode is disabled.');
      const target=room.players.find(x=>x.id===body.playerId);if(!target)throw new Error('Unknown player.');
      if(body.generalId!==null&&!(room.expandedGenerals?ALL_GENERALS:GENERALS).some(g=>g.id===body.generalId))throw new Error('Unknown general.');
      if(body.generalId&&combinedBans(room).includes(body.generalId))throw new Error('That general is banned by the table.');
      if(body.generalId&&room.players.some(x=>x!==target&&x.testGeneral===body.generalId))throw new Error('That general is already assigned.');
      target.testGeneral=body.generalId;for(const player of room.players)if(!player.bot&&player!==p)player.ready=false;break;
     }
     case '/api/test-draw':{
      host(room,p);if(room.status!=='playing'||!room.game)throw new Error('There is no active match.');room.game.testDraw(body.kind,body.cardId);break;
     }
     case '/api/ready':lobby(room);p.ready=!!body.ready;break;
     case '/api/bot':{
      host(room,p);lobby(room);if(room.players.length>=8)throw new Error('This room is full.');const model=body.model||(body.mode==='llm'?llmProvider.defaultProfile:'classic');if(model!=='classic'&&!llmProvider.supports(model))throw new Error('That model is not configured on the server.');const n=room.players.filter(p=>p.bot).length+1;room.players.push({id:randomBytes(8).toString('hex'),name:`Bot ${n}`,bot:true,botMode:model==='classic'?'classic':'llm',botModel:model,ready:true,streams:new Set()});break;
     }
     case '/api/bot-mode':{host(room,p);const t=room.players.find(x=>x.id===body.id&&x.bot);if(!t)throw new Error('Choose a bot seat.');const model=body.model||(body.mode==='llm'?llmProvider.defaultProfile:body.mode==='classic'?'classic':null);if(!model||model!=='classic'&&!llmProvider.supports(model))throw new Error('That model is not configured on the server.');room.chatJobs?.get(t.id)?.controller.abort();t.botMode=model==='classic'?'classic':'llm';t.botModel=model;room.game?.setBotMode(t.id,t.botMode,model);break;}
     case '/api/match-analysis':{host(room,p);json(200,{analysis:inspectMatch(await matchLogs.records(body.matchId,archiveContext)),models:llmProvider.models});return;}
     case '/api/match-decision':{host(room,p);json(200,decisionDetail(await matchLogs.records(body.matchId,archiveContext),body.decisionId));return;}
     case '/api/analyze-decision':{
      host(room,p);if(room.analysisJob)throw Error('An analysis is already running for this room.');
      const controller=new AbortController();room.analysisJob=controller;res.on('close',()=>{if(!res.writableEnded)controller.abort(new Error('cancelled'));});
      try{const detail=decisionDetail(await matchLogs.records(body.matchId,archiveContext),body.decisionId),context=decisionAnalysisContext(detail),answer=await llmProvider.analyze({context,playerId:detail.trace.playerId,matchId:body.matchId,modelProfile:body.model,signal:controller.signal});
       if(!answer)throw Error('Analysis could not finish. Check the model connection, output budget or timeout.');
       const evaluation={decisionId:body.decisionId,model:llmProvider.models.find(m=>m.id===(body.model||llmProvider.defaultProfile))?.label||'AI',result:answer.result,usage:answer.usage};matchLogs.append(body.matchId,'decision-analysis',evaluation);json(200,evaluation);
      }finally{if(room.analysisJob===controller)room.analysisJob=null;}return;
     }
     case '/api/match-logs':{host(room,p);json(200,{logs:matchLogs.list(archiveContext),recovery:archiveContext.archiveRecovery});return;}
     case '/api/match-log':{host(room,p);matchLogs.download(body.matchId,archiveContext,res);return;}
     case '/api/llm-status':{host(room,p);const status=llmProvider.status(),prefix=room.game?.matchId+':';json(200,{enabled:status.enabled,model:status.model,models:llmProvider.models,debug:!!llm.debug,traces:llm.debug?llmProvider.traces(room.game?.matchId):[],seats:Object.fromEntries(Object.entries(status.seats).filter(([id])=>id.startsWith(prefix)))});return;}
     case '/api/kick':{
      host(room,p);lobby(room);const t=room.players.find(x=>x.id===body.id);if(!t||t===p)throw new Error('That player cannot be removed.');room.chatJobs?.get(t.id)?.controller.abort();for(const res of t.streams)res.end();room.players=room.players.filter(x=>x!==t);for(const [k,v]of sessions)if(v.id===t.id)sessions.delete(k);break;
     }
     case '/api/start':{
      host(room,p);lobby(room);if(room.players.length<4)throw new Error('At least 4 players are needed. You can add practice bots.');if(room.players.some(x=>x!==p&&!x.ready))throw new Error('Wait for all players to get ready.');
      if(eligibleGenerals(room).length-combinedBans(room).length<3*room.players.length-2)throw new Error('Too many banned generals: keep at least '+(3*room.players.length-2)+' available for three choices per player.');
      cancelAIChat(room);room.status='playing';room.error=null;room.review=null;room.game=new Game(room.players.map(({id,name,bot,botMode,botModel,testGeneral,profileId})=>({id,name,bot,botMode,botModel,testGeneral,profileId})),{publicChatFor:bot=>chatView(room,bot).messages.slice(-20),llmProvider,seconds:room.seconds,maneuver:room.maneuver,expandedGenerals:room.expandedGenerals,bannedGenerals:combinedBans(room),testing:room.testing,onEvent:e=>{if(room.game)matchLogs.append(room.game.matchId,'game-event',{event:e});},onChange:()=>broadcast(room)});
      matchLogs.begin(room.game,room,APP_VERSION);matchLogs.snapshot(room.game);
      for(const bot of room.players.filter(p=>p.bot))for(const message of chatView(room,bot).messages)room.game.rememberChat(message,[bot.id]);
      const running=room.game;running.start().then(()=>{if(room.game!==running)return;if(running.winner){room.status='finished';matchLogs.finish(running,'finished');try{room.review=results.record(running,{testing:room.testing,bots:room.players.some(p=>p.bot)});}catch(e){console.error('Results save failed:',e.message);room.error='Match finished, but results could not be saved. Keep this room open and check server storage.';}}broadcast(room);}).catch(e=>{if(room.game!==running)return;console.error('Game error:',e);room.status='error';room.error='The match encountered an error. The host can return to the lobby.';matchLogs.finish(running,'error');running.stop();broadcast(room);});break;
     }
     case '/api/use':{
      if(room.status!=='playing'||!room.game)throw new Error('There is no active match.');room.game.answerPlay(p.id,body.promptId,body.optionId,body.targetIds,body.costIds||[],body.mode);break;
     }
     case '/api/answer':{
      if(room.status!=='playing'||!room.game)throw new Error('There is no active match.');room.game.answer(p.id,body.promptId,body.ids);break;
     }
     case '/api/save-results':{host(room,p);if(room.status!=='finished'||!room.game?.winner)throw new Error('Finish the match first.');room.review=results.record(room.game,{testing:room.testing,bots:room.players.some(p=>p.bot)});room.error=null;break;}
     case '/api/reset':host(room,p);if(room.status==='playing')throw new Error('A match is in progress. Use End Match first.');cancelAIChat(room);matchLogs.finish(room.game,room.status==='playing'?'aborted':'lobby');room.game?.stop();room.game=null;room.review=null;room.status='lobby';room.error=null;room.players.forEach(x=>x.ready=!!x.bot);break;
     case '/api/abort':host(room,p);cancelAIChat(room);matchLogs.finish(room.game,room.status==='playing'?'aborted':'lobby');room.game?.stop();room.game=null;room.review=null;room.status='lobby';room.error=null;room.players.forEach(x=>x.ready=!!x.bot);break;
     case '/api/leave':{
      if(!p.spectator&&room.status==='playing')throw new Error('During a match, close this page to disconnect. Open it again to reconnect.');for(const res of p.streams)res.end();room.players=room.players.filter(x=>x!==p);room.spectators=(room.spectators||[]).filter(x=>x!==p);sessions.delete(token);if(room.host===p.id)room.host=room.players.find(x=>!x.bot)?.id;if(!room.players.some(x=>!x.bot)){rooms.delete(room.code);for(const [k,v]of sessions)if(v.code===room.code)sessions.delete(k);}broadcast(room);json(200,{ok:true});return;
     }
     default:json(404,{error:'Unknown endpoint'});return;
    }
    broadcast(room);json(200,{ok:true});return;
   }
   if(req.method!=='GET'){res.writeHead(405);res.end();return;}
   if(url.pathname==='/version.mjs'){res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store'});res.end('export const APP_VERSION='+JSON.stringify(APP_VERSION)+';\n');return;}
   const files={'/match-review.mjs':['match-review.mjs','text/javascript; charset=utf-8'],'/event-history.mjs':['event-history.mjs','text/javascript; charset=utf-8'],'/skill-plan.mjs':['skill-plan.mjs','text/javascript; charset=utf-8'],'/damage-1.wav':['damage-1.wav','audio/wav'],'/damage-2.wav':['damage-2.wav','audio/wav'],'/damage-3.wav':['damage-3.wav','audio/wav'],'/usability.mjs':['usability.mjs','text/javascript; charset=utf-8'],'/role-notes.mjs':['role-notes.mjs','text/javascript; charset=utf-8'],'/card-art.mjs':['card-art.mjs','text/javascript; charset=utf-8'],'/chat.mjs':['chat.mjs','text/javascript; charset=utf-8'],'/network.mjs':['network.mjs','text/javascript; charset=utf-8'],'/tabletop.css':['tabletop.css','text/css; charset=utf-8'],'/feedback.mjs':['feedback.mjs','text/javascript; charset=utf-8'],'/fullscreen.css':['fullscreen.css','text/css; charset=utf-8'],'/interaction.mjs':['interaction.mjs','text/javascript; charset=utf-8'],'/interaction.css':['interaction.css','text/css; charset=utf-8'],'/':['index.html','text/html; charset=utf-8'],'/app.js':['app.js','text/javascript; charset=utf-8'],'/style.css':['style.css','text/css; charset=utf-8'],'/table.mjs':['table.mjs','text/javascript; charset=utf-8'],'/seating.css':['seating.css','text/css; charset=utf-8']};if(ALL_GENERALS.some(g=>url.pathname==='/portraits/'+g.id+'.svg')){files[url.pathname]=[url.pathname.slice(1),'image/svg+xml'];res.setHeader('Cache-Control','public, max-age=86400');}const file=files[url.pathname];if(!file){res.writeHead(404);res.end('Not found');return;}
   const data=await readFile(root+file[0]);res.writeHead(200,{'Content-Type':file[1]});res.end(data);
  }catch(e){if(!res.headersSent)json(400,{error:e.message});else res.end();}
 });
 const gc=setInterval(()=>{const now=Date.now();for(const [ip,r]of rates)if(now-r.time>120000)rates.delete(ip);for(const [code,r]of rooms)if(now-r.updated>6*3600000&&!r.players.some(p=>p.streams.size)){matchLogs.finish(r.game,'room-expired');r.game?.stop();rooms.delete(code);for(const [k,s]of sessions)if(s.code===code)sessions.delete(k);}},600000);gc.unref();
 server.on('close',()=>{clearInterval(gc);for(const room of rooms.values()){matchLogs.finish(room.game,'server-closed');room.game?.stop();for(const p of [...room.players,...(room.spectators||[])])for(const stream of p.streams)stream.end();}});
 return {server,rooms,sessions,matchLogs};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const port=Number(process.env.PORT)||3000;const host=process.env.HOST||'127.0.0.1';const {server}=createApp();
 server.listen(port,host,()=>{
  console.log(`\n  Three Kingdoms · Private Table  v${APP_VERSION} EN\n  Local: http://localhost:${port}`);
  if(!['127.0.0.1','localhost','::1'].includes(host))for(const links of Object.values(networkInterfaces()))for(const a of links||[])if(a.family==='IPv4'&&!a.internal)console.log(`  LAN: http://${a.address}:${port}`);
  console.log('  Press Ctrl+C to stop. Stopping the server clears all rooms and matches.\n');
 });
 server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`Port ${port} is in use. Try PORT=3001 npm start.`:e);process.exitCode=1;});
}
