# Evaluation: PR #1341 — canary budget & generated residue safety (W1-A)

Allowed result values: `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, `FAIL_DEBT`.

**Verdict: PASS**

## Metadata

| Field          | Value                                                            |
| -------------- | ---------------------------------------------------------------- |
| Run ID         | `fix-release-publish-budget-residue--w1a`                        |
| Target         | draft PR #1341 (`fix/release-publish-budget-residue` → `main`)   |
| Archetype      | 6 — CLI / Tooling (release tooling slice under `.llm/tools/`)    |
| Scope overlays | none                                                             |
| Evaluator      | separate-session IMPL-EVAL, 2026-08-07                          |

## Verdict summary

`PASS`. The approved W1-A plan (issues #1312 + #1148) is implemented completely, the recorded
generator gates independently reproduce green, lock/worktree hygiene is intact, no doctrine
violation was introduced, and no architecture debt is required. The PR remains a draft at
`status:impl`, correctly not ready-to-merge, so the close-gate/release CI surface is not yet
applicable and is not required for this IMPL-EVAL pass.

## Process Verification

| Check                                  | Result | Evidence                                                                  |
| -------------------------------------- | ------ | ------------------------------------------------------------------------- |
| PLAN-EVAL before implementation        | N/A    | owner-written proportional waiver recorded in `supervisor.md`, `plan.md`, `worklog.md`, `drift.md` (D-001) |
| Design section exists in worklog       | PASS   | `worklog.md` `## Design` (surface, vocabulary, ports, constants, slices)  |
| Commit slices match design plan        | PASS   | `plan.md` slices S0/S1/S2 ↔ commits `ba862a61`/`d04d7d32`/`a7a01f0a` + `88e432d37` |
| Each slice has a passing gate          | PASS   | S1 tests/wrappers green (reproduced); S2 generator gates green (reproduced) |
| No speculative seams (unused files)    | PASS   | every added file is imported/exercised by tests or invoked from the workflow |
| Constants for finite vocabularies      | PASS   | `'none'|'partial'|'complete'` literal in one place (`report-jsr-publish-outcome.ts`); JSR endpoints from `config/endpoints.ts` |

## Acceptance — #1312 (publish budget / partial publish)

| Box | Requirement | Status | Evidence (independently verified) |
| --- | ----------- | ------ | --------------------------------- |
| 1 | Exact reset semantics recorded in release skill | PASS | `.agents/skills/netscript-release/SKILL.md` — rolling seven-day window; confirmed against official JSR quotas-and-limits docs (matches). |
| 2 | Check remaining budget BEFORE minting; refuse clearly before partial publish | PASS | `.github/workflows/release-canary.yml:43` budget step runs before the minting `release:canary` step (`:64`); `check-jsr-publish-budget.ts` fails closed on missing/malformed quota and on `remaining < requiredAttempts`; workflow contract test asserts ordering. |
| 3 | Detect/report partial publish distinctly from pinned-E2E failure | PASS | `report-jsr-publish-outcome.ts` observes exact-version registry presence post-failure; workflow `Record failed canary pair` keys off `publish-outcome.kind==partial` vs `publish success + e2e failure` vs generic, yielding distinct status descriptions and summary counts. |
| 4 | Cadence policy revised against real budget | PASS | `SKILL.md` cadence response (2026-08-07): coordinated release-candidate canaries, not per-slice; budget is a hard backstop, not a target. |
| 5 | Partial-canary policy decided/document | PASS | `SKILL.md`: preserve tag + published members; same-semver missing-member completion only from byte-identical tag tree; no default yank. |

## Acceptance — #1148 (generated-source residue)

| Box | Requirement | Status | Evidence |
| --- | ----------- | ------ | -------- |
| 1 | Scan covers generated source assets that can embed the release version | PASS | `bump-version.ts` adds `generated.ts`/`*.generated.ts` predicate to `findVersionResidue`. |
| 2 | Seeded stale generated `.ts` fails the scan (negative case) | PASS | `bump-version_test.ts` `findVersionResidue reports stale generated TypeScript...` — reproduced green. |
| 3 | Exclusions intact & documented (`.llm/tmp`, `.llm/runs`, `.data`, `release/baselines`) | PASS | same test asserts those four excluded roots are not flagged; `findVersionResidue` skip list unchanged. |
| 4 | Scan cost measured; scope/rationale recorded | PASS | writer: mean 259ms/max 282ms; independently reproduced sub-second (mean ~142ms here) — same qualitative conclusion (bump stays sub-second); generated-name-only scope recorded in `worklog.md`. |

## Workflow failure semantics

- Budget step is a plain step (no `continue-on-error`): if quota is unreadable or insufficient, the
  job fails before `release:canary` mints a version — no partial publish. Verified in YAML ordering.
- Outcome reporter runs only `if: failure() && steps.publish.outcome == 'failure'` and never writes
  a green pair.
- When publish fails, `steps.dispatch`/`steps.e2e` outputs are absent (steps skipped), so the status
  branch cleanly classifies partial vs "failed before E2E". Logic verified against the YAML.

## Static Gates (independently reproduced)

| Gate             | Command | Result | Evidence |
| ---------------- | ------- | ------ | -------- |
| Focused tests    | `deno test -A --unstable-kv <4 test files>` | PASS | 18 passed, 0 failed (exit 0) |
| Typecheck        | `run-deno-check.ts` over `.llm/tools/release`+`.llm/tools/deps` | PASS | 0 diagnostics, 53 files |
| Lint             | `run-deno-lint.ts` same roots | PASS | 0 diagnostics |
| Format           | `run-deno-fmt.ts` same roots | PASS | 0 findings |
| Publish dry-run  | `publish:dry-run` | PASS* | recorded exit 0 in `worklog.md` (D-003 records the generated-manifest churn; I did not re-run — it mutates manifests) |

## Release / dependency gates (independently reproduced)

| Gate                  | Result | Evidence |
| --------------------- | ------ | -------- |
| `check:publish-assets`| PASS  | exit 0 |
| `release:preflight`   | PASS  | exit 0 (import-attributes / file-url / self-imports all PASS) |
| `publish:readiness`   | PASS  | exit 0; `"ok":true, "version":"0.0.4"`, every composed check PASS |
| `deps:audit --level low` | PASS | exit 0; 26 pre-existing advisory findings (baseline, out of scope) |

## Pool of residual risk (recorded, non-blocking)

- Budget check and real publish remain separate JSR operations; guard is a sufficiency preflight,
  not a transactional lock.
- JSR exposes rolling usage/limit but not per-attempt expiry timestamps; operators wait for aging
  rather than trusting a guessed reset clock.
- All CI checks on the draft head are currently SKIPPED. This is expected for a draft `status:impl`
  PR whose plan de-scoped the full runtime E2E (no scaffold/runtime surface change). CI must be
  green and the close-gate exercised at merge-readiness by the milestone orchestrator — out of scope
  for this IMPL-EVAL certification.

## Lock / worktree hygiene

- `deno.lock` unchanged vs base (`git diff` empty).
- Worktree clean; D-003 dry-run manifest churn (19 `deno.json`) was restored; no source/lockfile
  restored.
- PR head `88e432d37` == local HEAD; no upstream drift.

## Doctrine / debt

- No package/plugin public surface changes; OIDC real publication untouched; no new dependency
  added. No `arch-debt.md` entry required. No `FAIL_DEBT`.
