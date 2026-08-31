# 2026-08-31 — SDK browser full-key normalization (#1824)

Run dir: `.llm/runs/fix-sdk-browser-full-key-normalization--impl/` · draft PR #1831 · branch
`fix/sdk-browser-full-key-normalization`.

The SDK browser full-key builder now normalizes Aspire resource-name segments with Aspire's exact
`/[^a-zA-Z0-9_]/g` contract. Hyphenated names such as `sagas-api` therefore produce
`VITE_services__sagas_api__http__0`; valid names remain unchanged. Shorthand and server-side key
construction are guarded and unchanged. A test-only SDK→Aspire public-subpath assertion pins both
implementations together without adding a production package dependency.

The run preserved contract-first RED→GREEN evidence: the test-only commit failed with 5 passing,
6 failing, and 4 unique expected normalization mismatches; the implementation made all 11 focused
results pass. SDK tests passed 86/86, Aspire tests 91/91, scoped check/lint/fmt passed, repository
check reported `failedBatches: 0`, and `quality:scan` plus `arch:check` exited 0. No runtime was
started under the owner's host-wide constraint, and `deno.lock` stayed unchanged.

Both commit slices passed separate native Opus 5 review. The canonical native Fable 5 formal
evaluator launch was blocked before a turn by an HTTP 429 monthly spend limit; the lane-policy
OpenRouter fallback (`z-ai/glm-5.3-flash`, session `38e40773-fe64-4eed-b737-d597e9df575e`)
independently reproduced RED→GREEN and every requested gate and returned IMPL-EVAL `PASS`.

PR #1831 remains draft with `status:impl`, milestone 0.0.7, the requested namespaced labels, and
`Closes #1824`. The milestone supervisor retains ready-for-review and merge authority.
