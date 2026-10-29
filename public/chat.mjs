const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createChat({send,onError}){
 const root=document.createElement('aside');root.className='room-chat';root.hidden=true;
 root.innerHTML='<button class="chat-resize" type="button" aria-label="Resize chat" title="Drag to resize chat. Arrow keys also resize.">↖</button><section id="chat-panel" class="chat-panel" aria-label="Room chat"><div class="chat-heading"><strong>Table chat</strong><small>Talk strategy · Talk trash</small><button type="button" class="chat-minimize" aria-label="Minimize chat" aria-expanded="true">−</button></div><p class="chat-channel"></p><div class="chat-messages" role="log" aria-label="Messages" aria-live="polite"></div><p class="chat-typing" role="status"></p><form class="chat-form"><label class="chat-recipient-label">To <select class="chat-recipient" aria-label="Chat recipient"><option value="">Table · @mention a bot to get a reply</option></select></label><div class="chat-compose"><input name="message" aria-label="Chat message" placeholder="Say something…" maxlength="500" autocomplete="off" required><button type="submit">Send</button></div></form></section>';
 document.body.append(root);
 const bubbleStyle=document.createElement('style');bubbleStyle.textContent=`
 .table-speech{position:fixed;z-index:85;box-sizing:border-box;width:max-content;max-width:min(250px,calc(100vw - 24px));padding:10px 13px;border:1px solid #c6ad7b;border-radius:13px;background:#fff8e9;color:#29241c;box-shadow:0 5px 20px #0005;pointer-events:none;font:14px/1.4 system-ui,sans-serif;overflow-wrap:anywhere;white-space:pre-wrap}
 .table-speech strong{display:block;font-size:11px;color:#795b30;margin-bottom:3px}.table-speech.anchored:after{content:'';position:absolute;bottom:-7px;left:var(--tail,50%);width:12px;height:12px;background:#fff8e9;border-right:1px solid #c6ad7b;border-bottom:1px solid #c6ad7b;transform:rotate(45deg)}
 `;document.head.append(bubbleStyle);
 const bubbles=new Map();let bubbleFrame=0,bubbleRoom=null,seenMessages=new Set();
 function clearBubbles(){for(const b of bubbles.values())b.node.remove();bubbles.clear();cancelAnimationFrame(bubbleFrame);bubbleFrame=0;}
 function positionBubbles(){
  bubbleFrame=0;let fallbackY=(document.querySelector('.game-toolbar')?.getBoundingClientRect().bottom||12)+12;
  for(const [id,b] of bubbles){
   if(performance.now()>=b.until){b.node.remove();bubbles.delete(id);continue;}
   const anchor=document.querySelector(`[data-player-id="${CSS.escape(id)}"]`),rect=anchor?.getBoundingClientRect();
   const visible=rect&&rect.bottom>0&&rect.top<innerHeight&&rect.right>0&&rect.left<innerWidth;
   b.node.classList.toggle('anchored',!!visible);
   const w=b.node.offsetWidth,h=b.node.offsetHeight;
   const x=visible?Math.max(12,Math.min(innerWidth-w-12,rect.left+rect.width/2-w/2)):12;
   const y=visible?Math.max(12,Math.min(innerHeight-h-12,rect.top-h-14)):fallbackY;
   b.node.style.left=x+'px';b.node.style.top=y+'px';
   if(visible)b.node.style.setProperty('--tail',Math.max(12,Math.min(w-24,rect.left+rect.width/2-x))+'px');
   else fallbackY+=h+10;
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
