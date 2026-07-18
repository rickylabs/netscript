# Fact sheet — Docs/tutorial map + honest current-state (LANE-3, Claude Opus 4.8)

Read-only against `/home/codex/repos/wt-g14-816` @ `0b04eb2b` (current main). VERIFIED CLAIMS ONLY.
Citations are in-tree paths unless noted. Docs site is Lume; canonical URL
`https://rickylabs.github.io/netscript/` (`README.md:7` badge).

---

## Domain 1 — Docs / tutorial map (what a README should link, in what order)

### 1.1 The docs use a Diátaxis four-lane model (Tutorials / How-To / Reference / Explanation)
- Verified: `docs/site/tutorials/index.md:20-27` names all four lanes and their roles:
  Tutorials = learning by building; how-to = recipe when you know the path; reference = exact
  symbols/signatures; explanation = design reasoning. Mirrored in `docs/site/reference/index.md:6-10`.
- **Reusable phrasing (from the docs):** "Tutorials teach you a path end to end… how-to guides…
  reference… exact symbols and signatures… explanation pages for the design reasoning."

### 1.2 Canonical IA = START + product-area pillars + Tutorials + Explanation + Reference
- Source of truth: `docs/site/_data.ts` `navSections` (lines 74+). Structure:
  - **Start** (`_data.ts:74-78`): Why NetScript (`/why/`), Quickstart (`/quickstart/`),
    Architecture overview (`/concepts/`), Glossary (`/glossary/`).
  - **Eight product-area pillars** (the home-page featureGrid, `docs/site/index.vto:52-61`):
    Web Layer (`/web-layer/`), Services & SDK (`/services-sdk/`), Background Processing
    (`/background-processing/`), Durable Workflows (`/durable-workflows/`), Data & Persistence
    (`/data-persistence/`), Identity & Access (`/identity-access/`), Orchestration & Runtime
    (`/orchestration-runtime/`), Observability (`/observability/`).
  - Nav adds a ninth section **AI & Agents** (`/ai/`, `_data.ts:141`) plus **Tutorials**,
    **Explanation**, **Reference** sections. DRIFT NOTE: `_data.ts:5-6` comment and the home
    featureGrid both say "eight pillars"; AI & Agents exists as a nav pillar but is omitted from
    the home featureGrid — writer should treat AI as a first-class area regardless.
- Each pillar leaf set is uniform: Overview & Concepts → Quickstart (a tutorial chapter) → How-To(s)
  → Reference (`_data.ts:83-102` Web Layer is the template).
- **Recommended README ordering** (matches docs learning path, `index.vto:80-86`):
  Quickstart → Architecture overview (`/concepts/`) → Glossary → pick a pillar.

### 1.3 Entry-point pages that a README should link
- Home/hero: `docs/site/index.vto`. Primary CTAs already defined there (`index.vto:9-12`):
  Quickstart (`/quickstart/`), Browse the reference (`/reference/`), GitHub.
- Quickstart: `docs/site/quickstart.vto` — "From nothing to a running NetScript workspace… in about
  five minutes. Three commands: install the CLI, scaffold a project, then bring it up under Aspire"
  (`quickstart.vto:8-11`).
- Why NetScript: `docs/site/why.vto` (positioning + honest scope).
- Architecture overview: `docs/site/concepts.vto`; Glossary: `docs/site/glossary.md`;
  CLI reference: `docs/site/cli-reference.md`.

### 1.4 Tutorials — FIVE tracks (link these five; do NOT link `eis-chat`)
- Nav `Tutorials` section (`_data.ts` ~line 218): Live dashboard (`/tutorials/live-dashboard/`),
  AI Chat (`/tutorials/chat/`), Workspace (`/tutorials/workspace/`), Storefront
  (`/tutorials/storefront/`), ERP sync (`/tutorials/erp-sync/`).
- `docs/site/tutorials/index.md:32-33`: "There are five independent tracks. Each builds one complete
  application from a fresh `netscript init`, and each ends by running that application locally under
  .NET Aspire."
- A sixth directory `docs/site/tutorials/eis-chat/` exists on disk but is **not** in nav — it is
  internal (memory: no `eis-chat` wording in public docs). Do not surface it.

### 1.5 How-To coverage: 28 guides (`docs/site/how-to/*.md`, verified count)
- Notable for README linking: `add-a-plugin.md`, `author-a-plugin.md`, `add-a-service.md`,
  `add-authentication.md`, `add-opentelemetry.md`, `build-a-desktop-frontend.md`,
  `build-a-durable-chat.md`, `deploy.md`, `deploy-local-aspire.md`, `deploy-deno-deploy.md`,
  `add-a-task-runtime-adapter.md`.

### 1.6 Reference: `deno doc`-generated, one page per public package
- `docs/site/reference/index.md:6-8`: "precise, exhaustive API documentation for every public
  NetScript package and plugin… generated from the source code with `deno doc`, so they always
  describe the published surface."
- 30 packages in `packages/` (verified `ls packages | wc -l = 30`); reference nav lists ~40
  leaves incl. `*/commands`, `ai/skills` (`_data.ts:38-70`). Four `*-core` internal packages
  (`plugin-ai-core`, `plugin-auth-core`, etc.) are folded into reference prose (`_data.ts:10`).

---

## Domain 2 — Honest current-state / versioning posture

### 2.1 Version: `0.0.1-beta.10`, single aligned train, lockstep releases
- Verified: root `deno.json` `"version": "0.0.1-beta.10"`; `packages/cli/deno.json` and
  `packages/service/deno.json` both `0.0.1-beta.10`.
- `docs/site/_data.ts:14-20`: `releaseVersion` is read from `packages/cli/deno.json`; every doc page
  renders `{{ releaseVersion }}` / `{{ releaseSpecifier }}` (`@0.0.1-beta.10`) from that one source.
- **Reusable phrasing** (`index.vto:17-22`): "Every `@netscript/*` package shares one aligned
  version and releases move in lockstep. Scaffolded JSR imports use exact pins for the beta train,
  so keep package versions aligned when you upgrade."
- NOTE for writer: the current branch/run is beta.11-labelled but the in-tree version constant is
  still `0.0.1-beta.10`. Do not assert a version the tree does not contain — cite `0.0.1-beta.10`
  (or render from the constant) unless the README is written after a version bump lands.

### 2.2 Beta posture — API subject to change, incremental cadence, no big-bang to stable
- `index.vto:16-22` callout "Beta — API subject to change": "NetScript is a backend framework and
  workspace generator, not a hosted service — you run it on Deno and own all the generated code.
  NetScript is in `0.0.1` beta, shipping incrementally, and the API is still moving."
- `docs/site/why.vto:17`: "NetScript is in beta (`0.0.1`), shipping incrementally. The API is
  subject to change — so build with us, but pin your versions. The published package surface is the
  contract: what you import from `jsr:@netscript/*` is what's documented and type-checked."
- `docs/site/quickstart.vto:24-27` Beta callout: "Public package versions are `{{ releaseVersion }}`
  and the API is subject to change as it ships incrementally. Pin versions in real projects."
- `docs/ROADMAP.md:3-14`: "NetScript ships on an incremental-beta cadence… `0.0.1-beta.1 → … →
  0.0.1-stable`. There is no big-bang jump from the first beta to stable."

### 2.3 What the `0.0.1` milestones mean (`docs/ROADMAP.md:20-38`)
- `0.0.1-beta.1` = "Minimal cuttable release of the current green state. Not a positioning gate."
  Cut bar = soundness floor, conformance/`scaffold.runtime` e2e green, CI trio green, release
  machinery proven. No feature blockers.
- `0.0.1-beta.2` / `beta.3` = incremental bets (AI stack, deployment lanes, self-bench ≥0.90).
- `0.0.1-stable` = "Terminal milestone carrying the falsifiable positioning verdict" —
  competitor-paired run, multi-task breadth, full composite rubric.
- **What changes at 0.0.1(-stable):** the *positioning* verdict is reached incrementally, not the
  API-freeze; stable is "reached incrementally," betas "may run for many iterations over months"
  (`ROADMAP.md:16-17`). Positioning thesis lives in `packages/bench/POSITIONING.md` (`ROADMAP.md:39`).

### 2.4 Known limitations worth stating (all in-tree verified)
- **Auth is one active backend at a time; only kv-oauth is fully interactive.**
  `docs/site/why.vto:105-106` (Framework beta callout): "Only **kv-oauth** is fully interactive —
  on WorkOS and better-auth the `signin`/`callback` endpoints return a typed unsupported-operation
  error by design. It's one active backend at a time: no multi-active routing, cross-backend
  linking, or global logout yet."
- **Native-desktop auto-update — manual branch for the Windows installer (documented upstream
  limitation).** `docs/site/how-to/build-a-desktop-frontend.md:133-135`: the `@netscript/sdk/auto-update`
  ready event drives `DesktopUpdatePrompt`; automatic updates say "Update ready — restart to apply,"
  but "The manual branch uses the event's verified `manualUpdateUrl` for the Windows installer; do
  not infer the branch from platform strings." I.e. Windows native updates are surfaced as a manual
  installer-download path, not in-place auto-apply. (This is the only auto-update doc surface in
  `docs/site`; no separate upstream-limitation reference page exists in-tree — writer should phrase
  it as "manual/installer path on Windows" and cite the how-to, not invent a stronger claim.)
- **Windows has no SIGTERM for graceful shutdown** — `docs/site/how-to/graceful-shutdown.md:197`:
  "Deno does not deliver `SIGTERM` on Windows; the service listener already [handles this]."
- **Desktop native smoke is gated, not proven by browser gallery** —
  `build-a-desktop-frontend.md:150-152` warning: "This recipe proves composition and browser-safe
  behavior. The project desktop smoke gate owns the real packaged-runtime check."

### 2.5 Honest framing phrasings the README can reuse verbatim
- "A backend framework and workspace generator, not a hosted service — you run it on Deno and own
  all the generated code." (`index.vto:17-18`)
- "The published package surface is the contract: what you import from `jsr:@netscript/*` is what's
  documented and type-checked." (`why.vto:17`)
- "Build with us, but pin your versions." (`why.vto:17`)
- "Releases move in lockstep… keep package versions aligned when you upgrade." (`index.vto:20-22`)

---

## Stop-lines (verbatim, per brief)
1. Merge requires CI green + opposite-family eval PASS on the PR. Owner granted standing beta-11
   merge authorization (2026-07-17 in-turn) once that bar is met.
2. HARD STOP before any release publish (`release:cut`, JSR publish, tag push, canary or stable) —
   owner sign-off in-turn only; a stale or relayed approval does not count.
3. HARD STOP before closing milestone 13 — owner sign-off only.
4. These stop-lines are repeated verbatim in EVERY sub-agent brief. A sub-brief without the
   stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification; its board filing needs the owner in-turn.

_This lane is read-only: no commits, no GitHub, single-file output._
