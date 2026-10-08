# Evaluation: quality-scan-root-coverage (PR #1656 / issue #1542)

**Evaluated SHA: `2c4881fd7b01c2c5dabb6e76009bb5412b2538b2`**

## Metadata

| Field          | Value                                                                     |
| -------------- | ------------------------------------------------------------------------- |
| Run ID         | `release-0.0.7-internals--orchestration/slices/quality-scan-root-coverage` |
| Target         | repository quality-scan / doctrine gate root coverage                     |
| Archetype      | `6 — CLI / Tooling`                                                       |
| Scope overlays | `service`, `docs`                                                         |
| Evaluator      | session `ee2825f2-a67f-4d65-8c7f-b1956f695ded` — 2026-08-15               |
| Phase          | IMPL-EVAL, cycle 1, formal, separate session                              |

## Evaluator identity, route, and independence

| Field             | Value                                                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Session ID        | `ee2825f2-a67f-4d65-8c7f-b1956f695ded`                                                                                                |
| `bridgeSessionId` | `cse_01CiPTc5FQJLqr1JLGZZD3Hx` (`bridgeOutboundOnly: false`)                                                                          |
| `daemonShort`     | `ee2825f2`                                                                                                                            |
| PID               | `268042`                                                                                                                              |
| cwd               | `/home/codex/repos/netscript-007-quality-root-coverage`                                                                               |
| Requested route   | native first-party Claude Code, `claude-opus-5`, effort `medium`, `--remote-control`, fresh session                                   |
| Observed route    | `respawnFlags` = `--effort medium --permission-mode bypassPermissions --remote-control --name "NetScript 0.0.7 #1656 IMPL-EVAL" --model claude-opus-5` |
| Route match       | **matched** — `claude-opus-5` / `medium` / `--remote-control`                                                                          |
| Bridge attachment | `bridgeSessionId` + `bridgeOwnerAccountUuid 384af45e-…` present in `state.json`; `backend: daemon`, `template: bg`                    |
| Cost/inference    | `cliVersion: 2.1.233`, non-null token counter — this session reached inference (contrast D-1's Fable failure)                          |

Observed route read from `/home/codex/.claude/jobs/ee2825f2/state.json` `respawnFlags`, per the
brief, because a spare-claimed background session's own argv omits `--model`/`--effort`.

**Independence.** Distinct session from every prior lane on this leaf:

| Lane                              | Session                                                     | This evaluator? |
| --------------------------------- | ----------------------------------------------------------- | --------------- |
| Research / plan / implementation  | Codex `gpt-5.6-sol` thread `01a003d2-61ee-7ec0-8c74-075b3d631168` (`codex-thread-ids.md`, `supervisor.md`) | no             |
| PLAN-EVAL cycle 1                 | Claude Opus 5 `97ef1950-cda3-450e-9451-052a15015b3a` (`plan-eval.md:3`)                                    | no             |
| Tier-A topic supervisor sign-offs | Claude Opus 5 / high `f7691917-0be2-4bcd-8839-43d3fc809c34` (`worklog.md:133,234,342`)                     | no             |
| IMPL-EVAL (this pass)             | Claude Opus 5 / medium `ee2825f2-a67f-4d65-8c7f-b1956f695ded`                                              | **yes**        |

Family opposition holds: Claude evaluates Codex-authored implementation. No lane self-certified.

**Route-record note (non-blocking).** `supervisor.md` still binds `formal_impl_evaluation` to
Claude Fable 5 / medium. The owner override to native Opus 5 / medium for this gate is carried by
the dispatch brief and by `drift.md` "Route amendment 2", which is written against the PLAN gate.
The IMPL gate's route override is therefore recorded here rather than in `supervisor.md`.

## Immutable-target verification (executed)

| Check                                  | Required     | Observed                                                        | Result       |
| -------------------------------------- | ------------ | --------------------------------------------------------------- | ------------ |
| Local head                             | `2c4881fd7`  | `git rev-parse HEAD` → `2c4881fd7b01c2c5dabb6e76009bb5412b2538b2` | match        |
| Remote head                            | `2c4881fd7`  | `git ls-remote origin refs/heads/fix/quality-scan-root-coverage` → same | match  |
| PR #1656 head                          | `2c4881fd7`  | `gh pr view 1656 --json headRefOid` → same                       | match        |
| Immutable base                         | `473e8d75b`  | `git merge-base HEAD origin/main` → `473e8d75b5281c93dc4729d99f3358a34f2bd687` | match |
| `0147e238f..2c4881fd7` delta           | worklog only | `git diff --name-status` → exactly one `M` on the leaf `worklog.md` (+59/-22) | **worklog-only** |
| Source moved under a sign-off commit   | none         | `git diff --name-status 4ae309d5..HEAD -- . ':!.llm/runs'` → empty | **none**   |
| PR state                               | draft, `status:plan-eval`, milestone `0.0.7`, `Closes #1542` | `isDraft:true`; labels `type:fix`,`area:tooling`,`status:plan-eval` (exactly one `status:`); milestone `0.0.7`; body carries `Closes #1542` | match |

No refusal condition triggered. Local `main` is a stale ref (`01e09604`); `origin/main`
(`da574111a`) is the remote authority and the merge-base against it is the required `473e8d75b`.

**Transport caveat.** All Bash commands were rooted at
`/home/codex/repos/netscript-007-quality-root-coverage` or used absolute paths per the brief. One
`cd` into the scratch lint-probe directory was reset by the harness back to the worktree; no hook
failure was observed and no hook or project config was modified.

## Independently re-derived claims (brief items 1–8)

Every row below was executed in this worktree at `2c4881fd7`. Receipts were read but not trusted as
proof of the underlying claim.

### 1. The 29 → 0 root-coverage transition — CONFIRMED

`deno run --allow-read .llm/tools/quality/check-root-coverage.ts` at head → **exit 0**, `ok:true`,
`errors: []`.

| Claim                                     | Observed                                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------------------------ |
| `quality:scan` root moved                 | base `packages/cli/src` → head `packages`; `plugins` and `docs/site` retained              |
| `quality:scan` uncovered                  | **29 → 0**                                                                                 |
| `quality:scan:repo` uncovered             | 0 → 0                                                                                      |
| doctrine uncovered                        | 0 → 0                                                                                      |
| census                                    | `workspaceMembers 37 / membersInsideBoundary 37 / publishableMembersInsideBoundary 35`     |
| named `publish:false` exclusions          | exactly `packages/bench` and `packages/cli/e2e`, each `reason: "publish:false"`            |
| doctrine root count                       | 36 (35 publishable + `packages/bench`); `packages/cli/e2e` correctly absent (F-19)         |

The **29** was re-derived rather than copied: I fed the base `deno.json` task strings
(`git show 473e8d75b:deno.json`) into the head `evaluateRootCoverage()` against the live workspace
and doctrine authorities. Result: `base quality:scan roots: docs/site,packages/cli/src,plugins`,
`uncovered COUNT: 29`, `base ok: false`, `doctrineRootCount: 36`. 35 publishable members minus the
6 `plugins/*` covered by the `plugins` root = 29, exactly the reported set.

### 2. Live + fixture fail-closed behaviour — CONFIRMED, and criterion 2 is not fixture-only

`deno test --allow-all .llm/tools/quality/check-root-coverage_test.ts` → **9 passed, 0 failed**.

| Criterion-2 failure mode                | Where proven                                                                    | Executed |
| --------------------------------------- | --------------------------------------------------------------------------------- | -------- |
| omission of a publishable member        | `check-root-coverage_test.ts:30-41`                                              | pass     |
| descendant-root rejection               | `check-root-coverage_test.ts:43-51` (`packages/alpha/src` does **not** cover)     | pass     |
| broad-root future-member coverage       | `check-root-coverage_test.ts:52-62` (new member covered without a list edit)      | pass     |
| empty census                            | `check-root-coverage_test.ts:106-108` → `denominator is empty`                    | pass     |
| malformed / missing task roots          | `check-root-coverage_test.ts:110-118` → both `no configured roots` and `missing`  | pass     |
| structured CLI failure + non-zero exit  | `check-root-coverage_test.ts:169-210`, temp-repo fixture, asserts `output.code 1` | pass     |

**Judgement.** Criterion 2 is *not* only provable by fixture, and the fixture is sufficient where it
is used. Two independent supports exist: (a) the permanent fixture suite above, which cannot go
vacuous when the repo is healthy because it constructs its own uncovered member; and (b) two live
RED receipts at commits reachable from head — `receipts/slice-1/red-test.json` (exit 1 before the
checker existed, `2c9aa89c0`) and `receipts/slice-2/red-forwarding.json` (exit 1 at `98360da7b`,
the real repo with narrow roots and 29 uncovered members). Moving the structured-CLI-failure
assertion to a fixture rather than deleting it is the correct handling: deleting it would have made
criterion 2 stop being tested the moment coverage went green.

The live invariant (`check-root-coverage_test.ts:142-167`) additionally pins the census at
`37/37/35` and both task root sets. This is deliberately brittle: adding a publishable member turns
the suite red until the census is consciously updated. That reinforces criterion 2 rather than
weakening it, and is recorded here as an intentional property, not a defect.

### 3. Task forwarding under `--changed-file` — CONFIRMED

The blocking job is `.github/workflows/code-quality.yml:49-55`, which builds
`args+=(--changed-file "$file")` and runs `run-gate.ts --gate quality-scan`;
`.llm/tools/gates/catalog.ts:36` resolves that gate to `['deno','task','quality:scan']`. So the
appended arguments pass through `deno task`, and the checker is the first command of the `&&` chain.

Reproduced at head:
`deno task quality:scan --changed-file .llm/tools/quality/check-root-coverage.ts` → **exit 0**, two
JSON objects: the checker report (`ok:true`, `scannerTraversal.observedByChecker:false`) followed by
the scanner report (`mode:"changed-files"`, `scanned:[".llm/tools/quality/check-root-coverage.ts"]`).
The checker executes and its root parsing never sees the appended tokens.

Fail-closed in that mode is proven by the argv-identical RED receipt
`receipts/slice-2/red-forwarding.json` at `98360da7b`: exit 1, and its stdout contains **no** scanner
report at all — the `&&` short-circuited before the scanner could run.

`scan-code-quality.ts:1030-1036` computes `roots` but then sets
`scanned = changed.length > 0 ? changed : …`, so configured `--root` values are genuinely ignored in
changed-files mode. The scanner's own JSON discloses this (`mode`, `scanned`), and the checker's JSON
carries `scannerTraversal: {observedByChecker:false, traversedPaths:null, note:"configuredRoots are
configuration coverage only; …"}`. Neither report can be read as a claim that the scanner traversed
`configuredRoots`.

### 4. Permissions and budget — CONFIRMED byte-for-byte

Comparing base and head task strings token-by-token with all `--root` pairs removed, the scanner
invocation skeleton is **identical** for both tasks:
`deno run --allow-read --allow-net=api.github.com --allow-env=GITHUB_TOKEN,GH_TOKEN
.llm/tools/quality/scan-code-quality.ts --max-allow 7`.
`quality:scan:repo`'s root list is unchanged in full; `quality:gate` is unchanged; root task count is
102 before and after. Independent `deno task quality:scan` at head: `allowCount: 7`,
`allowanceFailures: []`, exit 0 — #1653's fail-closed allowance-owner resolver is unaffected.

The checker itself declares and needs only `--allow-read` (`deno.json` task prefix and shebang
`check-root-coverage.ts:1`); it ran successfully under exactly that grant.

### 5. S3 receipt head bindings — CONFIRMED

All 25 receipts have `gitHead == actualGitHead`, and every distinct head is an ancestor of
`2c4881fd7` (`git merge-base --is-ancestor`, 6/6 OK): `2c9aa89c0`, `22e35f4be`, `a2f33ca4f`,
`98360da7b`, `15d894740`, `4ae309d5`. Slice-3 receipts bind to `4ae309d5`; the non-run-artifact diff
`4ae309d5..HEAD` is empty, so those receipts attest the same implementation tree as head.

**The `docs-source-format` FAIL / `docs-source-format-docs-cwd` PASS pair is honest.** Both carry
`argv: ["deno","task","check:source-format"]` and the same `gitHead 4ae309d5`; they differ only by
`cwd` (worktree root vs `…/docs/site`). Verified independently: root `deno.json` defines **no**
`check:source-format` task (the FAIL receipt's own stderr is the task-not-found listing, and the
task list I read from `deno.json` confirms its absence), while `docs/site/deno.json` defines
`check:source-format` → `deno run --no-lock --allow-read _plugins/check-source-format.ts .`. The
exit-1 run was therefore a genuine invocation error, not a source failure; the failing receipt was
**retained under its own name** rather than relabelled or deleted, and the corrected run is stored
under a distinct `invocationId` (`…-docs-source-format-docs-cwd`). This is a truthful record of a
wrong-cwd invocation, not a green obtained by re-running elsewhere.

### 6. JSR audit — applicable, honestly empty denominator — CONFIRMED

`git diff --name-status 473e8d75b..2c4881fd7` contains **zero** paths under `packages/**` or
`plugins/**`. Touched publishable members: **0**. The rescope tripwire defined at `plan.md:127-128`
therefore did not fire, and the run states the empty denominator explicitly
(`worklog.md:297-311`) with its tripwire rather than reporting a vacuous package-level pass. The
canonical workspace publish dry-run is recorded green at the bound head
(`receipts/slice-3/publish-dry-run.json`, exit 0). `deno.lock` and `docs/site/deno.lock` are
byte-unchanged from base.

### 7. DoD / close-gate / PR truth — CONFIRMED, with one stale body line

`Closes #1542` is present in the PR body's Scope section (closing keyword satisfied, not a bare
`#N`). PR is draft; labels `type:fix`, `area:tooling`, `status:plan-eval` (exactly one `status:`);
milestone `0.0.7`; base `main`.

**No `acceptance-evidence` block exists.** Searched the live PR body and all 11 comments for the
string `acceptance-evidence`: **0 occurrences**. There is therefore no mapping for
`acceptanceCheckboxes` + `parseAcceptanceEvidence` + `validateEvidenceMapping` to validate, and this
row is `N/A` rather than passed. (`mirror-acceptance-evidence.ts --dry-run` was deliberately not
used.) The close-gate for #1542 remains open work for the coordinator: the issue's three acceptance
checkboxes and the PR's six DoD boxes are all still unticked, which is correct for a draft PR at
this phase — the implementation lane ticked nothing.

DoD rows against reality at head:

| DoD row                                                | Truthful status                   | Evidence                                                                                       |
| ------------------------------------------------------ | --------------------------------- | ---------------------------------------------------------------------------------------------- |
| Roots cover every published member; exclusions named   | ready to tick                     | live checker `ok:true`, 37/37/35, 0 uncovered ×3, both `publish:false` exclusions named        |
| A test or gate fails when a published package is absent | ready to tick                     | 6 fixture failure modes + 2 live RED receipts (item 2)                                          |
| `quality:gate` reports which roots it scanned          | ready to tick                     | checker `configuredRoots` + scanner `scanned:["packages","plugins","docs/site"]`, reproduced     |
| check/test/publish/quality/docs evidence recorded      | ready to tick                     | 8 green S3 receipts + retained wrong-cwd failure; all heads branch-reachable                    |
| Applicable JSR audit covers touched publishable members | ready to tick **with** the empty-denominator note | 0 touched members by diff; tripwire not fired; publish dry-run green                |
| PLAN-EVAL and IMPL-EVAL pass before ready-for-review   | tickable only after this verdict  | PLAN-EVAL cycle 1 `PASS` (`plan-eval.md`); this artifact is the IMPL-EVAL                       |

No row would be untruthful if ticked at head, with the JSR row carrying its stated qualification.

**Stale body lines (finding L-1, low).** The body still reads `Phase: plan-eval — awaiting
coordinator launch/disposition`, `Plan head: da76d9d84`, `Implementation and proving gates: NOT
FIRED`, and leaves the `S1`/`S2`/`S3` slice checkboxes unticked. All four are false at head:
implementation is complete through S3 and the proving gates fired with durable receipts. The
statements understate rather than overstate, and the per-phase truth is carried correctly by the 11
structured comments (RESEARCH, PLAN, PLAN-EVAL, IMPL, TIER-A ×2, SUPERVISOR SIGN-OFF ×2, S2, S3,
TIER-A S3). Recorded, not blocking.

### 8. Lock and scope hygiene — CONFIRMED

`git diff --name-status 473e8d75b..2c4881fd7 -- . ':!.llm/runs'` returns exactly three paths:

```
A  .llm/tools/quality/check-root-coverage.ts       (+236)
A  .llm/tools/quality/check-root-coverage_test.ts  (+265)
M  deno.json                                       (+2/-2)
```

`deno.lock` and `docs/site/deno.lock`: byte-unchanged (empty `git diff --stat`). Diff-wide search for
added `deno-lint-ignore` / `as unknown as` in the non-run-artifact diff: **none added**. The two new
files contain no `deno-lint-ignore`, `as unknown as`, `@ts-ignore`, `@ts-expect-error`, or `: any`.
The two casts present (`value as DenoTaskObject`, `tasks as Record<string, unknown>`) are ordinary
narrowing, not double-casts.

## Tier-A gate

| Check                                | Result | Evidence                                                                                       |
| ------------------------------------ | ------ | ------------------------------------------------------------------------------------------------ |
| Supervisor sign-offs exist per slice | PASS   | S1 `a258bcc8c`, S2 `4ae309d57`, S3 `2c4881fd7`, plus the S1 `CHANGES_REQUESTED` Tier-A review    |
| Sign-offs are the supervisor's       | PASS   | each names session `f7691917-…` (Opus 5 / high), distinct from the Codex implementer thread      |
| No lane self-certified               | PASS   | implementation = Codex; slice review = Claude supervisor; PLAN-EVAL and IMPL-EVAL = separate Claude sessions |

**Count correction.** The brief anticipates *four* supervisor sign-off commits. There are **three**
sign-off commits (S1/S2/S3) plus one implementer commit closing the supervisor's F1 finding
(`179219b02 docs(harness): record root coverage field-name drift`), which the S1 comment thread
attributes to the implementer responding, not to the supervisor. Four supervisor-driven harness
commits, three of which are sign-offs.

**Git identity caveat.** All 18 commits carry the same author/committer (`Rickylabs
<chautems.eric@gmail.com>`) because every lane runs under one machine identity. Lane separation on
this leaf is therefore attested by session IDs in run artifacts and structured PR comments, not by
git metadata. That is checkable evidence, but it is weaker than distinct commit identities and is
recorded as such.

**Did either recorded supervisor error mask a defect? No — verified, not assumed.**

- *Over-constrained S2 brief.* The supervisor's brief restricted S2 to `deno.json` alone, contra
  `plan.md:86-87`, which already authorizes the root-coverage test when its live assertion needs
  rebinding. The leaf correctly stopped rather than exceeding its brief; the constraint was withdrawn
  without a coordinator rescope. Cost: one leaf turn. No fourth path entered the slice
  (item 8 diff), and the rebinding it blocked is the one that keeps criterion 2 provable (item 2).
  Masked nothing.
- *F1 — three locked output field names changed without a drift record.* Confirmed by diffing
  `plan.md:64` against the implementation: `publishedMembers → publishableMembers`,
  `excludedMembers → excludedNonPublishableMembers`, `uncoveredMembers → uncoveredPublishedMembers`;
  `ok` and `configuredRoots` unchanged. Now recorded at `drift.md:61-81` with the full mapping and
  rationale. The renames are semantic improvements, not behaviour changes: `publishable` matches the
  `publish !== false` predicate used by `discoverWorkspaceMembers()`, and the population-explicit
  names are what the live test and receipts already assert. `census`/`boundary`/`scannerTraversal`
  are PLAN-EVAL-advisory additions, correctly separated from unplanned scope. Masked nothing.

## Process Verification

| Check                                  | Result | Evidence                                                                                   |
| -------------------------------------- | ------ | -------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | PASS   | `plan-eval.md` cycle 1 `PASS` at plan head `da76d9d84`, committed `3b95a004f`; first implementation commit `2c9aa89c0` follows it |
| Design section exists in worklog       | PASS   | `worklog.md:12-69` — public surface, vocabulary, ports, constants, commit slices, contributor path |
| Commit slices match design plan        | PASS   | 3 slices, S1→S2→S3 in the planned order; S3 touches run artifacts only (verified by diff)   |
| Each slice has a passing gate          | PASS   | S1 nine receipts (one intentional RED), S2 seven (one intentional RED), S3 nine (one retained wrong-cwd FAIL) |
| RED-before-GREEN honoured              | PASS   | `red-test.json` exit 1 → `test.json` exit 0; `red-forwarding.json` exit 1 → `forwarding.json` exit 0 |
| No speculative seams (unused files)    | PASS   | both exports (`evaluateRootCoverage`, `checkRootCoverage`) consumed by the test and the CLI `main()`; no unreferenced module added |
| Constants used for finite vocabularies | PASS   | `COVERAGE_TASKS`, `INCLUDED_PARENTS` (`check-root-coverage.ts:6-7`); no repeated task-name literals |

## Static Gates

| Gate             | Command or check                                                                       | Result | Evidence                                                              |
| ---------------- | -------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------- |
| Narrow typecheck | `deno check --unstable-kv <the two new files>`                                          | PASS   | executed by me: both files `Check`ed, exit 0                          |
| Slice typecheck  | `run-deno-check.ts --root .llm/tools/quality --ext ts`                                  | PASS   | 8 files, 1 batch, 0 failed batches, 0 occurrences                     |
| Format           | `run-deno-fmt.ts --root .llm/tools/quality --ext ts`; `deno fmt --check <file>`          | PASS   | 8 files selected, 0 findings; direct run reports `Checked 1 file`     |
| Lint             | `deno task lint --root <the two new files>`                                             | **PASS with finding L-2** | wrapper exit 0, 2036 files — but `deno.json` `lint.exclude` contains `.llm/`, so the two new files are dropped by `deno lint` itself. See L-2. |
| Doc lint         | `doc:lint`                                                                              | N/A    | no published surface changed; internal `.llm` tooling is not a JSR doc surface |
| Publish dry-run  | `deno task publish:dry-run`                                                             | PASS   | `receipts/slice-3/publish-dry-run.json` exit 0 at branch-reachable `4ae309d5`, tree-identical to head |
| Full test        | `deno test .llm/tools/quality/check-root-coverage_test.ts`; `deno task test`             | PASS   | mine: 9/9; receipt `slice-3/test.json` exit 0, 4,128 passed / 19 ignored / 0 failed |
| Quality gate     | `deno task quality:scan`; `deno task arch:check`                                         | PASS   | both re-run by me at head: exit 0 / exit 0; scan `allowCount 7`, `allowanceFailures []` |
| Link/path check  | receipt paths and file references in `worklog.md`/`plan.md`                              | PASS   | all 25 receipt paths resolve; `docs/site/deno.json` task reference verified |

## Fitness Gates

| Gate    | Function                    | Result | Evidence                                                                                     |
| ------- | --------------------------- | ------ | ---------------------------------------------------------------------------------------------- |
| F-5     | Public surface audit        | N/A    | zero touched publishable members (item 6)                                                     |
| F-6     | JSR publishability gate     | PASS   | canonical workspace `publish:dry-run` exit 0; no version/export/pin/catalog/lock change        |
| F-7     | Doc-score gate              | N/A    | no published doc surface changed                                                               |
| F-9     | Permission declaration      | PASS   | checker declares and needs only `--allow-read`; scanner grants byte-identical to base (item 4) |
| F-10    | Test-shape audit            | PASS   | semantic assertions on member/root sets and exit codes; no giant output snapshots (AP-18)      |
| F-19    | Scoped source gate runners  | PASS   | all durable evidence through `.llm/tools/gates/run-gate.ts`; wrapper selections non-empty; the one Deno-level exclusion is L-2 |
| F-1..F-4, F-8, F-11..F-18 | —         | N/A    | no `packages/**` or `plugins/**` source touched                                                |

## Runtime / Consumer Gates

| Gate                                        | Validation | Result | Evidence                                                          |
| ------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------- |
| `e2e:cli` / `scaffold.runtime` / Aspire / Docker | —      | N/A    | forbidden by the brief and out of the plan's scope (`plan.md:121`); this is not a release-gating run |
| CI `code-quality` job path                  | changed-file forwarding | PASS | reproduced at head (item 3); gate catalog + workflow inspected      |

## Anti-Pattern Check

| AP    | Status | Evidence                                                                                              |
| ----- | ------ | ------------------------------------------------------------------------------------------------------- |
| AP-2  | CLEAR  | reuses `discoverWorkspaceMembers()` and `discoverDoctrineRoots()`; no second workspace/doctrine walker |
| AP-9  | CLEAR  | no duplicated glob/publish-filter rules; the `publish !== false` predicate stays in `deps/workspace.ts` |
| AP-11 | CLEAR  | filesystem reads confined to `checkRootCoverage()`/`main()`; `evaluateRootCoverage()` is pure          |
| AP-18 | CLEAR  | assertions are semantic sets and exit codes, not output snapshots                                      |
| AP-25 | CLEAR  | pure coverage calculation separately testable from the CLI edge                                        |
| others | N/A   | outside the three-path tooling surface                                                                 |

## Arch-Debt Delta

| Metric                | Count | Evidence                                                                    |
| --------------------- | ----- | ----------------------------------------------------------------------------- |
| New entries           | 0     | `debt/arch-debt.md` absent from the diff                                     |
| Resolved entries      | 0     | same                                                                          |
| Deepened violations   | 0     | no `packages/**`/`plugins/**` source touched                                  |
| Unrecorded violations | 0     | no doctrine violation introduced; F1 contract drift is recorded at `drift.md:61-81` |

## Findings

| Severity | ID  | Finding | Evidence | Required action |
| -------- | --- | ------- | -------- | --------------- |
| low | L-2 | The `lint` gate does not actually lint the two new files. Root `deno.json` `lint.exclude` contains `.llm/`, so `deno lint` silently drops them; because the same batch also contains `packages`/`plugins` files, the wrapper's false-green guard does not fire and the receipt reads exit 0. | `deno lint .llm/tools/quality/check-root-coverage.ts` → **"error: No target files found"**. Wrapper selection proves the files were offered and dropped: baseline `--root packages --root plugins` = **2034** files; the receipt argv `deno task lint --root <both new files>` = **2036**. A pure-`.llm` selection exposes it — `run-deno-lint.ts --root .llm/tools/quality` exits **2** with *"1 deno lint batch(es) matched the wrapper selection but were excluded by Deno; refusing a false-green gate."* Receipts affected: `receipts/slice-1/lint.json`, `receipts/slice-1/final-lint.json`. | none in this leaf — see disposition below |
| low | L-1 | PR body carries four stale lines at head: `Phase: plan-eval`, `Plan head: da76d9d84`, `Implementation and proving gates: NOT FIRED`, and unticked `S1`/`S2`/`S3` slice boxes. | `gh pr view 1656 --json body` vs. the S1–S3 receipts and the TIER-A S3 sign-off comment | coordinator body refresh at the phase transition; understates rather than overstates, no DoD box falsely ticked |
| info | I-1 | `supervisor.md` "Routes in force" still binds `formal_impl_evaluation` to Fable 5; the owner override to Opus 5 for this gate is recorded only in the dispatch brief and here. | `supervisor.md` routes table; `drift.md:53-59` amendment covers the PLAN gate only | record the IMPL route amendment when the coordinator next touches the run artifacts |

**Disposition of L-2 — why it is recorded but not blocking.**

1. It is **pre-existing repo policy, not a regression**: `lint.exclude: [".llm/"]` predates this
   branch (`deno.json` is unchanged in that block from `473e8d75b`), and every `.llm` tooling file in
   the repository is in the same position. Changing it is outside the plan's locked three-path edit
   surface (`plan.md:41-44`) and would be a rescope, not a fix.
2. **No latent defect hides behind it.** I linted both files outside the excluded path with the
   repo's exact rule configuration (`tags: ["recommended","jsr"]`, plus `no-process-global` and
   `no-node-globals`): `Checked 2 files`, **exit 0, zero findings**.
3. **The files are not unchecked.** `deno check --unstable-kv` genuinely type-checks both;
   `deno fmt --check` genuinely formats them (`Checked 1 file`, contrast lint's "No target files
   found"); and `quality:scan:repo` scans `.llm/tools/quality` — `receipts/slice-2/quality-scan-repo.json`
   records `scanned:["packages","plugins",".llm/tools/fitness",".llm/tools/quality","docs/site"]`,
   exit 0. The new checker is covered by the very scanner it gates.

The correct action is a follow-up issue against the repo lint configuration, owned by the
coordinator, not a fix inside this leaf. It is noted here because a receipt reading "lint exit 0
over 2036 files" is evidence the command ran, not evidence these two files were linted — which is
the same distinction #1542 exists to enforce.

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| A wrapper's non-empty selection is not proof the underlying tool accepted the files | When a gate wrapper merges excluded and non-excluded paths into one batch, the tool's own `include`/`exclude` config can silently drop files while the batch still exits 0. Compare selection counts with and without the target roots, and run the tool on the target path alone. | 6 — CLI/Tooling; any run citing scoped wrapper receipts | high |
| Move a live invariant to a fixture rather than deleting it when the repo goes healthy | An assertion that only fails in the broken state stops testing anything once the fix lands. Rebinding the live test to assert zero gaps *and* keeping the failure case as a constructed fixture preserves the acceptance criterion permanently. | all archetypes with fail-closed gates | high |
| Retain a wrong-cwd gate failure under its own invocation ID | Storing the corrected run under a distinct `invocationId` beside the retained failure keeps the record honest and makes the cwd contract visible, where deleting the failure would hide a real invocation error. | any run using `run-gate.ts` receipts | medium |

## Verdict

| Field     | Value  |
| --------- | ------ |
| Verdict   | **`PASS`** |
| Evaluated head | `2c4881fd7b01c2c5dabb6e76009bb5412b2538b2` |
| Cycle     | IMPL-EVAL 1 |

**Rationale.** The approved plan's scope is complete and its three acceptance criteria are met on
evidence I re-derived rather than inherited: `quality:scan` moves from the descendant
`packages/cli/src` to broad `packages`, taking uncovered published members from **29 to 0** while
`quality:scan:repo` and doctrine hold at 0; the census is 37/37/35 with `packages/bench` and
`packages/cli/e2e` named as the only `publish:false` exclusions; and the gate reports its configured
roots separately from the scanner's traversed paths, so coverage and compliance are distinguishable.
Fail-closed behaviour survives the repo being healthy — six fixture failure modes plus two live RED
receipts — and survives changed-file mode, where the checker still executes and short-circuits the
scanner on failure. Permissions, `--max-allow 7`, and the `quality:gate` composition are byte-identical
to base, leaving #1653's allowance rail intact. Scope is exactly the three locked paths with both
lockfiles byte-unchanged and no suppression added; every receipt binds to a branch-reachable head,
including a retained wrong-cwd failure that was not relabelled; the JSR denominator is honestly empty
by diff with its tripwire unfired; and the Tier-A gate held with no lane self-certifying. Two
recorded supervisor errors were checked directly and masked nothing. The two findings are low: L-2 is
a pre-existing repo lint-exclusion that this leaf neither introduced nor is authorized to change, and
behind which I confirmed zero lint findings; L-1 is stale PR-body prose that understates completed
work with no falsely ticked box.

**Readiness.** This PASS stops the evaluator lane. The coordinator owns the remaining transitions —
refreshing the PR body (L-1), ticking the six DoD boxes and #1542's three acceptance criteria with
their evidence links, the `status:` label progression, and the ready flip. This evaluator ticked no
box, changed no label, mutated no issue, and started no second cycle.
