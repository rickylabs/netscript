# IMPL-EVAL — evaluate.md (independent)

Session: opencode/go glm-5.3-flash, reasoning effort max (independent session; no self-certification).
Scope: bounded review of PR2078 continuation commit `e366fb3b784ccda3b6d0b62be6000af0a1e3f87a`
("fix(ai): honor nullable effort and reject unsupported top_k") against baseline
`6f6cbdf030d7595d1730272d0a74aedd66225069`, limited to the two guards and the expanded
assertions in the latest product slice. Earlier independent source evaluations remain in the
prior run and are not repeated here.

## Verdict

**Independent PASS for the bounded source slice.**

Exact HEAD evaluated: `e366fb3b784ccda3b6d0b62be6000af0a1e3f87a` on branch
`fix/anthropic-forward-compatible-2063`. Working tree clean before and after every step; all
mutations restored and verified byte-identical (cmp + md5).

## What was verified

### 1. The two guards at HEAD (source read before any run)

- **Nullable native effort** (`packages/ai/src/adapters/anthropic.adapter.ts:90`): the whitelist
  gate is `effort !== undefined && effort !== null …`, so a supplied `effort: null` inside
  `output_config` is treated as "explicitly unset" and reaches the native wire instead of being
  rejected. Non-string and out-of-set values (`invented` etc.) are still rejected, and omitted
  effort stays omitted.
- **Supplied `top_k` rejection** (`packages/ai/src/adapters/anthropic.adapter.ts:119`):
  `options.top_k !== undefined` now rejects every supplied value — including `0` — with
  `InvalidModelOptionsError` ("requires omitted top_k"), ahead of the temperature/`top_p`
  default-value loop that previously let `0` through. Off-list sampling handling is unchanged.

Both guards run only for the exact current model IDs (`claude-opus-5-5`, `claude-fable-5-1`,
`claude-sonnet-5-5`) via `isCurrentClaude`; legacy catalog IDs keep prior behavior, which the
slice's own regression ("valid call override … bundled legacy models remain supported") pins.

### 2. Expanded assertions cover both required claims

In `packages/ai/tests/anthropic_forward_compatible_test.ts`:

- Test "anthropic: off follows exact model thinking semantics and native effort levels are
  retained" now iterates `effort` over `['low', 'medium', 'high', 'xhigh', 'max', null]` on each
  current model, asserts the native request body carries `output_config: { effort }` (i.e. `null`
  survives the merge), **and now also** drives the per-request
  `options.providerOptions.output_config.effort` surface through the same loop and asserts the
  same native body result. The per-call `modelOptions` surface is exercised in the same test.
  This is precisely the "null reaches native wire through request providerOptions and per-call
  modelOptions" claim.
- Test "anthropic: effective options reject incompatible current-model settings before IO" adds
  `{ top_k: 0 }` to the invalid set already holding `{ top_k: 3 }`, runs both surfaces
  (`modelOptions` and request `providerOptions`) on each of the three exact current models, and
  finishes with `assertEquals(requests.length, 0)` — the concrete proof of rejection **pre-IO**
  (no fetch ever fired).
- The duplicated assertion is not vacuous: the two entry paths converge in `resolveModelOptions`
  (`tanstack-chat-client.ts`), and merge semantics differ by surface, so asserting the native
  body for each surface is meaningful.

### 3. Focused structured regression run (HEAD, unmutated)

`run-deno-test.ts --allow-all packages/ai/tests/anthropic_forward_compatible_test.ts`
(Deno 2.9.5 pinned on PATH): structured summary `passed: 11, failed: 0`, exit 0.

### 4. Isolated reverted-guard mutations, each failing, each restored

Mutation scratch preserved outside the repo (temp copy). Tree verified clean after each restore.

- **Mutation 1** — reverted the nullable-effort gate back to `effort !== undefined` only.
  Result: exit 1, failed summary exactly "InvalidModelOptionsError … accepts … xhigh or max"
  in test "anthropic: off follows exact model thinking semantics and native effort levels are
  retained" — i.e. the `null` effort case now wrongly rejects. Matches the worklog's recorded
  baseline-null exit-1 finding. Restored → clean tree, suite exit 0 again.
- **Mutation 2** — reverted the `top_k` guard back to the old `top_k: 0` default-value loop
  entry. Result: exit 1, failed summary exactly "AssertionError: Expected function to reject" in
  test "anthropic: effective options reject incompatible current-model settings before IO" —
  i.e. supplied `top_k: 0` is no longer rejected. Matches the recorded baseline-zero exit-1
  finding. Restored → clean tree; byte-identical restore verified via `cmp` + md5 before the
  backup was removed.

Both mutations were isolated single-condition reverts; no unrelated source was touched, no
revert of any other compiled output, no config/lock edits.

### 5. API/export graph in this slice

`git diff 6f6cbdf…e366fb3b7 -- packages/ai/mod.ts packages/ai/deno.json deno.json deno.lock`
is empty for this slice's difference-range inspection. The slice commit itself touches only
`packages/ai/src/adapters/anthropic.adapter.ts` and the regression file (plus this run's
`worklog.md`/`impl-eval-brief.md`): no new public API, no export-surface, dependency, lock, or
config change. Prior slices' wider state (carriers, freshness, publication dry-run) is inherited
from the prior run's recorded evidence and was not re-run here, per the bounded brief.

## Boundaries observed

No source/config/lock changes; no worktrees, branch switching, pushing, or PR changes; no
repo-wide forensic reruns; no live inference or CI waiting; no worktree/branch mutation; all
writes stayed in this checkout or temp storage which was cleared. Public surface unchanged in
this slice; carriers were not re-verified here (pinned Deno freshness previously recorded).

## Out of scope / recorded for owner (not new findings introduced by this slice)

- The shared main critical dependency audit remains a **pre-existing separate owner blocker**
  unrelated to request handling dependency maintenance in this source slice; it is not a
  regression introduced or fixed here.
- **No claim is made** about stable publication or released-consumer acceptance. Prior run
  explicitly recorded released-package acceptance as incomplete; that status is unchanged by
  this slice and remains a release-acceptance step outside this source PR.

## Conclusion

The bounded source slice is correct and regression-proven: e366fb3b7 preserves native nullable
effort and rejects every supplied `top_k` (including `0`) pre-IO on all three exact current
model IDs, through both option surfaces, with fresh assertions tied to the guards by
independently reproduced single-guard mutations. Verdict: PASS for the slice; branch
merge-readiness additionally depends on the separate CI/review-thread close-out steps that this
evaluation does not perform.
