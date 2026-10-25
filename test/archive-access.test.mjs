import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync,statSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createApp} from '../server.mjs';
import {createArchiveAccess,archiveOwner} from '../archive-access.mjs';
import {createMatchLogs} from '../match-logs.mjs';

test('archive owner survives new rooms and restart, without exposing logs to another host',async t=>{
 const dir=mkdtempSync(join(tmpdir(),'sgs-persist-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
 const key='a'.repeat(64),other='b'.repeat(64);let app=createApp({dataDirectory:dir});
 async function listen(){await new Promise(r=>app.server.listen(0,'127.0.0.1',r));return `http://127.0.0.1:${app.server.address().port}`;}
 async function close(){app.server.closeAllConnections();await new Promise(r=>app.server.close(r));}
 let base=await listen();
 const req=async(path,body,token,k=key)=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{'Content-Type':'application/json','X-SGS-Archive-Key':k,...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});return {status:r.status,data:await r.json()};};
 const first=(await req('create',{name:'First'})).data,room=app.rooms.get(first.state.room.code);
 const game={matchId:'persistent-test',players:[],turn:1,phase:'Play'};app.matchLogs.begin(game,room,'test');app.matchLogs.append(game.matchId,'ai-trace',{trace:{request:'PRIVATE-HAND'}});
 await close();app=createApp({dataDirectory:dir});base=await listen();t.after(close);
 const second=(await req('create',{name:'Second'})).data;
 assert.notEqual(second.state.room.host,first.state.room.host);
 assert.equal((await req('match-logs',{},second.token)).data.logs[0].id,game.matchId);
 assert.equal((await req('match-analysis',{matchId:game.matchId},second.token)).status,200);
 const intruder=(await req('create',{name:'Other'},null,other)).data;
 assert.deepEqual((await req('match-logs',{},intruder.token,other)).data.logs,[]);
 assert.equal((await req('match-analysis',{matchId:game.matchId},intruder.token,other)).status,400);
 assert.ok(!JSON.stringify(second.state).includes(archiveOwner(key)));
});
test('server recovery key persists privately and unlocks legacy archives with all access paths checked',async t=>{
 const dir=mkdtempSync(join(tmpdir(),'sgs-recovery-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
 const access=createArchiveAccess(dir),key=readFileSync(join(dir,'archive-access.key'),'utf8').trim();assert.equal(statSync(join(dir,'archive-access.key')).mode&0o777,0o600);assert.equal(createArchiveAccess(dir)(key).archiveRecovery,true);
 const logs=createMatchLogs(dir);logs.begin({matchId:'legacy',players:[]},{code:'OLD',host:'old-host'},'old');
 const context={code:'NEW',host:'new-host',...access(key)};
 assert.equal(logs.list(context)[0].id,'legacy');assert.equal((await logs.records('legacy',context))[0].type,'match-start');
 assert.deepEqual(logs.list({...context,...access('0'.repeat(64))}),[]);
 await assert.rejects(logs.records('legacy',{code:'NEW',host:'bad'}));assert.throws(()=>logs.download('legacy',{code:'NEW',host:'bad'},{}));
 assert.throws(()=>logs.download('../legacy',context,{}));assert.equal(access('é'.repeat(64)).archiveRecovery,false);
});
