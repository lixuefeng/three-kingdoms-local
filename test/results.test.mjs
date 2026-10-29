import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createResults,roleWon,matchReview} from '../results.mjs';
import {Game,Finished} from '../engine.mjs';
import {GENERALS} from '../cards.mjs';
const fixture=()=>({matchId:'match-1',winner:'lord',turn:12,players:['lord','loyal','rebel','spy'].map((role,i)=>({id:'p'+i,profileId:'u'+i,name:'Player '+i,role,alive:i===0,general:{id:'zhangfei',name:'Zhang Fei'}})),stats:{p0:{kills:2,damage:7,damageTaken:2}},eliminations:[{killerId:'p0',victimId:'p2',turn:5}]});
test('wins include eliminated teammates but not opponents; review includes all roles and eliminations',()=>{
 const r=matchReview(fixture());assert.deepEqual(r.players.map(p=>p.won),[true,true,false,false]);assert.equal(r.players[0].kills,2);assert.equal(r.eliminations[0].victimId,'p2');assert.equal(roleWon('spy','spy'),true);assert.equal(roleWon('loyal','rebel'),false);
});
test('profiles require PIN, store only salted hashes, persist results and deduplicate match IDs',t=>{
 const directory=mkdtempSync(join(tmpdir(),'sgs-results-'));t.after(()=>rmSync(directory,{recursive:true,force:true}));let store=createResults(directory);
 const profiles=Array.from({length:4},(_,i)=>store.claim({newProfileName:'Friend '+i,pin:'8675309'}));assert.throws(()=>store.claim({profileId:profiles[0].id,pin:'1111'}),/Incorrect/);assert.equal(store.claim({profileId:profiles[0].id,pin:'8675309'}).name,'Friend 0');assert.throws(()=>store.claim({newProfileName:'friend 0',pin:'1234'}),/exists/);
 const game=fixture();game.players.forEach((p,i)=>p.profileId=profiles[i].id);assert.equal(store.record(game).ranked,true);store.record(game);store=createResults(directory);const rows=store.leaderboard();assert.equal(rows[0].wins,1);assert.equal(rows[0].matches,1);assert.equal(rows[0].roles.lord.damage,7);assert.equal(rows.find(r=>r.name==='Friend 1').wins,1);assert.ok(!JSON.stringify(store.profiles()).includes('pinHash'));assert.ok(!readFileSync(join(directory,'results.json'),'utf8').includes('8675309'));
});
test('four-seat matches count registered humans even with bots and guests; testing and short games do not',()=>{
 const store=createResults(null),profile=store.claim({newProfileName:'Friend',pin:'1234'}),g=fixture();
 g.players.forEach((p,i)=>{p.profileId=i===0?profile.id:null;p.bot=i>0;});
 assert.equal(store.record(g,{bots:true}).ranked,true);assert.equal(store.leaderboard()[0].wins,1);assert.equal(store.leaderboard()[0].roles.lord.matches,1);
 g.matchId='guest';g.players[1].bot=false;assert.equal(store.record(g).ranked,true);assert.equal(store.leaderboard()[0].matches,2);
 g.matchId='testing';assert.equal(store.record(g,{testing:true}).ranked,false);
 g.matchId='short';g.players=g.players.slice(0,3);assert.equal(store.record(g).ranked,false);
 g.matchId='aborted';g.winner=null;assert.equal(store.record(g).ranked,false);assert.equal(store.leaderboard()[0].matches,2);
});
test('guests never create anonymous leaderboard profiles and duplicate profiles cannot double-count',()=>{
 const store=createResults(null),g=fixture();g.players.forEach(p=>p.profileId=null);assert.equal(store.record(g).ranked,false);assert.deepEqual(store.leaderboard(),[]);
 g.matchId='duplicate';g.players[0].profileId=g.players[1].profileId='same';assert.equal(store.record(g).ranked,false);
});
test('wrong PIN attempts are throttled for a profile',()=>{const store=createResults(null),p=store.claim({newProfileName:'A',pin:'1234'});for(let i=0;i<5;i++)assert.throws(()=>store.claim({profileId:p.id,pin:'9999'}),/Incorrect/);assert.throws(()=>store.claim({profileId:p.id,pin:'1234'}),/Too many/);});
test('winning elimination and final damage are counted before victory stops resolution',async()=>{
 const g=new Game([{id:'a'},{id:'b'},{id:'c'},{id:'d'}],{ask:(p,q,f)=>f});g.players.forEach((p,i)=>{p.general=GENERALS.find(x=>x.id==='zhangfei');p.name='P'+i;p.role=['lord','loyal','rebel','spy'][i];p.hp=p.maxHp=4;});g.current=g.players[0];g.players[2].alive=false;g.players[3].hp=1;
 await assert.rejects(g.damage(g.players[0],g.players[3],1),Finished);assert.equal(g.winner,'lord');assert.deepEqual(g.stats.a,{kills:1,damage:1,damageTaken:0});assert.equal(g.eliminations[0].victimId,'d');assert.equal(g.stats.d.damageTaken,1);
});
test('only the surviving Spy wins in a multiple-Spy match',()=>{
 const g=fixture();g.winner='spy';g.players[2].role='spy';g.players.forEach(p=>p.alive=p.id==='p3');
 const review=matchReview(g);assert.deepEqual(review.players.filter(p=>p.won).map(p=>p.id),['p3']);
});
