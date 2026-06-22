# PR-B Plan — JSR-readiness deprecation-shim removal (breaking, alpha-1)

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
3. **Tier 3 retires the legacy paths wholesale**, not just the public entrypoint — the legacy cron
   `schedule()` plumbing and the legacy saga-bus adapter+runtime are removed, since alpha-1 keeps no
   legacy path. PRE-CONDITION: Codex must first prove the canonical replacement
   (`defineScheduledTrigger().enqueueJob()` for scheduling; `SagaBusBridge`/native for sagas) fully
   covers the functionality + has green tests. If a canonical gap is found, that slice STOPS and is
   recorded in `drift.md` for a rescope decision — do not delete a path with no working replacement.
4. **No new public surface.** This is removal-only. Any spot that used a deprecated form internally
   is folded onto the canonical (verified 0 external-name consumers; internal option/method users in
   fresh + tests get rewritten).

## Slices
- **S1 — Tier 1 pure aliases (low risk).** Delete the 8 cli `windows.ts` aliases, database
  `buildConnectionString` export + barrel line, `mssqlJsonExtension` export + `extensions/mod.ts:8` +
  `mod.ts:100`, and the whole `packages/telemetry/src/context/job.ts` module + any barrel ref. Gate:
  scoped check+lint+fmt on the 3 packages, `deno task test` for cli/database/telemetry, `arch:check`.
- **S2 — Tier 2 option fields (medium).** Remove mssql `trustedConnection` option + its translation
  branch (fold onto `authentication.type='ntlm'`); remove fresh `serveStaticFiles`/`registerFsRoutes`
  options + their branches (fold onto `staticFiles`/`fsRoutes`); rewrite the affected unit tests to
  the canonical options. Gate: scoped check+lint+fmt + `deno task test` for database + fresh.
- **S3 — Tier 3 legacy subsystems (high).** After the §3 pre-condition proof: remove workers legacy
  `schedule()` method + legacy schedule field plumbing across builder/config/domain/contracts (keep
  the canonical scheduled-trigger path intact); remove `saga-bus-legacy.ts` + the opt-in legacy saga
  runtime branch in `create-saga-runtime.ts`; delete/retarget their tests. Gate: scoped
  check+lint+fmt + `deno task test` for plugin-workers-core + plugin-sagas-core + `arch:check`.

## Gate set (merge-readiness / IMPL-EVAL)
- `.llm/tools/run-deno-check.ts` (per affected root, `--ext ts,tsx`, include `--unstable-kv`)
- `.llm/tools/run-deno-lint.ts` + `.llm/tools/run-deno-fmt.ts` (src ts only)
- `deno task test` for the 6 affected packages
- `deno task arch:check`
- `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` (Tier 2/3 touch scaffold-
  relevant runtime packages) — IMPL-EVAL pass only, not per intermediate loop
- `deno task publish:dry-run` (confirms the trimmed public surface still publishes)

## Zero-cast / lock hygiene
- Removal-only: introduces no casts. The 2-accepted-cast rule is unaffected.
- Do NOT churn root `deno.lock`; no `deno cache --reload`. If removal drops a dependency, leave lock
  reconciliation to a reviewed follow-up, not this PR.

## Debt implications
- None added. This RETIRES debt (legacy shims). Verify no `arch-debt.md` entry references the removed
  symbols as still-present; if one does, update it to "removed in PR-B".

## Open items handed to PLAN-EVAL
1. Confirm the alpha-1 minor-bump version policy (decision #2) is correct vs a coordinated bump.
2. Confirm Tier-3 wholesale retirement (decision #3) is in-scope vs entrypoint-only.
3. Confirm scaffold templates / tutorials / docs code samples do not reference any removed symbol
   (Codex must grep `templates/`, `docs/`, `plugins/*/templates` before S1).
