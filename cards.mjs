import {randomInt} from 'node:crypto';
export const META = {
  "sha": [
    "Attack",
    "basic",
    "Once per Play Phase, target another character in your attack range. They must play Dodge or take 1 damage."
  ],
  "shan": [
    "Dodge",
    "basic",
    "Respond to Attack or Raining Arrows to avoid its damage."
  ],
  "tao": [
    "Peach",
    "basic",
    "During your Play Phase, recover 1 HP. During a rescue, restore 1 HP to the dying character."
  ],
  "duel": [
    "Duel",
    "trick",
    "Starting with the target, alternate playing Attack. The first to stop takes 1 damage from the other character."
  ],
  "dismantle": [
    "Burning Bridges",
    "trick",
    "Discard one card from another character's hand, equipment, or judgment area."
  ],
  "steal": [
    "Steal",
    "trick",
    "Take one card from another character's hand, equipment, or judgment area. Distance limit: 1."
  ],
  "draw2": [
    "Something Out of Nothing",
    "trick",
    "Draw 2 cards."
  ],
  "barbarian": [
    "Barbarian Invasion",
    "trick",
    "Each other character, in turn order, must play Attack or take 1 damage."
  ],
  "arrows": [
    "Raining Arrows",
    "trick",
    "Each other character, in turn order, must play Dodge or take 1 damage."
  ],
  "feast": [
    "Brotherhood",
    "trick",
    "Each living character recovers 1 HP, up to their maximum."
  ],
  "harvest": [
    "Bumper Harvest",
    "trick",
    "Reveal one card per living character. In turn order, each character takes one revealed card."
  ],
  "negate": [
    "Negation",
    "trick",
    "Cancel a Strategy card's effect on one character. Can also counter another Negation."
  ],
  "borrow": [
    "Borrowed Sword",
    "trick",
    "Choose another armed character and a target in their attack range. They must use Attack on that target or give you their weapon."
  ],
  "indulgence": [
    "Acedia",
    "delay",
    "During Judgment Phase, reveal a judgment card. Unless it is a Heart, skip your Play Phase."
  ],
  "lightning": [
    "Lightning",
    "delay",
    "Place in your own judgment area. A judgment of Spades 2–9 deals 3 thunder damage with no source. Otherwise, pass Lightning to the next eligible character."
  ],
  "crossbow": [
    "Zhuge Crossbow",
    "weapon",
    "Range 1. Removes the limit on how many Attacks you may use during your Play Phase.",
    1
  ],
  "doubleSword": [
    "Yin-Yang Swords",
    "weapon",
    "Range 2. When you Attack a character of the opposite sex, you may make them discard a hand card or let you draw 1.",
    2
  ],
  "qinggang": [
    "Blue Steel Sword",
    "weapon",
    "Range 2. Ignore the target's armor while resolving your Attack.",
    2
  ],
  "greenDragon": [
    "Green Dragon Blade",
    "weapon",
    "Range 3. When your Attack is dodged, you may use another Attack on the same target.",
    3
  ],
  "serpent": [
    "Serpent Spear",
    "weapon",
    "Range 3. You may combine 2 hand cards into one Attack, including when responding.",
    3
  ],
  "axe": [
    "Rock Cleaving Axe",
    "weapon",
    "Range 3. When your Attack is dodged, you may discard 2 other cards to make it deal damage anyway.",
    3
  ],
  "halberd": [
    "Sky Piercing Halberd",
    "weapon",
    "Range 4. An Attack that is your last hand card may target up to 3 characters.",
    4
  ],
  "kylin": [
    "Kirin Bow",
    "weapon",
    "Range 5. After your Attack deals damage, you may discard one of the target's mounts.",
    5
  ],
  "bagua": [
    "Eight Trigrams Formation",
    "armor",
    "When you need Dodge, you may judge. A red judgment counts as playing Dodge."
  ],
  "renwang": [
    "Nio Shield",
    "armor",
    "Black Attacks have no effect on you."
  ],
  "plusHorse": [
    "+1 Horse",
    "plus",
    "Other characters add 1 when calculating their distance to you."
  ],
  "minusHorse": [
    "−1 Horse",
    "minus",
    "Subtract 1 when calculating your distance to other characters."
  ]
};
Object.assign(META,{
 fireSha:['Fire Attack','basic','An Attack that deals 1 fire damage. Shares the normal Attack limit.'],
 thunderSha:['Thunder Attack','basic','An Attack that deals 1 thunder damage. Shares the normal Attack limit.'],
 wine:['Wine','basic','Once per turn during Play, your next Attack this turn deals +1 damage. When dying, use Wine to recover 1 HP yourself.'],
 fireAttack:['Flame Tactic','trick','Choose a character with hand cards. They reveal one. You may discard a hand card of the same suit to deal 1 fire damage.'],
 chain:['Iron Chains','trick','Choose 1–2 characters and toggle each chained state. Or recast: discard this card and draw 1, without using its effect.'],
 supply:['Rations Depleted','delay','Choose another character within distance 1. During their Judgment Phase, a non-Club judgment skips their Draw Phase.'],
 rattan:['Rattan Armor','armor','Normal Attack, Barbarian Invasion and Raining Arrows have no effect on you. Fire damage you take is increased by 1.'],
 silverLion:['Silver Lion Helmet','armor','Damage you take is capped at 1 per event. Recover 1 HP when this equipped armor leaves your equipment zone.'],
 fan:['Feathered Fan','weapon','Range 4. You may use an ordinary Attack card as Fire Attack.',4],
 guding:['Guding Blade','weapon','Range 2. Your Attack deals +1 damage to a target with no hand cards.',2],
 frost:['Frost Sword','weapon','Range 2. When your Attack would deal damage, you may prevent that damage and discard up to 2 of the target’s hand or equipment cards instead.',2]
});

// Classic Standard 104 + EX 4. Maneuver adds one card of every suit/rank.
const SUITS=['♠','♥','♣','♦'];
const ROWS=[
 ['duel','doubleSword','steal','dismantle','greenDragon','indulgence','sha','sha','sha','sha','negate','serpent','barbarian'],
 ['lightning','bagua','dismantle','steal','plusHorse','qinggang','barbarian','sha','sha','sha','steal','dismantle','minusHorse'],
 ['duel','sha','sha','sha','sha','sha','sha','sha','sha','sha','sha','borrow','borrow'],
 ['crossbow','bagua','dismantle','dismantle','plusHorse','indulgence','barbarian','sha','sha','sha','sha','negate','negate'],
 ['feast','shan','harvest','harvest','kylin','tao','draw2','draw2','tao','sha','sha','dismantle','plusHorse'],
 ['arrows','shan','tao','tao','minusHorse','indulgence','tao','tao','draw2','sha','draw2','tao','shan'],
 ['duel','shan','shan','shan','shan','shan','shan','sha','sha','sha','shan','tao','sha'],
 ['crossbow','shan','steal','steal','axe','sha','sha','shan','shan','shan','shan','halberd','minusHorse']
];
const MANEUVER_ROWS=[
 ['guding','rattan','wine','thunderSha','thunderSha','thunderSha','thunderSha','thunderSha','wine','supply','chain','chain','negate'],
 ['negate','fireAttack','fireAttack','fireSha','tao','tao','fireSha','shan','shan','fireSha','shan','shan','negate'],
 ['silverLion','rattan','wine','supply','thunderSha','thunderSha','thunderSha','thunderSha','wine','chain','chain','chain','chain'],
 ['fan','tao','tao','fireSha','fireSha','shan','shan','shan','wine','shan','shan','fireAttack','plusHorse']
];
export const attackNature=kind=>kind==='fireSha'?'fire':kind==='thunderSha'?'thunder':'normal';
export const isAttack=kind=>['sha','fireSha','thunderSha'].includes(kind);
export function makeDeck({maneuver=false}={}){
 let id=0;
 const cards=ROWS.flatMap((row,r)=>row.map((kind,i)=>({id:`c${++id}`,kind,suit:SUITS[[0,0,2,2,1,1,3,3][r]],rank:i+1,pack:'standard'})));
 cards.push(...[['frost','♠',2],['renwang','♣',2],['lightning','♥',12],['negate','♦',12]].map(([kind,suit,rank])=>({id:`c${++id}`,kind,suit,rank,pack:'ex'})));
 if(maneuver)for(let r=0;r<4;r++)for(let i=0;i<13;i++)cards.push({id:`c${++id}`,kind:MANEUVER_ROWS[r][i],suit:SUITS[r],rank:i+1,pack:'maneuver'});
 return cards;
}
export const red=c=>c.suit==='♥'||c.suit==='♦';
export function info(c){return {...c,name:c.label||META[c.kind][0],type:META[c.kind][1],range:META[c.kind][1]==='weapon'?META[c.kind][3]:undefined,nature:attackNature(c.kind),text:META[c.kind][2],red:red(c)};}
export const GENERALS = [
  {
    "id": "guanyu",
    "name": "Guan Yu",
    "kingdom": "Shu",
    "hp": 4,
    "sex": "m",
    "skills": "God of War: Use or play a red card as Attack."
  },
  {
    "id": "zhangfei",
    "name": "Zhang Fei",
    "kingdom": "Shu",
    "hp": 4,
    "sex": "m",
    "skills": "Battle Cry: You may use any number of Attacks during your Play Phase."
  },
  {
    "id": "zhaoyun",
    "name": "Zhao Yun",
    "kingdom": "Shu",
    "hp": 4,
    "sex": "m",
    "skills": "Braveheart: Use or play a hand Attack as Dodge, or a hand Dodge as Attack."
  },
  {
    "id": "machao",
    "name": "Ma Chao",
    "kingdom": "Shu",
    "hp": 4,
    "sex": "m",
    "skills": "Horse Riding: Distance to other characters is reduced by 1. Cavalry: When you target someone with Attack, you may judge. A red result prevents them from using Dodge."
  },
  {
    "id": "huangyueying",
    "name": "Huang Yueying",
    "kingdom": "Shu",
    "hp": 3,
    "sex": "f",
    "skills": "Cultivation: Draw 1 card when you use a Regular Strategy. Wizardry: Your Strategy cards have no distance limit."
  },
  {
    "id": "sunquan",
    "name": "Sun Quan",
    "kingdom": "Wu",
    "hp": 4,
    "sex": "m",
    "skills": "Equilibrium: Once per Play Phase, discard any number of hand or equipment cards, then draw that many. Deliverance (Lord): A Peach used by another Wu character during your rescue restores 1 additional HP."
  },
  {
    "id": "ganning",
    "name": "Gan Ning",
    "kingdom": "Wu",
    "hp": 4,
    "sex": "m",
    "skills": "Ambushment: Use a black card as Burning Bridges."
  },
  {
    "id": "lvmeng",
    "name": "Lv Meng",
    "kingdom": "Wu",
    "hp": 4,
    "sex": "m",
    "skills": "Composure: If you did not use or play Attack during your Play Phase, you may skip your Discard Phase."
  },
  {
    "id": "huanggai",
    "name": "Huang Gai",
    "kingdom": "Wu",
    "hp": 4,
    "sex": "m",
    "skills": "Self Sacrifice: During your Play Phase, you may lose 1 HP to draw 2 cards."
  },
  {
    "id": "zhouyu",
    "name": "Zhou Yu",
    "kingdom": "Wu",
    "hp": 3,
    "sex": "m",
    "skills": "Heroic: Draw 1 extra card in your Draw Phase. Sowing Distrust: Once per Play Phase, another character guesses a suit and gains a random card from your hand. If they guessed wrong, they take 1 damage."
  },
  {
    "id": "luxun",
    "name": "Lu Xun",
    "kingdom": "Wu",
    "hp": 3,
    "sex": "m",
    "skills": "Modesty: Steal and Acedia cannot target you. Second Wind: When you lose your last hand card, you may draw 1 card."
  },
  {
    "id": "xuchu",
    "name": "Xu Zhu",
    "kingdom": "Wei",
    "hp": 4,
    "sex": "m",
    "skills": "Bared Bodied: You may draw 1 fewer card in your Draw Phase. For the rest of this turn, your Attack and Duel damage is increased by 1."
  },
  {
    "id": "lvbu",
    "name": "Lv Bu",
    "kingdom": "Qun",
    "hp": 4,
    "sex": "m",
    "skills": "Unrivaled: Your Attack requires 2 Dodges. In a Duel against you, the opponent must play 2 Attacks each time."
  },
  {
    "id": "caocao",
    "name": "Cao Cao",
    "kingdom": "Wei",
    "hp": 4,
    "sex": "m",
    "skills": "Treachery: After taking damage, you may take its physical card(s) if they are still resolving. Entourage (Lord): Ask other Wei characters to supply a Dodge when you need one."
  },
  {
    "id": "simayi",
    "name": "Sima Yi",
    "kingdom": "Wei",
    "hp": 3,
    "sex": "m",
    "skills": "Retaliation: After taking damage, you may take one hand or equipment card from its living source. Necromancy: Before a judgment takes effect, you may replace it with a hand card."
  },
  {
    "id": "xiahoudun",
    "name": "Xiahou Dun",
    "kingdom": "Wei",
    "hp": 4,
    "sex": "m",
    "skills": "Staucness: After taking damage, you may judge. If it is not a Heart, the source must discard 2 hand cards or take 1 damage from you."
  },
  {
    "id": "zhangliao",
    "name": "Zhang Liao",
    "kingdom": "Wei",
    "hp": 4,
    "sex": "m",
    "skills": "Assault: Instead of your normal draw, you may take one hidden hand card from each of up to 2 other characters."
  },
  {
    "id": "guojia",
    "name": "Guo Jia",
    "kingdom": "Wei",
    "hp": 3,
    "sex": "m",
    "skills": "Jealousy of God: You may take your final judgment card. Legacy: For each damage point you survive, you may privately distribute 2 cards from the deck among living characters, including yourself."
  },
  {
    "id": "zhenji",
    "name": "Zhen Ji",
    "kingdom": "Wei",
    "hp": 3,
    "sex": "f",
    "skills": "Goddess of Luo River: During Preparation, you may repeatedly judge, keeping each black result until you stop or reveal red. Empress Dowager: Use or play a black hand card as Dodge."
  },
  {
    "id": "liubei",
    "name": "Liu Bei",
    "kingdom": "Shu",
    "hp": 4,
    "sex": "m",
    "skills": "Benevolence: Give any number of hand cards to another character during Play. Once per Play Phase, recover 1 HP when you have given at least 2 cards in total. Influencing (Lord): Ask other Shu characters to supply an Attack when you need one."
  },
  {
    "id": "zhugeliang",
    "name": "Zhuge Liang",
    "kingdom": "Shu",
    "hp": 3,
    "sex": "m",
    "skills": "Stargazing: During Preparation, privately arrange the top X cards between the top and bottom of the deck (X = living characters, up to 5). Empty Fortress Stratagem: With no hand cards, you cannot be chosen as an Attack or Duel target."
  },
  {
    "id": "daqiao",
    "name": "Da Qiao",
    "kingdom": "Wu",
    "hp": 3,
    "sex": "f",
    "skills": "Captivating: Use a Diamond card as Acedia. Deflection: When targeted by Attack, you may discard a hand or equipment card to redirect it to someone in your resulting attack range, other than the attacker."
  },
  {
    "id": "sunshangxiang",
    "name": "Sun Shangxiang",
    "kingdom": "Wu",
    "hp": 3,
    "sex": "f",
    "skills": "Betrothment: Once per Play Phase, discard 2 hand cards and choose a wounded male character; each of you recovers 1 HP. Daredevil: Each time you lose an equipped card, you may draw 2 cards."
  },
  {
    "id": "huatuo",
    "name": "Hua Tuo",
    "kingdom": "Qun",
    "hp": 3,
    "sex": "m",
    "skills": "First Aid: Outside your turn, use a red hand or equipment card as Peach. Prodigal Healer: Once per Play Phase, discard one hand card to heal a wounded character by 1 HP."
  },
  {
    "id": "diaochan",
    "name": "Diao Chan",
    "kingdom": "Qun",
    "hp": 3,
    "sex": "f",
    "skills": "Lust: Once per Play Phase, discard a hand or equipment card to make one male character Duel another. This skill-created Duel cannot be negated. Beauty Outshining the Moon: During your End Phase, you may draw 1 card."
  }
];
export const EXPANSION_GENERALS = [
  {
    "id": "huangzhong",
    "name": "Huang Zhong",
    "kingdom": "Shu",
    "hp": 4,
    "sex": "m",
    "pack": "Wind",
    "skills": "Fiery Bow: During your Play Phase, when you use Attack, you may prevent Dodge if the target has at least as many hand cards as your HP or at most as many as your attack range."
  },
  {
    "id": "weiyan",
    "name": "Wei Yan",
    "kingdom": "Shu",
    "hp": 4,
    "sex": "m",
    "pack": "Wind",
    "skills": "Rebellious Spine: After dealing damage, recover that much HP if the recipient was within distance 1 immediately before losing HP."
  },
  {
    "id": "pangtong",
    "name": "Pang Tong",
    "kingdom": "Shu",
    "hp": 3,
    "sex": "m",
    "pack": "Fire",
    "skills": "Chain Stratagem: Use a Club hand card as Iron Chains, or recast it. Nirvana: Once per game while dying, discard all cards in your hand, equipment and judgment areas, unchain yourself, draw 3 and recover to 3 HP."
  },
  {
    "id": "wolong",
    "name": "Younger Zhuge Liang",
    "kingdom": "Shu",
    "hp": 3,
    "sex": "m",
    "pack": "Fire",
    "skills": "Eight Trigrams: With no armor equipped, you have the effect of Eight Trigrams Formation. Fire Stratagem: Use a red hand card as Flame Tactic. See Through: Use a black hand card as Negation."
  },
  {
    "id": "menghuo",
    "name": "Meng Huo",
    "kingdom": "Shu",
    "hp": 4,
    "sex": "m",
    "pack": "Forest",
    "skills": "Culprit: Barbarian Invasion has no effect on you. You become the damage source of other players' Barbarian Invasions. Arise: When wounded, replace your normal draw by revealing cards equal to your lost HP. Recover 1 HP per Heart, discard the Hearts and gain the other cards."
  },
  {
    "id": "zhurong",
    "name": "Zhu Rong",
    "kingdom": "Shu",
    "hp": 4,
    "sex": "f",
    "pack": "Forest",
    "skills": "Giant Elephant: Barbarian Invasion has no effect on you. Obtain another player's physical Barbarian Invasion when it enters the discard pile after resolution. Fiery Blade: After your Attack deals damage to its target, you may Pindian against the recipient. If you win, take one of their hand or equipment cards."
  },
  {
    "id": "taishici",
    "name": "Taishi Ci",
    "kingdom": "Wu",
    "hp": 4,
    "sex": "m",
    "pack": "Fire",
    "skills": "Justice of Heaven: Once per Play Phase, Pindian with another character. If you win, your Attacks have no distance limit, their use limit increases by 1 and their target limit increases by 1 this turn. Otherwise, you cannot use Attack this turn."
  },
  {
    "id": "sunjian",
    "name": "Sun Jian",
    "kingdom": "Wu",
    "hp": 4,
    "sex": "m",
    "pack": "Forest",
    "skills": "Heroic Spirit: During Preparation when wounded, choose another player. They either draw X and discard 1, or draw 1 and discard X, where X is your lost HP."
  },
  {
    "id": "xiaoqiao",
    "name": "Xiao Qiao",
    "kingdom": "Wu",
    "hp": 3,
    "sex": "f",
    "pack": "Wind",
    "skills": "Rosy Cheeks: Your Spades are treated as Hearts, including your judgments. Heavenly Scent: Before taking damage, discard a Heart hand card and choose another player to receive that damage instead. If they survive the damage resolution, they draw cards equal to their lost HP."
  },
  {
    "id": "zhoutai",
    "name": "Zhou Tai",
    "kingdom": "Wu",
    "hp": 4,
    "sex": "m",
    "pack": "Wind",
    "skills": "Undying: Old Wind version. When reduced to zero or negative HP, you may reveal enough wound cards to equal 1 minus your HP. If all wound ranks differ, you survive. Recovery removes wounds of your choice; removing the last restores you to 1 HP."
  },
  {
    "id": "xuhuang",
    "name": "Xu Huang",
    "kingdom": "Wei",
    "hp": 4,
    "sex": "m",
    "pack": "Forest",
    "skills": "Cut Off Rations: Use a black Basic or Equipment card as Rations Depleted. You can target a character at distance 2 with Rations Depleted."
  },
  {
    "id": "dianwei",
    "name": "Dian Wei",
    "kingdom": "Wei",
    "hp": 4,
    "sex": "m",
    "pack": "Fire",
    "skills": "Forceful Assault: Once per Play Phase, lose 1 HP or discard a weapon card to deal 1 damage to another character within your resulting attack range."
  },
  {
    "id": "pangde",
    "name": "Pang De",
    "kingdom": "Qun",
    "hp": 4,
    "sex": "m",
    "pack": "Fire",
    "skills": "Horse Riding: Distance to other characters is reduced by 1. Horse Archery: When your Attack is dodged, you may discard a hand or equipment card from that target."
  },
  {
    "id": "zhangjiao",
    "name": "Zhang Jiao",
    "kingdom": "Qun",
    "hp": 3,
    "sex": "m",
    "pack": "Wind",
    "skills": "Thunder Strike: Old Wind version. Whenever you use or play Dodge, you may choose a character to judge. A Spade result deals 2 thunder damage to them. Devilish Arts: Replace a judgment with a black hand or equipment card and obtain the previous judgment card. Yellow Heaven (Lord): Each other Qun character may give you one Dodge or Lightning once during their Play Phase."
  }
];
EXPANSION_GENERALS.push(
 {id:'yanliangwenchou',name:'Yan Liang & Wen Chou',kingdom:'Qun',hp:4,sex:'m',pack:'Fire',skills:'Heroic Duo: Replace your Draw Phase draw with a judgment and obtain its card. For this turn, use hand cards of the opposite color as Duel.'},
 {id:'yuanshao',name:'Yuan Shao',kingdom:'Qun',hp:4,sex:'m',pack:'Fire',skills:'Raving Slash: Use two hand cards of the same suit as Raining Arrows. Bloodline (Lord): Your hand limit increases by 2 for each other living Qun character.'},
 {id:'xiahouyuan',name:'Xiahou Yuan',kingdom:'Wei',hp:4,sex:'m',pack:'Wind',skills:'God Speed: You may skip Judgment and Draw to use an Attack without a distance limit. You may also discard an Equipment card and skip Play to use an Attack without a distance limit.'},
 {id:'yuji',name:'Yu Ji',kingdom:'Qun',hp:3,sex:'m',pack:'Wind',skills:'Bewilder: Old Wind version. Claim a Basic or non-delayed Spell using a face-down hand card. Other players with positive HP may challenge. If unchallenged, the card resolves. If challenged, only a truthful Heart resolves. A truthful claim costs each challenger 1 HP; a false claim lets each challenger draw 1 card.'},
 {id:'dongzhuo',name:'Dong Zhuo',kingdom:'Qun',hp:8,sex:'m',pack:'Forest',skills:'Drunkard: Use a Spade hand card as Wine. Lust: When you Attack a female character or a female character Attacks you, two Dodges are required. Breakdown: During End, if another living character has less HP, lose 1 HP or 1 maximum HP. Tyrant (Lord): After another Qun character deals damage, they may judge; a Spade lets you recover 1 HP.'}
);

export const ALL_GENERALS = [...GENERALS,...EXPANSION_GENERALS];

export function shuffle(a){for(let i=a.length-1;i>0;i--){const j=randomInt(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
export const ROLES={4:['lord','loyal','rebel','spy'],5:['lord','loyal','rebel','rebel','spy'],6:['lord','loyal','rebel','rebel','rebel','spy'],7:['lord','loyal','loyal','rebel','rebel','rebel','spy'],8:['lord','loyal','loyal','rebel','rebel','rebel','rebel','spy']};
export const ROLE_NAMES={lord:'Lord',loyal:'Loyalist',rebel:'Rebel',spy:'Spy'};
