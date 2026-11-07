import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {opponentsFromViewer,nextLiving} from '../public/table.mjs';

const source=await readFile(new URL('../public/app.js',import.meta.url),'utf8');
const named=name=>{
 const start=source.indexOf('function '+name+'(');
 const end=source.indexOf('\n}',start);
 assert.notEqual(start,-1);assert.notEqual(end,-1);
 return source.slice(start,end+2);
};
function fixture(n=8){
 const players=Array.from({length:n},(_,i)=>({id:'p'+(i+1),name:'Player '+(i+1),general:{name:'General '+(i+1)},hp:3,maxHp:4,handCount:8,alive:true,equip:{},judge:[]}));
 const game={players,current:players[0].id,phase:'Play',prompt:null};
 const context=vm.createContext({state:{game,room:{me:'p3'}},game,me:players[2],mobileHandPage:0,
  esc:String,mobileMode:()=>true,opponentsFromViewer,nextLiving,
  generalName:p=>p?.general.name||'',roles:{lord:'Lord'},readGuesses:()=>({}),guessRoles:[],
  classicStatus:()=>'',generalChoices:()=>'',publicCardChoices:()=>'',areaChooser:()=>'',currentAction:()=>'<p>Attack in progress</p>',centerCards:()=>[],
  playerCard:p=>'<article data-player-id="'+p.id+'"></article>'
 });
 const slots=source.split('\n').find(l=>l.startsWith('const mobileSlots='));
 vm.runInContext([slots,...['seatTable','mobilePlayer','mobileHand','mobileGeneralStatus'].map(named)].join('\n'),context);
 return {context,players,game,run:expr=>vm.runInContext(expr,context)};
}
test('portrait seats rotate around seat 3 without renumbering opponents, keeping the center',()=>{
 for(const n of [8,10]){
  const {run}=fixture(n),html=run('seatTable(game,me)');
  const ids=[...html.matchAll(/data-player-id="(p\d+)"/g)].map(m=>m[1]);
  assert.deepEqual(ids,[...Array.from({length:n-3},(_,i)=>'p'+(i+4)),'p1','p2']);
  assert.match(html,/Attack in progress/);assert.doesNotMatch(html,/edge-offset/);
 }
});
test('mobile hand pages cover every card and clamp when a play removes the last page',()=>{
 const f=fixture();f.context.cards=Array.from({length:9},(_,i)=>({id:String(i)}));
 assert.match(f.run('mobileHand(cards).pager'),/1\/3/);
 assert.equal(f.run('mobileHand(cards).cards.map(c=>c.id).join()'),'0,1,2,3');
 assert.equal(f.run('mobileHandPage=2; mobileHand(cards).cards[0].id'),'8');
 f.context.cards.pop();
 assert.equal(f.run('mobileHand(cards).cards.map(c=>c.id).join()'),'4,5,6,7');
 assert.match(f.run('mobileHand(cards).pager'),/2\/2/);
});
test('compact tiles inspect by default and preserve an independent inspector while targeting',()=>{
 const f=fixture();f.context.p=f.players[0];f.context.p.equip.weapon={id:'w',name:'Sword'};
 f.context.p.judge=[{id:'a',name:'Acedia'},{id:'b',name:'Lightning'}];
 const html=f.run('mobilePlayer(p,{seat:1})');
 assert.match(html,/data-inspect="p1"/);assert.match(html,/Player 1/);assert.match(html,/2 pending judgments/);assert.match(html,/title="Sword"/);
 const targeting=f.run('mobilePlayer(p,{seat:1,targetable:true,sel:true,order:2})');
 assert.match(targeting,/data-target="p1" aria-pressed="true"/);
 assert.match(targeting,/<\/button><button type="button" class="mobile-inspect" data-inspect="p1"/);
 const details=f.run('mobileGeneralStatus(p)');
 for(const value of ['Weapon','Armor','+1 Horse','−1 Horse','Sword','Acedia','Lightning'])assert.ok(details.includes(value));
 const own=f.run('mobilePlayer(p,{seat:1,self:true,renderRail:items=>items[0].c.name})');
 assert.match(own,/Your equipment[\s\S]*Sword/);assert.match(own,/Your judgments[\s\S]*Acedia[\s\S]*Lightning/);
});
