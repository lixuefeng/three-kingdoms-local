# Saved-position AI benchmarks (v0.70.0)

Evaluate one decision at a time without starting a game. Each case/run makes one model request using the production transport, parser, normalization and legality validator. No practice-bot fallback, retries, game execution or model memory carries between runs. This CLI does not change bots in live games.

Node 22+, with your existing LLM environment configuration:

```sh
npm run llm:bench -- --list
npm run llm:bench -- --dry-run --models kimi,claude,deepseek --runs 3
npm run llm:bench -- --models kimi,claude,deepseek --runs 3
```

The default command loads `.env.local` if present. For credentials elsewhere:

```sh
node --env-file=/path/to/bedrock.env scripts/llm-bench.mjs --models kimi --case weiyan-heal-before-end --runs 5
```

Live runs consume provider tokens. Requests run sequentially, without retries, with configured provider timeout/output budgets. Maximum 300 requests per invocation; `--runs` accepts 1–20. Ctrl+C stops further requests and retains completed results. Dry runs never call a model.

Reports go to ignored `data/ai-benchmarks/<timestamp>/`: `report.md` compares legal responses, strategy rubric results, latency and tokens; `results.json` includes complete requests, raw responses, normalized actions and validation failures. Usage is retained for invalid and truncated responses. `rawValidationReason` shows failures corrected by existing production normalization; `validationReason` describes the normalized action. Reasoning text is not required and is not used for grading. Configured credentials are redacted. Reports contain private game context; keep them local.

Five synthetic cases cover wounded Wei Yan healing before ending, discard priorities, complete Benevolence submission, armor response IDs and Pindian card selection. These isolate specific checks, not entire matches. Strategy scoring is a stated test expectation, not proof of optimal play or a win-rate measurement. Armor and Benevolence currently require manual strategic review: legal choices can have several defensible uses. Model memories are claims, not reliable explanations of its thought process.

## Compare input order

```sh
npm run llm:bench -- --models kimi --variants current,focused --runs 3
```

`current` uses the current gameplay system prompt and saved observation. `focused` moves self, players, legal prompt, briefing and agent state to the beginning of the input. It preserves all facts and instructions. This isolates ordering; it is **not** a shorter prompt and does not prescribe moves. No variant changes production behavior. Provider sampling may vary; repeat runs before drawing conclusions. Call order is fixed, not randomized.

## Test an actual logged decision

Extract a zero-based gameplay AI trace index (excluding chat/analysis) from your private JSONL archive:

```sh
node scripts/llm-bench-import.mjs /path/to/match.jsonl 12 data/ai-benchmarks/private-case.json
npm run llm:bench -- --file data/ai-benchmarks/private-case.json --models kimi --runs 3
```

The importer uses only the bot's original request observation, never omniscient state or other bots' private hands. It refuses to overwrite an existing file. Saved deadlines are removed. The current system prompt is used, so this tests today's contract against that historical position rather than reproducing a historical model call byte for byte. Imported fixtures are manual-review cases until you add a rubric. Do not publish archives or private fixtures.

A custom fixture file is an array of `{id, description, observation, expected?}`. `observation` has the same shape as the production bot input and includes `you`, `players` and `prompt`. Optional rubric fields: `anyIds` (at least one selected ID must match), `avoidIds` (none selected), `targets` (exact ordered target array). Omit `expected` for manual review. Rubrics should allow reasonable alternatives and must not use hidden information unavailable at the decision.

`npm test` uses mocked responses only. It never runs the paid benchmark.

## Experimental investigation tools (v0.71.0)

```sh
npm run llm:bench -- --models kimi --variants current,tools --runs 3 --dry-run
npm run llm:bench -- --models kimi --variants current,tools --runs 3
```

`tools` lets the model investigate before submitting: inspect self/public players/rules/legal options; preview a current action; or explore one follow-up present in the engine's recorded equipment projection. These are JSON tool requests handled locally, compatible with both existing provider transports. No provider-specific native function-calling API is required. There is no prescribed target, sequence, or mandatory planning stage. The model can submit immediately.

Each tool decision permits at most **four total model calls**. The last call must submit an action; another tool call returns `tool-budget-exhausted`, without a substituted action. Total wall-clock budget is four configured request timeouts. External cancellation stops the loop. Dry-run request counts include the maximum tool budget, and the 300-request cap uses that upper bound. Reports include `modelCalls`, every round's request/response/tool result, total token usage including failures, and total latency. This costs more than single-request mode; compare quality as well as cost.

The tools read only the saved bot observation. They cannot access the deck, hidden hands, authoritative match state, or external sites. They do not execute actions. Preview coverage is intentionally limited: absent engine projections return unavailable, not an invented simulation. Explore supports only one recorded follow-up, not arbitrary multi-step rollouts. Old logs may lack previews; use newer logs for meaningful tool tests. Tool responses and prior tool calls are supplied as data in the next request; private chain-of-thought is neither requested nor scored.

The built-in fixtures were corrected in v0.71.0: turn options and tactical facts now come from engine positions; Attack allowance is explicitly spent in the healing case; discard has four cards at three HP in Discard phase; armor is actually equipped; the Pindian opponent has a card. Regenerate with `node scripts/build-decision-cases.mjs`. Do not combine old and new fixture scores as if they were the same test.

Live-game bots continue using the existing single-request mode. This experiment measures whether investigation helps before enabling it in matches.

## Explicit action contract and correction (v0.72.0)

The gameplay prompt now uses explicit named actions rather than overloaded `ids`/`targets`. Each observation includes `actionContract`, describing the current action names, exact offered option/card/target IDs, counts, skill restrictions and required response fields. Examples:

```json
{"action":"discard_cards","card_ids":["c2"]}
{"action":"play_card","option_id":"play:sha:c4","target_ids":["p2"]}
{"action":"use_skill","option_id":"skill:rende","card_ids":["c2","c3"],"target_ids":["p3"]}
{"action":"end_phase"}
```

This is locally validated JSON, not native provider tool calling or an MCP server. The decoder maps named fields deterministically to the engine's existing internal selections. Legacy responses remain supported for old adapters and archived tests, but are not advertised to the model. Explicit submissions reject unexpected fields; missing arguments cannot be filled from memory or plans. Omit `mode_id` unless the skill offers actual modes. For reactive skill-plan prompts omit `option_id`; for non-card responses/options use `option_ids`. Stargazing uses `arrange_cards` with ordered `option_ids`, including the bottom marker. Current card-selection prompts identify whether selecting a card means discarding it.

Live gameplay permits one correction after invalid JSON or an invalid action, within the original overall request timeout and decision deadline. Nothing executes before a valid response; a legal but poor choice is never overridden based on its explanation. HTTP errors, timeouts, stale windows and truncation do not receive automatic retries. Model-call caps include correction calls. Debug traces retain both attempts and sum provider usage, including failures; nested attempts are credential-redacted too.

Benchmarks also permit one invalid-action correction. Normal mode uses at most two calls within one configured timeout; tool mode retains its four-call total budget. Dry-run caps now count two calls per normal case and four per tools case. These are maximum budgets, not mandatory extra thinking. Reports include `appVersion` so results from different contracts can be distinguished. Do not compare v0.72 scores with older contracts without noting this change.

The bot's knowledge now includes factual feedback: the last submitted selection, observed HP/hand changes, current own hand, and recent own public card events (e.g. Discarded Peach). Submission does not prove success; observed changes can include intervening actions. The model must use these facts instead of treating its prior notes as what happened.

## Recorded failure regression suite (v0.73.0)

Replay the positions behind the reported mistakes, without playing another match:

```sh
npm run llm:bench -- --suite logged --list
npm run llm:bench -- --suite logged --models kimi --variants current,role-focus,consequence-focus,review --runs 3 --dry-run
```

For the ally-targeting issue alone:

```sh
npm run llm:bench -- --suite logged --case recorded-luxun-attack-ally,recorded-luxun-steal-ally --models kimi --variants current,role-focus,consequence-focus,review --runs 3
```

That command allows at most 60 provider calls (usually fewer). Add `--dry-run` to preview. For all seven positions the upper bound is 210 calls. Test other configured models by changing `--models`; the existing per-invocation cap remains 300. No live calls run during `npm test`.

The suite contains two Lu Xun ally-targeting positions, Wei Yan's actual play and discard decisions, Pang De's weapon replacement, and Liu Bei's horse/equipment and Benevolence choices. Inputs come only from the saved bot observations. Player IDs are anonymized; human chat is removed. Strategic model memory and prior plans are retained (with identifiers redacted), including their incorrect assumptions. Historical engine previews are preserved without silently upgrading them to today's previews. These are redacted historical positions, not byte-identical original requests or reconstructed matches. Rules, inputs and model behavior can differ by version.

### Controlled prompt alternatives

- `current`: current production prompt, same recorded observation.
- `role-focus`: adds general guidance to evaluate moves by the bot's role objective and uncertain identity evidence, allowing friendly interactions with concrete team benefits.
- `consequence-focus`: adds general guidance to compare costs, HP, hand limits, equipment changes, targets and follow-up opportunities.
- `review`: obtains one candidate using `current`, then makes a fresh request to keep or replace it against the unchanged board. Nothing executes between passes. Both calls can use the existing one-correction allowance: at most four calls total. An unsuccessful final review is a failed result, not silently replaced by the initial action.

These are benchmark-only strategies; no winner is automatically promoted to live-game bots. They do not prescribe a particular target or action. The model receives no fixture description, rubric, historical selected action, grade, or future outcome. Review receives only its own candidate and the original observation. No private chain-of-thought is requested. Reports retain both stages, their actual choices and total cost; `firstPass.grade` allows checking whether review improved or worsened a decision.

### What the scores mean

The two Lu Xun cases flag harmful actions toward the player assessed at approximately 92.4% Rebel by this Rebel bot, with no visible delayed spell to remove. That identity assessment is still uncertain. The rubric accepts other legal choices; it measures avoidance of this specific suspected mistake, not optimal play. It checks action/target pairs so using a different harmful card against the same likely ally is not counted as a fix. Wei Yan's discard rubric prefers retaining Peach. The four other positions remain manual-review cases because several strategies can be defensible. Illegal actions are scored separately.

`report.md` now includes results per case as well as totals. Review raw actions and costs, use repeated runs, and validate promising changes on held-out positions before changing the production prompt. This small suite does not establish win-rate improvement or prove a general ban on friendly damage; beneficial friendly-damage cases still need separate coverage. Calls run in fixed order, so provider changes and sampling are possible confounders.

The included `historicalAction` is report metadata only. It is never shown to the model. The local-only `scripts/build-log-regressions.mjs` reproduces these fixtures from the two original archive layouts using known row positions; it refuses existing output and verifies the source general. Do not point it at unrelated archives or assume automatic redaction makes arbitrary human text safe to publish. Raw archives, credentials and private reports remain excluded from git.

Also corrected the contract text: optional metadata is `memory`/`plan`, not `notes`. No decoder relaxation is needed.

v0.74.0 makes `role-focus` available as an opt-in live-game bot strategy. Its text is shared with the benchmark through `bot-strategy.mjs`, preventing prompt drift. Other experimental variants remain benchmark-only.

## Investigate a recorded rescue decision

`llm:investigate-rescue` tests the Huang Zhong / Sun Jian rescue without publishing the archive or its private player information. It reads **only the acting bot's original debug observation**, not archive state, other players' hidden hands, future events, or the dying player's true identity. The original match must contain AI debug traces; the archived prompt ID identifies the decision.

```sh
npm run llm:investigate-rescue -- --archive /path/to/match-19587f43-07ec-4459-b7d3-c2cfc98b6ede.jsonl --prompt-id a1405b3f-9a54-4f57-aa64-cf51b51c622b --model claude --runs 3 --dry-run
npm run llm:investigate-rescue -- --archive /path/to/match-19587f43-07ec-4459-b7d3-c2cfc98b6ede.jsonl --prompt-id a1405b3f-9a54-4f57-aa64-cf51b51c622b --model claude --runs 3
```

Each run uses four independent requests: (1) rule-knowledge questions, without the match observation, (2) comprehension questions about the original observation, (3) a gameplay decision using that observation, and (4) the same decision with a factual rescue summary added. The model never receives the answers to earlier probes. The order of the two decision variants alternates by run. Gameplay decisions use the current prompt and validator, not an exact historical API replay; each can make one correction request, so each run uses up to six model calls. Claude uses the configured effort, output budget, and timeout; a saved game deadline is removed, so latency is not equivalent to a live rescue window.

The focused summary includes recent public events, the offered Peach/Pass effects, and the target's existing uncertain role assessment. It does not prescribe a move. It must not be interpreted as a full simulator: simultaneous responses and future cards are unknown. Rule and comprehension responses are open-ended and require manual review; neither a particular action nor a role belief is treated as ground truth. Compare choice frequencies, legality, token usage and latency across runs, but small sample counts do not establish causality.

Results, including the bot's private observation, are written under `data/ai-investigations/` by default with restrictive permissions. They are not game moves and do not alter the live bot. Use `--out` to select another private output folder. Never publish the archive or the resulting report.
