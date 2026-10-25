# General strategy playbooks

Expanded 2026-10-25. Covers all 44 supported generals. The Chinese official OL classic strategy series is the starting point, supplemented by longer Chinese guides listed below. This is an original English synthesis with explicit implementation-specific deductions and hypothetical examples, not a translation of whole articles or a demonstrated optimal policy. Some older official pages could only be read through indexed excerpts; a source link does not imply a full article was accessible.

The overview/priorities summarize researched principles. Detailed sequences, reserves, response decisions and examples are our own adaptations to the local classic rules. No numerical win-rate claims or fixed identity tier rankings are imported. Skill text, actionSpec and legal options always override these recommendations.

## Additional Chinese research

- [经典再现——诸葛亮, official mobile strategy centre, 2020-06-30](https://www.sanguosha.cn/pc/guide-info-111.html): detailed deck control and Empty Fortress trade-offs. The article mixes classic and revised versions. We exclude revised fixed observation counts and the second end-phase observation. We retain only transferable advice about judgment/draw ordering, playable hand structure and avoiding forced emptiness.
- [界孙权攻略, 4399 OL game channel, 2020-01-15](https://my.4399.com/yxsgs/ziliao/21718/): useful discussion of card quality, sequencing, known defensive reserves and full-hand cycling risk. This is explicitly a revised-version guide. Its extra full-hand draw, revised Rescue and unsupported matchups are excluded; classic Equilibrium here replaces exactly the discarded quantity.
- [早逝的先知，卖血流标杆——郭嘉, official OL, 2018-12-19](https://www.sanguosha.com/news/20181219_1211_3220): indexed excerpt confirms immediate Legacy support during AOE. Our recipient examples and survival calculations are local-rule deductions; the inaccessible full page is not claimed as reviewed.

## Runtime delivery

Only the acting general gets detailed tactics. Turn prompts receive sequencing, reserves and one worked example; response prompts receive reaction advice, reserves and an example; skill, selection and ordering decisions receive both relevant sequence and reaction advice. Other living generals contribute only short public matchup notes. General selection receives only offered candidate summaries. Nothing is fetched during play and this adds no LLM requests. Inspect generalStrategy.tactics in AI trace Input.

Examples are hypothetical, not assertions about the current hand. Hidden identities and cards must never be inferred from the manual as facts. Team advice uses the bot own role and public evidence; shared kingdom does not establish shared team. Improving guide coverage is not proof of improved model win rate; that needs fresh logged matches.

Version exclusions include new Fiery Bow, Wei Yan Qimou, Zhou Tai Fenji/modern wounds, Zhang Jiao Club healing and modern Yu Ji curses. The old rule text in this build wins over similarly named online variants.

## Guan Yu

Reliable Attack supply needs reach, not more redundant Attacks.

- Equip reach before spending valuable red cards; use a cheap red card as Attack when it enables meaningful pressure.
- Retain enough red conversion material for Duel and Barbarian responses; compare spending red equipment with losing its range.
- As Rebel, prioritize reaching the Lord; as Loyalist, use steady attacks to support team focus.

Avoid: Do not convert a useful Peach or equipped weapon when a cheaper Attack is available.

### Play sequence

Secure weapon/-1 Horse access, remove the intended victim armor if worthwhile, then choose the cheapest Attack or red conversion. With Crossbow, reevaluate every remaining red card after each hit; without it, do not convert several cards for an exhausted Attack allowance.

### Resource policy

Value a red card by both printed effect and Attack flexibility. Peach, a live Negation and the weapon supplying reach usually cost more than a redundant red card. Preserve one response when Duel/Barbarian pressure is credible.

### Skill and response decisions

Answer Attack requests with the lowest opportunity-cost legal red card. Before spending equipment, recalculate reach and defensive exposure; kingdom matching alone does not establish an ally.

### Worked example (hypothetical)

A spare red horse can be Attack fuel; a red Peach at 1 HP is usually survival, not cheap fuel.

Facing this general: His red cards can answer Attack requests; reducing range or removing cards limits him.

Version filter: Classic skills in this build; ignore revised, SP, national-war and mobile-only upgrades.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.com/news/20161025_4718_5415). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Zhang Fei

Turn a stock of Attacks into a focused burst.

- Develop reach and use draw cards before deciding the burst is finished.
- Concentrate repeated Attacks on a valuable enemy when exhausting their Dodge can secure a kill.
- Reassess after each hit, kill reward or lost weapon; unlimited uses do not remove range or armor.

Avoid: Do not stop after the ordinary one-Attack limit; do not waste every Attack into immunity.

### Play sequence

Draw first when safe, establish reach, strip key armor, then concentrate Attacks. Spend Wine on a likely connecting hit rather than before finding a target. After a Rebel kill, inspect reward cards for another attack chain.

### Resource policy

Attacks are immediately spendable burst resources, not redundant after the first use. A long weapon can be more valuable than one extra Attack. Keep enough defense to survive if no achievable kill exists.

### Skill and response decisions

Do not exhaust all Attacks answering an avoidable low-impact Duel when those cards can secure a team-winning burst; survival and mandatory response legality still take priority.

### Worked example (hypothetical)

An enemy used their last known Dodge: a second Attack now may be better than saving it for next turn.

Facing this general: Expect follow-up Attacks after one Dodge; deny his hand or reach.

Version filter: Classic skills in this build; ignore revised, SP, national-war and mobile-only upgrades.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.com/news/20161025_2537_0516). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Zhao Yun

Treat Attack and Dodge as one flexible reserve.

- Spend excess Dodges offensively when an Attack advances the team objective.
- Keep a convertible card for defense when exposed, but do not preserve all Attacks merely for hypothetical Dodges.
- Use the cheapest useful conversion and account for required Duel/Barbarian responses.

Avoid: Classic Braveheart does not steal cards or grant revised-version follow-up damage.

### Play sequence

Count Attack and Dodge together, then allocate offense and defense from the combined pool. Play draw/control to improve the attack before spending the last convertible card. Prefer meaningful pressure over keeping several equivalent defenses.

### Resource policy

One convertible card can cover either one Attack or one Dodge, not both. Elemental Attack effects and printed card value can make two convertible cards unequal; avoid wasting a useful elemental hit as a routine response.

### Skill and response decisions

Duel and Barbarian consume the same pool as Dodge defense. Check expected follow-up pressure before volunteering to spend the whole pool for a minor exchange.

### Worked example (hypothetical)

With three Dodges and no Attack, one Dodge can become offensive pressure while two remain available for defense.

Facing this general: Attack/Dodge cards are interchangeable; hand denial weakens both offense and defense.

Version filter: Classic skills in this build; ignore revised, SP, national-war and mobile-only upgrades.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.com/news/20161025_7664_2416). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Ma Chao

Use mobility and Cavalry to pressure Dodge-dependent enemies.

- Exploit reduced distance to reach the relevant enemy rather than attacking a convenient ally.
- Use Cavalry on meaningful Attacks; judge manipulation may change its success.
- Preserve a sustainable Attack supply; favorable hit chance is not guaranteed damage.

Avoid: Old Cavalry uses a red judgment, not revised skill suppression or suit-discard mechanics.

### Play sequence

Compare reachable priority enemies using actual distance reduction. Use removal against armor that Cavalry does not bypass, then Attack. Enable Cavalry for an important hit; a red judgment blocks Dodge, not every damage-prevention effect.

### Resource policy

Retain an actual Attack supply and reach. Cavalry is not permission to turn every hand into offense when the Lord needs rescue or your own HP is critical.

### Skill and response decisions

Judgment controllers can change Cavalry. Reassess known retrial resources rather than treating its average success as certainty; do not claim knowledge of hidden suits.

### Worked example (hypothetical)

A Dodge-heavy enemy is attractive; an immune armor target may still require equipment removal before attacking.

Facing this general: Cavalry may prevent Dodge; do not rely exclusively on a Dodge stockpile.

Version filter: Classic skills in this build; ignore revised, SP, national-war and mobile-only upgrades.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.com/news/20161025_3403_4116). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Huang Yueying

Chain useful regular spells into fresh cards and new actions.

- Use beneficial draw and control spells while their extra Cultivation draw can find more actions.
- Exploit distance-free Steal and delayed spell placement where legal; delayed spells do not give the regular-spell draw.
- Evaluate all allies before AOE; more cycling is not worth killing your own Lord.

Avoid: Do not end with useful regular spells solely to hoard cards.

### Play sequence

Resolve useful draw/control spells early and inspect each Cultivation draw before committing the next action. Use distance-free Steal for a priority resource. Delayed spells may be useful control but do not supply the regular-spell draw.

### Resource policy

A cheap useful spell may have both its printed effect and a replacement card. Do not discard draw-two merely to preserve hand size. Nevertheless a harmful AOE is not repaired automatically by one personal draw.

### Skill and response decisions

Negation is both team protection and a potential draw trigger when used legally. Counter important effects rather than manufacturing a counter war just to cycle cards.

### Worked example (hypothetical)

Steal an enemy armor, inspect the bonus draw, then decide whether the new Attack can exploit the exposed target.

Facing this general: She can keep drawing through regular spells; Acedia and hand denial interrupt her turn.

Version filter: Classic skills in this build; ignore revised, SP, national-war and mobile-only upgrades.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.com/news/20161025_8422_5316). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Sun Quan

Cycle low-value cards toward the team need of this turn.

- Use useful free draw/equipment first, then compare remaining redundant or unusable cards for Equilibrium.
- Seek damage and control when ahead, healing and defense when pressured; retain cards that serve the current plan.
- Include obsolete equipment if losing it is acceptable; commit all actual cost IDs in the current action.

Avoid: Do not forget the once-per-phase cycle or discard useful cards for an imaginary future plan.

### Play sequence

Identify the desired next action before Equilibrium: find reach, a finisher, healing or defense. Use safe draw cards and obvious useful effects first when they add information. Cycle redundant/unusable cards, then reassess all new cards before ending.

### Resource policy

Keep known high-value Peach/Negation/reach when unknown replacements are worse for the current need. Classic Equilibrium draws exactly the number discarded: emptying your hand has no bonus. Equipped cards can also be costs, with their loss evaluated.

### Skill and response decisions

Response cards kept for a concrete upcoming threat are useful; keeping every Dodge while discarding an unused draw spell is not a plan. At critical HP, value reliable recovery above speculative burst.

### Worked example (hypothetical)

Keep the Peach needed by a dying Lord and cycle two redundant Attacks; do not full-cycle for an absent revised-version bonus.

Facing this general: Control his draw/play phase and hand; spare cards can become something useful.

Version filter: Classic skills in this build; ignore revised, SP, national-war and mobile-only upgrades.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.com/news/20161025_1853_0317). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Gan Ning

Trade cheap black cards for high-impact disruption.

- Remove enemy reach, armor or a last defensive card before allied attacks.
- Remove harmful delayed spells from allies when their upcoming turn is important.
- Reserve black defense as needed; favor trades whose board impact exceeds the lost card.

Avoid: Ambushment is a one-for-one trade, not free card advantage.

### Play sequence

Use cheap black cards to dismantle an enemy key defense before allied damage. Compare direct printed use with conversion: a black Steal can both deny and gain, while a black Negation may protect a whole turn. Resolve draw before choosing final costs when safe.

### Resource policy

Reserve enough black cards for defense/counters if exposed. Choose armor, reach, delayed spells or hidden hand according to the objective; removing enemy Acedia may help them and needs an explicit reason.

### Skill and response decisions

Against equipment-loss benefits, inspect the compensation. Burning a Silver Lion can heal its owner; triggering Sun Shang Xiang draws may be worse than stripping a hand card.

### Worked example (hypothetical)

Remove Vine before the team normal-Attacks; preserve Vine if a prepared fire hit is the stronger finish.

Facing this general: Protect key equipment; a hand full of black cards is potential dismantling.

Version filter: Classic skills in this build; ignore revised, SP, national-war and mobile-only upgrades.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.com/news/20161025_7148_0717). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Lv Meng

Build a purposeful reserve without becoming a spectator.

- Compare the actual discard saved by Composure with the value of attacking now.
- Still draw, equip, heal, control and develop threats while skipping Attack.
- Break Composure for lethal, major team pressure or a good attack; a Crossbow burst requires actual cards and reach.

Avoid: Do not indefinitely wait for Crossbow or forgo an easy win to hoard ordinary cards.

### Play sequence

Compare an achievable Attack/kill with the actual cards Composure would save. Play useful draw, control, healing and equipment even when planning to skip Attack. After using Attack, abandon the imaginary no-discard benefit and spend excess efficiently.

### Resource policy

Stockpile cards with a future delivery mechanism: Crossbow, reach and Attacks can create a burst. A huge hand alone does not win, and leaving a free draw card unused loses options.

### Skill and response decisions

An Attack response outside your Play Phase is not automatically the same as using Attack during it; obey supplied hand-economy facts. Respond to survive rather than assuming every Attack-related action breaks Composure.

### Worked example (hypothetical)

If a reliable enemy kill is available, compare its reward and team impact with saving two excess cards instead of always hoarding.

Facing this general: He can stockpile defense, but passivity can leave teammates exposed.

Version filter: Classic skills in this build; ignore revised, SP, national-war and mobile-only upgrades.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.com/news/20161025_6691_1217). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Huang Gai

Spend HP for an actionable burst, with a stopping point.

- Use Self Sacrifice when extra draws can find lethal, healing, a weapon or urgent control.
- Reevaluate HP, hand limit, rescue and useful remaining plays after every activation.
- A healthy Rebel near the Lord may justify an aggressive exchange; a fragile Lord must value survival.

Avoid: Do not pay HP repeatedly with no plausible payoff or rely on unknown allies rescuing you.

### Play sequence

Before each Bitter Flesh, calculate post-loss HP, rescue availability and the actions new cards could enable. Establish Crossbow/reach when possible, draw, then stop to use the gained cards. Recalculate after every activation; do not enqueue repeated HP payments.

### Resource policy

At low HP, a Peach may finance another safe activation, but spending it removes rescue security. Without a concrete offensive or recovery outlet, additional cards can simply become forced discards.

### Skill and response decisions

HP loss is not damage: do not expect damage-trigger compensation. At 1 HP, activation can enter dying before the promised cards arrive; an unconfirmed ally rescue is not guaranteed.

### Worked example (hypothetical)

At 2 HP with no healing or secured kill, keeping a survivable hand can beat another activation that leaves you at 1 HP.

Facing this general: His burst can accelerate suddenly; prevent access to cards, reach or recovery.

Version filter: Classic skills in this build; ignore revised, SP, national-war and mobile-only upgrades.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.com/news/20161025_2321_1417). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Zhou Yu

Exploit stable extra draw and selective finishing damage.

- Use the extra card to maintain useful pressure each turn.
- Use Sowing Distrust for a valuable potential finish or distance-free pressure after checking your remaining hand.
- Spend valuable cards before risking gifting one at random; the recipient guesses before the random card transfers.

Avoid: Do not assume Sowing Distrust guarantees damage or lets you choose the gift.

### Play sequence

Use Heroic Bearing resources, ordinary draw/control, then evaluate Estrangement with a cheap cost. Choose a strategically useful target, not merely the next seat. Reassess offense after the random gift/possible damage resolves.

### Resource policy

Estrangement trades a card for uncertain damage and gives the target that card. Avoid gifting Peach/Negation to a threatened enemy when a cheaper alternative exists; do not assume you can choose the random gift afterward.

### Skill and response decisions

When guessing, use only observed information about the cost pool; no suit is guaranteed without evidence. As user, distinguish possible damage from a secured finish.

### Worked example (hypothetical)

A 1-HP enemy may survive by guessing correctly and receiving your card; do not treat the skill as guaranteed lethal.

Facing this general: His random transfer may give you a valuable card; the suit guess is not certainty.

Version filter: Classic skills in this build; ignore revised, SP, national-war and mobile-only upgrades.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.com/news/20161025_4408_1817). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Lu Xun

Use last-card cycling when it improves your position.

- Sequence useful playable cards to reach Second Wind and reassess the new card.
- Recognize when an unplayable last card stalls cycling; do not throw away critical defense merely to empty your hand.
- Modesty protects only against Steal and Acedia, not other spells.

Avoid: Empty hand is not Empty Fortress, and drawing again can still leave you exposed.

### Play sequence

Plan whether the remaining hand can actually be used. Spend low-opportunity-cost cards in a sequence that reaches zero and triggers Second Wind, then reassess the new card. Never waste a winning control card merely to complete a cycle.

### Resource policy

A single unusable card can obstruct cycling; a single useful Peach may still be worth keeping. Modesty blocks specified control, not all spells, damage or theft effects.

### Skill and response decisions

A legal response that spends your last hand card can replenish you. Count response costs and follow-up danger; do not assume Second Wind replaces equipment lost from the equipment area.

### Worked example (hypothetical)

If your last hand card is a playable equipment, equipping it may both improve the board and open a fresh draw.

Facing this general: Removing the last hand card may replenish it; use a meaningful timing or another target.

Version filter: Classic skills in this build; ignore revised, SP, national-war and mobile-only upgrades.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.com/news/20161025_5482_2617). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Xu Zhu

Pay for Bared Bodied only when this turn can exploit the damage.

- Before reducing draw, check Attack/Duel supply, reach, enemy defense and finishing chances.
- Draw and cycle available resources to find attacks during the boosted turn.
- Combine a meaningful hit with Wine where legal, but weigh losing a draw against missing the hit.

Avoid: The boost expires this turn. Saving Something Out of Nothing then discarding it does not preserve the burst.

### Play sequence

At the draw replacement decision, inspect current Attacks/Duels, reach, enemy defense and likely forced hits. After choosing Bared Bodied, use draw-two and control to find a connecting hit this turn. The bonus expires; ending with unused draw-two needs a concrete justification.

### Resource policy

Trading one draw for damage is attractive only if the boosted damage can land and help your role. Retain enough Attack responses to win a chosen Duel; losing that Duel is not your outgoing boosted hit.

### Skill and response decisions

Evaluate armor, Dodge denial and Axe costs before committing Wine/Attack. Damage-trigger enemies may benefit from a small boosted hit unless it finishes or decisively pressures them.

### Worked example (hypothetical)

Bared Bodied active, draw-two in hand, legal targets present: resolve draw-two and reconsider rather than ending to save it for later.

Facing this general: His boosted Attack/Duel matters this turn; deny reach and cards or prevent the hit.

Version filter: Classic skills in this build; ignore revised, SP, national-war and mobile-only upgrades.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://sanguosha.com/news/20161025_5678_0818). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Lv Bu

Turn double-response requirements into concentrated pressure.

- Favor enemies unlikely to afford two Dodges or repeated pairs of Attacks.
- Use draw and reach to make actual Attack/Duel supply available.
- Wine increases a successful hit, but special defense, armor and redirection still matter.

Avoid: Unrivaled is not unlimited Attacks or armor bypass.

### Play sequence

Pressure enemies with insufficient response supply, but check armor and reach first. Duel can exploit the double-Attack demand; choose a victim whose likely response stock and damage triggers make that exchange profitable.

### Resource policy

Peerless improves response pressure, not your supply. Preserve your own Attack responses for Duel; extra Dodges in an enemy hand are not proof they can meet both requirements.

### Skill and response decisions

When involved in a Duel, inspect who must supply two responses and who deals resulting damage. Do not infer that your passive makes you immune to losing the exchange.

### Worked example (hypothetical)

A one-card hand is vulnerable to double Dodge requirements, unless another legal defense or armor can replace them.

Facing this general: Budget two responses; a single Dodge is insufficient for his Attack.

Version filter: Classic skills in this build; ignore revised, SP, national-war and mobile-only upgrades.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.com/news/20161025_1128_2418). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Cao Cao

Recover valuable resolving damage cards without sacrificing survival.

- Consider accepting affordable damage for a valuable AOE/card only if health and team impact justify it.
- Reusing AOE can swing the game; inspect every ally and enemy before replaying.
- As Lord, ask Wei characters for Dodge when needed, but do not assume their identity or cooperation.

Avoid: Treachery needs physical cards still resolving; fatal damage is not a profitable trade.

### Play sequence

When damaged, value the recoverable physical card and safe HP against the cost of accepting damage. Recovered AOE is an option: count the full table before replaying. As Lord, prioritize staying alive over acquiring an impressive spell.

### Resource policy

Keep enough defense that repeated hits cannot convert your desired card gain into death. Skill-created damage may have no physical card to recover; inspect the offered choices.

### Skill and response decisions

Request Wei Dodge support only for a live threat and stop according to the actual request result. Do not repeatedly ask one responder indefinitely or assume every Wei character is loyal.

### Worked example (hypothetical)

Recovering Barbarian may be valuable; immediately replaying it while two allies are dying may lose despite the personal card gain.

Facing this general: Damaging him can supply the same AOE for a counterattack.

Version filter: Classic skills in this build; ignore revised, SP, national-war and mobile-only upgrades.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.com/news/20161025_9512_5017). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Sima Yi

Spend judgment control on outcomes that change the game.

- Keep an appropriate hand suit/rank for important Acedia, Rations, Lightning or Thunder Strike judgments.
- Compare replacing a judgment with its current outcome before paying a useful card.
- Retaliation can remove a key enemy equipment card or replenish your hand after survivable damage.

Avoid: Do not take dangerous damage just for a random card or change an already beneficial judgment.

### Play sequence

Rank pending judgments by impact: saving a Play/Draw Phase or averting lethal Lightning can exceed marginal card value. Inspect the current result before retrial. Your hand cost must change the outcome or obtain a concrete secondary benefit.

### Resource policy

Preserve the suits/ranks that cover important near-term judgments, but not every card forever. Feedback can obtain equipment as well as hidden hand; a known key weapon may beat a random card.

### Skill and response decisions

If another retrial user acts later, your replacement may not be final. Use visible seat order and legal retrial information rather than assuming control is uncontested.

### Worked example (hypothetical)

Acedia already shows Heart on your ally: passing can save the retrial card for an actual failed judgment.

Facing this general: His hand can change critical judgments; physical attack costs can return via Retaliation.

Version filter: Classic skills in this build; ignore revised, SP, national-war and mobile-only upgrades.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.com/news/20161025_9476_5517). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Xiahou Dun

Use retaliation as deterrence while continuing ordinary pressure.

- Trigger Staucness against an enemy when damage or discarding would weaken them.
- If the source is an ally, evaluate the retaliation downside rather than blindly activating.
- When choosing its punishment, compare HP safety with the value of the actual two cards.

Avoid: Retaliation is probabilistic and does not justify sacrificing survival.

### Play sequence

Continue normal offense; Staucness is deterrence, not a resource engine to farm indiscriminately. After damage, compare the source team and available punishment before activating. Against enemies, resource tax can matter even when retaliation does not deal damage.

### Resource policy

For the punishment choice, two worthless cards may be cheaper than HP; a Peach plus live Negation may be dearer. Base the choice on actual cards and survival, not a fixed always-discard policy.

### Skill and response decisions

Friendly damage may be part of a useful AOE, but retaliation can erase that benefit. Do not punish an ally automatically because an activation button is available.

### Worked example (hypothetical)

At 1 HP with two expendable cards, discard can preserve life; at safe HP with two crucial rescue cards, taking damage may be cheaper.

Facing this general: Before dealing damage, account for the possible two-card cost or retaliatory damage.

Version filter: Classic skills in this build; ignore revised, SP, national-war and mobile-only upgrades.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.com/news/20161025_3111_5917). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Zhang Liao

Deny enemy defensive resources before team attacks.

- Prefer two meaningful enemy hands; denying Dodge, Peach and Negation enables allied damage.
- As Loyalist, preserve the Lord hand; as Rebel, focus Lord/core Loyalist resources.
- Compare one enemy card with two normal draws; draw normally if no worthwhile targets or fresh equipment/Attack access matters more.

Avoid: Assault replaces the whole draw. Taking an ally card merely to fill the second target can harm the team.

### Play sequence

At Draw, compare two normal unknown draws with the denial value and likely quality of each eligible hand. Prefer stripping enemy defense before teammates act. Choose zero for normal draw when no profitable theft exists; one target gives only one stolen card.

### Resource policy

Need a fresh weapon/Attack? Enemy tiny hands may supply only a saved response. Do not steal the Lord as Loyalist merely to obtain a second target. A known enemy key card can justify a one-target theft despite losing card quantity.

### Skill and response decisions

An ally theft is exceptional: explicitly check whether removing their final card activates beneficial Empty Fortress or Second Wind and whether that benefit exceeds the lost card. Never use kingdom or a vague support objective as permission.

### Worked example (hypothetical)

Only your allied Lord has cards and no beneficial last-card trigger: normal draw-two is usually better than taking one of their defenses.

Facing this general: He denies hand resources but may lack fresh weapons or Attacks; equipment remains safer from Assault.

Version filter: Classic skills in this build; ignore revised, SP, national-war and mobile-only upgrades.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.com/news/20161025_1888_0318). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Guo Jia

Turn survivable damage into resources for the best users.

- Distribute Legacy healing/defense to endangered allies and offense to allies who can immediately use it.
- Keep cards for yourself when exposed or best positioned to act; distribution is optional.
- Judgment cards can feed your hand, but planned damage must remain survivable.

Avoid: Do not gift enemies cards on a generic support plan or accept lethal damage expecting Legacy.

### Play sequence

For each Legacy pair, assign cards by immediate usability and survival. During AOE, an ally still waiting to respond may use a gifted Attack/Dodge right away. Keep cards yourself when you need them; distributing is optional and keeping needs no self-target.

### Resource policy

Keep healing/defense when vulnerable; pass reach and Attack fuel to a specialist whose turn is near. Gifts to a likely enemy require an explicit role-winning reason, not the generic label support.

### Skill and response decisions

Before accepting damage, calculate the whole hit, dying risk and possible later hits. Legacy is compensation after damage, not damage reduction; no supply is valuable if you cannot survive to use it.

### Worked example (hypothetical)

An ally later in Barbarian resolution lacks Attack: give the freshly drawn Attack now; retain the other card if it protects you.

Facing this general: Damage can feed his whole team; weigh a decisive finish against incremental card gifts.

Version filter: Classic skills in this build; ignore revised, SP, national-war and mobile-only upgrades.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.com/news/20161025_9968_1118). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Zhen Ji

Exploit Luo River draws while retaining efficient black defense.

- Usually continue Luo River while extra black cards help; consider known deck setup and hostile judgment control.
- Black hand cards can defend as Dodge, so reserve flexible low-value ones rather than all powerful black spells.
- Use new cards to equip and attack/control; strong Dodge defense does not stop Duel, AOE or elemental spells.

Avoid: Do not equate a large black hand with immunity or suppress all offense to stockpile.

### Play sequence

Continue productive Luo River judgments, inspect gained cards, then develop equipment/control and useful offense. A large hand increases flexibility but may still exceed your HP limit at discard. Spend useful draw spells rather than throwing them away later.

### Resource policy

Reserve cheap black cards as flexible Dodge; preserve a strong black spell when another black card can cover the same response. Red cards cannot use the conversion simply because Luo River obtained them.

### Skill and response decisions

Duel, Barbarian and elemental/control pressure can bypass Dodge-heavy defense. Against hostile retrial, account for the possibility of a red stop without assuming unseen cards.

### Worked example (hypothetical)

Two black cards remain: use the redundant black Attack for Dodge before sacrificing a Negation that can save the Lord turn.

Facing this general: Use non-Dodge pressure or hand denial; judgment control can interrupt her draw engine.

Version filter: Classic skills in this build; ignore revised, SP, national-war and mobile-only upgrades.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.com/news/20161025_6540_1618). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Liu Bei

Put cards into the hands that can create the most team value.

- Give Attacks/reach to offensive allies and defense/healing to the endangered Lord or teammate.
- When wounded, combine two total gifts this phase for the once-only heal; avoid wasting team resources chasing redundant healing.
- Retain essential self-defense and use Influencing only with a concrete legal Attack objective and plausible Shu support.

Avoid: Benevolence does not draw cards. A Spy gift helps a future opponent; a Loyalist should not strengthen a likely Rebel.

### Play sequence

Form a concrete recipient-and-use plan before gifting. An offensive ally with reach can use Attack now/next turn; an endangered Lord needs defense now. Track total gifts toward the once-per-phase two-card heal and reassess after it triggers.

### Resource policy

Keep essential self-defense and personally usable draw/control unless a recipient uses them better. Two gifts heal once; further gifts do not keep healing. Shared Shu faction is not shared identity.

### Skill and response decisions

Influencing must have an actionable Attack objective and willing Shu support. A declined request should update the decision rather than repeating forever. Do not feed a known Rebel while defending the Lord without a concrete winning exception.

### Worked example (hypothetical)

Lord Liu Bei, one Spy and one Rebel remain: default to self-preservation and enemy denial, not routine gifts to the Rebel.

Facing this general: His gifts fuel specialist allies; track recipients and disruption of the support chain.

Version filter: Classic skills in this build; ignore revised, SP, national-war and mobile-only upgrades.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.com/news/20161024_3693_3617). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Zhuge Liang

Plan judgments, your draws and the next seat together.

- Arrange upcoming delayed-spell judgments before selecting your draw cards.
- Put useful draws on top for yourself; only then consider cards the next player is likely to draw.
- Use Empty Fortress selectively when it improves safety; weigh keeping Peach/Negation and enemy AOE.

Avoid: Do not discard useful resources just to become empty: only Attack and Duel targeting are blocked.

### Play sequence

Lay out the actual consumption order: your pending judgments, your expected draws, then any remaining known cards for the next seat. Put exact required suits/ranks into judgment positions before choosing attractive draws. Do not assume delayed-spell order or intervening draws not shown by the game.

### Resource policy

Keep Peach/Negation or a workable defensive hand when forced emptying costs too much. If planning Empty Fortress, select draws that can genuinely leave hand this turn. An unusable last card can destroy the whole defensive plan.

### Skill and response decisions

Empty Fortress blocks Attack and Duel targeting, not AOE, fire spells, skills or all damage. Hostile card gifts can break emptiness. Retrial users may invalidate your planned judgment; preserve a fallback when possible.

### Worked example (hypothetical)

Acedia pending: place a Heart for its judgment, then your two useful draws; do not put the best weapon first and lose the Play Phase.

Facing this general: Empty Fortress has narrow protection; other damage/control and seat-order deck manipulation still matter.

Version filter: Classic skills in this build; ignore revised, SP, national-war and mobile-only upgrades.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.com/news/20161025_6160_1616). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Da Qiao

Suppress the enemy turn while reserving a viable redirect.

- Use cheap Diamond cards as Acedia on the Lord or core enemy according to your role.
- Keep an expendable card if Deflection can redirect dangerous Attacks toward a useful enemy.
- Check resulting range after paying equipment and avoid redirecting into an ally without concrete benefit.

Avoid: Deflection cannot return the Attack to its original attacker; it costs a real card.

### Play sequence

Turn low-value Diamonds into Acedia on an enemy whose lost Play Phase matters. Avoid duplicate delayed spells and account for friendly removal or retrial. Decide which card remains for Deflection before exhausting your hand.

### Resource policy

Deflection needs a legal other recipient and a discard. A weapon/horse discard can change range; preserve actual legal access, not merely a theoretical enemy on the table.

### Skill and response decisions

Compare taking a safe hit with spending a critical card and redirecting into a worse outcome. A Guo Jia recipient may gain useful cards; a low-HP enemy may be a finish. Original attacker is not a legal return target.

### Worked example (hypothetical)

Do not discard the horse that makes your desired recipient legal without checking the resulting target restrictions.

Facing this general: An Attack may be redirected to another player; choose the attack timing and target carefully.

Version filter: Classic skills in this build; ignore revised, SP, national-war and mobile-only upgrades.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.com/news/20161025_8500_2217). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Sun Shangxiang

Cycle equipment and convert spare cards into team healing.

- Replacing or spending equipped cards can trigger Daredevil draws; evaluate the resulting equipment state.
- Use Betrothment on a wounded male ally when two low-value cards buy valuable recovery.
- Exploit drawn cards before ending; retain enough defense to survive between turns.

Avoid: Cards merely held in hand are not equipped; losing hand equipment alone does not trigger Daredevil.

### Play sequence

Equip and replace useful equipment to exploit Daredevil, checking new draws after every equipment loss. If Betrothment can heal a valuable male ally and you, compare its two-card cost with other uses before committing.

### Resource policy

An equipped item can carry both current protection and future loss draws. A held equipment card has no loss trigger. Do not replace vital armor just for two unknown cards when the next enemy can kill you.

### Skill and response decisions

Equipment removal may benefit you, so value the whole exchange. Healing target sex and wounded conditions remain mandatory; team identity still matters more than a convenient legal male.

### Worked example (hypothetical)

Replacing a spare weapon can draw two; discarding a weapon from hand does not trigger the same skill.

Facing this general: Removing equipped cards gives her draws; a wounded male ally can be healed with her.

Version filter: Classic skills in this build; ignore revised, SP, national-war and mobile-only upgrades.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.com/news/20161025_3236_2917). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Hua Tuo

Keep the team alive while protecting its healer.

- Use Prodigal Healer on the most important wounded ally or yourself for one low-value hand card.
- Reserve suitable red cards for out-of-turn First Aid, especially when the Lord is endangered.
- Equip defensively and keep sufficient HP; your living future healing can exceed one extra attack.

Avoid: First Aid is outside your turn; do not gift survival to an enemy without a role-specific reason.

### Play sequence

Heal the most urgent valuable target with an expendable hand card, then use safe draw/equipment and ordinary pressure. Your own survival protects future team healing; do not end exposed merely to retain one extra attack card.

### Resource policy

Separate Play-Phase healing costs from out-of-turn red First Aid reserve. Preserve red equipment/hand cards according to actual legal rescue options and current defenses.

### Skill and response decisions

First Aid is not available during your own turn. Check whose dying state is active and whether saving them helps your role; a dying Rebel is not automatically a patient for a Loyalist.

### Worked example (hypothetical)

A low-value red card may be worth holding when the Lord is likely to enter dying before your next turn.

Facing this general: Hand denial and focused pressure can remove the red rescue reserve.

Version filter: Classic skills in this build; ignore revised, SP, national-war and mobile-only upgrades.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.com/news/20161025_9121_2018). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Diao Chan

Use ordered Duels to force unfavorable enemy exchanges.

- Pay a cheap card and choose two males based on likely Attack supply, damage triggers and team benefit.
- Target order matters: the first selected male must answer with Attack first in this implementation.
- Exploit the unnegatable Duel while keeping sufficient defense; the end-phase draw supports repeated control.

Avoid: Do not pair vulnerable allies blindly; account for Lv Bu double responses and Cao Cao/Guo Jia benefits.

### Play sequence

Pick the intended loser first conceptually, then order the two legal males so response order favors that outcome. Submit one cheap cost and both targets together. Check Attack supply, Lv Bu requirements and damage-source consequences before confirming.

### Resource policy

Keep defense for the interval before your next turn; the end draw helps but is unknown. A cheap cost can make Lust efficient, yet guaranteeing your preferred damage recipient requires analyzing the Duel responses.

### Skill and response decisions

If an ally participates, verify a concrete advantage such as a safe guaranteed enemy finish; do not use them as a generic second male. Damage-trigger benefits and kill reward ownership can change the best ordering.

### Worked example (hypothetical)

A male with no Attacks answers first: ordering him first can force him to lose immediately instead of relying on the other male failing later.

Facing this general: Duel pressure bypasses ordinary Dodge defense; selected source and damage recipient matter.

Version filter: Classic skills in this build; ignore revised, SP, national-war and mobile-only upgrades.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.com/news/20161025_7443_2718). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Huang Zhong

Select targets where old Fiery Bow prevents Dodge.

- Compare enemy hand count with your HP and attack range; use supplied Fiery Bow availability facts.
- Long-range weapons widen the low-hand-count condition and access to finishing targets.
- Use Wine for a valuable reliable hit when armor and prevention do not defeat it.

Avoid: This is OLD Fiery Bow: no attack-rank range, no automatic extra damage, no revised hand comparison.

### Play sequence

Calculate both classic bow tests from current target hand count, your HP and actual weapon range. Establish reach/remove relevant armor, then use the supplied bow activation when valuable. Recompute after every stolen/discarded card or HP change.

### Resource policy

A longer weapon improves the low-hand threshold as well as reach. Do not lose HP just to improve the high-hand threshold unless the entire exchange is profitable.

### Skill and response decisions

Dodge denial does not bypass all armor or damage prevention. Wine is best spent on a hit that can connect and advance a finish; do not infer a newer automatic damage bonus.

### Worked example (hypothetical)

With range 3, a target holding at most three cards may meet the classic low-hand condition; use engine availability as final authority.

Facing this general: Dodge may be unavailable at either extreme of hand count.

Version filter: Mixed-version official guide: use only old hand-count/HP/range condition; newer bonuses excluded.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.com/news/20161026_7095_5710). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Wei Yan

Make damage at distance one also restore your HP.

- Use -1 Horse and target access to put valuable enemies within distance one.
- Compare hit probability and potential recovery when choosing Attack or spell targets.
- At full health prioritize team damage; healing is not permission to attack an ally.

Avoid: Long weapon range alone is not distance one. No Qimou or draw-instead-of-heal upgrade here.

### Play sequence

Choose meaningful enemies at actual distance one; an ordinary spell hit there can also be relevant. Equip -1 Horse before committing if it changes distance. Use recovery potential to compare otherwise similar attacks, not to justify harming teammates.

### Resource policy

At full HP, the healing portion has no immediate value. At low HP, a reliable distance-one hit can improve both offense and survival, but a long weapon alone does not shorten distance.

### Skill and response decisions

Recovery requires damage to occur. Dodge, prevention or immunity can leave you wounded after spending your action; do not spend your only rescue assuming a hit is guaranteed.

### Worked example (hypothetical)

Range 4 reaches an enemy four seats away but does not by itself make that target distance one for recovery.

Facing this general: Distance-one damage may heal him; distance control can deny recovery.

Version filter: Source discusses revised Wei Yan too; only classic distance-one recovery is used; tactics are rule-derived adaptations.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.com/news/20161026_9772_0011). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Pang Tong

Use Clubs flexibly for elemental setup or cycling.

- Recast spare Clubs when no profitable chain setup exists.
- Chain enemies or unchain endangered allies with future elemental damage and order in mind.
- Use Nirvana when survival requires it; a reset loses cards/equipment/judgments and does not make reckless damage free.

Avoid: Do not chain an endangered ally just to create more targets or waste valuable Club spells automatically.

### Play sequence

For each Club, compare its printed use, chain/unchain effect and recast draw. Set up elemental propagation only with a credible follow-up. Unchain endangered allies before a known enemy fire turn when that prevents a team loss.

### Resource policy

Recast is card cycling, not free card advantage. Keep vital Club defense/control when replacement uncertainty is worse. Nirvana is once-only insurance whose reset sacrifices an existing board.

### Skill and response decisions

Before declining rescue in favor of Nirvana, compare the reset state and future danger. A near-empty weak board favors resetting more than valuable equipment and a safe rescue.

### Worked example (hypothetical)

No profitable elemental target and a redundant Club: recast can find a useful card rather than chaining arbitrary players.

Facing this general: His one-time reset changes lethal calculations; chain setup can spread elemental damage.

Version filter: Classic skills in this build; ignore revised, SP, national-war and mobile-only upgrades.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.com/news/20161026_9867_1611). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Younger Zhuge Liang

Budget black counters and red fire costs for team control.

- Reserve some cheap black cards for crucial Negation, not every black card regardless of pressure.
- Use Flame Tactic when enough suit coverage and a valuable fire target justify reveal plus discard.
- Armorless Eight Trigrams can defend; compare a new armor benefit against losing that innate effect.

Avoid: Fire Stratagem is expensive; one red card does not guarantee a successful fire hit.

### Play sequence

Use draw/control to improve suit coverage before paying for fire. For Flame Tactic, budget the claim card plus a matching-suit discard and check target hand availability. Chain/Vine can improve payoff, but include every propagated recipient.

### Resource policy

Cheap black cards are Negation reserves; preserve enough for important effects, not all of them forever. Equipping armor replaces innate Eight Trigrams, so compare reliability and matchup rather than assuming any armor is an upgrade.

### Skill and response decisions

Use innate armor when legal and worthwhile before spending a scarce Dodge. For counters, evaluate the spell outcome and later enemies; avoid burning the whole black hand on a minor effect.

### Worked example (hypothetical)

One red card and no suit coverage does not guarantee successful Fire Stratagem; an ordinary useful card play may cost less.

Facing this general: Black hand cards can counter spells; fire pressure uses extra resources.

Version filter: Classic skills in this build; ignore revised, SP, national-war and mobile-only upgrades.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.com/news/20161026_7706_1711). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Meng Huo

Balance Arise recovery with normal draw and source consequences.

- At low lost HP, two normal draws may beat replacing them with too few reveals.
- At substantial lost HP, compare Heart recovery and non-Heart gains with immediate survival/card needs.
- Account for being Barbarian damage source when retaliation, kills and team effects resolve.

Avoid: Arise replaces draw, not extra draw; Barbarian immunity does not mean immunity to every AOE.

### Play sequence

At Arise, compare lost HP with normal draw-two and expected recovery/card mix. Low lost HP often favors normal draw; deep wounds can favor Arise. After resolving it, reassess actual cards and health before offense.

### Resource policy

Do not deliberately tank damage without survival and next-turn value. Barbarian immunity can preserve Attack responses for Duel or later threats, but not for immunity against all AOE.

### Skill and response decisions

You can become Barbarian damage source even when someone else played it. Consider retaliation, Rebel rewards and Lord-kills-Loyalist punishment using the game actual source facts.

### Worked example (hypothetical)

One lost HP means Arise reveals one card instead of drawing two; recovery may justify it, but it is not an automatic extra draw.

Facing this general: Barbarian cannot damage him and he becomes its damage source; other pressure remains effective.

Version filter: Classic skills in this build; ignore revised, SP, national-war and mobile-only upgrades.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.com/news/20161026_2573_3112). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Zhu Rong

Reuse Barbarian and convert successful hits into valuable steals.

- Evaluate allied casualties and source effects before replaying a recovered Barbarian.
- After dealing Attack damage, Pindian with an expendable high card when a valuable enemy card is likely obtainable.
- Decline Fiery Blade when card quality, enemy rank information or defenses make the wager poor.

Avoid: Do not spend a precious high Peach for a speculative steal or open harmful AOE just because it was free.

### Play sequence

Use ordinary Attack to secure damage, then evaluate Fiery Blade against the now-current enemy hand. Reserve a strong expendable rank if the resulting steal matters. Recovered Barbarian must be evaluated afresh for team casualties.

### Resource policy

Pindian spends a real card whether it wins or loses. A high Peach may be too expensive for a speculative hidden hand card; a known important equipment reward can justify a larger wager.

### Skill and response decisions

If an opponent just took damage, their HP and hand may already have changed through triggers. Recheck rather than relying on the pre-Attack plan. Meng Huo source replacement can alter AOE kill consequences.

### Worked example (hypothetical)

Do not discard your sole Peach to win a low-value Pindian while sitting at 1 HP with incoming pressure.

Facing this general: She may recover physical Barbarian; an Attack hit can lead to Pindian and theft.

Version filter: Classic skills in this build; ignore revised, SP, national-war and mobile-only upgrades.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.com/news/20161026_7999_3112). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Taishi Ci

Commit Pindian costs only when enhanced attacks or denial pay.

- Reserve a strong rank for Justice of Heaven and enough actual Attacks to exploit victory.
- Use victory to reach priority enemies and additional targets; reassess the board after each hit.
- A denial-only Pindian may be worthwhile without Attacks, but compare both lost cards and your once-per-phase use.

Avoid: Losing prevents Attack this turn. Do not gamble away your only useful Attack without a payoff.

### Play sequence

Before Pindian, count remaining usable Attacks, valuable targets and the rank you can afford. Win, then exploit extra use/targets and unlimited distance with ordinary Attacks. After each hit, reassess targets rather than preserving a stale two-target plan.

### Resource policy

The wager card and attack fuel are separate costs. A high Attack used for Pindian cannot also be played afterward. A denial-only Pindian can be valid but should beat the alternative uses of your card.

### Skill and response decisions

Losing forbids Attack for the turn; do not risk a sure useful ordinary hit for a poor-rank gamble. When responding to enemy Pindian, preventing their burst can justify your strongest rank.

### Worked example (hypothetical)

Only one Attack, also your highest card: spending it to win leaves no burst unless other conversion/draw is genuinely available.

Facing this general: High rank hand cards resist Pindian; a win lets him attack more and ignore distance.

Version filter: Classic skills in this build; ignore revised, SP, national-war and mobile-only upgrades.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.com/news/20161026_3667_2211). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Sun Jian

Convert lost HP into the best ally refill or enemy tax.

- Choose draw X/discard one for a useful ally, or draw one/discard X to strip an enemy.
- Evaluate X and actual cards available; at one lost HP the effects mainly cycle a card.
- Recover when threatened; future Heroic Spirit value requires surviving until Preparation.

Avoid: Do not lower HP indiscriminately or use enemy-discard mode on an ally by confusing mode order.

### Play sequence

At Heroic Spirit, calculate X from current lost HP and decide support versus enemy tax. Choose recipient by immediate team effect and their actual hand/equipment resources. At X=1 the modes mostly cycle a card; do not describe either as huge advantage.

### Resource policy

Lost HP is future skill power but lower survival and hand capacity. Recover when threatened rather than preserving a large X that you may never survive to use.

### Skill and response decisions

For discard selection, preserve irreplaceable reach/defense when possible. The enemy tax may target equipment too according to legal options; do not invent discardable cards outside the supplied choices.

### Worked example (hypothetical)

At three lost HP, refill an attacking ally or strip an enemy core; pick the mode that matches the chosen recipient, not a fixed button position.

Facing this general: His lost HP powers future control; delaying or finishing him can deny that value.

Version filter: Classic skills in this build; ignore revised, SP, national-war and mobile-only upgrades.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.com/news/20161026_3293_2812). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Xiao Qiao

Redirect damage with both recipient survival and refill in mind.

- Keep an effective Heart hand card; Spades count as Hearts under Rosy Cheeks.
- Redirect large damage to a valuable enemy when their survival draw does not outweigh harm.
- Feeding a survivable damage-trigger ally can work, but verify HP, chain spread and later card advantage.

Avoid: A heavily wounded enemy can draw many cards after surviving; transfer is not a free offensive hit.

### Play sequence

For transfer, compute recipient post-hit HP, survival triggers, lost-HP draw and chain consequences before choosing. Large damage can finish an enemy; small damage can unintentionally refill them. A survivable allied Guo Jia interaction may be useful only with explicit math.

### Resource policy

Keep an effective Heart, including Spade under Rosy Cheeks. Retaining a transfer card matters only if a legal profitable recipient exists; it does not replace all other defense.

### Skill and response decisions

Do not double-count transferred damage as a fresh unmodified base hit. Use current damage facts and equipment interactions from the engine. A dying recipient may not produce the refill imagined in advance.

### Worked example (hypothetical)

Giving a 1-damage transfer to a heavily wounded enemy who survives can hand them a large refill; a healthier target may be better.

Facing this general: Do not ignore redirected damage and resulting refill when attacking her.

Version filter: Classic skills in this build; ignore revised, SP, national-war and mobile-only upgrades.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.com/news/20161026_5527_0411). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Zhou Tai

Treat old Undying as risky survival, not infinite health.

- Use Undying to survive when needed; duplicate wound ranks create a real rescue/death risk.
- When removing wounds, break duplicate ranks first if possible; reduce future collision risk.
- Keep advancing team victory; the old negative-HP hand limit is not a modern wound-count hand limit.

Avoid: No Fenji support skill or revised guaranteed 1-HP reset. Wound cards are not judgments.

### Play sequence

Continue ordinary useful play even at nonpositive HP; old Undying is a risky survival mechanism, not a growing hand engine. Inspect public wound ranks and available rescue before deciding whether to rely on another wound.

### Resource policy

When recovery removes a wound, prioritize resolving duplicate ranks where the legal choices allow. Negative HP sharply constrains the classic hand limit; spend useful cards rather than saving an impossible modern-sized reserve.

### Skill and response decisions

Wound reveals are not judgments, so retrial is not a universal solution. Collision risk increases with existing ranks; a previous survival success does not guarantee another.

### Worked example (hypothetical)

Two wounds share rank 7: if recovery offers either duplicate for removal, breaking the pair can be more important than its suit.

Facing this general: Inspect public wound ranks and remaining survival risk rather than assuming invulnerability.

Version filter: Old Wind only. Rule-derived strategy from the archived rule text and local implementation; newer OL strategy with Fenji excluded.

Sources: [Archived rulebook reproduction; strategy inferred from classic rules](https://gltjk.com/sanguosha/rules/card/hero/wu.html). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Xu Huang

Deny draws to enemies whose hands power their turns.

- Use cheap black Basic/Equipment costs on a priority enemy within legal distance two.
- Prefer enemy draw engines or the Lord as Rebel, accounting for judgment manipulation.
- Retain enough black defense and existing equipment when the denial is unlikely to land.

Avoid: Do not confuse kingdom with team or supply an ally merely because the target is convenient.

### Play sequence

Choose a reachable enemy whose next draw supports a dangerous turn. Convert a cheap black Basic/Equipment only after comparing its printed use. Check existing Rations, retrial and removable delayed-spell defenses before paying.

### Resource policy

A black Dodge or equipped protection may be worth more than a low-probability denial. Actual distance-two legality is not weapon range; keep a horse if losing it invalidates the plan.

### Skill and response decisions

Rations denies draw only if its judgment fails. Enemy judgment control can reduce value; friendly judgment setup can increase it without making an unseen outcome certain.

### Worked example (hypothetical)

An enemy hand engine nearing an empty turn may be a better denial target than a distant convenient enemy who already has ample resources.

Facing this general: Judgment control and removing the delayed spell can restore draw access.

Version filter: Classic skills in this build; ignore revised, SP, national-war and mobile-only upgrades.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.com/news/20161026_4323_2512). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Dian Wei

Use direct damage to finish or decisively pressure a target.

- Compare weapon discard with HP payment and the range after equipment loss.
- Sequence Attack and Forceful Assault so the chosen enemy remains reachable.
- A guaranteed finish may justify HP; ordinary one-for-one damage often does not.

Avoid: Avoid self-lethal HP payment with no secured win or discarding the weapon that supplies required reach.

### Play sequence

Compare ordinary Attack and Forceful Assault order while the target remains reachable. Direct damage can finish through Dodge-heavy defense. Decide weapon discard versus HP payment using the actual post-cost board and survival state.

### Resource policy

An otherwise obsolete held weapon can be a cheap cost. The equipped weapon supplying reach is not cheap merely because the skill accepts equipment. HP payment must include the danger of subsequent enemy turns.

### Skill and response decisions

Damage is direct but still subject to relevant prevention/transfer. Do not assume a 1-HP enemy dies if they can redirect or reset; use legal observable information.

### Worked example (hypothetical)

Use Attack before sacrificing necessary reach when both hits are needed and the engine permits the sequence.

Facing this general: Dodge cannot stop Forceful Assault; restrict distance or force expensive costs.

Version filter: Classic skills in this build; ignore revised, SP, national-war and mobile-only upgrades.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.com/news/20161026_1535_1311). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Pang De

Make dodged Attacks still disrupt valuable enemy cards.

- Exploit Horse Riding to reach a team-priority target.
- When Horse Archery is offered, remove important armor, reach or a key hand resource.
- Account for equipment-loss benefits such as Daredevil or Silver Lion before choosing the card.

Avoid: A cheap hand card may be better to remove than equipment that rewards its owner on loss.

### Play sequence

Choose an important enemy reachable with Horse Riding. If they Dodge, Horse Archery can still disrupt the board; evaluate the offered hand/equipment choices after the Dodge rather than preselecting blindly.

### Resource policy

Axe-like guaranteed damage is not the same as this discard effect. Preserve Attack supply and defense; do not spend resources assuming a dodged Attack still deals HP damage.

### Skill and response decisions

Removing Silver Lion may heal; removing Sun Shang Xiang equipment may refill. A random hand card can be better than visibly attractive equipment with a strong loss benefit.

### Worked example (hypothetical)

Enemy Dodges behind a key range weapon: removing it may protect your Lord more than stripping an unknown hand card.

Facing this general: Dodging may still cost another card; plan equipment and hand defenses accordingly.

Version filter: Classic skills in this build; ignore revised, SP, national-war and mobile-only upgrades.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.com/news/20161026_2243_2411). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Zhang Jiao

Turn Dodge responses and controlled Spade judgments into offense.

- Keep Dodge and a suitable black retrial card when Thunder Strike can hit a valuable enemy.
- Use Devilish Arts to secure important judgments while considering cost and the obtained original card.
- As Lord, value Qun Yellow Heaven gifts; use chain thunder only after checking all recipients.

Avoid: Old Thunder Strike requires Spade for two thunder damage; no revised Club healing or other upgrades.

### Play sequence

Build Dodge plus retrial coverage, then use Thunder Strike on the most valuable legal enemy. A controlled Spade judgment threatens two thunder damage; chain propagation can magnify both team gains and friendly losses.

### Resource policy

Do not spend every black card casually: a suitable Spade can secure Thunder Strike, while other black cards serve different retrials. Devilish Arts can use equipment and obtains the replaced judgment; include lost equipment utility.

### Skill and response decisions

Allied Attack-to-Dodge cooperation is worthwhile only with a real Dodge, legal response and profitable thunder target. Do not request friendly damage on the assumption of hidden resources.

### Worked example (hypothetical)

A Club retrial is black but does not satisfy this build old Spade-only Thunder Strike; no newer Club healing should be expected.

Facing this general: Do not casually feed him Dodge triggers; prevent his judgment control or use non-Dodge threats.

Version filter: Old Wind Thunder Strike/Devilish Arts/Yellow Heaven only; filter revised skill details from source.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.com/news/20161026_1897_1211). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Yan Liang & Wen Chou

Trade normal draw for a hand-supported Duel burst.

- Before Heroic Duo, compare hand colors and Attack supply with the normal two-card draw.
- After its judgment, convert only the opposite-color hand cards into Duel and target enemies unable to answer.
- Leave actual Attack responses for your own Duels; consider damage-trigger opponents and kill rewards.

Avoid: You gain the judgment card, not a normal full draw; no revised two-card reveal or damage recovery here.

### Play sequence

At draw replacement, inspect both colors and actual Attack responses. Heroic Duo obtains a judgment card instead of normal draw-two. Once color is known, use opposite-color surplus as Duels against enemies likely to lose the exchange.

### Resource policy

Keep enough actual Attack responses to win Duels; converting all response fuel into Duel costs can strand you. Cards matching the judgment color cannot be converted by the classic skill.

### Skill and response decisions

A Duel that feeds damage-trigger opponents may be less useful than ordinary offense. Recalculate remaining response supply after each Duel instead of assuming every converted card is free damage.

### Worked example (hypothetical)

A red judgment leaves black hand cards as Duel fuel; preserve enough actual Attacks to answer the resulting Duels instead of converting them all.

Facing this general: His current judgment determines Duel fuel; pressuring his hand before his turn limits burst.

Version filter: Classic skills in this build; ignore revised, SP, national-war and mobile-only upgrades.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.com/news/20161026_7932_2312). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Yuan Shao

Convert matching suits into team-profitable AOE pressure.

- Count enemy and allied exposure before each Raving Slash; low-HP allies can make AOE losing.
- Use cheap same-suit pairs while retaining essential defense; reassess after deaths and reward draws.
- As Lord, use the actual Bloodline hand limit to plan reserves rather than assuming normal HP limit.

Avoid: Do not fire blindly or assume revised AOE excludes allies, draws on Dodge, or recovers its cost.

### Play sequence

Before each two-card same-suit AOE, count every ally/enemy exposure, likely Dodges, death triggers and source-based rewards. Resolve one volley and inspect the new state before considering another.

### Resource policy

Two cards is a real cost. Retain essential rescue/defense unless the volley wins or creates superior team value. Bloodline uses living Qun count for this Lord hand limit, not assumed team membership.

### Skill and response decisions

Enemy Guo Jia can supply later responders mid-AOE. Meng Huo Barbarian interactions do not grant immunity to Arrow Barrage. Do not apply revised draws, target exclusions or cost refunds.

### Worked example (hypothetical)

Two exposed Rebels do not make a volley good if it first kills your own 1-HP Lord.

Facing this general: Dodge resources may be exhausted by repeated AOE; support damage-trigger allies carefully.

Version filter: Classic skills in this build; ignore revised, SP, national-war and mobile-only upgrades.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.cn/hero-detail-41.html). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Xiahou Yuan

Exchange skipped phases for precisely valuable distant Attacks.

- First God Speed can avoid bad judgments and reach a finishing target, but costs the normal draw.
- Second God Speed spends equipment and skips the entire Play Phase; compare every useful card/skill you forgo.
- Use ordinary play instead when draw, healing, control or several actions outweigh one Attack.

Avoid: A free-looking Attack still has phase opportunity cost; no Attack card is required for the skill-created hit.

### Play sequence

First God Speed compares skipping Judgment+Draw with one distant Attack: bad delayed spells or a finish can justify it. Second compares an equipment cost plus the entire Play Phase with one hit. Evaluate all foregone healing, draw, control and attacks.

### Resource policy

Prefer expendable equipment costs without destroying crucial protection. No Attack card is required for the created hit, but lost phases remain expensive; the skill is not simply free extra damage.

### Skill and response decisions

The target may Dodge or prevent damage. A normal draw/play turn can outperform a speculative hit; do not take both opportunities automatically because both are legal.

### Worked example (hypothetical)

With draw-two, Peach and several useful spells, skipping the whole Play Phase for a routine single Attack usually wastes more than it gains.

Facing this general: Distance alone is not safety; phase denial can make his first God Speed more attractive.

Version filter: Classic skills in this build; ignore revised, SP, national-war and mobile-only upgrades.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.com/news/20161026_5172_0111). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Yu Ji

Use credible Heart claims and selective bluffs, not indiscriminate claims.

- A truthful Heart can resolve even when challenged; consider using its actual identity when no deception benefit exists.
- Unchallenged claims can turn low-value cards into needed actions, but inspect positive-HP challengers and their incentives.
- As challenger, weigh truthful-claim HP loss against stopping a false or non-Heart claim; allies need not challenge each other.

Avoid: Old Bewilder has no once-per-turn or curse system. A truthful non-Heart fails if challenged.

### Play sequence

Choose a claim that addresses the current tactical need and is actually legal. A truthful Heart is robust to a challenge; a truthful non-Heart can still fail when challenged. Prefer ordinary use when deception adds nothing.

### Resource policy

Bluff cost includes losing the card/action if challenged and revealing information. Preserve credible Heart claims and defense rather than turning every spare card into speculative AOE.

### Skill and response decisions

As challenger, compare HP cost if true with the value of stopping the effect. Only positive-HP eligible players may challenge in this build. Do not challenge an ally automatically or assume every surprising claim is false.

### Worked example (hypothetical)

A truthful non-Heart draw-two claim can be stopped by challenge; it is not equivalent to a truthful Heart claim.

Facing this general: Challenge only with enough HP and a reason; exposing a true claim costs HP.

Version filter: Old Wind Bewilder only; truthful Heart requirement and HP-based challenge eligibility follow local skills.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.com/news/20161026_8184_0611). Detailed tactical sections are original local-rule deductions, not quotations from these sources.

## Dong Zhuo

Use early HP and Wine pressure before Breakdown erodes the advantage.

- Use a cheap Spade as Wine only when a useful Attack can follow or during legal self-rescue.
- Against female targets compare double-Dodge pressure; female attackers also require you to Dodge twice.
- For Breakdown, compare immediate HP safety with permanent maximum-HP loss and future healing/hand limits.

Avoid: No revised rule disables Breakdown after a Wine hit. Avoid stalling indefinitely behind high starting HP.

### Play sequence

Use early resources to create progress before Breakdown erodes the HP advantage. Prepare an Attack and a connecting target before converting a Spade into Wine. Against female targets, evaluate double-Dodge pressure and retaliation risk.

### Resource policy

High initial HP is finite. At Breakdown, compare immediate HP safety with permanent max-HP, healing ceiling and hand-limit loss. Avoid preserving a huge unused hand while your long-term position collapses.

### Skill and response decisions

Female attackers also require extra Dodges from you. Keep enough actual response supply; do not count one Dodge as sufficient automatically. A Wine hit does not disable old Breakdown.

### Worked example (hypothetical)

Drink Wine only with a useful follow-up Attack, unless legally self-rescuing; do not spend it as a vague setup for a later turn.

Facing this general: Time erodes his HP or maximum HP; female interactions are dangerous for both sides.

Version filter: Classic skills in this build; ignore revised, SP, national-war and mobile-only upgrades.

Sources: [Official strategy guide or official general introduction; advice synthesized and adapted](https://www.sanguosha.cn/hero-detail-45.html). Detailed tactical sections are original local-rule deductions, not quotations from these sources.
