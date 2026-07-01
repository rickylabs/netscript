# Phase Group Registry: package-quality

The group map for the S1 supervisor run. See `.llm/harness/workflow/supervisor.md`.
One section per **phase group** (= one wave: branch + worktree + nested run +
sub-PR + evaluator pass).

> S1 runs in the **new repo** (`rickylabs/netscript`). The per-package authority
> is the nested canonical run
> `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/`
> — each wave consumes the matching `evaluate_<unit>.md` / `plan_<unit>.md`; it
> does not rewrite them. The 2026-05 counts are **stale** post-PR#84 and are
> re-measured at Wave 0.

## Run Metadata

| Field | Value |
|-------|-------|
| Supervisor run ID | `feat-package-quality--supervisor` |
| Integration branch | `feat/package-quality` |
| Base branch | `feat/repo-genesis` (rebase onto `main` if new-repo PR #1 merges first) |
| Surface | 27 publishable units (23 packages + 4 plugins), all `0.0.1-alpha.0` |
| Canonical nested run | `…/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/` |

## Status Legend

| Status | Meaning |
|--------|---------|
| `planned` | In the map, not started |
| `active` | Group branch/worktree launched; implementation in progress |
| `evaluating` | Handed to a separate evaluator session |
| `merged` | Evaluator `PASS` (or accepted `FAIL_DEBT`); merged `--no-ff` |
| `blocked` | Waiting on a dependency or a user decision |
| `rescope` | Under rescope (see `escalations/`) |

## Wave 0 — Foundation

| Field | Value |
|-------|-------|
| Group branch | `feat/package-quality-wave0-foundation` |
| Nested run ID | `feat-package-quality-wave0-foundation--shared` |
| Units | `@netscript/shared` |
| Archetype(s) | A1 — small-contract |
| Status | `merged` (PR #3) |
| Merge commit | `eb8ae44` |

### Pre-conditions

- On `feat/package-quality` (off `feat/repo-genesis`); workspace `deno task check` green at baseline.
- **Baseline re-audit run first** (`.llm/tools/fitness/release-readiness.ts`), delta vs the 2026-05 inventory logged in `drift.md`.

### Inherited debt

- None upstream. Owns the surface-reconciliation note (29→27 units) for the whole run.

### Phase 0 reading

- Nested `PLAN.md` § 4 (Wave 0) + `evaluate_shared.md` + `plan_shared.md`
- `docs/architecture/STANDARDS.md` § 6–7; `docs/architecture/PUBLIC-SURFACE-PATTERNS.md`

### Surfaces touched

- `packages/shared/` (the type substrate every other unit depends on)

### Success criteria

- `@netscript/shared`: `deno publish --dry-run` 0 slow-types; `deno doc --lint` clean; README ≥ 150 LOC; `/docs` per STANDARDS; archetype A1 matrix green.

### Notes

- Foundation-first: no other wave starts until Wave 0 is `merged`. It also fixes the run-wide baseline numbers everything downstream trusts.

## Wave 0b — Harness reinforcement + agent docs (inserted)

| Field | Value |
|-------|-------|
| Group branches | `feat/package-quality-wave0b-harness`, `feat/package-quality-wave0b-docs` |
| Units | none (harness + `.agents/` tooling, not a publishable unit) |
| Status | `merged` (PR #4 harness, PR #5 docs/skills, PR #6 D4 removal) |
| Merge commits | `82ad2a2` (0b-A harness), `d5d8e5f` (0b-B docs), `76fbeb7` (base-sync / D4 drop) |

### Why it exists (not in the original 7-wave map)

- Wave 0 skipped Plan & Design because the Design checkpoint was an evidence
  section in `worklog.md`, not a gated deliverable. 0b-A rewrote the run loop to
  **8 phases** and added the **two-gate / dual-evaluator** model (PLAN-EVAL before
  code, IMPL-EVAL after), `gates/plan-gate.md`, `evaluator/plan-protocol.md`, and
  shifted `jsr-audit` left. 0b-B built `.agents/docs` + skills cluster and fixed
  repo-wide reference drift (doctrine path, `.claude/skills`, layout confabulation).
- This group is the reason every wave from 1 onward runs a separate-session
  PLAN-EVAL hard stop. See `lessons/plan-gate-design-as-gate.md`.

## Wave 1 — Contracts & schemas (A1)

| Field | Value |
|-------|-------|
| Group branch | `feat/package-quality-wave1-contracts` |
| Nested run ID | `feat-package-quality-wave1-contracts--<suffix>` |
| Units | `@netscript/runtime-config`, `@netscript/config`, `@netscript/contracts` |
| Archetype(s) | A1 — small-contract (config/contracts are A1/A4 hybrids — see nested docs) |
| Status | `merged` (PR #7) |
| Merge commit | `4c57867` |

### Pre-conditions

- Wave 0 `merged`.

### Phase 0 reading

- Nested `PLAN.md` § 4 (Wave 1) + `evaluate_{runtime-config,config,contracts}.md` + matching `plan_*`

### Surfaces touched

- `packages/runtime-config/`, `packages/config/`, `packages/contracts/`

### Success criteria

- All three: 0 slow-types dry-run, `doc --lint` clean, README/`docs` per STANDARDS, archetype matrix green.

### Notes

- Pure type/schema packages most of the tree depends on; align `defineContract` with the platform `definePlugin`/`defineTrigger` shapes per nested `plan_contracts.md`.
- **Outcome:** all 3 units re-baselined to **0 slow types** (stale audit claimed 35/30/1 — wrong). 27 slices. PLAN-EVAL `PASS` (adjusted: added F-14 console-log + F-17 co-location the Arch-1 plan had under-selected). IMPL-EVAL returned `FAIL_FIX` (config `./paths` doc-lint gap), fixed before merge. Full `deno task e2e:cli` PASS `41/0/0`. Nested run: `feat-package-quality-wave1-contracts--contracts`.

## Wave 2 — Integration adapters (A2)

| Field | Value |
|-------|-------|
| Group branch | `feat/package-quality-wave2-adapters` |
| Nested run ID | `feat-package-quality-wave2-adapters--<suffix>` |
| Units | `@netscript/logger`, `@netscript/telemetry`, `@netscript/aspire`, `@netscript/kv`, `@netscript/database`, `@netscript/prisma-adapter-mysql`, `@netscript/queue`, `@netscript/cron` |
| Archetype(s) | A2 — integration |
| Status | `merged` — 2a `merged` (PR #10, on track); 2b `merged` (PR #12 → umbrella `55f6108`); 2c `merged` (PR #13 → umbrella `d078e5b`); **umbrella PR #11 merged → track `d4f971e`**. Full Wave 2 complete. |
| Merge commit | `d4f971e` (umbrella PR #11 → track, `--no-ff`) |

### Sub-wave structure (OQ-1 resolved; PLAN-EVAL PASS — Option A)

Wave 2 split into three ordered sub-groups (2a→2b→2c), each `< 30` slices, each its
own branch + sub-PR into `feat/package-quality`, each its own IMPL-EVAL. Forced order:
kv→logger (2b after 2a), queue→kv (2c after 2b). PLAN-EVAL routing = **Option A**
(1 PLAN-EVAL over the combined plan — done, `PASS`; + 3 IMPL-EVALs).

| Sub-wave | Units | Branch | Slices | Status |
|----------|-------|--------|--------|--------|
| 2a — observability/host | logger, telemetry, aspire | `feat/package-quality-wave2-adapters-2a` | 10 | `merged` (PR #10, → track `698d890`) |
| 2b — data | kv, database, prisma-adapter-mysql | `feat/package-quality-wave2-adapters-2b` | 23 | `merged` (PR #12 → umbrella `55f6108`; IMPL-EVAL PASS, 1 in-scope fix) |
| 2c — messaging | queue, cron | `feat/package-quality-wave2-adapters-2c` | 17 | `merged` (PR #13 → umbrella `d078e5b`; IMPL-EVAL PASS + Augment hardening round) |

### Wave 2 closeout (2026-06-08)

Umbrella **PR #11 merged into the track** (`feat/package-quality-wave2-adapters` →
`feat/package-quality`, merge commit `d4f971e`, `--no-ff`). All three sub-waves
passed separate-session IMPL-EVAL; every Wave 2 unit is `deno publish --dry-run`
0 slow types + full-export `deno doc --lint` 0 errors, ships `./testing`
port-contract entrypoints, defensive abort/cleanup tests, doctests, and docs
scaffold. Hexagonal folder vocabulary landed across the wave (`interfaces/`→
`ports/`, `utils/`→`validation/`, kv `core/`→`application/`); AP-16 (queue) and
AP-17 (cron) closed.

**Caveats carried forward (do NOT block — owned by downstream tracks):**

- `e2e:cli` `behavior.triggers-health` — generated trigger-service runtime health
  probe fails (`localhost:8093/health`, os error 10054). Out-of-scope per plan
  risk register; adjudicated by IMPL-EVAL. **Relevant to Wave 3 (`@netscript/plugin`)
  and the generated-trigger surface.**
- `cli-maintainer-sync-isolated-declarations` — 3 pre-existing TS9016/TS9027 errors
  in `packages/cli/src/maintainer/features/sync/plugin/copy-official-plugin.ts:205`,
  byte-identical to base, imports neither queue nor cron. Owned by the **Wave 6 CLI**
  track. Recorded in `.llm/harness/debt/arch-debt.md`.

**Harness lessons promoted from Wave 2** (`.llm/harness/lessons/`):
`package-quality-archetype.md`, `sub-wave-orchestration.md`, `validation.md`,
`platform.md`.

### Integration-branch recovery (2026-06-07)

The original plan routed each sub-PR into `feat/package-quality` directly (2a did
this via PR #10). At the same time the Wave 2 plan **PR #8** was squash-merged
(`merged:true`, not reopenable), collapsing the Wave 2 tracking surface before the
wave was complete. **Recovery (per user):** re-establish
`feat/package-quality-wave2-adapters` as the **live Wave 2 integration branch** and
gate the track on **full-wave completeness**:

- Base-synced the parent with `feat/package-quality` (`e5d54e2`) so it carries 2a +
  the `copilot-setup-steps` workflow. The eventual umbrella → track merge is a no-op
  for 2a and only delivers 2b/2c.
- **New umbrella draft PR #11** (`feat/package-quality-wave2-adapters` → `feat/package-quality`)
  continues #8 (which can't be reopened). Merges **once**, at full Wave 2 completeness.
- **2b (PR #12) and 2c target the umbrella branch**, not the track. Sub-wave branches
  fork off the (now base-synced) parent so they inherit the plan and sit on top of 2a.

### Pre-conditions

- Wave 1 `merged`.

### Inherited debt

- Foundation-alpha debt from the platform rewrite touches `telemetry` (instrumentation) and `aspire` (`./helpers` subpath) — close where this wave touches them, else carry forward in `arch-debt.md`.

### Phase 0 reading

- Nested `PLAN.md` § 4 (Wave 2, dependency order) + per-unit `evaluate_*`/`plan_*`

### Surfaces touched

- `packages/{logger,telemetry,aspire,kv,database,prisma-adapter-mysql,queue,cron}/`

### Success criteria

- Each unit: 0 slow-types, `doc --lint`, README/`docs`, archetype A2 matrix; each adapter ships a `./testing` port-contract entrypoint per nested PLAN § 4 Wave 2.

### Notes

- Implement in the dependency order in the nested PLAN (logger → telemetry → aspire → kv → database → prisma-adapter-mysql → queue → cron).
- **Staged (reviewer):** branch `feat/package-quality-wave2-adapters` + worktree `.worktrees/wave2-adapters` + nested run `feat-package-quality-wave2-adapters--adapters` (seeded `research.md` + `context-pack.md`) + draft PR #8. Structural re-baseline done; dynamic gates marked `MEASURE-FIRST`.
- **Open scope decision (OQ-1):** Wave 1 used 27 slices for 3 units; 8 units will exceed the Plan-Gate `< 30` cap → likely **sub-wave split** (2a logger·telemetry·aspire / 2b kv·database·prisma-adapter-mysql / 2c queue·cron). If split, this changes the single-group assumption — escalate per `supervisor.md` § 4.
- **Per-unit headlines:** `database` is from-scratch (no README/docs/tests/metadata — the wave's `runtime-config`); `prisma-adapter-mysql` README < 150 + `skipLibCheck`; `database`/`queue`/`cron` carry `interfaces/` (AP-17); aspire has a redundant `./helpers` alias to drop; `telemetry`/`aspire` look verify-only.

## Wave 3 — Plugin runner

| Field | Value |
|-------|-------|
| Group branch | `feat/package-quality-wave3-plugin` |
| Nested run ID | `feat-package-quality-wave3-plugin--<suffix>` |
| Units | `@netscript/plugin` |
| Archetype(s) | A4 — dsl-builder (plugin host) |
| Status | `merged` — host PR #15 → umbrella PR #14 → track `feat/package-quality` (2026-06-08). IMPL-EVAL **PASS**. |
| Merge commit | `1423ab3` (umbrella PR #14 → track, `--no-ff`); host PR #15 → umbrella `565086d` |

### Pre-conditions

- Wave 2 `merged`. ✅ (`d4f971e`)

### Wave 3 closeout (2026-06-08)

Single-unit wave (`@netscript/plugin`, A4). Host sub-PR **#15**
(`feat/package-quality-wave3-plugin-host`) merged into umbrella **#14**
(`feat/package-quality-wave3-plugin`), then umbrella **#14 → track** (`1423ab3`,
`--no-ff`). Separate-session IMPL-EVAL **PASS**:

- Full-export `deno doc --lint` **93 → 0**; 8 entrypoints clean (`mod.ts`,
  `src/abstracts/mod.ts`, `src/config/mod.ts`, `src/cli/mod.ts`, `loader.ts`,
  `src/sdk/mod.ts`, `src/testing/mod.ts`, `src/templates/mod.ts`).
- `deno publish --dry-run` 0 slow types; tests **21 pass / 0 fail**; README 138 → 165 LOC.
- **LD-8 resolved without re-export** (preserves F-15/AP-14): the two upstream-typed
  private-type-ref leaks (`z.ZodType`, `StandardSchemaV1`) replaced by package-owned
  structural types `PluginManifestParser` / `PluginPayloadSchema` in
  `src/domain/schema-types.ts`.
- `plugin-builder.ts` 360 LOC accepted as F-1 debt (logged in `arch-debt.md`).
- Consumer-import validated against `cli` + `plugins/{sagas,streams,triggers,workers}`.

**Caveat carried forward → Wave 4 (`4d` triggers):** the only remaining `e2e:cli`
failure is `behavior.triggers-health` (`localhost:8093/health`), the pre-locked LD-4
carry-forward. **OQ-D resolved:** it is a *downstream generated-trigger* runtime
concern, **not** a plugin-host defect → terminal owner is Wave 4 sub-wave **4d**
(A5 plugin tier, runtime/Aspire validation required).

### Phase 0 reading

- Nested `evaluate_plugin.md` + `plan_plugin.md`; platform-rewrite final state (`netscript-start` PR #90/#96)

### Surfaces touched

- `packages/plugin/`

### Success criteria

- `@netscript/plugin`: 0 slow-types, `doc --lint`, README/`docs`, archetype matrix. Largely cleaned during the platform rewrite — **verify, do not assume**.

### Notes

- `plugins/hello-world` is **gone** (replaced by the `netscript plugin scaffold` template); the nested Wave 3 "hello-world" line does not apply here — log the delta.
- **Inherited caveat from Wave 2:** the `e2e:cli` `behavior.triggers-health` runtime failure (generated trigger service, `localhost:8093/health`, os error 10054) lives on the plugin/generated-trigger surface. Wave 3 touches `@netscript/plugin` (the plugin host); confirm whether the trigger health regression is a plugin-host defect or downstream (Wave 4 `plugin-triggers`) before scoping. Do not assume.
- Apply the Wave 2 enterprise-grade bar verbatim (`.llm/harness/lessons/package-quality-archetype.md`): A4 still owns public-surface doc-lint, `./testing` where the host exposes a contract, defensive I/O, doctests, and docs scaffold — package-quality is architectural, not type/lint cleanup.

## Wave 4 — Runtimes & their plugins

| Field | Value |
|-------|-------|
| Group branch | `feat/package-quality-wave4-runtimes` |
| Nested run ID | `feat-package-quality-wave4-runtimes--<suffix>` |
| Units | `@netscript/plugin-streams-core`, `@netscript/plugin-workers-core`, `@netscript/plugin-sagas-core`, `@netscript/plugin-triggers-core`, `@netscript/watchers`, `@netscript/plugin-streams`, `@netscript/plugin-workers`, `@netscript/plugin-sagas`, `@netscript/plugin-triggers` |
| Archetype(s) | A1/A4 (`*-core`), A3 (`watchers`), A5 (`plugins/*`) — **archetype-per-core disputed (registry A1/A4 vs canonical A3); settle in Plan & Design** |
| Status | **`merged`** — all sub-waves IMPL-EVAL PASS (separate sessions): 4a → umbrella `2c24662` (PR #18); 4b workers → `1896f854` (PR #19, OpenHands kimi-k2.6); 4c sagas → `8264a1c` (PR #20, OpenHands qwen3.7-max, after 1 FAIL_FIX); 4d triggers (LAST) → umbrella `67aa453` (PR #21, IMPL-EVAL PASS committed `bc17fe3`). **Umbrella → track closeout via PR #16 (GitHub merge) → `f0e1441`** with the deliberate `deno.lock` reconcile (otel 1.40→1.28 + esbuild/preact/loader; track untouched since `da0e470` → inherited clean, no conflict). |
| Merge commit | **`f0e1441`** (PR #16, umbrella → track, 2026-06-10) |

### Pre-conditions

- Wave 3 `merged`. ✅ (`1423ab3`) Track merged into the umbrella to carry the merged `@netscript/plugin` surface into the runtimes base.

### Wave 4 prep (2026-06-08)

Umbrella `feat/package-quality-wave4-runtimes` (off track `f2a7ff2`, worktree
`.worktrees/wave4-runtimes`, Draft PR #16 → track, marked **BLOCKED on Wave 3**).
Supervisor pre-research pass complete:
`.llm/tmp/run/feat-package-quality-wave4-runtimes--umbrella/{research,split-strategy,context-pack}.md`.

- **Dry-run reality:** all 9 units `deno publish --dry-run` **PASS, 0 slow types** at
  `f2a7ff2` (provenance `netscript-start#96`, merged 2026-05-26). Canonical "before"
  counts (workers 50, plugin-triggers 16, watchers FAIL) are **stale** → this wave is
  fine-tuning + a challenge pass, not a slow-type rebuild.
- **Real work:** full-export `deno doc --lint` debt (unmeasured; expect large on the
  17/19-export cores — Wave 3 was 11→120 root-vs-full); **A5 plugin tier has 0 tests**;
  `watchers` structural lift (no README/docs/tasks, flat layout); F-1 (e.g. `plugin-sagas`
  v1 router 716 LOC); F-6 task hygiene; docs/ missing on `triggers-core` + `plugin-triggers`.
- **Archetype reconciliation** is the central planning question — A3 ⇒ F-13 + Runtime/Aspire
  validation **required** (heavier than Waves 2–3). Recommendation: cores → A3 unless pure contract.
- **Split proposal:** `4a streams + watchers → 4b workers → 4c sagas → 4d triggers`
  (atomic core+plugin per family, dependency-ordered; 4b/4c may split core/plugin if
  doc-lint debt exceeds `<30` slices). PLAN-EVAL routing Option A (Wave 2 precedent).
- **`triggers-health` terminal owner = 4d** (A5 ⇒ runtime validation required), gated on
  Wave 3 OQ-D verdict.

### Wave 4 unblock + 4a open (2026-06-08)

Wave 3 merged (`1423ab3`) → **track merged into the umbrella**
(`feat/package-quality` → `feat/package-quality-wave4-runtimes`) so the runtimes base
now carries the merged `@netscript/plugin` surface. Reconciliation pass done:

- **OQ-D resolved:** `behavior.triggers-health` is a downstream generated-trigger runtime
  concern (not a plugin-host defect) → terminal owner **4d** (A5, runtime/Aspire validation).
- `@netscript/plugin` consumer scan re-confirmed against the merged surface; the A5
  plugin tier (`plugins/{streams,workers,sagas,triggers}`) imports the host via the
  published `mod.ts` + `loader.ts` + `src/testing/mod.ts` entrypoints validated at Wave 3
  IMPL-EVAL — no surface drift for the runtimes to absorb.

**Sub-wave 4a (streams + watchers) opened:** branch
`feat/package-quality-wave4-runtimes-4a`, worktree `.worktrees/wave4-runtimes-4a`,
nested run `feat-package-quality-wave4-runtimes--4a-streams-watchers`, **Draft PR #18 → umbrella #16**.
Handover = **Research → Plan & Design** (generator session; MEASURE-FIRST full-export
`deno doc --lint` + dry-run per unit before locking slices).

### 4a PLAN-EVAL + 4b/4c/4d parallel prep (2026-06-08)

**4a PLAN-EVAL (supervisor-inline, user-granted exception** — "we won't run a full
separate agent on eval for plugins plan phases since they were already almost ready";
IMPL-EVAL stays a separate session**):** verdict **PASS WITH ADJUSTMENTS** appended to
4a `plan.md`. 23 slices (S1–S5 streams-core A3, S6–S12 plugin-streams A5, S13–S21
watchers A3, S22–S23 cross-cutting). One adjustment locked (private-type-ref split-by-
type-origin: first-party `@netscript/*` → type re-export; third-party e.g.
`StandardSchemaV1` → package-owned structural type; `@ignore` only for genuinely-internal);
3 items carried to IMPL-EVAL (A5 runtime-registration evidence via verify-plugin.ts +
Aspire test; AP-13 console.warn debt entries; watchers deep-import retarget slice 15).
Implementation proceeding (generator session, PR #18).

**4b/4c/4d prepared in parallel (user-approved** — "prepare them all and then keep them
up to date before implementing"**).** Each forked off the umbrella @ `ee9f26b` with a
supervisor read-only MEASURE-FIRST pre-research pass (architectural seeds only — no
package code). All three carry a **DO-NOT-LOCK pull-forward gate**: each pulls the umbrella
forward (`git merge feat/package-quality-wave4-runtimes`) after its predecessors merge,
then re-runs MEASURE-FIRST before locking its plan.

| Sub-wave | Units | Branch / worktree | PR | Measured doc-lint (full-export) @ `ee9f26b` | Headline |
|----------|-------|-------------------|----|---------------------------------------------|----------|
| 4b — workers | plugin-workers-core (A3) + plugin-workers (A5) | `…-4b` / `.worktrees/wave4-runtimes-4b` | **#19** | core 460 (180 ptr + 280 jsdoc) · plugin 143 (83+60) = **603** | largest family; 17-export F-5/F-16; 0-test plugin; F-1 501/469; likely core/plugin split. Pull-forward after **4a** (couples `./streams`). |
| 4c — sagas | plugin-sagas-core (A3) + plugin-sagas (A5) | `…-4c` / `.worktrees/wave4-runtimes-4c` | **#20** | core 397 (48+349) · plugin 122 (71+51) = **519** | 19-export F-5/F-16 + ports/adapters F-3 layering; 0-test plugin + core has no test task; F-1 v1-router **716** (biggest on board) + redis-transport 481; likely core/plugin split. Pull-forward after **4a+4b** (`./streams` + `./integration/workers`). |
| 4d — triggers | plugin-triggers-core (A3) + plugin-triggers (A5) | `…-4d` / `.worktrees/wave4-runtimes-4d` | **#21** | core 211 (46+165) · plugin 138 (76+62) = **349** | lightest family but **both docs/ MISSING** (F-7); 0-test plugin; `test-webhooks-e2e` 424; **OQ-D owner — `triggers-health` live `localhost:8093/health` probe**; likely combined (no split). Runs LAST. Pull-forward after **4a+4b+4c**; its merge → umbrella full-wave completeness → umbrella→track. |

All 6 units `deno publish --dry-run` **PASS, 0 slow types** at `ee9f26b` → Wave 4 is
fine-tuning + a surface challenge, not a slow-type rebuild. Family doc-lint totals confirm
the split-strategy (4b/4c need core/plugin splits; 4d likely combined). Wave-4 doc-lint
across all 8 not-yet-started units (streams handled in 4a) ≈ **1,471**. Seed docs under
each `feat-package-quality-wave4-runtimes--4{b,c,d}-*/` (context-pack, pre-research,
worklog, drift, commits). Each sub-wave's generator owns its own MEASURE-FIRST re-baseline
(per-entrypoint attribution, consumer scan, test-layer design) after the pull-forward.

### 4a closeout + 4b pull-forward (2026-06-09)

**Sub-wave 4a (streams + watchers) merged.** Separate-session IMPL-EVAL **PASS** (Copilot);
PR #18 merged into the umbrella (`2c24662`, GitHub merge commit). Outcomes:

- `@netscript/plugin-streams-core` reclassified **A1→A3** (`DurableStreamProducer` owns
  network I/O + lifecycle + singleton registry); full-export doc-lint **1→0**; testing
  fixture type exported; close-after-abort lifecycle test. `check` enumerates all 3
  entrypoints.
- `@netscript/plugin-streams` (A5): doc-lint **15→0**; **0→5 tests** (manifest, CLI,
  Aspire-contribution `/health` **registration** test on `deno-service streams :4437`,
  E2E gates) + `verify-plugin.ts` (`ok:true`, 4 contribution groups, 0 findings) wired
  into `check`.
- `@netscript/watchers` (A3): structural lift flat-root → `src/public/`; doc-lint **5→0**;
  README **224 LOC** + 3-file docs scaffold; tasks + publish list; tests **18/0** (after
  IMPL-EVAL fixed the `test` task to include `tests/`, was 13/0).
- All 3 `deno publish --dry-run` **0 slow types**. **LD-8 split-by-origin held** (first-party
  host/CLI/Aspire types re-exported; third-party schema replaced by a package-owned
  structural contract). **AP-13** `console.warn` runtime-reporting debt logged for
  streams-core + watchers in `arch-debt.md`.
- IMPL-EVAL landed 3 augment fixes (watchers `test` task scope; streams-core README
  "Archetype 1"→"Archetype 3"; streams `getting-started` invalid snippet).

**⚠️ Umbrella-level carry (NOT a 4a regression):** `packages/cli` `deno task check` fails
TS9016/TS9027 (`isolatedDeclarations` shorthand) in
`src/maintainer/features/sync/plugin/copy-official-plugin.ts` — **byte-identical to umbrella
base `ee9f26b`**, references neither streams nor watchers. This is the pre-existing **Wave 6
CLI** isolated-declarations debt (`arch-debt.md`, first logged at Wave 2 closeout). 4a's S22
"cli check PASS" row was **stale** (masked by `rtk proxy` filtering). Downstream sub-waves'
consumer-import checks must scope to type-resolution of their own surface and not treat this
as a regression. Terminal owner remains **Wave 6 CLI**.

**4b pull-forward DONE (supervisor base-sync).** 4b (`feat/package-quality-wave4-runtimes-4b`)
merged the 4a-carrying umbrella (`git merge` → `173357c`; merge-base now `2c24662`),
settling `workers-core ./streams` (re-exports `@netscript/plugin-streams-core`, now
doc-lint-clean + A3). 4b run docs updated (worklog "Pull-forward DONE" row; drift re-baseline
+ cli-carry rows). **4b base is current → generator may proceed to Research/MEASURE-FIRST →
Plan & Design.** 4c/4d remain at `ee9f26b` (fork-forward when their predecessors merge).

### 4b closeout + 4c pull-forward (2026-06-09)

**Sub-wave 4b (workers) merged.** First sub-wave run fully on the **OpenHands automation**
for both evaluator passes (model `openrouter/moonshotai/kimi-k2.6`, separate GitHub Actions
sessions — satisfies the dual-session rule): **PLAN-EVAL PASS** (27 slices, A3 core / A5
plugin split confirmed) and **IMPL-EVAL PASS**. PR #19 merged into the umbrella (`1896f854`).
Outcomes:

- `@netscript/plugin-workers-core` (A3): full-export doc-lint **460→0** (180 ptr + 280 jsdoc);
  `./contracts`→`./contracts/v1` fold (17→16 entrypoints); version `0.1.0`→`0.0.1-alpha.0`;
  F-1 concept-split `workers.contract.ts` (522→split); live runtime dispatch smoke `ok:true`.
- `@netscript/plugin-workers` (A5): doc-lint **143→0**; **0→5 tests** (manifest, CLI, Aspire
  registration, E2E gates) + `verify-plugin.ts` (`ok:true`, 0 findings); F-1 split
  `scheduler.ts` 480→342; `publish:dry-run` added.
- Both `deno publish --dry-run` **0 slow types**. **LD-8 split-by-origin held** (Zod leaks →
  package-owned structural types; first-party → type re-export). IMPL-EVAL landed one in-scope
  fix: explicit `z.ZodType<…>` annotations on 3 schemas in `workers.contract-schemas.ts` for
  `isolatedDeclarations` (commit `8573674`). Consumer-import PASS for `plugins/{triggers,sagas,
  workers}` + `packages/cli` (workers surface).

**⚠️ NEW umbrella-level carry — `deno.lock` drift from the 4b PLAN-EVAL automation.** The
OpenHands PLAN-EVAL commit churned `deno.lock` (**+179/−63 vs `2c24662`**:
`@opentelemetry/semantic-conventions` **1.40.0→1.28.0** downgrade + `esbuild`/`esbuild-wasm`/
`@deno/loader`/`preact`/`zod@3.25.76` additions) as a side-effect of running checks, and it
**rode into the merged umbrella** (`1896f854`). 4b validated green on it (the implementer's
"lock unchanged" was relative to its own already-churned baseline, not `2c24662`). Decision:
**do NOT revert mid-wave** (would re-churn); inherit it forward and **reconcile deliberately at
Wave 4 closeout** (umbrella→track) via a reviewed lock pass. Durable fix = the OpenHands
PLAN-EVAL automation must not commit lock churn (see `lessons/platform.md`).

**4c pull-forward DONE (supervisor base-sync).** 4c (`feat/package-quality-wave4-runtimes-4c`)
merged the 4a+4b-carrying umbrella (`git merge` → `128a0a8`; merge-base now `1896f854`),
settling BOTH `sagas-core ./streams` (re-exports the now-A3, doc-lint-0 `plugin-streams-core`)
**and** `./integration/workers` (re-exports the now-A3, doc-lint-0 `plugin-workers-core`). 4c
run docs updated (worklog "Pull-forward DONE" row; drift re-baseline + lock-carry + cli-carry
rows; doc commit `21aaef0`). **4c base is current → generator may proceed to Research/
MEASURE-FIRST → Plan & Design.** 4d remains at `ee9f26b` (forks forward after 4c merges; LAST).

### 4c closeout + 4d pull-forward (2026-06-09)

**Sub-wave 4c (sagas) merged.** Both evaluator passes ran on the **OpenHands automation**
(model `openrouter/qwen/qwen3.7-max`, separate GitHub Actions sessions — dual-session rule
satisfied). **PLAN-EVAL PASS** (8/8 plan-gate boxes; spot-checked over-cap LOC, missing tasks,
merge-base; **NO `deno.lock` churn this time** — the 4b lesson held). **IMPL-EVAL returned
`FAIL_FIX`** then **PASS after remediation**. PR #20 merged into the umbrella (`8264a1c`).
**Split executed:** 4c-core (14 slices C1–C14) merged first, then 4c-plugin (13 slices P1–P13)
= 27 total. Outcomes:

- `@netscript/plugin-sagas-core` (A3): full-export doc-lint **397→0** (19 entrypoints); F-1
  splits `v1.ts` 715→handlers/helpers/types, `redis-transport.ts` 480 + `list-transport.ts`
  453 → transport+commands; **17/17 core unit tests** (concurrency/idempotency/scheduler/store);
  dry-run **0 slow types**. **F-3 layering CLEAN** (`ports/`→contracts, `adapters/`→`SagaBusPort`,
  `transports/`→`SagaTransportPort` swappable, `stores/` pass-through, `middleware/` consumes
  ports). A3 runtime validation present. Closed arch-debt **AP-1** at C13.
- `@netscript/plugin-sagas` (A5): doc-lint **122→0** (12 entrypoints); **0→5 tests** (manifest,
  CLI, Aspire registration, E2E gates, public surface); README lifted to **205 LOC**; `#96`
  v1-router Prisma interface fixed at P8; dry-run PASS.
- **LD-8 split-by-origin held** (Zod/oRPC/`@saga-bus/core` → package-owned structural types;
  first-party `@netscript/*` → type re-export; Aspire contribution → package-owned structural,
  not subclass identity — P3 drift row).

**IMPL-EVAL `FAIL_FIX` → PASS (1 blocking finding).** The independent evaluator ran the
**full-barrel** `deno doc --lint packages/plugin-sagas-core/mod.ts` and found **2
`private-type-ref`** errors — `SagaCorrelation` missing from `src/public/mod.ts`'s exported
closure (referenced by `SagaBuilder["correlate"]` + `SagaCorrelationRule`). Root cause: the
generator's C14 per-entrypoint lint did **not** merge the `builders/mod.ts`→`define-saga.ts`
graph, so the per-EP run undercounted what the merged public barrel exposes — the same F-7 trap
documented for 4d going forward. Remediated by the supervisor in **`d71719c`** (1-line
`SagaCorrelation,` re-export per plan §5 F-7 strategy) which also closed the long-standing
**CLI-E2E known gaps** (added the missing `e2e:cli full` command path; aligned generated worker
structural interfaces with `@netscript/plugin-workers-core` runtime return types; switched
trigger/OTEL probes to explicit IPv4 loopback), then **`6894c18`** (docs). Raw re-verification:
`deno doc --lint …sagas-core/mod.ts` PASS; `deno task e2e:cli full` **41/41 on `scaffold.runtime`
with `behavior.triggers-health` + `database.init` + `generated.deno-check` all PASS** (the
previously-carried E2E failures were fixed here as a bonus). **No second IMPL-EVAL run** — the
1-line fix + raw re-verification of the exact failing gate was accepted (within the 1-FAIL_FIX
allowance).

**✅ Lock hygiene held (4b lesson worked).** The 4c IMPL-EVAL OpenHands commit (`d84a36c`,
`chore(openhands): apply agent changes`) touched **only** `.llm/tmp/openhands/*` + added
`evaluate.md` — **`deno.lock` untouched**. The 4b PLAN-EVAL lock-churn carry (otel 1.40→1.28 +
esbuild/preact/loader, +179/−63 vs `2c24662`) is still inherited in the umbrella, **NOT
re-churned by 4c**, still scheduled for the deliberate reconcile at Wave 4 closeout.

**4d pull-forward DONE (supervisor base-sync). LAST sub-wave.** 4d
(`feat/package-quality-wave4-runtimes-4d`) merged the 4a+4b+4c-carrying umbrella (`git merge
origin/feat/package-quality-wave4-runtimes` `8264a1c` → merge `32637a9`, **clean ort, no
conflicts**, working tree clean, **`deno.lock` identical to umbrella** — no new churn). Pushed
(`192f288..32637a9`, verified via ls-remote), then 4d run docs updated (worklog "Pull-forward
DONE" row; drift re-baseline + inherited lock-carry + CLI-carry + the full-merge-doc-lint lesson
from 4c IMPL-EVAL; doc commit `c032682`). **4d base is current → generator may proceed to
Research/MEASURE-FIRST → Plan & Design.** On 4d's merge the umbrella reaches **full Wave 4
completeness** → supervisor merges umbrella → track `feat/package-quality` `--no-ff`, with the
deliberate `deno.lock` reconcile.

### Inherited debt

- These units were rebuilt in the platform rewrite (`netscript-start` PR #88/#91/#92/#93/#94); most reached 0 slow-types there. This wave is **verification + docs parity**, escalating only real regressions.

### Phase 0 reading

- Nested `PLAN.md` § 4 (Wave 4) + `evaluate_{streams,workers,sagas,triggers}.md` + `plugin-*` evaluate/plan; reconcile names to `*-core`

### Surfaces touched

- `packages/plugin-{streams,workers,sagas,triggers}-core/`, `packages/watchers/`, `plugins/{streams,workers,sagas,triggers}/`

### Success criteria

- Each core+plugin: 0 slow-types, `doc --lint`, README/`docs`, archetype matrix; released as atomic core+plugin sub-waves (streams, workers, sagas, triggers) + `watchers`.

### Notes

- Largest reconciliation surface (old `@netscript/{streams,triggers,workers,sagas}` packages → `*-core`). Confirm the nested per-package docs map cleanly; log every rename in `drift.md`.

## Wave 5 — Application surfaces (A4)

| Field | Value |
|-------|-------|
| Group branch | `feat/package-quality-wave5-apps` |
| Nested run ID | `feat-package-quality-wave5-apps--<suffix>` |
| Units | `@netscript/sdk`, `@netscript/service`, `@netscript/fresh`, `@netscript/fresh-ui` |
| Archetype(s) | **service A4(+A3) · sdk A3(+A4) · fresh-ui A4 Browser · fresh A4+A3 Browser (multi)** — see prep note (registry "A4 — dsl/app" was a first-pass guess) |
| Status | **`merged`** — all 4 sub-waves (5a service, 5b sdk, 5c fresh-ui, 5d fresh) merged into umbrella; post-merge structural consolidation A–E landed; **3× independent IMPL-EVAL (MiniMax M3) APPROVED**; **umbrella PR #17 merged → track `82c1185`** (2026-06-14). |
| Merge commit | `82c1185` (PR #17 umbrella → track, merge commit) |

### Pre-conditions

- Wave 4 `merged` (Wave 4 itself gated on Wave 3).

### Phase 0 reading

- Umbrella `feat-package-quality-wave5-apps--umbrella/{research,split-strategy,context-pack}.md`
- RFC set at **test-app root** `.resources/rfcs/frontend/` (README map; 14 = unimplemented seams; 17 v3 = realized integration thesis)
- Nested `evaluate_{sdk,service,fresh,fresh-ui}.md` + matching `plan_*` (stale — structural intent only)

### Surfaces touched

- `packages/{sdk,service,fresh,fresh-ui}/`

### Success criteria

- Each unit: **dry-run PASS (currently RED on all 4)**, full-export `doc --lint` clean, README ≥150 doctested, `docs/` scaffold, `./testing` entrypoint, archetype gates, F-16/F-18 surface discipline. Match/exceed plugin-tier quality; forward-compatible RFC 14 seams; CLI-ready registry/preset/testing seams.
- `@netscript/fresh` (13.2k src LOC, 276 doc-lint, 13 over-cap, multi-archetype) is the long pole — splits internally `5d-1..5d-6` per `split-strategy.md`.

### Notes

- `fresh` is the largest restructure on the board; budget accordingly.

### Wave 5 prep (2026-06-08)

Supervisor pre-research complete (umbrella PR #17, branch `feat/package-quality-wave5-apps`,
worktree `.worktrees/wave5-apps`, off track `9b27fb4`):
`feat-package-quality-wave5-apps--umbrella/{research,split-strategy,context-pack,worklog,drift,commits}.md`.

- **This is a RE-ARCHITECTURE wave, not fine-tuning.** Unlike Wave 4 (9/9 PASS dry-run), **all 4
  Wave 5 packages FAIL `deno publish --dry-run`** (slow types: service 8, sdk 2, fresh 4,
  fresh-ui 6). They grew via RFC 12/13/15/16/17 **before doctrine + the plugin rewrite**.
- **Baseline @ `9b27fb4`:** 171 src files, ~23.4k src LOC, **328 doc-lint errors** (sdk 29 /
  service 23 / fresh **276** / fresh-ui 0), **138 `private-type-ref`** surface leaks, **20
  over-cap files** (fresh 13), **2 zero-test packages** (sdk, service), `service` has **no
  README**, **0/4 have `docs/` or `./testing`**. `fresh` = 57% LOC / 84% doc-lint.
- **Central surface debate:** sdk + fresh each expose **12 subpaths** ⇒ F-16 cardinality + F-18
  sub-barrel; several are RFC-era (sdk `query-client`/`collections`/`streams`; fresh `query`/
  `streams`/`vite`/`interactive`) — justify or fold each.
- **Three architect throughlines** (beyond JSR readiness): (1) surface encapsulation — kill the
  138 private-type-ref leaks; (2) forward-compatible RFC 14 seams (sdk `Transport`, fresh
  `defineFreshApp` §10 extension) — **protect, don't implement** unified mode; cross-package
  integration (sdk↔fresh query/streams, fresh↔fresh-ui forms); (3) CLI-readiness — stable +
  documented + tested registry/preset/testing seams for Wave 6 starter commands.
- **Split:** `service (5a) → sdk (5b) → fresh-ui (5c) → fresh (5d)`, dependency-ordered; `fresh`
  splits internally `5d-1..5d-6` (support → builders → route → defer/streams → form →
  query/defineFreshApp). PLAN-EVAL Option A; umbrella merges to track once.
- **Out of scope:** `@netscript/ui-primitives` (RFC-deferred — do NOT create); CLI (Wave 6);
  Nitro adapters (RFC 14 roadmap).
- **Next gate:** after Wave 4 merges → merge track into umbrella → extra Claude reconciliation
  pass (cross-package consumer scan vs merged surface + `fresh/streams`/`sdk/streams` vs merged
  Wave 4 streams) → then open 5a.

### Wave 5 reconcile + re-baseline DONE (2026-06-10 @ `dfab7a4`)

Wave 4 merged to track (`f0e1441`). Track reconciled into umbrella `feat/package-quality-wave5-apps`
(`acdfab7..dfab7a4`, clean ort — no conflicts; pushed, verified via ls-remote). Apps layer
re-baselined against the merged Wave 4 surface + blessed lock (raw `deno` spawned, RTK-bypassed;
`wave5-rebaseline.json` + `wave5-doclint.json`; supervisor doc commit `09f4845`):

- **Headline unchanged vs `9b27fb4`:** combined doc-lint = **328** (service 23 / sdk 29 / fresh-ui 0
  / fresh **276**); **138 `private-type-ref`**; all 4 `deno publish --dry-run` RED. Apps layer was
  untouched by Wave 4, as expected — re-architecture scope stands.
- **What changed:** **all 4 now PASS `deno check --unstable-kv`** on the merged plugin surface +
  blessed lock (no new app-layer type breakage). Stream coupling re-confirmed (27 `fresh` files →
  merged `@netscript/plugin-streams(-core)`, all resolve); the exact stream surface locks at 5d-4.
- **doc-lint ground truth = COMBINED over all entrypoints** — `fresh` root-barrel `mod.ts` = 23 vs
  combined **276** (undercount ×12); generator MEASURE-FIRST + IMPL-EVAL must use the combined sweep
  AND a full-barrel run (4c `SagaCorrelation` trap).
- **Tooling drift:** `parse-deno-check-errors.ts` removed → `.llm/tools/run-deno-check.ts`; doctrine
  gained **F-19**; root `check`/`lint`/`fmt:check` scoped to exclude Wave 5 apps + Wave 6 CLI debt.
- **Fable 5 handover persisted:** `…/feat-package-quality-wave5-apps--umbrella/fable5-handover.md`
  (curated generator entry point — read order, re-baseline table, throughlines, constraints, gotchas).
- **Next:** the generator (a separate session — supervisor stops at unblock) opens sub-wave **5a
  (service)** off umbrella head `dfab7a4`. Supervisor does NOT lock plans or open 5a.

### Wave 5 CLOSEOUT — merged to track (2026-06-14 @ `82c1185`)

All four sub-waves completed, merged into the umbrella, then a post-merge **structural
consolidation run** (`feat-package-quality-wave5-apps--consolidation`) restructured all four to
the canonical `src/` doctrine layering. Umbrella **PR #17 merged into the track** (`82c1185`,
GitHub merge commit; base was `24720fe`).

- **Sub-waves:** 5a service (PR-merged), 5b sdk, 5c fresh-ui (PR #30, runs 5c1+5c2), 5d fresh
  (internal 5d1–5d6) — all merged into the umbrella.
- **Consolidation A–E** (`src/` role folders, no forbidden names, ≤500 LOC files, archetype-4 docs):
  - A `service` — split `service-builder.ts` (604 LOC) → builder/{impl,rpc,listener}; package-owned
    `ServiceContext`/`ServiceHandler`/`RunningService` types (no Hono/oRPC leak); DB-connectivity diagnostic.
  - B `sdk` — collapse 8 root barrels + `streams.ts` into `src/` single source root; 10 subpath keys byte-stable; B1/B2 re-slice deferred (KISS, drift-recorded).
  - C `fresh-ui` — `runtime/`→`src/runtime`, `primitives`→`src/presentation`; A3→A4 doc correction.
  - D/D2 `fresh` — full `src/` layering; `./utils` removed; **all 5 root re-export shells deleted** (no backward compat); CLI import-maps repointed; scaffold E2E `scaffold.runtime` **41/41**.
- **Phase E — 3× independent IMPL-EVAL (OpenHands, `openrouter/minimax/minimax-m3`, iterations=600, write-artifact-first), all `VERDICT: APPROVED`, `summary_source=agent` (genuine):**
  - fresh   [run 27507518739] — 8/8 PASS, E2E 41/41, max file 497 LOC.
  - service [run 27508042691] — 7/7 PASS, max 408 LOC, no vendor leak, `stop()`+AbortSignal.
  - sdk     [run 27511443802] — 7/7 PASS, byte-stable surface, RFC-14 Transport seam public.
- **Debt:** `packages/fresh` AP-1 (builders split) + F-7 (doc-lint) → **RESOLVED**. `packages/service`
  presets/assets role-clarification (F-3/F-11) + `scalar.min.js` 3.3 MB (D-9) remain open + DEBT_ACCEPTED.
  sdk B1/B2 re-slice = drift deferral (revisit when a 2nd concrete adapter per port lands).
- **Run docs (for the next agent):** `.llm/tmp/run/feat-package-quality-wave5-apps--consolidation/`
  {research, consolidation-plan, worklog, drift, commits, context-pack, **eval-results.md**, impl-eval*.md}.
- **Result:** Wave 5 = the last application-surface wave. **Only Wave 6 (cli) remains** before S1 is
  publish-clean across all 27 units.

## Wave 6 — Tooling

| Field | Value |
|-------|-------|
| Group branch | `feat/package-quality-wave6-cli` |
| Nested run ID | `feat-package-quality-wave6-cli--<suffix>` |
| Units | `@netscript/cli` |
| Archetype(s) | A6 — cli-tooling |
| Status | **`impl-complete`** — PR **#43** (wave6-cli) @ `350fbd1`, publish-clean. All S1 slices landed: 0,1,2,3,5 (D-SUP-W6) + **4a `43e8ea4`** + **6 `f49af63`** (`2026-06-17`, session `019ed645` exited clean). `scaffold.runtime` 41/41; repo `test` 650/0; **AP-1 CLOSED**. Slice **4b deferred → post-S3 step F** (D-SUP-W8). Next: merge #43 into `feat/package-quality`, then S1→`main`. |
| Merge commit | — (impl complete; merges into `feat/package-quality` ahead of the S1→`main` merge) |

### Pre-conditions

- Waves 0–5 `merged` ✅ (Wave 5 → track `82c1185`). CLI references every other unit at `0.0.1-alpha.0`.

### Phase 0 reading

- Nested `evaluate_cli.md` + `plan_cli.md`; nested PLAN § 6 (the CLI quality bar) + § 9 (CLI dry-run false positive)

### Surfaces touched

- `packages/cli/` (and `packages/cli/e2e/` as the workspace member, non-publishable)

### Success criteria

- `@netscript/cli`: 0 slow-types (watch the documented `--dry-run` false positive in nested PLAN § 9), `doc --lint`, README/`docs`, archetype A6 matrix. It is also the docs-site source of truth for S5.

### Notes

- Shipped last by design. Do not bump scaffold templates to `jsr:` refs here — that is S3 (publish) territory; S1 stops at publish-clean.
- **Slice 4 is SPLIT (locked, D-SUP-W8):** *4a* = scaffold improvements validated vs
  `publish --dry-run` / local fixture — **stays in S1** (this wave, with Slice 6). *4b* =
  `scaffold.published.runtime` E2E vs the **real** published `0.0.1-alpha.0` — **deferred to
  post-S3** (program step F). No live JSR publish occurs in S1.
- **Program sequencing (D-SUP-W8): merge-first / publish-second / finish-CLI-third.** S1 lands on
  `main` behind the minimal `ci.yml` gate (`check`+`test`+`e2e:cli`); S2 finalizes the 2.8
  toolchain; S3 publishes the **26 non-CLI** units via OIDC from `main`; then step F validates
  Slice 4b against the real published set and publishes `@netscript/cli` last (LD-7), under a new
  umbrella PR continuing PR #2.

---

## Summary Table

| Wave | Status | Depends on | Units | Merge commit |
|------|--------|-----------|-------|--------------|
| 0 — Foundation | `merged` | none | shared | `eb8ae44` (PR #3) |
| 0b — Harness reinforcement (inserted) | `merged` | 0 | none (harness + `.agents/`) | `82ad2a2`,`d5d8e5f`,`76fbeb7` |
| 1 — Contracts & schemas | `merged` | 0 | runtime-config, config, contracts | `4c57867` (PR #7) |
| 2 — Integration adapters | `merged` (2a #10; 2b #12; 2c #13; umbrella #11 → track) | 1 | logger, telemetry, aspire, kv, database, prisma-adapter-mysql, queue, cron (split 2a/2b/2c) | `d4f971e` (PR #11) |
| 3 — Plugin runner | `merged` (host #15 → umbrella #14 → track; IMPL-EVAL PASS) | 2 | plugin | `1423ab3` (PR #14) |
| 4 — Runtimes & plugins | `active` (umbrella #16; 4a merged `2c24662` #18; 4b merged `1896f854` #19; 4c merged `8264a1c` #20; 4d LAST pulled forward `32637a9`, in Research/Plan #21) | 3 | plugin-{streams,workers,sagas,triggers}-core, watchers, plugin-{streams,workers,sagas,triggers} | — |
| 5 — Application surfaces | `prepared` (umbrella PR #17, blocked on 4) | 4 | sdk, service, fresh, fresh-ui | — |
| 6 — Tooling | `impl-complete` (PR #43 @ `350fbd1` publish-clean; all S1 slices 0–3,4a,5,6 landed; AP-1 closed; 4b deferred post-S3 step F per D-SUP-W8) | 0–6 (4a) | cli | — |

Unit count: 1 + 3 + 8 + 1 + 9 + 4 + 1 = **27**.

## Base-Sync Log

| Date | Base sha merged | Result | Notes |
|------|-----------------|--------|-------|
| 2026-06-04 | `main` | merged | Pre-wave syncs into `feat/package-quality` (`a7796a0` ignore .worktrees, `44e3b8e` sub-PR rule, `734421c` branch naming) |
| 2026-06-05 | `feat/package-quality` | merged | Wave 1 base-sync `76fbeb7` (also dropped the rejected D4 capability-gap skill section) |
| 2026-06-07 | `feat/package-quality` → `feat/package-quality-wave2-adapters` | merged | Pre-implementation base-sync (supervisor.md § 5): brings the new `.github/workflows/copilot-setup-steps.yml` (cloud-agent env: Deno 2.x + .NET 10 + Aspire CLI + Docker) + supervisor PLAN-EVAL-PASS docs onto the Wave 2 branch before sub-wave 2a starts. `main` unchanged since `4c57867`. |
| 2026-06-07 | `feat/package-quality` (incl. 2a #10) → `feat/package-quality-wave2-adapters` | merged (`e5d54e2`) | Integration-branch recovery: re-base the Wave 2 parent on the track after 2a merged directly via #10, so the parent becomes the live Wave 2 integration branch (carries 2a + copilot setup). 2b/2c now fork off this and target the umbrella PR #11. `main` still at `3b4dcb9` (PR #9 only). |
| 2026-06-07 | `feat/package-quality-wave2-adapters-2b` → `feat/package-quality-wave2-adapters` | merged (`55f6108`, PR #12) | Sub-wave 2b (kv·database·prisma-adapter-mysql) merged into the umbrella after separate-session IMPL-EVAL **PASS** (1 in-scope fix: `@netscript/database` `jsonUtils` slow-type/doc-lint). Out-of-scope caveat carried: `cli` + `plugins/streams` pre-existing isolated-declarations debt. `@db/redis` migration assessed and **deferred to a future track (NOT Wave 2)**. Umbrella now = track + 2a + 2b. |
| 2026-06-07 | bootstrap `feat/package-quality-wave2-adapters-2c` off umbrella `55f6108` | n/a (fork) | Sub-wave 2c (queue·cron) worktree `.worktrees/wave2-adapters-2c` + branch forked off the umbrella (queue→kv dep). Seed run docs committed (`0a4e043`); draft PR **#13** opened into the umbrella. Research/Plan pending (separate sessions). |
| 2026-06-08 | `feat/package-quality-wave2-adapters-2c` → `feat/package-quality-wave2-adapters` | merged (`d078e5b`, PR #13) | Sub-wave 2c (queue·cron) merged into the umbrella after separate-session IMPL-EVAL **PASS** + Augment hardening round on the in-memory queue adapter. Hexagonal renames (queue `interfaces/`→`ports/`, `utils/`→`validation/`; cron `interfaces/`→`ports/`), AP-16/AP-17 closed. Caveats: `e2e:cli` triggers-health (out-of-scope runtime) + `cli` isolated-declarations debt. Umbrella now = track + 2a + 2b + 2c. |
| 2026-06-08 | `feat/package-quality-wave2-adapters` → `feat/package-quality` | merged (`d4f971e`, PR #11) | **Wave 2 closeout.** Umbrella merged to the track with a merge commit (`--no-ff`). Full Wave 2 (2a+2b+2c, 6 packages) complete and on the track. `main` still at `3b4dcb9`. Local track worktree fast-forwarded `d931dc6`→`d4f971e` (clean FF; `d931dc6` is a parent of the merge). |
| 2026-06-08 | bootstrap `feat/package-quality-wave4-runtimes` off track `f2a7ff2` | n/a (fork) | **Wave 4 prep (parallel, user-approved).** Umbrella worktree `.worktrees/wave4-runtimes` + branch off the track. Seed + supervisor pre-research committed (`5f0b949`); Draft **PR #16** → track, marked **BLOCKED on Wave 3**. No sub-branch opened; plan-lock deferred. Post-Wave-3: merge track into umbrella → reconciliation pass → open 4a. `main` still at `3b4dcb9`. |
| 2026-06-08 | bootstrap `feat/package-quality-wave5-apps` off track `9b27fb4` | n/a (fork) | **Wave 5 prep (parallel, user-approved).** Umbrella worktree `.worktrees/wave5-apps` + branch off the track. Seed + supervisor architectural pre-research committed (`acdfab7`); Draft **PR #17** → track, marked **BLOCKED on Wave 4**. Baseline: **all 4 packages FAIL dry-run** (re-architecture, not fine-tuning); 328 doc-lint / 138 private-type-ref / 20 over-cap; `fresh` long pole splits `5d-1..5d-6`. No sub-branch opened; plan-lock deferred. Post-Wave-4: merge track into umbrella → reconciliation pass → open 5a. `main` still at `3b4dcb9`. |
| 2026-06-08 | `feat/package-quality` (Wave 3 merged, `1423ab3`) | merged (FF `5a73fcf`→`1423ab3`) | **Wave 3 closeout.** Host PR #15 → umbrella PR #14 → track. Local track worktree fast-forwarded (clean FF; `5a73fcf` is an ancestor of the merge). Supervisor registry marked Wave 3 `merged`; OQ-D resolved (triggers-health → 4d). `main` still at `3b4dcb9`. |
| 2026-06-08 | `feat/package-quality` (incl. Wave 3) → `feat/package-quality-wave4-runtimes` | merged (reconcile) | **Wave 4 unblock.** Track merged into the umbrella to carry the merged `@netscript/plugin` surface into the runtimes base. Reconciliation pass: consumer scan re-confirmed vs merged surface; OQ-D closed (4d owns triggers-health). PR #16 flipped from BLOCKED → active. |
| 2026-06-08 | bootstrap `feat/package-quality-wave4-runtimes-4a` off umbrella `ee9f26b` | n/a (fork) | **Wave 4 sub-wave 4a (streams + watchers).** Worktree `.worktrees/wave4-runtimes-4a` + branch forked off the (track-synced) umbrella. Seed run docs committed (`8abdf52`); **Draft PR #18 → umbrella #16**. PR #16 flipped BLOCKED → ACTIVE. Research/Plan & Design pending (separate generator session). |
| 2026-06-08 | bootstrap `feat/package-quality-wave4-runtimes-4b` off umbrella `ee9f26b` | n/a (fork) | **Wave 4 sub-wave 4b (workers) — parallel prep (user-approved).** Worktree `.worktrees/wave4-runtimes-4b` + branch off the umbrella. Supervisor pre-research seed committed (`628f9fb`): core 460 / plugin 143 doc-lint, both dry-run PASS. **Draft PR #19 → umbrella #16**, marked PREPARED/BLOCKED on the 4a pull-forward. Plan-lock deferred. |
| 2026-06-08 | bootstrap `feat/package-quality-wave4-runtimes-4c` off umbrella `ee9f26b` | n/a (fork) | **Wave 4 sub-wave 4c (sagas) — parallel prep (user-approved).** Worktree `.worktrees/wave4-runtimes-4c` + branch off the umbrella. Supervisor pre-research seed committed (`53e18b9`): core 397 / plugin 122 doc-lint, both dry-run PASS, v1-router 716. **Draft PR #20 → umbrella #16**, marked PREPARED/BLOCKED on the 4a+4b pull-forward. Plan-lock deferred. |
| 2026-06-08 | bootstrap `feat/package-quality-wave4-runtimes-4d` off umbrella `ee9f26b` | n/a (fork) | **Wave 4 sub-wave 4d (triggers) — parallel prep (user-approved). Runs LAST.** Worktree `.worktrees/wave4-runtimes-4d` + branch off the umbrella. Supervisor pre-research seed committed (`192f288`): core 211 / plugin 138 doc-lint, both dry-run PASS, both docs/ MISSING, owns `triggers-health` (OQ-D). **Draft PR #21 → umbrella #16**, marked PREPARED/BLOCKED on the 4a+4b+4c pull-forward. Plan-lock deferred. |
| 2026-06-09 | `feat/package-quality-wave4-runtimes-4a` → `feat/package-quality-wave4-runtimes` | merged (`2c24662`, PR #18) | **Sub-wave 4a (streams + watchers) closeout.** Separate-session IMPL-EVAL **PASS**. streams-core A1→A3 (doc-lint 1→0), plugin-streams 0→5 tests + verify-plugin.ts + Aspire `/health` registration (doc-lint 15→0), watchers structural lift + README 224 + docs + tests 18/0 (doc-lint 5→0); all dry-run 0 slow types; LD-8 split-by-origin held; AP-13 debt logged. Umbrella now = base + 4a. Carry: pre-existing `packages/cli` isolated-declarations failure surfaced at umbrella level (Wave 6 owner; 4a S22 row was stale). |
| 2026-06-09 | `feat/package-quality-wave4-runtimes` (incl. 4a) → `feat/package-quality-wave4-runtimes-4b` | merged (`173357c`) | **4b pull-forward (supervisor base-sync).** 4b merged the 4a-carrying umbrella so `workers-core ./streams` re-exports the now-clean A3 `plugin-streams-core`; merge-base now `2c24662`. 4b run docs updated (pull-forward done + cli-carry). 4b base current → generator proceeds to Research/MEASURE-FIRST → Plan & Design. 4c/4d still at `ee9f26b`. |
| 2026-06-09 | `feat/package-quality-wave4-runtimes-4b` → `feat/package-quality-wave4-runtimes` | merged (`1896f854`, PR #19) | **Sub-wave 4b (workers) closeout.** Separate-session **PLAN-EVAL + IMPL-EVAL PASS** (OpenHands `kimi-k2.6`). plugin-workers-core A3 doc-lint 460→0 (`./contracts` fold 17→16, version fix, F-1 split, runtime smoke `ok:true`); plugin-workers A5 doc-lint 143→0, 0→5 tests + verify-plugin `ok:true` + Aspire registration, scheduler split 480→342, dry-run task added; both dry-run 0 slow types; LD-8 split-by-origin held; IMPL-EVAL fix = 3 `z.ZodType<…>` annotations (`8573674`). Umbrella now = base + 4a + 4b. **⚠️ Carry: `deno.lock` drift from the 4b PLAN-EVAL automation (otel 1.40→1.28 + esbuild/preact/loader, +179/−63 vs `2c24662`) rode into the umbrella — NOT reverted; reconcile at Wave 4 closeout.** Pre-existing `packages/cli` isolated-declarations failure still carried (Wave 6 owner). |
| 2026-06-09 | `feat/package-quality-wave4-runtimes` (incl. 4a+4b) → `feat/package-quality-wave4-runtimes-4c` | merged (`128a0a8`) | **4c pull-forward (supervisor base-sync).** 4c merged the 4a+4b-carrying umbrella so `sagas-core ./streams` re-exports the now-A3 `plugin-streams-core` **and** `./integration/workers` re-exports the now-A3 `plugin-workers-core` (both doc-lint 0); merge-base now `1896f854`. 4c run docs updated (pull-forward done + re-baseline + lock-carry + cli-carry; doc commit `21aaef0`). 4c base current → generator proceeds to Research/MEASURE-FIRST → Plan & Design. 4d still at `ee9f26b` (LAST). |
| 2026-06-09 | `feat/package-quality-wave4-runtimes-4c` → `feat/package-quality-wave4-runtimes` | merged (`8264a1c`, PR #20) | **Sub-wave 4c (sagas) closeout.** Separate-session **PLAN-EVAL + IMPL-EVAL** (OpenHands `qwen3.7-max`); PLAN-EVAL 8/8 PASS, IMPL-EVAL `FAIL_FIX`→PASS. Split 4c-core (C1–C14) + 4c-plugin (P1–P13) = 27. plugin-sagas-core A3 doc-lint 397→0 (F-1 splits v1 715/redis 480/list 453; 17/17 tests; F-3 layering CLEAN; AP-1 closed); plugin-sagas A5 doc-lint 122→0, 0→5 tests, README 205, #96 fixed; both dry-run 0 slow types; LD-8 held. IMPL-EVAL blocking = 2 `private-type-ref` (`SagaCorrelation`) from full-barrel `doc --lint` that per-EP runs missed → fixed `d71719c` (1-line re-export) + closed CLI-E2E gaps (e2e:cli full path, worker structural interfaces, IPv4 loopback) → raw re-verify `e2e:cli full` 41/41 incl. triggers-health + database.init PASS; docs `6894c18`. **✅ Lock hygiene held: 4c IMPL-EVAL bot (`d84a36c`) touched only `.llm/tmp/openhands/*` + `evaluate.md`, `deno.lock` untouched.** Umbrella now = base + 4a + 4b + 4c. Inherited carries unchanged (4b lock churn + `packages/cli`/`fresh*`/`telemetry` isolated-decls; Wave 6 owner; reconcile lock at Wave 4 closeout). |
| 2026-06-09 | `feat/package-quality-wave4-runtimes` (incl. 4a+4b+4c) → `feat/package-quality-wave4-runtimes-4d` | merged (`32637a9`) | **4d pull-forward (supervisor base-sync). LAST sub-wave.** 4d merged the 4a+4b+4c-carrying umbrella (`8264a1c`) → merge `32637a9`, **clean (ort, no conflicts)**, working tree clean, **`deno.lock` identical to umbrella** (no new churn). Pushed `192f288..32637a9` (verified via ls-remote). 4d run docs updated (worklog pull-forward-DONE row; drift re-baseline + inherited lock/CLI carries + full-merge-doc-lint lesson from 4c IMPL-EVAL; doc commit `c032682`). 4d base current → generator proceeds to Research/MEASURE-FIRST → Plan & Design. **On 4d merge → umbrella full-wave completeness → umbrella→track `--no-ff` with the deliberate lock reconcile.** |
