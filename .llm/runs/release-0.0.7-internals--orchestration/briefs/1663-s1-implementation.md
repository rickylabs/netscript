# Brief — #1663 slice S1 (first implementation slice; plan gate discharged)

You are the preserved Codex author, thread `01a004ec-86a6-7c21-8886-81c09de099f5`. Resume your own
thread.

## Authorization

The topic supervisor's Tier-A review **PASSED** your amended plan at
`62811a9dd454c81524dd142b00d95196439fb5c2`. Under the owner's grant that review stands in for the
plan gate, so **the plan gate for #1663 is discharged and implementation is unblocked**. The leaf is
now `status:impl`. There is no cycle 4 and no further plan evaluator.

Your amended `plan.md` at that head is the contract. Implement **S1 only**, then stop.

## S1 scope — exactly the eight paths your own S1 row names

`deno.json`; `.llm/tools/run-deno-fmt.ts`; `.llm/tools/run-deno-fmt_test.ts`;
`.llm/tools/run-deno-lint.ts`; `.llm/tools/run-deno-lint_test.ts`;
`packages/mcp/tests/fixtures/doctor/broken/.deno-fmt-lint-ignore` (new);
`packages/mcp/tests/fixtures/doctor/healthy/netscript.config.ts` (formatting-only);
`packages/cli/src/kernel/assets/agent-tools.generated.ts` (canonical regeneration only).

Nothing else. S2, S3 and S4 are later slices — do not start them.

## The traps your own plan and the three verdicts identified

- The doctor entry goes in the **existing** root `fmt.exclude` list. Never top-level `exclude`
  (it makes `deno check` silently drop the five doctor fixture files at exit 0), and never a second
  `"exclude"` key in the `fmt` block (JSON last-key-wins silently shadows it). Append to the list
  that is already there.
- Remove the `fmt:check` task's wrapper-level doctor-family `--exclude`.
- The marker is **child-only**: it removes its own subtree and nothing else. A parent-family or
  blanket `tests/fixtures` skip drops the four healthy files to 110 and is a rejected design.
- `broken/deno.json` stays byte-for-byte malformed — SHA-256
  `6815999dbd68bd1ab5bb137b59808cb1f1a38fb3393c9133721f439c0ad37361` before and after.
- The healthy fixture change is **formatting-only** under its nearest config. Parsed value stays
  `{"plugins":["workers"]}` and doctor stays 4/4.
- Regenerate the CLI barrel **only** via `deno task gen:assets-barrel`. Never hand-edit it.
- Memoize `nearestConfig` per directory (L11); its tests assert grouping and batch membership with
  and without the cache, not timing.

## Proof obligations before you commit

- Both exact no-extra-flag wrappers: `filesSelected: 114`, two batches, `failedBatches: 0`, raw
  exit 0. All four healthy TS files individually proven selected.
- **Check coverage** (the cycle-3 finding): scoped doctor-directory check reports exactly
  `filesSelected:5, failedBatches:0`, or direct `deno check` emits all five `Check` lines. A
  warning-only or omitted file is **failure, not green**.
- Raw-walk protection: a raw root `deno fmt` walk does not revert the normalized healthy file.
- `deno task fmt:check` green with the doctor `--exclude` removed, and it detects an injected defect
  in a healthy file.
- Wrapper tests prove marked-subtree skip, unmarked-sibling selection, and that config groups cannot
  poison one another. Negative controls for real fmt and lint defects fire and restore byte-exactly.
- `deno task gen:assets-barrel` then `deno task check:assets-barrel` green, with
  `agent-tools.generated.ts` the only generated asset changed.
- Doctor 4/4; existing wrapper tests still green.

Use the structured wrappers and `.llm/tools/gates/run-gate.ts` for durable evidence. Empty
selection, a crash batch, `NOT_RUN`, or a waived gate reported as green is **not** a pass.

## Hard bounds

- No `scaffold.runtime`, Aspire, Docker, or `e2e:cli`. The gate is coordinator-waived `n/a` for this
  surface; do not request the mutex.
- No fourteenth path. No new `// deno-lint-ignore`, `any`, or `as unknown as` to green a wrapper —
  that is a review-blocking finding, not a pass.
- Do not touch `plan-eval.md`, `plan-eval-cycle-1.md`, or `plan-eval-cycle-2.md`.
- No merge, ready flip, relabel, issue-checkbox mutation, central-state edit, or lease.
- No `deno.lock` churn, cache reload, or unrelated source drift. Compare lock and status against Git
  ground truth before and after every gate.
- Keep `worklog.md` and `context-pack.md` current; record any divergence in `drift.md`.

## Output

Commit S1 as one slice, push by explicit refspec
(`git push origin HEAD:refs/heads/fix/package-gate-honesty`), and post a `[PHASE: IMPL]` comment on
#1663 with the gate evidence. **Then stop** — the supervisor performs a fresh Tier-A slice review
before S2 is dispatched, and the sign-off commit is the supervisor's, not yours. Report your thread
id, commit SHA, and head.
