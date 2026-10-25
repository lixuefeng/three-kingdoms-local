// Original tactical deductions from this build's classic rules. Not article translations.
// Research provenance and version filters live in general-strategy.mjs.
// Each entry is deliberately general-specific, not a universal action priority.
const entry=(sequence,reserve,react,example)=>({sequence,reserve,react,example});
export const GENERAL_TACTICS={
 guanyu:entry(
  'Secure weapon/-1 Horse access, remove the intended victim armor if worthwhile, then choose the cheapest Attack or red conversion. With Crossbow, reevaluate every remaining red card after each hit; without it, do not convert several cards for an exhausted Attack allowance.',
  'Value a red card by both printed effect and Attack flexibility. Peach, a live Negation and the weapon supplying reach usually cost more than a redundant red card. Preserve one response when Duel/Barbarian pressure is credible.',
  'Answer Attack requests with the lowest opportunity-cost legal red card. Before spending equipment, recalculate reach and defensive exposure; kingdom matching alone does not establish an ally.',
  'A spare red horse can be Attack fuel; a red Peach at 1 HP is usually survival, not cheap fuel.'),
 zhangfei:entry(
  'Draw first when safe, establish reach, strip key armor, then concentrate Attacks. Spend Wine on a likely connecting hit rather than before finding a target. After a Rebel kill, inspect reward cards for another attack chain.',
  'Attacks are immediately spendable burst resources, not redundant after the first use. A long weapon can be more valuable than one extra Attack. Keep enough defense to survive if no achievable kill exists.',
  'Do not exhaust all Attacks answering an avoidable low-impact Duel when those cards can secure a team-winning burst; survival and mandatory response legality still take priority.',
  'An enemy used their last known Dodge: a second Attack now may be better than saving it for next turn.'),
 zhaoyun:entry(
  'Count Attack and Dodge together, then allocate offense and defense from the combined pool. Play draw/control to improve the attack before spending the last convertible card. Prefer meaningful pressure over keeping several equivalent defenses.',
  'One convertible card can cover either one Attack or one Dodge, not both. Elemental Attack effects and printed card value can make two convertible cards unequal; avoid wasting a useful elemental hit as a routine response.',
  'Duel and Barbarian consume the same pool as Dodge defense. Check expected follow-up pressure before volunteering to spend the whole pool for a minor exchange.',
  'With three Dodges and no Attack, one Dodge can become offensive pressure while two remain available for defense.'),
 machao:entry(
  'Compare reachable priority enemies using actual distance reduction. Use removal against armor that Cavalry does not bypass, then Attack. Enable Cavalry for an important hit; a red judgment blocks Dodge, not every damage-prevention effect.',
  'Retain an actual Attack supply and reach. Cavalry is not permission to turn every hand into offense when the Lord needs rescue or your own HP is critical.',
  'Judgment controllers can change Cavalry. Reassess known retrial resources rather than treating its average success as certainty; do not claim knowledge of hidden suits.',
  'A Dodge-heavy enemy is attractive; an immune armor target may still require equipment removal before attacking.'),
 huangyueying:entry(
  'Resolve useful draw/control spells early and inspect each Cultivation draw before committing the next action. Use distance-free Steal for a priority resource. Delayed spells may be useful control but do not supply the regular-spell draw.',
  'A cheap useful spell may have both its printed effect and a replacement card. Do not discard draw-two merely to preserve hand size. Nevertheless a harmful AOE is not repaired automatically by one personal draw.',
  'Negation is both team protection and a potential draw trigger when used legally. Counter important effects rather than manufacturing a counter war just to cycle cards.',
  'Steal an enemy armor, inspect the bonus draw, then decide whether the new Attack can exploit the exposed target.'),
 sunquan:entry(
  'Identify the desired next action before Equilibrium: find reach, a finisher, healing or defense. Use safe draw cards and obvious useful effects first when they add information. Cycle redundant/unusable cards, then reassess all new cards before ending.',
  'Keep known high-value Peach/Negation/reach when unknown replacements are worse for the current need. Classic Equilibrium draws exactly the number discarded: emptying your hand has no bonus. Equipped cards can also be costs, with their loss evaluated.',
  'Response cards kept for a concrete upcoming threat are useful; keeping every Dodge while discarding an unused draw spell is not a plan. At critical HP, value reliable recovery above speculative burst.',
  'Keep the Peach needed by a dying Lord and cycle two redundant Attacks; do not full-cycle for an absent revised-version bonus.'),
 ganning:entry(
  'Use cheap black cards to dismantle an enemy key defense before allied damage. Compare direct printed use with conversion: a black Steal can both deny and gain, while a black Negation may protect a whole turn. Resolve draw before choosing final costs when safe.',
  'Reserve enough black cards for defense/counters if exposed. Choose armor, reach, delayed spells or hidden hand according to the objective; removing enemy Acedia may help them and needs an explicit reason.',
  'Against equipment-loss benefits, inspect the compensation. Burning a Silver Lion can heal its owner; triggering Sun Shang Xiang draws may be worse than stripping a hand card.',
  'Remove Vine before the team normal-Attacks; preserve Vine if a prepared fire hit is the stronger finish.'),
 lvmeng:entry(
  'Compare an achievable Attack/kill with the actual cards Composure would save. Play useful draw, control, healing and equipment even when planning to skip Attack. After using Attack, abandon the imaginary no-discard benefit and spend excess efficiently.',
  'Stockpile cards with a future delivery mechanism: Crossbow, reach and Attacks can create a burst. A huge hand alone does not win, and leaving a free draw card unused loses options.',
  'An Attack response outside your Play Phase is not automatically the same as using Attack during it; obey supplied hand-economy facts. Respond to survive rather than assuming every Attack-related action breaks Composure.',
  'If a reliable enemy kill is available, compare its reward and team impact with saving two excess cards instead of always hoarding.'),
 huanggai:entry(
  'Before each Bitter Flesh, calculate post-loss HP, rescue availability and the actions new cards could enable. Establish Crossbow/reach when possible, draw, then stop to use the gained cards. Recalculate after every activation; do not enqueue repeated HP payments.',
  'At low HP, a Peach may finance another safe activation, but spending it removes rescue security. Without a concrete offensive or recovery outlet, additional cards can simply become forced discards.',
  'HP loss is not damage: do not expect damage-trigger compensation. At 1 HP, activation can enter dying before the promised cards arrive; an unconfirmed ally rescue is not guaranteed.',
  'At 2 HP with no healing or secured kill, keeping a survivable hand can beat another activation that leaves you at 1 HP.'),
 zhouyu:entry(
  'Use Heroic Bearing resources, ordinary draw/control, then evaluate Estrangement with a cheap cost. Choose a strategically useful target, not merely the next seat. Reassess offense after the random gift/possible damage resolves.',
  'Estrangement trades a card for uncertain damage and gives the target that card. Avoid gifting Peach/Negation to a threatened enemy when a cheaper alternative exists; do not assume you can choose the random gift afterward.',
  'When guessing, use only observed information about the cost pool; no suit is guaranteed without evidence. As user, distinguish possible damage from a secured finish.',
  'A 1-HP enemy may survive by guessing correctly and receiving your card; do not treat the skill as guaranteed lethal.'),
 luxun:entry(
  'Plan whether the remaining hand can actually be used. Spend low-opportunity-cost cards in a sequence that reaches zero and triggers Second Wind, then reassess the new card. Never waste a winning control card merely to complete a cycle.',
  'A single unusable card can obstruct cycling; a single useful Peach may still be worth keeping. Modesty blocks specified control, not all spells, damage or theft effects.',
  'A legal response that spends your last hand card can replenish you. Count response costs and follow-up danger; do not assume Second Wind replaces equipment lost from the equipment area.',
  'If your last hand card is a playable equipment, equipping it may both improve the board and open a fresh draw.'),
 xuchu:entry(
  'At the draw replacement decision, inspect current Attacks/Duels, reach, enemy defense and likely forced hits. After choosing Bared Bodied, use draw-two and control to find a connecting hit this turn. The bonus expires; ending with unused draw-two needs a concrete justification.',
  'Trading one draw for damage is attractive only if the boosted damage can land and help your role. Retain enough Attack responses to win a chosen Duel; losing that Duel is not your outgoing boosted hit.',
  'Evaluate armor, Dodge denial and Axe costs before committing Wine/Attack. Damage-trigger enemies may benefit from a small boosted hit unless it finishes or decisively pressures them.',
  'Bared Bodied active, draw-two in hand, legal targets present: resolve draw-two and reconsider rather than ending to save it for later.'),
 lvbu:entry(
  'Pressure enemies with insufficient response supply, but check armor and reach first. Duel can exploit the double-Attack demand; choose a victim whose likely response stock and damage triggers make that exchange profitable.',
  'Peerless improves response pressure, not your supply. Preserve your own Attack responses for Duel; extra Dodges in an enemy hand are not proof they can meet both requirements.',
  'When involved in a Duel, inspect who must supply two responses and who deals resulting damage. Do not infer that your passive makes you immune to losing the exchange.',
  'A one-card hand is vulnerable to double Dodge requirements, unless another legal defense or armor can replace them.'),
 caocao:entry(
  'When damaged, value the recoverable physical card and safe HP against the cost of accepting damage. Recovered AOE is an option: count the full table before replaying. As Lord, prioritize staying alive over acquiring an impressive spell.',
  'Keep enough defense that repeated hits cannot convert your desired card gain into death. Skill-created damage may have no physical card to recover; inspect the offered choices.',
  'Request Wei Dodge support only for a live threat and stop according to the actual request result. Do not repeatedly ask one responder indefinitely or assume every Wei character is loyal.',
  'Recovering Barbarian may be valuable; immediately replaying it while two allies are dying may lose despite the personal card gain.'),
 simayi:entry(
  'Rank pending judgments by impact: saving a Play/Draw Phase or averting lethal Lightning can exceed marginal card value. Inspect the current result before retrial. Your hand cost must change the outcome or obtain a concrete secondary benefit.',
  'Preserve the suits/ranks that cover important near-term judgments, but not every card forever. Feedback can obtain equipment as well as hidden hand; a known key weapon may beat a random card.',
  'If another retrial user acts later, your replacement may not be final. Use visible seat order and legal retrial information rather than assuming control is uncontested.',
  'Acedia already shows Heart on your ally: passing can save the retrial card for an actual failed judgment.'),
 xiahoudun:entry(
  'Continue normal offense; Staucness is deterrence, not a resource engine to farm indiscriminately. After damage, compare the source team and available punishment before activating. Against enemies, resource tax can matter even when retaliation does not deal damage.',
  'For the punishment choice, two worthless cards may be cheaper than HP; a Peach plus live Negation may be dearer. Base the choice on actual cards and survival, not a fixed always-discard policy.',
  'Friendly damage may be part of a useful AOE, but retaliation can erase that benefit. Do not punish an ally automatically because an activation button is available.',
  'At 1 HP with two expendable cards, discard can preserve life; at safe HP with two crucial rescue cards, taking damage may be cheaper.'),
 zhangliao:entry(
  'At Draw, compare two normal unknown draws with the denial value and likely quality of each eligible hand. Prefer stripping enemy defense before teammates act. Choose zero for normal draw when no profitable theft exists; one target gives only one stolen card.',
  'Need a fresh weapon/Attack? Enemy tiny hands may supply only a saved response. Do not steal the Lord as Loyalist merely to obtain a second target. A known enemy key card can justify a one-target theft despite losing card quantity.',
  'An ally theft is exceptional: explicitly check whether removing their final card activates beneficial Empty Fortress or Second Wind and whether that benefit exceeds the lost card. Never use kingdom or a vague support objective as permission.',
  'Only your allied Lord has cards and no beneficial last-card trigger: normal draw-two is usually better than taking one of their defenses.'),
 guojia:entry(
  'For each Legacy pair, assign cards by immediate usability and survival. During AOE, an ally still waiting to respond may use a gifted Attack/Dodge right away. Keep cards yourself when you need them; distributing is optional and keeping needs no self-target.',
  'Keep healing/defense when vulnerable; pass reach and Attack fuel to a specialist whose turn is near. Gifts to a likely enemy require an explicit role-winning reason, not the generic label support.',
  'Before accepting damage, calculate the whole hit, dying risk and possible later hits. Legacy is compensation after damage, not damage reduction; no supply is valuable if you cannot survive to use it.',
  'An ally later in Barbarian resolution lacks Attack: give the freshly drawn Attack now; retain the other card if it protects you.'),
 zhenji:entry(
  'Continue productive Luo River judgments, inspect gained cards, then develop equipment/control and useful offense. A large hand increases flexibility but may still exceed your HP limit at discard. Spend useful draw spells rather than throwing them away later.',
  'Reserve cheap black cards as flexible Dodge; preserve a strong black spell when another black card can cover the same response. Red cards cannot use the conversion simply because Luo River obtained them.',
  'Duel, Barbarian and elemental/control pressure can bypass Dodge-heavy defense. Against hostile retrial, account for the possibility of a red stop without assuming unseen cards.',
  'Two black cards remain: use the redundant black Attack for Dodge before sacrificing a Negation that can save the Lord turn.'),
 liubei:entry(
  'Form a concrete recipient-and-use plan before gifting. An offensive ally with reach can use Attack now/next turn; an endangered Lord needs defense now. Track total gifts toward the once-per-phase two-card heal and reassess after it triggers.',
  'Keep essential self-defense and personally usable draw/control unless a recipient uses them better. Two gifts heal once; further gifts do not keep healing. Shared Shu faction is not shared identity.',
  'Influencing must have an actionable Attack objective and willing Shu support. A declined request should update the decision rather than repeating forever. Do not feed a known Rebel while defending the Lord without a concrete winning exception.',
  'Lord Liu Bei, one Spy and one Rebel remain: default to self-preservation and enemy denial, not routine gifts to the Rebel.'),
 zhugeliang:entry(
  'Lay out the actual consumption order: your pending judgments, your expected draws, then any remaining known cards for the next seat. Put exact required suits/ranks into judgment positions before choosing attractive draws. Do not assume delayed-spell order or intervening draws not shown by the game.',
  'Keep Peach/Negation or a workable defensive hand when forced emptying costs too much. If planning Empty Fortress, select draws that can genuinely leave hand this turn. An unusable last card can destroy the whole defensive plan.',
  'Empty Fortress blocks Attack and Duel targeting, not AOE, fire spells, skills or all damage. Hostile card gifts can break emptiness. Retrial users may invalidate your planned judgment; preserve a fallback when possible.',
  'Acedia pending: place a Heart for its judgment, then your two useful draws; do not put the best weapon first and lose the Play Phase.'),
 daqiao:entry(
  'Turn low-value Diamonds into Acedia on an enemy whose lost Play Phase matters. Avoid duplicate delayed spells and account for friendly removal or retrial. Decide which card remains for Deflection before exhausting your hand.',
  'Deflection needs a legal other recipient and a discard. A weapon/horse discard can change range; preserve actual legal access, not merely a theoretical enemy on the table.',
  'Compare taking a safe hit with spending a critical card and redirecting into a worse outcome. A Guo Jia recipient may gain useful cards; a low-HP enemy may be a finish. Original attacker is not a legal return target.',
  'Do not discard the horse that makes your desired recipient legal without checking the resulting target restrictions.'),
 sunshangxiang:entry(
  'Equip and replace useful equipment to exploit Daredevil, checking new draws after every equipment loss. If Betrothment can heal a valuable male ally and you, compare its two-card cost with other uses before committing.',
  'An equipped item can carry both current protection and future loss draws. A held equipment card has no loss trigger. Do not replace vital armor just for two unknown cards when the next enemy can kill you.',
  'Equipment removal may benefit you, so value the whole exchange. Healing target sex and wounded conditions remain mandatory; team identity still matters more than a convenient legal male.',
  'Replacing a spare weapon can draw two; discarding a weapon from hand does not trigger the same skill.'),
 huatuo:entry(
  'Heal the most urgent valuable target with an expendable hand card, then use safe draw/equipment and ordinary pressure. Your own survival protects future team healing; do not end exposed merely to retain one extra attack card.',
  'Separate Play-Phase healing costs from out-of-turn red First Aid reserve. Preserve red equipment/hand cards according to actual legal rescue options and current defenses.',
  'First Aid is not available during your own turn. Check whose dying state is active and whether saving them helps your role; a dying Rebel is not automatically a patient for a Loyalist.',
  'A low-value red card may be worth holding when the Lord is likely to enter dying before your next turn.'),
 diaochan:entry(
  'Pick the intended loser first conceptually, then order the two legal males so response order favors that outcome. Submit one cheap cost and both targets together. Check Attack supply, Lv Bu requirements and damage-source consequences before confirming.',
  'Keep defense for the interval before your next turn; the end draw helps but is unknown. A cheap cost can make Lust efficient, yet guaranteeing your preferred damage recipient requires analyzing the Duel responses.',
  'If an ally participates, verify a concrete advantage such as a safe guaranteed enemy finish; do not use them as a generic second male. Damage-trigger benefits and kill reward ownership can change the best ordering.',
  'A male with no Attacks answers first: ordering him first can force him to lose immediately instead of relying on the other male failing later.'),
 huangzhong:entry(
  'Calculate both classic bow tests from current target hand count, your HP and actual weapon range. Establish reach/remove relevant armor, then use the supplied bow activation when valuable. Recompute after every stolen/discarded card or HP change.',
  'A longer weapon improves the low-hand threshold as well as reach. Do not lose HP just to improve the high-hand threshold unless the entire exchange is profitable.',
  'Dodge denial does not bypass all armor or damage prevention. Wine is best spent on a hit that can connect and advance a finish; do not infer a newer automatic damage bonus.',
  'With range 3, a target holding at most three cards may meet the classic low-hand condition; use engine availability as final authority.'),
 weiyan:entry(
  'Choose meaningful enemies at actual distance one; an ordinary spell hit there can also be relevant. Equip -1 Horse before committing if it changes distance. Use recovery potential to compare otherwise similar attacks, not to justify harming teammates.',
  'At full HP, the healing portion has no immediate value. At low HP, a reliable distance-one hit can improve both offense and survival, but a long weapon alone does not shorten distance.',
  'Recovery requires damage to occur. Dodge, prevention or immunity can leave you wounded after spending your action; do not spend your only rescue assuming a hit is guaranteed.',
  'Range 4 reaches an enemy four seats away but does not by itself make that target distance one for recovery.'),
 pangtong:entry(
  'For each Club, compare its printed use, chain/unchain effect and recast draw. Set up elemental propagation only with a credible follow-up. Unchain endangered allies before a known enemy fire turn when that prevents a team loss.',
  'Recast is card cycling, not free card advantage. Keep vital Club defense/control when replacement uncertainty is worse. Nirvana is once-only insurance whose reset sacrifices an existing board.',
  'Before declining rescue in favor of Nirvana, compare the reset state and future danger. A near-empty weak board favors resetting more than valuable equipment and a safe rescue.',
  'No profitable elemental target and a redundant Club: recast can find a useful card rather than chaining arbitrary players.'),
 wolong:entry(
  'Use draw/control to improve suit coverage before paying for fire. For Flame Tactic, budget the claim card plus a matching-suit discard and check target hand availability. Chain/Vine can improve payoff, but include every propagated recipient.',
  'Cheap black cards are Negation reserves; preserve enough for important effects, not all of them forever. Equipping armor replaces innate Eight Trigrams, so compare reliability and matchup rather than assuming any armor is an upgrade.',
  'Use innate armor when legal and worthwhile before spending a scarce Dodge. For counters, evaluate the spell outcome and later enemies; avoid burning the whole black hand on a minor effect.',
  'One red card and no suit coverage does not guarantee successful Fire Stratagem; an ordinary useful card play may cost less.'),
 menghuo:entry(
  'At Arise, compare lost HP with normal draw-two and expected recovery/card mix. Low lost HP often favors normal draw; deep wounds can favor Arise. After resolving it, reassess actual cards and health before offense.',
  'Do not deliberately tank damage without survival and next-turn value. Barbarian immunity can preserve Attack responses for Duel or later threats, but not for immunity against all AOE.',
  'You can become Barbarian damage source even when someone else played it. Consider retaliation, Rebel rewards and Lord-kills-Loyalist punishment using the game actual source facts.',
  'One lost HP means Arise reveals one card instead of drawing two; recovery may justify it, but it is not an automatic extra draw.'),
 zhurong:entry(
  'Use ordinary Attack to secure damage, then evaluate Fiery Blade against the now-current enemy hand. Reserve a strong expendable rank if the resulting steal matters. Recovered Barbarian must be evaluated afresh for team casualties.',
  'Pindian spends a real card whether it wins or loses. A high Peach may be too expensive for a speculative hidden hand card; a known important equipment reward can justify a larger wager.',
  'If an opponent just took damage, their HP and hand may already have changed through triggers. Recheck rather than relying on the pre-Attack plan. Meng Huo source replacement can alter AOE kill consequences.',
  'Do not discard your sole Peach to win a low-value Pindian while sitting at 1 HP with incoming pressure.'),
 taishici:entry(
  'Before Pindian, count remaining usable Attacks, valuable targets and the rank you can afford. Win, then exploit extra use/targets and unlimited distance with ordinary Attacks. After each hit, reassess targets rather than preserving a stale two-target plan.',
  'The wager card and attack fuel are separate costs. A high Attack used for Pindian cannot also be played afterward. A denial-only Pindian can be valid but should beat the alternative uses of your card.',
  'Losing forbids Attack for the turn; do not risk a sure useful ordinary hit for a poor-rank gamble. When responding to enemy Pindian, preventing their burst can justify your strongest rank.',
  'Only one Attack, also your highest card: spending it to win leaves no burst unless other conversion/draw is genuinely available.'),
 sunjian:entry(
  'At Heroic Spirit, calculate X from current lost HP and decide support versus enemy tax. Choose recipient by immediate team effect and their actual hand/equipment resources. At X=1 the modes mostly cycle a card; do not describe either as huge advantage.',
  'Lost HP is future skill power but lower survival and hand capacity. Recover when threatened rather than preserving a large X that you may never survive to use.',
  'For discard selection, preserve irreplaceable reach/defense when possible. The enemy tax may target equipment too according to legal options; do not invent discardable cards outside the supplied choices.',
  'At three lost HP, refill an attacking ally or strip an enemy core; pick the mode that matches the chosen recipient, not a fixed button position.'),
 xiaoqiao:entry(
  'For transfer, compute recipient post-hit HP, survival triggers, lost-HP draw and chain consequences before choosing. Large damage can finish an enemy; small damage can unintentionally refill them. A survivable allied Guo Jia interaction may be useful only with explicit math.',
  'Keep an effective Heart, including Spade under Rosy Cheeks. Retaining a transfer card matters only if a legal profitable recipient exists; it does not replace all other defense.',
  'Do not double-count transferred damage as a fresh unmodified base hit. Use current damage facts and equipment interactions from the engine. A dying recipient may not produce the refill imagined in advance.',
  'Giving a 1-damage transfer to a heavily wounded enemy who survives can hand them a large refill; a healthier target may be better.'),
 zhoutai:entry(
  'Continue ordinary useful play even at nonpositive HP; old Undying is a risky survival mechanism, not a growing hand engine. Inspect public wound ranks and available rescue before deciding whether to rely on another wound.',
  'When recovery removes a wound, prioritize resolving duplicate ranks where the legal choices allow. Negative HP sharply constrains the classic hand limit; spend useful cards rather than saving an impossible modern-sized reserve.',
  'Wound reveals are not judgments, so retrial is not a universal solution. Collision risk increases with existing ranks; a previous survival success does not guarantee another.',
  'Two wounds share rank 7: if recovery offers either duplicate for removal, breaking the pair can be more important than its suit.'),
 xuhuang:entry(
  'Choose a reachable enemy whose next draw supports a dangerous turn. Convert a cheap black Basic/Equipment only after comparing its printed use. Check existing Rations, retrial and removable delayed-spell defenses before paying.',
  'A black Dodge or equipped protection may be worth more than a low-probability denial. Actual distance-two legality is not weapon range; keep a horse if losing it invalidates the plan.',
  'Rations denies draw only if its judgment fails. Enemy judgment control can reduce value; friendly judgment setup can increase it without making an unseen outcome certain.',
  'An enemy hand engine nearing an empty turn may be a better denial target than a distant convenient enemy who already has ample resources.'),
 dianwei:entry(
  'Compare ordinary Attack and Forceful Assault order while the target remains reachable. Direct damage can finish through Dodge-heavy defense. Decide weapon discard versus HP payment using the actual post-cost board and survival state.',
  'An otherwise obsolete held weapon can be a cheap cost. The equipped weapon supplying reach is not cheap merely because the skill accepts equipment. HP payment must include the danger of subsequent enemy turns.',
  'Damage is direct but still subject to relevant prevention/transfer. Do not assume a 1-HP enemy dies if they can redirect or reset; use legal observable information.',
  'Use Attack before sacrificing necessary reach when both hits are needed and the engine permits the sequence.'),
 pangde:entry(
  'Choose an important enemy reachable with Horse Riding. If they Dodge, Horse Archery can still disrupt the board; evaluate the offered hand/equipment choices after the Dodge rather than preselecting blindly.',
  'Axe-like guaranteed damage is not the same as this discard effect. Preserve Attack supply and defense; do not spend resources assuming a dodged Attack still deals HP damage.',
  'Removing Silver Lion may heal; removing Sun Shang Xiang equipment may refill. A random hand card can be better than visibly attractive equipment with a strong loss benefit.',
  'Enemy Dodges behind a key range weapon: removing it may protect your Lord more than stripping an unknown hand card.'),
 zhangjiao:entry(
  'Build Dodge plus retrial coverage, then use Thunder Strike on the most valuable legal enemy. A controlled Spade judgment threatens two thunder damage; chain propagation can magnify both team gains and friendly losses.',
  'Do not spend every black card casually: a suitable Spade can secure Thunder Strike, while other black cards serve different retrials. Devilish Arts can use equipment and obtains the replaced judgment; include lost equipment utility.',
  'Allied Attack-to-Dodge cooperation is worthwhile only with a real Dodge, legal response and profitable thunder target. Do not request friendly damage on the assumption of hidden resources.',
  'A Club retrial is black but does not satisfy this build old Spade-only Thunder Strike; no newer Club healing should be expected.'),
 yanliangwenchou:entry(
  'At draw replacement, inspect both colors and actual Attack responses. Heroic Duo obtains a judgment card instead of normal draw-two. Once color is known, use opposite-color surplus as Duels against enemies likely to lose the exchange.',
  'Keep enough actual Attack responses to win Duels; converting all response fuel into Duel costs can strand you. Cards matching the judgment color cannot be converted by the classic skill.',
  'A Duel that feeds damage-trigger opponents may be less useful than ordinary offense. Recalculate remaining response supply after each Duel instead of assuming every converted card is free damage.',
  'A red judgment leaves black hand cards as Duel fuel; preserve enough actual Attacks to answer the resulting Duels instead of converting them all.'),
 yuanshao:entry(
  'Before each two-card same-suit AOE, count every ally/enemy exposure, likely Dodges, death triggers and source-based rewards. Resolve one volley and inspect the new state before considering another.',
  'Two cards is a real cost. Retain essential rescue/defense unless the volley wins or creates superior team value. Bloodline uses living Qun count for this Lord hand limit, not assumed team membership.',
  'Enemy Guo Jia can supply later responders mid-AOE. Meng Huo Barbarian interactions do not grant immunity to Arrow Barrage. Do not apply revised draws, target exclusions or cost refunds.',
  'Two exposed Rebels do not make a volley good if it first kills your own 1-HP Lord.'),
 xiahouyuan:entry(
  'First God Speed compares skipping Judgment+Draw with one distant Attack: bad delayed spells or a finish can justify it. Second compares an equipment cost plus the entire Play Phase with one hit. Evaluate all foregone healing, draw, control and attacks.',
  'Prefer expendable equipment costs without destroying crucial protection. No Attack card is required for the created hit, but lost phases remain expensive; the skill is not simply free extra damage.',
  'The target may Dodge or prevent damage. A normal draw/play turn can outperform a speculative hit; do not take both opportunities automatically because both are legal.',
  'With draw-two, Peach and several useful spells, skipping the whole Play Phase for a routine single Attack usually wastes more than it gains.'),
 yuji:entry(
  'Choose a claim that addresses the current tactical need and is actually legal. A truthful Heart is robust to a challenge; a truthful non-Heart can still fail when challenged. Prefer ordinary use when deception adds nothing.',
  'Bluff cost includes losing the card/action if challenged and revealing information. Preserve credible Heart claims and defense rather than turning every spare card into speculative AOE.',
  'As challenger, compare HP cost if true with the value of stopping the effect. Only positive-HP eligible players may challenge in this build. Do not challenge an ally automatically or assume every surprising claim is false.',
  'A truthful non-Heart draw-two claim can be stopped by challenge; it is not equivalent to a truthful Heart claim.'),
 dongzhuo:entry(
  'Use early resources to create progress before Breakdown erodes the HP advantage. Prepare an Attack and a connecting target before converting a Spade into Wine. Against female targets, evaluate double-Dodge pressure and retaliation risk.',
  'High initial HP is finite. At Breakdown, compare immediate HP safety with permanent max-HP, healing ceiling and hand-limit loss. Avoid preserving a huge unused hand while your long-term position collapses.',
  'Female attackers also require extra Dodges from you. Keep enough actual response supply; do not count one Dodge as sufficient automatically. A Wine hit does not disable old Breakdown.',
  'Drink Wine only with a useful follow-up Attack, unless legally self-rescuing; do not spend it as a vague setup for a later turn.'),
};

export function tacticalContext(id,prompt){
 const t=GENERAL_TACTICS[id];if(!t)return null;
 // Turn prompts need sequencing; other prompts need cost/response judgment, not a second full manual.
 return prompt.zone==='turn'
  ? {sequence:t.sequence,reserve:t.reserve,workedExample:t.example}
  : prompt.zone==='response'
   ? {decision:t.react,reserve:t.reserve,workedExample:t.example}
   : {sequence:t.sequence,decision:t.react,reserve:t.reserve,workedExample:t.example};
}
