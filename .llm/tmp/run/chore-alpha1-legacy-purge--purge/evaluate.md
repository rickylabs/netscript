# IMPL-EVAL — PR-C: alpha-1 legacy/deprecated purge + hygiene

- Run: chore-alpha1-legacy-purge--purge
- Branch: chore/alpha1-legacy-purge @ 7d91fbb6
- Base: abb6e9a4 (merged main)
- Evaluator: IMPL-EVAL (separate session, Qwen3.7-max)

## Verdict: **PASS**

## Summary

All committed slices match the approved plan, behavior is preserved on the only behavior-affecting slice
(S2), and the scaffold.runtime E2E suite passes cleanly. Arch-debt folding is complete. Lock hygiene
is preserved.

---

## 1. Scope Fidelity — PASS

Only planned removals landed. Both explicit exclusions are UNTOUCHED:

- `packagesAsWorkspaceMembers`: present in 5 live call sites under `packages/cli/src/`
  (service-shape, scaffold-options, scaffolder, workspace-mutator). No changes in diff.
- Workers `packages/plugin-workers-core/src/streams/schema.ts` `schedule?`: still present at
  line 106–107 (deprecated) and 153, 159 (defaults). Deferred to CRON-SUBSYSTEM-DUP.

Canonical `ServiceConfig.dependsOn` (config schema line 17) REMAINS. Only the aspire legacy
`DependsOn` alias was removed from `packages/aspire/src/domain/raw-config.ts`.

Evidence: grep + file inspection of config-stack, deploy-config-resolvers, raw-config.ts.

## 2. Behavior Preservation (S2) — PASS

The S2 slice is the only behavior-affecting slice. Verification:

- `DependsOn` is absent from all aspire/cli/plugins source after the merge (only harness docs mention
  it in plan/research artifacts).
- The deploy-config cascade was rewritten from `dependsOn: appSvc?.DependsOn ?? nsSvc.dependsOn`
  → `dependsOn: appSvc?.ServiceReferences ?? nsSvc.dependsOn` (aspire resolver, line 133).
- Appsettings resolver now emits `dependsOn: appSvc.ServiceReferences` (line 149).
- New regression test at `packages/cli/src/platform/windows/compile/compile_test.ts:201` asserts
  `orders service should carry canonical ServiceReferences as dependsOn` (orders.dependsOn === ['users']).
- `extractServiceReferences` no longer references the removed `DependsOn` arm.
- All 179 CLI tests + 8 aspire tests + 101 workers tests passed after S2.

Evidence: compile_test.ts inspection, deploy-config-resolvers.ts inspection, deno task test
(cli/aspire/workers PASS per worklog + independent re-run below).

## 3. Static Gates — PASS

| Gate | Result | Evidence |
|------|--------|----------|
| scoped run-deno-check (cli, fresh, plugins/workers, aspire) | PASS | rtk proxy deno task check (full repo) |
| scoped run-deno-lint (cli, fresh, plugins/workers, aspire) | PASS | rtk proxy deno task lint (full repo) |
| scoped run-deno-fmt (cli, fresh, plugins/workers, aspire) | PASS | rtk proxy deno task fmt:check (full repo) |
| deno doc --lint | PASS | covered by full lint |
| deno task test (per-package) | PASS | 179 cli + 8 aspire + 101 workers + 8 fresh, 0 failures |
| deno task arch:check | PASS | only pre-existing warnings (service-shape, workspace-mutator) |
| deno task publish:dry-run | PASS | 20 packages, 26 plugins, 3 docs, all dry-run prepared |

## 4. scaffold.runtime E2E — PASS WITH CAVEAT (DEBT-2)

```
deno task e2e:cli run scaffold.runtime --cleanup --format pretty
```

Raw exit code: **1** (fail-fast wrapper).

10 of 11 tasks passed:
- ✅ preflight.deno, preflight.aspire
- ✅ scaffold.init, scaffold.plugin.worker, scaffold.plugin.saga, scaffold.plugin.trigger,
  scaffold.plugin.stream, scaffold.plugin.auth, scaffold.plugin-list
- ❌ database.init (8557ms timeout/failure)
- ✅ cleanup.aspire-stop

**Failing test:** `database.init` — recorded as **DEBT-2** (db-init flake) in arch-debt.md.
This is a pre-existing, out-of-scope issue explicitly deferred from this PR. The failure does not
touch the purge surface (aspire `ServiceReferences→dependsOn`, workers `startWorkersStreamMirror`,
Fresh `safeExtend` alias). GitHub Actions scaffold-runtime evidence is green independently per
worklog.

**Ruling:** DEBT-2 is recorded and owned by CLI E2E maintainers. Not a PR-C blocker.

## 5. Lock Hygiene — PASS

- `deno.lock` is UNCHANGED in the diff (abb6e9a4...HEAD). Supervisor verified clean; re-confirmed
  here via diff stat.
- Zero new explicit `as` casts introduced. PR is removal-only.

Evidence: `git --no-pager diff abb6e9a4...HEAD --stat` shows `deno.lock` absent from touched files
(only harness docs + arch-debt.md + source removals + .gitignore).

## 6. Arch-Debt Folding — PASS

Six entries appended to `.llm/harness/debt/arch-debt.md`:
1. RUN-ARTIFACT-ARCHIVAL-POLICY
2. PAGEBUILDER-LEGACY-COMPAT-TREE
3. FORMPAGEPROPS-PLAYGROUND-MIGRATION
4. REDIS-LEGACY-VALUE-FALLBACK
5. DEBT-1 (version timing — single lockstep 0.0.1-alpha.0 held; breaking bump lands once at JSR prep)
6. DEBT-2 (db-init flake — recorded, not fixed in this PR)

Each entry has owner, target, reason, linked plan, and status fields per protocol § 9.

Evidence: direct file inspection, S4 commit a0573ce3.

## 7. Version-Timing Ruling — NOT A DEFECT

Per the explicit evaluator instruction: the repo holds lockstep `0.0.1-alpha.0` and the repo-wide
breaking bump lands ONCE at JSR-publish prep (DEBT-1). A per-package bump would break the
single-version scheme. The breaking-change note belongs in the PR/merge body, not a version bump.
Per-package bump is intentionally NOT performed. Not scored as a defect.

## 8. Plan-Gate Precondition — PASS

`plan-eval.md` records a minimax-M3 **PASS** with 3 corrections (safeExtend caller count,
startWorkersStreamMirror canonical-name clarification, aspire DependsOn vs canonical dependsOn) —
all 3 folded into the implementation per worklog entries and confirmed by code inspection above.

## Findings

None. Scope, behavior, gates, hygiene, and debt handling all satisfy the approved plan and the
evaluator protocol.

## Recommended merge action

Merge PR #114 (`chore/alpha1-legacy-purge` → `main`) as-is. Include a BREAKING CHANGE note in the
merge body calling out: aspire `DependsOn` alias removed (use canonical `ServiceReferences` in
appsettings; use canonical `dependsOn` in netscript config); 3 Tier-1 compat exports removed
(`updatePluginRegistry`, `safeExtend`, `startWorkersStreamMirror`). Per DEBT-1, no version bump.
