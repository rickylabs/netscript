# PLAN-EVAL — chore-alpha1-legacy-purge--purge (cycle 2)

- Plan evaluator session: this run (PLAN-EVAL, separate session)
- Run: `chore-alpha1-legacy-purge--purge`
- Surface / archetype: ARCHETYPE-2 (aspire) + ARCHETYPE-3 (cli/fresh) + ARCHETYPE-5 (plugins/workers)
- Scope overlays: SCOPE-service (scaffold + runtime paths in aspire/workers)
- Verdict: `PASS`

## Checklist results

| Plan-Gate item                          | Result      | Evidence / location                                                                                                                                                                                                                  |
| --------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Research present and current            | PASS        | `research.md` exists, baseline re-verified against `abb6e9a4` (post PR-B). Spot-checked: PR-B set already gone; `packagesAsWorkspaceMembers` is live in `deno.json` workspaces; workers `schedule?` still present in `packages/plugin-workers-core/src/domain/job-schedule.ts`. |
| Decisions locked                        | PASS        | Decisions 1–5 cover scope, version policy, Tier-2 precondition, H3 wording-only, and lock hygiene. Each carries rationale.                                                                                                            |
| Open-decision sweep                     | PASS        | No decision flagged "must resolve now" that would force rework if deferred. S2's `ServiceReferences`-completeness check is explicitly scoped as a hard pre-condition with a documented fallback ("leave-the-case + record debt").            |
| Commit slices (< 30, gate + files each) | PASS        | S1–S4, ordered, small, each names gates. S2 isolated as the only behavior-affecting slice.                                                                                                                                           |
| Risk register                           | PASS        | Risks concentrated in S2 (`ServiceReferences` completeness) and gated. Other slices are mechanical.                                                                                                                                  |
| Gate set selected                       | PASS        | `scaffold.runtime` E2E + `deno doc --lint` per affected package + `arch:check` + `publish:dry-run` + scoped check/lint/fmt + named pre-delete grep gate. Adequate for breaking subtractive across aspire+cli+fresh+plugins+scaffold. |
| Deferred scope explicit                 | PASS        | PR-B set excluded (already gone); `packagesAsWorkspaceMembers` excluded (live seam, see `deno.json`); workers `schedule?` deferred to cron-unification.                                                                               |
| jsr-audit surface scan (pkg/plugin)     | PASS (N/A*) | *Public-surface impact is subtractive only; jsr-audit is naturally applied via `deno doc --lint` per affected package + `publish:dry-run` (named in Gates section). The plan does not add new exports so no slow-type/surface risks are introduced. |

## Spot-check evidence (evaluator-run, against current tree)

| Plan claim                                                | Tree evidence                                                                                                                | Result |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------ |
| `updatePluginRegistry` stub has 1 test consumer           | `packages/cli/src/kernel/adapters/plugin/workspace-mutator.ts:255` (stub); `packages/cli/src/kernel/adapters/plugin/workspace-mutator_test.ts:270` (test). | OK     |
| `safeExtend` "0 call consumers"                           | `packages/fresh/src/application/builders/define-page/search-params.ts:76` — `this.safeExtend(...)` inside `PaginationSearchSchema` class. | **MINOR DRIFT** (see Notes) |
| `DependsOn` legacy alias in aspire; `ServiceReferences` canonical | `packages/aspire/src/domain/raw-config.ts` defines both fields; `packages/config/src/domain/schemas/service-schema.ts:17` + `config-section-types.ts:127` carry LIVE `dependsOn` on canonical `ServiceConfig` — keep. `packages/aspire/src/application/deploy-config-resolvers.ts:133` cascade: `dependsOn: appSvc?.DependsOn ?? nsSvc.dependsOn`. | OK (Tier-2 removal is correctly scoped to aspire; canonical `dependsOn` untouched) |
| `startWorkersStreamMirror` wrapper + 1 consumer           | `plugins/workers/streams/producer.ts:78` (definition) + `plugins/workers/streams/server.ts` (re-export); `plugins/workers/services/src/main.ts` (1 call site). | **MINOR DRIFT** (see Notes) |
| H1: 109 tracked files under `.llm/tmp/init-json-smoke/`   | `git ls-files .llm/tmp/init-json-smoke/` enumerates tracked artifacts; `init-json_test.ts` writes there; `.gitignore` currently does NOT exclude the dir. | OK     |
| H2: 4 zero-ref scratch files                              | `.llm/tmp/{measure-doclint.ts,measure-wave5-rebaseline.ts,eval-pr97-e2e-runtime.log,doc-lint-fresh.json,doc-lint-fresh-rev2.json}` exist; 0 code refs (only mentions in run logs/handover notes). | OK     |
| H3: 5 query hooks + `FreshAppTelemetryOptions` carry the misleading "Backward-compatible alias" docstring | `packages/fresh/src/application/query/hooks.ts:142,149,156,163,174` (5 hooks); `packages/fresh/src/runtime/server/define-fresh-app.ts:14` (`FreshAppTelemetryOptions`). | OK     |
| Version lockstep `0.0.1-alpha.0`                          | `deno.json` has single `0.0.1-alpha.0` workspace version; per-package bump would break lockstep. DEBT-1 named. | OK     |
| Slice decomposition S1–S4                                | Each ≤ small; S2 isolated as the only behavior-affecting slice; rollback = `git revert` per slice. | OK     |

## Open-decision sweep (evaluator-run)

None found that would force rework if deferred. The Tier-2 completeness check is correctly scoped as a hard precondition inside S2 with a documented "leave + record debt" fallback.

## Verdict

`PASS`

Implementation may begin. See Notes for two minor wording-only drift items to fix during the implementer's slice (they do not change the gate verdict).

## Notes (non-blocking, for implementer)

1. **S1 / `safeExtend` — consumer count is wrong (1, not 0).**
   The class `PaginationSearchSchema` itself calls `this.safeExtend(...)` at
   `packages/fresh/src/application/builders/define-page/search-params.ts:76`. The removal is still
   correct (in-class caller can be rewritten to `this.extend(shape)`), but the "0 consumers"
   framing is inaccurate. Recommend updating the plan S1 bullet to "1 in-class caller; rewrite
   to `this.extend(shape)`" before/during S1 to keep the worklog honest.

2. **S1 / `startWorkersStreamMirror` — "canonical name" is the function itself.**
   The plan says "rename the single consumer to the canonical name, drop the wrapper." The
   function name `startWorkersStreamMirror` IS the only name — there is no separate canonical
   alias (verified via `grep -rn 'startStreamMirror\|startWorkerStreamMirror\|startMirror'`
   over `packages/`/`plugins/`/`workers/`). The real action is: delete the function in
   `producer.ts` + the re-export in `server.ts`, and either inline the call at
   `services/src/main.ts` (it is `state.setMutationHook(createStreamMutationHook())`) or
   move `createStreamMutationHook` to the consumer's import path. The `docs/site/reference/workers/index.md`
   H4 update still applies. Recommend rewording the S1 bullet before/during S1.

3. **S2 / `dependsOn` lives on TWO surfaces.** The plan correctly limits Tier-2 removal to
   `packages/aspire/...` (`DependsOn` legacy alias). The canonical `dependsOn` field on
   `ServiceConfig` (`packages/config/src/domain/schemas/service-schema.ts:17` +
   `config-section-types.ts:127`) is LIVE and must remain — it is consumed by
   `deploy-config-resolvers.ts:133`, `manifest.ts` (topological sort), and
   `servy-config.ts` (serviceDependencies). The plan correctly avoids touching the canonical
   surface; flagging here so IMPL-EVAL can spot-check that scope discipline held.