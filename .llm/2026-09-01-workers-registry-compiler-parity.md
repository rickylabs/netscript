# 2026-09-01 — Workers registry compiler JobConfig parity (#1875)

Run dir: `.llm/runs/fix-workers-registry-compiler-parity--1875/` · draft PR #1882 · branch
`fix/workers-registry-compiler-parity`.

The workers registry compiler had a live silent-loss defect: normalized `JobConfig` fields
`description`, `schedule`, `permissions`, `metadata`, and `retention` were omitted from generated
job definitions. The compiler now emits all five, and its golden test derives required keys directly
from `Object.keys(JobConfigSchema.shape)`. The assertion enforces schema → output coverage while
tolerating compiler-only fields and duplicates no schema constraints, defaults, or field list.

Focused structured check/lint/fmt passed across 102 plugin TypeScript files, the focused parity test
passed 1/1, `quality:gate` exited 0, and `deno.lock` stayed unchanged. A supplemental JSR audit
remained red only on pre-existing findings and was recorded as `BASELINE_FAIL`. Per owner direction,
no runtime, Aspire, Docker, or `e2e:cli` gate ran, and the three coordination-excluded files were
not touched.

Separate Opus 5 low slice review passed. The prescribed native Fable 5 formal evaluator was blocked
by weekly quota, and the OpenRouter GLM 5.3 Flash fallback could not complete an artifact. A fresh
native Opus 5 medium session transparently completed the opposite-family formal evaluation against
`e400cd3f9998c16302c7c74abde440f86b602651` and returned `PASS` with no blocking findings. It
independently proved that a synthetic future schema key and a removed emitted key both fail loudly,
and that the new `undefined` emissions introduce no generated-module type regression.

PR #1882 opened draft with `status:impl`, milestone 0.0.7, the requested namespaced labels, and
`Closes #1875`. During evaluation, an external owner/coordinator transition made it non-draft and
advanced it to `status:impl-eval`; that foreign state was preserved. Owner-authored merge commit
`ad5eb3041` also synced current main without changing workers/core/lock paths. Ready-merge and merge
close-gate authority remains with the milestone supervisor.
