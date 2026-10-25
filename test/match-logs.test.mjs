import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,statSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createMatchLogs} from '../match-logs.mjs';
import {Game} from '../engine.mjs';
import {GENERALS} from '../cards.mjs';

test('private append-only match archives retain all events, redact keys and survive restart',t=>{
 const dir=mkdtempSync(join(tmpdir(),'sgs-archive-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
 const room={code:'ABC',host:'host'},g={matchId:'test-match',players:[],turn:1,phase:'Play'},logs=createMatchLogs(dir,{secrets:['private-token']});logs.begin(g,room,'test');
 for(let i=0;i<2105;i++)logs.append(g.matchId,'game-event',{event:{text:'Action '+i}});
 logs.append(g.matchId,'ai-trace',{trace:{request:'private-token',response:'action',status:'invalid-choice',usage:{prompt_tokens:100}}});logs.finish(g,'finished');
 const path=join(dir,'match-logs','test-match.jsonl'),text=readFileSync(path,'utf8'),lines=text.trim().split('\n').map(JSON.parse);
 assert.equal(lines.filter(l=>l.type==='game-event').length,2105);assert.ok(!text.includes('private-token'));assert.ok(text.includes('[REDACTED]'));assert.equal(statSync(path).mode&0o777,0o600);
 const restored=createMatchLogs(dir);assert.equal(restored.list(room)[0].id,g.matchId);assert.deepEqual(restored.list({...room,host:'intruder'}),[]);assert.throws(()=>restored.download('../test-match',room,{}));assert.throws(()=>restored.download(g.matchId,{...room,host:'intruder'},{}));
});
test('game archive hook receives early events even after chronicle window truncation',()=>{
 const events=[],g=new Game([{id:'a'},{id:'b'},{id:'c'},{id:'d'}],{onEvent:e=>events.push(e)});g.players.forEach(p=>p.general=GENERALS[0]);
 for(let i=0;i<2005;i++)g.log('event '+i);assert.equal(g.logs.length,2000);assert.equal(events.length,2005);assert.equal(events[0].text,'event 0');assert.ok(events[0].id);
});

test('archive sink receives every AI trace even beyond the live inspector limit',async()=>{
 const {createModelRouter,llmConfig}=await import('../llm-provider.mjs'),seen=[];
 const provider=createModelRouter({...llmConfig({LLM_BASE_URL:'http://localhost/v1',LLM_MODEL:'test'}),debug:true},{fetchImpl:async()=>new Response(JSON.stringify({choices:[{message:{content:'{"ids":["end"],"targets":[]}'}}],usage:{prompt_tokens:10,completion_tokens:5}})),onTrace:t=>seen.push(t)});
 const input={matchId:'archive-test',playerId:'bot',view:{players:[]},prompt:{id:'q',zone:'turn',min:1,max:1,options:[{id:'end'}]}};
 for(let i=0;i<25;i++)assert.ok(await provider.decide(input));
 assert.equal(seen.length,25);assert.equal(provider.traces('archive-test').length,20);assert.deepEqual(seen[0].acceptedAction,{ids:['end'],targets:[]});assert.ok(seen[0].request.includes('mandatory'));
});
