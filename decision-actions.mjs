// Explicit wire actions mapped deterministically to the engine's internal selections.
// No plan, memory, prose or guessed target participates in decoding.
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
export function decisionContract(q){
 const selection=q.zone==='cards'?(/discard/i.test(q.title||'')?'discard_cards':'select_cards'):q.zone==='stargazing'?'arrange_cards':q.zone==='skill-plan'?'use_skill':q.zone==='response'?'respond':'choose_options';
 return {version:1,instruction:'Submit one explicit action. Fields not listed for that action must be omitted. memory/plan are optional metadata only. Card and player IDs are exact strings. Selected discard cards are LOST, not kept.',selectionAction:selection,min:q.min,max:q.max,context:q.context||null,
 options:q.options.map(o=>{
  const item={option_id:o.id,label:o.label,card_ids:o.cardIds||[],...(o.card?{card:o.card}:{})};
  if(q.zone==='turn')Object.assign(item,{action:o.id==='end'?'end_phase':o.actionSpec?'use_skill':'play_card',target_ids:o.targetIds||[],target_min:o.targetMin||0,target_max:o.targetMax||0,...(o.secondaryTargets?{second_targets_by_first:o.secondaryTargets}:{}),...(o.actionSpec?{skill:o.actionSpec}:{}),response_fields:o.id==='end'?['action']:o.actionSpec?['action','option_id','card_ids','target_ids','mode_id (only if skill offers modes)']:['action','option_id','target_ids']});
  else item.response_fields=q.zone==='skill-plan'?['action','card_ids','target_ids','mode_id (only if context offers modes)']:q.zone==='cards'?['action','card_ids']:['action','option_ids'];
  return item;
 })};
}
export function decodeAction(q,wire){
 if(!wire||typeof wire!=='object'||Array.isArray(wire))throw Error('Expected an action object');
 // Compatibility for previously recorded benchmark output and third-party adapters.
 if(!own(wire,'action'))return wire;
 const contract=decisionContract(q),metadata={...(typeof wire.memory==='string'?{memory:wire.memory}:{}),...(wire.plan?{plan:wire.plan}:{}),...(wire.chatIntent?{chatIntent:wire.chatIntent}:{})};
 let allowed=['action','memory','plan','chatIntent'],d;
 const array=(name)=>{if(!Array.isArray(wire[name])||wire[name].some(x=>typeof x!=='string'))throw Error('Required '+name+' must be an array of exact IDs');return wire[name];};
 if(q.zone==='turn'){
  if(wire.action==='end_phase'){d={ids:['end'],targets:[]};}
  else{
   const o=q.options.find(o=>o.id===wire.option_id);if(!o)throw Error('option_id must be a current offered option');
   const expected=o.actionSpec?'use_skill':'play_card';if(wire.action!==expected)throw Error('This option requires action '+expected);
   allowed.push('option_id','target_ids');const targets=array('target_ids');
   if(targets.length<(o.targetMin||0)||targets.length>(o.targetMax||0))throw Error('target_ids requires '+(o.targetMin||0)+'..'+(o.targetMax||0)+' ordered players');
   d={ids:[o.id],targets};
   if(o.actionSpec){allowed.push('card_ids','mode_id');d.costs=array('card_ids');if(own(wire,'mode_id')){if(typeof wire.mode_id!=='string')throw Error('Omit mode_id when no mode is offered; otherwise use an offered mode ID');d.mode=wire.mode_id;}
    const spec=o.actionSpec,mode=d.mode;
    if(mode&&!spec.modeIds?.includes(mode))throw Error('No such mode is offered; omit mode_id when no modes are listed');
    if(spec.modeIds?.length&&!mode)throw Error('mode_id is required; choose one of '+spec.modeIds.join(', '));
    const min=spec.cardMinByMode?.[mode]??spec.cardMin,max=spec.cardMaxByMode?.[mode]??spec.cardMax;
    if(d.costs.length<min||d.costs.length>max)throw Error('card_ids requires '+min+'..'+max+' cost cards');
    if(d.costs.some(id=>!spec.cardIds.includes(id)))throw Error('card_ids contains a card not offered as a skill cost');
   }
  }
 }else if(q.zone==='skill-plan'){
  if(wire.action!=='use_skill')throw Error('This prompt requires use_skill');
  allowed.push('card_ids','target_ids','mode_id');const cards=array('card_ids'),targets=array('target_ids');
  if(own(wire,'mode_id')&&typeof wire.mode_id!=='string')throw Error('mode_id must be an offered string, or omitted');
  d={ids:[...cards,...targets,...(wire.mode_id?[wire.mode_id]:[])],targets:[]};
 }else{
  if(wire.action!==contract.selectionAction)throw Error('This prompt requires action '+contract.selectionAction);
  const field=q.zone==='cards'?'card_ids':'option_ids';allowed.push(field);d={ids:array(field),targets:[]};
 }
 const extra=Object.keys(wire).filter(k=>!allowed.includes(k));if(extra.length)throw Error('Unexpected action fields: '+extra.join(', '));
 return {...d,...metadata};
}
export const ACTION_INSTRUCTIONS=`Submit one explicit JSON action using actionContract. For a card: {"action":"play_card","option_id":"offered option","target_ids":[]}. For a skill: {"action":"use_skill","option_id":"offered skill","card_ids":["cost card"],"target_ids":["recipient"]}. mode_id is omitted unless an actual mode is offered; never null and never a skill kind. End: {"action":"end_phase"}. For discard: {"action":"discard_cards","card_ids":["card to LOSE"]}. Other card selection: {"action":"select_cards","card_ids":["chosen card"]}. For responses: {"action":"respond","option_ids":["offered response"]}. Other options: {"action":"choose_options","option_ids":["offered ID"]}. For reactive skill-plan: {"action":"use_skill","card_ids":["cost card"],"target_ids":["ordered target"]}, without option_id. For arrange_cards use option_ids in desired order, including bottom marker. Obey the supplied counts and restrictions. Required arrays must be present even when empty. Current action fields alone authorize a move; optional memory and plan cannot fill them. Do not submit ids/targets/costs legacy fields. Never invent IDs. If validationFeedback is provided, nothing executed: correct the action or select a different legal action. Do not output reasoning.`;
