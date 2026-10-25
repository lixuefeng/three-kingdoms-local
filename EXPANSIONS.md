# Selected classic expansion generals — v0.46

Enable **Selected expansion generals** in room creation or the host's lobby controls. This enables 19 selected generals, for 44 total. Maneuver game cards are a separate switch; conversions can create their named cards even when that physical card pack is off. Cao Pi and Jia Xu are not included.

| General | Pack | Implemented skills |
| --- | --- | --- |
| Huang Zhong | Wind | Fiery Bow / 烈弓 |
| Wei Yan | Wind | Rebellious Spine / 狂骨 — classic recovery only |
| Pang Tong | Fire | Chain Stratagem / 连环; Nirvana / 涅槃 — no acquired extra skill |
| Younger Zhuge Liang | Fire | Eight Trigrams / 八阵; Fire Stratagem / 火计; See Through / 看破 |
| Meng Huo | Forest | Culprit / 祸首; Arise / 再起 |
| Zhu Rong | Forest | Giant Elephant / 巨象; Fiery Blade / 烈刃 |
| Taishi Ci | Fire | Justice of Heaven / 天义 |
| Sun Jian | Forest | Heroic Spirit / 英魂 |
| Xiao Qiao | Wind | Rosy Cheeks / 红颜; Heavenly Scent / 天香 — original damage transfer |
| Zhou Tai | Old Wind | Undying / 不屈 — original distinct-rank wound survival, no 奋激 |
| Xu Huang | Forest | Cut Off Rations / 断粮 — classic distance 2 |
| Dian Wei | Fire | Forceful Assault / 强袭 |
| Pang De | Fire | Horse Riding / 马术; Horse Archery / 猛进 — after Dodge |
| Zhang Jiao | Old Wind | Thunder Strike / 雷击 — Spade, 2 thunder; Devilish Arts / 鬼道; Yellow Heaven / 黄天 |
| Yan Liang & Wen Chou | Fire | Heroic Duo / 双雄 |
| Yuan Shao | Fire | Raving Slash / 乱击 — same-suit pair; Bloodline / 血裔 |
| Xiahou Yuan | Wind | God Speed / 神速 — the two original skip-phase modes |
| Yu Ji | Old Wind | Bewilder / 蛊惑 — original truthful-Heart challenge rules, no 缠怨 |
| Dong Zhuo | Forest | Drunkard / 酒池; Lust / 肉林; Breakdown / 崩坏; Tyrant / 暴虐 — original rules, no Wine exemption |

English names follow the WTK reference card faces. The source images are unmodified and some print revised skills; those printed revisions do not override the classic rules above. Yellow Heaven and Bloodline remain identity-mode Lord skills even if a reference image is from Kingdom Wars.

## Interactions

- Pindian: each participant chooses a hand card and confirms privately. Both cards are revealed together. Ties count as the initiator not winning. Public information reports commitments, not card identities, until both have answered.
- Heavenly Scent: select a Heart (including a Spade converted by Rosy Cheeks) and one recipient, then Confirm. Cancel keeps the card and takes the original damage. Damage source, armor, chains and resulting card draws remain part of resolution.
- Undying: revealed wounds remain public beside the general. Recovery lets the owner click a wound card in the center to remove it. Internal zero/negative HP tracks the wound debt; hand limit and lost-HP draws treat effective HP as zero. Duplicate ranks require rescue unless healing removes the duplicate.
- Nirvana: an explicit once-per-game activation during dying, with a visible ready/used indicator. It discards all three ordinary card areas, unchains, draws three and finishes at three HP (or maximum HP if lower).
- Bewilder: select a hand card, then its claim from the available-use chooser. Eligible players choose Challenge or Believe in seat order. The real card is revealed only after all answers. No challenge resolves any claim; a challenged claim resolves only if it is truthful and Heart. Truthful challenges cost each challenger one HP; false ones give each challenger one card. Distinct elemental Attack claims are supported.
- God Speed: cancel the first target prompt to keep Judgment and Draw. The second mode combines one equipment cost and a target, or Cancel to keep Play. Skipped phases cannot be skipped again.

## Shared bans

Every seated human may select any enabled generals in the lobby's General bans panel. The union of selections is banned for the whole table. Names show who banned each general; removing your own selection cannot remove another person's vote. Spectators and bots cannot vote. Bans lock once the match starts, clear conflicting presets and reset other humans' ready state when changed. Keep at least `3 × player count − 2` generals eligible; otherwise Start is disabled and the server also rejects it. Banned generals cannot appear in Lord offers, other offers or testing presets.

## Rule references

Classic identity-mode entries, including explicitly marked Old Wind variants:
- https://gltjk.com/sanguosha/rules/card/hero/shu.html
- https://gltjk.com/sanguosha/rules/card/hero/wu.html
- https://gltjk.com/sanguosha/rules/card/hero/wei.html
- https://gltjk.com/sanguosha/rules/card/hero/neutral.html
- https://www.sanguosha.cn/pc/hero-detail-33.html (original Yu Ji challenge rule)
- https://wtkgames.com/generalCard/ (English names and artwork reference)
