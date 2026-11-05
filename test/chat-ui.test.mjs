import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('chat bubble styles are in a linked stylesheet allowed by the production CSP',async()=>{
 const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
 const [chat,html,server]=await Promise.all([read('public/chat.mjs'),read('public/index.html'),read('server.mjs')]);
 assert.match(server,/style-src 'self'/);
 assert.doesNotMatch(chat,/createElement\(['"]style['"]\)/,'inline style elements are blocked by the server CSP');
 const links=[...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map(m=>m[1]);
 const sheets=await Promise.all(links.map(path=>read('public'+path)));
 const css=sheets.join('\n');
 assert.match(css,/\.table-speech\s*\{[^}]*position:fixed/);
 assert.match(css,/\.table-speech\s*\{[^}]*z-index:\s*85/);
 assert.match(css,/\.table-speech\.anchored:after\s*\{/);
});
