const escapeRE=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export const generalName=p=>p?.general?.name||p?.name||'Table';
export function eventText(message,players){
 const names=new Map(players.filter(p=>p.name).map(p=>[p.name,generalName(p)]));
 if(!names.size)return message;
 const re=new RegExp('(?<![\\p{L}\\p{N}_])('+[...names.keys()].sort((a,b)=>b.length-a.length).map(escapeRE).join('|')+')(?![\\p{L}\\p{N}_])','gu');
 return message.replace(re,name=>names.get(name));
}
export function eventTokens(text,players,guide=[]){
 const entries=new Map();
 for(const c of guide)if(c.name)entries.set(c.name,{type:'card',kind:c.kind});
 for(const p of players){for(const part of (p.general?.skills||'').split(/(?<=\.) (?=[A-Z][A-Za-z ()-]+:)/)){const i=part.indexOf(':');if(i>0)entries.set(part.slice(0,i),{type:'skill'});}if(p.general?.name)entries.set(p.general.name,{type:'general'});}
 if(!entries.size)return [{text,type:'text'}];
 const re=new RegExp('(?<![\\p{L}\\p{N}_])('+[...entries.keys()].sort((a,b)=>b.length-a.length).map(escapeRE).join('|')+')(?![\\p{L}\\p{N}_])','gu');
 const out=[];let at=0;for(const m of text.matchAll(re)){if(m.index>at)out.push({text:text.slice(at,m.index),type:'text'});out.push({text:m[0],...entries.get(m[0])});at=m.index+m[0].length;}if(at<text.length)out.push({text:text.slice(at),type:'text'});return out;
}
export function turnHistory(logs){
 const turns=[];for(const entry of logs){let turn=turns.at(-1);if(!turn||turn.turn!==entry.turn){turn={turn:entry.turn||0,playerId:entry.turnPlayerId,playerName:entry.turnGeneral,actions:[]};turns.push(turn);}let action=turn.actions.at(-1);if(!action||action.id!==entry.groupId){action={id:entry.groupId,label:entry.groupLabel,entries:[]};turn.actions.push(action);}action.entries.push(entry);}return turns;
}
// Consolidate only adjacent, explicitly typed overlap. Identical real responses
// and judgments are separate events and must never be globally deduplicated.
export function compactEvents(entries){
 const removed=new Set();
 for(let i=0;i<entries.length;i++){
  const e=entries[i],near=entries.slice(Math.max(0,i-2),i+3).filter(x=>x!==e&&x.groupId===e.groupId&&x.turn===e.turn);
  if(e.eventType==='trigger'){
   const other=near.find(x=>!x.eventType&&x.message?.includes(e.actorName)&&x.message.includes(e.skill)&&/activates|cancels/.test(x.message));
   if(other){if(other.message.includes('cancels'))removed.add(e.id);else removed.add(other.id);}
  }
  if(e.eventType==='movement'){
   if(e.movementKind==='draw'&&near.some(x=>x.eventType==='trigger'&&x.actorId===e.actorId&&new RegExp(' · Draw '+e.count+' card(?:\\(s\\))?[s.]?$','i').test(x.message)))removed.add(e.id);
   const verb={draw:'draws',discard:'discards',transfer:'gives'}[e.movementKind];
   if(verb&&near.some(x=>!x.eventType&&x.message?.includes(e.actorName)&&x.message.includes(verb)&&new RegExp('\\b'+e.count+'\\b').test(x.message)&&(e.movementKind!=='transfer'||x.message.includes(e.recipientName))))removed.add(e.id);
  }
  if(e.eventType==='dodge-result'&&entries.slice(0,i).some(x=>x.groupId===e.groupId&&x.turn===e.turn&&x.eventType==='response'&&x.cardKind==='shan'&&x.actorId===e.actorId))removed.add(e.id);
 }
 return entries.filter(e=>!removed.has(e.id));
}
export function actionSummary(game){
 const group=game.actionGroup;if(!group)return {heading:null,entries:[]};
 const entries=compactEvents(game.logs.filter(l=>l.groupId===group.id&&l.turn===game.turn));
 const heading=entries.find(l=>l.eventType==='action');
 return {heading,entries:entries.filter(l=>l!==heading)};
}
