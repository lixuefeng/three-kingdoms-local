import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {META,makeDeck,info} from '../cards.mjs';
import {cardArt,cardImagePath} from '../public/card-art.mjs';
test('all available reference mappings point to downloaded JPEGs; unmatched Guding uses original fallback',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../CARD-IMAGE-SOURCES.json',import.meta.url)));
 for(const kind of new Set(makeDeck({maneuver:true}).map(c=>c.kind))){const path=cardImagePath({kind});if(kind==='guding'){assert.equal(path,null);assert.match(cardArt({kind}),/<svg/);continue;}assert.equal(path,'/card-faces/'+kind+'.jpg');const bytes=readFileSync(new URL('../public'+path,import.meta.url));assert.equal(bytes[0],255);assert.equal(bytes[1],216);assert.ok(manifest[kind].source.startsWith('https://'));}
 assert.equal(cardImagePath({kind:'../../server.mjs'}),null);
});
test('reference art does not replace physical suit/rank or agreed English names',()=>{
 const c=info({id:'physical',kind:'indulgence',suit:'♣',rank:6});const html=cardArt(c);assert.match(html,/src="\/card-faces\/indulgence.jpg"/);assert.ok(!html.includes('Overindulgence'));assert.equal(c.name,'Acedia');assert.equal(c.suit,'♣');assert.equal(c.rank,6);assert.equal(META.feast[0],'Brotherhood');
});
