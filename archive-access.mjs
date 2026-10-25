import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash,randomBytes,timingSafeEqual} from 'node:crypto';
export function archiveOwner(key){return typeof key==='string'&&/^[a-f0-9]{64}$/.test(key)?createHash('sha256').update(key).digest('hex'):null;}
export function createArchiveAccess(directory){
 let recovery=null;
 if(directory){mkdirSync(directory,{recursive:true,mode:0o700});const path=join(directory,'archive-access.key');try{writeFileSync(path,randomBytes(32).toString('hex')+'\n',{flag:'wx',mode:0o600});}catch(e){if(e.code!=='EEXIST')throw e;}recovery=readFileSync(path,'utf8').trim();if(!archiveOwner(recovery))throw Error('Invalid archive-access.key');}
 return key=>({archiveOwner:archiveOwner(key),archiveRecovery:!!recovery&&!!archiveOwner(key)&&key.length===recovery.length&&timingSafeEqual(Buffer.from(key),Buffer.from(recovery))});
}
