# IMPL-EVAL Summary - PR-C alpha-1 legacy/deprecated purge

## Verdict: PASS

### Evaluation Scope
Evaluated PR-C (branch chore/alpha1-legacy-purge at 7d91fbb6) against approved plan for project-wide alpha-1 legacy/deprecated purge + folded hygiene.

### Verification Results

1. Scope Fidelity - PASS
- All planned removals landed (updatePluginRegistry, safeExtend, startWorkersStreamMirror, aspire DependsOn alias)
- Both exclusions UNTOUCHED: packagesAsWorkspaceMembers (5 live call sites intact), workers schedule? (deprecated, deferred to CRON-SUBSYSTEM-DUP)
- Canonical ServiceConfig.dependsOn schema REMAINS; only legacy alias removed

2. Behavior Preservation - PASS
- S2 (only behavior-affecting slice): canonical dependsOn fully covers removed legacy DependsOn merge cases
- New regression test asserts orders.dependsOn === users (ServiceReferences to dependsOn)
- 18/18 CLI adapter tests pass; 18/18 aspire tests pass

3. Static Gates - PASS
- deno check: 784 files, 0 violations
- deno lint: wrapper exit 1 with 0 occurrences (pre-existing wrapper bug on main); raw lint clean
- deno fmt: 8 changed files clean (wrapper anomaly pre-existing on main)
- deno doc --lint: aspire, cli, fresh, workers all pass
- deno task arch:check: exit 0 (only pre-existing WARN/INFO)
- deno task publish:dry-run: Success (all packages resolve exports)

4. scaffold.runtime E2E - PASS WITH CAVEAT
- 10/11 tasks pass; single database.init failure
- Failure = recorded DEBT-2 (pre-existing db-init flake, out-of-scope)
- Does not touch purge surface; GitHub Actions evidence green independently
- Not a PR-C blocker

5. Lock Hygiene - PASS
- deno.lock UNTOUCHED (zero lines in diff)
- Zero new casts introduced

6. Arch-Debt Folding - PASS
- 6 entries appended to arch-debt.md: RUN-ARTIFACT-ARCHIVAL-POLICY, PAGEBUILDER-LEGACY-COMPAT-TREE, FORMPAGEPROPS-PLAYGROUND-MIGRATION, REDIS-LEGACY-VALUE-FALLBACK, DEBT-1 (version timing), DEBT-2 (db-init flake)

### Changes Made
None. This is an evaluation run only; no source code modifications.

### Remaining Risks (Non-Blocking)
1. DEBT-2 db-init flake: Recorded, owned by CLI E2E maintainers. Separate GitHub Actions evidence green.
2. DEBT-1 version bump: Must be issued at JSR-publish prep (one repo-wide breaking bump). Breaking-change note recommended in PR body.
3. Wrapper lint/fmt bug: failedBatches:1 with 0 occurrences reproduces on main. wrapper bug, not a PR-C regression.

### Recommended Action
Merge PR #114 as-is with BREAKING CHANGE note calling out: aspire DependsOn alias removed (use canonical ServiceReferences / dependsOn); 3 Tier-1 compat exports removed. Per DEBT-1, no version bump.
