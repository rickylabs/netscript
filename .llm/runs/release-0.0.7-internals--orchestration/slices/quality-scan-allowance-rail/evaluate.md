# Evaluation: quality-scan-allowance-rail (PR #1653)

Formal IMPL-EVAL. Separate session from the implementer (Codex GPT-5.6 Sol · high). No lane
self-certified. Every gate below was executed in this session; receipts were used only to compare
against independently produced results, never as the verdict source.

## Metadata

| Field             | Value                                                                       |
| ----------------- | --------------------------------------------------------------------------- |
| Run ID            | `release-0.0.7-internals--orchestration/slices/quality-scan-allowance-rail` |
| Target            | PR #1653, branch `chore/quality-scan-allowance-rail`                        |
| Evaluated SHA     | `2d5e4f5ae15345d80c21c8c4da03f1667d3889bb`                                  |
| Binding impl head | `71c26445838eb5bca654607947ad247cbea78273`                                  |
| Immutable base    | `01e0960494c95ce56eb35892c211a095eb13e6ed`                                  |
| Archetype         | 6 — repo tooling (scanner), with CLI/plugin publish-surface peers           |
| Scope overlays    | docs (docs/site format + accuracy), frontend (fresh-browser)                |
| Evaluator         | Claude Opus 5 · effort `high` · Remote Control · 2026-08-15                 |

### Evaluator identity

| Field             | Value                                                                                                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Session ID        | `430d5f91-a073-4f4f-991a-8a7eefc7ddb3`                                                                                                               |
| `bridgeSessionId` | `cse_01NFwTgbof8vAYdg9wex15fM`                                                                                                                       |
| PID               | `2720067`                                                                                                                                            |
| cwd               | `/home/codex/repos/netscript-007-quality-rail`                                                                                                       |
| Requested route   | native Claude Opus 5, effort `high`, Remote Control enabled                                                                                          |
| Observed route    | `respawnFlags` = `--effort high --permission-mode bypassPermissions --remote-control --name "NetScript 0.0.7 #1653 IMPL-EVAL" --model claude-opus-5` |
| Route source      | `~/.claude/jobs/430d5f91/state.json`                                                                                                                 |
| Opposite family   | Yes — implementer was Codex GPT-5.6 Sol · high                                                                                                       |

### Immutable-target reconciliation

Re-derived independently at evaluation start and again at the end; unchanged throughout.

| Source                                      | Value                                      |
| ------------------------------------------- | ------------------------------------------ |
| `git rev-parse HEAD`                        | `2d5e4f5ae15345d80c21c8c4da03f1667d3889bb` |
| `git ls-remote origin chore/quality-scan-…` | `2d5e4f5ae15345d80c21c8c4da03f1667d3889bb` |
| `gh pr view 1653 --json headRefOid`         | `2d5e4f5ae15345d80c21c8c4da03f1667d3889bb` |
| Briefed target                              | `2d5e4f5ae15345d80c21c8c4da03f1667d3889bb` |
| Worktree                                    | clean (`git status --porcelain` empty)     |

All four equal — evaluation proceeded. Both mandated SHAs verified: `71c264458` is the binding
implementation head, `2d5e4f5ae` is its supervisor sign-off child. Final binding receipts attest
`71c264458`; no self-referencing receipt was demanded.

## Process Verification

| Check                                  | Result | Evidence                                                                                                               |
| -------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | `PASS` | `plan-eval.md` cycle 2 formal `PASS` at `09dfb092d`, committed `c694cfb31`, before first impl commit `586b55135`       |
| Design section exists in worklog       | `PASS` | `worklog.md:12` `## Design`                                                                                            |
| Commit slices match design plan        | `PASS` | 4 slices in plan order: S1 `586b55135`+`e39970fd3`, S2 `f869a5bfe`, S3 `2977c8333`, S4 `71c264458`+`e3a5a2d28`         |
| Supervisor sign-off precedes successor | `PASS` | S1 `3c3985289` → S2 `f869a5bfe`; S2 `f9acdb426` → S3 `2977c8333`; S3 `83f7a1847` → S4 `71c264458`; S4 `2d5e4f5ae` last |
| No lane self-certified                 | `PASS` | Tier-A review comments precede each sign-off; IMPL-EVAL is this separate opposite-family session                       |
| Each slice has a passing gate          | `PASS` | 52 receipts; every `gitHead` equals `actualGitHead` and is reachable from the branch head                              |
| Agent brief carries `## SKILL`         | `PASS` | `implement.md` contains one `## SKILL` chapter (protocol rule 13)                                                      |
| No speculative seams (unused files)    | `PASS` | 9 changed non-run-artifact paths, all reachable and exercised by the focused suite                                     |
| Constants for finite vocabularies      | `PASS` | `ALLOWANCE_RECORD`, `ISSUE_REFERENCE`, `ALLOWANCE_OWNER_REPOSITORY`, `DEFAULT_ROOTS`, `GENERATED_OR_VENDOR_DIRS`       |

## Evidence Contract — every proving gate executed in this session

| Gate                  | Command (this session)                                                         | Exit | Result          | Evidence                                                              |
| --------------------- | ------------------------------------------------------------------------------ | ---- | --------------- | --------------------------------------------------------------------- |
| `check`               | `run-deno-check.ts --root packages --root plugins --ext ts,tsx --exclude …`    | 0    | `PASS`          | `filesSelected: 2919`, `batches: 25`, `failedBatches: 0`              |
| `test`                | `deno task test`                                                               | 0    | `PASS`          | 4109 passed / 0 failed / 19 ignored / 4128 total — matches receipt    |
| `quality-scan`        | `deno task quality:scan`                                                       | 0    | `PASS`          | `ok:true`, `allowCount:7`, `findings:[]`, `allowanceFailures:[]`      |
| `quality-scan-repo`   | `deno task quality:scan:repo`                                                  | 0    | `PASS`          | `ok:true`, `allowCount:7`, `findings:[]`, `allowanceFailures:[]`      |
| `allowance-budget`    | `check-allowance-budget-diff.ts 01e096049 2d5e4f5ae --pretty`                  | 0    | `PASS`          | `ok:true`, `increases: []`, `issueLinked:true` at the branch head     |
| `quality-job`         | `deno task ci:quality`                                                         | 0    | `PASS`          | full composite green; `deps:check` warnings only                      |
| `arch-check`          | `deno task arch:check`                                                         | 0    | `PASS`          | `FAIL=0` on every root; warnings only, none new                       |
| `publish-dry-run`     | `deno task publish:dry-run --member packages/cli`                              | 0    | `PASS`          | `Success Dry run complete`, no publication                            |
| `publish-dry-run`     | `deno task publish:dry-run --member plugins/workers`                           | 0    | `PASS`          | `Success Dry run complete`, no publication                            |
| `doc:lint` (CLI)      | `deno task doc:lint --root packages/cli --pretty`                              | 0    | `PASS`          | `combinedTotal: 0` across 3 export targets                            |
| `doc:lint` (workers)  | `deno task doc:lint --root plugins/workers --pretty`                           | 1    | `DEBT_ACCEPTED` | exactly 20 `private-type-ref`, 0 `missing-jsdoc`, 0 other, 13 targets |
| `generated-asset`     | `deno task gen:assets-barrel` then `git status --porcelain`                    | 0    | `PASS`          | regeneration produced **no** tracked diff — asset is fresh            |
| `fresh-browser`       | `deno task test:browser` (cwd `packages/fresh`)                                | 0    | `PASS`          | 2 passed / 0 failed                                                   |
| `docs-source-format`  | `deno task check:source-format` (cwd `docs/site`)                              | 0    | `PASS`          | `Docs source format: OK`                                              |
| `docs-source-format`  | `deno task test:source-format` (cwd `docs/site`)                               | 0    | `PASS`          | 6 passed / 0 failed                                                   |
| `docs-accuracy`       | `deno task docs:accuracy`                                                      | 0    | `PASS`          | `docs accuracy: PASS (196 published source pages, 91/91 commands)`    |
| focused scanner suite | `run-deno-test.ts -- --allow-all .llm/tools/quality/scan-code-quality_test.ts` | 0    | `PASS`          | 25 passed / 0 failed                                                  |
| scoped lint           | `run-deno-lint.ts` over the 5 changed source files                             | 0    | `PASS`          | `filesSelected: 5`, `totalOccurrences: 0`                             |
| scoped fmt            | `run-deno-fmt.ts --root … --ext ts,tsx`                                        | 0    | `PASS`          | `filesSelected: 289`, `findings: 0`                                   |

No gate in the binding contract was left unrun. The shared expensive-gate lease was **not**
acquired: no `e2e:cli`, no `scaffold.runtime`, no runtime smoke — those remain coordinator-scheduled
and are recorded here as `N/A (not in evaluator scope)`, not as passes.

## Baseline movement — verified, not inherited

`origin/main` is at `0b3ed5d5a6aea451318f120988c25dfa3993a2ab`, past the dispatch baseline.

| Check                                               | Result | Evidence                                                                       |
| --------------------------------------------------- | ------ | ------------------------------------------------------------------------------ |
| `git merge-tree --write-tree origin/main 2d5e4f5ae` | `PASS` | exit 0 — clean merge, no conflict                                              |
| `quality-allow` additions on main side              | `PASS` | 0 additions across `packages`, `plugins`, `docs/site`                          |
| **Post-merge `quality:scan`**                       | `PASS` | real merge performed in a scratch worktree → `ok:true`, `allowCount:7`, exit 0 |
| **Post-merge `quality:scan:repo`**                  | `PASS` | same merged tree → `ok:true`, `allowCount:7`, exit 0                           |

Main did touch `packages/cli/src/public/features/plugins/auth/auth-plugin-command.ts`, inside the
`quality:scan` root, so the merge was materialized and the rail re-run against it rather than
inferred from a file-overlap argument. The seven-record budget holds post-merge; the rail does not
go red on main.

## Consumer portability (obligation 2) — independently re-derived

The supervisor's D-12 correction is confirmed correct, derived here from scratch rather than
inherited.

| Check                                             | Result | Evidence                                                                                                                             |
| ------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Scanner source keeps inline specifier             | `PASS` | `.llm/tools/quality/scan-code-quality.ts:1` → `from 'jsr:@std/path@^1'`                                                              |
| Generated asset carries the same specifier        | `PASS` | 2 × `jsr:@std/path@^1`, **0** bare `from '@std/path'` in `agent-tools.generated.ts`                                                  |
| **Installed bundle resolves from a foreign CWD**  | `PASS` | extracted `EMBEDDED_AGENT_TOOL_FILES` (12 files) to a scratch dir, ran the scanner from an unrelated CWD with no import map → exit 0 |
| Negative control — bare specifier genuinely fails | `PASS` | same bundle, specifier rewritten to `@std/path` → `error: Import "@std/path" not a dependency`, exit 1                               |

The bare form is not merely stylistically wrong; it is unresolvable from a consumer CWD. Restoring
`jsr:@std/path@^1` was the correct minimum repair.

## Scanner attribution and deduplication (obligation 3)

| Check                                             | Result | Evidence                                                                                                                                                                                                  |
| ------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Seven records are exactly the measured population | `PASS` | live scan enumerates 7: `public-command-dependencies.ts:363`, `public-api.ts:135/136/158/275/276`, `producer.ts:52`                                                                                       |
| No population was hidden to reach seven           | `PASS` | the only other `quality-allow` markers are 5 in `packages/sdk/tests/type-fixtures/*_type.ts`; `isTypeFixture()` is **byte-identical at the immutable base**, and the base scan already measured exactly 7 |
| Every record attributable to #1276                | `PASS` | all 7 parse to `issue: 1276` with distinct specific reasons                                                                                                                                               |
| #1276 is open and milestoned                      | `PASS` | live: `state: OPEN`, `milestone: "Backlog / Triage"`                                                                                                                                                      |
| `Backlog / Triage` accepted                       | `PASS` | live scan exits 0 with that milestone; test `allowance resolver accepts Backlog / Triage owners`                                                                                                          |
| Issue lookups deduplicated                        | `PASS` | source `[...new Set(allowances.map(a => a.issue))]` (line 971); test asserts `assertEquals(calls, [1276])` for 2 allowances                                                                               |
| Fails closed **offline**                          | `PASS` | run without `--allow-net` → exit 1, `ok:false`, all 7 `owner-unavailable` with an actionable message                                                                                                      |
| Fails closed at anonymous rate limit              | `PASS` | test `GitHub resolver fails closed offline and at the anonymous rate limit`                                                                                                                               |
| Fork without a token                              | `PASS` | test `GitHub resolver supports tokenless forks against the fixed public owner repository`                                                                                                                 |
| Closed / unmilestoned / malformed owners          | `PASS` | tests `allowance owners fail closed when closed, unmilestoned, or unavailable` and `allowance records require one linked issue and one specific reason`                                                   |
| Overflow                                          | `PASS` | test `scanner CLI fails when an allowance fixture exceeds --max-allow`                                                                                                                                    |

Cast count is unchanged from base (`public-api.ts`: 5 → 5). The diff's `+`/`-` pairs show only the
comment text gaining the `#1276 —` owner prefix; **no new cast was introduced** to create a record.

## Workers baseline honesty (obligation 4)

| Check                                | Result          | Evidence                                                                                                                                                            |
| ------------------------------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exact 20 `private-type-ref`          | `PASS`          | executed: `combinedPrivateTypeRef: 20`, `combinedTotal: 20`                                                                                                         |
| Zero other diagnostic classes        | `PASS`          | `combinedMissingJSDoc: 0`, `combinedOther: 0`                                                                                                                       |
| All 13 export targets audited        | `PASS`          | `entrypointExitCodes` lists exactly 13 targets                                                                                                                      |
| Reported as FAIL, never green        | `PASS`          | `combinedExitCode: 1`; PR comment states "it is **not green**"                                                                                                      |
| Nothing hidden or reclassified       | `PASS`          | no diagnostic-class suppression in the diff; the branch does not touch workers export surfaces beyond the one registered allowance line                             |
| Debt entry exists and is well-formed | `DEBT_ACCEPTED` | `arch-debt.md` `workers-private-type-ref-1655` — reason, owner (#1655, 0.0.8), target, linked plan, created, status, gate, evidence all present, strict no-increase |

## Receipt provenance (obligation 5)

| Check                                             | Result | Evidence                                                                                                                                                    |
| ------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Every receipt's `gitHead` == `actualGitHead`      | `PASS` | all 52 receipts                                                                                                                                             |
| Every attested head reachable from branch         | `PASS` | `01e096049`, `c694cfb31`, `586b55135`, `3c3985289`, `f9acdb426`, `71c264458`, `83f7a1847` — all `git merge-base --is-ancestor` true                         |
| No **binding** receipt names a non-history object | `PASS` | the stash object `3136358e4` appears only in the superseded `slice-1/allowance-budget.json` **argv**; `git merge-base --is-ancestor` false, confirming D-11 |
| Superseding receipt is history-bound              | `PASS` | `slice-1/allowance-budget-landed-head.json` compares `01e096049..586b55135`, exit 0, identical stdout sha256 to the superseded probe                        |
| Red receipts retained honestly                    | `PASS` | `slice-4/test.json` exit 1 at `83f7a1847` (the D-12 regression) retained alongside binding `test-binding.json` exit 0 at `71c264458`                        |

## Scope and lock integrity (obligation 7)

Nine changed non-run-artifact paths, each authorized by the plan's coordinator-amended surface list
(§ "Coordinator-resolved decisions" 2 / drift D-7). No tenth surface appeared.

| # | Path                                                                   | Authorized by            |
| - | ---------------------------------------------------------------------- | ------------------------ |
| 1 | `.llm/tools/quality/scan-code-quality.ts`                              | plan Slice 1             |
| 2 | `.llm/tools/quality/scan-code-quality_test.ts`                         | D-7                      |
| 3 | `deno.json`                                                            | plan Slice 1             |
| 4 | `packages/cli/src/public/features/root/public-command-dependencies.ts` | plan Slice 1             |
| 5 | `packages/cli/src/public/public-api.ts`                                | plan Slice 1             |
| 6 | `plugins/workers/streams/producer.ts`                                  | plan Slice 1             |
| 7 | `.llm/tools/consumer-tools.json`                                       | D-7                      |
| 8 | `packages/cli/src/kernel/assets/agent-tools.generated.ts`              | D-7 (generator-produced) |
| 9 | `.llm/harness/debt/arch-debt.md`                                       | D-7                      |

| Check                                     | Result | Evidence                                                                                                                               |
| ----------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `deno.lock` churn                         | `PASS` | `git diff --stat 01e096049..2d5e4f5ae -- deno.lock` empty                                                                              |
| No new `// deno-lint-ignore`              | `PASS` | zero additions across the diff                                                                                                         |
| No new `as unknown as` to green a wrapper | `PASS` | the only `+` hits are the 7 pre-existing casts gaining owner prefixes, plus test-fixture **string literals**; net cast count unchanged |
| Generated asset not hand-edited           | `PASS` | regeneration through `gen:assets-barrel` reproduces the committed file byte-for-byte                                                   |

## Carried question — `explicit-any` vs `public-any` attribution (obligation 8)

**Finding: a publicly reachable `any` is reported twice.** Determined by direct probe, not by
reading.

A scratch package with `export type PublicThing = { value: any };` produces two findings at the same
`file:line`:

```
{"rule":"explicit-any", "file":"…/mod.ts","line":1}
{"rule":"public-any",   "file":"…/mod.ts","line":1,"declarationKind":"type","exportPath":"…/mod.ts -> PublicThing"}
```

The two rules are computed independently — `scanPublicAny()` runs over the export graph, and the
line loop runs `ruleFor()` — and both results are concatenated into `findings`. The `public-any`
filter at the end of `scanCodeQualityDetailed` removes only locations carrying an allowance marker
(`suppressedPublicLocations`), not locations already reported by `explicit-any`.

Materiality, also probed rather than assumed:

- **It does not inflate the allowance budget.** A single `quality-allow` on the line suppresses
  _both_ rules and yields exactly **one** allowance record — verified: a two-line fixture with one
  marker produced `allowCount: 1`, `allowanceFailures: []`.
- **The public rule still discriminates correctly.** In the same fixture, a local-only
  `function localOnly(x: any)` fired `explicit-any` and **not** `public-any`, satisfying plan
  acceptance criterion 3.
- **It does not change any gate verdict.** Both rules are findings; `ok` is `findings.length === 0`,
  so the pass/fail outcome is identical either way.

The effect is confined to reporting volume: one defect consumes two rows, so a future remediation
count read off `findings.length` would overstate the work by the number of publicly reachable `any`
tokens. This is the locked plan behaviour PLAN-EVAL cycle 2 passed ("Keep the existing line-oriented
local rules separate"), so it is reported as an observation with a recommended follow-up, **not** as
a blocking defect.

## Issue acceptance evidence (obligation 6) — blocking finding

`mirror-acceptance-evidence.ts --dry-run` returned `ok:true` but with the warning:

```
Mirror skipped because live PR labels do not include status:ready-merge
```

That is a **skip, not a validation** — `changed: []` proves nothing, because the tool returns before
`validateEvidenceMapping` is ever called. Treating that dry-run as evidence of a valid mapping would
have been a false green. I therefore validated the mapping directly by calling the repo's own
`acceptanceCheckboxes` + `parseAcceptanceEvidence` + `validateEvidenceMapping` against the live
issue bodies and the live PR body plus all comment bodies, in the exact order
`mirror-acceptance-evidence.ts:117` composes them.

Structural mapping is sound: #1378 has 9 acceptance boxes and the blocks map box-index 1–9; #1545
has 5 boxes mapped 1–5. Every mapped box exists.

The claims are **not** all backed. The PR body still carries the Slice-0 _baseline_ blocks whose
entries read `"PENDING — …"`, while the Slice 4 comment carries the real final blocks. Both are
consumed, so `validateEvidenceMapping` throws for both issues:

- **#1378 — 9 errors:** 3 × `has not-yet-done evidence "PENDING — …"` (boxes 1, 2, 6) and 6 ×
  `has duplicate evidence; keep exactly one entry for that box` (boxes 3, 4, 5, 7, 8, 9).
- **#1545 — 5 errors:** 1 ×
  `not-yet-done evidence "PENDING — unlinked versus open/milestoned
  resolver test"` (box 3) and 4
  × `duplicate evidence` (boxes 1, 2, 4, 5).

Identical result against the **post-merge** copies of `acceptance-evidence.ts` /
`mirror-acceptance-evidence.ts` (main advanced both files by +159/−60 lines), so the failure is not
a stale-tooling artifact.

Consequence: `.github/workflows/ci.yml:72-85` runs the mirror in the close-gate job with no
`continue-on-error`. It is green today only because the label guard short-circuits it. The moment
`status:ready-merge` is applied and the job reruns, this step fails and **zero** boxes are mirrored,
which then also fails the following `check-close-gate.ts` step. This is precisely the "day-one red
gate" class the leaf exists to prevent.

The underlying acceptance criteria are, as far as I can verify, genuinely satisfied — the fix is
editorial, not implementation: remove the superseded baseline blocks from the PR body so exactly one
entry per box survives. Plan Slice 4 scoped this ("update acceptance evidence") and the plan's
Completion section requires "complete per-issue acceptance blocks", so the approved scope is not yet
complete. I did not mutate the PR body, issues, or labels.

## Runtime and Consumer Gates

| Gate                         | Validation                            | Result | Evidence                                        |
| ---------------------------- | ------------------------------------- | ------ | ----------------------------------------------- |
| `fresh-browser`              | `deno task test:browser`              | `PASS` | 2/2                                             |
| Consumer bundle resolve      | installed scanner from foreign CWD    | `PASS` | exit 0; bare-specifier control fails exit 1     |
| Consumer integration         | `init-agent_test.ts`                  | `PASS` | 19/19 (within the 4128-result suite)            |
| `scaffold.runtime`/`e2e:cli` | coordinator-scheduled expensive lease | `N/A`  | not acquired by design; **not** claimed as pass |

## Anti-Pattern Check

| AP     | Status          | Evidence                                                                                            |
| ------ | --------------- | --------------------------------------------------------------------------------------------------- |
| AP-1   | `CLEAR`         | No new abstraction layer; scanner extended in place per plan "do not create a third quality engine" |
| AP-4   | `CLEAR`         | Issue resolution behind an injected `AllowanceIssueResolver` port; fixtures in tests                |
| AP-7   | `CLEAR`         | No plugin-identity branching added; `plugin-name-check` rule preserved                              |
| AP-12  | `CLEAR`         | No `deno-lint-ignore` / suppression introduced to green a gate                                      |
| AP-19  | `DEBT_ACCEPTED` | Workers `private-type-ref` baseline, entry `workers-private-type-ref-1655`                          |
| Others | `N/A`           | Outside the touched surface                                                                         |

## Arch-Debt Delta

| Metric                | Count | Evidence                                                             |
| --------------------- | ----- | -------------------------------------------------------------------- |
| New entries           | 1     | `workers-private-type-ref-1655`, complete and no-increase            |
| Resolved entries      | 0     | —                                                                    |
| Deepened violations   | 0     | cast count unchanged (5 → 5); allowance population unchanged (7 → 7) |
| Unrecorded violations | 0     | —                                                                    |

## Findings

| Severity | Finding                                                                                                                                                                                                                                                                                        | Evidence                                                                                                                                                                                                                                                          | Required action                                                                                                                           |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| high     | Superseded baseline `acceptance-evidence` blocks remain in the PR #1653 body alongside the Slice 4 final blocks. `validateEvidenceMapping` throws for both closing issues (#1378: 9 errors; #1545: 5 errors), so the CI close-gate mirror step will fail once `status:ready-merge` is applied. | Executed `acceptanceCheckboxes` + `parseAcceptanceEvidence` + `validateEvidenceMapping` against live issue bodies and live PR body + comments; reproduced against post-merge tooling. `.github/workflows/ci.yml:72-85` has no `continue-on-error`.                | fix — remove the baseline blocks from the PR body so exactly one entry maps to each box; re-validate before applying `status:ready-merge` |
| low      | A publicly reachable `any` is reported twice (`explicit-any` + `public-any` at the same `file:line`).                                                                                                                                                                                          | Probe: `export type PublicThing = { value: any }` yields two findings at `mod.ts:1`. Does not affect `ok`, budget, or allowance count (one marker suppresses both).                                                                                               | none for this leaf — locked plan behaviour; consider single-attribution as #1276/#1378 follow-up                                          |
| low      | The scanner CLI silently ignores unknown flags; a typo'd `--max-allow` leaves `maxAllow` `undefined`, disabling the ceiling entirely (`--max-allow-typo 0` → exit 0).                                                                                                                          | `scan-code-quality.ts:1031-1039`; same `flatMap` idiom exists at the immutable base (line 253), so **pre-existing, not a regression**. Committed `deno.json` tasks spell the flag correctly, and `check-allowance-budget-diff.ts` is an independent second guard. | none for this leaf — optional hardening follow-up                                                                                         |

No finding was softened, and no praise is recorded. Everything in the implementation surface that
this leaf set out to build is present, executed, and green; the single blocking item is evidence
bookkeeping in the PR body.

## Lessons for Promotion

| Lesson                                                  | Pattern                                                                                                                              | Applies to         | Confidence |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------ | ---------- |
| A label-guarded validator's dry-run is not a validation | When a tool short-circuits on a missing label, call its validator directly against live state; otherwise a skip reads as a pass      | all harness leaves | high       |
| Baseline evidence blocks must be replaced, not appended | Body + comment blocks are concatenated by the mirror; leaving a superseded block turns every box into a duplicate/not-yet-done error | all harness leaves | high       |
| Consumer-shipped tools need inline registry specifiers  | Verify by extracting the installed bundle and running from a foreign CWD, with a bare-specifier negative control                     | archetype 6 tools  | high       |

## Verdict

| Field         | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Verdict       | `FAIL_FIX`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Evaluated SHA | `2d5e4f5ae15345d80c21c8c4da03f1667d3889bb`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Rationale     | The plan remains valid and every proving gate passes at the binding head, independently re-executed: 4109/0 tests, 2919-file check, both scans at `allowCount: 7` (green post-merge with `origin/main`), exact-20 Workers baseline correctly reported red under a complete debt entry, consumer bundle portability proven from a foreign CWD, fresh receipt provenance, no lock churn, no scope widening. The approved scope is nonetheless incomplete: superseded baseline `acceptance-evidence` blocks remain in the PR body, and `validateEvidenceMapping` provably throws for both #1378 (9 errors) and #1545 (5 errors), so the CI close-gate mirror fails the moment `status:ready-merge` is applied. Per verdict-definitions, `PASS` requires complete approved scope; the defect is editorial and confined to the PR body, so `FAIL_FIX`, not `FAIL_RESCOPE` or `FAIL_DEBT`. |
