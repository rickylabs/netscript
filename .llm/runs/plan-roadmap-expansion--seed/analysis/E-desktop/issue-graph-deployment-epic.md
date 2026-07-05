# Issue graph — deployment epic #327 and desktop-relevant children

All bodies fetched live (`gh issue view <n> --json title,body,state,labels,milestone,comments`) on
2026-07-04 via WSL. Full JSON saved under the run's scratch temp; key content quoted/paraphrased
below.

## #327 — [epic] NetScript enterprise deployment framework

- **State:** OPEN. **Milestone:** `0.0.1-beta.5` ("Deployment hardening + repo/process maturity —
  staging boundary before stable"). **Labels:** `type:umbrella`, `status:research`, `priority:p2`,
  `area:deploy`, `epic:deployment`.
- **Last substantive update:** 2026-07-03 (three owner comments same day: a correction, six
  product-decision verdicts D1–D6, and a D5 revision). A phased execution plan comment follows.
- **Current tier structure (as of 2026-07-03/04):**
  - **BETA (0.0.1-beta.1, tier-1), all `[x]` closed:** #337 config contract · #338 doctrine entry ·
    #344 docs/code divergence · #339 `OsServicePort`+`SystemdAdapter` · #340 `deno compile`
    bare-metal artifact · #341 bare-metal hardening (rollback/health-gate/OTEL/secrets) · #342
    **Deno Deploy adapter (marquee, `priority:p0`)** · #343 Aspire Docker/Compose via TS AppHost.
  - **STABLE (0.0.1-stable, tier-2), all open:** #345 bare-metal HA/secrets/signing · #346 k8s/Azure
    + image providers · #347 CI/CD templates · #348 one-click convergence.
  - **WATCH (Backlog / Triage, deliberately not v1):** #349 RFC-14 unified-mode + Nitro (D1) · #350
    Pulumi IaC adapter (D6).
- **`deno desktop` placement:** explicitly named only in the epic's own **Watch item verdicts**
  section — *"`deno desktop` — TRACK (v2.9 VFS + `Deno.autoUpdate`; but code
  signing/notarization not automated)"* — and again in the priority-ordering **Watch** bucket as
  *"`deno desktop` (reference only)."* It is **not** in tier-1 or tier-2 anywhere in the epic body
  or its three follow-up comments.
- **Ratified product decisions (D1–D6, all resolved 2026-07-03, no `NEEDS USER:` items):**
  - D1 RFC-14 unified-mode (tier-3 serverless) → **WATCH, not v1** (3–5mo, distinct arch, excludes
    sagas, `--unstable` Nitro preset).
  - D2 flagship one-click → **Deno Deploy = beta marquee; Aspire Docker/Compose ships alongside in
    beta**; k8s/Azure = stable.
  - D3 bare-metal hardening line → v1 = systemd + `deno compile` + rollback + health-gate +
    `OTEL_DENO` + basic secrets; HA/external-secret-store deferred to stable.
  - D4 `deno compile` signing → accept manual/documented for v1, automate at stable.
  - D5 `deploy.windows.*` → **clean break to `deploy.targets.*`, no back-compat alias** (owner
    override 2026-07-03: "we're alpha, breaking changes are allowed, go production-grade
    directly" — this superseded an earlier "alias through beta" verdict from the same day).
  - D6 Pulumi IaC adapter → **pure watch**, not planned.
- **What "folding desktop into a 4th tier" would mean:** today the epic has exactly 3 buckets
  (beta tier-1, stable tier-2, watch). Desktop sits in watch alongside RFC-14/Nitro and Pulumi.
  Promoting it would require either (a) moving it into stable tier-2 next to k8s/Azure/one-click
  convergence, or (b) a genuinely new tier-4 milestone the epic does not currently define. Neither
  is proposed anywhere in the epic; this is a decision the topic-E owner/supervisor would need to
  make explicitly, not something already implied by #327's structure.

## #375 — feat(aspire): first-party `deno desktop` app support in the generator

- **State:** OPEN. **Milestone:** **Backlog / Triage** (not beta, not stable). **Labels:**
  `area:aspire`, `type:feat`, `priority:p3` (low). Zero comments.
- This is the actual "lift the eis-chat spike to NetScript" ask. It requests a first-class
  `deno desktop` app type in the Aspire generator (`Apps.<name>.Type: "desktop"` or
  `desktop:*`-TaskName auto-detect), registered as a task-backed `addExecutable` (mirrors the
  private `netscript-start` .NET AppHost's `AddTauriApp` shape: service-discovery env injection,
  no bound HTTP endpoint).
- **Four concrete generator requirements**, each evidenced by an eis-chat POC finding (Windows bare
  metal, Deno 2.9.0, laufey webview 0.4.0):
  1. **Build-ordering must be baked in.** `deno desktop` framework-detects Fresh via built `_fresh/`
     output; absent that it falls back to Vite `dist/` and errors otherwise. Needs a `predev`-style
     task/`waitFor`, not a hand-edit.
  2. **CEF backend selection is required, not optional, on this host.** Default WebView2 backend
     is **broken** — reproduces standalone and under Aspire, aborts before touching any user-data
     folder (so `WEBVIEW2_USER_DATA_FOLDER`/`WEBVIEW2_BROWSER_EXECUTABLE_FOLDER`/
     `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS` workarounds are all no-ops), despite a healthy
     WebView2 Runtime install (v149.0.4022.98). **`--backend cef` CLI flag works; the
     `desktop.backend` config-file field is silently ignored** (likely a Deno bug). CEF's first
     launch downloads ~150MB (~379MB cached).
  3. **Service-discovery injection with no HTTP endpoint** — same `services__<name>__http__0`
     wiring as a normal app, but the window binds its own internal `Deno.serve` port; no
     `withHttpEndpoint`.
  4. **Opt-in gating** (`Enabled`) so headless/CI `aspire start` is unaffected; desktop uses a
     random internal port so it never collides with a co-running web dashboard.
  5. The internal Fresh server auto-binds a random `127.0.0.1` port via `DENO_SERVE_ADDRESS`;
     `PORT` only affects the startup log banner.
- References the working eis-chat hand-edit (merged eis-chat PR #136:
  `aspire/.helpers/register-apps.mts` desktop block, `deno.json` `--backend cef` +
  `desktop:predev`, render evidence under `resources/desktop-evidence/`), and the original proposal
  `aspire/PROPOSED-desktop-resource.md` (eis-chat #118).

## #349 — [Deploy-S13] WATCH: RFC-14 unified-mode + Nitro `deno_server` (tier-3 serverless)

- **State:** OPEN. **Milestone:** Backlog / Triage. **Labels:** `wave:defer`, `type:chore`,
  `priority:p3`, `area:deploy`, `epic:deployment`. Parent: #327.
- Scope: tracking only. Tier-3 serverless (Vercel/Cloudflare/Netlify) via Nitro v3 + oRPC + Fresh 2
  + the still-`--unstable` Nitro `deno_server` preset. Explicitly **not v1**; "Aspire + Deno Deploy
  already deliver the cloud story without it."
- One comment (2026-07-03) cross-links #371 and gives the load-bearing framing for
  unified-vs-multi-process (see `offline-first-surface.md` — this is a *different* "unified" sense
  than the tier-3-serverless one in this issue's own title; both are quoted together there to make
  the distinction explicit).

## #393 — bug(deploy): Aspire compose target not registered in DEFAULT_DEPLOY_TARGETS

- **State:** OPEN. **Milestone:** `0.0.1-beta.3`. **Labels:** `type:fix`, `area:cli`,
  `area:aspire`, `status:triage`, `priority:p1`.
- Not desktop-specific, but load-bearing epistemics: the Docker/Compose deploy lane (#343, shipped
  in PR #363) was never registered in `DEFAULT_DEPLOY_TARGETS`, so `netscript deploy docker|compose
  <verb>` fail to resolve at runtime — a **false-closed** acceptance (PR #363 auto-closed #343 with
  its `gate:e2e` box unchecked). Filed by a roadmap re-forecast evidence sweep (#391), not fixed in
  that planning PR. This is a pattern (`#260/#388` are cited as prior instances) worth the topic-E
  supervisor knowing about before trusting any "closed = shipped and verified" epic checkbox.

## #394 — test(deploy): no deploy target has any e2e coverage

- **State:** OPEN. **Milestone:** `0.0.1-beta.3`. **Labels:** `area:cli`, `gate:e2e`, `type:test`,
  `status:triage`, `priority:p1`.
- No deploy target (Deno Deploy, bare-metal, Docker/Compose) has any e2e gate; `scaffold.runtime`
  only exercises workers/sagas/triggers/streams plugins.
- **Owner ratification, 2026-07-04 (same day as this session):** *"the stable 'verified production
  deployment path' gate is **bare-metal (`systemd` + `deno compile`)**, not Deno Deploy."* Deno
  Deploy remains a supported tier-1/marquee target but is **not** the stable gate. (Ratification
  record cited: `.llm/runs/chore-roadmap-beta3-stable-reforecast--reforecast/roadmap-0.0.1.md` §5,
  PR #392 — not independently re-verified in this session, taken from the issue comment as given.)

## #371 — feat(aspire): restore shared Deno KV Connect cache/queue resource (CLOSED)

- **State:** CLOSED. **Milestone:** none set (despite closed state — minor process gap, not
  investigated further). Child of #327; feeds #349's unified-vs-multi-process story.
- See `offline-first-surface.md` for the full extraction — this issue is the concrete, already-
  shipped precedent for a config-driven unified(single-process)/multi-process switch at the
  KV/queue layer, live-validated via sibling issue #372 (Garnet executable on Docker-less Windows).

## Drift: topic-E spec vs current #327 reality

The topic-E spec (and `specs/01-ratified-decisions.md`'s milestone train) frames desktop as
**"beta.8/stable — ships FULLY, low priority, no splitting."** The deployment epic #327 — updated
as recently as 2026-07-03/04, i.e. concurrently with or after the topic-E spec was likely drafted —
places `deno desktop` explicitly in **WATCH / reference-only**, with no tier-1 or tier-2 slot, and
its dedicated generator-support issue (#375) sits in **Backlog / Triage** at `priority:p3`. This is
a genuine three-way tension:

1. The topic-E spec's mandate ("ships FULLY") may predate #327's 2026-07-03 WATCH verdict and be
   stale.
2. Topic-E's desktop work may be intentionally a **separate initiative** from #327's deployment
   epic, in which case #327's WATCH classification of `deno desktop` (framed there purely as a
   *deployment target*, i.e. "ship the whole app as a desktop binary") doesn't speak to a narrower
   "dashboard-as-desktop-shell" feature (closer to what #375 and eis-chat's option (b) actually
   describe).
3. Or the owner may want to explicitly reconcile the two by either promoting #375 out of
   Backlog/Triage, or by documenting that topic-E's desktop scope is deliberately narrower than
   `deno desktop` as a full deployment target and thus exempt from #327's WATCH call.

No verdict is offered here — this is squarely a supervisor/owner decision, flagged with full
evidence per the task's read-only, evidence-not-verdict boundary.
