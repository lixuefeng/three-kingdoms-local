import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {GENERALS} from '../cards.mjs';

const source=await readFile(new URL('../public/app.js',import.meta.url),'utf8');
function fixture(){
 const selected=new Set(['liubei']);let click,focused=false;const chosen=[];
 const inspector={innerHTML:'',open:false,showModal(){this.open=true;},querySelector(){return {focus(){focused=true;}};}};
 const context=vm.createContext({busy:false,selected,state:{generals:GENERALS,game:{players:[]}},roleGuessPlayerId:null,inspector,esc:s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),portraitMarkup:g=>`<div class="portrait-art">${g.name}</div>`,chooseUse:id=>chosen.push(id),app:{addEventListener(type,fn){click=fn;}}});
 for(const name of ['generalChoices','inspectGeneral','showGeneralDetails'])vm.runInContext(source.split('\n').find(l=>l.startsWith('function '+name+'(')),context);
 const start=source.indexOf("app.addEventListener('click',async e=>{");const end=source.indexOf('\n});',start)+4;vm.runInContext(source.slice(start,end),context);
 return {context,selected,chosen,inspector,focused:()=>focused,click:selector=>click({target:{closest:s=>s===selector?{dataset:selector==='[data-preview-general]'?{previewGeneral:'liubei'}:{useOption:'sunquan'}}:null}})};
}
for(const [mode,size,max]of [['identity',3,1],['3v3',16,2]])test(`${mode} general candidates have separate selectable cards and accessible info buttons`,()=>{
 const {context}=fixture();context.game={mode,prompt:{id:'choice',zone:'general',title:'Choose',min:max,max,options:GENERALS.slice(0,size).map(g=>({id:g.id,label:g.name,description:g.skills}))}};
 const html=vm.runInContext('generalChoices(game)',context);assert.equal((html.match(/data-preview-general=/g)||[]).length,size);assert.equal((html.match(/data-use-option=/g)||[]).length,size);assert.match(html,/Click ⓘ/);
 for(const card of html.split('<div class="general-choice">').slice(1)){const selectEnd=card.indexOf('</button>'),infoStart=card.indexOf('class="general-choice-info"');assert.ok(selectEnd<infoStart,'info is a sibling, not nested inside selection button');}
});
test('candidate info click opens complete powers without choosing or clearing a general',async()=>{
 const f=fixture();await f.click('[data-preview-general]');assert.equal(f.inspector.open,true);assert.equal(f.focused(),true);assert.match(f.inspector.innerHTML,/Liu Bei/);assert.match(f.inspector.innerHTML,/Benevolence/);assert.match(f.inspector.innerHTML,/Ask other Shu characters to supply an Attack when you need one/);assert.deepEqual([...f.selected],['liubei']);assert.deepEqual(f.chosen,[]);
 await f.click('[data-use-option]');assert.deepEqual(f.chosen,['sunquan']);
});
test('on-table general inspection still includes the player state',()=>{
 const f=fixture();f.context.state.game.players=[{id:'me',name:'Alice',general:GENERALS.find(g=>g.id==='liubei'),hp:2,maxHp:5,equip:{},chained:true}];vm.runInContext("inspectGeneral('me')",f.context);assert.match(f.inspector.innerHTML,/Alice · 2\/5 HP/);assert.match(f.inspector.innerHTML,/Chained/);assert.match(f.inspector.innerHTML,/Equipped: None/);
});
