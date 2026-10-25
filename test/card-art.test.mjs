import test from 'node:test';
import assert from 'node:assert/strict';
import {makeDeck,info,META} from '../cards.mjs';
import {cardArt,cardImagePath} from '../public/card-art.mjs';
test('all card kinds use original inline emblems without third-party image requests',()=>{
 for(const kind of new Set(makeDeck({maneuver:true}).map(c=>c.kind))){assert.equal(cardImagePath({kind}),null);const html=cardArt(info({id:'art',kind,suit:'♥',rank:7}));assert.match(html,/<svg/);assert.ok(!html.includes('<img'));assert.ok(!html.includes('http'));}
 assert.equal(cardImagePath({kind:'../../server.mjs'}),null);
});
test('original vector faces preserve physical card data and established names',()=>{
 const c=info({id:'physical',kind:'indulgence',suit:'♣',rank:6});assert.match(cardArt(c),/<svg/);assert.equal(c.name,'Acedia');assert.equal(c.suit,'♣');assert.equal(c.rank,6);assert.equal(META.feast[0],'Brotherhood');
});
