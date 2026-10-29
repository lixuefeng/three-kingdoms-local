const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createChat({send,onError}){
 const root=document.createElement('aside');root.className='room-chat';root.hidden=true;
 root.innerHTML='<button class="chat-resize" type="button" aria-label="Resize chat" title="Drag to resize chat. Arrow keys also resize.">↖</button><section id="chat-panel" class="chat-panel" aria-label="Room chat"><div class="chat-heading"><strong>Table chat</strong><small>Talk strategy · Talk trash</small><button type="button" class="chat-minimize" aria-label="Minimize chat" aria-expanded="true">−</button></div><p class="chat-channel"></p><div class="chat-messages" role="log" aria-label="Messages" aria-live="polite"></div><p class="chat-typing" role="status"></p><form class="chat-form"><label class="chat-recipient-label">To <select class="chat-recipient" aria-label="Chat recipient"><option value="">Table · @mention a bot to get a reply</option></select></label><div class="chat-compose"><input name="message" aria-label="Chat message" placeholder="Say something…" maxlength="500" autocomplete="off" required><button type="submit">Send</button></div></form></section>';
 document.body.append(root);
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
  root.hidden=!state;document.body.classList.toggle('has-room-chat',!!state);if(!state){key=null;return;}
  const chat=state.chat||{channel:'room',messages:[],bots:[]},nextKey=state.room.code+':'+state.room.me+':'+chat.channel;
  if(nextKey!==key){key=nextKey;signature=null;botSignature='';input.value='';recipient.value='';}
  const bots=chat.bots||[],nextBots=JSON.stringify(bots);if(nextBots!==botSignature){const selected=recipient.value;botSignature=nextBots;recipient.innerHTML='<option value="">Table · @mention a bot to get a reply</option>'+bots.map(b=>`<option value="${escape(b.id)}">${escape(b.name)}${b.name!==b.seatName?' · '+escape(b.seatName):''}</option>`).join('');if(bots.some(b=>b.id===selected))recipient.value=selected;}
  root.querySelector('.chat-channel').textContent='Everyone · Players, spectators & eliminated players';
  const typing=(chat.replying||[]).map(id=>bots.find(b=>b.id===id)?.name).filter(Boolean);root.querySelector('.chat-typing').textContent=typing.length?typing.join(', ')+' replying…':'';
  const nextSignature=chat.messages.map(m=>m.id).join(',');if(nextSignature!==signature){const atBottom=log.scrollHeight-log.scrollTop-log.clientHeight<40;signature=nextSignature;log.innerHTML=chat.messages.length?chat.messages.map(m=>`<div class="chat-message ${m.senderId===state.room.me?'own':''} ${m.ai?'ai-message':''}"><div><strong>${escape(m.name)}${m.ai?' <span class="chat-ai-badge">AI</span>':''}${m.audience==='spectator'?' · Spectator':m.audience==='eliminated'?' · Out':''}</strong><time>${escape(new Date(m.time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}))}</time></div>${m.targetName?`<small class="chat-address">→ ${escape(m.targetName)}</small>`:''}<p>${escape(m.text)}</p></div>`).join(''):'<p class="chat-empty">Choose a bot above Send, or @mention its general name. Bots reply once when addressed.</p>';if(atBottom||chat.messages.at(-1)?.senderId===state.room.me)log.scrollTop=log.scrollHeight;}
 };
}
