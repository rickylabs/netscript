# Milestone 13 issue bodies (fetched 2026-07-17)


---

## #840 [open] epic: Desktop Frontend — the full frontend as a native desktop app, the NetScript way
Labels: type:umbrella, wave:v1, area:fresh, status:plan, priority:p1, area:sdk, area:deploy, epic:desktop-frontend

## Epic — Desktop Frontend (beta.11)

Part of #327 (thin-client desktop lane). **No closing keyword.**

Owner-ratified 2026-07-17 (Option A): beta.11 delivers **the full frontend as a desktop app, the NetScript way** — exactly how NetScript re-invented Fresh. Native-first: lean on `deno desktop`'s own packaging formats (MSI/.app/.dmg/AppImage/.deb/.rpm) and native `Deno.autoUpdate()` (bsdiff, signed manifests, staged swap + self-healing rollback on macOS/Linux), and invest the freed room in wrapping desktop capabilities with NetScript DX.

**Product story (thin-client):** ship the packaged window to consumer machines while services stay in the vendor's cloud (`services__*` discovery at remote URLs) — the eis-chat#150 option-(b) topology productized. No PM dependency, no local graph.

**Windows update posture:** native apply is still unsupported upstream ("patches are downloaded and staged, but the launcher does not yet swap them in" — tracked in denoland/deno#35269 platform gaps). v1 = documented manual-update fallback (download new installer) + staged-detection UX; the full-stack snapshot updater (#830/#834 + #825, beta.14) covers Windows auto-update for combined artifacts; if upstream ships apply first, the native path converges for free.

**One release-server lineage:** the server ships here serving the NATIVE `latest.json` (+ bsdiff patches, Ed25519 envelope); the graph release manifest (beta.14) is a designed superset — same crypto, one lineage.

### Sub-issues

- [ ] #452 — generator desktop app type + packaging hook
- [ ] #456 — native packaging + release server + auto-update wiring (re-scoped Option A)
- [ ] #457 — thin-client e2e (re-scoped Option A)
<!-- D1/D2/D3 appended at filing -->

Design source: PR #822 (`rfc.md`) + run `.llm/runs/rfc-single-deployment--orchestrator/`.

- [ ] **D1** #841 — SDK auto-update mechanism
- [ ] **D2** #842 — type-safe bindings (oRPC MessagePort)
- [ ] **D3** #843 — fresh-ui desktop components


---

## #841 [open] feat(sdk): robust programmatic auto-update — typed wrapper over Deno.autoUpdate + release client
Labels: wave:v1, type:feat, status:plan, priority:p1, area:sdk, epic:desktop-frontend

Part of #840.

A first-class SDK update mechanism wrapping native `Deno.autoUpdate()` (docs: runtime/desktop/auto_update):

- Typed options/callbacks (`onUpdateReady`/`onRollback`), per-arch URL wiring (`Deno.build.os + arch`), check-on-launch + interval policies, release-channel config; Ed25519 `publicKey` pinning wired from app config.
- **Isolates upstream API churn**: the desktop APIs are moving under a `Deno.desktop` namespace (open PR denoland/deno#35939) — apps consume OUR seam, not the moving global.
- **Windows honesty built in**: detect the staged-but-not-applied state and surface a manual-update UX path (link to the new installer); track upstream apply support (denoland/deno#35269) so the wrapper flips to full auto when it lands.
- Rollback telemetry: `onRollback` reported through NetScript telemetry so broken releases are visible.
- Server side: the #456 release server serves the native `latest.json`/patch layout this consumes.

- [ ] gate: wrapper unit tests incl. no-op under `deno run` (`Deno.desktopVersion === null`) and staged-Windows path
- [ ] gate: e2e apply/rollback proof on macOS/Linux via #457; jsr rubric on the SDK surface

Design source: PR #822 (`rfc.md`) + run `.llm/runs/rfc-single-deployment--orchestrator/`.


---

## #842 [open] feat(sdk/fresh): type-safe desktop bindings — oRPC MessagePort adapter over the bind channel
Labels: wave:v1, type:feat, area:fresh, status:plan, priority:p1, area:sdk, epic:desktop-frontend

Part of #840.

Deno Desktop's webview↔runtime bindings have **no built-in type bridge** — the docs prescribe a hand-maintained `bindings.d.ts` (runtime/desktop/bindings #type-safety). NetScript replaces that with contract-first RPC:

- A **port shim** adapting the bind channel (`win.bind()` / `bindings.<name>()`, JSON + `Uint8Array`, promise-based, per-window isolation) into a MessagePort-like pair.
- **oRPC's Message Port adapter** on top (`RPCHandler.upgrade(port)` runtime-side, `RPCLink` webview-side — orpc.dev/docs/adapters/message-port): the same typed contracts/routers NetScript services already use, now spanning the window boundary. End-to-end types, no manual d.ts.
- Integration: SDK provides the link + shim; `@netscript/fresh` wires the window side (desktop-gated, no-op in browser/Aspire mode — the POC's feature-detection pattern).
- Constraint noted: serialization to string/binary by default; `experimental_transfer` used sparingly per oRPC guidance.

- [ ] gate: typed round-trip incl. error mapping ({name,message,stack}) + Uint8Array payloads; per-window isolation test
- [ ] gate: browser/Aspire no-op parity; jsr rubric on new SDK/fresh surface

Design source: PR #822 (`rfc.md`) + run `.llm/runs/rfc-single-deployment--orchestrator/`.


---

## #843 [open] feat(fresh-ui): desktop UI components — tray, menus, dialogs, notifications, window chrome
Labels: wave:v1, area:fresh-ui, type:feat, status:plan, priority:p2, epic:desktop-frontend

Part of #840.

Dedicated `@netscript/fresh-ui` desktop components productizing the POC's `desktop-chrome.ts` pattern (feature-detect desktop globals via local structural types — no `any`, no ambient augmentation, lint-clean in web builds):

- Tray + menu components (declarative, event-wired), native dialogs, notifications, window-chrome controls (title/traffic-light regions), desktop-gated islands that no-op under browser/Aspire.
- Update-UX building blocks consuming #841 ("update ready — restart to apply" / Windows manual-update prompt).
- Docs page: building a desktop frontend the NetScript way.

- [ ] gate: components render + no-op cleanly in web mode; desktop smoke via #457; fresh-ui L2 conventions; jsr rubric

Design source: PR #822 (`rfc.md`) + run `.llm/runs/rfc-single-deployment--orchestrator/`.


---

## #826 [open] fix(service): aggregate health must exclude unconfigured adapters
Labels: type:fix, wave:v1, status:plan, priority:p1, area:service

Readiness-authority fix. Evidence (eis-chat#150): aggregate health includes an unused MySQL adapter in a SQLite-only app, so response status cannot be trusted and the POC fell back to listener probes. Blocks trustworthy health-gated activation everywhere: PM readiness (E14), deploy health-gated `up`, update confirm gates.

Acceptance:
- [ ] gate: unconfigured/unused adapters excluded from aggregate health; per-adapter-class unit tests
- [ ] gate: consumer-compile check; `scaffold.runtime` health-path assertion

Design source: PR #822 (`rfc.md` + `plan.md` rev 10, 9-cycle adversarial trail) in `.llm/runs/rfc-single-deployment--orchestrator/`.


---

## #824 [open] plan: unified-runtime seed run — Nitro v3 validation + epic decomposition
Labels: type:chore, status:plan, priority:p1, area:deploy, epic:unified-runtime

Part of #823.

Seed run (`use harness`, `.llm/harness/workflow/seed-run.md`) producing the unified epic's board. Deliverables:

1. **Nitro v3 validation corpus** (cited): deno preset maturity, adapter surface (database/cache/KV/tasks/WebSocket/lifecycle) mapped against shipped `@netscript` adapters, whether the old "excludes sagas" constraint (#327 D1, 2026-07-03 — STALE, predates live v3 docs) still holds, oRPC + Fresh 2 integration, cloud deploy presets.
2. **Composition contract** with multi-process mode: same app model; "macro services" = resource splitting across deploy targets (PR #822 RFC §3/§D as the starting frame).
3. **Epic decomposition**: sub-issue drafts + milestone train; supersession map for #451/#453/#454/#455 (re-homed here) and #349 (closed as superseded).
4. PLAN-EVAL PASS → owner ratification → one-shot filing (stage-H).

Design source: PR #822 (`rfc.md` + `plan.md` rev 10, 9-cycle adversarial trail) in `.llm/runs/rfc-single-deployment--orchestrator/`.


---

## #452 [open] feat(aspire): first-party deno desktop app type in the generator (folds #375)
Labels: area:cli, area:aspire, type:feat, status:research, priority:p2, epic:deployment, epic:desktop-frontend

Part of #327 · **folds #375**

**Handle:** #E2 · **Milestone:** `0.0.1-beta.8` · **Depends on:** nothing (option (b), zero SDK/tursodb change). **Blocks:** #E4 (shell to host single-process wiring).

> **Fold note:** this issue folds #375 (desktop app-type, promoted from Backlog/Triage p3). No closing keyword on this issue — **the resolving PR body carries `Closes #375`** so the merge auto-closes the folded issue (closing keywords live in PR bodies, never issue bodies).

## Scope — first-party `deno desktop` app type in the Aspire generator

4th branch (`desktop`) in `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-apps.ts` beside `app`/`tauri`/`task`; extend the `AppEntry` type (`@netscript/aspire/types`) with `Type:"desktop"`.

## Acceptance (each maps to a #375-evidenced POC finding)

1. **Build-order gate baked in** — desktop registration `waitFor`/`predev` the Fresh build so `_fresh/` exists before packaging (no hand-edit).
2. **`--backend cef` emitted** (WebView2 default broken on Windows bare-metal; `desktop.backend` config silently ignored). CEF, not config.
3. **Service-discovery injection, no HTTP endpoint** — same `services__<name>__http__0` wiring as `app`, but **no** `withHttpEndpoint` (window binds its own internal `Deno.serve` port).
4. **Opt-in gating** (`Enabled:false` default) so headless/CI `aspire start` is unaffected; random internal `127.0.0.1` port (no collision with a co-running web dashboard).
5. Generator unit tests mirror the existing `generators-*_test.ts` pattern; `scaffold.plugins`/`scaffold.runtime` unaffected for non-desktop configs.

Design source: `design/E-desktop/epic-and-issues.md` (#E2).


### RFC #820 amendment (owner-ratified 2026-07-17 — PR #822)

Scope = the dev-stack desktop resource (extends the in-tree `buildTauriBlock` pattern) **plus the single-artifact packaging hook consumed by #456**. Graph packaging → SD-2 #831. Note: extends the PUBLIC `@netscript/aspire` `./types` surface (`AppType`/`AppEntry` gain `"desktop"`) — full jsr rubric + consumer-compile gate required.

Now also part of the Desktop Frontend epic #840 (Option A, 2026-07-17): its packaging hook feeds the native-format pipeline in #456.


---

## #456 [open] feat(deploy): single-artifact packaging + release server + snapshot updater (substrate)
Labels: area:cli, type:feat, status:research, priority:p2, epic:deployment, epic:desktop-frontend

Part of #327

**Handle:** #E6 · **Milestone:** `0.0.1-beta.8` · **Depends on:** #E2 (shell) + #E4 (single-process artifact to package). **Blocks:** #E7, #E8.

## Scope — 1-click packaging + release/update server

`deno desktop` cross-compile (`--target`/`--all-targets`, no Rust toolchain, SHA-256-verified prebuilt targets; `--compress xz|zstd`; `--no-check`; explicit `-o`); release server serving `latest.json` + bsdiff deltas + Ed25519-signed manifests; **Windows manual-apply fallback** (relaunch-installer indirection — Tauri/Electron pattern) for the stages-not-applies gap; local structural type layer over `Deno.BrowserWindow`/`Tray`/`autoUpdate`/`desktopVersion`.

## Acceptance

- Reproducible signed binary per target; `Deno.autoUpdate()` stages+applies on macOS/Linux and stages+manual-applies on Windows; manifests signature-verified before staging; desktop-globals layer is lint-clean and a no-op in the web build.

Design source: `design/E-desktop/epic-and-issues.md` (#E6).


### RFC #820 amendment (owner-ratified 2026-07-17 — PR #822)

**Re-scoped as the beta.11 single-artifact SUBSTRATE** (graph extension → SD-4 #834): packaging via #452's hook + the .NET Aspire packaging integration #825 (MSI); release server (Ed25519-signed manifests, monotonic sequence high-water); the FULL snapshot updater — stable installer-managed bootstrap + release-resident worker, checksummed append-only journal, **real Windows apply** (release-dir swap while stopped), sustained-health confirm, rollback, install-time pinned trust key — plus minimal first-run provisioning. `Deno.autoUpdate` is never the update authority (RFC L0.7).

Deps: #452, #454, #825. Gates: #457 e2e; fault set (torn-journal replay, crash-mid-swap, cold reboot without `current`, wrong-key/tamper/replay refusals); `e2e-cli-prod`.

#### Correction (owner-confirmed 2026-07-17)

**Dependency fix:** the hard #454 dependency is dropped — the substrate needs only #452's
packaging hook + #825. A window-only (or single-service) app is a sufficient "single artifact".

**Beta.11 product story (thin-client desktop):** this substrate + #457 + #825 already cover a
real deployment shape — apps shipping their **desktop window to consumer machines while hosting
their services in the vendor's cloud** (the POC's proven option-(b) topology): the packaged
window is installed and updated via the snapshot transaction, and `services__*` discovery
points at remote URLs instead of loopback. No local graph, no PM dependency. Local in-process
composition (#454) and the supervised local graph (#830) layer on later without changing this
substrate.

### Option-A re-scope (owner-ratified 2026-07-17 — native-first thin-client)

**Native-first**: packaging via `deno desktop`'s own formats (Windows MSI, macOS .app/.dmg, Linux AppImage/.deb/.rpm; `--compress` where useful) — the snapshot-updater machinery (bootstrap/journal/release-dir transaction) moves to the full-stack tier (#834 + #825, beta.14). This issue now delivers: (1) packaging pipeline over the native formats via #452's hook; (2) the **release server serving the NATIVE `latest.json` + bsdiff patches with the Ed25519 signed envelope** (the beta.14 graph manifest is a designed superset — one lineage); (3) auto-update wiring through the SDK wrapper #841. **Windows posture**: native apply unsupported upstream (denoland/deno#35269) → documented manual-update fallback + staged-detection UX in v1. Now part of the Desktop Frontend epic #840. Deps: #452, #841. `signtool`/notarization remain external CI steps in v1 (D4 posture).


---

## #457 [open] test(deploy): single-artifact deploy-e2e — install → update → rollback (Windows + Linux)
Labels: area:cli, gate:e2e, type:test, status:research, priority:p2, epic:deployment, epic:desktop-frontend

Part of #327

**Handle:** #E7 · **Milestone:** `0.0.1-stable` · **Depends on:** #393, #394 (foundation), #E4, #E6.

## Scope — desktop/single-process deploy-e2e

Extend #394's bare-metal-first deploy-e2e harness with a desktop/single-process target (package → launch → data-plane round-trip → update-check). Do not conflate with `scaffold.runtime`.

## Acceptance

- A green desktop deploy-e2e gate; false-closed-checkbox discipline (#393/#394 pattern) — the `gate:e2e` box is only checked when the gate actually ran green.

Design source: `design/E-desktop/epic-and-issues.md` (#E7).


### RFC #820 amendment (owner-ratified 2026-07-17 — PR #822)

Re-scoped to the **single-artifact** substrate e2e gating #456 (graph-mode e2e → SD-8 #838): install → update → rollback proven on BOTH Windows (the apply path) and Linux (real systemd — narrows `cli-deploy-linux-integration-untested`).

### Option-A re-scope (owner-ratified 2026-07-17 — native-first thin-client)

E2E re-scoped to the native-first thin-client: install from native formats (Win MSI + Linux pkg; macOS best-effort in CI) → **auto-update apply + failed-launch rollback proof on macOS/Linux** via native `Deno.autoUpdate` → **Windows staged-detection + manual-update path** proof → remote-services discovery smoke (window against cloud-hosted services). Part of #840.


---

## #818 [open] cli: fresh projects hit Deno's 24h minimum-dependency-age wall for every jsr:@netscript/* resolution in the first day after a release
Labels: type:fix, area:cli, wave:v1, status:triage, priority:p1

Deferred scope from the #813/#817 E2E fixes, proven live during the v0.0.1-beta.10 release: Deno 2.9's default minimum-dependency-age (~24h) rejects same-day-published versions. The E2E harness now pins `--minimum-dependency-age=0`, but **real users** are still exposed during the first ~24h after every release:

- the shipped CLI's own `deno x` shell-outs (`dispatchPluginVerb`, the AI plugin command) resolve lockstep `jsr:@netscript/*@<fresh>` siblings;
- generated-project flows that resolve freshly-released `@netscript/*` versions in project context;
- `agent init`-written MCP configs invoking `jsr:@netscript/cli@<fresh>`.

Observed failure shape: `Could not find version of '<pkg>' that matches specified version constraint '<v>' — A newer matching version was found, but it was not used because it was newer than the specified minimum dependency date …` (see #817's PR body for the exact call-site inventory).

## Direction to decide

Lockstep siblings are by definition exactly as old as the CLI invoking them — exempting them is sound. Options: (a) CLI-internal shell-outs pass `--minimum-dependency-age=0` (or the config-level equivalent — deno exposes `min_release_age_days`/trust-policy knobs in config parsing; identify the sanctioned key) **only for `@netscript/*` lockstep specifiers**; (b) scaffold writes the policy override into generated project config with a comment explaining scope; (c) document the window + workaround only. Prefer (a)+docs; never blanket-disable the supply-chain protection for third-party deps.

Acceptance: fresh scaffold + plugin verbs + agent-init flow all work within minutes of a release (proven against a canary publish per #811/#812); third-party dependency age policy untouched; regression tests at the shell-out builders.

Refs #813, #817, #811.


---

## #816 [open] docs: rewrite the MAIN repository README — the NetScript entry point, absolute quality bar (multi-lane pipeline: agy research → Opus swarm materials → Fable 5 high redaction → Sol xhigh adversarial)
Labels: area:docs, type:docs, wave:v1, status:triage, priority:p1

**Lands AFTER #814 and #815** (it links into the reworked package READMEs and must not contradict them).

The root `README.md` is the single most-read document in the project — the first thing every evaluating engineer, contributor, and agent sees. It must meet an absolute bar: the strongest READMEs shipped by major frameworks, not just "good for a beta".

## Owner-ratified pipeline (2026-07-17) — four lanes, in order

1. **Deep research — Antigravity `agy` CLI (Gemini 3.5 Flash, extended thinking)**, the `research_extraction` lane: sweep the best-built READMEs of major libraries/frameworks (candidates: Deno/Fresh, Astro, Bun, Vite, Remix/React Router, Tauri, Supabase, tRPC, Nest, Laravel, Rails — final list from the criteria) and extract what makes them work: structure, hook density, diagram usage, quickstart friction, ecosystem presentation, social proof placement. **The research criteria are authored first by a Fable 5 · high agent** (what to look for, how to score, what NetScript specifically needs from an entry point) — the researcher executes against those criteria, never freestyles.
2. **Materials swarm — Claude Opus 4.8 · high sub-agents**: deep-dive NetScript internals + docs site to surface everything the writer needs, each agent owning a domain (runtime/services model; plugins ecosystem; CLI surface incl. the full-coverage story; agentic combo MCP×skills×CLI — the flagship differentiator; Aspire orchestration + telemetry; deploy targets; docs/tutorial map; honest current-state: what's beta, what's stable). Output: fact sheets with source citations (file/`deno doc`/docs-page), verified claims only.
3. **Redaction — Fable 5 · high** writes the README from the research findings + fact sheets. Requirements: a hero section that says what NetScript IS in one breath and why it exists in the next; the agentic story surfaced as the flagship; a real <5-minute quickstart (every command executed before landing); one clean architecture mermaid; an ecosystem map (packages/plugins table linking the #815 READMEs); docs/tutorials entry points; project status stated honestly (pre-release line, what changes at 0.0.1); zero internal vocabulary; tagline conventions respected.
4. **Adversarial pass — Codex Sol · xhigh**: hostile read for hallucinated claims/verbs/flags (execute everything), overpromising vs the shipped truth, broken/missing links, inconsistency with #814/#815 READMEs and the docs site, and "does the quickstart actually work on a clean machine" (run it).

Fix cycles per the doc-audit pipeline (same generator session resumed); final Fable polish is the redactor itself. Gate log + evidence per lane in the run dir.

## Acceptance
- [ ] Research criteria doc + comparative findings artifact committed to the run dir (not the repo README).
- [ ] Every claim in the README traceable to a fact-sheet citation; every command executed on a clean checkout.
- [ ] Quickstart proven end-to-end (fresh clone → running app) within the stated time envelope.
- [ ] Consistency check against #814/#815 outputs and the docs site — zero contradictions.
- [ ] Sol xhigh adversarial PASS; docs:links + readme/tagline gates green; no internal wording.

Blocked by #814, #815.


---

## #815 [open] docs: rework every package README to the public-introduction standard (Fable 5 lane — high for flagships, low for refreshes)
Labels: area:docs, type:docs, wave:v1, status:triage, priority:p1

Companion to the `@netscript/mcp` README rewrite (#814). Every `packages/*` and `plugins/*` README is reworked to serve one purpose: **a public-facing introduction that makes an evaluating engineer understand the package's value in 60 seconds and hands every deep-dive to the docs site.** Current READMEs are accurate but prose-weak and internally voiced; ~30 also fail the production-standard section check outright.

**Lane rule (owner-ratified 2026-07-17): README authoring is a Claude · Fable 5 lane.** Flagship/new packages → Fable 5 · **high**; refreshes of already-accurate READMEs → Fable 5 · **low** (prose quality is the work; the facts are mostly right). Doc-audit pipeline applies to every changeset (single-pass Sol audit with executed command evidence — opposite-family to the Fable generator — then fixes by the same session, then polish where warranted).

## The README standard (apply uniformly)

1. **Tagline** (bold first paragraph, ≤250 bytes — it IS the JSR description; complete sentence, no truncation bait).
2. **Badges** (JSR, CI, docs) — existing convention.
3. **Catchy professional introduction** (2–4 sentences): the problem, the package's answer, who it's for. Present tense, zero hedging, zero internal vocabulary (no archetypes/layers/harness/process).
4. **Flagship features first**: 3–6 benefit-first bullets. Lead with what's differentiated, not what's merely present.
5. **Mermaid diagram when relevant** — packages with moving parts (runtime flows, adapters, queues, host↔plugin topology) get one small diagram; pure-utility packages skip it. Verify GitHub rendering; acceptable degradation on jsr.io.
6. **Install**: canonical `deno add jsr:@netscript/<pkg>` (unversioned — deno add self-pins); `deno x`/config forms use `@<version>` placeholder + the one-line pre-release pinning note.
7. **Quick example(s)**: 1–2 minimal, REAL examples that run — every snippet executed against the live package/public binary before landing (the phantom-verb incidents are the standing warning).
8. **Major API at a glance**: compact table of the top exports/entry points (sourced from `deno doc`, not memory) — enough to gauge the surface, no reference dumps.
9. **Docs section (deep-dive delegation)**: links to the specific docs-site pages (verified live + current) and the jsr.io API docs. The README never duplicates what the site explains.
10. **Compatibility/runtime notes** where real (Deno version, permissions, platform caveats) + License.

## Process

- Batch by area (fresh/fresh-ui, workers/sagas/triggers/streams, auth family, data/kv/queue, ai family, cli/mcp/telemetry/aspire, core/sdk/contracts…), one changeset per batch → one Sol audit per batch (changeset-scope rule).
- `docs:readme:check` extended if needed so the standard above is mechanically checkable (sections present, tagline cap, unversioned-deno-add convention); gate proven-to-fail on a seed.
- Cross-README consistency pass at the end (same voice, same section order, no contradicting claims between siblings).
- Acceptance per batch: readme-check clean for the batch, tagline gate green, command accuracy executed, links live, doc-audit PASS.

Refs #814, #807, #771.


---

## #814 [open] docs(mcp): rewrite the @netscript/mcp README as a true public-facing introduction (Fable 5 high) + verify full docs-site coverage of the MCP surface
Labels: area:docs, type:docs, wave:v1, status:triage, priority:p1

The README shipped with the first `@netscript/mcp` publish (v0.0.1-beta.10) is accurate but fails its actual job: it reads internal (implementation-first prose, layering talk), buries the flagship story, and doesn't serve as a public introduction that hooks an evaluating engineer and hands deep-dives off to the docs site.

**Lane rule (owner-ratified 2026-07-17): package-README authoring is a Claude · Fable 5 lane — `high` for flagship/new packages like this one.** Accuracy gates still apply (every command verified against the shipped public binary; doc-audit pipeline applies — the Sol audit is opposite-family to a Fable generator, so the pipeline composes correctly).

## Rewrite requirements

- **Catchy, professional introduction** — what an agent can DO with a running NetScript app in the first three sentences; positioning in one paragraph (why an app-semantic MCP beats generic log-scraping; complements Aspire's MCP).
- **Flagship features first**: benefit-first bullets (13 token-bounded tools; framework-semantic trace intelligence; default-deny CLI gate; one-command install via `netscript agent init`; version-locked CLI×SKILL×MCP surface).
- **Mermaid architecture diagram**: agent host ↔ stdio ↔ `netscript agent mcp` ↔ (telemetry port / docs corpus / CLI gate) ↔ running app. Verify rendering on GitHub; degrade gracefully on jsr.io if unsupported.
- **Major API surface**: compact tool-catalog table (name → one-line purpose), the two exports (`.`, `./cli`), nothing more — depth belongs to the site.
- **1–2 real examples**: the `agent init` flow and one "ask the agent" transcript-style example; every command executed against the shipped binary before landing.
- **Deep-dive delegation**: a Docs section linking the docs-site MCP reference (13 tools), agent-tooling page, and the jsr.io API docs — links verified live and current.
- Keep the JSR tagline ≤250 bytes; keep `@<version>`-placeholder pinning conventions from the current README; zero internal vocabulary (no archetype/layering/process talk).

## Docs-coverage audit (same issue)

Verify the docs site fully covers the shipped MCP surface and fix gaps: all 13 tools with input/output contracts and truncation semantics; `agent init` per-host behavior; `agent mcp` flags; the command-policy allowlist model (what's denied and why); docs-corpus default + `--docs-root`; troubleshooting (doctor interpretation). Anything undocumented is a gap to close in the same PR (docs lane).

Acceptance: README passes the production-standard check + doc-audit pipeline (Sol audit, executed evidence, Gate log) + Fable-medium polish; coverage gaps enumerated and closed; no regression in tagline/pinning gates.

Part of the beta.11 docs quality track (see the all-packages README rework issue).


---

## #804 [open] plugin CLIs: `--dry-run` on `add job|task|saga|scheduled` writes real scaffold files and registries
Labels: type:fix, area:cli, area:plugins, wave:v1, status:triage, priority:p1

Found by the first doc-audit run (2026-07-17, PR #803 audit): executing `workers add job <id> --dry-run`, `sagas add saga <id> --dry-run`, and `triggers add scheduled <id> --dry-run` via the in-tree CLI entrypoints **created real files** (`workers/`, `sagas/`, `triggers/`, `.netscript/` registries) instead of printing a plan. A dry run that mutates the workspace is worse than no dry-run flag — it trains users to trust a flag that lies.

Acceptance: `--dry-run` performs zero filesystem writes across all plugin `add` verbs (assert with a temp-dir regression test that snapshots the tree before/after); the printed plan matches what a real run would write. Audit sibling verbs for the same defect.

Evidence: `.llm/runs/beta10-cli--orchestrator/slices/803-nsdocs-audit/evaluate.md` (Gate log, accuracy gate).


---

## #802 [open] plugin CLIs: help-text `usage:` strings advertise `ns-<plugin>` shorthand that nothing installs
Labels: type:fix, area:cli, area:plugins, wave:v1, status:triage, priority:p2

The workers plugin CLI's help output (e.g. `plugins/workers/src/cli/commands.ts:74,94,112`) prints `usage: 'ns-workers add job …'` — but no scaffold task, alias, or install step creates an `ns-workers` binary. Verified 2026-07-17: the name exists only in help strings and docs prose; the working invocations are `deno x -A jsr:@netscript/plugin-workers@<version>/cli <verb>` or a user-run `deno install -gArf -n ns-workers jsr:@netscript/plugin-workers@<version>/cli` (proven to work against the published package).

Options: (a) have `netscript plugin install`/scaffold define the alias (deno task or `deno install` step) so the help text becomes true; (b) change the help strings to the `deno x` full form; (c) keep the shorthand but print the one-time install hint alongside. Docs-side context is being fixed separately; this issue owns the source-side help strings. Same defect class as the phantom `plugin add` (cross-check help text against reality).

Also audit sibling plugin CLIs (`ns-sagas`, `ns-triggers`, `ns-streams` if present) for the same pattern.
