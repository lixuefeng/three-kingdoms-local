import {readFileSync,writeFileSync,renameSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID,randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';
export const roleWon=(role,winner)=>winner==='lord'?['lord','loyal'].includes(role):role===winner;
export function matchReview(game){return {id:game.matchId,mode:game.mode||'identity',winner:game.winner,turns:game.turn,finishedAt:Date.now(),eliminations:game.eliminations||[],players:game.players.map(p=>({id:p.id,profileId:p.profileId||null,bot:!!p.bot,name:p.name,role:p.role,general:p.general,alive:p.alive,won:roleWon(p.role,game.winner)&&(game.winner!=='spy'||p.alive),kills:game.stats?.[p.id]?.kills||0,damage:game.stats?.[p.id]?.damage||0,damageTaken:game.stats?.[p.id]?.damageTaken||0}))};}
export function createResults(directory){
 const path=directory?join(directory,'results.json'):null;let data={profiles:[],matches:[]};const failures=new Map();
 if(path){try{data=JSON.parse(readFileSync(path,'utf8'));if(!Array.isArray(data.profiles)||!Array.isArray(data.matches))throw Error('Invalid results database');}catch(e){if(e.code!=='ENOENT')throw e;}}
 function save(next){if(path){mkdirSync(directory,{recursive:true,mode:0o700});writeFileSync(path+'.tmp',JSON.stringify(next),{mode:0o600});renameSync(path+'.tmp',path);}data=next;}
 return {
  profiles:()=>data.profiles.map(({id,name})=>({id,name})),
  claim({profileId,pin,newProfileName}){
   if(!profileId&&!newProfileName)return null;
   if(!/^\d{4,8}$/.test(String(pin||'')))throw Error('Use a 4–8 digit profile PIN.');
   if(newProfileName){const name=String(newProfileName).trim().slice(0,24);if(!name)throw Error('Enter a profile name.');if(data.profiles.some(p=>p.name.toLowerCase()===name.toLowerCase()))throw Error('That profile exists. Select it and enter its PIN.');const salt=randomBytes(16).toString('hex'),p={id:randomUUID(),name,salt,pinHash:scryptSync(String(pin),salt,32).toString('hex')};save({...data,profiles:[...data.profiles,p]});return {id:p.id,name:p.name};}
   const now=Date.now(),attempt=failures.get(profileId)||{at:now,n:0};if(now-attempt.at>60000){attempt.at=now;attempt.n=0;}if(attempt.n>=5)throw Error('Too many incorrect PINs. Try again in a minute.');
   const p=data.profiles.find(p=>p.id===profileId);if(!p||!timingSafeEqual(scryptSync(String(pin),p.salt,32),Buffer.from(p.pinHash,'hex'))){attempt.n++;failures.set(profileId,attempt);throw Error('Incorrect profile or PIN.');}failures.delete(profileId);return {id:p.id,name:p.name};
  },
  record(game,{testing=false}={}){
   const review=matchReview(game),profiles=review.players.filter(p=>!p.bot&&p.profileId).map(p=>p.profileId);
   review.ranked=!!game.winner&&!testing&&review.players.length>=4&&profiles.length>0&&new Set(profiles).size===profiles.length;
   review.reason=review.ranked?'Recorded for registered human players on the leaderboard':testing?'Testing matches are unranked':review.players.length<4?'At least 4 seated players are needed for leaderboard results':!profiles.length?'Use a player profile to record leaderboard results':'Player profiles must be distinct';
   if(!game.winner)return review;
   if(!data.matches.some(m=>m.id===review.id))save({...data,matches:[...data.matches,review]});return review;
  },
  leaderboard(){return data.profiles.map(p=>{const total={id:p.id,name:p.name,matches:0,wins:0,kills:0,damage:0,roles:{}};for(const m of data.matches.filter(m=>m.ranked)){const row=m.players.find(x=>!x.bot&&x.profileId===p.id);if(!row)continue;total.matches++;total.wins+=Number(row.won);total.kills+=row.kills;total.damage+=row.damage;const r=total.roles[row.role]??={matches:0,wins:0,kills:0,damage:0};r.matches++;r.wins+=Number(row.won);r.kills+=row.kills;r.damage+=row.damage;}return {...total,winRate:total.matches?total.wins/total.matches:0};}).sort((a,b)=>b.wins-a.wins||b.kills-a.kills||a.name.localeCompare(b.name));}
 };
}
