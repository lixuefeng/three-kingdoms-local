// Original English syntheses, researched against official guides and adapted to cards.mjs.
// Sources are provenance, not runtime fetches. Supplied skill text/legal options override advice.
const ol=id=>'https://www.sanguosha.com/news/'+id;
function guide(source,plan,priorities,avoid,facing,version='Classic skills in this build; ignore revised, SP, national-war and mobile-only upgrades.'){
 return {plan,priorities,avoid,facing,version,sources:[{url:source,kind:source.includes('gltjk.com')?'Archived rulebook reproduction; strategy inferred from classic rules':'Official strategy guide or official general introduction; advice synthesized and adapted'}]};
}
export const GENERAL_STRATEGIES={
 guanyu:guide(ol('20161025_4718_5415'),'Reliable Attack supply needs reach, not more redundant Attacks.',[
  'Equip reach before spending valuable red cards; use a cheap red card as Attack when it enables meaningful pressure.',
  'Retain enough red conversion material for Duel and Barbarian responses; compare spending red equipment with losing its range.',
  'As Rebel, prioritize reaching the Lord; as Loyalist, use steady attacks to support team focus.'
 ],'Do not convert a useful Peach or equipped weapon when a cheaper Attack is available.','His red cards can answer Attack requests; reducing range or removing cards limits him.'),
 zhangfei:guide(ol('20161025_2537_0516'),'Turn a stock of Attacks into a focused burst.',[
  'Develop reach and use draw cards before deciding the burst is finished.',
  'Concentrate repeated Attacks on a valuable enemy when exhausting their Dodge can secure a kill.',
  'Reassess after each hit, kill reward or lost weapon; unlimited uses do not remove range or armor.'
 ],'Do not stop after the ordinary one-Attack limit; do not waste every Attack into immunity.','Expect follow-up Attacks after one Dodge; deny his hand or reach.'),
 zhaoyun:guide(ol('20161025_7664_2416'),'Treat Attack and Dodge as one flexible reserve.',[
  'Spend excess Dodges offensively when an Attack advances the team objective.',
  'Keep a convertible card for defense when exposed, but do not preserve all Attacks merely for hypothetical Dodges.',
  'Use the cheapest useful conversion and account for required Duel/Barbarian responses.'
 ],'Classic Braveheart does not steal cards or grant revised-version follow-up damage.','Attack/Dodge cards are interchangeable; hand denial weakens both offense and defense.'),
 machao:guide(ol('20161025_3403_4116'),'Use mobility and Cavalry to pressure Dodge-dependent enemies.',[
  'Exploit reduced distance to reach the relevant enemy rather than attacking a convenient ally.',
  'Use Cavalry on meaningful Attacks; judge manipulation may change its success.',
  'Preserve a sustainable Attack supply; favorable hit chance is not guaranteed damage.'
 ],'Old Cavalry uses a red judgment, not revised skill suppression or suit-discard mechanics.','Cavalry may prevent Dodge; do not rely exclusively on a Dodge stockpile.'),
 huangyueying:guide(ol('20161025_8422_5316'),'Chain useful regular spells into fresh cards and new actions.',[
  'Use beneficial draw and control spells while their extra Cultivation draw can find more actions.',
  'Exploit distance-free Steal and delayed spell placement where legal; delayed spells do not give the regular-spell draw.',
  'Evaluate all allies before AOE; more cycling is not worth killing your own Lord.'
 ],'Do not end with useful regular spells solely to hoard cards.','She can keep drawing through regular spells; Acedia and hand denial interrupt her turn.'),
 sunquan:guide(ol('20161025_1853_0317'),'Cycle low-value cards toward the team need of this turn.',[
  'Use useful free draw/equipment first, then compare remaining redundant or unusable cards for Equilibrium.',
  'Seek damage and control when ahead, healing and defense when pressured; retain cards that serve the current plan.',
  'Include obsolete equipment if losing it is acceptable; commit all actual cost IDs in the current action.'
 ],'Do not forget the once-per-phase cycle or discard useful cards for an imaginary future plan.','Control his draw/play phase and hand; spare cards can become something useful.'),
 ganning:guide(ol('20161025_7148_0717'),'Trade cheap black cards for high-impact disruption.',[
  'Remove enemy reach, armor or a last defensive card before allied attacks.',
  'Remove harmful delayed spells from allies when their upcoming turn is important.',
  'Reserve black defense as needed; favor trades whose board impact exceeds the lost card.'
 ],'Ambushment is a one-for-one trade, not free card advantage.','Protect key equipment; a hand full of black cards is potential dismantling.'),
 lvmeng:guide(ol('20161025_6691_1217'),'Build a purposeful reserve without becoming a spectator.',[
  'Compare the actual discard saved by Composure with the value of attacking now.',
  'Still draw, equip, heal, control and develop threats while skipping Attack.',
  'Break Composure for lethal, major team pressure or a good attack; a Crossbow burst requires actual cards and reach.'
 ],'Do not indefinitely wait for Crossbow or forgo an easy win to hoard ordinary cards.','He can stockpile defense, but passivity can leave teammates exposed.'),
 huanggai:guide(ol('20161025_2321_1417'),'Spend HP for an actionable burst, with a stopping point.',[
  'Use Self Sacrifice when extra draws can find lethal, healing, a weapon or urgent control.',
  'Reevaluate HP, hand limit, rescue and useful remaining plays after every activation.',
  'A healthy Rebel near the Lord may justify an aggressive exchange; a fragile Lord must value survival.'
 ],'Do not pay HP repeatedly with no plausible payoff or rely on unknown allies rescuing you.','His burst can accelerate suddenly; prevent access to cards, reach or recovery.'),
 zhouyu:guide(ol('20161025_4408_1817'),'Exploit stable extra draw and selective finishing damage.',[
  'Use the extra card to maintain useful pressure each turn.',
  'Use Sowing Distrust for a valuable potential finish or distance-free pressure after checking your remaining hand.',
  'Spend valuable cards before risking gifting one at random; the recipient guesses before the random card transfers.'
 ],'Do not assume Sowing Distrust guarantees damage or lets you choose the gift.','His random transfer may give you a valuable card; the suit guess is not certainty.'),
 luxun:guide(ol('20161025_5482_2617'),'Use last-card cycling when it improves your position.',[
  'Sequence useful playable cards to reach Second Wind and reassess the new card.',
  'Recognize when an unplayable last card stalls cycling; do not throw away critical defense merely to empty your hand.',
  'Modesty protects only against Steal and Acedia, not other spells.'
 ],'Empty hand is not Empty Fortress, and drawing again can still leave you exposed.','Removing the last hand card may replenish it; use a meaningful timing or another target.'),
 xuchu:guide('https://sanguosha.com/news/20161025_5678_0818','Pay for Bared Bodied only when this turn can exploit the damage.',[
  'Before reducing draw, check Attack/Duel supply, reach, enemy defense and finishing chances.',
  'Draw and cycle available resources to find attacks during the boosted turn.',
  'Combine a meaningful hit with Wine where legal, but weigh losing a draw against missing the hit.'
 ],'The boost expires this turn. Saving Something Out of Nothing then discarding it does not preserve the burst.','His boosted Attack/Duel matters this turn; deny reach and cards or prevent the hit.'),
 lvbu:guide(ol('20161025_1128_2418'),'Turn double-response requirements into concentrated pressure.',[
  'Favor enemies unlikely to afford two Dodges or repeated pairs of Attacks.',
  'Use draw and reach to make actual Attack/Duel supply available.',
  'Wine increases a successful hit, but special defense, armor and redirection still matter.'
 ],'Unrivaled is not unlimited Attacks or armor bypass.','Budget two responses; a single Dodge is insufficient for his Attack.'),
 caocao:guide(ol('20161025_9512_5017'),'Recover valuable resolving damage cards without sacrificing survival.',[
  'Consider accepting affordable damage for a valuable AOE/card only if health and team impact justify it.',
  'Reusing AOE can swing the game; inspect every ally and enemy before replaying.',
  'As Lord, ask Wei characters for Dodge when needed, but do not assume their identity or cooperation.'
 ],'Treachery needs physical cards still resolving; fatal damage is not a profitable trade.','Damaging him can supply the same AOE for a counterattack.'),
 simayi:guide(ol('20161025_9476_5517'),'Spend judgment control on outcomes that change the game.',[
  'Keep an appropriate hand suit/rank for important Acedia, Rations, Lightning or Thunder Strike judgments.',
  'Compare replacing a judgment with its current outcome before paying a useful card.',
  'Retaliation can remove a key enemy equipment card or replenish your hand after survivable damage.'
 ],'Do not take dangerous damage just for a random card or change an already beneficial judgment.','His hand can change critical judgments; physical attack costs can return via Retaliation.'),
 xiahoudun:guide(ol('20161025_3111_5917'),'Use retaliation as deterrence while continuing ordinary pressure.',[
  'Trigger Staucness against an enemy when damage or discarding would weaken them.',
  'If the source is an ally, evaluate the retaliation downside rather than blindly activating.',
  'When choosing its punishment, compare HP safety with the value of the actual two cards.'
 ],'Retaliation is probabilistic and does not justify sacrificing survival.','Before dealing damage, account for the possible two-card cost or retaliatory damage.'),
 zhangliao:guide(ol('20161025_1888_0318'),'Deny enemy defensive resources before team attacks.',[
  'Prefer two meaningful enemy hands; denying Dodge, Peach and Negation enables allied damage.',
  'As Loyalist, preserve the Lord hand; as Rebel, focus Lord/core Loyalist resources.',
  'Compare one enemy card with two normal draws; draw normally if no worthwhile targets or fresh equipment/Attack access matters more.'
 ],'Assault replaces the whole draw. Taking an ally card merely to fill the second target can harm the team.','He denies hand resources but may lack fresh weapons or Attacks; equipment remains safer from Assault.'),
 guojia:guide(ol('20161025_9968_1118'),'Turn survivable damage into resources for the best users.',[
  'Distribute Legacy healing/defense to endangered allies and offense to allies who can immediately use it.',
  'Keep cards for yourself when exposed or best positioned to act; distribution is optional.',
  'Judgment cards can feed your hand, but planned damage must remain survivable.'
 ],'Do not gift enemies cards on a generic support plan or accept lethal damage expecting Legacy.','Damage can feed his whole team; weigh a decisive finish against incremental card gifts.'),
 zhenji:guide(ol('20161025_6540_1618'),'Exploit Luo River draws while retaining efficient black defense.',[
  'Usually continue Luo River while extra black cards help; consider known deck setup and hostile judgment control.',
  'Black hand cards can defend as Dodge, so reserve flexible low-value ones rather than all powerful black spells.',
  'Use new cards to equip and attack/control; strong Dodge defense does not stop Duel, AOE or elemental spells.'
 ],'Do not equate a large black hand with immunity or suppress all offense to stockpile.','Use non-Dodge pressure or hand denial; judgment control can interrupt her draw engine.'),
 liubei:guide(ol('20161024_3693_3617'),'Put cards into the hands that can create the most team value.',[
  'Give Attacks/reach to offensive allies and defense/healing to the endangered Lord or teammate.',
  'When wounded, combine two total gifts this phase for the once-only heal; avoid wasting team resources chasing redundant healing.',
  'Retain essential self-defense and use Influencing only with a concrete legal Attack objective and plausible Shu support.'
 ],'Benevolence does not draw cards. A Spy gift helps a future opponent; a Loyalist should not strengthen a likely Rebel.','His gifts fuel specialist allies; track recipients and disruption of the support chain.'),
 zhugeliang:guide(ol('20161025_6160_1616'),'Plan judgments, your draws and the next seat together.',[
  'Arrange upcoming delayed-spell judgments before selecting your draw cards.',
  'Put useful draws on top for yourself; only then consider cards the next player is likely to draw.',
  'Use Empty Fortress selectively when it improves safety; weigh keeping Peach/Negation and enemy AOE.'
 ],'Do not discard useful resources just to become empty: only Attack and Duel targeting are blocked.','Empty Fortress has narrow protection; other damage/control and seat-order deck manipulation still matter.'),
 daqiao:guide(ol('20161025_8500_2217'),'Suppress the enemy turn while reserving a viable redirect.',[
  'Use cheap Diamond cards as Acedia on the Lord or core enemy according to your role.',
  'Keep an expendable card if Deflection can redirect dangerous Attacks toward a useful enemy.',
  'Check resulting range after paying equipment and avoid redirecting into an ally without concrete benefit.'
 ],'Deflection cannot return the Attack to its original attacker; it costs a real card.','An Attack may be redirected to another player; choose the attack timing and target carefully.'),
 sunshangxiang:guide(ol('20161025_3236_2917'),'Cycle equipment and convert spare cards into team healing.',[
  'Replacing or spending equipped cards can trigger Daredevil draws; evaluate the resulting equipment state.',
  'Use Betrothment on a wounded male ally when two low-value cards buy valuable recovery.',
  'Exploit drawn cards before ending; retain enough defense to survive between turns.'
 ],'Cards merely held in hand are not equipped; losing hand equipment alone does not trigger Daredevil.','Removing equipped cards gives her draws; a wounded male ally can be healed with her.'),
 huatuo:guide(ol('20161025_9121_2018'),'Keep the team alive while protecting its healer.',[
  'Use Prodigal Healer on the most important wounded ally or yourself for one low-value hand card.',
  'Reserve suitable red cards for out-of-turn First Aid, especially when the Lord is endangered.',
  'Equip defensively and keep sufficient HP; your living future healing can exceed one extra attack.'
 ],'First Aid is outside your turn; do not gift survival to an enemy without a role-specific reason.','Hand denial and focused pressure can remove the red rescue reserve.'),
 diaochan:guide(ol('20161025_7443_2718'),'Use ordered Duels to force unfavorable enemy exchanges.',[
  'Pay a cheap card and choose two males based on likely Attack supply, damage triggers and team benefit.',
  'Target order matters: the first selected male must answer with Attack first in this implementation.',
  'Exploit the unnegatable Duel while keeping sufficient defense; the end-phase draw supports repeated control.'
 ],'Do not pair vulnerable allies blindly; account for Lv Bu double responses and Cao Cao/Guo Jia benefits.','Duel pressure bypasses ordinary Dodge defense; selected source and damage recipient matter.'),
 huangzhong:guide(ol('20161026_7095_5710'),'Select targets where old Fiery Bow prevents Dodge.',[
  'Compare enemy hand count with your HP and attack range; use supplied Fiery Bow availability facts.',
  'Long-range weapons widen the low-hand-count condition and access to finishing targets.',
  'Use Wine for a valuable reliable hit when armor and prevention do not defeat it.'
 ],'This is OLD Fiery Bow: no attack-rank range, no automatic extra damage, no revised hand comparison.','Dodge may be unavailable at either extreme of hand count.', 'Mixed-version official guide: use only old hand-count/HP/range condition; newer bonuses excluded.'),
 weiyan:guide(ol('20161026_9772_0011'),'Make damage at distance one also restore your HP.',[
  'Use -1 Horse and target access to put valuable enemies within distance one.',
  'Compare hit probability and potential recovery when choosing Attack or spell targets.',
  'At full health prioritize team damage; healing is not permission to attack an ally.'
 ],'Long weapon range alone is not distance one. No Qimou or draw-instead-of-heal upgrade here.','Distance-one damage may heal him; distance control can deny recovery.', 'Source discusses revised Wei Yan too; only classic distance-one recovery is used; tactics are rule-derived adaptations.'),
 pangtong:guide(ol('20161026_9867_1611'),'Use Clubs flexibly for elemental setup or cycling.',[
  'Recast spare Clubs when no profitable chain setup exists.',
  'Chain enemies or unchain endangered allies with future elemental damage and order in mind.',
  'Use Nirvana when survival requires it; a reset loses cards/equipment/judgments and does not make reckless damage free.'
 ],'Do not chain an endangered ally just to create more targets or waste valuable Club spells automatically.','His one-time reset changes lethal calculations; chain setup can spread elemental damage.'),
 wolong:guide(ol('20161026_7706_1711'),'Budget black counters and red fire costs for team control.',[
  'Reserve some cheap black cards for crucial Negation, not every black card regardless of pressure.',
  'Use Flame Tactic when enough suit coverage and a valuable fire target justify reveal plus discard.',
  'Armorless Eight Trigrams can defend; compare a new armor benefit against losing that innate effect.'
 ],'Fire Stratagem is expensive; one red card does not guarantee a successful fire hit.','Black hand cards can counter spells; fire pressure uses extra resources.'),
 menghuo:guide(ol('20161026_2573_3112'),'Balance Arise recovery with normal draw and source consequences.',[
  'At low lost HP, two normal draws may beat replacing them with too few reveals.',
  'At substantial lost HP, compare Heart recovery and non-Heart gains with immediate survival/card needs.',
  'Account for being Barbarian damage source when retaliation, kills and team effects resolve.'
 ],'Arise replaces draw, not extra draw; Barbarian immunity does not mean immunity to every AOE.','Barbarian cannot damage him and he becomes its damage source; other pressure remains effective.'),
 zhurong:guide(ol('20161026_7999_3112'),'Reuse Barbarian and convert successful hits into valuable steals.',[
  'Evaluate allied casualties and source effects before replaying a recovered Barbarian.',
  'After dealing Attack damage, Pindian with an expendable high card when a valuable enemy card is likely obtainable.',
  'Decline Fiery Blade when card quality, enemy rank information or defenses make the wager poor.'
 ],'Do not spend a precious high Peach for a speculative steal or open harmful AOE just because it was free.','She may recover physical Barbarian; an Attack hit can lead to Pindian and theft.'),
 taishici:guide(ol('20161026_3667_2211'),'Commit Pindian costs only when enhanced attacks or denial pay.',[
  'Reserve a strong rank for Justice of Heaven and enough actual Attacks to exploit victory.',
  'Use victory to reach priority enemies and additional targets; reassess the board after each hit.',
  'A denial-only Pindian may be worthwhile without Attacks, but compare both lost cards and your once-per-phase use.'
 ],'Losing prevents Attack this turn. Do not gamble away your only useful Attack without a payoff.','High rank hand cards resist Pindian; a win lets him attack more and ignore distance.'),
 sunjian:guide(ol('20161026_3293_2812'),'Convert lost HP into the best ally refill or enemy tax.',[
  'Choose draw X/discard one for a useful ally, or draw one/discard X to strip an enemy.',
  'Evaluate X and actual cards available; at one lost HP the effects mainly cycle a card.',
  'Recover when threatened; future Heroic Spirit value requires surviving until Preparation.'
 ],'Do not lower HP indiscriminately or use enemy-discard mode on an ally by confusing mode order.','His lost HP powers future control; delaying or finishing him can deny that value.'),
 xiaoqiao:guide(ol('20161026_5527_0411'),'Redirect damage with both recipient survival and refill in mind.',[
  'Keep an effective Heart hand card; Spades count as Hearts under Rosy Cheeks.',
  'Redirect large damage to a valuable enemy when their survival draw does not outweigh harm.',
  'Feeding a survivable damage-trigger ally can work, but verify HP, chain spread and later card advantage.'
 ],'A heavily wounded enemy can draw many cards after surviving; transfer is not a free offensive hit.','Do not ignore redirected damage and resulting refill when attacking her.'),
 zhoutai:guide('https://gltjk.com/sanguosha/rules/card/hero/wu.html','Treat old Undying as risky survival, not infinite health.',[
  'Use Undying to survive when needed; duplicate wound ranks create a real rescue/death risk.',
  'When removing wounds, break duplicate ranks first if possible; reduce future collision risk.',
  'Keep advancing team victory; the old negative-HP hand limit is not a modern wound-count hand limit.'
 ],'No Fenji support skill or revised guaranteed 1-HP reset. Wound cards are not judgments.','Inspect public wound ranks and remaining survival risk rather than assuming invulnerability.', 'Old Wind only. Rule-derived strategy from the archived rule text and local implementation; newer OL strategy with Fenji excluded.'),
 xuhuang:guide(ol('20161026_4323_2512'),'Deny draws to enemies whose hands power their turns.',[
  'Use cheap black Basic/Equipment costs on a priority enemy within legal distance two.',
  'Prefer enemy draw engines or the Lord as Rebel, accounting for judgment manipulation.',
  'Retain enough black defense and existing equipment when the denial is unlikely to land.'
 ],'Do not confuse kingdom with team or supply an ally merely because the target is convenient.','Judgment control and removing the delayed spell can restore draw access.'),
 dianwei:guide(ol('20161026_1535_1311'),'Use direct damage to finish or decisively pressure a target.',[
  'Compare weapon discard with HP payment and the range after equipment loss.',
  'Sequence Attack and Forceful Assault so the chosen enemy remains reachable.',
  'A guaranteed finish may justify HP; ordinary one-for-one damage often does not.'
 ],'Avoid self-lethal HP payment with no secured win or discarding the weapon that supplies required reach.','Dodge cannot stop Forceful Assault; restrict distance or force expensive costs.'),
 pangde:guide(ol('20161026_2243_2411'),'Make dodged Attacks still disrupt valuable enemy cards.',[
  'Exploit Horse Riding to reach a team-priority target.',
  'When Horse Archery is offered, remove important armor, reach or a key hand resource.',
  'Account for equipment-loss benefits such as Daredevil or Silver Lion before choosing the card.'
 ],'A cheap hand card may be better to remove than equipment that rewards its owner on loss.','Dodging may still cost another card; plan equipment and hand defenses accordingly.'),
 zhangjiao:guide(ol('20161026_1897_1211'),'Turn Dodge responses and controlled Spade judgments into offense.',[
  'Keep Dodge and a suitable black retrial card when Thunder Strike can hit a valuable enemy.',
  'Use Devilish Arts to secure important judgments while considering cost and the obtained original card.',
  'As Lord, value Qun Yellow Heaven gifts; use chain thunder only after checking all recipients.'
 ],'Old Thunder Strike requires Spade for two thunder damage; no revised Club healing or other upgrades.','Do not casually feed him Dodge triggers; prevent his judgment control or use non-Dodge threats.', 'Old Wind Thunder Strike/Devilish Arts/Yellow Heaven only; filter revised skill details from source.'),
 yanliangwenchou:guide(ol('20161026_7932_2312'),'Trade normal draw for a hand-supported Duel burst.',[
  'Before Heroic Duo, compare hand colors and Attack supply with the normal two-card draw.',
  'After its judgment, convert only the opposite-color hand cards into Duel and target enemies unable to answer.',
  'Leave actual Attack responses for your own Duels; consider damage-trigger opponents and kill rewards.'
 ],'You gain the judgment card, not a normal full draw; no revised two-card reveal or damage recovery here.','His current judgment determines Duel fuel; pressuring his hand before his turn limits burst.'),
 yuanshao:guide('https://www.sanguosha.cn/hero-detail-41.html','Convert matching suits into team-profitable AOE pressure.',[
  'Count enemy and allied exposure before each Raving Slash; low-HP allies can make AOE losing.',
  'Use cheap same-suit pairs while retaining essential defense; reassess after deaths and reward draws.',
  'As Lord, use the actual Bloodline hand limit to plan reserves rather than assuming normal HP limit.'
 ],'Do not fire blindly or assume revised AOE excludes allies, draws on Dodge, or recovers its cost.','Dodge resources may be exhausted by repeated AOE; support damage-trigger allies carefully.'),
 xiahouyuan:guide(ol('20161026_5172_0111'),'Exchange skipped phases for precisely valuable distant Attacks.',[
  'First God Speed can avoid bad judgments and reach a finishing target, but costs the normal draw.',
  'Second God Speed spends equipment and skips the entire Play Phase; compare every useful card/skill you forgo.',
  'Use ordinary play instead when draw, healing, control or several actions outweigh one Attack.'
 ],'A free-looking Attack still has phase opportunity cost; no Attack card is required for the skill-created hit.','Distance alone is not safety; phase denial can make his first God Speed more attractive.'),
 yuji:guide(ol('20161026_8184_0611'),'Use credible Heart claims and selective bluffs, not indiscriminate claims.',[
  'A truthful Heart can resolve even when challenged; consider using its actual identity when no deception benefit exists.',
  'Unchallenged claims can turn low-value cards into needed actions, but inspect positive-HP challengers and their incentives.',
  'As challenger, weigh truthful-claim HP loss against stopping a false or non-Heart claim; allies need not challenge each other.'
 ],'Old Bewilder has no once-per-turn or curse system. A truthful non-Heart fails if challenged.','Challenge only with enough HP and a reason; exposing a true claim costs HP.', 'Old Wind Bewilder only; truthful Heart requirement and HP-based challenge eligibility follow local skills.'),
 dongzhuo:guide('https://www.sanguosha.cn/hero-detail-45.html','Use early HP and Wine pressure before Breakdown erodes the advantage.',[
  'Use a cheap Spade as Wine only when a useful Attack can follow or during legal self-rescue.',
  'Against female targets compare double-Dodge pressure; female attackers also require you to Dodge twice.',
  'For Breakdown, compare immediate HP safety with permanent maximum-HP loss and future healing/hand limits.'
 ],'No revised rule disables Breakdown after a Wine hit. Avoid stalling indefinitely behind high starting HP.','Time erodes his HP or maximum HP; female interactions are dangerous for both sides.'),
};

export function generalStrategyContext(view,playerId,prompt){
 const own=view.players.find(p=>p.id===playerId),id=own?.general?.id;
 if(!id){if(prompt.zone!=='general')return null;return {candidateNotes:prompt.options.filter(o=>GENERAL_STRATEGIES[o.id]).map(o=>({generalId:o.id,plan:GENERAL_STRATEGIES[o.id].plan})),notice:'Select for your role, allies, seat and classic skill text; no universal best general.'};}
 const g=GENERAL_STRATEGIES[id];if(!g)return null;
 return {generalId:id,generalName:own.general.name,...g,provenance:'Researched English synthesis with implementation-specific tactical inferences; not a proven optimal policy. Skill text and current legal choices override external versions.',matchups:view.players.filter(p=>p.alive&&p.id!==playerId&&GENERAL_STRATEGIES[p.general?.id]).map(p=>({playerId:p.id,generalId:p.general.id,note:GENERAL_STRATEGIES[p.general.id].facing}))};
}
