## Summary

Verify the published README as the first application on the hosted runner, while retaining normal
Docker image and NuGet SDK download caches. Docker is required by this walkthrough's containerized
configuration, not universally by NetScript/Aspire. Preserve bounded service-failure logs before
owned cleanup so a failed readiness check explains its actual cause.

## Scope

- Refs #1881. The exact final published version must still pass all README commands before issue closure.
- Workflow ordering, root prerequisite prose, private E2E diagnostics and regression tests only.
- No published framework/template/version changes, daemon changes, cache deletion or gate bypass.
- Current source `2743cd0df771ec902799c5d281e6e1111600b331`, includes current main `075ea8ed7`.

## Slices

- [x] README runs before any other application; pinned NuGet SDK package cache retained.
- [x] Fresh application-state baseline fails closed; image count is diagnostic-only.
- [x] README commands stay unchanged; published suite and owned-cleanup receipts remain required.
- [x] Failed users readiness captures one read-only 2-second/40-line console snapshot, preserving the original verdict.

## Evidence

- Cache-policy focused tests: 11 pass / 0 fail; selected check, lint and format pass.
- Diagnostic regression RED: 2 pass / 2 fail; GREEN combined focused suite: 15 pass / 0 fail.
- Diagnostic check/lint/fmt: 2 selected files, zero findings. Diff-check passes.
- Existing database scaffold/generator regressions on integrated head: 13 pass / 0 fail.
- Same independent GLM evaluator `0039d1ad-72eb-4047-964c-8b326ff65902`: original PASS at832e53720,
  cache/prose delta PASS at4092014cf, SDK-cache correction PASS at6e9bb276c; final diagnostic PASS at2743cd0df.
- Hosted rehearsals33760126265 and33761336744 consumed existing `0.0.7-canary.9`, publishing nothing.
  Baseline, commands1–10 and owned cleanup pass. Readiness command11 fails because canary.9 lacks
  `database/postgres/schema/.generated/zod/crud.ts` when users starts. The second run captured this
  exact module error in its child receipt; diagnostics exit0 while primary exit18 remains intact.
- That scaffold correction already merged in #1974 (`953b0849c`), after canary.9; current main seeds
  the required CRUD Zod file before startup. Old canary failure remains recorded, not relabeled green.
  Final canary10 must exercise the newly published source and pass the complete production suite.
- CI33761323539 check-test and quality SUCCESS; primary review-thread gate PASS (0 unanswered).

## Harness

Run `.llm/runs/readme-cold-release-proof--0.0.7/`; primary-owned bounded implementation, separate
independent evaluator session. PLAN-EVAL N/A (no architectural decision). `impl-eval:skip` prevents
duplicate cloud evaluation, not the independent evaluation recorded above. Tracked harness retained.

## Definition of Done

- [x] Fresh application ordering with normal caches and configuration-specific prerequisites.
- [x] Failed probes fail closed; diagnostics cannot turn failure into success or restart a service.
- [x] Existing published runtime suites and owned-cleanup evidence remain intact.
- [x] Existing-version rehearsal inspected; exact old-package failure and current-main correction identified.
- [x] Final diagnostic delta independent review passes.
- [x] Required check-test and quality CI pass at the immutable current head before merge.

Remaining issue acceptance is intentionally outside this PR's closing keywords: final published
README/canary pair, then #1881/#863/#1712 closure and stable publication with its own green pair.
