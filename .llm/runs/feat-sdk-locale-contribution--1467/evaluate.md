# Evaluation: PR #1922 -- feat(sdk): ship locale as the non-auth contribution proof (#1467)

> IMPL-EVAL final pass. Evaluator is a separate OpenHands session (open model via OpenRouter,
> `z-ai/glm-5.3-flash`); reasoning-effort identity not attested by the adapter.

## Metadata

| Field          | Value |
| -------------- | ----- |
| Run ID         | `feat-sdk-locale-contribution--1467` |
| Target         | PR #1922, head `f570dcde4cdcfa09e00a0f696eb96df4daebb081`, base `ec848e6b0334ec8fcd2bc66ba009305d35367b01` (trusted), merge base `634b83d64` |
| Archetype      | 2 -- Integration (verdict Keep) |
| Scope overlays | docs (SDK README + site page) |
| Evaluator      | OpenHands IMPL-EVAL session, 2026-09 (independent of Codex implementation lane) |

## Process Verification

- Approved plan `.llm/runs/feat-sdk-locale-contribution--1467/plan.md` at impl commit `28e6ca75d`;
  `PLAN-EVAL: N/A` recorded and re-confirmed appropriate (impl-phase profile). Architecture
  LOCKED: `createLocaleSdkClientContribution()` beside the existing client descriptor; product
  ceiling 9.
- Changed surface audited at head `f570dcde4`: 8 product files (<= ceiling) -- site doc, SDK README,
  `locale-contribution.ts`, `client/mod.ts`, 3 tests, 1 type fixture; generated carriers tracked
  separately per plan. Boundary respected: `prepared-call.ts`, transport, trace, and query-key
  algebra untouched in the full diff.
- PR body reviewed in full: bare `Issue: #1467` + `Part of #1348` is the correct form for partial
  work under epic #1348 (no closing keyword, per `.agents/skills/netscript-pr`); labels +
  milestone `0.0.7` present. PR is OPEN, not draft, labeled `status:impl-eval`.
- Drift log read: one minor drift (bearer reference branch `feat/sdk-credential-contribution` @
  `fde87fe10` not an ancestor of `origin/main` `77ad823dc`) -- correctly treated read-only, no
  merge/cherry-pick performed.
- No review threads exist (`gh pr view --json reviews` = `[]`, `pr-review-comments.json` empty);
  nothing to answer.

## Static Gates

- `deno check --unstable-kv ./mod.ts ./src/client/mod.ts`: exit 0 (evaluator-run).
- Generator-recorded (worklog `d8234496d`/`6969d330b`, verified consistent): SDK check/lint/fmt
  exit 0 (103 files), JSR audit 0, publish dry-run OK, full-export doc-lint A/B zero new
  diagnostics, `quality:gate` 0, `arch:check` 0, `git diff --check` 0, carrier `gen:*` /
  post-commit `check:*` exit 0 in required order.
- CLI lint/fmt exclusion drift correctly recorded in `drift.md` with `check:assets-barrel` as
  authority; no silent gate weakening.

## Fitness Gates

- Doctrine fitness: Archetype 2 Integration placement re-audited -- locale has no plugin
  lifecycle, manifest, backend adapter, or separately versioned concern, so package split is
  correctly rejected; no `deno.json` export-map change needed (root barrel re-exports
  `src/client/mod.ts`).
- Partition-law conformance: response-cache law (`partitioned`) verified in
  `client-contribution-cache-query_test.ts` -- declared-partition derivation without header reads;
  equal-same / unequal-different keys.
- Header ownership: descriptor owns `accept-language`; deterministic duplicate/reserved ids in
  both tuple orders (`locale-contribution_test.ts`).

## Runtime / Consumer Gates

- Evaluator-run focused tests: `tests/locale-contribution_test.ts` +
  `tests/client-contribution-cache-query_test.ts` -> 16 passed / 0 failed, exit 0.
- Evaluator-run full SDK suite (`deno test --allow-all ./tests/`): 128 passed (101 steps) /
  0 failed, exit 0. Generator wrapper recorded 230 / 0; difference is reporter granularity only,
  both green.
- Consumer surface verified in type fixture `sdk-client-contributions-rfc_type.ts`: direct /
  generated / query context inference incl. negative case; README doctest runs in-suite.
- Docs spot-checked: site doc states locale is attached explicitly, never automatic; auth+locale
  composition example present; README and site page agree.

## Anti-Pattern Check

- No `deno-lint-ignore` / `as unknown as` introduced to green a wrapper.
- No false-done signals: all "(to be completed)" placeholders in this file filled by this pass;
  no gate was skipped without a plan-backed rationale.
- Lock hygiene: `sha256sum deno.lock` at head =
  `e52c167e48e78a3c822ee1e63d5874401e1a02d0c49c214e1cd2df189272c46d`, identical to the worklog
  baseline and unchanged across all six commits -- zero churn; `deno.lock` not committed by this run.

## Arch-Debt Delta

- `.llm/harness/debt/arch-debt.md` contains no locale entries; the change introduces no doctrine
  violation and deepens no existing entry, so no registry edit is required (verified correct).

## Findings

- Informational (no action): full-suite pass count differs between direct `deno test` (128 + 101
  steps) and the generator's wrapper run (230) due to reporter granularity; both exit 0 with zero
  failures. No impact on any gate.
- No severity >= minor findings.

## Verdict

`OPENHANDS_VERDICT: PASS` -- approved scope complete; required static, fitness, runtime, and
consumer gates have evidence or are not applicable; no unrecorded doctrine violation; no debt
change; docs and run artifacts sufficient for resume.
