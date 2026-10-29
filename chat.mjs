import {randomUUID} from 'node:crypto';
export function chatChannel(){return 'room';}
export function chatView(room){return {channel:'room',replying:[...(room.chatJobs||new Map())].map(([id])=>id),messages:room.messages||[]};}
export function postChat(room,person,value,now=Date.now()){
 if(typeof value!=='string'||!value.trim())throw new Error('Enter a message.');
 const text=value.trim();if(text.length>500)throw new Error('Messages can contain up to 500 characters.');
 if(person.lastChatAt!==undefined&&now-person.lastChatAt<1000)throw new Error('Please wait a second before sending another message.');
 const message={id:randomUUID(),senderId:person.id,name:person.name,seat:room.players.findIndex(p=>p.id===person.id)+1||null,text,time:now,audience:person.spectator?'spectator':room.game?.players.find(p=>p.id===person.id)?.alive===false?'eliminated':'player',channel:chatChannel(room,person)};
 person.lastChatAt=now;room.messages=[...(room.messages||[]),message].slice(-100);return message;
}
