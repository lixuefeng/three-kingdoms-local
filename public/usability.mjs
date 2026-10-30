export function actionPreview(option,targetIds,players){
 if(!option)return '';
 if(option.kind==='borrow'){const name=id=>{const p=players.find(p=>p.id===id);return p?.general?.name||p?.name||'Player';};return targetIds.length===2?`Borrowed Sword · ${name(targetIds[0])} must Attack ${name(targetIds[1])}, or surrender their weapon.`:targetIds.length===1?`Borrowed Sword · ${name(targetIds[0])} holds the weapon. Choose who they must Attack.`:'Borrowed Sword · Choose the weapon holder first, then their Attack victim.';}
 const names=targetIds.map(id=>players.find(p=>p.id===id)?.name||'Player');
 const destination=['barbarian','arrows'].includes(option.kind)?'Every other living player':['harvest','feast'].includes(option.kind)?'All living players':['tao','wine','draw2'].includes(option.kind)?'Use on yourself':['crossbow','doubleSword','qinggang','greenDragon','serpent','axe','halberd','kylin','bagua','renwang','plusHorse','minusHorse','rattan','silverLion','fan','guding'].includes(option.kind)?'Equip on yourself':option.kind==='lightning'?'Your Judgment zone':'Resolve';
 return option.label+(names.length?' → '+names.join(' → '):option.targetMax?' → Choose target'+(option.targetMax>1?'s':''):' → '+destination);
}
const gear={crossbow:['⇶','Crossbow'],qinggang:['⚔','Blue Steel'],serpent:['♆','Serpent'],kylin:['➶','Kirin'],axe:['⚒','Axe'],greenDragon:['⚔','Dragon'],halberd:['♆','Halberd'],doubleSword:['⚔','Swords'],bagua:['☯','Trigrams'],renwang:['◈','Nio'],rattan:['♧','Rattan'],silverLion:['♌','Lion'],fan:['✺','Fan'],guding:['⚔','Guding']};
export function gearLabel(card,slot){const entry=gear[card.kind];return {icon:entry?.[0]||(slot==='plus'?'+1':slot==='minus'?'−1':slot==='weapon'?'⚔':'◈'),name:slot==='plus'?'+1 Horse':slot==='minus'?'−1 Horse':entry?.[1]||card.name,range:slot==='weapon'&&card.range?card.range:null};}
export function recapTitle(group,players){
 const name=id=>(players.find(p=>p.id===id)?.general?.name||players.find(p=>p.id===id)?.name)||'Table';
 if(group.borrowedSword){const b=group.borrowedSword;return `${name(b.sourceId)} · Borrowed Sword · ${name(b.attackerId)} → Attack ${name(b.targetId)}`;}
 const events=group.effects||[],first=events.find(e=>['attack','spell','skill','heal'].includes(e.kind));
 const outcome=events.filter(e=>['damage','dodge','trigger'].includes(e.kind)).slice(-2).map(e=>name(e.targetId)+' '+e.label);
 return (first?name(first.sourceId)+' · '+first.label+(first.targetId&&first.targetId!==first.sourceId?' → '+name(first.targetId):''):name(group.playerId)+' · '+group.label)+(outcome.length?' · '+outcome.join(' · '):'');
}
