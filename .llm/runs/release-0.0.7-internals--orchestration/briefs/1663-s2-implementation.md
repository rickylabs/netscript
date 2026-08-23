# Brief — #1663 slice S2 (CLI cwd-independence)

You are the preserved Codex author, thread `01a004ec-86a6-7c21-8886-81c09de099f5`. Resume your own
thread.

## S1 is signed off

Tier-A **PASSED** S1 at `4b988a381ea9278bcf1b1bc43cf73c0f8691d87a`; the supervisor sign-off commit
is on the orchestrator branch. Every number in your `[PHASE: IMPL]` comment was independently
reproduced — both wrappers 114/2/`failedBatches:0` at exit 0, the five-file doctor `deno check`
coverage unchanged, the barrel reproduced by canonical regeneration with the six other generated
assets byte-identical, `quality:scan` `allowCount` still 7, wrapper tests 20/0. Nothing was
overstated. Implement **S2 only**, then stop.

## S2 scope — exactly the three paths your S2 row names

- `packages/cli/e2e/src/application/gates/scaffold/service-env/service-env-gates_test.ts`
- `packages/cli/e2e/tests/presentation/quickstart-command-drift_test.ts`
- `packages/cli/e2e/src/application/gates/scaffold/run-documented-stream-example.ts`

S3 and S4 are later slices. Do not start them, and do not touch any other CLI file.

## The defect, measured by the supervisor at `4b988a381`

Run from `packages/cli` cwd, the three targeted test files give **3 passed / 3 failed**, exit 1 —
six tests total. The three failures are all root-relative resolution:

| Location                                  | Failure                                                                        |
| ----------------------------------------- | ------------------------------------------------------------------------------ |
| `service-env-gates_test.ts:100`           | `Deno.stat('packages/cli/e2e/.../configure-service-env.ts')` → `NotFound`      |
| `quickstart-command-drift_test.ts:5`      | `Deno.readTextFile('docs/site/quickstart.vto')` → `NotFound`                   |
| `run-documented-stream-example_test.ts:4` | via the helper's `DOC_PATH = 'docs/site/durable-workflows/streams.md'` at `:3,7` |

The helper also creates its scratch directory root-relatively (`.llm/tmp` at `:10-12`). Your plan's
risk register already names this: fixing only the doc read leaves the scratch path cwd-sensitive.
Anchor **both**.

## Locked decisions that bind this slice

- **L1** — anchor repository-owned paths with `new URL(..., import.meta.url)` / `fromFileUrl`, never
  `Deno.cwd()`. Module location is stable under both root and package cwd; process cwd is the defect.
- **L2** — **preserve production gate command arguments.** Resolve only where the *test* performs
  filesystem verification. The runtime gate correctly interprets `GATE_DIR` relative to
  `context.project.repoRoot`; changing that would expand behavior scope. Do not weaken or delete the
  existing command-parity or existence assertions — an assertion removed to make a test pass is a
  review-blocking finding, not a fix.
- Risk row: module-root arithmetic off by one directory. Derive from each file URL, assert against a
  known repository file, and run from `packages/cli` cwd first.

## Proof obligations before you commit

- The three targeted test files from `packages/cli` cwd: **6 passed, 0 failed**, exit 0 — the exact
  inverse of the 3/3 baseline above.
- The same three files still green from the **repository root** cwd, so the fix is cwd-independent
  rather than cwd-relocated.
- Then the exact canonical command `deno task --cwd packages/cli test` (this is #1604's acceptance).
- Scoped check/lint/fmt over the three owned TS files, non-empty selection each.
- `docs:accuracy` and docs-source-format, with both read-only docs sources unchanged.
- Negative control: each anchored path resolves to the file it names — prove a wrong-directory
  anchor would fail rather than silently pass.

## Hard bounds

- No `scaffold.runtime`, Aspire, Docker, or `e2e:cli`; the gate is coordinator-waived `n/a` and the
  helper's focused semantic test is the applicable consumer proof. Do not substitute or request it.
- No fourteenth path. No docs prose change — `streams.md` and `quickstart.vto` are read and
  executed, never rewritten.
- No new `deno-lint-ignore`, `any`, or `as unknown as`.
- Do not touch the three preserved `plan-eval*` files, S1's landed paths, `deno.lock`, or caches.
- No merge, ready flip, relabel, issue-checkbox mutation, central-state edit, or lease.

## Output

Commit S2 as one slice, push with `git push origin HEAD:refs/heads/fix/package-gate-honesty`, post a
`[PHASE: IMPL]` comment on #1663 with the gate evidence, then **stop**. The supervisor performs a
fresh Tier-A slice review before S3, and the sign-off commit is the supervisor's. Report your thread
id, commit SHA, and head.
