# Slice 1 Review — Canary label surface (#1121 / PR #1122)

## Review Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-canary-label-surface--1121` |
| Branch | `feat/canary-label-surface` |
| Review type | Ordinary opposite-family slice review (not PLAN-EVAL, not IMPL-EVAL) |
| Reviewer lane | Claude Code (Opus 5) reviewing Codex-authored work — opposite-family per `lane-policy.md` |
| Subject | Uncommitted working-tree diff at baseline `ff270573e` |
| Write scope | This file only; no source, index, `deno.lock`, GitHub, or commit mutation |

## Subject Diff

```text
.github/workflows/release-canary.yml                | 12 +++----
.llm/tools/release/canary.ts                        | 39 +++++++++++++++++++++-
.llm/tools/release/canary_test.ts                   | 24 ++++++++++++-
.llm/tools/release/release-canary-workflow_test.ts  |  6 ++++
4 files changed, 72 insertions(+), 9 deletions(-)
```

`.llm/runs/.../review-s1-prompt.md` is untracked and is the review brief, not slice content.

## Verification Performed

Read-only. Commands run by the reviewer, not taken from the implementer's claims:

| # | Command | Result |
| --- | --- | --- |
| 1 | `deno test --allow-all --frozen .llm/tools/release/canary_test.ts .llm/tools/release/release-canary-workflow_test.ts` | `ok \| 15 passed \| 0 failed (162ms)` — 12 from `canary_test.ts`, 3 from the workflow test |
| 2 | `.llm/tools/run-deno-check.ts --root .llm/tools/release --ext ts` | 32 files, `totalOccurrences: 0` |
| 3 | `.llm/tools/run-deno-lint.ts --root .llm/tools/release --ext ts` | exit 0, 32 files, `totalOccurrences: 0` |
| 4 | `.llm/tools/run-deno-fmt.ts --root .llm/tools/release --ext ts` | 32 files, `findings: 0` |
| 5 | `md5sum deno.lock` before and after all runs | `9a82643cb4c86e301f1598a783cdfd29` unchanged — lock hygiene clean, `--frozen` held |
| 6 | Bash probe of `set -euo pipefail` + `echo "x=$(jq -er ...)"` failure propagation | See F2; failure does **not** abort the step |

## Brief Objectives

### O1 — Machine-readable resolved canary identity is emitted by `release:canary` — **MET**

`canary.ts:18` adds `output?: string` to `CanaryOptions`; `canary.ts:59-61` parses `--output` through
the existing `requireValue` guard; `canary.ts:21-25` defines the `CanaryResult` contract
(`version`, `tag`, `branch`); `canary.ts:84-95` construct and write it as a single JSON line.
`main()` emits on all three terminal paths — republish (`:271-273`), dry-run (`:282`), and real cut
(`:288`) — and in the real-cut path the write happens **after** `createCanaryRefs`, so the artifact
is only produced once the refs it names actually exist. Contract-first ordering per plan axiom and
L1 is respected: the resolver owns the version and hands it downstream.

The `--allow-write` on the `release:canary` task (`deno.json:107`) is unscoped, so no task change was
required for the runner-temp write path; the `deno.json` entry in the slice-1 file list was
conservative, not a missed edit. Writing to `${{ runner.temp }}` rather than the worktree correctly
keeps the artifact out of `git status` and out of the release commit.

### O2 — The workflow consumes that result, not `deno.json` or log parsing — **MET**

`release-canary.yml:61` binds `CANARY_RESULT: ${{ runner.temp }}/canary-result.json`, `:66` passes
`--output "$CANARY_RESULT"`, and `:67-69` read all three step outputs from that file with `jq`.
The former `jq -r '.version' deno.json` repo-metadata inference is gone. No log parsing was
introduced anywhere in the diff. `release-canary-workflow_test.ts:39-44` pins the positive form and
asserts the negative (`source.includes("jq -r '.version' deno.json") === false`), so the plan's
"wrong identity from `deno.json`" risk mitigation is genuinely wired to a test, not just to prose.

Step ordering is preserved: the `Resolve canary context` step (`:78-93`) still merges cut vs.
republish identity, and the republish guard still precedes every publish step (asserted at
`release-canary-workflow_test.ts:52-57`).

### O3 — Success has non-empty test/wrapper evidence — **NOT MET as presented**

The evidence exists and is green when the reviewer runs it (table above), but **the slice does not
carry it**. See F1. As delivered, a reader of the run artifacts would conclude no implementation
exists.

## Findings

### F1 — Blocking — Slice 1 carries no run-artifact evidence, and `worklog.md` is now factually wrong

`worklog.md:47` defines slice 1's file set as including run artifacts, and the harness rule is
explicit: a slice whose commit does not touch the run dir is incomplete. The working tree touches
four source files and zero run artifacts. Concretely, the run dir still asserts the opposite of
reality:

- `worklog.md:99` — Fitness gate `NOT_RUN`, "No implementation exists yet."
- `worklog.md:111` — Consumer gate `release-canary.yml` `NOT_RUN`, "workflow tests planned."
- `worklog.md:117` — "No implementation file has been changed before PLAN-EVAL." This is now false;
  three source files and one workflow are modified.
- `context-pack.md` Gates table — all four families `NOT_RUN`; Changed-files table still says the
  run dir is "Plan/design bootstrap only."
- `worklog.md` Progress Log ends at the plan-eval waiver; there is no slice-1 row.

Because PLAN-EVAL was waived rather than passed (`drift.md:45-61`), the run's written record is the
*only* trail standing between this code and the owner's waiver. Leaving it stale is exactly the
"silence accepted as proof" failure the plan's L8 forbids in the product surface. Required before
the slice-1 commit: a slice-1 Progress Log row, real `PASS` rows with the four command results for
the identity/consumer gates, a corrected `worklog.md:117`, and a refreshed `context-pack.md`.

### F2 — Blocking — Removing the `test -n` / `!= "null"` guards silently defeats step-local failure detection

The old cut step validated the extracted version before writing `$GITHUB_OUTPUT`:

```bash
version="$(jq -r '.version' deno.json)"
test -n "$version"
test "$version" != "null"
```

Both guards were deleted and replaced with `echo "version=$(jq -er '.version' "$CANARY_RESULT")"`
(`release-canary.yml:67-69`). Under `set -euo pipefail`, a command substitution that fails inside a
**simple command** does not fail that command — `echo` still returns 0. The reviewer confirmed this
empirically:

```text
$ echo '{}' > /tmp/bad.json
$ echo "version=$(jq -er '.version' /tmp/bad.json)"   # jq exits 1
version=null
REACHED-AFTER-NULL-JQ exit=0
$ echo "version2=$(jq -er '.version' /tmp/missing.json)"  # jq exits 2
jq: error: Could not open file ... No such file or directory
version2=
REACHED-AFTER-MISSING-FILE
script exit=0
```

So `-e` on `jq` buys nothing here: the step writes `version=null` or `version=` and exits **0**. The
missing-file case is caught one step later by `test -n "$version"` at `release-canary.yml:89`, but
the `null` case is **not** — `null` is a non-empty string, so it passes `test -n`, and the workflow
proceeds to dispatch the production E2E with `ref=vnull` and `published-version=null`. That is
precisely the case the deleted `test "$version" != "null"` guard existed to stop. Today's writer
(`canaryResult`) cannot emit a null field, so this is a latent hole rather than a live break — but
the diff removes a working guard and replaces it with one that does not fire, in the step whose
whole job is identity integrity.

Cheapest correct fix: use assignment form, which **does** trip `set -e`, and keep the guards:

```bash
version="$(jq -er '.version' "$CANARY_RESULT")"
tag="$(jq -er '.tag' "$CANARY_RESULT")"
branch="$(jq -er '.branch' "$CANARY_RESULT")"
test -n "$version" && test "$version" != "null"
test -n "$tag" && test "$tag" != "null"
echo "version=$version" >> "$GITHUB_OUTPUT"
...
```

Note `branch` must stay allowed to be empty (the republish identity legitimately carries `''`), and
`jq -e` treats `""` as success, so that path is unaffected.

### F3 — Non-blocking — The new unit test's `deno.json` assertion is vacuous

`canary_test.ts` writes `{"version":"0.0.3"}` into a temp dir and then asserts it is still `0.0.3`
after `writeCanaryResult`. Nothing in the code under test reads or writes that file, so the
assertion cannot fail for any implementation. The plan's fitness gate — "unit test proves
`0.0.4-canary.1` output while root metadata remains `0.0.3`" — is satisfied in substance only by the
workflow test's negative assertion (O2), not by this unit test. The `canaryResult`/`writeCanaryResult`
round-trip assertions in the same test are sound and do carry weight; the `deno.json` scaffolding is
theatre and reads as stronger proof than it is.

### F4 — Non-blocking — `main()`'s `--output` wiring is unproven by any test

The three emission sites (`canary.ts:271-273`, `:282`, `:288`) are inside the unexported `main()`.
Tests cover `parseArgs` accepting `--output`, `canaryResult` construction, and `writeCanaryResult`
round-trip — but nothing proves the composition: that the real-cut path writes **after**
`createCanaryRefs`, that the republish path passes `republish = true`, or that a run without
`--output` writes nothing. The load-bearing ordering guarantee in O1 currently rests on code reading
alone. Extracting the terminal-path logic behind an injectable seam (as `canary-label.ts` is already
planned to do for slice 2's ports) would make it testable without widening scope.

### F5 — Non-blocking — Brittle exact-string negative assertion

`release-canary-workflow_test.ts:44` rejects the literal `jq -r '.version' deno.json`. A
reintroduction spelled `jq -r .version deno.json`, `jq -r '.version' ./deno.json`, or with different
quoting passes the guard. The positive assertions at `:39-43` carry the real weight; consider
matching on `deno.json` appearing anywhere in the cut step instead of on one spelling.

### F6 — Non-blocking — Branch/tag naming is now constructed in two places

`canaryResult` (`canary.ts:87-88`) builds `v${version}` and `release/canary-${version}` by template,
duplicating the identical templates inside `createCanaryRefs` (`canary.ts:184-185`). The two are 100
lines apart with no shared constant. A future rename of the ephemeral branch scheme that updates one
site would emit a result artifact naming a branch that was never pushed — which the cleanup step at
`release-canary.yml:138-142` would then fail to delete, leaking the branch. Both sites are asserted
by separate tests, so the drift would be caught, but a shared helper would make it structural.

## Scope and Hygiene Checks

| Check | Result |
| --- | --- |
| Stays inside slice 1 (no `canary-label.ts`, no post-publish label step) | PASS — slice 2 surface is absent, as intended |
| Publish mechanics untouched (readiness, OIDC, preflight, publisher, green pair) | PASS — no diff below `release-canary.yml:70` |
| No `packages/**` or `plugins/**` change | PASS — `quality:scan` / `arch:check` / jsr-audit not required for this slice |
| `deno.lock` unmodified | PASS — hash identical before and after all reviewer commands |
| No `deno-lint-ignore` or `as unknown as` introduced to green a wrapper | PASS — none in the diff |
| Non-scope respected (`agentic:provider-canary`, `agentic:rollout-canary`, E2E) | PASS — untouched |
| Reviewer self-certification | N/A — this review does not certify its own authorship; slice was Codex-authored |

## Round 1 Verdict

**CHANGES_REQUESTED**

The engineering core of slice 1 is correct and its stated objectives O1 and O2 are met: the resolver
emits a machine-readable identity and the workflow consumes that artifact instead of `deno.json` or
logs, with tests and all four scoped wrappers green under reviewer-run verification. Two items block
the sign-off commit:

- **F1** — the slice ships no run-artifact evidence and leaves `worklog.md`/`context-pack.md`
  asserting that no implementation exists. With PLAN-EVAL waived rather than passed, the written
  trail is the only record the waiver rests on; O3 is not met as presented.
- **F2** — the cut step's identity guards were removed in favor of `jq -e` inside a command
  substitution, which does not fail the step. A `null` field would reach the production E2E dispatch
  unchecked.

F3–F6 are quality findings for the implementer's judgement and do not block.

---

# Re-Review (Round 2)

| Field | Value |
| --- | --- |
| Reviewer session | `e10ff8f5-dfb4-4036-9b2d-62b51e1b06ce` (Claude Opus 5) — same opposite-family lane |
| Subject | Working tree after the implementer's round-1 fixes |
| Method | Independent re-run of every gate plus a fresh shell probe of the F2 fix; no claim taken on trust |

## Re-Verification

| # | Command | Result |
| --- | --- | --- |
| 1 | `deno test --allow-all --frozen` on both focused test files | `ok \| 15 passed \| 0 failed (207ms)` |
| 2 | scoped check wrapper over `.llm/tools/release` | 34 files, `totalOccurrences: 0` |
| 3 | scoped lint wrapper | exit 0, 34 files, `totalOccurrences: 0` |
| 4 | scoped fmt wrapper | 34 files, `findings: 0` |
| 5 | `md5sum deno.lock` | `9a82643cb4c86e301f1598a783cdfd29` — unchanged across both review rounds |
| 6 | Shell probe of assignment-form `jq -e` under `set -euo pipefail` | Aborts as required; see F2 below |

## Finding Dispositions

**F1 — Run-artifact evidence — RESOLVED.** `worklog.md` now carries three slice-1 Progress Log rows
(implementation, gates, opposite-family review), four Static Gate `PASS` rows with per-command
counts, a split Fitness table separating the slice-1 identity `PASS` from the slice-2
payload/drift `NOT_RUN`, and a Consumer `PASS` for `release-canary.yml`. The false claim at the old
`worklog.md:117` is corrected to "Implementation began only after the owner's recorded Plan-Gate
waiver." `context-pack.md` is refreshed with the changed-file table and Static/Fitness `PASS` rows.
The waiver framing is preserved throughout — no artifact claims a PLAN-EVAL `PASS`. The new
`drift.md` entry recording the `opus-4.8` → `opus` alias fallback is the correct handling of a
routing deviation and does not overstate the lane.

**F2 — Fail-closed extraction — RESOLVED, verified empirically.** The cut step
(`release-canary.yml:67-76`) now uses assignment form for all three fields and restores the guards
on `version` and `tag`. I re-probed the semantics rather than reasoning about them:

```text
version="$(jq -er '.version' /tmp/b.json)"   # .version absent
→ script exit 1, "REACHED-AFTER-NULL" never printed

version="$(jq -er '.version' /tmp/nope.json)"  # file missing
→ script exit 2, "REACHED-AFTER-MISSING" never printed
```

The round-1 hole is closed: assignment form propagates the substitution's status to `set -e`, so
`jq -e` now genuinely fails the step. `branch` is correctly left without a `test -n` guard — the
republish identity legitimately carries `''`, which `jq -e` treats as success — while still being
protected against null/missing by the assignment form. The explicit `!= "null"` guards on `version`
and `tag` are belt-and-braces on top of that.

**F3 — RESOLVED.** The temp `deno.json` scaffolding is gone; the test now asserts only what it
actually exercises — the `canaryResult`/`writeCanaryResult` round trip and the republish empty-branch
case.

**F5 — RESOLVED and strengthened beyond the finding.** The brittle single-spelling negative is
replaced by a bounded slice of the cut step with `assertEquals(cutStep.includes('deno.json'), false)`
(`release-canary-workflow_test.ts:43-47`). This rejects *any* re-introduction of manifest inference
in that step regardless of quoting, which is a stronger guarantee than round 1 asked for. The new
assertions also pin the assignment form and the null guard.

**F6 — RESOLVED.** `createCanaryRefs` destructures `canaryResult(version)` (`canary.ts:184`), so ref
names have one construction site. The leak scenario from round 1 — a result artifact naming a branch
that was never pushed, defeating the cleanup step — is now structurally impossible.

**F4 — Still open, still non-blocking.** `main()`'s `--output` wiring remains unexported and
untested; the write-after-`createCanaryRefs` ordering rests on code reading. Reasonable to carry into
slice 2, which is already introducing injectable ports.

## New Observations

**N1 — Slice-2 surface is present in the working tree during slice-1 sign-off.** The tree now also
contains untracked `.llm/tools/release/canary-label.ts` and `canary-label_test.ts`, plus a *tracked*
`deno.json` modification registering `release:canary-label`. Two consequences, neither a defect in
slice-1 code:

- The slice-1 sign-off commit must be path-scoped to the four source files plus the run artifacts.
  Staging `deno.json` wholesale would commit a task pointing at a file that is not in the commit,
  producing a broken intermediate revision on the branch.
- The wrapper counts recorded as slice-1 evidence (32 files) no longer reproduce; the same commands
  now select 34, because the slice-2 files sit under the wrapper's root. The evidence was accurate
  when captured and the delta is fully explained by the two new files — worth a one-line note rather
  than a re-run, since the diagnostics are zero either way.

**N2 — One stale row in `context-pack.md`.** Its Gates table still reads
`Consumer | NOT_RUN | workflow test planned` (`context-pack.md:62`) while `worklog.md` records the
`release-canary.yml` identity consumer gate as `PASS`. The two artifacts now contradict each other on
the same gate. This is the small residue of F1's category and is a one-line correction.

## Final Verdict

**PASS**

Both round-1 blockers are fixed and independently verified — the run artifacts now carry real,
non-empty slice-1 evidence without overstating the waived Plan-Gate, and the workflow's identity
extraction genuinely fails closed under shell probe. Objectives O1–O3 are all met: `release:canary`
emits the resolver-owned JSON identity, the workflow consumes that artifact with no `deno.json` or
log inference anywhere in the cut step, and success is backed by 15/15 focused tests and three
non-empty scoped wrapper runs with zero findings. `deno.lock` is untouched across both rounds, no
`packages/**` or `plugins/**` surface is affected, and slice 2's post-publish label surface is
correctly absent from slice-1 content.

Two commit-time conditions for the supervisor, neither requiring another review pass:

1. Path-scope the sign-off commit to slice-1 files; do not stage `deno.json` or the `canary-label.*`
   files with it (N1).
2. Correct the `context-pack.md` Consumer gate row to match `worklog.md` (N2).

F4 remains an open non-blocking quality item for slice 2.
