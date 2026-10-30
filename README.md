# Three Kingdoms Local

A self-hosted multiplayer identity card game inspired by Sanguosha, built for friends. English interface, no runtime npm dependencies, and optional LLM opponents.

Independent fan project, unaffiliated with YOKAGAMES or WTK Games. General portraits and card faces are bundled from the WTK reference sources, with original vector fallbacks. Third-party artwork is excluded from the MIT code license; see ARTWORK.md and the source manifests. No official audio is bundled.

## Run locally

Requires Node.js 22+.

```bash
npm start
```

Open `http://127.0.0.1:3000`, create a room, and add friends or practice bots. Four seats minimum.

For direct LAN access, explicitly set HOST to your LAN interface or `0.0.0.0`. For a tunnel, keep loopback binding and set the exact public origin:

```bash
HOST=127.0.0.1 \
PORT=3000 \
PUBLIC_ORIGIN=https://your-tunnel.example \
SGS_DATA_DIR=/absolute/path/to/persistent-data \
node server.mjs
```

Keep `SGS_DATA_DIR` outside releases. It stores private profiles, results, match/AI logs and the recovery key. Rooms and unfinished matches do not survive restart. Publishing this source does not publish your running server.

## Features

- Four identity roles, four to eight players, simultaneous non-Lord selection.
- 25 standard and 19 selected classic expansion generals; bans and expansion cards configurable separately.
- Direct card/target selection, equipment/judgment zones, timers, animations, synthesized audio and optional speech.
- Spectating, resizable chat, testing tools and persistent profile-based leaderboards.
- Practice bots and optional Kimi, DeepSeek or Claude opponents.
- Private match archives, AI inputs/outputs, diagnostics, plans and decision analysis.
- Source-linked classic-version playbooks for all 44 generals, with play sequences, reserves, response decisions and worked examples.

Hobby implementation, not official rules certification. Models may make poor choices; invalid or timed-out responses use the practice bot.

## Optional LLM setup

Copy `LLM.env.example` to `.env.local`, supply your own endpoint/credentials, then:

```bash
npm run llm:check
npm run start:llm
```

See [LLM-SETUP.md](LLM-SETUP.md). Supports OpenAI-compatible endpoints and native Bedrock Converse for Claude. One decision normally makes one request; plans do not automatically execute future moves.

Models see their own hand/role and public information. Private server archives include hands, roles and AI input/output; never commit or share them during a match. To recover older archives, run `npm run logs:key` with the same `SGS_DATA_DIR` and enter the key in the host's Match logs recovery form. That key unlocks all server archives.

## Docker

```bash
docker build -t three-kingdoms-local .
docker run --rm -p 127.0.0.1:3000:3000 \
  -e SGS_DATA_DIR=/app/data \
  -v three-kingdoms-data:/app/data \
  three-kingdoms-local
```

Container binding is internal `0.0.0.0`; the example publishes only host loopback. Supply tunnel/LLM variables separately.

## Development

```bash
npm test
```

Node's built-in test runner, mocked LLM responses, CI on Node 22. No dependency installation needed.

## Documentation

- [Supported expansion rules](EXPANSIONS.md)
- [LLM configuration](LLM-SETUP.md)
- [Strategy playbooks and sources](GENERAL-STRATEGY.md)
- [English terminology](TRANSLATIONS.md)
- [Asset provenance](ARTWORK.md)
- [Contributing](CONTRIBUTING.md)

## License

[MIT](LICENSE) for original source and bundled original assets. Third-party names, trademarks and linked reference materials are not relicensed. See [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).

## v0.67.0

Chat floats above the table without changing hand/table dimensions when resized. Use its −/+ button to minimize or restore it; the choice is remembered. Host AI controls are available in the lobby and match, with a per-model connection test showing latency, token usage and success/failure. Each test sends one small request with no live game data and does not use match request quotas or modify bot statistics. Tests require server credentials and may incur provider usage.


## v0.68.0

LLM observations now include factual action previews under `agentState.tactics.actionPreviews`. Equipment previews use the existing rules engine on a private-card-safe projection: changed range/distances, new or removed actions/targets, Attack allowance, conversions, armor calculations, replacement effects, known hand count and conditional discard count. Draw/recast, Peach, Wine and ending have compact effect summaries. Previews never choose moves, inspect the deck/opponent hand identities, or execute future actions. Unknown draws and reactions remain unresolved; large follow-up lists are explicitly bounded.

## v0.69.0

LLM bots can initiate table chat after completed plays: react to damage/card loss, thank help, ask for support, discuss public events, and celebrate their own successful actions. Host AI controls offer Off / Occasional (default) / Lively, available during a match. Direct human-addressed replies continue when spontaneous chatter is Off. Messages are optional, short and generated asynchronously from public information only. Practice bots do not initiate model chat.

### Saved-position AI tests (v0.70.0)

Run `npm run llm:bench -- --dry-run` to preview the request count, then configure your models and run `npm run llm:bench -- --models kimi --runs 3`. See [AI-BENCHMARKS.md](AI-BENCHMARKS.md) for comparison reports, synthetic regression cases and importing private saved decisions. Regular tests never call live models.

v0.71.0 adds an experimental `--variants current,tools` comparison: models can inspect and request recorded action projections before submitting. Up to four calls per tool-assisted decision; see the benchmark guide for limits. Built-in inconsistent positions from v0.70.0 have been corrected.

v0.72.0 gives bots explicit named action submissions, a current-decision contract, one bounded invalid-action correction, and factual hand/HP/card-event feedback. Optional prose never supplies missing action arguments. See [AI-BENCHMARKS.md](AI-BENCHMARKS.md) for examples and updated benchmark call budgets.

v0.73.0 adds `--suite logged` with seven anonymized recorded decision positions and benchmark-only `role-focus`, `consequence-focus`, and `review` alternatives. Use the same cases to compare ally targeting, resource use and contract failures before changing live-game strategy. See [AI-BENCHMARKS.md](AI-BENCHMARKS.md) for commands, scoring limits and request budgets.

v0.74.0: hosts can select **Strategy → Role-focused** for each LLM bot in the lobby or **AI Controls** during a match. It uses the same role-objective guidance as the benchmark with no additional model calls. Current remains the default. Switching strategy cancels pending decisions; new decisions use the new setting. The selected strategy is recorded in AI traces and model decision events.

v0.75.0 fixes Negation pass scope: **Pass for this spell** skips repeated original-effect prompts, but every played Negation opens a fresh counter opportunity. **Pass this counter** affects only that counter window. This applies to both live shared windows and adapter-driven decisions.

### AFK seats and table controls

During a match, **AFK · AI takeover** hands your existing seat to a bot; **I’m back · Take control** returns it to you. Choose Practice bot or a configured model under **Table → AFK model** before handing over. The host can also manage human seats under **Host → AI & AFK controls**. AI takeover starts automatically after an ordinary decision times out or after 15 seconds without an event-stream connection. Reconnecting preserves your seat; explicitly take control when you return. Pending AI work is cancelled on handback, and a shared rescue/Negation deadline is never extended. Bot decisions use only that seat's private hand and observed history.

In the lobby, the host can set the numbers of Loyalists, Rebels and Spies. Assignments remain random; counts must match the seats, with exactly one Lord, zero or one Spy, and at least one Rebel. Adding or removing a seat restores the standard role preset. The top role counter subtracts only publicly revealed eliminations, so it does not reveal living players' identities.

The Lord's choices include Liu Bei, Sun Quan and Cao Cao plus random candidates. With expansion generals enabled, Yuan Shao, Dong Zhuo and Sun Jian join that guaranteed group. Bans and explicit testing presets still apply. Other players choose concurrently after the Lord.

Table chat is shared by living players, eliminated players and spectators. Spectators still cannot inspect hands or hidden roles. Audio, table tools and host controls are grouped into top-right menus. A progress bar above the hand follows the current decision or response-window deadline.

### Bot names and leaderboard eligibility

The host can rename each bot in the lobby or under **AI controls** during a match. Bot seat IDs, models and game state stay intact; names must be unique at the table and contain 1–24 characters.

Completed, non-testing games with at least **4 seated players** count on the leaderboard for registered human profiles. Bots and guests may occupy other seats; they do not receive human profile statistics. AFK takeover does not turn a human profile into a bot profile. Games without any human profiles, testing games and unfinished matches do not count. This policy applies to newly recorded results; previously saved unranked results are not rewritten.

### v0.83: shared match review and multiple Spies

Players and spectators can use Table → Match logs to review or download completed matches from their current room, including private hands and AI traces. Live-match archives, recovery access, and new paid AI assessments remain host-only. Shared room access lasts until the room expires or the server restarts; the host retains persistent archive access.

Custom role composition allows multiple Spies. Each Spy competes independently and must be the sole survivor, with the Lord eliminated last. Only the surviving Spy receives a Spy win. Standard role counts are unchanged.

### Chat speech bubbles

New human and bot messages appear briefly above the sender’s general, even with chat minimized. Spectators and lobby messages appear at the upper left. Bubbles last 6–12 seconds; long messages are shortened in the bubble and remain complete in chat. The latest message replaces that sender’s bubble. Existing messages are not replayed on joining or refreshing.

### v0.85: Borrowed Sword target clarity

Borrowed Sword now announces the caster, weapon holder, and intended Attack victim before Negation. Two animation routes show caster → weapon holder → victim. The public decision and responder prompt identify the victim and who receives the weapon if surrendered, using general names.

### Team modes and Double Spy

In the lobby, the host can select **2v2** (exactly 4 seats) or **3v3** (exactly 6 seats). These are simple team-elimination modes, not the tournament captain-rule variant. Public Red and Blue teams alternate around the table; the first player is random. All players choose generals concurrently, with normal base HP and no Lord-only skills or identity kill rewards. Eliminate all enemies to win; eliminated teammates share the win. Bots receive the visible team assignments and team victory objective. Completed non-testing matches continue to count for registered human profiles.

For identity games, **Double Spy** applies a valid two-Spy composition in one click. Each Spy must independently be the sole survivor with the Lord eliminated last. This is not a Spy team. Custom counts remain available.
