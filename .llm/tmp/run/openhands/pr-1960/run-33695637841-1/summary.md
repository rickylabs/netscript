# IMPL-EVAL Summary — PR #1960 (fix/form-control-props-zod4)

## Summary

Formal IMPL-EVAL session for PR #1960 at head `1edd0062a5986551031db2405383fe60ecd3a9c6` against
trusted base `f589d251a` (true merge-base `8c549c061`; main-side `ba6f1f49a`). The PR is
evaluation-only from this session; no source was modified. Verdict: **FAIL_FIX** — the approved plan
is valid and fully implemented with verified per-slice evidence, but the required CI gate
`mcp-export-corpus` ("MCP export corpus freshness") fails at the evaluated head because the PR
changed the `packages/fresh` public doc surface without regenerating the pinned MCP export corpus.

Evaluator identity: OpenHands, open model `openrouter/z-ai/glm-5.3-flash`, separate session from the
generator (Codex Sol). No reasoning-effort attestation is available on the OpenHands adapter; none is
claimed.

## Changes

- `.llm/runs/fix-form-control-props-zod4--0.0.7/evaluate.md` — evaluator artifact (protocol output,
  gate matrix, attribution evidence, findings, verdict). Committed and pushed to the branch.
- `.llm/tmp/eval-corpus-diff.ts` — read-only in-memory diff probe; deleted after use.
- No source, lock, or config changes.

## Validation

Evaluator-run at head (all exit 0 unless noted):

- Consumer probe: `deno check --unstable-kv --config packages/fresh/deno.json
  packages/fresh/src/application/form/control-props-element-assignability_test.tsx` → PASS (S1 GREEN).
- Adapter: `deno test --allow-all packages/fresh/src/application/form/schema-adapter/schema-adapter.test.ts`
  → 18 passed / 0 failed (five-field Zod 4 full map + exclusive-bound omission).
- Full form suite: 62 passed / 0 failed.
- Doc lint: `deno doc --lint packages/fresh/src/application/form/mod.ts` → exit 0.
- Lock hygiene: `deno.lock` SHA-256 `6c8f90a2…b94d6` byte-identical to `8c549c061` (diff 0 lines).
- Arch-debt: no diff (plan expected none).
- Corpus attribution (decisive): merge-base `8c549c061` PASS; main-side `ba6f1f49a` PASS; PR tip
  `1edd0062a` FAIL-stale. In-memory regeneration probe: committed corpus payload 426332 B vs
  regenerated 426336 B — the PR's `ControlProps.role` widening and `getConstraints()` additions
  change `deno doc` signatures that the corpus embeds. PR-attributable, not base-inherited.

## Responses to review comments or issue comments

- CI run 33695600600 `quality` failure ("MCP export corpus freshness") — attributed to the PR, with
  the three-ref matrix above; fix is mechanical regeneration, not a base or infra problem.
- CI `check-test` (5108 passed / 2 failed) — both failures are the corpus-staleness assertions;
  no other product failure exists at this head.
- CI `close-gate` failure — solely the unticked PR-body DoD box "Separate-session IMPL-EVAL passes
  at the final head" (line 58); this session's evaluation satisfies its claim, the box may be ticked
  with this comment as evidence.

## Remaining risks

- The corpus regeneration commit (required action: `deno task gen:mcp-export-corpus`, commit
  `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts`, push, re-run
  CI) must land before merge; until then `quality` and `check-test` stay red.
- Full Fresh doc-lint aggregate carries 45 pre-existing pinned-base diagnostics outside the form
  entrypoint (recorded in `drift.md`, base-identical) — unchanged by this PR.

OPENHANDS_VERDICT: FAIL_FIX
