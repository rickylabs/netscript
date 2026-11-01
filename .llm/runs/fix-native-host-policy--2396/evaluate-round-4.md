# IMPL-EVAL round 4 (final) for PR #2421 at head `a4dc7053`

The source is accepted and the round-3 merge conflict is fixed. CI and runtime proof are still pending, and nothing here should be read as green.

## Round-3 blocker: fixed
- **Live state:** `gh pr view 2421` shows the head at `a4dc7053`, not a draft, `mergeable: MERGEABLE`, base `4aa734e2`.
- **Merge commit `a45a1db4`:** a normal two-parent merge of `2a9efb05` and `4aa734e2`. `git show --remerge-diff` shows hand-resolved content in only three tracked non-run files:
  - the two generated documentation/publish files that conflicted;
  - one wording change in `arch-debt.md`.
  - The run-record files under `.llm/runs/` also differ but carry no source.
- **No reverted main changes:** `git diff 4aa734e2..a4dc7053` outside the run directories lists only #2396's own 74 files. Every file from the two incoming commits (#2476 telemetry/locked fixture, #2481 worker retry/dead-letter) matches main exactly. That includes `deno.lock` and `packages/fresh-ui/deno.lock`, so the lockfiles have no changes of this branch's own.
- **Feature source unchanged since round 2:** `git diff ac50f545..a4dc7053` over the workers/streams service source, the workers `deno.json` and `streams/` folder, and `packages/service`, `packages/plugin`, `packages/sdk` and `packages/fresh/src` changes only the `run-child-health-process` files and two test files, all identical to main (#2476).
  - The factories, legacy entrypoints, export maps, fixture location and type-export lists are the same as round 2.
  - #2481 doesn't touch `services/src`. The new factory and the legacy entrypoint build the worker runtime through the same code, so the new retry behavior applies to both alike.
- **Final commit `a4dc7053`:** changes only run records under `.llm/runs/fix-native-host-policy--2396/`.
- **Publish file list:** 93 files, up from 92. The only addition is `worker/job-dead-letters.ts` from main. No test or helper file is included.

## Debt: unchanged
- **Workers 22 / streams 21 type-export debt:** names unchanged, 2026-11-10 deadline kept.
- **`HOST-POLICY-PUBLISHED-GRAPH-2396`:** unchanged and accepted.
- **`WORKERS-HOST-METADATA-CARDINALITY-2396`:** only the Reason line changed. It now says other workers folder-size findings are inherited from main, which is accurate because #2481 grew `worker/` on main, not in this PR. The 20-entry cap, scope, owner and deadline are unchanged, so I accept it.

## Blockers
None in source, architecture, publication shape, migration or merge integration.

## Live CI (none of this is green proof)
- **Merge state:** `BLOCKED`, because required checks are still running.
- **Running or queued:**
  - in progress: `code-quality`, `fresh-ui-quality`, `Fresh UI design browser evidence`, docs-site `classify docs-site changes`;
  - queued: one `breaking-migration` run.
- **Succeeded:** `classify Fresh UI changes` and one `breaking-migration` run; neither proves this change works at runtime.
- **Skipped:**
  - e2e-cli: `classify changes`, `scaffold-static`, `scaffold-runtime` (postgres), `scaffold-runtime-sqlite`, `desktop-native-linux`, `scaffold CI lane visibility`;
  - also `public-surface-diff`, `code-quality-repo` and the OpenHands `agent`/`authorize` jobs.
- **Runtime gate:** `e2e-cli-gate` is not applied, so the `scaffold.runtime` gate has not run on this head.

## Outstanding external proof (not implementation blockers)
1. Core and quality CI must finish green on `a4dc7053`.
2. The coordinator must apply `e2e-cli-gate`, and both runtime lanes must pass on this exact head.
3. Real published-package proof stays owed by the release coordinator (`HOST-POLICY-PUBLISHED-GRAPH-2396`: `e2e-cli-prod` on the first 0.0.9 canary, before stable). Publish dry-runs and the file list are static proof only.
4. **Known red items, same as main:** the full-export doc lint fails at main's counts (workers 2, streams 3, Fresh 45; service and both factory paths at 0). The workers OpenAPI document returns 500 as on main; the test proves only that this branch matches main. Neither is green.
5. **Local test numbers:** the 1504 passed / 0 failed / 4 ignored run is the implementer's evidence, not mine. The four ignored Redis cases come from main and need CI's Redis.
6. **Stale field:** `gate-summary.json` still says `runtimeCI` is unproven "while draft". The PR is no longer a draft, but the gate is still unproven, so the field is outdated wording, not a wrong claim.

This verdict approves the source only. Merging still depends on items 1–2 being green on this exact head, and the coordinator alone decides the merge.

VERDICT: MERGE a4dc70531c3e3a8c3139ecfa16419126c9551463
