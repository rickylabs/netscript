# Docs v3 IA Overhaul — Research

**Run id:** `docs-v3-ia-plan--supervisor` · **Branch:** `docs/v3-ia-plan` (off `origin/main` @ `5f273355`)
**Scope overlay:** `SCOPE-docs` · **Status:** research → plan (no implementation; PLAN-EVAL gated)
**Author:** Claude supervisor (coordination/planning only; does not self-certify)

This run produces a **locked, evaluable Information-Architecture plan** for a production-grade public
documentation site, then hands it to an adversarial hardening + PLAN-EVAL gate. It does **not** author
doc prose. It closes the structural backlog (tasks #26/#27/#28 = W4/W5/W6) that the v3 *accuracy*
overhaul left orphaned, and folds in newly-verified feature gaps and a public-voice cleanup.

---

## 1. Mandate & locked decisions

The user reviewed the live v3 site and judged it "a major disappointment … almost every enhancement
planned on #63 did not land" (Fresh framework buried under "Fresh UI", single linear tutorial, no
structural depth). Target: **production-grade public docs matching Medusa / Astro / Laravel / TanStack
quality.** Decisions locked by the user this session (do not relitigate in the plan):

| # | Decision | Locked value |
|---|----------|--------------|
| D1 | **Tutorial structure** | **Multiple independent tracks** — not one linear ladder, not a single mega-project. Each track is a self-contained learning arc. |
| D2 | **Per-track example apps** | Each track builds a **different real app** emphasizing different capabilities: e-commerce (sagas/payments), team-workspace (auth/multi-tenant), ERP integration (jobs + polyglot tasks), internal dashboard with live data (SDK + streams). Open set — plan proposes the canonical roster. |
| D3 | **Design-system & diagram scope** | **Full** — new shared components (rendered diagrams, file-tree, badges, on-page TOC, in-site search, code-copy) that touch centrally-owned `base.vto` + `styles/`. Required to match competitor quality. |
| D4 | **Adversarial eval** | **Layered**: WSL Codex unconstrained adversarial panel to *harden* the plan, **then** OpenHands minimax-M3 PLAN-EVAL as the doctrinal *hard gate*. Evaluators must not be oriented/restricted; separate sessions; no self-certification. |

Additional standing asks folded into scope: (a) a sub-agent gap-evaluation pass (done — see §4/§5);
(b) **remove every trace of internal/agent speech** from the public site; (c) surface diagram
opportunities; (d) "push the bar further."

---

## 2. Baseline correction (critical — wrong-baseline landmine avoided)

The first gap-evaluation agent read `packages/` from a **stale worktree** (`feat/framework-prime-time`
@ `5a938ef8`, which predates the auth umbrella) and reported its single highest-severity finding as
"the auth plugin packages the docs present as shipped do not exist." **This is a false positive.**
Verified against `origin/main` @ `5f273355`:

- `packages/` contains `auth-better-auth`, `auth-kv-oauth`, `auth-workos`, **and** `plugin-auth-core`.
- `plugins/auth` exists.
- `origin/main` log includes `#103` (AS8 audit observability), `#73` (prime-time umbrella), `#86`
  (auth), `#65` (caveat-fix plan-of-record). The auth program is fully merged.

**The auth docs are accurate. That finding is discarded.** All *other* gap findings were
re-verified against `origin/main` (see §4) and stand. This run is baselined to `origin/main`
(harness rule: re-baseline carried-in audits before locking a plan).

---

## 3. Verified public surface vs. documented surface (origin/main export maps)

Confirmed by reading `deno.json` export maps and `domain/constants.ts` on `origin/main`. These are
the **shipped, public** entry points; items marked ❌ have no first-class narrative IA today.

| Package | Public subpaths (verified) | Doc status |
|---------|----------------------------|-----------|
| `@netscript/fresh` | `server, builders, route, defer, form, error, streams, query, interactive, vite, testing` (12 incl. root) | ❌ **buried** — entire meta-framework appears only as prose inside `capabilities/fresh-ui.md`; no hub, no nav entry |
| `@netscript/sdk` | `cache, client, collections, discovery, ports, query, query-client, streams, telemetry` | ❌ `discovery` (Aspire URL/DB/KV resolution), `cache`, `collections`, `query-client` undocumented |
| `@netscript/database` | `ports, adapters, adapters/postgres, adapters/mssql, adapters/mysql, extensions, scripts, tracing, testing` | ❌ `mssql` + `mysql` adapters and `tracing` (Prisma OTel) absent; docs read Postgres-only |
| `@netscript/plugin-sagas-core` | `builders, domain, ports, runtime, adapters, transports, stores, middleware, integration/workers, integration/publisher, telemetry, config, contracts/v1, streams, presets, abstracts, testing, agent` | ❌ `presets`, `middleware`, `transports`, `agent`, `integration/*` are undocumented extension points |
| `@netscript/service` | `., auth` | `auth` seam documented under v3 auth zone ✅; shutdown hooks / OpenAPI+Scalar / health primitives ❌ (see §4) |
| **standalone packages** | `runtime-config`, `queue`, `cron`, `watchers`, `config`, `kv`, `logger`, `contracts`, `aspire`, `prisma-adapter-mysql` | ❌ `runtime-config` is a **real standalone package**, not just a generated reference unit — no narrative home |

---

## 4. Verified feature gaps (origin/main) — content the IA must create homes for

From the gap-evaluation agent, **after discarding the false auth finding and re-verifying on
origin/main**:

- **Polyglot task runtimes** — `TASK_TYPES = ['deno','python','dotnet','cmd','powershell','shell','executable']`
  (`plugin-workers-core/src/domain/constants.ts`). Docs prose only ever names "Python, shell." Missing:
  `cmd`/`powershell`/`dotnet`/`executable` runtimes; per-runtime config (venv/requirements, runtimeVersion,
  loginShell); the **per-task Deno permission model** (`TaskPermissionsSchema`: net/read/write/env/run/ffi/import).
- **Worker execution modes** — `WORKER_RUNTIMES = in-process | web-worker | subprocess`; the
  thread-isolation model is prose-only, never presented as a user-tunable.
- **CLI gaps** — `netscript db add`, `netscript marketplace publish|search` missing from `cli-reference.md`.
- **`@netscript/service`** — graceful-shutdown hook system (`ShutdownHook/Context/Reason/Report`),
  OpenAPI/Scalar primitives (`createOpenAPISpec/createScalarDocs/createOpenAPIHandler`), health
  primitives (`createReadinessHandler/createLivenessHandler`, `healthChecks.database`) — all undocumented.
- **`@netscript/sdk/discovery`** + `cache` + `collections` — Aspire service-URL/DB/KV discovery; undocumented.
- **`@netscript/database`** — `mssql` adapter (zero docs), thin MySQL path (`prisma-adapter-mysql` is its
  own package), `database/tracing` Prisma OTel hook — undocumented.
- **`@netscript/plugin-sagas-core`** — `presets`/`middleware`/`transports`/`agent`/`integration` subpaths
  far richer than the single saga capability page; `createParallelQueue` referenced but never shown.
- **Runtime config** — narrative/ops home for runtime overrides (the `runtime-config` package) absent.

Leakage (internal/agent speech), diagram opportunities, and competitor bar-raising are enumerated in
the grounding artifact `ground/leakage-diagram-barraising.md` (produced this run) and summarized in the
plan's workstreams.

---

## 5. What shipped vs. what's still missing (structural)

Verified against deployed `origin/docs/user-site` (live Pages deploy `fbf952627`) in prior research
(`.llm/tmp/run/docs-overhaul-v3/structural-gap-analysis-2026-06-21.md`):

- **Shipped by v3:** 11 capability hubs (incl. net-new `auth`); accuracy reconciled (queue Postgres,
  sagas Prisma store, worker OTel, streams producer, auth program); polyglot as a *section* under
  background-jobs; meta-framework explained in *prose* inside `fresh-ui.md`; reference units exist for
  `fresh`, `fresh-ui`, `runtime-config`.
- **Still missing (this run's target):** (1) dedicated `capabilities/fresh-framework/` hub split from
  `fresh-ui`; (2) `capabilities/polyglot-tasks/` first-class hub + how-to; (3) `runtime-config`
  narrative home; (4) **multiple independent tutorial tracks** (D1/D2) replacing the single 5-rung
  ladder; (5) auto-resolving xref system; (6) full design-system + rendered diagrams (D3); (7) the §4
  feature homes (sdk/discovery, mssql/mysql, service ops primitives, saga extension points, worker
  runtime modes, polyglot runtime matrix); (8) public-voice cleanup (remove internal speech).

**Root cause of the gap (do not repeat):** the v3 workflow used the enhancement-free
`doc-architecture-v2.md` as its `planPath` and was grounded only in 3 *accuracy* dossiers; the
structural recommendations (docs-v2 capability audit) were never wired in. This run produces the
missing **locked structural IA** (`doc-architecture-v3.md`) so a future build workflow is grounded in
BOTH the IA and the accuracy baseline.

---

## 6. Competitor patterns (foundational research, retained)

From `…/docs-heavy-lifting/research/competitor-doc-research.md` (Medusa/TanStack/Laravel/Astro/Lume
teardown):

- **Diátaxis** zones (Tutorials=learning, How-to=task, Explanation=understanding, Reference=generated)
  + Medusa-style **capability hubs** that triangulate Learn/Do/Reference.
- **Page-type catalog**: A multi-pillar hub · B sequential tutorial step · C how-to recipe · D explanation.
- **Component gaps** (P0): on-page TOC, Pagefind search, code-copy. (P1): `comp.fileTree`,
  `comp.tabbedRuntime`, `comp.badge`. (P2): ASCII→rendered diagrams, `comp.cardsGrid`, `comp.version`.
- Tutorials should be **project-shaped and meaningful E2E**, not toy snippets. (D1 chooses *multiple*
  such projects rather than one.)

---

## 6b. Real integration spine (from the `netscript-start/apps/playground` showcase)

Grounding `ground/playground-showcase-map.md` maps a real, feature-rich NetScript app (an e-commerce
ops dashboard: Users/Products/Orders + a durable-workflow control plane for Workers/Sagas/Triggers, on
Fresh 2). It gives the docs a **verified end-to-end integration pattern** to teach, not invented
snippets:

- **Signature full-stack flow:** oRPC `baseContract` procedure (Prisma-generated `@database/zod` types)
  → `defineService` router → typed **`@netscript/sdk` client** → **KV cache-first query factory**
  (`sdk/cache` + `sdk/collections` + `sdk/query`) → **`definePage` layer builder** → **`QueryIsland`**
  with TanStack hydration. Real-time via **per-plugin StreamDB + `useLiveQuery`** (`fresh/streams` +
  `plugin-streams-core`). Service discovery via Aspire `services__{name}__{protocol}__{index}`
  (`sdk/discovery`).
- **Backend defining patterns confirmed in use:** `defineService`, `defineSaga`/`send`,
  `defineJobHandler`, `defineWebhook`/`defineFileWatch`, Aspire `AddNetScriptApp()`.
- **Fresh subpaths actually exercised** (import counts): `fresh/builders` (dominant), `route`, `form`,
  `error`, `query`, `defer`, `server`, `vite`, `interactive`, `streams` — confirms the meta-framework
  warrants its own hub (WS1) and is the spine of Track D.
- **Doc-gap the showcase reveals:** the playground has **no user-auth surface** — so Track B
  (team-workspace/auth) is genuinely net-new territory the showcase does not cover, and the auth zone
  (already shipped) is the only place that story exists. Tutorial accuracy for Track B must be verified
  against scaffold output, not the playground.

These patterns ground WS2 (Track D especially) and the `fresh-framework` + `sdk` capability hubs (WS1/WS3).

## 7. Constraints & invariants (must hold in the plan)

1. **`reference/**` is generated (`deno doc`) and OUT of scope** — never hand-edit; the IA may *link*
   to reference units but not author them.
2. **Accuracy baseline must not regress.** The 3 v3 dossiers under
   `.llm/tmp/run/docs-overhaul-v3/ground/` are the truth floor; the stale docs-v2 audit caveats were
   **fixed** — do NOT re-inject them ([[as8-and-docs63-state]]).
3. **Centrally-owned surfaces** (`base.vto`, `styles/`, `_components/*.vto`, `_data.ts`) ARE in scope
   under D3, but changes are design-system-level and must be additive/backward-compatible with existing
   pages.
4. **Pages deploy** only triggers on `paths: docs/site/**` (`pages.yml`). Plan artifacts under
   `.llm/tmp/run/**` do not deploy — safe to commit to the PR.
5. **Public voice**: zero internal/agent/harness speech, run-ids, PR numbers, `.llm/` paths, or
   notes-to-self in any `docs/site/**` page.
6. This is a **planning PR** off `origin/main`; the eventual *authoring* lands on `docs/user-site` via a
   separate gated build run.

## 8. Pointers
- Evolved IA (this run's deliverable): `doc-architecture-v3.md` (same dir).
- Plan: `plan.md` (same dir).
- Grounding: `ground/leakage-diagram-barraising.md`; prior gap analysis
  `…/docs-overhaul-v3/structural-gap-analysis-2026-06-21.md`; competitor dossier
  `…/docs-heavy-lifting/research/competitor-doc-research.md`; v2 audit
  `…/docs-v2-audit/{missing-and-miscategorized,caveats-and-gaps,capability-truth-matrix}.md`.
- Locked-but-superseded IA: `…/docs-heavy-lifting/doc-architecture-v2.md`.
- Full public-surface inventory: `surface-inventory.md` (32 units / 242 subpaths).
- Tutorial grounding gates: `tutorial-proof-plans.md`. Hub content contracts: `hub-content-contracts.md`.

## 9. Reproducibility (closes panel minor #10)

So any evaluator or build agent can reproduce this plan's evidence deterministically:

- **Plan branch / baseline:** `docs/v3-ia-plan` branched off `origin/main` @ `5f273355` (re-baseline
  confirmed §2). All `surface-inventory.md` reads are against that ref.
- **Docs target ref (where the build run authors):** the live docs live on **`origin/docs/user-site`**
  (Pages deploy branch, [[docs-pages-deploy-mechanism]]). The latest published commit at plan time is
  `fbf952627`. The build run checks out `docs/user-site`, edits under `docs/site/**`, and **never touches
  `docs/site/reference/**`** (generated by `deno doc`).
- **Surface inventory command (per unit):** `deno doc <module>` + reading each `deno.json` `exports` map
  under `packages/**` and `plugins/**` for a `@netscript/*` name. `deno why <pkg>` for dependency origin.
- **Leakage scan:** the deterministic scanner spec in `plan.md` §5 (deny patterns + allowlist), run over
  `docs/site/**` excluding `_site/` and `reference/`. Expected 0 hits post-overhaul.
- **`reference/**` exclusion proof:** `git diff --stat origin/docs/user-site -- docs/site/reference`
  must show zero changes at merge.
- **Visual/structural verification:** the existing WF-2 cross-ref audit + the Playwright visual-eval
  capstone, run against the served `_site/` (desktop + mobile viewports).
- **This planning run** writes only to `.llm/tmp/run/docs-v3-ia-plan--supervisor/**` (no `docs/site/**`
  and no code), so it does not trigger the Pages deploy (`pages.yml` is `docs/site/**`-scoped).
