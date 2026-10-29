import test from 'node:test';
import assert from 'node:assert/strict';
import {chatView,postChat} from '../chat.mjs';
const setup=()=>{const a={id:'a',name:'Alice'},b={id:'b',name:'Bob'},watcher={id:'w',name:'Watcher',spectator:true};return {a,b,watcher,room:{players:[a,b],status:'lobby',game:{players:[{id:'a',alive:true},{id:'b',alive:false}]}}};};
test('chat is shared by living, eliminated and spectator participants throughout play',()=>{
 const {a,b,watcher,room}=setup();postChat(room,a,'hello',1000);assert.equal(chatView(room,watcher).messages.length,1);
 room.status='playing';postChat(room,watcher,'hidden hand discussion',2000);postChat(room,b,'eliminated',2000);
 assert.deepEqual(chatView(room,a).messages.map(m=>m.text),['hello','hidden hand discussion','eliminated']);assert.equal(chatView(room,b).channel,'room');assert.equal(chatView(room,watcher).messages.length,3);assert.equal(chatView(room,a).messages[1].audience,'spectator');assert.equal(chatView(room,a).messages[2].audience,'eliminated');
 room.status='finished';assert.equal(chatView(room,a).messages.length,3);
});
test('chat validates messages, throttles each sender and retains at most 100',()=>{
 const {room,a}=setup();assert.throws(()=>postChat(room,a,' '));assert.throws(()=>postChat(room,a,{}));assert.throws(()=>postChat(room,a,'x'.repeat(501)));
 const m=postChat(room,a,' <img src=x onerror=alert(1)> ',1000);assert.equal(m.text,'<img src=x onerror=alert(1)>');assert.equal(m.seat,1);assert.throws(()=>postChat(room,a,'spam',1500));
 for(let i=1;i<=105;i++)postChat(room,a,String(i),1000+i*1000);assert.equal(room.messages.length,100);assert.equal(room.messages[0].text,'6');
});
