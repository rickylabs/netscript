# Tier-A running notes — #1673 plugin doctor registry drift

Branch `fix/plugin-doctor-registry-drift` off `main@13878a80a50c55b9662099fed64555f2310ae4a3`.
Author thread `01a04fd2-563e-7250-9173-f6befd6db8f2`, `gpt-5.6-sol` · high.

## Plan review at `d37b278b6` — accepted, one gate addition requested

Strengths: explicit six-path ceiling; reverse-drift coverage (registry entry with no backing source);
lock hygiene gated; and the red-before requirement written as a **gate condition** rather than an
aspiration — "focused structured test must fail on baseline because the command exits 0".

Requested addition: the plan names `doc:lint` and publish dry-run but not the derivative cascade. The
leaf adds a new file under `src/public/features/plugins/doctor/` and touches
`public-command-dependencies.ts`, either of which may move the published export surface. Asked for
`check:mcp-export-corpus` and `check:publish-assets` on the final tree regardless, with the outcome
recorded **either way** — including as a measured negative — and an explicit statement that
`check:assets-barrel` does not apply. Same plan shape as #1112, where CI caught what the plan, the
supervisor Tier-A, and a formal IMPL-EVAL all missed.

## Red-before independently verified at `c947b8fa4`

The author committed the regression test alone, before any product change. Supervisor re-derived it
from a pristine `git archive` of that commit:

```
run-deno-test.ts -- --allow-all \
  packages/cli/src/public/features/plugins/doctor/doctor-plugin-registry-drift_test.ts
→ exit 1, passed 0, failed 1
  AssertionError: Expected function to reject.
```

That is the defect stated precisely: a saga authored after `generate plugins` is absent from the
registry and `doctor` does **not** reject. The test fails against the unmodified command, so a later
green is evidence rather than decoration.

### Reviewer near-miss recorded

The first verification attempt selected test files with a `find` glob, which matched three unrelated
drift tests (`version-drift_test.ts`, `quickstart-command-drift_test.ts`,
`record-drift-command_test.ts`) and returned **exit 0, 4 passed**. That green said nothing about the
regression test and would have falsely confirmed the red-before claim. Corrected by reading the
commit's actual file list. Rule: when verifying a specific claim, name the file from the commit, never
from a pattern — a green from the wrong file is indistinguishable from a green from the right one.

## Infrastructure note

Two supervisor background monitors were killed mid-flight. The Codex author session survived — it runs
under the app-server daemon, independent of the supervisor's shell — and continued to `c947b8fa4`.
Verified by `codex-status` rather than assumed. The consequence that did matter: the queued gate-set
note was never delivered, so it must be re-sent.

## Monitoring constraint — 2026-08-30

Three supervisor background monitors have now been killed mid-flight (`booauapa5`, `bm4xe9qgp`,
`b368gfdo9`). The Codex author is unaffected — it runs under the app-server daemon, independent of the
supervisor's shell — and remains `working` at `c947b8fa4`.

Consequence: the supervisor cannot hold a long-lived wait, so monitoring is turn-driven rather than
continuous, and the queued gate-set note has not been delivered. The supervisor has stopped
re-spawning the waiter rather than repeatedly restarting work that keeps being reaped.

**This costs nothing material.** The note asks for `check:mcp-export-corpus` and
`check:publish-assets` on the final tree with the outcome recorded either way. If the author omits
them, Tier-A catches it before IMPL-EVAL is dispatched, so the worst case is one bounded correction
rather than a review cycle — which is the same outcome the note was buying. The red-before evidence,
which was the part that had to be right at the moment it was produced, is already verified and
committed at `c947b8fa4`.

## Tier-A at `02da4e1cabad48f03aed56773cf1be92a1149081` — HELD on T-1 and T-2

S3 (`e5123a0e4`, product) and S4 (`02da4e1c`, evidence-only) landed and pushed; local == remote == PR
#1739 head; tree clean. Reviewer is the topic supervisor, not the evaluator and not the author. Every
check below was re-derived independently — from the commit's own file list, from a pristine
`git archive`, or by re-running the command — never read out of the author's receipts.

### The proof that matters for this issue

#1673 exists because `plugin doctor` returned a green signal that reality did not support. So the
review question is not "do the tests pass" but "does the green come from product code".

Answered by construction: the head's five test cases were run against a **pristine base archive of
`main@13878a80a`** with the head's test file dropped in.

| Tree | Result |
| --- | --- |
| base product + head tests | **0 passed / 5 failed** |
| head product + head tests | **5 passed / 0 failed** |

Every case — late saga, reverse orphan, imported-but-unused binding, healthy-evidence wording,
bounded no-target wording — is red without the product change and green with it. The green is
product-caused at case granularity, not test-caused. (Type-checked, the hybrid additionally refuses to
compile: `inspectRuntimeRegistries` does not exist on base `PluginDoctorDependencies`, which is D5
landing as designed.)

### Verified clean

| Check | Result |
| --- | --- |
| Product ceiling | exactly the six authorized paths; **no seventh** |
| `deno.lock` | byte-unchanged vs `origin/main` (raw `git diff --exit-code`) |
| Focused suite | independently re-run: exit 0, **5 passed / 0 failed** |
| `check:mcp-export-corpus` | independently re-run: exit 0, corpus SHA-256 `88011e6e4590…` — **byte-identical** to the author's reported value |
| `check:publish-assets` | independently re-run: exit 0 |
| `check:assets-barrel` N/A | correct — no template or `kernel/assets` path is in the ceiling |
| Published run artifacts | no thread id, rollout path, or daemon handle leaked; the author correctly declined to claim an identifier this runtime does not expose |

The two cascade gates were the supervisor addition to the plan's gate set, which had marked them N/A
*by reasoning*. They came back negative — which is the point: a measured negative costs one command,
and on #1112 the unmeasured version got past the plan, past Tier-A, and past a formal IMPL-EVAL before
CI caught it.

### T-1 — a leaf-introduced format deviation reported as pre-existing

The scoped-fmt attribution is **file-level**, and at file level it is accurate: three of the four
findings do reproduce in a base archive. At **line** level one of them does not.

`packages/cli/src/public/features/generate/plugins/installed-runtime-registry-generator.ts`:

| | line 2 | length | fmt finding on that file |
| --- | --- | --- | --- |
| base `13878a80a` | `import { basename, … resolve, SEPARATOR } from '@std/path';` | **98** | on a different line (`type GenerateInstalledPluginRegistries,`) |
| head `02da4e1c` | same plus `relative, `, added by S3 | **108** | on **this** line |

`deno.json` sets `lineWidth: 100`. The head finding therefore sits on a line this leaf edited: it is
the leaf's, not the base's, and the file-level comparison concealed that. This is the #1669 lesson
generalized — compare base-vs-head at the granularity of the claim, never at a coarser one. One-line
fix inside the ceiling.

### T-2 — an evidence statement the diff contradicts

`worklog.md` states the S2 regression test "was not altered to manufacture green" and calls the fourth
fmt finding "inherited". S3 changed that file by **+148/−28**, and the file was **created by this leaf**
at `c947b8fa4`, so nothing in it is inherited.

The substance is sound and was verified rather than assumed: the deletions are the inline dependency
wiring extracted into `createDoctorHarness`, the original case name is unchanged, and all four of its
assertions survive verbatim (`assertRejects(RemoteError)`, `exitCode === 1`, `sagas/late-saga.ts`,
`netscript generate plugins`). The green is honest; the sentence describing it is not.

Held rather than waived because of what this leaf is. An evidence table that overstates its own
attribution reproduces #1673's defect inside the review record, and it is the same error class that
cost the #1729 leaf a correction: evidence must be written from the artifact, not from the claim about
the artifact.

### Disposition

Both findings are bounded and inside the authorized ceiling, so one repair on the **same** thread —
never a rival send at an owned worktree. Scope: path 2, `worklog.md`, and the PR #1739 evidence block;
no other product path, no test-behaviour change, no new gate. Delivery was confirmed by grepping the
target rollout for a distinctive phrase, not from the launcher's exit code.

After the repair: fresh Tier-A over the delta, then the mandatory **fresh opposite-family IMPL-EVAL**
in a session this supervisor owns. PR stays draft; no readiness flip, relabel, issue edit, box tick,
or merge from this lane.

### Infrastructure note

The streaming resume client is killed by this host's foreground command limit, as three background
monitors were before it. The daemon-side turn is unaffected — it survives independently — so steering
is delivered-then-detached, and progress is observed by re-reading git state rather than by holding a
live wait.

## S5 repair dispatched — 2026-08-30, after host restart

Findings T-1 and T-2 remain the only blockers; everything else at `02da4e1c` stays accepted and is
listed as a credit block in the repair brief so the author does not regenerate verified evidence.

The S3/S4 author thread did not survive the restart. A new Codex thread was launched at exactly
`02da4e1c` into the same leaf worktree (upstream still unset), route `gpt-5.6-sol` · high requested
and observed identical, attachment confirmed from the daemon rather than from the launcher's exit
code. Repair scope is unchanged from the disposition above: product path 2, `worklog.md`, and the PR
#1739 evidence block — no other product path, no test-behaviour change, no new gate.

PR #1739 taxonomy was repaired in the same pass (`type:fix`, `area:cli`, `priority:p1`, `status:impl`,
milestone `0.0.7`); it had carried none. Issue-side labels stay coordinator-owned and were reported,
not touched.

`review-threads` on #1739 returns `PASS threads=0 unanswered=0`, so no reviewer feedback was stranded
by the restart.

After the repair lands: fresh Tier-A over the delta at the new exact head, then the mandatory fresh
opposite-family IMPL-EVAL in a session this lane owns. No runtime lease is required for this leaf —
the six-path CLI ceiling touches no Aspire, Docker, or scaffold-runtime surface.
