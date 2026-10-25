// Deterministic synthetic positions; no user match data or model requests.
import {writeFile} from 'node:fs/promises';
import {Game} from '../engine.mjs';
import {ALL_GENERALS,makeDeck} from '../cards.mjs';
import {botObservation} from '../llm-provider.mjs';
import {tacticalFacts} from '../bot-knowledge.mjs';
const cases=[],deck=makeDeck();
function position(general,kinds){
 const g=new Game(['p1','p2','p3','p4'].map(id=>({id,name:id,bot:true})),{seedDeck:makeDeck()});
 const gens=[general,'zhangfei','caocao','sunquan'];
 g.players.forEach((p,i)=>{p.general=ALL_GENERALS.find(x=>x.id===gens[i]);p.role=['rebel','lord','loyal','spy'][i];p.hp=p.maxHp=i===1?5:4;p.hand=[];p.equip={};p.judge=[];});
 g.current=g.players[0];g.phase='Play';g.turn=8;g.used={sha:1,shaDuringPlay:1};
 g.current.hp=3;g.current.hand=kinds.map((kind,i)=>({...deck.find(c=>c.kind===kind),id:'c'+(i+1)}));
 return g;
}
function save(id,description,g,prompt,expected){
 const p=g.current,q={id,...prompt},agentState={tactics:tacticalFacts(g,p,q)};
 cases.push({id,description,expected,observation:botObservation(g.view(p.id),p.id,q,'',agentState)});
}
let g=position('weiyan',['tao','shan','shan','sha']);
save('weiyan-heal-before-end','Attack allowance already spent. Peach yields 4 HP / 3 cards; End yields 3 HP / 4 cards and one forced discard. Engine-generated play options.',g,{zone:'turn',title:'Play a card; your one Attack has already been used this phase.',min:1,max:1,options:g.playOptions(g.current)},{anyIds:['play:tao:c1']});
g=position('weiyan',['tao','sha','sha','sha']);g.phase='Discard';
save('weiyan-discard-peach','At 3/4 HP with four cards, discard one. Three spare Attacks versus one Peach; keeping Peach is the test preference, not a proof of optimal play.',g,{zone:'cards',title:'Discard one card to your hand limit of 3.',min:1,max:1,options:g.current.hand.map(c=>({id:c.id,label:c.name,card:c}))},{avoidIds:['c1']});
g=position('liubei',['tao','sha','shan']);
save('rende-complete-action','Engine-generated play choices include Benevolence. All legal actions are accepted; gifting is not mandatory.',g,{zone:'turn',title:'Play a card or skill; Attack allowance already spent.',min:1,max:1,options:g.playOptions(g.current)},null);
g=position('zhangfei',[]);g.current.equip.armor={...deck.find(c=>c.kind==='bagua'),id:'armor1'};
save('armor-response-contract','Eight Trigrams is equipped, with no Dodge in hand. Choose armor activation or decline. Strategy requires manual review.',g,{zone:'response',title:'Lord Zhang Fei attacks you. Activate Eight Trigrams or pass.',min:1,max:1,options:[{id:'bagua',label:'Eight Trigrams: judge; red counts as Dodge'},{id:'pass',label:'Pass'}]},null);
g=position('taishici',['sha','shan']);g.current.hand.forEach((c,i)=>c.rank=i?13:2);g.players[1].hand=[{...deck.find(c=>c.kind==='sha'),id:'opponent-hidden'}];
save('pindian-card-selection','Pindian against a player with one unknown card. Prefer rank 13 to rank 2 for winning this contest.',g,{zone:'cards',title:'Pindian with Lord Zhang Fei: choose one card; higher rank wins.',min:1,max:1,options:g.current.hand.map(c=>({id:c.id,label:c.name+', rank '+c.rank,rank:c.rank}))},{anyIds:['c2']});
await writeFile(new URL('../test/fixtures/decision-cases.json',import.meta.url),JSON.stringify(cases,null,2)+'\n');
