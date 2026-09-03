# IMPL-EVAL cycle 2 (DELTA) — #1827 / PR #1828 TS2322 timeout-handle repair

| Field | Value |
| --- | --- |
| Run ID | `fix-cli-e2e-unstable-parity--1827` |
| Mode | DELTA evaluation of the repair commit only; cycle-1 settled findings not re-litigated |
| Evaluated head | `5605a95053fb5f501cabfe8447756952cbabcee2` (detached in worktree `007-eval-1827-c2`; equals PR #1828 `headRefOid` and `origin/fix/cli-e2e-unstable-parity` tip) |
| Delta RED head | `83d27ab7be8106298b56018119cd3eec93f4841e` (cycle-1 evidence head, where exact CI failed) |
| Repair commit | `42f2d6acc` |
| Evidence commit | `5605a9505` |
| `main` per brief | `26e1b486f95aec121d71f2f4cd0411dc6069af04` |
| Evaluator | Separate opposite-family session (GLM 5.3 Flash / OpenRouter max route), independent of the GPT-5.6-Sol author and of the cycle-1 GLM session |
| Scope discipline | Read-only over source; `git status --short` empty before and after every gate; throwaway RED worktree removed after use; only this artifact written |

Every exit below is a real captured code (`out=$(cmd 2>&1); rc=$?`). No verdict in this artifact
comes from a pipeline. The author's saved receipts (`receipts/delta-cycle-2-{red,green}.json`) were
treated as claims and re-derived from scratch.

## 1. RED re-derived independently — genuine, non-vacuous

Throwaway detached worktree `/tmp/eval1827c2-red` at `83d27ab7b`:

- `git rev-parse HEAD` → `83d27ab7be8106298b56018119cd3eec93f4841e`.
- `git status --short` → **empty** before anything ran (the historical false-RED mode — a test
  reading a dirty working tree — cannot recur; this time I verified it myself).
- Config on disk, read programmatically: `['deno.ns', 'deno.unstable', 'dom']` — i.e. the exact
  RED state for this delta: config fix present, handle repair absent.

Repo-wide gate, from that worktree root:

```bash
out=$(deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts \
  --output /tmp/eval1827c2-red-report.json --pretty -- --allow-all 2>&1); rc=$?
```

- `rc=1`; report `exitCode: 1`.
- Summary `0 passed / 0 failed / 0 ignored`, `totalResults: 0` — the type-check-death signature,
  not a pass.
- `processFailure.reason`: `deno test exited non-zero without a parseable TAP test failure`.
- `processFailure.stderr.tail` contains `TS2322 [ERROR]: Type 'Timeout' is not assignable to type
  'number'.` at `…/verify-producer-reconnect.ts:279:5` — byte-equivalent to the exact CI failure
  at `83d27ab7b`, reproduced in a clean tree.

The author's RED used the repo-wide gate (receipt `command: ["deno","test","--reporter=tap",
"--allow-all"]`, cwd `007-leaf-1827`), not a scoped compile proof. RED capture discipline: correct.

## 2. GREEN re-derived — real and attributable

Same command shape at the evaluated head `5605a9505` (this worktree, clean tree), output to
`/tmp/eval1827c2-green-report.json`:

- `rc=0`; report `exitCode: 0`.
- Summary **4,446 totalResults / 4,427 passed / 19 ignored / 0 failed**, `failures: []`, **no
  `processFailure` key**.
- Matches the author's GREEN receipt number-for-number; the suite is deterministic on this host.

Attribution: `git diff --name-only 83d27ab7b 5605a9505 -- packages plugins` → exactly
`packages/cli/e2e/src/application/gates/scaffold/verify-producer-reconnect.ts`. The parity test is
**not** among the delta files (checked explicitly; see §7).

## 3. The trap — independently confirmed, and sharpened

At the RED head I reproduced the brief's three-scoped-reproductions trap myself:

| Scoped probe at `83d27ab7b` | Exit |
| --- | ---: |
| `deno check packages/cli/e2e/src/application/gates/scaffold/verify-producer-reconnect.ts` (repo root) | 0 |
| same check with cwd inside `packages/cli/e2e` | 0 |

while the repo-wide gate at the same commit exits 1. The brief's warning is empirically true: a
scoped compile proof for this defect class proves nothing.

I went one step further and tried to reproduce the `Timeout` flip **in isolation**, to test whether
a smaller-but-still-whole-graph probe could serve as a cheap oracle — it cannot:

- Scratch configs with `lib` exactly `["deno.ns","dom"]` and `["deno.ns","deno.unstable","dom"]`,
  probing both `const h: ReturnType<typeof setTimeout> = setTimeout(…)` and the legacy
  `const h: number = setTimeout(…)`: **all four checks exit 0**.
- A lib-application control proves the scratch configs do apply `lib`: with `lib: ["deno.ns"]`,
  `window` fails with TS2304 as expected (`rc=1`).
- Adding the root `unstable: ["kv","temporal","tsgo","worker-options"]` array to the scratch
  config does not flip it either.

So the ambient `setTimeout → Timeout` resolution arises only inside the multi-member whole-graph
type-check program, not from any single member's lib set in isolation. I did not reverse-engineer
Deno's cross-member lib composition further — for this verdict it is enough that (a) the
whole-graph gate reproduces the defect deterministically and (b) the repair is correct in both
worlds (§4). The practical consequence stands and is now demonstrated twice over: **for
compiler-lib changes, the repo-wide test gate is the only oracle that sees the combined graph.**

## 4. The repair is minimal and platform-neutral

`git show 42f2d6acc` — exactly one product line:

```diff
-  let timeoutId: number | undefined;
+  let timeoutId: ReturnType<typeof setTimeout> | undefined;
```

plus the authorized one-line EOF blank-line removal in the leaf's `supervisor.md` (1 deletion,
`git diff --check` clean). `clearTimeout(timeoutId)` required no adjustment; the `| undefined`
arm is genuinely needed because the handle is assigned inside the promise executor and read in
`finally`. `ReturnType<typeof setTimeout>` is the narrowest platform-neutral equivalent.

Correctness under both lib sets:

- **Current set** (`deno.unstable` present): proven by the real whole-graph GREEN — this exact
  annotation type-checks in the program where the ambient resolution *is* `Timeout` (the legacy
  `: number` annotation demonstrably does not — that is the RED).
- **Prior set** (`["deno.ns","dom"]`): `ReturnType<typeof setTimeout>` follows whatever the
  ambient declaration resolves to (`number` there). Isolated probe with that exact lib set:
  `deno check` → `rc=0`. The old world additionally passed its own CI at cycle-1 heads, where the
  same file type-checked under the old libs.

Probe honesty note (recorded as Info finding below): my isolated probe cannot discriminate
`number` from `ReturnType` under the new lib set — only the whole-graph gate discriminates there.
That does not weaken the repair choice; it re-proves why the whole-graph gate is the oracle, and
the whole-graph GREEN is the binding evidence for the new-world direction.

## 5. Config fix NOT rolled back — verified

`packages/cli/e2e/deno.json` at the evaluated head, read from the commit object:
`compilerOptions.lib = ["deno.ns", "deno.unstable", "dom"]` — production CLI order, intact. The
delta diff (`83d27ab7b → 5605a9505`) touches no config file at all.

## 6. Scope, lock, and #1762 boundaries — all clean

| Proof | Command | Exit |
| --- | --- | ---: |
| Forbidden files, delta base → head | `git diff --exit-code 83d27ab7b 5605a9505 -- packages/service/src/primitives/health.ts .llm/tools/run-deno-check.ts` | 0 |
| Forbidden files vs brief's `main` | same paths, `26e1b486f… 5605a9505` | 0 |
| #1762-owned roots, delta base → head | `git diff --exit-code 83d27ab7b 5605a9505 -- packages/contracts packages/plugin packages/service packages/sdk packages/mcp` | 0 |
| `deno.lock` worktree | `git diff --exit-code -- deno.lock` | 0 |
| `deno.lock` delta base → head | `git diff --exit-code 83d27ab7b 5605a9505 -- deno.lock` | 0 |
| Leaf-authored product diff vs merge-base with `main` | `git diff --name-only a3e0a5aa8 5605a9505 -- packages plugins` | exactly `packages/cli/e2e/deno.json`, the repaired gate file, and `packages/cli/e2e/tests/config-lib-parity_test.ts` |
| Evidence commit content | `git show 5605a9505 --stat` | run-dir artifacts only |

Attribution note for auditors: `git diff 26e1b486f 5605a9505 -- packages/mcp` shows changes in
`packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts` and
`packages/mcp/src/publish-assets.generated.ts`. Those are **main-side drift**, not leaf-authored:
main tip `26e1b486f` (#1820) is *not* an ancestor of the evaluated head — the merge-base is
`a3e0a5aa8` — and `git diff a3e0a5aa8 26e1b486f -- packages/mcp` shows the identical files. The
leaf authored nothing under any #1762-owned root (vs its merge-base with main: empty). The
evaluated head also does not yet contain main tip; a merge refresh before merge is supervisor
business, not a delta defect.

Defect attribution also holds: the pre-repair blob `8edf7b677c5c…` of
`verify-producer-reconnect.ts` is identical at the leaf's base `a3e0a5aa8` and at main tip
`26e1b486f` — the TS2322 is caused by this leaf's lib change, not by a main advance.

## 7. Sibling sweep — independent, conclusive

I re-enumerated every timer call site under `packages/cli/e2e` myself (`grep -rn "setTimeout\|
setInterval" --include='*.ts'`, 32 hits). Disposition of each:

- **Stored handles** (6 sites): the repaired `verify-producer-reconnect.ts:277` — the only
  `let`-declared, explicitly annotated timer handle in the tree — plus `const timeout =
  setTimeout(…)` in `adapters/native-desktop/command.ts`, `adapters/http/fetch-http-adapter.ts`,
  `adapters/commands/deno-command-adapter.ts` (ternary), `gates/quickstart/aspire-walk.ts`, and
  `gates/scaffold/consume-flow-b-stream.ts`. All five siblings are `const` with **no explicit
  annotation**: the inferred type tracks the ambient declaration and is correct under either lib
  set; `clearTimeout(timeout)` accepts it in both.
- Everything else is the inline `new Promise((resolve) => setTimeout(resolve, …))` pattern — no
  handle exists — or string literals inside generated/probe scripts (not type-checked as timer
  handles).
- `setInterval`: **zero** occurrences under `packages/cli/e2e`.
- Negative greps, all empty: `: number` co-located with any timer word; `\w*(imeout|imer|nterval)
  \w* : number` declarations under `src/` and `tests/`.

The author's "zero remaining `number`-annotated handles" claim is **independently confirmed**; the
sibling evaluator's and author's concurrence was not relied on. No half-repair landmine remains.

## 8. PR truth — verified against the live PR

`gh pr view 1828`: `state OPEN`, `isDraft true`, `headRefOid 5605a9505…` (the evaluated head).

- `## Scope` lists the repaired file with the exact type used. ✓
- The body's gate section leads with the repo-wide RED/GREEN and explicitly demotes scoped gates
  ("Single-file checks and the focused source test resolve a smaller graph and pass at the failing
  head; the repo-wide test gate … is the regression oracle"). **No live claim asserts that scoped
  gates validated this change.** The repaired-head scoped check/lint/fmt entries in the PR's
  Tier-A table are factual claims about those gates passing, which I reproduced (scoped check:
  `rc=0`, 185 files / 2 batches / 0 diagnostics; fmt `rc=0`, 185/185, 0 findings; lint `rc=0`,
  178/178, 0 findings).
- Corrections were **rewrites, not appended contradictions**: the two cycle-1 slice comments were
  edited in place (`updated_at` > `created_at`), and the invalid `86443f47a` receipt now carries
  the explicit disavowal "It is not evidence for GREEN." The supervisor's 05:00 comment is a
  self-correction disclosing the premature ready transition and its revert — the PR is back to
  draft with `status:impl-eval`. The cancelled OpenHands run 33358519995 is recorded as
  not-a-verdict rather than claimed. Nothing merged, no labels flipped by this evaluation.

## 9. Cycle-1 conclusions the repair could invalidate — re-derived

- **Parity test still passes**: `run-deno-test.ts -- --allow-all
  packages/cli/e2e/tests/config-lib-parity_test.ts` at the head → `rc=0`, 1 passed / 0 failed.
- **Blob is still the cycle-1-verified one**: `git rev-parse
  83d27ab7b:…/tests/config-lib-parity_test.ts` and `5605a9505:…` both →
  `9581e7514fcb1793b46632fe7a631e4ba285cbae`, byte-identical across the delta. The repair did not
  touch the test — no loud exception needed; green remains attributable to the config line plus
  the platform-neutral annotation.

## 10. Author receipts vs my re-derivations

| Receipt | Author's claim | My independent capture | Match |
| --- | --- | --- | --- |
| `delta-cycle-2-red.json` | `exitCode 1`, 0/0/0, `totalResults 0`, TS2322 in `processFailure` | `rc=1`, `exitCode 1`, 0/0/0, `totalResults 0`, same `processFailure.reason`, TS2322 `Timeout` vs `number` at `279:5` in a clean throwaway tree | yes |
| `delta-cycle-2-green.json` | `exitCode 0`, 4,446 / 4,427 / 19 / 0 | `rc=0`, `exitCode 0`, 4,446 / 4,427 / 19 / 0, no `processFailure` | yes, exactly |

## 11. Open question — does the Low vacuous-pass ruling still hold?

**My judgement: the ruling holds, and I agree with cycle 1 — but its rationale should be sharpened,
because the leaf's own history supplies a stronger defense than "the synchronized drop is
unlikely."**

The vacuous path (`lib` absent from *both* configs → `undefined === undefined` → exit 0) was ruled
non-blocking on plausibility grounds. After this leaf shipped one defect its gates could not see,
plausibility alone would be a weaker answer. The stronger answer is **structural**: a synchronized
drop of `deno.unstable` from both configs is not silently green — it re-arms the exact failure this
leaf exists to fix. `packages/service/src/primitives/health.ts:184` calls `Deno.openKv()` inside
the type-checked graph (the #1762 initiating path); remove `deno.unstable` from the effective lib
set and the whole-graph gate re-fails with TS2551 — the same gate that caught TS2322, and the same
diagnostic that motivated this leaf. The vacuous path is therefore backstopped by an independent
enforcement layer that cycle 1's reasoning did not weigh, because the delta cycle is what made the
repo-wide gate the regression oracle. The residual truly-quiet case — both files losing
`compilerOptions.lib` wholesale while the product still needs the unstable lib — remains parity-
preserving (the invariant this test owns) and would still be caught by the whole-graph gate via
`health.ts`. The one-line hardening (assert `production.compilerOptions?.lib?.includes
('deno.unstable')`) remains a legitimate follow-up, but it is hardening in depth, not a gap that
this leaf's history exposes. Severity stays **Low**, disposition unchanged.

## Findings by severity

| Severity | Finding | Disposition |
| --- | --- | --- |
| Info | Isolated probes (member lib set alone, even with the root `unstable` array) do **not** reproduce the `Timeout` flip; only the multi-member whole-graph gate discriminates. Platform-neutrality of `ReturnType<typeof setTimeout>` under the *prior* lib set therefore rests on the isolated probe (`rc=0` under `["deno.ns","dom"]`) plus its definitionally-tracking property; the new-world direction is proven by the real whole-graph GREEN. | No action; recorded so the next auditor does not mistake a scoped probe for an oracle. |
| Info | Brief's `main` `26e1b486f` is not an ancestor of the evaluated head (merge-base `a3e0a5aa8`); the mcp generated-corpus differences vs main are main-side drift (#1820), not leaf-authored. The supervisor's 05:00 comment cites an older main (`0e93a6c0574`, an ancestor of `26e1b486f`), consistent with main advancing between 05:00 and this cycle. | No action for this delta; merge refresh with current main before merge is supervisor business. |
| Info | `rtk` unavailable on this host (matches the run's recorded tooling-fallback drift); raw git/gh used. `git worktree list` shows many co-tenant worktrees; the concurrent sibling evaluator's load was not read as a defect (both long gates re-derived with deterministic, receipt-matching results). | No action. |

No blocking findings. The repair is real, minimal, platform-neutral under both lib sets; the RED is
genuine and was captured with the only gate that can see this defect class; the GREEN is real and
full-counted; the config fix stands; scope, lock, and #1762 boundaries are untouched; the sibling
sweep found nothing left behind; and the PR tells the truth about all of it.

VERDICT: PASS
