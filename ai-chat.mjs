import {info} from './cards.mjs';
import {chatChannel,chatView,postChat} from './chat.mjs';
const publicCard=c=>{const x=info(c);return {name:x.name,kind:x.kind,suit:x.suit,rank:x.rank,text:x.text};};
export function chatObservation(room,bot,message){
 const g=room.game;
 const identity=id=>{
  const seat=room.players.findIndex(p=>p.id===id),person=room.players[seat]||room.spectators?.find(p=>p.id===id),player=g?.players.find(p=>p.id===id);
  return {id,playerName:person?.name||player?.name||null,generalName:player?.general?.name||null,seat:seat>=0?seat+1:null,isBot:!!person?.bot,isSpectator:!!person?.spectator,alive:player?player.alive!==false:null};
 };
 const speaker=m=>({senderId:m.senderId||null,...(m.senderId?{sender:identity(m.senderId)}:{}),speaker:m.name,text:m.text,ai:!!m.ai,replyTo:m.replyTo||null,targetId:m.targetId||null,targetName:m.targetName||null});
 return {you:bot.id,self:identity(bot.id),addressedByPlayer:message.senderId?identity(message.senderId):null,participants:[...room.players,...(room.spectators||[])].map(p=>identity(p.id)),general:g?.players.find(p=>p.id===bot.id)?.general?.name||bot.name,phase:g?.phase||room.status,turn:g?.turn||0,current:g?.current?.id||null,players:(g?.players||room.players).map(p=>({id:p.id,...identity(p.id),name:p.general?.name||p.name,general:p.general?.name,skills:p.general?.skills,alive:p.alive!==false,hp:p.hp,maxHp:p.maxHp,handCount:p.hand?.length??p.handCount,role:p.role==='lord'||p.alive===false?p.role:null,equipment:Object.values(p.equip||{}).map(publicCard),judgment:(p.judge||[]).map(publicCard)})),events:(g?.logs||[]).slice(-20).map(l=>l.displayMessage||l.message),conversation:chatView(room,bot).messages.slice(-20).map(speaker),addressedBy:message.name,incomingMessage:speaker(message),message:message.text};
}
export function chatBots(room,person){return room.players.filter(b=>b.bot&&chatChannel(room,b)===chatChannel(room,person)).map(b=>({id:b.id,name:room.game?.players.find(p=>p.id===b.id)?.general?.name||b.name,seatName:b.name,model:b.botMode==='llm'?b.botModel:'classic'}));}
export function addressedBot(room,person,text,targetId){
 const available=chatBots(room,person);if(targetId){const entry=available.find(b=>b.id===targetId);if(!entry)throw new Error('Choose a bot in your chat channel.');return room.players.find(p=>p.id===entry.id);}
 const mentioned=available.filter(b=>[b.name,b.seatName].some(name=>{const at=String(text).toLowerCase().indexOf('@'+name.toLowerCase());if(at<0)return false;const next=String(text)[at+name.length+1];return !next||/[\s,!?。！？，:：]/.test(next);}));
 if(mentioned.length>1)throw new Error('Address one bot at a time, or choose one from the chat recipient list.');return room.players.find(p=>p.id===mentioned[0]?.id)||null;
}
export function createAIChat({provider,broadcast,onMessage=()=>{}}){
 return function schedule(room,person,message,bot){
  if(!bot)return null;room.chatJobs??=new Map();
  if(room.chatJobs.has(bot.id))return 'That bot is still replying. Your message was posted.';
  if(room.chatJobs.size>=2)return 'Two bots are already replying. Your message was posted.';
  if(Date.now()-Math.max(bot.lastAIChatAt||0,bot.lastChatAt||0)<4000)return 'Give that bot a moment before asking again. Your message was posted.';
  const game=room.game,alive=game?.players.find(p=>p.id===bot.id)?.alive,status=room.status,channel=chatChannel(room,bot),mode=bot.botMode,profile=bot.botModel,controller=new AbortController(),job={controller,channel};
  room.chatJobs.set(bot.id,job);bot.lastAIChatAt=Date.now();broadcast(room);
  const current=()=>room.game===game&&room.status===status&&room.players.includes(bot)&&bot.botMode===mode&&bot.botModel===profile&&game?.players.find(p=>p.id===bot.id)?.alive===alive&&chatChannel(room,bot)===channel&&!controller.signal.aborted;
  void(async()=>{try{
   let reply;
   if(mode!=='llm')reply="I'm a practice bot—switch my model to Kimi, Claude or DeepSeek if you want to talk strategy or roast my plays!";
   else reply=await provider.reply({context:chatObservation(room,bot,message),playerId:bot.id,modelProfile:profile,matchId:game?.matchId||'lobby-'+room.code,signal:controller.signal,isCurrent:current});
   if(!current())return;
   const m=postChat(room,bot,reply||"My model couldn't reply just now. I'm still here—try me again in a moment.");m.ai=true;m.model=mode==='llm'?provider.models?.find(p=>p.id===profile)?.label||'AI':'Practice bot';m.name=room.game?.players.find(p=>p.id===bot.id)?.general?.name||bot.name;m.replyTo=message.id;m.targetId=message.senderId;m.targetName=room.game?.players.find(p=>p.id===message.senderId)?.general?.name||person.name;onMessage(room,bot,m);
  }catch{if(current()){const m=postChat(room,bot,"I couldn't finish that reply. Try me again in a moment.");m.ai=true;onMessage(room,bot,m);}}
  finally{if(room.chatJobs.get(bot.id)===job)room.chatJobs.delete(bot.id);broadcast(room);}})().catch(()=>{if(room.chatJobs.get(bot.id)===job)room.chatJobs.delete(bot.id);});return null;
 };
}
export function cancelAIChat(room){for(const job of room.chatJobs?.values()||[])job.controller.abort();room.chatJobs?.clear();}
