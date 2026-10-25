import test from 'node:test';
import assert from 'node:assert/strict';
import {roleNote} from '../public/role-notes.mjs';
import {Game} from '../engine.mjs';
test('role notes start unknown, accept only guesses, and revealed identities always win',()=>{
 const hidden={id:'p',role:null};assert.deepEqual(roleNote(hidden),{role:null,guessed:true});
 for(const role of ['loyal','rebel','spy'])assert.deepEqual(roleNote(hidden,{p:role}),{role,guessed:true});
 assert.deepEqual(roleNote(hidden,{p:'lord'}),{role:null,guessed:true});
 for(const role of ['lord','loyal','rebel','spy'])assert.deepEqual(roleNote({id:'p',role},{p:'rebel'}),{role,guessed:false});
});
test('each match has a distinct public ID so private guesses do not carry into a new match',()=>{
 const a=new Game([{id:'p'}]),b=new Game([{id:'p'}]);assert.ok(a.view('p').matchId);assert.notEqual(a.view('p').matchId,b.view('p').matchId);
});
