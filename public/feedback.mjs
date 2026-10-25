const symbols={Steal:'✋','Burning Bridges':'🔥',Peach:'🍑',Acedia:'💤',Lightning:'⚡','Lightning passes':'⚡',Negation:'⊘','Iron Chains':'⛓','Chained':'⛓',Released:'⛓','Bumper Harvest':'🌾',Brotherhood:'🍑','Flame Tactic':'🔥',Duel:'⚔','Borrowed Sword':'⚔','Barbarian Invasion':'⚔','Raining Arrows':'🏹','Something Out of Nothing':'🃏','Benevolence':'🎁',Legacy:'🎁',Assault:'✋',Retaliation:'✋',Deflection:'↪','Prodigal Healer':'✚',Betrothment:'♥',Stargazing:'✦','Goddess of Luo River':'☯'};
export function effectFeedback(effect){const icon=symbols[effect.label]||(effect.kind==='trigger'?'🛡':effect.kind==='attack'?'⚔':effect.kind==='damage'?'💥':effect.kind==='dodge'?'↪':effect.kind==='heal'?'✚':effect.kind==='skill'?'✦':'◆');return {icon,label:(effect.label||effect.kind)+(effect.detail?' · '+effect.detail:''),route:['attack','spell','chain','skill','heal'].includes(effect.kind)};}
export function soundNotes(effect){if(effect.kind==='damage')return [110,75];if(effect.kind==='dodge')return [660,990];if(effect.kind==='heal')return [440,554,660];if(effect.kind==='attack')return [240,120];return [392,523];}
let context=null;
export async function unlockSound(){try{context??=new (window.AudioContext||window.webkitAudioContext)();if(context.state==='suspended')await context.resume();return context.state==='running';}catch{return false;}}
export function playActionSound(effect){if(!context||context.state!=='running')return;const start=context.currentTime;if(effect.kind==='damage'){const length=Math.floor(context.sampleRate*.19),buffer=context.createBuffer(1,length,context.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*(1-i/length);const noise=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();noise.buffer=buffer;filter.type='lowpass';filter.frequency.setValueAtTime(1100,start);filter.frequency.exponentialRampToValueAtTime(180,start+.18);gain.gain.setValueAtTime(.15,start);gain.gain.exponentialRampToValueAtTime(.001,start+.19);noise.connect(filter);filter.connect(gain);gain.connect(context.destination);noise.start(start);noise.onended=()=>{noise.disconnect();filter.disconnect();gain.disconnect();};}for(const [i,hz] of soundNotes(effect).entries()){const osc=context.createOscillator(),gain=context.createGain(),at=start+i*.075;osc.type=effect.kind==='damage'?'triangle':'sine';osc.frequency.setValueAtTime(hz,at);gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.065,at+.008);gain.gain.exponentialRampToValueAtTime(.001,at+.11);osc.connect(gain);gain.connect(context.destination);osc.start(at);osc.stop(at+.12);osc.onended=()=>{osc.disconnect();gain.disconnect();};}}

export function announcementText(effect){
 const text=String(effect.label||'').trim();if(!text||effect.kind==='damage')return null;
 return text.replace(/−/g,'minus ').replace(/\+/g,'plus ');
}
let englishVoice=null,lastSpoken='',lastSpokenAt=0;
function chooseEnglishVoice(){const voices=window.speechSynthesis?.getVoices()||[];englishVoice=voices.find(v=>v.lang==='en-US'&&v.localService)||voices.find(v=>v.lang.startsWith('en')&&v.localService)||voices.find(v=>v.lang.startsWith('en'))||null;}
export function stopAnnouncements(){if(typeof window!=='undefined')window.speechSynthesis?.cancel();}
export function speakAnnouncement(effect,{interrupt=false}={}){
 const text=announcementText(effect);if(!text||typeof window==='undefined'||!window.speechSynthesis||!window.SpeechSynthesisUtterance)return false;
 if(effect.kind!=='announce'&&!interrupt&&text===lastSpoken&&Date.now()-lastSpokenAt<1500)return true;lastSpoken=text;lastSpokenAt=Date.now();chooseEnglishVoice();const synth=window.speechSynthesis;if(interrupt)synth.cancel();
 // Avoid stale announcements trailing behind a fast action sequence.
 if(synth.pending)synth.cancel();
 const utterance=new window.SpeechSynthesisUtterance(text);utterance.lang=englishVoice?.lang||'en-US';if(englishVoice)utterance.voice=englishVoice;utterance.rate=1.05;utterance.volume=.85;synth.speak(utterance);return true;
}
if(typeof window!=='undefined'&&window.speechSynthesis){chooseEnglishVoice();window.speechSynthesis.addEventListener('voiceschanged',chooseEnglishVoice);}

// Original formant-synthesized vocal exclamations; no recorded or external voices.
let damageVoiceAudio=null;
export async function playDamageVoice(){
 if(typeof Audio==='undefined')return false;
 try{damageVoiceAudio?.pause();damageVoiceAudio=new Audio('/damage-'+(1+Math.floor(Math.random()*3))+'.wav');damageVoiceAudio.volume=.6;await damageVoiceAudio.play();return true;}catch{return false;}
}
