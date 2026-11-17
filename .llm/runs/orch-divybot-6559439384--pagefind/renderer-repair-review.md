# CI follow-up (slice 4): frozen renderer bridge for PR #2575 on top of `a09a9a2`

**Slice content: PASS. Follow-up IMPL: PASS.** This covers the uncommitted working tree on `a09a9a2`. Hosted readiness is still not certified.

## What changed, and is the scope right

- **The source change is the right fix.** In `docs/site/_plugins/design-system_test.ts`, the child process switches from `--no-lock` to `--frozen` (one argument), and the doc comment is updated. The child still uses the explicit site `--config`.
- **The README matches.** `docs/site/_plugins/design-system/README.md` documents the same command and the reason for it.
- **The scope expansion was recorded first.** `supervisor.md`, `plan.md` and `drift.md` add this bridge and its README to the write surface, with the contract that any test importing the fully configured site must use the reviewed lock. `PLAN-EVAL: N/A` is justified: this is a bounded repair with no API or architecture choice. Nothing else changed: no age override, no package or lock change, no renderer, layout, token or S8 edit. `git diff HEAD -- ':!.llm/runs'` lists exactly these two files.
- **The fix covers every affected test.** `renderer-fixture.ts:6` imports `../../_config.ts`, which pulls in Pagefind. The other two lockless fixtures don't need changing: `deno info` finds no Pagefind anywhere in the dependency graph of `markdown-render-fixture.ts` or `scenario-picker-fixture.ts` (`_config` appears only in a comment).

## Is the cold-cache case valid? (I reproduced it myself)

| Run | Result |
|---|---|
| Old command (`--no-lock`) with a fresh, empty `DENO_DIR` | Exit 1: `Could not find npm package 'pagefind' matching '1.6.0'`, with the hint that it is blocked by the minimum dependency age policy, raised from `lume deps/pagefind.ts`. This matches the CI test-3 failure. |
| Corrected root bridge with a *different* fresh, empty `DENO_DIR` | 1 passed, 0 failed. |
| Locks | The site and root locks were byte-identical before and after both runs. |

So the failure was a real regression caused by the new pin, not a flaky test. `--frozen` fixes it by resolving from the reviewed lock, which keeps the default 24-hour age policy in place for everything else.

## Does the earlier feature and browser proof still hold?

**Yes.**

- The private `renderer-bridge-strict.exit` is `0`, and the log's outcome line reads 1116 files with `differences: []`.
- I hashed the current `docs/site/_site` myself and compared all 1116 files to `merged-browser-manifest.json`: **0 differences**. That manifest is what the complete browser run used at `4ccaa4a` (158 passed, 6 existing census skips, 0 failed, 0 flaky, 72 axe reports with no serious or critical findings).
- The repair changes only test code and a README, and no built byte changed. So the browser, strict and feature acceptance carry over without a new browser run.
- The `renderer-bridge-quality` receipt reports `quality-gate`, PASS, exit code 0. Its recorded head is `a09a9a2`, but it ran against the uncommitted working tree, so it does not stand in for the post-commit proof below.

## What remains before READY

1. **Post-commit proof.** After the sign-off commit, re-prove strict bytes at the exact new head and confirm the output still equals `merged-browser-manifest.json`.
2. **Hosted checks.** Core CI `test-3`/`check-test` and the Pages jobs must pass on a fresh run at that exact head. The earlier failure at `a09a9a2` is resolved only once that new run shows it green. Until then, don't call it READY.
3. **CLI runtime is still unproven.** Hosted CLI E2E is skipped under the opt-in policy, since no labels are applied. The local run fails without Docker. That is neither a pass nor proof.
4. **PR state.** The PR is now `ready_for_review`, which the delivery instruction requires after local acceptance. It is `Refs #2453` with no closing keyword, has 0 labels, and the cockpit owns the merge.

**Slice 4 content: PASS. Follow-up IMPL: PASS locally. Hosted: pending a fresh run at the new head, not READY.**
