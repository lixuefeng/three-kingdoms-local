# LLM bots (v0.66)

v0.66 expands every general with concrete play sequences, card reserves, skill/response decisions and hypothetical worked examples, informed by additional Chinese-language research. `generalStrategy.tactics` selects sections for the current decision; only the acting general receives these details. Revised-version source advice is filtered against the local classic rules. Full source notes and all 44 playbooks are in `GENERAL-STRATEGY.md`; regenerate it with `node scripts/build-strategy-guide.mjs`. This increases input context, not the number of model calls. Match quality still needs live evaluation.

v0.65 adds a source-linked `generalStrategy` playbook for every supported general, adapted to this build's skill versions. The model receives its own guide plus short public matchup notes, not the whole 44-general collection. General selection receives plans for the offered candidates. See `GENERAL-STRATEGY.md` for all summaries, sources and version exclusions. These are context instructions, not fine-tuning or guaranteed optimal strategy. One decision remains one request; the guide increases input tokens modestly.

v0.64 adds strategic coaching to the system prompt and a `decisionBriefing` at the beginning of each observation. `agentState.tactics.handEconomy` reports hand limit and predicted discards under current conditions; Composure's optional skip is identified separately. These are factual forecasts, not guaranteed outcomes after future effects. Coaching applies to all configured LLM models, with one request per decision. Inspect **System prompt** and **Input** in AI traces to see exactly what the model received. This adds input tokens but does not change output-token limits, deadlines or request caps. Models may still choose poor legal moves; they are not forcibly replaced based on strategy.

Parameterized skill actions now include `costs` (own card IDs), `targets` (ordered player IDs), and `mode` when offered by the selected option's `actionSpec`. Submit them with the action in one response; do not activate a skill and defer its recipient to a later request. Ordinary card plays continue to use `ids` and `targets`. Optional `plan` steps may use skill kinds such as `skill:rende`; these record intentions and do not execute future actions.

The game server supports OpenAI-compatible Chat Completions and native Bedrock Converse for Claude. The browser never receives your key. No endpoint is contacted until you explicitly add/switch an LLM bot or run the connection check. Existing practice bots work without configuration.

## Quick start

1. Start a model server locally, or obtain a hosted provider's compatible endpoint, model ID and API key.
2. In the game directory, copy `LLM.env.example` to `.env.local`.
3. Set `LLM_BASE_URL` to the API base ending in `/v1` (or the provider's documented base), and `LLM_MODEL` to the exact loaded model ID. Add `LLM_API_KEY` if required. For a hosted service, use its HTTPS base; no particular model is hardcoded.
4. Run `npm run llm:check`. It sends only a synthetic test decision and prints success, latency, token usage, or a sanitized failure category.
5. Run `npm run start:llm`. In a room, click **Add bot**, then select Kimi, Claude, DeepSeek or Practice bot in its model selector. Add bots/friends to reach four seats, then start.

Requires Node with `--env-file` support (Node 20.6+). You can instead export the environment variables yourself and run `npm start`. `.env.local` is not read by ordinary `npm start`.

For a local model on the same Mac as the game server, the example `http://127.0.0.1:1234/v1` works only if your model server actually listens there. It is an example address, not an included model. The connection check must pass before expecting LLM decisions. If the game runs in Docker, localhost means the container; set the endpoint to a reachable host address and pass variables with Docker's `--env-file .env.local`.

Keep your existing `PUBLIC_ORIGIN` setting for tunnel access. Friends need only the game URL; they do not need the model endpoint or API key.

## Controls and fallback

The host can select a model per bot in the lobby. During a game, **AI controls** shows successes, fallback counts, last response time/status, and token usage; it also switches strategy without restarting. Switching cancels a pending model request and uses the tactical fallback for that answer. Private request/response details are hidden unless the optional host-only decision inspector is enabled.

Each model response must satisfy the prompt's legal IDs, counts, costs and ordered targets. Invalid JSON, illegal choices, HTTP failures and timeouts fall back to the existing tactical bot. No automatic request retries. A failed model choice consumes no game cards. Shared Negation/Peach windows keep their existing deadlines; late choices are discarded.

`LLM_TIMEOUT_MS` defaults to 10000 and is additionally limited by the remaining decision deadline. Existing bot pacing and animations are unchanged. Shared responses can have only a few seconds of model time: a slow/warming model may fall back frequently. `LLM_MAX_REQUESTS_PER_MATCH` defaults to 300 per LLM seat, after which the seat uses fallback for the rest of that match. This is a request cap, not a currency spending guarantee.

`LLM_MAX_TOKENS` controls completion budget. Reasoning models may need a larger budget and longer timeout. Set `LLM_TOKEN_FIELD=max_tokens` for older compatible servers; otherwise `max_completion_tokens` is sent. Set `LLM_JSON_MODE=off` if the server rejects `response_format`; the response must still contain valid JSON. API keys/provider error bodies are never printed in diagnostics.

## What the model sees

Own hand, own identity, own general and skills, public player state and card counts, public equipment/judgment/wounds, current prompt, legal choices, card rules, last 45 public log entries, and its own bounded strategic memory. Opponents' living hidden roles and hands, deck order, private chat, testing draw catalog, and other bots' memories are excluded. Names/history are treated as game data, not trusted instructions. With a hosted provider, this permitted game context is sent to that provider.

Memory is isolated by match and seat and cleared when the game is stopped/reset. It contains beliefs, not authoritative information. Nothing is added to public chat.

## Scope and validation

One adapter handles normal card play, ordered targets, skill plans/distribution, general selection, optional costs, responses, public card choices, Pindian and Stargazing. All prompts keep the existing engine rules.

Automated tests use a local mock HTTP endpoint, including timeout, malformed output, privacy checks, fallback, shared response windows and complete games. A real model must be tested with your endpoint; this release does not claim a higher win rate than the tactical bots. Inspect AI controls to distinguish model decisions from fallback decisions.

## Bedrock: Kimi, Claude and DeepSeek in one room

Your existing `LLM_BASE_URL=https://bedrock-runtime.us-east-1.amazonaws.com/openai/v1`, `LLM_MODEL=moonshotai.kimi-k2.5` and `LLM_API_KEY` configuration works unchanged. The server recognizes this endpoint, derives the native runtime root, and uses the same bearer token for all three profiles:

| UI choice | Default model ID | Transport |
|---|---|---|
| Kimi | `moonshotai.kimi-k2.5` | Chat Completions |
| Claude | `us.anthropic.claude-haiku-5-5` | Bedrock Converse |
| DeepSeek | `deepseek.v3.2` | Chat Completions |
| Practice bot | None | Local tactical bot |

Override IDs with `LLM_KIMI_MODEL`, `LLM_CLAUDE_MODEL` or `LLM_DEEPSEEK_MODEL`. Account permissions, token validity and regional model availability still apply. Model selectors indicate configuration, not confirmed model access. Run `npm run llm:check -- claude` (or `kimi`, `deepseek`, `--all`) to test actual access. No automatic paid connection tests run when opening the lobby.

Alternatively supply `BEDROCK_BASE_URL` (runtime root) and `AWS_BEARER_TOKEN_BEDROCK`. This adapter uses bearer-token authentication, not AWS access-key/SigV4 authentication. A non-Bedrock local/custom endpoint remains available as an additional configured-model choice; its key is never automatically sent to AWS.

Each bot can choose a different model. Switching cancels a pending request; late results are ignored. Provider-written free-form notes are separate per model, match and seat. Server-maintained knowledge and turn plans stay with the same bot seat when its model changes. The request cap is shared across all model choices for a seat, so switching models does not reset it.

## Optional prompt/input/output inspector

Set `LLM_DEBUG=1` in your protected server environment file, then restart. The host opens **AI controls → Decision inspector** to see each request's full system prompt and input JSON, raw response JSON, model label, status and elapsed time. Request/output text is capped at 100,000 characters per field, with the latest 20 traces retained per match in server memory. No trace files or console output are written; stopping/resetting clears the retained match traces. Only the host can fetch these traces; ordinary room state, spectators and other players cannot. API keys and authorization headers are excluded, and occurrences of the configured key are redacted.

The inspector intentionally reveals the bot's private hand and role to the host. Use it in testing games. With debug off, request/response traces are not collected. This does not expose hidden provider reasoning; it shows only content returned by the API.

## Deployment defaults

`/api/health` reads its version from `package.json`. The server defaults to `HOST=127.0.0.1`; set a LAN address explicitly for direct LAN access. The Docker image binds to `0.0.0.0` inside the container; publish it with `-p 127.0.0.1:3000:3000` for tunnel/local access. Keep bearer tokens outside release directories, keep the environment file mode `600`, and preserve `SGS_DATA_DIR` across releases. Replacing an environment file requires restarting the process to reload its credentials.

Converse request and bearer authentication references:
- https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_Converse.html
- https://docs.aws.amazon.com/bedrock/latest/userguide/api-keys-use.html

## Talking with AI players

Chat stays open at the bottom right. Select a bot in the **To** list, or mention its general or seat name (`@Zhang Fei`, `@Bot 1`). One addressed human message triggers at most one bot reply. Messages to Table without a bot mention remain ordinary human chat. Bots do not automatically reply to each other. The chosen recipient remains selected for a continuing conversation.

Kimi, Claude and DeepSeek reply using the model selected for that bot. Practice bots explain that they need an LLM model for conversation. Replies follow the sender's language and can discuss strategy or engage in friendly trash talk. An AI badge distinguishes generated replies.

Conversational prompts contain only public table state and the last 20 messages in the bot's own chat channel. Even the bot's own hidden identity, hand and private gameplay memory are omitted. Living bots cannot read gallery chat or receive messages from spectators/eliminated players during a match. A reply is discarded if its bot changes model, dies/changes channel, or the match changes while generating it.

Gameplay decisions can read the recent messages in their own chat channel to consider publicly proposed alliances and table talk. Chat replies cannot execute game actions. Chat requests run separately from gameplay, with at most one in flight per bot and two per room, a short cooldown, and a separate `LLM_CHAT_MAX_REQUESTS` budget (default 60 per bot per match/lobby). They do not consume the gameplay decision request budget. Model calls still incur provider usage; no unsolicited bot conversations run.

When `LLM_DEBUG=1`, the host inspector also shows chat system prompts, inputs and raw outputs, labeled `chat`.

## Persistent knowledge and turn planning (v0.54)

Bots now have a server-maintained private knowledge store. It observes public events as they happen from match start, even while a seat uses the practice strategy. It also records that seat's own hand observations. Switching models keeps this structured knowledge and plan; starting a new match clears them.

Inputs include:
- Cumulative attacks, hostile spells, damage, healing/support relationships and turn totals, including events older than the recent log window.
- Public card sightings and conservative confirmed revealed-hand information. A sighting is not a claim about current ownership; confirmed hand information is invalidated after a holder loses cards.
- The bot's own previously seen cards and recent hand changes, never an opponent's unexposed cards.
- Identity estimates inferred from public behavior and the bot's own identity. Joint role assignments respect the remaining role counts, including publicly revealed identities. These are heuristic beliefs, not calibrated probabilities or access to actual hidden roles.
- Channel-scoped table talk: statement counts and early/recent quotes per speaker. Gallery statements do not enter a living bot's knowledge.
- A turn objective, up to four intended card/target steps, reserve-card intentions, revisions and the most recent choice.

History is summarized, not sent as an ever-growing raw transcript: the prompt includes recent compact turn records plus older cumulative totals, all retained interaction totals and public card sightings. Per-speaker early/recent statement samples are bounded. This preserves facts across the old 45-entry cutoff without pretending the model receives every sentence from the entire game.

The engine supplies exact current distances, authoritative legal targets, attack limits and range after spending equipment. Attack forecasts account for known automatic armor, Wine, Bare Bodied, Guding, Fiery Bow availability and two-Dodge requirements. Damage forecasts are conditional on a hit and exclude optional prevention, judgments, redirection, damage transfer and chain spread. Supplied attacks or failed bluffs remain uncertain.

The model returns/revises a concise plan together with its normal decision; there is no extra planning request. Every actual action still requires its own validated decision, and future steps are never automatically executed. Missing plans retain a labeled baseline/previous plan for compatibility. With `LLM_DEBUG=1`, the decision inspector shows the stored plan and structured knowledge/tactical input. These private fields are absent from ordinary public state and conversational chat prompts.

This improves available context and planning structure; improved real-model win rates have not yet been established. No hidden-state simulations or extra agent debates are included.


### v0.55 response reliability

The response contract requires both `ids` and `targets`; `memory` and the nested `plan` are optional. Other top-level fields are rejected. Card-selection responses (including Pindian) may contain redundant known player IDs in `targets`; these alone are cleared, then the unchanged card selection is fully validated. Turn targets, unknown IDs and skill target ordering are never repaired.

The default output budget is now 1500 tokens. An existing `LLM_MAX_TOKENS=700` overrides the default: change it to `1500` in your external environment file and restart the server. The timeout and decision deadlines are unchanged; there are no automatic retries. Provider truncation is reported as `truncated-response`. Debug traces show stop reason, validation reason, token usage and any normalization. Provider-reported usage is counted even when JSON parsing or action validation fails, for gameplay and chat. No usage is invented for requests without a provider response.


### v0.56 tolerant metadata and cancellation causes

Action IDs, counts, costs and targets remain strictly validated. Optional planning metadata no longer invalidates an otherwise legal action. Misplaced reserveCardIds are folded into an existing plan and filtered to the bot's own hand; malformed optional plans and extra fields are ignored. Trace normalization explains repairs.

Cancellation statuses now distinguish request-timeout, decision-expired, window-closed, model-switched and match-ended. Generic external aborts remain cancelled. Timeout causes are recorded before aborting the network request, preventing the previous abort race. Deadlines and pacing are unchanged.


### v0.57 shared windows and single-action decisions

Default shared Negation/rescue windows last 15 seconds when any living seat uses an enabled LLM bot, independent of who has response cards. Practice/human-only games retain 5 seconds; explicit engine responseWindowMs overrides remain supported. All responses still close early once everyone answers; the model timeout remains unchanged.

Turn responses must select one action. The narrow two-ID pattern [legal action, end] is normalized to the first action and fully validated, without automatically ending the turn. Other multi-action responses remain invalid. Wine lasts only this turn. Traces color success green, cancellation/deadline warnings amber, errors red; system/input/output use separate backgrounds.


### v0.58 conversational identity

Chat input includes self, addressedByPlayer, participants and incomingMessage, with stable sender IDs and public nickname/general/seat aliases. Historical messages retain their original display names alongside current identity mappings. No role inference is treated as fact and no hidden hands or gameplay memory are added.


### v0.59 Liu Bei

Failed proactive Influencing requests are filtered from bot action options for the rest of the current turn, rather than relying on model memory to avoid repeating them. This is an AI retry safeguard, not a new restriction on human skill use.


### Persistent match archives (v0.60)

Full AI traces are written for every new match independently of LLM_DEBUG; that flag controls only the live inspector. Use the host's Match logs button to download an append-only JSONL file with interleaved game, chat, ai-trace, ai-plan, ai-diagnostic and bot-decision records. Each record includes the match ID and timestamp; AI traces identify the seat and prompt. The server path is SGS_DATA_DIR/match-logs/<matchId>.jsonl. External credentials remain outside archives and packages.

Archives survive reset and restart on disk. The existing room host can download that room's archives after resetting to the lobby. After restart, use server filesystem access because room sessions are not persisted. Logs contain private hands, roles, and model context. No automatic pruning is applied. This does not retroactively recover old matches or truncated in-memory traces.


### Match review (v0.61)

The host can review archived matches in Match logs → Review match, including after returning to the lobby. The timeline interleaves recorded events and decision requests. Select a decision for its own cards, identity probabilities, plan, legal choices, execution source, errors and raw input/output. The Show filter selects technical issues; repeated Lord requests are review flags rather than proof of a rules bug.

The optional Analyze decision button uses a configured model (OpenAI-compatible or native Bedrock Converse) and the same output budget/timeout. It sends only the historical bot observation plus the recorded response and executed action, never final/archive roles or later hands. Reasoning/signature blocks are excluded from the reviewer input. A concise English assessment with concerns, alternatives and confidence is saved as decision-analysis; the review request itself is archived as an analysis trace. Analysis uses separate counters and a 30-request per-match per-server-session cap. No model calls occur merely by opening the review. No live provider credential was available for development; transports and UI were tested against mocks.

## Claude reasoning budget

Claude defaults to 8192 combined reasoning/answer tokens independently of LLM_MAX_TOKENS, with a 20-second request timeout. Override with LLM_CLAUDE_MAX_TOKENS (1024–32768) and LLM_CLAUDE_TIMEOUT_MS. Existing game decision deadlines still take precedence; this does not extend player timers or add retries. The default Haiku 5.5 profile explicitly uses adaptive thinking and medium effort; LLM_CLAUDE_EFFORT can select low, medium or high. Overridden older Claude model IDs do not receive these Haiku-specific settings. More budget is a ceiling, not guaranteed usage; latency/cost may increase. No incomplete action is executed. Traces include outputBudget, hasReasoning, textCharacters and reasoningOnly, while provider usage remains counted on failures. No live provider credentials were available for end-to-end validation.

## Action consequences (v0.68.0)

Inspect `agentState.tactics.actionPreviews` in the AI trace Input. Each preview is keyed to a currently offered option. Equipment is projected onto a detached board containing the bot own cards and public information only; the engine then recomputes legal choices. `newOrChangedFollowUps`, `attacksAfter` and `distancesAfter` show what equipment can enable or remove. Target IDs retain their actual player IDs. Attack facts include armor and cost interactions, but are conditional on a hit and exclude later responses, transfer and chain resolution.

Follow-up option IDs belong to the hypothetical state; they cannot be selected in the current request. The model still chooses exactly one current action. No search, ranking or recommended sequence is generated. Unknown skill draws are flagged; the known-card projection is incomplete until actual draws resolve. Follow-ups are capped at 16 entries and projected Attack facts at 8, with exact counts and truncation flags. Basic draw, recast, healing, Wine and end-phase summaries are also supplied. Other skill/spell chains are not fully simulated. This adds context, not model calls; strategic improvement requires live evaluation.

## Spontaneous bot chat (v0.69.0)

After `Game.play` resolves its complete action, including responses, it emits a public before/after summary. A separate scheduler picks at most one eligible living LLM bot, gives it public action results and lets it return a short comment or silence (`{"reply":""}`). An optional turn-response field `chatIntent:"celebrate_if_successful"` offers the acting bot a higher-priority opportunity only if an actual resource/damage change occurred. The flag is not a prewritten message, strategic instruction or guaranteed celebration.

Host AI controls: Off / Occasional / Lively. Occasional waits at least 30 seconds between opportunities; Lively waits 20 seconds. Each bot waits at least 30 seconds and two table turns; there is a match-wide ceiling of 40 opportunities, in addition to the existing chat request caps. An opportunity consumes cooldown even if the model stays silent. Only one spontaneous job starts at once, and existing chat jobs take priority. Spontaneous messages do not trigger another chat job.

Spontaneous context never includes private hands, own hidden identity, saved memory/plan or the intent contents; only its enum affects eligibility. It is public chat context plus the public resolved-action summary. Promises are not specially coordinated. The generation is detached from game execution, with an 8-second request ceiling; default Haiku uses low adaptive effort for these optional messages only and at most 2048 output tokens. Other gameplay reasoning settings and addressed replies are unchanged. Failures post nothing. Replies are discarded after a turn/match/channel/model change, death, Off, or 12 seconds of age. This initial trigger covers completed card/skill plays; standalone judgments and damage outside a play do not independently trigger messages. Logs capture the AI chat traces, including `chat-silent`, and posted messages carry `spontaneous:true`. English is the default for spontaneous speech.
