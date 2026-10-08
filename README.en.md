# Eranaut

**English** · [繁體中文](README.md)

> An installable **PWA + Fastify API** for tracking FFXIV submarine return times across multiple workshops: Discord login, Discord / browser push reminders, and self-hosted OCR of game screenshots. Built for — and used by — a Discord community of about 128 members.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-%E2%89%A522.22.3-brightgreen)](https://nodejs.org)
[![Angular](https://img.shields.io/badge/Angular-22-DD0031)](https://angular.dev)
[![Fastify](https://img.shields.io/badge/Fastify-5-000000)](https://fastify.dev)

### 👉 [Live demo: demo.eranaut.aequoreranos.com](https://demo.eranaut.aequoreranos.com/)

No login, fake data that lives only in your browser. It is the real Angular frontend with a fake backend swapped in: you can add workshops, upload any image to try "screenshot recognition" (it returns a fixed sample result), and turn on notifications in Settings and send a test notification. On a phone, add the page to your home screen first and open it from the icon. See [Demo mode](#demo-mode).

> The UI is in Traditional Chinese, because it is built for a Traditional Chinese FFXIV community.

![Overview (desktop)](docs/images/desktop-overview.webp)

<table>
  <tr>
    <td><img src="docs/images/mobile-overview.webp" alt="Overview (mobile)" width="260"></td>
    <td><img src="docs/images/mobile-update.webp" alt="Verifying recognition results (mobile)" width="260"></td>
    <td><img src="docs/images/mobile-settings.webp" alt="Settings and reminder methods (mobile)" width="260"></td>
  </tr>
  <tr>
    <td align="center">Overview</td>
    <td align="center">Verifying OCR results</td>
    <td align="center">Settings & reminders</td>
  </tr>
</table>

![Update submarines: verifying after recognition (desktop)](docs/images/desktop-update.webp)

## What it is

In FFXIV, submarine expeditions take hours to days, and players with several workshops and several boats each easily forget to collect them. Eranaut lets community members record their workshops and each boat's return time, and get reminded before they return.

This repository is the **production frontend + backend monorepo** (with its full development history), currently running on a Mac mini for the community. The companion Discord bot is a separate project: [`eranarch-bot`](https://github.com/VisyLockhart/eranarch-bot).

## Features

- **Discord OAuth2 login**, with the bot querying guild membership and roles to decide who is eligible (rules can combine AND / OR, e.g. `A+B,C`).
- **Overview**: every workshop and submarine sorted by return time, with countdowns and "soonest return"; list and card views, filterable by workshop.
- **Workshop management**: create, edit, delete, and reorder by drag or buttons (mouse and touch).
- **Update submarines**: type values in, or upload / paste / capture a game screenshot for the self-hosted OCR; results are verified boat by boat before submitting, and low-confidence fields are flagged "please verify".
- **Reminders**: Discord DM, server-channel mention and browser push (Web Push) can be combined; each workshop can remind N minutes ahead, or once per batch.
- **Route simulator**: pick waypoints on a sea map to get travel time, return time and fuel; waypoints you cannot take (level or range limit) are greyed out live; edit part builds (10⁴ combinations) against the route's requirements; get route suggestions by goal (levelling, exploration, variety, a specific drop), or the reverse — find the part combinations that meet a target. Builds can be saved and synced across devices, and each can be bound to several workshop submarines. The dataset is third-party and **not MIT** (see the license at the end).
- **PWA**: installable to the phone's home screen; the service worker caches only the app shell, and the API always goes to the network.
- **Interface**: dark theme only, separate phone and desktop layouts, three interface sizes, collapsible stats (phone) and sidebar (desktop), pull-to-refresh on phones.

## Engineering highlights

If you want a quick tour of the engineering trade-offs, start here (full context in [`docs/ARCHITECTURE.en.md`](docs/ARCHITECTURE.en.md)):

- **Self-hosted OCR, no external service**: PP-OCRv4 runs inside the API process; images are processed in memory only and never written to disk. The parser is a pure function designed around the engine's known misreadings, and **flags uncertain fields instead of guessing**. Concurrency is capped, with a bounded queue and a 429 beyond that.
- **Reminders without an external queue**: pending reminders live in SQLite and the API polls every 30 seconds; they are upserted keyed by submarine, so data stays bounded and no cleanup job is needed. Retries, permanent failures and "late reminders are dropped" all have explicit rules.
- **One data entry point**: the Discord bot calls the same API (internal port, shared secret) instead of opening SQLite itself.
- **Authentication kept simple**: server-side session cookie (only a hash is stored), `SameSite=Lax`, same-origin so no CORS, Origin check. Every "didn't do it" (JWT, CSRF token, PKCE) is documented with its reason.
- **Eligibility rule defined once**: website login, the daily sweep and bot commands share one evaluation function; losing eligibility only suspends (data is kept), and the sweep aborts entirely if Discord returns no member list, so an outage cannot suspend everyone.
- **Per-device Web Push**: one reminder fans out to all of a user's devices, dead subscriptions are pruned automatically, and iOS's "must be added to the home screen" restriction is handled.
- **Demo mode**: the same Angular code with a fake `HttpBackend` swapped in via build-time `fileReplacements`; the production bundle contains no demo code.
- **Route calculations are pure functions**: selection rules, shortest order, build search and route recommendations live in `route/core/`, independent of Angular; the dataset ships in a lazy chunk (works offline); features are switched by an injected `ROUTE_FEATURES` token (the demo turns saving and binding off).
- **Tests**: backend uses Node.js's built-in `node:test` (OCR parsing, reminder delivery and retries, eligibility sweep, authentication, and more); the frontend has about 560 unit tests.

## Demo mode

The [live demo](https://demo.eranaut.aequoreranos.com/) is not a separate page; it is the **same frontend** plus a fake backend enabled only at build time:

- Angular's dependency injection swaps `HttpBackend` for `DemoBackend`, which intercepts every `/api/*` request, so the screens and all other code are untouched. The fake backend mirrors the real API's validation and error formats, and data is kept in the browser's `localStorage`.
- `fileReplacements` in the `demo` build configuration performs the switch, so the production bundle contains no demo code.
- The "展示模式" (Demo mode) tag at the bottom right can reset the data, log out to show the welcome page, or jump to the various login-failure screens.
- What the demo does **not** have: real Discord login, real OCR (it returns a fixed sample result), and real push scheduling ("send test notification" is displayed locally by the service worker and looks the same as the real thing).
- The **route simulator** is fully usable in the demo, but **without saved builds and workshop-submarine binding** (both need login and server-side tables): the build is just a temporary one kept in this browser, and "reset data" clears it too. This is done with the `ROUTE_FEATURES` injection token — the demo configuration sets `saving` to `false`, the screens hide the related buttons, and `RouteVm` never calls `/api/route-subs`.

Build the demo locally (shared must be built first):

```bash
npm install
npm run build:shared
cd web && npx ng build --configuration demo
# Output is in web/dist/demo/browser; serve it with any static server that has SPA fallback, e.g.:
npx serve -s dist/demo/browser
```

Source: [`web/src/app/demo/`](web/src/app/demo/). Deployment is done by [`.github/workflows/demo-pages.yml`](.github/workflows/demo-pages.yml).

## Architecture

```
shared/  Constants and types shared by frontend and backend (fixed options, reminder-method bit flags, API request / response types)
api/     Fastify API: a public port (website) and an internal port (Discord bot), sharing one service / repository layer
web/     Angular frontend (PWA)
```

- **Backend**: Node.js + TypeScript + Fastify, SQLite (`better-sqlite3`), `web-push`, `toad-scheduler` for the schedules.
- **OCR**: `@gutenye/ocr-node` (PP-OCRv4 through `onnxruntime-node`), `sharp` for resizing.
- **Auth**: Discord OAuth2 Authorization Code Grant with the token exchange on the backend; server-side session cookie.
- **Reminders**: pending reminders stored in SQLite, polled every 30 seconds inside the API process; eligibility is re-checked once a day.
- **Deployment**: Docker Compose; Cloudflare Tunnel plus Caddy (Caddy serves the static frontend and proxies `/api`), with no inbound ports open on the host. Those deployment files are not in this repo — only `api/Dockerfile`, `web/Dockerfile` and `web/Caddyfile`.

For the full design context — why each choice was made and what was given up — read **[`docs/ARCHITECTURE.en.md`](docs/ARCHITECTURE.en.md)**.

## Project layout

```
.
├─ shared/src/            Shared: api.ts (request / response types), constants.ts (servers, districts, limits, …), notify.ts (reminder-method bits)
├─ api/
│  ├─ src/
│  │  ├─ main.ts          Startup: load config, open public and internal ports, start schedules and OCR warm-up
│  │  ├─ server.ts        Assembles Fastify and the routes
│  │  ├─ config.ts        Environment parsing and validation (missing or malformed values fail startup)
│  │  ├─ auth/            Session guard, eligibility rules (permissions)
│  │  ├─ db/              SQLite connection and migrations (append-only)
│  │  ├─ discord/         Discord API client and message sending
│  │  ├─ ocr/             Image preprocessing, PP-OCRv4 engine, parser (pure functions), concurrency limiter
│  │  ├─ push/            Web Push sender
│  │  ├─ repo/            Data access (SQL lives only in this layer)
│  │  ├─ routes/          HTTP routes (HTTP only; business rules are in services/)
│  │  └─ services/        Login, reminders, polling, eligibility sweep, suspension, and other business logic
│  └─ test/               node:test suites and fixed OCR samples
├─ web/
│  ├─ src/app/
│  │  ├─ core/            API client, per-screen view models, wait-time compensation, … (mostly unit-tested)
│  │  ├─ overview/ workshops/ update/ settings/ auth/   The screens
│  │  ├─ route/           Route simulator: core/ (pure functions), data/ (third-party dataset, CC BY-NC-SA — see NOTICE.md there) and the tab screens
│  │  ├─ layout/ ui/      Shell and shared components
│  │  └─ demo/            Demo mode (enabled only in the demo build)
│  ├─ dev.mjs             Local dev proxy (/api → local API, everything else → Angular dev server)
│  └─ Caddyfile           Production static-file and /api proxy configuration
└─ docs/                  ARCHITECTURE (design context), DESIGN-NOTES (D-xx explained), images/
```

## Setup

> This project was built for one specific community and is not meant for others to deploy. The steps below let you run the complete system locally (including login) or see how the parts fit together. If you only want to see the UI, just use the [live demo](https://demo.eranaut.aequoreranos.com/).

You need **Node.js 22.22.3 or later** (an Angular CLI requirement; 24.15+ also works). To actually log in you also need your own Discord application, a bot, and a test server.

### 1. Create the Discord application and bot

In the [Discord Developer Portal](https://discord.com/developers/applications), create an application:

1. **OAuth2** tab: copy the *Client ID* and *Client Secret*, and add `http://localhost:4200/api/auth/callback` under *Redirects* (with another domain, use `${PUBLIC_ORIGIN}/api/auth/callback`). Login only requests the `identify` scope.
2. **Bot** tab: create the bot and copy its token; enable **Server Members Intent** (a privileged intent, needed by the daily eligibility sweep).
3. Invite the bot to your test server. To test channel-mention reminders, the bot needs "View Channel" and "Send Messages" in that channel.
4. Turn on Developer Mode in Discord and right-click the server and the roles → *Copy ID* to get the guild ID and the IDs of the eligible roles.

### 2. Configure environment variables

```bash
cp .env.example .env   # .env is never committed
```

| Variable | Description |
|---|---|
| `PUBLIC_ORIGIN` | Site origin, no path. For local development use `http://localhost:4200` (same origin; used for the OAuth callback and the Origin check) |
| `COOKIE_SECURE` | `false` for local http development; `true` in production |
| `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` | From step 1 |
| `DISCORD_BOT_TOKEN` | The bot token (shared with Eranarch) |
| `DISCORD_GUILD_ID` | The guild ID |
| `ELIGIBLE_ROLE_RULE` | Eligibility rule: `,` = OR, `+` = AND, e.g. `A+B,C` = (A and B) or C. Values are role IDs; an empty or malformed value fails startup |
| `GUILD_DISPLAY_NAME` | Server name shown on the login-failure screens |
| `INTERNAL_API_SECRET` | Shared secret for the internal port (used by the bot), a random string of at least 32 characters (e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |
| `REMINDER_CHANNEL_ID` | Channel ID for channel-mention reminders (optional; if empty, a user who enables channel reminders gets them marked as failed) |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | Browser push (optional). Leave both keys empty to disable push; generate a pair with `npx web-push generate-vapid-keys` and never change it afterwards (everyone would have to re-enable push) |
| `PUBLIC_PORT` / `INTERNAL_PORT` / `DATABASE_PATH` | Public port (default 3000), internal port (3001), SQLite file location (the directory is created automatically) |

### 3. Run it

```bash
npm install
npm run build:shared      # build the shared types and constants first
npm run dev -w api        # build and start the API (reads the .env at the repo root)
npm start -w web          # in another terminal: start the frontend and proxy, then open http://localhost:4200
```

When you log in with Discord, that account must be a member of your test server and match `ELIGIBLE_ROLE_RULE`; otherwise you will see the matching failure screen (not in the server, missing the eligible role, and so on). The API preloads the OCR models at startup.

### 4. Tests and build

```bash
npm test                          # build shared, then run the node:test suites of shared and api
npm test -w web -- --watch=false  # frontend unit tests
npm run build                     # build shared, api and web
```

The backend uses Node.js's built-in `node:test`, with no extra test framework. The `ocr-real` suite is an integration test that runs the real engine on real screenshots; those screenshots are not in the repository (they contain player information), so it is skipped by default and only runs when `OCR_TEST_DIR` is set. The parser itself is tested against fixed OCR output and needs no screenshots.

## `D-xx` and `SCHEMA §` in the code

Code comments often contain markers such as `D-125` or `SCHEMA §8.1`. They are numbers from the author's design documents and explain *why* something was done that way. The route simulator also uses `RS-xx` numbers, where `RS-nn` is `D-(178+nn)`. Those original documents are not published; read [`docs/DESIGN-NOTES.md`](docs/DESIGN-NOTES.md) (Traditional Chinese) for the convention and a summary of the main decisions, and [`docs/ARCHITECTURE.en.md`](docs/ARCHITECTURE.en.md) for the fuller context.

## Known limitations

An honest list of what is not done, or deliberately not done (details in [`docs/ARCHITECTURE.en.md`](docs/ARCHITECTURE.en.md#known-limitations-and-technical-debt)):

- One host and one SQLite file; no horizontal scaling (a deliberate choice for the current scale).
- One guild per API deployment; eligibility only recognizes the single configured server.
- OCR is tuned for screenshots from the Traditional Chinese client only, other language versions are untested, and there are only 11 real screenshots, which are not kept in the repo — so the "real screenshot" integration test is skipped by default.
- No end-to-end (E2E) tests; browser-level behaviour is verified manually and on real devices.
- This repository does not include `docker-compose.yml`, the Tunnel configuration or the backup scripts, so it is not "clone and deploy in one step".
- On iOS, push only works after adding to the home screen; that is a platform restriction.

## Related projects

- [`eranarch-bot`](https://github.com/VisyLockhart/eranarch-bot): the companion Discord bot (nickname sync, open source).
- [`eranaut-demo-page`](https://github.com/VisyLockhart/eranaut-demo-page): the early plain-JavaScript demo-page prototype, superseded by the demo mode above.

## Disclaimer and license

An unofficial fan tool, not affiliated with SQUARE ENIX CO., LTD., for community use only.

License: the code is [MIT](LICENSE). **Exception:** the route dataset in [`web/src/app/route/data/`](web/src/app/route/data/) is a converted version of third-party data (the Huiji wiki submarine tool, itself based on articles by Lodestone author Eclair Falcie@Hades; Traditional Chinese names come from a compilation on GitHub). It is released under the source's **CC BY-NC-SA 3.0** license (Attribution-NonCommercial-ShareAlike) and is not covered by MIT; keep the [NOTICE.md](web/src/app/route/data/NOTICE.md) in that folder when redistributing or adapting it, and do not use it commercially. Created by Visy Lockhart (Winter@迦樓羅).
