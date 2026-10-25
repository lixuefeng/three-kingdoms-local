export function cardOptions(prompt,cardId){return prompt?.options.filter(o=>o.id===cardId||o.cardIds?.includes(cardId))||[];}
export function dockOptions(prompt,ownedIds,playerIds){return (prompt?.options||[]).filter(o=>!playerIds.includes(o.id)&&!ownedIds.some(id=>o.id===id||o.cardIds?.includes(id)));}
export function moveStar(draft,id,lane,before=null){
 const next={top:draft.top.filter(x=>x!==id),bottom:draft.bottom.filter(x=>x!==id)};
 if(!['top','bottom'].includes(lane)||![...draft.top,...draft.bottom].includes(id))return draft;
 const at=before?next[lane].indexOf(before):-1;next[lane].splice(at<0?next[lane].length:at,0,id);return next;
}
export function starAnswer(draft){return [...draft.top,'bottom',...draft.bottom];}

// Only data already visible to this viewer is used for decision feedback.
export function decisionInfo(game,viewerId){
 if(game.responseWindow)return {urgent:false,title:game.responseWindow.title,detail:'Everyone has the same response window. Passing is private.',decision:game.responseWindow};
 const decision=(game.decisions||[]).find(d=>d.playerId===viewerId)||game.decision;
 const q=game.prompt,actor=game.players.find(p=>p.id===decision?.playerId),action=decision?.action;
 const source=game.players.find(p=>p.id===(q?.context?.sourceId||action?.sourceId));
 const target=game.players.find(p=>p.id===action?.targetId);
 if(action?.kind==='attack'||q?.context?.kind==='attack-response')return {urgent:decision?.playerId===viewerId,sourceId:source?.id,title:`${source?.name||'A player'} is attacking ${target?.id===viewerId?'YOU':target?.name||'you'}`,detail:decision?.playerId===viewerId?`${action?.label||q?.context?.label||'Attack'} · Play Dodge from your hand, use a skill, or Pass.`:`${action?.label||'Attack'} · Waiting for ${actor?.name||'a response'}.`,decision};
 if(q)return {urgent:q.zone!=='turn'&&q.zone!=='general',title:q.zone==='turn'?'Your Play Phase':q.zone==='general'?'Choose your general':q.title,detail:q.zone==='turn'?'Select a card → select target → Use beside the card.':q.zone==='harvest'?'Click a revealed card at the center of the table to take it.':q.context?.kind==='area'?'Choose one card below. Click once to resolve.':'Your decision · Choose an available action below.',decision};
 return {urgent:false,title:actor?`${actor.name} is making a decision`:game.winner?'Match complete':'Resolving action…',detail:actor?`${game.phase} · Please wait for ${actor.name}.`:'',decision};
}

export function judgmentCondition(reason,card){
 if(reason==='Goddess of Luo River')return {met:!['♥','♦'].includes(card.suit),rule:'Black',yes:'Gain this card',no:'Stop Luo River'};
 if(reason==='Eight Trigrams Formation')return {met:['♥','♦'].includes(card.suit),rule:'Red',yes:'Counts as Dodge',no:'Play Dodge or Pass'};
 if(reason==='Lightning Strike'||reason==='Thunder Strike')return {met:card.suit==='♠',rule:'Spade',yes:'2 thunder damage',no:'No damage'};
 if(reason==='Cavalry')return {met:['♥','♦'].includes(card.suit),rule:'Red',yes:'Dodge cannot be played',no:'Dodge allowed'};
 if(reason==='Acedia')return {met:card.suit==='♥',rule:'Heart',yes:'Play Phase allowed',no:'Skip Play Phase'};
 if(reason==='Rations Depleted')return {met:card.suit==='♣',rule:'Club',yes:'Draw Phase allowed',no:'Skip Draw Phase'};
 if(reason==='Lightning')return {met:card.suit==='♠'&&card.rank>=2&&card.rank<=9,rule:'Spade 2–9',yes:'Lightning hits',no:'Lightning passes'};
 if(reason==='Staucness')return {met:card.suit!=='♥',rule:'Not a Heart',yes:'Retaliation applies',no:'No retaliation'};
 return null;
}
export function centerCards(game){
 if(game.prompt?.zone==='harvest')return game.table.filter(c=>game.prompt.options.some(o=>o.id===c.id));
 const entries=(game.recentCards||[]).map(r=>{let action=r.action||'Played';if(action.startsWith('Judgment')){const j=(game.judgments||[]).find(j=>j.cards.some(x=>x.card.id===r.card.id)),result=j?.finalCardId===r.card.id?judgmentCondition(j.reason,r.card):null;if(result)action+=' · '+(result.met?result.yes:result.no);}return {...r.card,playedBy:game.players?.find(p=>p.id===r.playerId)?.general?.name||game.players?.find(p=>p.id===r.playerId)?.name||'',action,eventId:r.id};});
 const known=new Set(entries.map(c=>c.id));for(const c of game.table)if(!known.has(c.id))entries.push(c);
 return entries;
}

export function isSpearOption(o){return o.id.startsWith('serpent:')||o.id.startsWith('play:sha:serpent:');}
export function visibleCardOptions(prompt,cardId){return cardOptions(prompt,cardId).filter(o=>!isSpearOption(o));}
export function spearPairOption(prompt,ids){return ids.length===2?prompt?.options.find(o=>isSpearOption(o)&&o.cardIds?.length===2&&ids.every(id=>o.cardIds.includes(id))):null;}

export function generalSkillButtons(general,options=[]){
 const active=options.filter(o=>o.id.startsWith('skill:'));
 const sections=(general?.skills||'').split(/(?<=\.) (?=[A-Z][A-Za-z ()-]+:)/);
 const buttons=sections.filter(s=>s.includes(':')).map(s=>{const i=s.indexOf(':'),label=s.slice(0,i).trim(),option=active.find(o=>o.label===label);return {label,description:s.slice(i+1).trim(),id:option?.id,enabled:!!option};});
 for(const o of active)if(!buttons.some(b=>b.id===o.id))buttons.push({...o,enabled:true});return buttons;
}

// Age only applies to the initial snapshot, never to live judgment updates.
export function collectJudgmentReveals(judgments,seen,{initial=false,now=Date.now()}={}){
 const pending=[];
 for(const j of judgments||[])for(let i=0;i<j.cards.length;i++){
  const key=j.id+':'+i;if(seen.has(key))continue;seen.add(key);
  if(initial&&now-j.startedAt>15000)continue;
  pending.push({judgmentId:j.id,playerId:j.playerId,reason:j.reason,...j.cards[i],replacement:i>0});
 }
 return pending;
}
