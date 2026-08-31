use harness

## SKILL

- netscript-harness — run loop, commit-by-slice + push, run-dir artifacts.
- netscript-tools — CI/workflow evidence-carrier correctness; classifier self-test contract.

## D-111 bounded correction: D-110 broke the classifier self-test contract

D-110 (commit `144988b86`) narrowed both runtime jobs' `Upload E2E report artifact` `path:` lists
from the original four patterns down to two, and this broke
`.github/scripts/ci-classify-changes.test.ts:816` ("workflow: sqlite runtime uses sibling diff guard
and fails closed", assertion at line 862) — that self-test contractually asserts the
`.llm/tmp/**/report*.ndjson` pattern is present among the upload paths. Reproduced locally on this
exact worktree/head: `deno test --allow-read --allow-env .github/scripts/ci-classify-changes.test.ts`
→ `59 passed, 1 failed` (the same failure CI hit).

### Scope (bounded, CI-only)

In `.github/workflows/e2e-cli.yml`, in **both** the `scaffold-runtime` and `scaffold-runtime-sqlite`
jobs' `Upload E2E report artifact` step:

1. Restore the original four `path:` patterns exactly as they were before D-110:
   ```
   .llm/tmp/**/report*.json
   .llm/tmp/**/report*.ndjson
   **/e2e-report*.json
   **/listener-unreachable-receipt.json
   ```
2. **Keep** `include-hidden-files: true` (added by D-110) — that is the real fix for the hidden-
   directory exclusion (`.llm` is dot-prefixed) and must stay.
3. Do not change gate logic, receipt shape, health-check behavior, the fixture's write location, or
   the classifier script/test itself. No PLAN-EVAL, no DeepSeek/OpenRouter rerun.

### Verify before pushing

Run `deno test --allow-read --allow-env .github/scripts/ci-classify-changes.test.ts` locally and
confirm all 60 tests pass (the one that failed above must now pass).

### After this change

Commit and push. The coordinator will dispatch exactly one fresh exact-head `workflow_dispatch` run
and inspect both uploaded artifact archives directly to confirm the receipt and report JSON/NDJSON
are now present, with the classifier self-test green.
