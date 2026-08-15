# Drift Log: sdk cache surface and telemetry

## 2026-08-15 — slice archetype is stricter than package inventory

- **What:** The brief declares Archetype 3; doctrine inventory labels `packages/sdk` Archetype 2.
- **Source:** slice brief; `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md:53`.
- **Expected:** One selected archetype aligned with the inventory.
- **Actual:** This slice changes runtime failure behavior, so it retains the owner-selected stricter
  Archetype 3 gates without reclassifying the package.
- **Severity:** minor.
- **Action:** accept for this run; PLAN-EVAL should verify the gate set.

## 2026-08-15 — `KvProvider` type widened but successful systems remain bounded

- **What:** #1619 says `KvProvider` is only `redis | deno-kv`.
- **Source:** `packages/kv/application/shared.ts:68-82`, `:228-250`.
- **Expected:** Two-value union.
- **Actual:** Type is `redis | deno-kv | nitro | auto`; `nitro` throws before activation and `auto`
  resolves to a valid concrete system, so no shipped successful invalid descriptor was found.
- **Severity:** minor.
- **Action:** correct the research statement; no product scope change.

## 2026-08-15 — current SDK doc-lint baseline is red

- **What:** Full-export `deno doc --lint` is required as the publish documentation bar.
- **Source:** `deno task doc:lint --root packages/sdk --pretty`; raw cache-entrypoint doc lint.
- **Expected:** Clean publish documentation surface.
- **Actual:** Pre-existing `private-type-ref` diagnostics, including three in
  `packages/sdk/src/cache/kv-cache-store.ts`, which is outside the declared surface.
- **Severity:** significant.
- **Action:** stop before implementation and request the explicit ruling in `scope-boundary.md`.

