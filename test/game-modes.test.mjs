import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,Finished} from '../engine.mjs';
import {GENERALS,validateRoleCounts} from '../cards.mjs';
import {doubleSpyCounts,validateModeSeats} from '../game-modes.mjs';
import {botDecision} from '../bots.mjs';
import {botObservation} from '../llm-provider.mjs';
import {BotKnowledge} from '../bot-knowledge.mjs';
import {matchReview} from '../results.mjs';
function setup(mode){const n=mode==='3v3'?6:4;return new Game(Array.from({length:n},(_,i)=>({id:String(i),name:'P'+i})),{mode,botPacing:false,seconds:0,pause:async()=>{}});}
test('Double Spy preset is valid at every supported table size',()=>{
 for(let n=4;n<=8;n++){const counts=doubleSpyCounts(n);assert.equal(counts.spy,2);assert.deepEqual(validateRoleCounts(counts,n),counts);}
 assert.throws(()=>doubleSpyCounts(3));
});
for(const mode of ['2v2','3v3'])test(`${mode} starts with balanced public teams and simultaneous general selection`,async()=>{
 const g=setup(mode);const started=g.start();await new Promise(r=>setImmediate(r));
 assert.equal(g.prompts.size,g.players.length);assert.ok([...g.prompts.values()].every(q=>q.zone==='general'));
 assert.equal(g.players.filter(p=>p.role==='red').length,g.players.length/2);
 assert.ok(g.players.every((p,i)=>i===0||p.role!==g.players[i-1].role));
 const view=g.view('spectator');assert.ok(view.players.every(p=>['red','blue'].includes(p.role)));assert.ok(view.players.every(p=>p.hand===undefined));
 const selections=[...g.prompts.entries()];g.takeTurn=async p=>{assert.ok(p);for(const x of g.players){assert.equal(x.maxHp,x.general.hp);assert.equal(x.hand.length,4);}g.stopped=true;};
 for(const [id,q]of selections)g.answer(id,q.id,[q.options[0].id]);await started;
 assert.ok(g.players.every(p=>p.general));
});
test('team victory requires eliminating every opponent and includes eliminated teammates',()=>{
 const g=setup('2v2');g.players.forEach((p,i)=>{p.role=i%2?'blue':'red';p.general=GENERALS[0];});g.players[1].alive=false;g.checkWin();assert.equal(g.winner,null);
 g.players[0].alive=false;g.checkWin();assert.equal(g.winner,null);g.players[3].alive=false;
 assert.throws(()=>g.checkWin(),Finished);assert.equal(g.winner,'red');assert.deepEqual(matchReview(g).players.filter(p=>p.won).map(p=>p.id),['0','2']);
});
test('bots and model observations know teammates without seeing their hands',()=>{
 const g=setup('2v2');g.players.forEach((p,i)=>{p.role=i%2?'blue':'red';p.general=GENERALS[0];});g.current=g.players[0];
 const [me,enemy,ally]=g.players;me.hand=[{id:'peach',kind:'tao',suit:'♥',rank:3}];enemy.hand=[{id:'secret',kind:'shan',suit:'♠',rank:2}];
 const view=g.view(me.id);const q={zone:'options',title:'Rescue',min:1,max:1,context:{kind:'rescue',targetId:ally.id},options:[{id:'peach',cardIds:['peach'],label:'Peach'},{id:'pass',label:'Pass'}]};
 assert.deepEqual(botDecision(view,me.id,q).ids,['peach']);q.context.targetId=enemy.id;assert.deepEqual(botDecision(view,me.id,q).ids,['pass']);
 const beliefs=new BotKnowledge(me.id).beliefs(view);assert.equal(beliefs.find(p=>p.playerId===ally.id).knownRole,'red');
 const obs=botObservation(view,me.id,q);assert.equal(obs.gameRules.teamsArePublic,true);assert.equal(obs.players.find(p=>p.id===enemy.id).role,'blue');assert.ok(!JSON.stringify(obs).includes('secret'));
 assert.equal(obs.decisionBriefing.relations.find(p=>p.playerId===ally.id).alliedProbability,1);
});
test('team modes reject invalid seat counts and unknown modes',()=>{
 assert.throws(()=>validateModeSeats('3v3',4));assert.throws(()=>validateModeSeats('2v2',6));assert.throws(()=>new Game([],{mode:'fake'}));
});
