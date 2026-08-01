# Plan: make fresh-ui tests self-contained on a clean checkout

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-990-fresh-ui-test-task--clean-checkout-test` |
| Branch | `fix/990-fresh-ui-test-task` |
| Phase | `plan` |
| Target | `packages/fresh-ui` test infrastructure |
| Archetype | `4 - Public DSL / Builder` |
| Scope overlays | `none` (no product UI or route behavior changes) |

## Archetype and Doctrine

`@netscript/fresh-ui` is classified as Archetype 4 with a current `Keep` verdict. This slice affects
A14 plus F-9/F-10: its checked-in test command must declare the capabilities its integration tests
exercise, and each test must establish filesystem state it assumes.

## Goal and Scope

- Change only `packages/fresh-ui/deno.json` and
  `packages/fresh-ui/tests/registry/markdown-renderer.test.ts` in the product/test slice.
- Preserve the lock flag, unstable KV flag, globs, and deliberate in-repo `.llm/tmp` location.
- Do not alter package exports, source, scaffold output, CI, or other packages.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Grant `--allow-read --allow-write --allow-run` and explain it immediately above the task. | Read is needed for the suite and `Deno.execPath`; both affected tests write/remove temporary workspaces and spawn Deno subprocesses. The first test passed with this measured set and no env grant; the full suite proves it against both tests. |
| D2 | Create `.llm/tmp` recursively before `makeTempDir`. | The parent is ignored and absent on clean checkouts, so the test must establish it. Keeping this particular in-repo location is an owner-imposed, unverified constraint and the lower-risk change. |
| D3 | Run the full test task once after the fix and only after deleting `.llm/tmp`. | Matches the acceptance proof and avoids repeating the expensive production build. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Scoped flags versus `--allow-all` | resolved now | D1 locks the empirically minimum read/write/run set; no env or net grant is included. |
| Justification location | resolved now | Keep the capability comment in the affected test file because repo release tools strict-parse `deno.json`. |

## Commit Slice

| # | What it proves | Gate | Files |
| - | --- | --- | --- |
| 1 | The checked-in fresh-ui test task passes without ambient permissions or a pre-existing ignored temp parent. | Owner's three scoped validation commands | `packages/fresh-ui/deno.json`; `packages/fresh-ui/tests/registry/markdown-renderer.test.ts`; run artifacts |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| JSONC comment breaks strict manifest tooling. | Keep `deno.json` strict JSON and place the rationale in the affected test file. |
| Full suite recreates `.llm/tmp`, masking the clean-checkout condition. | Delete the exact parent immediately before the one full run. |
| Validation mutates `packages/fresh-ui/deno.lock`. | Inspect and restore incidental lock churn before committing. |
| The permission set widens later without evidence. | Keep a comment naming temp-workspace write and subprocess-spawn needs; add only a permission named by an observed denial. |

## Anti-Patterns and Fitness Gates

| Item | Status | Plan/evidence |
| --- | --- | --- |
| AP-19 / F-9 permission declaration | existing defect | Make the test task's capability contract explicit and justified. |
| F-10 test shape | existing defect | Establish the ignored temp parent inside the test. |
| F-6/F-7 public/JSR surface | unchanged | Manual config audit; no export, dependency, or publish-filter change. |
| Quality/architecture gates | owner-constrained | No product source change; manually inspect exact two-file diff. |

## Validation Plan

1. Remove `/home/codex/repos/fix-990/.llm/tmp`, then run `cd packages/fresh-ui && deno task test`
   once to completion; require `ok | N passed | 0 failed`.
2. Run `deno run -A .llm/tools/run-deno-check.ts --root packages/fresh-ui --ext ts,tsx`.
3. Run `deno lint packages/fresh-ui` exactly as requested.
4. Run `deno publish --dry-run` from `packages/fresh-ui` to close the JSONC publish-path risk.
5. Restore incidental `packages/fresh-ui/deno.lock` churn and verify only intended changes remain.

## Deferred Scope

- Existing fresh-ui public-doc private-type debt, all product UI behavior, CI, scaffold runtime E2E,
  and repo-wide quality commands.
