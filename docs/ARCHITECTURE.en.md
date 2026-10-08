# Architecture and design decisions

**English** · [繁體中文](ARCHITECTURE.md)

This document records *why* things are built the way they are, not *how to run them* (see [`README.en.md`](../README.en.md) for that). The goal is to keep the decision context: what was tried or considered, why it was dropped, and what trade-off was accepted. The `D-xx` / `R-xx` markers you will see in code comments are explained in [`DESIGN-NOTES.md`](DESIGN-NOTES.md) (written in Traditional Chinese).

The overall shape first:

```
 Browser / phone home screen (Angular PWA)
        │  same-origin /api/*  (session cookie, no CORS)
        ▼
   Caddy ──static files── web/dist
        │
        ▼
 Fastify API ─┬─ public port:    used by the website
              ├─ internal port: used by the Discord bot (shared secret)
              ├─ SQLite (better-sqlite3, a single file)
              ├─ OCR (PP-OCRv4, same process, memory only)
              └─ two schedules: 30-second reminder poll, daily eligibility sweep
        │
        ├─ Discord API (OAuth, member and role lookup, DM / channel messages)
        └─ Web Push services (FCM / Apple / …, VAPID)
```

## 1. A PWA, not a native app

The first option was a Flutter app for Android and iOS. It was dropped for practical reasons: higher development cost, app-store review, and Apple's developer fee — while the actual usage is "glance at a countdown, update occasionally", which a web app handles fine.

**Trade-off:** on iOS a PWA has a limitation — `PushManager` only exists after the page is added to the home screen and opened from its icon. In return, one codebase serves desktop and mobile with no store at all. A native app would be reconsidered only if the iOS push limitation made too many people give up on push.

## 2. One entry point for data: the Discord bot goes through the API too

The companion Discord bot ([`eranarch-bot`](https://github.com/VisyLockhart/eranarch-bot)) needs to read submarine data (for example for its `/eran` commands). The obvious approach — letting the bot open the same SQLite file — was rejected: `better-sqlite3` writes synchronously, several processes writing to one file is asking for trouble, and data-access logic would live in two places and drift apart.

So all data access goes through one API. The API process opens **two ports**:

- **Public port**: used by the website, authenticated with a session cookie.
- **Internal port**: used only by the bot, authenticated with a shared-secret Bearer token; not published and not behind the reverse proxy. The secret is compared by hashing both sides to equal length first and then using a constant-time comparison, so neither length nor content leaks through timing.

Both ports share the same service/repository layer; the only difference is *who is calling* and *how identity is resolved*. Every internal request also carries the caller's Discord ID and roles, and the API re-checks permissions with the same shared function instead of trusting that the bot already filtered.

## 3. SQLite as the database

Oracle Autonomous Database (too much setup) and Redis / Kubernetes (over-engineering) were considered. The system serves a community of roughly 128 people on a single host, so a single SQLite file plus daily backups is enough and has the lowest operating cost.

Supporting decisions:

- **Every primary key is a UUID v4 (TEXT)**, never an auto-increment integer, so importing or merging across environments cannot collide.
- **All timestamps are stored as UTC ISO strings**; conversion to Taipei time happens in the API / frontend layer.
- **Notification methods are bit flags in one integer column** (DM, channel mention, push — one bit each). A "combined enum" (1 = all, 2 = none, …) was considered and rejected: the number of values multiplies with each method, and the meaning of "all" drifts as methods are added, which could silently enable a new method for a user. **The public API never exposes the bit numbers**; it returns named booleans so the frontend does not depend on the bit layout.
- **Migrations are append-only**; a published migration is never edited.

**Trade-off:** SQLite cannot scale horizontally. If the scale ever clearly exceeds expectations, the answer is to re-evaluate (for example Postgres). That is accepted on purpose — no complexity is paid for scale that does not exist.

## 4. Authentication: Discord OAuth plus a server-side session

Login is a standard Authorization Code Grant, and **the code is exchanged for a token on the backend** (the client secret must never reach the frontend). The backend only requests the `identify` scope, then uses the bot token to look up that user's membership and roles in the configured guild. The Discord token is discarded right after use and never stored.

| Choice | Rejected alternative | Why |
|---|---|---|
| Server-side session cookie (only a hash is stored) | Self-signed JWT + refresh token | A single API with SQLite gets nothing from stateless verification; refresh tokens add complexity; and a JWT cannot be revoked instantly |
| `SameSite=Lax` | `SameSite=Strict` | Strict does not send cookies on cross-site top-level navigation: the `state` cookie would be missing on the OAuth callback and login would fail, and opening the site from a Discord link would look logged-out on first paint |
| Frontend and API on the same origin, no CORS | Cross-origin deployment with `@fastify/cors` | Same origin needs no CORS at all; opening cross-origin access only enlarges the attack surface |
| Check `Origin` on state-changing requests | A separate CSRF token | `SameSite=Lax` + same origin + Origin check already covers the main attack surface; a token must be maintained on both ends, which is over-engineering at this scale |
| `state` parameter only | Adding PKCE | The backend holds the client secret, so someone who intercepts the authorization code still cannot exchange it |
| Sessions expire after 30 days idle | An absolute lifetime cap | Convenience first for a small community; people who lose eligibility already have their sessions removed by the daily sweep |

GET endpoints must never have side effects; the `SameSite=Lax` approach relies on that.

## 5. "Who is eligible" is defined in exactly one place

Eligibility is decided by Discord roles. The rule is a single string: `,` means OR and `+` means AND, so `A+B,C` means (A and B) or C. Originally only "any of these roles" was supported; it became composable because real role-management setups may require holding several roles at once.

The rule lives only in the API. Website login, the daily sweep and the bot commands **share one evaluation function**. "The bot caches the member list and filters it itself" was rejected — it would duplicate the rule and the two copies would disagree as soon as the AND/OR rule changed.

**Losing eligibility marks the account suspended; it does not delete data.** People who leave the server or lose the role keep their data, and it is restored automatically if they become eligible again. Manual and automatic suspensions are distinguished by a field, and the automatic sweep never touches a manual suspension.

**Safeguard in the daily sweep:** if the member list cannot be fetched from Discord, or comes back empty, the whole run is abandoned with no changes — otherwise a temporary Discord outage would wrongly suspend everyone. The sweep also runs once at startup, so it catches up right away after downtime.

## 6. Screenshot recognition: self-hosted OCR, no external service

This is the area with the most trade-offs in the project.

**The problem:** users must register the return times of several submarines, and typing each one by hand is tedious. They upload a game screenshot instead, the system reads each submarine's name and remaining time, and the user verifies the result.

**Choosing the engine:**

- Tesseract was tried first: the content to recognize is mostly Chinese and the in-game windows can be translucent; the success rate on real screenshots was very low.
- External services (cloud vision APIs, multimodal LLMs) were also rejected: the intent was that recognition should not require yet another external service.
- The result is **PP-OCRv4** (through `@gutenye/ocr-node` and `onnxruntime-node`), running inside the API process — free, and able to handle Traditional Chinese and translucent windows.

**Pipeline:**

1. An incoming image is rotated by its EXIF orientation and downscaled so its long edge is at most 1280 px (never upscaled). In measurements, 1280 px gave the same accuracy while being more than 3× faster on large phone images and using much less memory.
2. It is converted to raw pixels and fed to the engine. **Everything stays in memory and nothing is written to disk**, so no image-cleanup job is needed.
3. The engine returns text lines with per-line confidence, and a **pure-function parser** turns them into submarine data.

**The parser is a pure function** (it never touches images or models), so it can be unit-tested with fixed OCR output. It supports two screenshot formats: the "select submarine" menu window, and the "airship / submarine exploration" info page. PP-OCRv4 has known misrecognition patterns, and the parser is designed around them:

- The name prefix is misread (a character swapped for a similar-looking one): **position is taken from order, not from the name**, and the prefix is then normalized to the default name.
- Spaces inserted between digits, or `-N` glued to the time: times are extracted with a "number + unit" pattern that does not rely on whitespace.
- Simplified-Chinese glyph variants: normalized first.

**When it cannot be sure, it flags the field instead of guessing.** Lines below 0.85 confidence mark both name and time as "please verify", and the user has to look at them before submitting. That threshold was calibrated on 11 real screenshots (29 submarines; lowest confidence 0.869, median 0.93) and 77 deliberately degraded images (all 203 submarines read correctly, none missed by the flagging).

**Resource protection:** at most 2 images are recognized concurrently with a queue of 8; beyond that the API replies 429 `busy` with `Retry-After`, so a burst of requests cannot exhaust memory (every queued image still holds its upload buffer). A single user can also have only one recognition request in flight at a time.

**Separation of responsibilities:** the OCR endpoint only recognizes and never writes to the database; creating and updating are separate endpoints. The result goes back to the frontend for the user to verify, and only then is the update submitted.

## 7. The backend owns time, and the wait is compensated

The frontend **sends only the remaining time**, not a computed return instant; the return time is the backend's receive time plus the remaining time. The backend is the time authority.

But users spend time between taking the screenshot, verifying the result and pressing submit. For each row the frontend records a start timestamp (not an accumulating counter, because browsers throttle or freeze background tabs), and the displayed remaining time drops by one minute for every full minute elapsed. **On submit, any leftover partial minute is rounded up and subtracted as one more minute** — better for the return time to be slightly early than late, since an early reminder costs far less than a missed one. If any row reaches 0, the data is considered stale and a new recognition is required.

## 8. Reminders: database plus polling, no external queue

The requirement is "notify N minutes before return". The design:

- Pending reminders live in one SQLite table. The API process **polls every 30 seconds** for due items, using `@fastify/schedule` to prevent overlapping runs and to shut down with Fastify.
- No Redis or external queue, and no in-memory timers — pending reminders are in the database, so a restart simply continues where it left off.
- **The whole system has only two schedules:** this poll and the daily eligibility sweep.

**No data piles up:** reminders are upserted keyed by submarine (or by workshop in batched mode), at most one per key. "Create a new row on every update and clean up periodically" was rejected — it creates stale data and needs one more cleanup job.

**Delivery and failure handling:**

- 5xx and network errors are retried once a minute, at most 3 attempts in total; 429 waits for `retry_after` and also counts as an attempt.
- Permanent errors (the user closed DMs, blocked the bot, left the server, or the channel is not permitted) are not retried; they are marked failed and logged in a structured form.
- **A permanently failed DM does not fall back to the channel:** channel messages are public, so there is no automatic downgrade.
- A reminder more than 30 minutes late is marked "missed" and not sent.
- Failures are only logged; there is no user-facing failure screen.

## 9. Browser push (Web Push)

Push is the third reminder method alongside Discord DM and channel mention; users can combine them. It uses standard Web Push (VAPID plus `web-push`), and Angular's service worker handles the push event natively, so it arrives even after the window or tab is closed.

Key points:

- **Subscriptions are per device.** Browser permission and subscription are independent per device anyway. A user can have several devices, and one reminder fans out to all of them; it counts as sent if at least one succeeds, and a retry does not re-send to devices that already succeeded.
- When a push service reports a subscription as gone (404 / 410), that subscription is removed automatically; when the last one goes, the push bit is cleared.
- Logging out or being suspended clears subscriptions, so a device does not keep receiving the previous account's notifications.
- **VAPID keys are optional:** with neither set, push is disabled entirely (the settings page does not even show the option); with only one set, startup fails.
- iPhone / iPad is the special case: `PushManager` exists only after "Add to Home Screen" and opening from the icon, and not at all in a Safari tab. The frontend therefore checks the platform first, then whether the API exists, and guides installation when needed.

## 10. Frontend

- **Angular**, with signals and standalone components. Business state lives in "view model" services (for example `overview-vm`, `update-vm`); components only render, so most logic can be unit-tested without touching the DOM.
- **The PWA service worker caches only the app shell; API calls always go to the network.** Data is not cached, to avoid showing a stale countdown.
- **The overview uses a single `GET /api/overview`.** Rejected: embedding submarines in the workshop list (the workshop CRUD response types would change shape), and having the frontend make N requests and assemble the result (N workshops means N requests, and the snapshot would have to be stitched together client-side).
- **Personal preferences live only in the device's `localStorage`:** workshop order, interface size, collapsed state. Storing them in the database was rejected — pure personal preference isn't worth another table, and different orders on phone and desktop is an accepted trade-off.
- **Interface size uses CSS `zoom`.** The side effect is that Safari and Chrome handle `vh` / `vw` / safe-area lengths differently under `zoom`, so those lengths are always divided by a separate correction variable.
- **A custom dev proxy** (`web/dev.mjs`): on Windows, Vite's built-in proxy intermittently produced `ECONNRESET` for `/api`; the custom one always reuses upstream connections and retries only requests that are safe to resend, and showed no failures in testing.
- Dark theme only, a 768 px breakpoint, and two separate overview layouts for phone and desktop.

## 11. Deployment: no inbound ports

```
Cloudflare Tunnel ──▶ Caddy (plain HTTP inside the container) ──▶ Fastify API
                         └─ also serves the frontend's static files
```

- The host has **no inbound ports open**; all external traffic goes through the Cloudflare Tunnel. TLS is handled by Cloudflare, and Caddy listens on plain HTTP inside the container.
- Routing paths straight from the Tunnel to separate API and frontend containers (skipping Caddy) was considered, but the frontend still needs a static file server, so nothing is saved. Caddy therefore serves the static files and proxies `/api`.
- **Cache headers matter:** hashed js / css files may be cached for a long time; everything else (`index.html`, the SPA fallback page, `ngsw*.js`, the manifest) is `no-cache`, otherwise the service worker and new versions would never reach clients.
- Containers call each other by service name, never `localhost` (containers do not share a network namespace — "works locally, fails in Docker" is a classic trap).
- To get "no inbound", **don't** put `internal: true` on the compose network: it also blocks outbound traffic and DNS resolution. Simply not publishing `ports:` is enough.

## 12. A single monorepo

`shared/` (constants and types shared by frontend and backend), `api/` and `web/` live in one repository (npm workspaces). Splitting into `eranaut-api` and `eranaut-web` was considered, but the contract (fixed option lists, bit constants, API types) would then be copied twice or published as an npm package — too heavy for a single developer, and any cross-cutting change would need two pull requests.

## 13. Demo mode: running the real frontend without a backend

This repository ships a **build-time-only** demo mode (`ng build --configuration demo`), deployed on GitHub Pages for hands-on trying: <https://demo.eranaut.aequoreranos.com/>.

**How it works:** the `Api` class is untouched. Instead, Angular's dependency injection swaps `HttpBackend` for a fake backend (`DemoBackend`) that intercepts every `/api/*` request. All screens, `Auth`, the view models and the interceptor are the exact same code. The fake backend mirrors the real API's validation rules and error formats (`validation_failed`, 404, 401), with types and constants taken from `shared`. Data is kept in the browser's `localStorage` and can be reset at any time.

**Switched at build time with `fileReplacements`:** in the production build, `demo-providers.ts` is an empty stub; the `demo` configuration replaces it with the real fake backend. As a result, **the production bundle contains no demo code** (verified by grepping the built output).

**Why not hand-port the features into the early demo page:** the early prototype ([`eranaut-demo-page`](https://github.com/VisyLockhart/eranaut-demo-page), a single plain-JavaScript file) stopped at an older version and lacks later features such as push, the settings page, interface size and collapsible layouts. Rewriting roughly 3,000 lines of Angular behaviour by hand — and maintaining two copies forever — would just recreate the "demo falls behind" problem. Now the demo and the real app share the same UI, and rebuilding after any web change keeps them in sync.

**Push in the demo:** there is no push server, so there is no real push. The settings page still shows the push switch; turning it on only requests notification permission, and "send test notification" is displayed locally through the service worker — it looks the same as the real thing (including the system banner in an iPhone home-screen app) but nothing is scheduled.

## 14. Route simulator

It is the fifth navigation item. It brings a popular community web tool (pick waypoints and get travel time, build search, drop lookup) into the app, and adds goal-based route recommendations. The main trade-offs:

- **All calculations are pure functions** (`web/src/app/route/core/`): waypoint selection rules (level, range limit, at most 5 stops — after every pick, every other waypoint is re-evaluated), shortest order, travel time, build search (10⁴ part combinations) and route recommendations. They do not depend on Angular and are tested directly; the formulas were checked against known cases from the external tool and cross-checked with numbers from the real game screens.
- **The dataset ships with the code, not in the database:** waypoints, items, parts and level tables live in `route/data/`, load with the route page's lazy chunk and are cached together by the service worker, so it works offline; updating the data means redeploying. The dataset is a converted version of third-party data and **its license differs from MIT** (CC BY-NC-SA 3.0), so it sits in its own folder with a `NOTICE.md`.
- **Saved builds live in the database and sync across devices:** up to 10 per user in `route_subs`; one build can be bound to several workshop submarines (`route_sub_bindings` — a submarine is bound to at most one build, both sides are `ON DELETE CASCADE`, no cleanup job needed). Only the *view state* (selected sea and waypoints, the temporary build) stays in each device's `localStorage`. Offline shows the last list snapshot and writes need the network; the last write wins — all deliberately simple.
- **The demo turns saving and binding off:** both need login and server-side tables. An injected token, `ROUTE_FEATURES` (all on by default; the demo configuration sets `saving` to `false`), hides the related buttons and keeps `RouteVm` from calling `/api/route-subs`; the build is just a temporary one.
- **It warns instead of forbidding what the game itself checks:** for example, exceeding the weight cap only shows a warning, and fuel is shown but never limits selection. The simulator is there to help players decide, not to replicate every game restriction.

## Known limitations and technical debt

An honest list of what is not done, or deliberately not done:

- **One host, one SQLite file** — no horizontal scaling. A deliberate choice for the current scale.
- **One guild per API deployment:** eligibility only recognizes the single configured server.
- **OCR is tuned for screenshots from the Traditional Chinese game client.** Other language versions have not been tested. There are only 11 real screenshots; the degraded images help, but they do not cover every device and zoom level. Those screenshots are not in the repository (they contain player information), so the integration test that runs the real engine on real screenshots (`ocr-real`) is skipped by default and only runs when `OCR_TEST_DIR` is set; the regular test run covers the parser against fixed OCR output.
- **No end-to-end (E2E) tests.** The backend has API-level integration tests (using Node.js's built-in `node:test`) and the frontend has unit tests; browser-level behaviour is verified manually and on real devices.
- **This repository does not include the deployment files:** `docker-compose.yml`, the Tunnel configuration and the backup scripts are not here, so it is not a "clone and deploy in one step" project.
- **Push on iOS requires adding to the home screen** — a platform restriction that code cannot work around.
- Reminder messages do not include a link to the site, and a failed DM does not fall back to the channel (see section 8).
- What the demo lacks: real login, real OCR, and real push scheduling; and the route simulator's saved builds and workshop-submarine binding (see section 14).
- The route dataset is third-party and gets updated; some names were converted from Simplified to Traditional Chinese and have not been checked against the Traditional Chinese client, and a few level/weight-cap values are inferred (see `route/data/TODO.md`).
