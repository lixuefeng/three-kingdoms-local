import {chatObservation} from './ai-chat.mjs';
import {chatChannel,postChat} from './chat.mjs';

// Called only after a complete play, never by chat messages or animation events.
export function createAutonomousChat({provider,broadcast,onMessage=()=>{},now=Date.now}){
 return function consider(room,event){
  const game=room.game,mode=room.botChatter||'occasional',time=now();
  if(mode==='off'||event.type!=='action-complete'||room.status!=='playing'||!game||game.winner||game.stopped||event.turn!==game.turn)return;
  const state=room.chatterState?.matchId===game.matchId?room.chatterState:(room.chatterState={matchId:game.matchId,lastAt:null,count:0,byBot:new Map()});
  if(state.count>=40||state.lastAt!==null&&time-state.lastAt<(mode==='lively'?20000:30000)||room.chatJobs?.size)return;
  const changes=event.after.map(p=>{const before=event.before.find(b=>b.id===p.id)||p;return {playerId:p.id,general:p.general,hpBefore:before.hp,hpAfter:p.hp,handBefore:before.handCount,handAfter:p.handCount,equipmentBefore:before.equipment,equipmentAfter:p.equipment,wasAlive:before.alive,alive:p.alive};});
  const candidates=[];
  for(const bot of room.players.filter(p=>p.bot&&p.botMode==='llm')){
   const me=changes.find(p=>p.playerId===bot.id),last=state.byBot.get(bot.id);
   if(!me?.alive||chatChannel(room,bot)!=='room'||last&&(event.turn-last.turn<2||time-last.at<30000)||time-Math.max(bot.lastChatAt||0,bot.lastAIChatAt||0)<4000)continue;
   const reasons=[];let priority=0;
   if(me.hpAfter<me.hpBefore){reasons.push('You took damage; you may react or ask for help.');priority=2;}
   if(me.hpAfter>me.hpBefore&&event.actorId!==bot.id){reasons.push('You recovered HP during this action; you may thank someone if the public events support it.');priority=3;}
   if(me.handAfter<me.handBefore&&event.actorId!==bot.id){reasons.push('You lost hand cards during another player action.');priority=Math.max(priority,1);}
   if(me.hpAfter<=1){reasons.push('You are at low HP; you may ask the table for help without claiming private cards.');priority=Math.max(priority,1);}
   if(event.actorId===bot.id){
    const harmed=changes.some(p=>p.playerId!==bot.id&&(p.hpAfter<p.hpBefore||p.handAfter<p.handBefore||JSON.stringify(p.equipmentAfter)!==JSON.stringify(p.equipmentBefore)));
    const helped=changes.some(p=>p.playerId!==bot.id&&(p.hpAfter>p.hpBefore||p.handAfter>p.handBefore));
    if(harmed||helped||me.handAfter-me.handBefore>=2){reasons.push('Your play has resolved. Decide whether it was worth celebrating, joking about, or saying nothing. Success is not guaranteed by this invitation.');priority=Math.max(priority,event.chatIntent==='celebrate_if_successful'?4:2);}
   }
   if(changes.some(p=>p.wasAlive&&!p.alive)){reasons.push('A player was eliminated; react only to publicly revealed facts.');priority=Math.max(priority,3);}
   if(reasons.length)candidates.push({bot,reasons,priority,lastAt:last?.at||0});
  }
  candidates.sort((a,b)=>b.priority-a.priority||a.lastAt-b.lastAt);
  const chosen=candidates[0];if(!chosen)return;
  const {bot,reasons}=chosen,profile=bot.botModel,turn=game.turn,channel=chatChannel(room,bot),controller=new AbortController(),job={controller,channel,spontaneous:true};
  room.chatJobs??=new Map();room.chatJobs.set(bot.id,job);state.lastAt=time;state.count++;state.byBot.set(bot.id,{turn,at:time});bot.lastAIChatAt=time;
  const current=()=>room.game===game&&room.status==='playing'&&!game.stopped&&!game.winner&&game.turn===turn&&now()-time<12000&&(room.botChatter||'occasional')!=='off'&&room.players.includes(bot)&&bot.botMode==='llm'&&bot.botModel===profile&&game.players.find(p=>p.id===bot.id)?.alive!==false&&chatChannel(room,bot)===channel&&!controller.signal.aborted;
  const context={...chatObservation(room,bot,{name:'Table event',text:'Optional reaction after a resolved action.'}),spontaneous:true,language:'English',opportunity:{action:event.label,actorId:event.actorId,turn:event.turn,reasons,changes,publicEvents:event.publicEvents}};
  broadcast(room);
  // Detached from gameplay. Silence, errors and stale replies post nothing.
  void(async()=>{try{
   const reply=await provider.reply({context,playerId:bot.id,modelProfile:profile,matchId:game.matchId,signal:controller.signal,isCurrent:current});
   if(!reply?.trim()||!current())return;
   const m=postChat(room,bot,reply.trim().slice(0,240),now());m.ai=true;m.spontaneous=true;m.name=meName();m.model=provider.models?.find(m=>m.id===profile)?.label||'AI';onMessage(room,bot,m);
  }catch{}finally{if(room.chatJobs.get(bot.id)===job)room.chatJobs.delete(bot.id);broadcast(room);}})().catch(()=>{});
  function meName(){return game.players.find(p=>p.id===bot.id)?.general?.name||bot.name;}
 };
}
