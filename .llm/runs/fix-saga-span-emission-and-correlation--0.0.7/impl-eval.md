# IMPL-EVAL cycle 3 — DELTA — Emit and correlate saga cascade spans (#1368 / PR #1764)

Fresh native opposite-family session (Fable 5), separate from the Codex author, the fixes topic
supervisor, and the cycle-1 and cycle-2 evaluators. **Delta-scoped by explicit owner
authorization**: exactly one cycle over the F-A assertion correction and the resulting green
suites, with cycle-2's verified rows carried forward. Cycle 2's full-scope verdict is at
`9e087618:.llm/runs/fix-saga-span-emission-and-correlation--0.0.7/impl-eval.md`; nothing it
settled is re-derived here, and nothing I measured contradicts it. Read-only over source except
this artifact; no `e2e:cli`, Aspire, Docker, container, or leased gate was run; no label, draft
state, issue, or acceptance box was touched.

## Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-saga-span-emission-and-correlation--0.0.7` |
| Evaluator | Fable 5 native opposite-family, medium; worktree `007-eval-1368`; 2026-08-30 |
| Evaluated head | `60e0b198096759e28be31e4cd2224f33360de885` (= PR #1764 `headRefOid`; draft; milestone `0.0.7`; `status:impl-eval`) |
| Prior evaluated head | `22f6fa61` (cycle 2 `FAIL_IMPL` on F-A only; verdict `9e087618`) |
| Base | `f8b4f804`; main reconciled to `24f6642f` by merge `60e0b198` |
| Delta commits | `f0b01dac` (authorized F-A correction) + merge of main `24f6642f` with generator-only corpus resolution |

## Verdict summary

**`PASS_IMPL`.** The single cycle-2 blocker F-A is genuinely fixed by a correction, not a
weakening: the stale total-span-count pin (which encoded the pre-leaf world where a `complete`
cascade emitted no span) is replaced by by-name selection of the `saga.handle` span, one of the
two remediation forms cycle 2 sanctioned, and every propagation assertion the test exists for
survives verbatim on the correctly selected span. I reproduced both whole package suites green at
head, re-proved the corpus resolution byte-honest with decisive attribution arithmetic, confirmed
the ceiling is exactly the authorized 19 paths with `deno.lock` byte-unchanged, and confirmed
Flow-B is still truthfully `NOT_RUN` everywhere. Product scope was not widened: the delta touches
one test file and generated carriers only. Flow-B remains a REQUIRED supervisor-owned gate before
`status:ready-merge` — that gates readiness, not this eval.

## The five delta judgments

### 1. The correction is right, and it is a correction — not a weakening

- **Total file delta base→head is the one 4-line hunk** (`git diff f8b4f804 60e0b198 -- <file>`):
  the `started.length === 1` pin, positional `[0]` selection, and name equality check are replaced
  by `findIndex((e) => e.name === 'saga.handle')`, a `handleIndex >= 0` guard, and index-aligned
  selection. Nothing else in the file changed; `git log --first-parent` shows `f0b01dac` is the
  only commit ever to touch it on this branch.
- **Green at base re-verified directly**: I ran the file at detached `f8b4f804` in a throwaway
  scratch worktree — exit 0, **2 passed / 0 failed** — matching cycle 2's measurement and the
  commit message.
- **The guard is adequate.** `RecordingTracer.startSpan` pushes to `started[]` and `spans[]` in
  the same call (and `startActiveSpan` delegates to `startSpan`), so the arrays are index-aligned
  by construction and `spans[handleIndex]` is exactly the span whose start record was selected.
  `findIndex` returns -1 on absence and `assertEquals(handleIndex >= 0, true)` pins presence
  before any indexing. The file defines its own local `assertEquals`/`assertRejects` and imports
  nothing from `@std/assert`, so this is the natural guard form available; its failure message
  (`Expected false to equal true`) is terse but functional.
- **Coverage analysis — what the dropped pin bought and where it lives now.** The old pin asserted
  "exactly one span total", which under the approved plan (issue target item 1:
  `saga.cascade.complete` emission) is simply false — it pinned the regression's absence of the
  planned behavior. What by-name selection gives up relative to the supervisor's minimal 1→2 bump
  is only a canary for *new span kinds appearing on this path* — marginal, and exactly the
  brittleness that produced F-A (every future authorized span addition would re-redden this
  consumer). Span-cardinality contracts are pinned where they belong, in the authoritative
  `packages/plugin-sagas-core/tests/telemetry/saga-cascade-spans_test.ts`, which itself uses
  by-name `find`/`filter` selection and pins by-name counts (`handles.length === 2` in two
  scenarios) — the correction adopts the house style of the dedicated suite. Within this very
  file, the error-path test still pins `tracer.started.length === 1` (handler throws before any
  cascade), so single-emission on that path stays pinned. All five propagation assertions — parent
  traceparent, parent trace id, parent span id, spanContext trace id, OUTCOME=success — survive
  verbatim and now bind to the correct span. **Judgment: genuine correction; no meaningful
  coverage lost; matches cycle 2's F-A prescribed remedy ("count `saga.handle` spans by name")
  and the owner's authorized by-name variant.**

### 2. Both whole package suites are genuinely green — reproduced

Run by me at `60e0b198`, clean tree, via the structured wrapper over the **whole package trees**
(never targeted files):

| Suite | Result |
| --- | --- |
| whole `plugins/sagas` | exit 0 · **51 passed / 0 failed / 1 ignored** (was 50/1/1 at cycle-2 head) |
| whole `packages/plugin-sagas-core` | exit 0 · **84 passed / 0 failed / 3 ignored** |

Both match the supervisor's claimed numbers exactly. The F-A red is gone and nothing else turned
red.

### 3. The main merge disturbed nothing; corpus attribution proven

- `git diff --name-only 24f6642f 60e0b198` shows head differs from main **only** in the leaf's
  own paths (below) plus this run's own harness artifacts — every other product file at head is
  byte-identical to main, so the merge imported main cleanly.
- Within the leaf's 19 paths, the only changes since `22f6fa61` are the test correction (+4/−4)
  and the corpus carrier regeneration. No product source changed.
- **Attribution of `symbolCount` 7614 → 7623 is decisively main's.** Provenance across the four
  revisions: base `f8b4f804` = 7614 / 2,134,853 bytes; leaf head `22f6fa61` = 7614 / 2,134,943
  (leaf delta **+90 bytes, 0 symbols** — signature-only, the plan baseline); main `24f6642f` =
  **7623** / 2,138,501 (main's own additions); merged head = 7623 / **2,138,591 = main's bytes +
  exactly the leaf's +90**. `packageCount 35` / `subpathCount 270` unchanged at all four
  revisions. The merged carrier is arithmetically main's corpus plus the leaf's signature bytes.
- `deno task check:mcp-export-corpus` at head: **exit 0**, recomputed sha256
  `db4934f2…` matches the committed provenance byte-for-byte — the generator-only resolution
  claim is proven, not just asserted.

### 4. Ceiling holds at 19; lock byte-unchanged

`git diff --name-only 24f6642f 60e0b198` restricted to product paths yields **exactly 19**: the
17 cycle-2-verified ceiling paths, the corpus carrier (authorized supervisor exception), and
`plugins/sagas/tests/telemetry/publish-trace-linkage_test.ts` (owner-authorized item 20). Nothing
crept in. `git diff --exit-code … -- deno.lock` is empty against **both** main `24f6642f` and
base `f8b4f804`. `f0b01dac` touches one file, +4/−4, no product code — product scope was **not**
widened.

### 5. Flow-B remains truthfully `NOT_RUN`

Not attempted by me (per authorization). Grep over `worklog.md`, `drift.md`, `context-pack.md`,
the PR body, and all 10 PR comments: every mention reads `NOT_RUN` / REQUIRED /
supervisor-owned / author-must-not-run; the PR DoD box for Flow-B is unticked. Nothing anywhere
claims it passed. Per the owner's ruling and close-gate rule 12 it must run green in CI or
off-host before `status:ready-merge` — it gates readiness, not this verdict.

## Findings

| # | Severity | Finding | Evidence | Required action |
| --- | --- | --- | --- | --- |
| F-a | info | The run dir carries no worklog/context-pack row for `f0b01dac` or the merge — the 51/0/1 measurement lives only in the commit message (and now this verdict). No claim in the artifacts is false; the gate table is merely pre-correction. | `git diff --stat 22f6fa61 60e0b198 -- .llm/runs/fix-saga-span…/` is empty | One worklog row at the supervisor's convenience; non-blocking. |
| F-b | info | By-name selection means this consumer test no longer canaries brand-new span kinds on the success path. Deliberate, owner-authorized trade; cardinality contracts are pinned by-name in the dedicated core suite. | analysis §1 | None. |
| F-c | info (carried) | Cycle-2 F-C stands: `SagaEngine.handle` JSDoc still omits the widened `execution` parameter — expected, since that file was rightly outside the authorized delta. | `saga-engine.ts` unchanged since `ed270f2a` | One JSDoc sentence next time the file's ceiling is open. |

No blocking or major findings. Anti-pattern posture unchanged from cycle 2 (all CLEAR); the delta
adds no product code, so no new arch-debt is possible.

## Verdict

| Field | Value |
| --- | --- |
| Verdict | **`PASS_IMPL`** (cycle 3, delta-scoped) |
| Rationale | The sole cycle-2 blocker F-A is fixed by a genuine, house-style correction with no meaningful coverage loss; both whole package suites reproduced green at head (51/0/1 and 84/0/3); the merge imported main byte-cleanly with a proven generator-only corpus resolution (symbol delta attributed to main by provenance arithmetic); ceiling exactly 19 with lock byte-unchanged; product scope not widened; Flow-B honestly `NOT_RUN` and still correctly gating `status:ready-merge`, not this eval. Cycle-2's verified rows carry forward intact. |
| Readiness note | `PASS_IMPL` does not flip readiness: the leaf must not go `status:ready-merge` or merge until Flow-B consumer runtime runs green in CI or off-host (owner ruling; D-42/D-43 block local topology). |
