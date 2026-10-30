import {mkdirSync,appendFileSync,readdirSync,openSync,readSync,closeSync,statSync,createReadStream} from 'node:fs';
import {createInterface} from 'node:readline';
import {join} from 'node:path';
export function createMatchLogs(directory,{secrets=[]}={}){
 const folder=directory?join(directory,'match-logs'):null,entries=new Map(),memory=new Map();
 const safe=id=>typeof id==='string'&&/^[a-zA-Z0-9-]{1,100}$/.test(id);
 const allowed=(e,room)=>room.sharedMatchIds?.includes(e.matchId)||room.archiveRecovery===true||e.archiveOwner&&e.archiveOwner===room.archiveOwner||e.roomCode===room.code&&e.hostId===room.host;
 const clean=value=>{let text=JSON.stringify(value);for(const key of secrets.filter(Boolean))text=text.split(key).join('[REDACTED]');return text;};
 if(folder){mkdirSync(folder,{recursive:true,mode:0o700});for(const file of readdirSync(folder).filter(f=>f.endsWith('.jsonl'))){try{const fd=openSync(join(folder,file),'r'),buffer=Buffer.alloc(4096);let n;try{n=readSync(fd,buffer,0,4096,0);}finally{closeSync(fd);}const meta=JSON.parse(buffer.subarray(0,n).toString('utf8').split('\n',1)[0]);if(meta.type==='match-start'&&safe(meta.matchId))entries.set(meta.matchId,meta);}catch{}}}
 function append(id,type,data){const entry=entries.get(id);if(!entry)return;try{const line=clean({type,matchId:id,time:Date.now(),...data})+'\n';if(folder)appendFileSync(join(folder,id+'.jsonl'),line,{mode:0o600});else memory.set(id,(memory.get(id)||'')+line);}catch{entry.error='Could not save match log. Check server storage.';}}
 return {
  begin(game,room,version){if(entries.has(game.matchId))return;const meta={type:'match-start',matchId:game.matchId,time:Date.now(),roomCode:room.code,hostId:room.host,...(room.archiveOwner?{archiveOwner:room.archiveOwner}:{}),version,mode:game.mode||'identity',private:true,formatVersion:1};entries.set(game.matchId,meta);append(game.matchId,'match-start',meta);},
  append,
  snapshot(game){if(!game)return;const e=entries.get(game.matchId);if(!e)return;const state={mode:game.mode||'identity',turn:game.turn,phase:game.phase,current:game.current?.id,winner:game.winner,players:game.players.map(p=>({id:p.id,name:p.name,general:p.general?.name,role:p.role,hp:p.hp,maxHp:p.maxHp,alive:p.alive,handCount:p.hand?.length,equipment:p.equip,judgment:p.judge}))};const sig=JSON.stringify(state);if(sig!==e.lastState){e.lastState=sig;append(game.matchId,'state',state);}},
  finish(game,reason){if(!game)return;this.snapshot(game);append(game.matchId,'match-status',{status:reason,winner:game.winner,turn:game.turn});},
  list(room){return [...entries.values()].filter(e=>allowed(e,room)).map(e=>({id:e.matchId,startedAt:e.time,error:e.error||null,bytes:folder&&!e.error?statSync(join(folder,e.matchId+'.jsonl')).size:(memory.get(e.matchId)||'').length})).reverse();},
  async records(id,room){const e=entries.get(id);if(!safe(id)||!e||!allowed(e,room))throw Error('That match log is not available to you.');if(e.error)throw Error(e.error);const records=[];if(folder){const lines=createInterface({input:createReadStream(join(folder,id+'.jsonl')),crlfDelay:Infinity});for await(const line of lines){if(!line.trim())continue;try{records.push(JSON.parse(line));}catch{records.push({type:'unreadable-record'});}}}else for(const line of (memory.get(id)||'').split('\n'))if(line.trim()){try{records.push(JSON.parse(line));}catch{records.push({type:'unreadable-record'});}}return records;},
  download(id,room,res){const e=entries.get(id);if(!safe(id)||!e||!allowed(e,room))throw Error('That match log is not available to you.');if(e.error)throw Error(e.error);res.writeHead(200,{'Content-Type':'application/x-ndjson; charset=utf-8','Content-Disposition':'attachment; filename="match-'+id+'.jsonl"'});if(folder){const stream=createReadStream(join(folder,id+'.jsonl'));stream.on('error',()=>res.destroy());stream.pipe(res);}else res.end(memory.get(id)||'');}
 };
}
