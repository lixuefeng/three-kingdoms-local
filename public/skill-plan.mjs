export function skillPlanParts(context,ids){const out={cards:ids.filter(id=>context.cardIds.includes(id)),targets:ids.filter(id=>context.targetIds.includes(id))};if(context.modeIds?.length)out.modes=ids.filter(id=>context.modeIds.includes(id));return out;}
export function validSkillPlan(context,ids,{allowEmpty=true}={}){
 if(!context||!Array.isArray(ids)||new Set(ids).size!==ids.length)return false;if(!ids.length)return allowEmpty;
 const {cards,targets,modes=[]}=skillPlanParts(context,ids),mode=modes[0];
 if(cards.length+targets.length+modes.length!==ids.length||targets.length!==context.targetCount||modes.length!==(context.modeIds?.length?1:0))return false;
 const min=context.cardMinByMode?.[mode]??context.cardMin,max=context.cardMaxByMode?.[mode]??context.cardMax;
 if(cards.length<min||cards.length>max||context.firstTargetIds&&!context.firstTargetIds.includes(targets[0]))return false;
 if(context.targetIdsByCard&&cards.some(id=>targets.some(t=>!context.targetIdsByCard[id]?.includes(t))))return false;
 if(context.targetIdsByMode?.[mode]&&targets.some(t=>!context.targetIdsByMode[mode].includes(t)))return false;
 return true;
}
export function actionSelectionIds(selection={}){return [...(selection.costIds||[]),...(selection.targetIds||[]),...(selection.mode?[selection.mode]:[])];}
export function optionalDecisionLabel(prompt,targeting=false){
 if(prompt?.min!==0||prompt.zone==='stargazing')return null;
 if(prompt.zone==='skill-plan')return prompt.context?.kind==='legacy-distribute'?'Keep remaining cards':prompt.context?.kind==='lust-plan'?'Cancel Lust':'Cancel '+(prompt.context?.skillName||'skill');
 if(prompt.context?.kind==='raid')return 'Draw normally';
 if(prompt.context?.kind==='optional-cost')return 'Cancel';
 return targeting?'Cancel':'Skip';
}
