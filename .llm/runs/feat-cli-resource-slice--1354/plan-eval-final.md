# PLAN-EVAL — final verdict at amended head `8896b3b76` (delta over cycle-3 PASS at `61d7708f8`)

- Run: `feat-cli-resource-slice--1354`
- PR: #1891 (issue #1354)
- Phase: PLAN-EVAL, bounded to the amendment delta
  `git diff 61d7708f8 8896b3b76 -- .llm/runs/feat-cli-resource-slice--1354/plan.md`
  (1 file, +18/−2). Nothing else in the run directory changed in that range.
- Evaluator: native Claude (Fable 5.1) session, independent of the plan-authoring and
  amendment-authoring sessions; detached read-only checkout at `8896b3b76`.
- Baseline: cycle-3 `PASS_PLAN_WITH_FINDINGS` (PR #1891 comment 2026-09-02T15:32Z, head
  `409630338`; plan text at `61d7708f8`). Note: the on-disk `plan-eval-cycle3.md` still carries the
  earlier OpenHands `FAIL_PLAN` at `b2856f62c`; the PASS is on the PR thread only (NIT-1).
- Amendments under review:
  - `36492718a` — Slice F item 33 (`agent-conventions.ts`), ceiling 32→33.
  - `8896b3b76` — Slice G item 8 (`suite-runner_test.ts`), ceiling 7→8.

## Verdict

**PASS_PLAN**

Both amendments are the minimal enumeration change their stop-and-amend clause permits (one file
each, no extension point, no compatibility asset, no parallel suite), the implemented touch sets in
#1956 and #1958 match the amended enumerations, and every locked decision is byte-untouched.
Findings below are LOW/NIT prose hygiene; none changes scope or ceilings.

## 1. Amendment vs. the plan's own rules

### Slice F item 33 (`36492718a`)

Clause invoked (plan.md:787–789, unchanged):

> If implementation finds any additional importer or rendered consumer of the enumerated
> retire-set, stop and amend the enumeration; do not preserve a second canonical template or add an
> extension point to evade the ceiling.

Added hunk:

```
-**File ceiling:** 32.
+**File ceiling:** 33.
...
+33. `packages/cli/src/kernel/templates/app/agent-conventions.ts` — **enumeration amendment
+    (2026-09-02, supervisor, under the stop-and-amend clause below):** `serviceReferences()`
+    points five conventions (`service-route-contract`, `service-island`, `service-shared`,
+    `service-form`, `service-authorization`) at retired canonical templates. Re-point each to the
+    planner's surviving generated output for the same canonical role, or drop the reference when
+    the role no longer has a standalone file; do not add compatibility assets. Slice G still owns
+    the one-screen guidance rewording and the new `agent-conventions_test.ts`; F must keep the
+    existing `assertAppConventionsResolve` green against the retired set.
```

- `agent-conventions.ts` is a rendered consumer of the retire-set (it emits paths to
  `(_lib)/route-contract.ts`, `ServiceShowcaseLab.tsx`, `service-showcase.ts`, `managed-form.tsx`,
  `authorization.ts`) — squarely the clause's trigger. Slice F's research comment on #1956 claimed
  "no importer or rendered consumer outside the locked enumeration"; the amendment corrects that
  census honestly rather than papering over it.
- Minimal: exactly one file, ceiling +1, no new template/asset, "do not add compatibility assets"
  is explicit. The remedy is constrained to re-point-or-drop, which is the only ceiling-neutral fix.
- Ownership split with Slice G is explicit and disjoint by edit, not by file: F owns
  `serviceReferences()` remap; G owns the one-screen guidance text (G item 6) and the new
  `agent-conventions_test.ts` (G item 7). Because G is stacked on F, the shared file is edited
  sequentially, so no conflict surface exists. See LOW-1 for the wording gap this leaves.

### Slice G item 8 (`8896b3b76`)

Clause invoked (plan.md:838–840, unchanged):

> If captured-stdout assertions or runtime reachability require any file beyond this seven-file set,
> stop and update the plan. Do not create a parallel suite or split the runtime command; both resource
> ids must be reachable through the existing `RUNTIME_GATES` path.

Added hunk:

```
-**File ceiling:** 7.
+**File ceiling:** 8.
...
+8. `packages/cli/e2e/tests/application/runner/suite-runner_test.ts` — **enumeration amendment
+   (2026-09-03, supervisor, under the captured-stdout clause below):** once
+   `scaffold.resource-rerun` is reachable through `RUNTIME_GATES`, the suite-runner's
+   nominal-success fake must emit the rerun gate's expected captured output
+   (`Resource slice applied: 0 written, 11 skipped, 0 conflicts.`) instead of empty stdout. Update
+   only that fake's stdout; no new helper, no parallel suite.
```

- Causally required by G item 5 (adding both ids to `RUNTIME_GATES`): the existing suite-runner
  test materializes the runtime suite with a fake that returns empty stdout, so the rerun gate's
  captured-stdout assertion fails under the fake. That is exactly "captured-stdout assertions …
  require any file beyond this seven-file set".
- Minimal: one existing test file, ceiling +1, "only that fake's stdout; no new helper, no parallel
  suite" restates the clause's prohibitions inline. Runtime command remains single.

## 2. Cross-check against implementation reality

### Slice F — PR #1956 (`PASS_IMPL_WITH_FINDINGS`, head `0c95978c6`)

- GitHub file list: 36 `packages/` paths. Subtracting Slice A's three stacked paths from #1950
  (`resource-slice/client-selector.ts`, `client-selector_test.ts`, `ui/web-scaffold.ts`) leaves
  **33**, which decompose as amended items {1–23, 25–33} = 32 paths (item 24, the MCP corpus,
  regenerated with no diff; item 19 `embedded.generated.ts` present but ceiling-exempt per the
  "Generated carrier outputs are ceiling-exempt" rule at plan.md:488) **plus**
  `packages/cli/src/public/features/root/public-command-dependencies.ts` (Slice E's deferred item
  6, absorbed). This matches the PR body's "33 enumerated + 1 absorbed" and the IMPL-EVAL M-1
  closeout recorded in the F run's `drift.md`/`context-pack.md`/`implement.md`.
- Item 33 as implemented (PR diff of `agent-conventions.ts`): `service-route-contract` →
  `index.route.ts`; `service-island` → `${Pascal(service)}Island.tsx`; `service-shared` →
  `${service}-loaders.ts`; `service-form` → `${service}-form.tsx`; `service-authorization` union
  member and entry **dropped**; one import added (`toPascalCase` from `@std/text`). No compat
  asset, no extension point. Matches the amendment verbatim.
- `service-query.ts.template` untouched; `deno.lock` unchanged — both confirmed by PR body and
  IMPL-EVAL.
- Divergence the plan should still record: none beyond the already-recorded absorption of
  `public-command-dependencies.ts`, which the plan pre-authorized as a Slice E item and the F drift
  artifacts carry. No plan.md edit is required for it (LOW-2 explains why an optional note would
  still help a future reader).

### Slice G — PR #1958 (`PASS_IMPL` cycle 2, head `bc116bb5d`)

- GitHub file list: exactly **8** `packages/` paths, one-to-one with amended items 1–8
  (`cli-surface.ts`, `resource-slice-gates.ts`, `resource-slice-gates_test.ts`,
  `scaffold-gates.ts`, `capability-suites.ts`, `agent-conventions.ts`,
  `agent-conventions_test.ts`, `suite-runner_test.ts`). No Slice A/E/F path leaks in the file list
  at this head.
- Item 8 as implemented (PR diff of `suite-runner_test.ts`): a single two-line ternary branch in the
  existing nominal-success fake —
  `request.command.includes('generate') && request.command.includes('resource') ? 'Resource slice applied: 0 written, 11 skipped, 0 conflicts.' : ''`.
  No helper, no new test, no parallel suite. Matches "update only that fake's stdout".
- Cycle-2 corrections (gate order after `database.codegen`, resource name `people`) stayed inside
  the same 8 files; the G run's `drift.md` records them. Neither required a further plan amendment
  and the plan's item 4/5 text ("after init/service discovery and before generated-project
  quality/type-check gates") remains true of the landed order.

## 3. Locked decisions untouched

The delta contains exactly four hunks, all inside Slice F (plan.md:693–780) and Slice G
(plan.md:807–836). Therefore:

- D1 (plan.md:50), D2 (:64), D3 (:90), D8 (:308–325) — byte-identical.
- Multi-client seam text (D2 / plan.md:27–28, :74–87, :409: sole candidate accepted, multiple
  candidates without `--client` fail closed, `--client` the only disambiguator) — byte-identical.
- MEDIUM-3 (cycle-3 finding: #1355 fence + `Refs #1354` on every slice) — its resolution is
  unchanged: `#1355` appears 4× and every slice heading A–G still carries `(Refs #1354; partial)`.

## Findings

| ID | Severity | Finding | Blocking |
| --- | --- | --- | --- |
| LOW-1 | LOW | Slice G item 7 still says "no file is double-counted", but after item 33 `agent-conventions.ts` now appears in both F and G enumerations (by design, edits disjoint). Suggest a one-clause note on G item 6: "same file as F item 33; F owns `serviceReferences()`, G owns guidance text." | No |
| LOW-2 | LOW | Stale ceiling prose: plan.md:698 "The ceiling rises from 24 to 32 solely for the eight…" now sits under `**File ceiling:** 33.`; plan.md:838 "beyond this seven-file set" now sits under `**File ceiling:** 8.` Both are narrative, not rules, and the amendment items themselves explain the +1s. | No |
| LOW-3 | LOW | Amendment date stamps: item 33 says 2026-09-02, item 8 says 2026-09-03; commit timestamps are 2026-09-02 23:25 +0200 and 2026-09-03 00:28 +0200 respectively, so both are accurate. Recorded only so a reader does not read the mismatch as an error. | No |
| NIT-1 | NIT | `plan-eval-cycle3.md` on disk is the OpenHands `FAIL_PLAN` at `b2856f62c`; the cycle-3 `PASS_PLAN_WITH_FINDINGS` lives only in the #1891 thread (2026-09-02T15:32Z, head `409630338`). Consider committing that receipt so the run directory's verdict trail is self-contained. | No |

## Evidence

- Delta: `git diff 61d7708f8 8896b3b76 -- .llm/runs/feat-cli-resource-slice--1354/plan.md`
  (+18/−2; hunks quoted above).
- Commit trail: `git log 61d7708f8..8896b3b76 -- plan.md` → `36492718a` (F, ceiling 33),
  `8896b3b76` (G, ceiling 8).
- `gh pr view 1956 --json body,comments,files` — body "Touch set: 33 enumerated + 1 absorbed";
  IMPL-EVAL PASS_IMPL_WITH_FINDINGS (2026-09-02T22:09Z), M-1/M-2 closeout (22:56Z); 36 package
  paths = 33 F + 3 Slice A (#1950 file list verified).
- `gh pr diff 1956` — `agent-conventions.ts` hunk (4 re-points, 1 drop, 1 import).
- `gh pr view 1958 --json body,comments,files` — 8 package paths; IMPL-EVAL cycle 1 FAIL_IMPL
  (order + `users` collision), cycle 2 PASS_IMPL at `178df1726`.
- `gh pr diff 1958` — `suite-runner_test.ts` hunk (2-line ternary branch only).
- Locked-decision integrity: grep of D1/D2/D3/D8 headings, `--client` seam lines, `#1355`
  (4 hits) and `Refs #1354` slice headings (7 hits) at `8896b3b76`; none inside the diff range.

## Next

- No plan changes required for merge. Optionally apply LOW-1/LOW-2 prose hygiene in a follow-up
  harness commit; not a gate.
- Hosted `scaffold.runtime` receipt for #1958 remains the merge-readiness gate for the stack once
  the base flips to `main` (outside this PLAN-EVAL's scope).
