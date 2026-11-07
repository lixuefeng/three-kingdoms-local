import {overlayBounds,fitOverlay} from './table.mjs';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createChat({send,onError}){
 const root=document.createElement('aside');root.className='room-chat';root.hidden=true;
 root.innerHTML='<button class="chat-resize" type="button" aria-label="Resize chat" title="Drag to resize chat. Arrow keys also resize.">↖</button><section id="chat-panel" class="chat-panel" aria-label="Room chat"><div class="chat-heading"><strong>Table chat</strong><small>Talk strategy · Talk trash</small><button type="button" class="chat-minimize" aria-label="Minimize chat" aria-expanded="true">−</button></div><p class="chat-channel"></p><div class="chat-messages" role="log" aria-label="Messages" aria-live="polite"></div><p class="chat-typing" role="status"></p><form class="chat-form"><label class="chat-recipient-label">To <select class="chat-recipient" aria-label="Chat recipient"><option value="">Table · @mention a bot to get a reply</option></select></label><div class="chat-compose"><input name="message" aria-label="Chat message" placeholder="Say something…" maxlength="500" autocomplete="off" required><button type="submit">Send</button></div></form></section>';
 document.body.append(root);
 const bubbles=new Map();let bubbleFrame=0,bubbleRoom=null,seenMessages=new Set();
 function clearBubbles(){for(const b of bubbles.values())b.node.remove();bubbles.clear();cancelAnimationFrame(bubbleFrame);bubbleFrame=0;}
 function positionBubbles(){
  bubbleFrame=0;
  const bounds=overlayBounds(window,document.querySelector('.mobile-game .game-shell')?.getBoundingClientRect());
  let fallbackY=Math.max(bounds.top+12,(document.querySelector('.game-toolbar')?.getBoundingClientRect().bottom??bounds.top)+12);
  for(const [id,b] of bubbles){
   if(performance.now()>=b.until){b.node.remove();bubbles.delete(id);continue;}
   const anchor=document.querySelector(`[data-player-id="${CSS.escape(id)}"]`),rect=anchor?.getBoundingClientRect();
   const visible=rect&&rect.bottom>bounds.top&&rect.top<bounds.bottom&&rect.right>bounds.left&&rect.left<bounds.right;
   b.node.style.maxWidth=Math.max(1,Math.min(250,bounds.right-bounds.left-24))+'px';
   b.node.style.maxHeight=Math.max(1,bounds.bottom-bounds.top-24)+'px';
   const w=b.node.offsetWidth,h=b.node.offsetHeight;
   const above=visible&&rect.top-h-14>=bounds.top+12;
   const desiredY=visible?(above?rect.top-h-14:rect.bottom+10):fallbackY;
   const {x,y}=fitOverlay(bounds,visible?rect.left+rect.width/2-w/2:bounds.left+12,desiredY,w,h,12);
   b.node.classList.toggle('anchored',!!above);
   b.node.style.left=x+'px';b.node.style.top=y+'px';
   if(above)b.node.style.setProperty('--tail',Math.max(12,Math.min(w-24,rect.left+rect.width/2-x))+'px');
   if(!visible)fallbackY=y+h+10;
  }
  if(bubbles.size)bubbleFrame=requestAnimationFrame(positionBubbles);
 }
 function updateBubbles(state,messages){
  const room=state?state.room.code+':'+state.room.me:null;
  if(room!==bubbleRoom){clearBubbles();bubbleRoom=room;seenMessages=new Set(messages.map(m=>m.id));return;}
  if(!state)return;
  for(const m of messages){
   if(seenMessages.has(m.id))continue;seenMessages.add(m.id);
   if(!m.senderId||!m.text)continue;
   bubbles.get(m.senderId)?.node.remove();
   const node=document.createElement('div');node.className='table-speech';
   const name=document.createElement('strong');name.textContent=m.name+(m.ai?' · AI':'');node.append(name);
   const text=m.text.length>240?m.text.slice(0,237)+'…':m.text;node.append(document.createTextNode(text));document.body.append(node);
   bubbles.set(m.senderId,{node,until:performance.now()+Math.min(12000,Math.max(6000,text.length*55))});
  }
  // Keep deduplication bounded to the messages still supplied by the server.
  seenMessages=new Set(messages.map(m=>m.id));
  if(bubbles.size&&!bubbleFrame)bubbleFrame=requestAnimationFrame(positionBubbles);
 }

 let minimized=localStorage.getItem('sgs-chat-minimized')==='1';
 const minimize=root.querySelector('.chat-minimize');
 function setMinimized(value){minimized=value;root.classList.toggle('chat-minimized',value);minimize.textContent=value?'+':'−';minimize.setAttribute('aria-label',value?'Expand chat':'Minimize chat');minimize.setAttribute('aria-expanded',String(!value));for(const el of root.querySelectorAll('.chat-channel,.chat-messages,.chat-typing,.chat-form,.chat-resize'))el.hidden=value;try{localStorage.setItem('sgs-chat-minimized',value?'1':'0');}catch{}}
 minimize.addEventListener('click',()=>setMinimized(!minimized));setMinimized(minimized);
 const log=root.querySelector('.chat-messages'),input=root.querySelector('input'),recipient=root.querySelector('select'),form=root.querySelector('form');let key=null,signature=null,botSignature='',sending=false;
 root.addEventListener('keydown',e=>e.stopPropagation());
 const grip=root.querySelector('.chat-resize'),panel=root.querySelector('.chat-panel');
 let size;try{size=JSON.parse(localStorage.getItem('sgs-chat-size'));}catch{}
 function resize(width,height){
  width=Math.min(Math.max(240,Number(width)||310),Math.max(240,innerWidth-28));
  height=Math.min(Math.max(150,Number(height)||270),Math.max(150,innerHeight-50));
  size={width,height};root.style.width=width+'px';panel.style.height=height+'px';
 }
 if(size)resize(size.width,size.height);
 let drag=null;
 grip.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();const rect=panel.getBoundingClientRect();drag={x:e.clientX,y:e.clientY,width:rect.width,height:rect.height};grip.setPointerCapture(e.pointerId);});
 grip.addEventListener('pointermove',e=>{if(drag)resize(drag.width+drag.x-e.clientX,drag.height+drag.y-e.clientY);});
 function save(){if(!drag)return;drag=null;try{localStorage.setItem('sgs-chat-size',JSON.stringify(size));}catch{}}
 grip.addEventListener('pointerup',save);grip.addEventListener('pointercancel',save);
 grip.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const rect=panel.getBoundingClientRect();resize(rect.width+(e.key==='ArrowLeft'?20:e.key==='ArrowRight'?-20:0),rect.height+(e.key==='ArrowUp'?20:e.key==='ArrowDown'?-20:0));try{localStorage.setItem('sgs-chat-size',JSON.stringify(size));}catch{}});
 window.addEventListener('resize',()=>{if(size)resize(size.width,size.height);});

 form.addEventListener('submit',async e=>{e.preventDefault();const value=input.value.trim();if(!value||sending)return;sending=true;form.querySelector('button').disabled=true;try{const result=await send(value,recipient.value||null);if(input.value.trim()===value)input.value='';if(result?.notice)onError(result.notice);}catch(e){onError(e.message);}finally{sending=false;form.querySelector('button').disabled=false;input.focus();}});
 return state=>{
  root.hidden=!state;document.body.classList.toggle('has-room-chat',!!state);if(!state){key=null;updateBubbles(null,[]);return;}
  const chat=state.chat||{channel:'room',messages:[],bots:[]},nextKey=state.room.code+':'+state.room.me+':'+chat.channel;
  updateBubbles(state,chat.messages);
  if(nextKey!==key){key=nextKey;signature=null;botSignature='';input.value='';recipient.value='';}
  const bots=chat.bots||[],nextBots=JSON.stringify(bots);if(nextBots!==botSignature){const selected=recipient.value;botSignature=nextBots;recipient.innerHTML='<option value="">Table · @mention a bot to get a reply</option>'+bots.map(b=>`<option value="${escape(b.id)}">${escape(b.name)}${b.name!==b.seatName?' · '+escape(b.seatName):''}</option>`).join('');if(bots.some(b=>b.id===selected))recipient.value=selected;}
  root.querySelector('.chat-channel').textContent='Everyone · Players, spectators & eliminated players';
  const typing=(chat.replying||[]).map(id=>bots.find(b=>b.id===id)?.name).filter(Boolean);root.querySelector('.chat-typing').textContent=typing.length?typing.join(', ')+' replying…':'';
  const nextSignature=chat.messages.map(m=>m.id).join(',');if(nextSignature!==signature){const atBottom=log.scrollHeight-log.scrollTop-log.clientHeight<40;signature=nextSignature;log.innerHTML=chat.messages.length?chat.messages.map(m=>`<div class="chat-message ${m.senderId===state.room.me?'own':''} ${m.ai?'ai-message':''}"><div><strong>${escape(m.name)}${m.ai?' <span class="chat-ai-badge">AI</span>':''}${m.audience==='spectator'?' · Spectator':m.audience==='eliminated'?' · Out':''}</strong><time>${escape(new Date(m.time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}))}</time></div>${m.targetName?`<small class="chat-address">→ ${escape(m.targetName)}</small>`:''}<p>${escape(m.text)}</p></div>`).join(''):'<p class="chat-empty">Choose a bot above Send, or @mention its general name. Bots reply once when addressed.</p>';if(atBottom||chat.messages.at(-1)?.senderId===state.room.me)log.scrollTop=log.scrollHeight;}
 };
}
