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
