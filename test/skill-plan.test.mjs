import test from 'node:test';
import assert from 'node:assert/strict';
import {validSkillPlan,skillPlanParts,optionalDecisionLabel} from '../public/skill-plan.mjs';
import {Game} from '../engine.mjs';
const ctx={kind:'lust-plan',cardIds:['card'],targetIds:['a','b','empty-fortress'],firstTargetIds:['a','b'],cardMin:1,cardMax:1,targetCount:2};
test('combined skill selection validates cost and ordered targets, including first-responder restrictions',()=>{
 assert.equal(validSkillPlan(ctx,['card','b','a']),true);assert.deepEqual(skillPlanParts(ctx,['card','b','a']),{cards:['card'],targets:['b','a']});
 for(const ids of [['card'],['a','b'],['card','a','a'],['card','empty-fortress','a'],['other','a','b']])assert.equal(validSkillPlan(ctx,ids),false);
 assert.equal(validSkillPlan(ctx,[]),true);assert.equal(validSkillPlan(ctx,[],{allowEmpty:false}),false);
});
test('invalid combined answers leave prompt pending; valid answer submits cards and targets together',async()=>{
 const g=new Game([{id:'actor'},{id:'a'},{id:'b'}],{seconds:0}),p=g.players[0];const run=g.skillPlan(p,'Lust',[{id:'card',kind:'sha',suit:'♠',rank:7}],g.players.slice(1),{kind:'lust-plan',targetCount:2});const q=g.prompts.get(p.id);
 assert.throws(()=>g.answer(p.id,q.id,['card','a']),/required/);assert.equal(g.prompts.get(p.id),q);g.answer(p.id,q.id,['card','b','a']);assert.deepEqual(await run,{cards:['card'],targets:['b','a']});
});

test('Legacy Keep remaining remains available while recipients are targetable or selected',()=>{
 const q={min:0,zone:'skill-plan',context:{kind:'legacy-distribute'}};
 assert.equal(optionalDecisionLabel(q,true),'Keep remaining cards');assert.equal(optionalDecisionLabel(q,false),'Keep remaining cards');assert.equal(validSkillPlan({...ctx,kind:'legacy-distribute',targetCount:1},[]),true);
 assert.equal(optionalDecisionLabel({...q,context:{kind:'lust-plan'}},true),'Cancel Lust');assert.equal(optionalDecisionLabel({min:0,zone:'stargazing'},false),null);assert.equal(optionalDecisionLabel({min:0,zone:'options'},true),'Cancel');
});


test('Assault always exposes normal draw and optional target/cost prompts expose cancellation',()=>{
 const raid={min:0,zone:'options',context:{kind:'raid'}};
 for(const targeting of [true,false])assert.equal(optionalDecisionLabel(raid,targeting),'Draw normally');
 assert.equal(optionalDecisionLabel({min:0,zone:'cards',context:{kind:'optional-cost'}},false),'Cancel');
 assert.equal(optionalDecisionLabel({min:2,zone:'cards'},false),null);
});
test('optional exact costs accept cancellation or the full cost, never partial payment',async()=>{
 const g=new Game([{id:'actor'}],{seconds:0}),p=g.players[0];
 const run=g.ask(p,'Cost',[{id:'a'},{id:'b'}],{min:0,max:2,context:{kind:'optional-cost',cardCount:2}}),q=g.prompts.get(p.id);
 assert.throws(()=>g.answer(p.id,q.id,['a']),/required number/);assert.equal(g.prompts.get(p.id),q);
 g.answer(p.id,q.id,[]);assert.deepEqual(await run,[]);
});
