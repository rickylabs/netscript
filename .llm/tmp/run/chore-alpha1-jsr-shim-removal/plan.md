# PR-B Plan — JSR-readiness deprecation-shim removal (breaking, alpha-1)

> **PLAN-EVAL cycle 1 = `FAIL_PLAN`** (openhands-run-27986503722-1, minimax-M3). Sound for T1, T2,
> and the **saga** half of S3. UNSOUND for the **workers** half of S3: the evaluator proved
> `defineScheduledTrigger().enqueueJob()` is **not** the canonical replacement for
> `defineJob().schedule(cron)` — they are two parallel cron subsystems (separate runtime adapters,
> scaffolds, CLI flags, docs, no cross-package dep). Workers `.schedule()` is a **live documented
> feature with no replacement**, not a removable shim. Version policy (#4) and zero-cast PASSed.
>
> **Cycle-1 response = option (b) [user-confirmed 2026-06-23]:** ship **T1 + T2 + S3a (saga)** in
> PR-B; **defer the workers-side slice (S3b)** entirely. The workers cron subsystem fate
> (merge-into-triggers vs bless-as-feature) is filed as a separate follow-up, NOT this PR. This
> revision is for PLAN-EVAL cycle 2.

- Run id: `chore-jsr-prod-readiness-shim-removal`
- Baseline: branch off `origin/main @ df67038d`.
- Profile: multi-package framework edit. Archetypes touched: ARCHETYPE-2 (cli), ARCHETYPE-3
  (database), ARCHETYPE-5 (plugin-workers-core, plugin-sagas-core), plus fresh + telemetry packages.
  Scope overlay: SCOPE-service (Tier 2/3 change runtime paths).
- Policy context: framework is **alpha-1, zero-backwards-compat**. Removing `@deprecated` shims is
  in-policy, not a debt. PR-B is the JSR-umbrella subset; a separate project-wide purge (PR-C) sweeps
  the rest (inventory in flight). PR-C branches off PR-B's merged main to avoid same-file conflicts.

## Locked decisions
1. **Scope = remove all `@deprecated` back-compat shims in the 6 umbrella packages** (manifest in
   `prb-research.md`), in three slices by risk tier. Each slice is its own commit + gate.
2. **Version policy:** because this is alpha-1 pre-1.0 (0.x), breaking changes bump the **minor**
   per affected package (`0.Y.Z → 0.(Y+1).0`) and the removal is noted in each package CHANGELOG /
   the PR body under a "BREAKING (alpha-1, zero-compat)" heading. No major bump while < 1.0.
3. **Tier 3 = saga only (S3a).** Remove the legacy saga-bus adapter (`saga-bus-legacy.ts`) + the
   opt-in legacy saga runtime branch. Canonical `SagaBusBridge`/native runtime is verified present,
   tested, and covers the surface (PLAN-EVAL §S3a VERIFIED). The only external caller of
   `adapter: 'legacy'` is `plugins/sagas/src/runtime/saga-supervisor.ts:130`, folded onto the native
   default. **The workers `.schedule()` legacy path is DEFERRED out of PR-B** (option b) — it is a
   live feature with no canonical replacement, not a shim; its removal/merge is a separate plan.
4. **No new public surface.** This is removal-only. Any spot that used a deprecated form internally
   is folded onto the canonical (verified 0 external-name consumers; internal option/method users in
   fresh + tests get rewritten). **Correction (PLAN-EVAL):** `packages/cli/.../kernel/adapters/windows/
   runtime/v8-profiles.ts:12,46,73` imports the deprecated alias `V8_HEAP_MB` — S1 folds those 3 lines
   onto `DEFAULT_V8_HEAP_MB` before deleting the alias (the file stays; it is the Windows V8 heap-sizing
   path).

## Slices (PR-B = S1 + S2 + S3a; S3b deferred)
- **S1 — Tier 1 pure aliases (low risk).** First, a **named pre-delete grep gate** (see gate set):
  prove no `templates/`, `docs/`, `plugins/*/templates`, or scaffold output references any S1 symbol.
  Then fold `v8-profiles.ts:12,46,73` (`V8_HEAP_MB` → `DEFAULT_V8_HEAP_MB`) — the file's only live
  alias consumer. Then delete: the 8 cli `windows.ts` aliases, database `buildConnectionString` export
  + barrel line, `mssqlJsonExtension` export + `extensions/mod.ts:8` + `mod.ts:100`, and the whole
  `packages/telemetry/src/context/job.ts` module + any barrel ref. Gate: grep gate + scoped
  check+lint+fmt on the 3 packages, `deno doc --lint` per package, `deno task test` for
  cli/database/telemetry, `arch:check`.
- **S2 — Tier 2 option fields (medium).** Remove mssql `trustedConnection` option + its translation
  branch (fold onto `authentication.type='ntlm'`); remove fresh `serveStaticFiles`/`registerFsRoutes`
  options + their branches (fold onto `staticFiles`/`fsRoutes`); rewrite the affected unit tests to
  the canonical options. Gate: scoped check+lint+fmt + `deno doc --lint` (database + fresh) +
  `deno task test` for database + fresh.
- **S3a — saga legacy subsystem (high, saga only).** Remove `saga-bus-legacy.ts` (5 exports) + the
  opt-in `legacy` runtime branch in `create-saga-runtime.ts:43,79,87` + the `start-sagas.ts:41,69-70`
  re-exports; fold `plugins/sagas/src/runtime/saga-supervisor.ts:130` (`adapter:'legacy'`) onto the
  native default; delete/retarget their tests. Gate: scoped check+lint+fmt + `deno doc --lint` +
  `deno task test` for plugin-sagas-core + `arch:check`.
- **S3b — workers legacy `schedule()` — DEFERRED (option b).** NOT in PR-B. The workers cron path is
  a live, documented, scaffolded feature with no canonical replacement (PLAN-EVAL §S3b). Removing it
  requires first merging the workers-cron and triggers-cron subsystems — a redesign, filed as a
  separate follow-up. Recorded in `drift.md`.

## Gate set (merge-readiness / IMPL-EVAL)
- **S1 pre-delete grep gate (named, blocking):** `rtk grep` each S1 symbol across `templates/`,
  `docs/`, `plugins/*/templates`, and scaffold output. Zero hits required before any deletion. This
  is a gate, not an open item (PLAN-EVAL remediation #5).
- `.llm/tools/run-deno-check.ts` (per affected root, `--ext ts,tsx`, include `--unstable-kv`)
- `.llm/tools/run-deno-lint.ts` + `.llm/tools/run-deno-fmt.ts` (src ts only)
- **`deno doc --lint` per affected package** (publishability / typedoc-drift gate for public-surface
  removal — PLAN-EVAL remediation #4)
- `deno task test` for the affected packages (cli, database, telemetry, fresh, plugin-sagas-core)
- `deno task arch:check`
- `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` (Tier 2/3a touch scaffold-
  relevant runtime packages) — IMPL-EVAL pass only, not per intermediate loop
- `deno task publish:dry-run` (confirms the trimmed public surface still publishes)

## jsr-audit surface scan (PLAN-EVAL remediation #2)
This is **removal-only**, so the published surface strictly **shrinks** — no new slow-types or
JSDoc obligations are introduced; every remaining export already shipped on `main` (post PR-A).
The one residual risk class is a **dangling type/value reference to a removed symbol** (e.g. a type
that re-exported `mssqlJsonExtension` or referenced the `trustedConnection` field). Mitigation is
mechanical and gated: `deno doc --lint` + `run-deno-check.ts` + `publish:dry-run` per affected
package catch any dangling reference at slice time. Affected public surfaces to confirm clean after
removal: cli `windows` constants barrel, database `mod.ts` + `extensions/mod.ts`, telemetry barrel,
fresh `define-fresh-app` options type, sagas `create-saga-runtime`/`start-sagas` exports. No
slow-type risk identified for the removal set. (`JobDefinition`/`JobBuilder`/v1 contract surfaces are
untouched now that S3b is deferred.)

## Zero-cast / lock hygiene
- Removal-only: introduces no casts. The 2-accepted-cast rule is unaffected.
- Do NOT churn root `deno.lock`; no `deno cache --reload`. If removal drops a dependency, leave lock
  reconciliation to a reviewed follow-up, not this PR.

## Debt implications
- None added. This RETIRES debt (legacy shims). Verify no `arch-debt.md` entry references the removed
  symbols as still-present; if one does, update it to "removed in PR-B".

## Open-decision sweep (re-run after cycle-1 fix)
- **Version policy (was open #1):** RESOLVED — PLAN-EVAL §version-policy PASS. Alpha-1 minor bump.
- **Tier-3 scope (was open #2):** RESOLVED — S3a saga retired wholesale (safe); S3b workers DEFERRED
  via user-confirmed option (b). No remaining open decision inside PR-B.
- **Scaffold/docs/template references (was open #3):** RESOLVED into a named, blocking S1 grep gate
  (see gate set) — no longer an open item.
- **No open decisions remain for PR-B.** The deferred workers-cron subsystem merge is a separate plan,
  not a PR-B open item (see `drift.md`).

## Deferred follow-up (out of PR-B)
- **Workers-cron / triggers-cron unification.** `defineJob().schedule(cron)` and
  `defineScheduledTrigger()` are two parallel cron subsystems. Before the workers `@deprecated`
  `.schedule()` path can be removed, the two must be merged onto one canonical adapter (or
  workers-cron explicitly blessed and un-deprecated). Tracked for a dedicated rescope plan; do not
  fold into PR-B or PR-C.
