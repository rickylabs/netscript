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

## Tier-A PASS at `61b8bf52b50a3cc3e98b67b367d1a1e4a2022807` — sign-off committed

The S5 repair landed at `c1e21c1b` (product path 2 + `worklog.md`, exactly two files, no seventh path
and no test-behaviour change), and the supervisor sign-off is the artifact-only commit `61b8bf52`.
Both T-1 and T-2 are resolved. The full re-derivation is in the leaf's own `worklog.md` at the
evaluated head; the load-bearing points:

- **T-1 resolved.** The over-width `@std/path` line-2 finding is gone. The remaining four findings
  were re-attributed by running the same scoped format against a pristine base archive and comparing
  **source lines**: three are base-owned on identical lines, and the fourth is leaf-owned because the
  regression-test file does not exist at base. The generator's 9 → 18 line shift is exactly +9, the
  cost of expanding one import line into ten — an independent consistency check on the attribution
  rather than a restatement of it.
- **T-2 resolved.** The corrected sentence was verified against the file, not the claim: the original
  S2 case name `'plugin doctor fails when a saga is authored after generate plugins'` is present
  **verbatim** at head alongside the four added cases, with `createDoctorHarness` shared.

Exact-head gates, all independently re-run: focused suite exit `0` (5 passed / 0 failed); scoped type
check exit `0`, zero diagnostics; scoped lint under the root rule set exit `0`, zero findings;
`deno.lock` byte-unchanged by raw `git diff --exit-code`; no thread id, rollout path, or daemon handle
in committed artifacts; `review-threads PASS threads=0 unanswered=0`.

**A disclosed fact the evaluator was told to confirm rather than assume:** the root `deno.json`
excludes `packages/cli/` from both `fmt` and `lint`, so the leaf's scoped runs used a scratch config
with that exclusion removed and are *stricter* than CI. The residual leaf-owned format finding in the
regression test therefore cannot fail CI. It was still worth correcting, because T-1 was about the
honesty of the attribution, not about a merge blocker.

### IMPL-EVAL dispatched — identity and route recorded before the evaluator mutates anything

| Field | Value |
| --- | --- |
| Gate | IMPL-EVAL cycle 1, PR #1739 (#1673) |
| **Evaluated head** | `61b8bf52b50a3cc3e98b67b367d1a1e4a2022807` — equal across local, `origin`, and PR `headRefOid`; tree clean |
| Product head | `c1e21c1b0823d1bd057d252e59f7bee5fbbdfc89` (ancestor; delta to evaluated head is artifact-only) |
| Implementation head | `e5123a0e4f3d6844dbc173d5b09249a24e637fb8` |
| Immutable base | `13878a80a50c55b9662099fed64555f2310ae4a3` |
| Requested route | **canonical** `formal_impl_evaluation` — native Claude `claude-fable-5` · effort `medium` · `--remote-control` |
| Observed route | `respawnFlags: ["--effort","medium","--permission-mode","bypassPermissions","--remote-control","--model","claude-fable-5"]` — **matched** |
| Background id | `9db66b8a` |
| Claude session id | `9db66b8a-b7f2-47f9-b3d4-ef8e53c2d7e2` |
| PID | `97958` |
| cwd | `/home/agent/projects/netscript/worktrees/007-eval-1673` (dedicated worktree; sole session there) |
| Verdict branch | `eval/impl-eval-1673-cycle-1`, cut at the evaluated head, upstream NONE |
| Registry `bridgeSessionId` | `session_01NKoRnBpTaUJWVJZcGeK3Zc` (non-empty, sessions-registry form) |
| Remote Control URL | `https://claude.ai/code/session_01NKoRnBpTaUJWVJZcGeK3Zc` |
| Independence | fresh session; separate from the Codex author `01a051d0-9b22-7181-a3fb-c2a48eab61b6` **and** from this topic supervisor, which signed Tier-A; opposite-family to the `gpt-5.6-sol` implementer |
| Verdict | _pending — immutable pushed verdict required_ |

**Route note.** `lane-policy.md` renders `formal_impl_evaluation` as **Fable 5 · medium for Codex
work**. No owner amendment applies to this gate, so the canonical route is used — not the Opus
override an earlier leaf in this lane carried under an explicit coordinator amendment. The two are
recorded distinctly so they are not later conflated.

The evaluator was given a dedicated worktree rather than the leaf's, so the leaf branch stays pristine
at the evaluated head while the verdict is written on its own branch. The brief states plainly that
this supervisor's Tier-A is an **input to verify, not a substitute for its judgment**, and names this
lane's five recorded analytical errors — the wrong-file green, file-level attribution hiding a
line-level fact, evidence written from a claim, the #1112 generated-derivative cascade, and the
supervisor `timeout` that killed a live author turn — so nothing is inherited.

## IMPL-EVAL cycle 1 verdict — `FAIL_FIX` at `61b8bf52`, and a Tier-A miss to own

Verdict commit `120ab86df627071aded8c7c04508cbebbbd59a12`, pushed on
`eval/impl-eval-1673-cycle-1`. Immutable pushed verdict satisfied. Evaluator route was the canonical
Fable 5 · medium, and it re-ran every gate itself rather than copying the Tier-A table.

### F1 is real, blocking, and I confirmed it independently

**The doctor's expected set is the CLI's manifest walk; the actual registry is written by each
plugin's own generator, which may apply a selection rule the manifest does not declare.** Verified
here, from source, not from the evaluator's summary:

- `plugins/ai/src/cli/ai-registry-compiler.ts` — `selectToolDefinitionModules` includes a file only
  if `exportsReadyAiToolDefinition(source)`. That is a **shape** predicate, not a path rule.
- `plugins/ai/scaffold.runtime.json` — the `ai-tools` manifest is `dir: ai/tools`,
  `fileSuffixes: ['.ts']`, `exclude: ['_registry.ts','mod.ts','plugin.ts','types.ts']`. It therefore
  **does** discover `ai/tools/skill-loader.ts`.
- `plugins/ai/src/adapter/resources/mcp-tool/mcp-tool.ts:19` ships exactly that file whenever the
  opt-in MCP tool is enabled.
- `packages/cli/.../installed-runtime-registry-integration_test.ts:276` and `:319` assert
  `tools.registry.has('skill-loader') === false` — the CLI's **own** test says excluding it is
  correct.

So on a correctly generated AI project the doctor reports
`Missing generated entry for manifest source: ai/tools/skill-loader.ts. Run: netscript generate
plugins` — a failure that is untrue and a remediation that can never succeed.

**This is #1673's own defect class, inverted.** The issue exists because the command asserted a state
the evidence did not support; at this head it does the same thing in the other direction. That makes
it blocking on the merits, not merely on process.

### Why my Tier-A missed it, stated plainly

I verified the six-path ceiling, the exact-head gates, the line-level fmt attribution, and that all
five test cases are red at base and green at head. Every one of those checks was sound, and none of
them could have caught F1: **the five cases only exercise the sagas manifest, whose generator
selection — `-saga.ts` suffix plus exclude — happens to coincide with the manifest walk.** I checked
that the green came from product code and never asked whether the equivalence it relies on holds for
any *other* plugin.

That is the #1112 lesson recurring in a new shape: I asked whether the design worked, not whether its
central assumption generalized. The generalization question is the one an evaluator asked and I did
not. Recorded here rather than glossed, because this is the second Tier-A in this lane to pass an
implementation with a real defect.

### F2 corrects a claim in this file

The earlier Tier-A entry above records "base product + head tests → 0 passed / 5 failed". That is
reproducible **only with `--no-check`**: under default type-checking the head test file does not
compile against base (`TS2353: 'inspectRuntimeRegistries' does not exist in type
'PluginDoctorDependencies'`) and zero tests run. The conclusion is unchanged — and the honest
red-before is the S2 file at base, 0/1 with `Expected function to reject`, which both the earlier
Tier-A and the evaluator reproduced — but the flag belongs in the record. Evidence precision, no
product impact.

F3–F5 are informational and are recorded in the evaluator's artifact: `registrableItems` changed from
plugin-wide sum to per-target count (no production consumer); latent walk-vs-generator divergence in
the workers generator's `include`/`includeWhenPresent` handling, same class as F1 but unexercised by
any shipped manifest; and `.llm/tmp/gate-receipts/` being gitignored, so receipts cited in the
worklog are not verifiable from a fresh checkout.

### The repair needs a ceiling expansion — verified, not assumed

I checked whether F1 could be fixed inside the existing six-path ceiling.
`plugins/ai/src/cli/generate-runtime-registries.ts` has **no** dry-run or selection-reporting mode —
its only flag handling is `--profile`/`--official-samples`. So the CLI cannot obtain the generator's
selected set today, and the honest directions both land outside the ceiling:

- **(a)** have each plugin generator report the sources it actually selected, and compare against that
  — general, and it also covers the latent workers divergence in F4;
- **(b)** declare the selection contract in `scaffold.runtime.json` — weak for AI specifically, whose
  rule is a source-shape predicate that no glob or exclude list can express.

The third option — downgrading a missing entry to a warning — stays inside the ceiling but trades away
issue AC2, so it is the least honest of the three and should not be chosen merely because it is
cheapest.

**Note that (a) does not require amending #1673's acceptance criteria.** AC2 says a *definition*
present in source and absent from the registry is a failure. `skill-loader.ts` is a factory, not a
definition, so under (a) AC2 is satisfied as written. No issue edit is implied — which matters,
because issue mutation is coordinator-owned.

### Disposition

Cycle 2 of 2 remains available. The design is now genuinely open — it was not when the bounded plan
marked `PLAN-EVAL: N/A` — so the repair gets a plan slice with a **real PLAN-EVAL**, not another
straight-to-implementation pass. The ceiling expansion is a lane plan amendment and is authorized here
with the rationale above; it is reported to the coordinator rather than hidden, and no issue edit,
relabel, readiness flip, or merge follows from it.
