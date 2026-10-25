import test from 'node:test';
import assert from 'node:assert/strict';
import {readApiResponse} from '../public/network.mjs';
test('valid success and game errors survive response decoding',async()=>{
 assert.deepEqual(await readApiResponse(new Response('{"ok":true}')),{ok:true});
 await assert.rejects(readApiResponse(new Response('{"error":"That decision has expired."}',{status:400})),/That decision has expired/);
});
test('proxy pages, empty bodies and interrupted responses never surface JSON parse errors',async()=>{
 await assert.rejects(readApiResponse(new Response('<html>Bad Gateway</html>',{status:502})),/non-JSON response \(HTTP 502\)/);
 await assert.rejects(readApiResponse(new Response('',{status:200})),/empty response/);
 await assert.rejects(readApiResponse({status:200,text:async()=>{throw new Error('closed');}}),/connection was interrupted/);
 await assert.rejects(readApiResponse(new Response('null')),/unexpected response/);
});
