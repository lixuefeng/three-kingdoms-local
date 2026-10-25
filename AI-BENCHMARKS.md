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
