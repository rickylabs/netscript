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
- **Baseline re-audit run first** (`tools/fitness/release-readiness.ts`), delta vs the 2026-05 inventory logged in `drift.md`.

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
| Status | `active` — umbrella branch + worktree + Draft PR being bootstrapped (2026-06-08); Research/Plan & Design pending (separate sessions). |
| Merge commit | — |

### Pre-conditions

- Wave 2 `merged`. ✅ (`d4f971e`)

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
| Status | `prepared` — umbrella branch + worktree + pre-research + Draft **PR #16** (2026-06-08); **PLAN-LOCK blocked on Wave 3**. Prepared in parallel with Wave 3 (user-approved). |
| Merge commit | — |

### Pre-conditions

- Wave 3 `merged`. **(Umbrella + research were prepared in parallel ahead of this; only plan-lock + the triggers sub-wave depend on Wave 3.)**

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
- **Next gate:** after Wave 3 merges → merge track into umbrella → extra Claude
  reconciliation pass (`@netscript/plugin` consumer scan vs merged surface + OQ-D) → then
  open 4a.

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
| Archetype(s) | A4 — dsl/app |
| Status | `planned` |
| Merge commit | — |

### Pre-conditions

- Wave 4 `merged`.

### Phase 0 reading

- Nested `PLAN.md` § 4 (Wave 5) + `evaluate_{sdk,service,fresh,fresh-ui}.md` + matching `plan_*`

### Surfaces touched

- `packages/{sdk,service,fresh,fresh-ui}/`

### Success criteria

- Each unit: 0 slow-types, `doc --lint`, README/`docs`, archetype matrix. `@netscript/fresh` (≈11.7k LOC) is the long pole — split per nested `plan_fresh.md`.

### Notes

- `fresh` is the largest restructure on the board; budget accordingly. Migrate route/handler code that belongs to `service` per the nested plan.

## Wave 6 — Tooling

| Field | Value |
|-------|-------|
| Group branch | `feat/package-quality-wave6-cli` |
| Nested run ID | `feat-package-quality-wave6-cli--<suffix>` |
| Units | `@netscript/cli` |
| Archetype(s) | A6 — cli-tooling |
| Status | `planned` |
| Merge commit | — |

### Pre-conditions

- Waves 0–5 `merged` (CLI references every other unit at `0.0.1-alpha.0`).

### Phase 0 reading

- Nested `evaluate_cli.md` + `plan_cli.md`; nested PLAN § 6 (the CLI quality bar) + § 9 (CLI dry-run false positive)

### Surfaces touched

- `packages/cli/` (and `packages/cli/e2e/` as the workspace member, non-publishable)

### Success criteria

- `@netscript/cli`: 0 slow-types (watch the documented `--dry-run` false positive in nested PLAN § 9), `doc --lint`, README/`docs`, archetype A6 matrix. It is also the docs-site source of truth for S5.

### Notes

- Shipped last by design. Do not bump scaffold templates to `jsr:` refs here — that is S3 (publish) territory; S1 stops at publish-clean.

---

## Summary Table

| Wave | Status | Depends on | Units | Merge commit |
|------|--------|-----------|-------|--------------|
| 0 — Foundation | `merged` | none | shared | `eb8ae44` (PR #3) |
| 0b — Harness reinforcement (inserted) | `merged` | 0 | none (harness + `.agents/`) | `82ad2a2`,`d5d8e5f`,`76fbeb7` |
| 1 — Contracts & schemas | `merged` | 0 | runtime-config, config, contracts | `4c57867` (PR #7) |
| 2 — Integration adapters | `merged` (2a #10; 2b #12; 2c #13; umbrella #11 → track) | 1 | logger, telemetry, aspire, kv, database, prisma-adapter-mysql, queue, cron (split 2a/2b/2c) | `d4f971e` (PR #11) |
| 3 — Plugin runner | `active` (umbrella + sub-branch bootstrapping) | 2 | plugin | — |
| 4 — Runtimes & plugins | `prepared` (umbrella PR #16, blocked on 3) | 3 | plugin-{streams,workers,sagas,triggers}-core, watchers, plugin-{streams,workers,sagas,triggers} | — |
| 5 — Application surfaces | `planned` | 4 | sdk, service, fresh, fresh-ui | — |
| 6 — Tooling | `planned` | 0–5 | cli | — |

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
