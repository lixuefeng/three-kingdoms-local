import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../engine.mjs';
import {ALL_GENERALS} from '../cards.mjs';
import {validSkillPlan} from '../public/skill-plan.mjs';
import {validBotDecision,createLLMProvider,llmConfig} from '../llm-provider.mjs';
import {BotKnowledge} from '../bot-knowledge.mjs';
let n=0;const c=(kind='sha',rank=7)=>({id:'atomic-'+n++,kind,suit:'♥',rank});
test('optional combined cancellation spends no cards, HP or skill allowance',async()=>{
 for(const general of ['liubei','diaochan','dianwei']){
  const g=setup(general,{ask:()=>[]}),p=g.players[0],card=c();p.hand=[card];const hp=p.hp;
  await g.play(p,'skill:'+({liubei:'rende',diaochan:'lijian',dianwei:'qiangxi'}[general]));
  assert.deepEqual(p.hand,[card]);assert.equal(p.hp,hp);assert.deepEqual(g.used,{sha:0});
 }
});
test('provider and persistent knowledge retain skill recipients and archive selected costs',async()=>{
 const events=[],g=setup('liubei',{onEvent:e=>events.push(e)}),p=g.players[0];p.bot=true;p.botMode='llm';g.botKnowledge.set(p.id,new BotKnowledge(p.id));p.hand=[c('shan')];g.changed();
 g.llmProvider=createLLMProvider(llmConfig({LLM_BASE_URL:'http://localhost/v1',LLM_MODEL:'mock'}),{fetchImpl:async()=>new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({ids:['skill:rende'],costs:[p.hand[0].id],targets:['b'],plan:{objective:'Support ally',steps:[{kind:'rende',targetIds:['b']}]}})}}]}))});
 const q={id:'gift-plan',zone:'turn',min:1,max:1,options:g.playOptions(p)};g.decisions.set(p.id,{});await g.decideBot(p,q,['end']);
 const plan=g.botKnowledge.get(p.id).plan;assert.deepEqual(plan.steps,[{kind:'skill:rende',targetIds:['b']}]);
 const event=events.find(e=>e.type==='bot-decision');assert.deepEqual(event.costs,[p.hand[0].id]);assert.deepEqual(event.targets,['b']);
});
function setup(general='liubei',options={}){const g=new Game(['a','b','c','d'].map(id=>({id,name:id})),{botPacing:false,pause:async()=>{},...options});g.players.forEach((p,i)=>{p.general=ALL_GENERALS.find(x=>x.id===(i===0?general:'zhangfei'));p.role=['lord','loyal','rebel','spy'][i];p.hp=p.maxHp=4;});g.current=g.players[0];g.phase='Play';g.used={sha:0};return g;}

test('Benevolence is one complete LLM decision with authoritative progress, cards and recipient',async()=>{
 let calls=0;const g=setup(),[p,t]=g.players;p.bot=true;p.botMode='llm';p.hp=2;p.hand=[c('shan')];g.used.rendeCount=1;
 const provider=createLLMProvider(llmConfig({LLM_BASE_URL:'http://localhost/v1',LLM_MODEL:'mock'}),{fetchImpl:async(u,req)=>{calls++;const input=JSON.parse(JSON.parse(req.body).messages[1].content),o=input.prompt.options.find(o=>o.id==='skill:rende');assert.equal(o.actionSpec.facts.drawsCards,false);assert.equal(o.actionSpec.facts.givenThisPhase,1);return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({ids:[o.id],targets:[t.id],costs:[p.hand[0].id]})}}]}));}});
 g.llmProvider=provider;const q={id:'one',zone:'turn',min:1,max:1,options:g.playOptions(p)};g.decisions.set(p.id,{});const ids=await g.decideBot(p,q,['end']);g.askAdapter=()=>{throw Error('Unexpected follow-up owner prompt');};await g.play(p,ids[0]);assert.equal(calls,1);assert.equal(t.hand.length,1);assert.equal(p.hand.length,0);assert.equal(p.hp,3);assert.equal(g.used.rendeHealed,true);
});
test('human incomplete costs are rejected before resolving the turn prompt or changing cards',async()=>{
 const g=setup(),p=g.players[0];p.hand=[c()];const pending=g.ask(p,'Play',g.playOptions(p),{zone:'turn',fallback:['end'],timeout:0}),q=g.prompts.get(p.id),card=p.hand[0];
 assert.throws(()=>g.answerPlay(p.id,q.id,'skill:rende',['b'],[]),/required/);assert.ok(g.prompts.has(p.id));assert.equal(p.hand[0],card);assert.equal(g.players[1].hand.length,0);
 g.answerPlay(p.id,q.id,'skill:rende',['b'],[card.id]);assert.deepEqual(await pending,['skill:rende']);g.askAdapter=()=>{throw Error('No follow-up selection expected');};await g.play(p,'skill:rende');assert.equal(g.players[1].hand[0],card);
});
test('all nine parameterized proactive skills publish combined schemas',()=>{
 for(const [general,kind] of [['liubei','rende'],['sunshangxiang','jieyin'],['huatuo','qingnang'],['dianwei','qiangxi'],['taishici','tianyi'],['sunquan','zhiheng'],['diaochan','lijian'],['zhouyu','fanjian'],['pangde','huangtian']]){
  const g=setup(general),p=g.players[0];p.hand=[c(),c('shan')];p.hp=2;g.players[1].hp=2;g.players[1].hand=[c()];if(kind==='huangtian'){p.role='rebel';g.players[1].role='lord';g.players[1].general=ALL_GENERALS.find(x=>x.id==='zhangjiao');}
  const option=g.playOptions(p).find(o=>o.id==='skill:'+kind);assert.ok(option?.actionSpec,kind);assert.equal(option.targetMin,option.actionSpec.targetCount);assert.equal(option.actionSpec.actionKind,kind);
 }
});
test('Forceful Assault validates cost-dependent range and rejects partial or mixed HP/weapon costs',()=>{
 const g=setup('dianwei'),p=g.players[0],weapon=c('kylin');p.equip.weapon=weapon;const o=g.playOptions(p).find(o=>o.id==='skill:qiangxi'),q={zone:'turn',min:1,max:1,options:[o]};
 assert.ok(validBotDecision(q,{ids:[o.id],targets:['b'],costs:[weapon.id],mode:'mode:weapon'}));
 assert.equal(validBotDecision(q,{ids:[o.id],targets:['c'],costs:[weapon.id],mode:'mode:weapon'}),false);
 assert.ok(validBotDecision(q,{ids:[o.id],targets:['c'],costs:[],mode:'mode:hp'}));
 assert.equal(validBotDecision(q,{ids:[o.id],targets:['b'],costs:[weapon.id],mode:'mode:hp'}),false);
 assert.equal(validBotDecision(q,{ids:[o.id],targets:['b'],costs:[],mode:'mode:weapon'}),false);
 assert.equal(validBotDecision(q,{ids:[o.id],targets:['b'],costs:8,mode:'mode:hp'}),false);
});
test('Pindian commits initiator card with target and asks only the opponent afterwards',async()=>{
 const requests=[],g=setup('taishici',{ask:(p,q,f)=>{requests.push([p.id,q]);return q.context?.kind==='pindian'?[q.options[0].id]:f;}}),[p,t]=g.players;p.hand=[c('sha',13)];t.hand=[c('shan',1)];
 await g.play(p,'skill:tianyi');assert.equal(requests.length,1,'cancelled combined selection is just one prompt');
 requests.length=0;g.plannedPlays.set(p.id,{optionId:'skill:tianyi',targetIds:[t.id],costIds:[p.hand[0].id]});await g.play(p,'skill:tianyi');assert.equal(requests.length,1);assert.equal(requests[0][0],t.id);assert.equal(g.used.tianyiWin,true);assert.equal(p.hand.length,0);
});
test('Zhou Tai removes multiple wounds with one exact-count selection',async()=>{
 let count=0;const g=setup('zhoutai',{ask:(p,q,f)=>{if(q.context?.kind==='wound-remove'){count++;assert.equal(q.min,2);assert.equal(q.max,2);return q.options.slice(0,2).map(o=>o.id);}return f;}}),p=g.players[0];p.hp=-2;p.wounds=[c('sha',1),c('shan',2),c('tao',3)];await g.recover(p,2);assert.equal(count,1);assert.equal(p.hp,0);assert.equal(p.wounds.length,1);
});
test('Assault requires only player selection, never indistinguishable hidden-card picks',async()=>{
 let calls=0;const g=setup('zhangliao',{ask:(p,q)=>{calls++;assert.equal(q.context.kind,'raid');return ['b','c'];}}),p=g.players[0];g.players[1].hand=[c()];g.players[2].hand=[c('shan')];await g.drawGeneral(p);assert.equal(calls,1);assert.equal(p.hand.length,2);
});
test('combined reactive modes, counts and redirect targets are validated together',()=>{
 const s={cardIds:['x','y'],cardMin:0,cardMax:2,targetIds:[],targetCount:0,modeIds:['hp','discard'],cardMinByMode:{hp:0,discard:2},cardMaxByMode:{hp:0,discard:2}};
 assert.ok(validSkillPlan(s,['hp'],{allowEmpty:false}));assert.ok(validSkillPlan(s,['x','y','discard']));assert.equal(validSkillPlan(s,['x','discard']),false);assert.equal(validSkillPlan(s,['x','hp']),false);
 const redirect={cardIds:['weapon','hand'],cardMin:1,cardMax:1,targetIds:['near','far'],targetCount:1,targetIdsByCard:{weapon:['near'],hand:['near','far']}};assert.equal(validSkillPlan(redirect,['weapon','far']),false);assert.ok(validSkillPlan(redirect,['hand','far']));
});
