# Classic 3v3 in v0.87

This replaces v0.85's simplified 3v3 elimination game. 2v2 remains a separate team-elimination mode.

## Rules edition

The implementation uses the older, pre-2012 commander/action-unit rules with a **three-card kill reward**. It does not combine those rules with the later two-card reward, modified Crossbow, modified Something Out of Nothing, or one-player-controls-three format.

Reference rules:

- Official classic action sequence: https://sanguosha.com/act/sgs3v3/3v3gz02.html
- Official shared draft description: https://www.sanguosha.com/act/sgs3v3/3v3sc03.html
- Classic OL rules, including three-card rewards and no Lord skills/Lightning: https://g.iqiyi.com/sanguosha/news/320818.html
- Historical rules PDF: https://mse.zju.edu.cn/_upload/article/files/98/21/4d4cd29e4ecb841f5c14bb54499c/fa1f054b-5b23-4432-87f1-5df1219e3b33.pdf

## Lobby and setup

Six seats, in increasing seat order:

1. Warm vanguard A
2. Warm commander
3. Warm vanguard B
4. Cold vanguard B
5. Cold commander
6. Cold vanguard A

The host can swap players between these slots. Team assignments and commander status are public; personal hands remain private.

The warm commander chooses the first drafting side after seeing the pool of 16 generals. Teams alternate picks in **1–2–2–2–2–2–2–2–1** order, receiving eight generals each. Every pick is public.

Both commanders privately deploy one general to themselves and one to each vanguard. Deployment is revealed only when both sides finish. Commanders receive +1 maximum and starting HP, but **no Lord-only skills**. The cold commander chooses which side starts, before anyone receives their four initial hand cards. The first action unit must be the chosen side's commander.

## Action units and rounds

Teams alternate action units. A commander chooses either their own complete turn or both eligible vanguards' complete turns, in a chosen order. Dead vanguards are skipped. Each living character acts once per large round, with a public ACTED marker. A team with no remaining eligible characters yields. Once all living characters have acted, markers reset and action opportunities continue alternating. A turn still contains all normal phases.

## Victory and cards

- A commander's death immediately ends the game; the opposing team wins, including its eliminated teammates. Vanguards can remain alive on the losing side.
- A surviving killer receives three cards for killing a vanguard, even a friendly vanguard. No identity-mode Loyalist penalty applies. A commander death ends play immediately.
- Standard/EX deck with both Lightning cards removed: **106 cards**. Maneuver is disabled in this mode.
- No Lord-only skills. Crossbow and Something Out of Nothing retain their ordinary classic effects.
- Barbarian Invasion, Raining Arrows, Brotherhood, and Bumper Harvest ask their user to select clockwise or counterclockwise resolution. Bumper Harvest direction is selected before revealing its cards.
- Rescue decisions follow increasing seat order starting at the current turn's player. This mode does not use the identity game's simultaneous rescue window.

## Project-specific boundaries

This is a casual six-player implementation of the classic core, not a claim of tournament certification. There are no tournament time-limit tiebreaks or restrictions on table chat. Host-arranged teams are retained rather than randomly assigned warm/cold colors.

The default general pool is the project's standard 25. Enabling the general expansion adds the **six implemented non-Yu Ji Wind generals**, giving 31 supported generals. Cao Ren is not implemented, so this is not the full historical 32-general roster. Other expansion generals and Yu Ji are excluded from Classic 3v3. Bans apply before drawing the 16-general pool. Testing can still draw cards, but general presets cannot bypass the shared draft.

Human commanders, practice bots, and LLM bots use the same legal prompts. Model observations include the rules edition, commanders, public draft, action unit, and round markers. There is no added model-thinking call per choice beyond the existing decision interface.
