# Drift log

## 2026-08-07 — minor research refinement

The initial diagnosis named seeded Prisma and missing AppHost dependencies as separate defects. Exact local reproduction showed both are expected pre-generation state exposed by quickstart step 3 running the whole-project check before the documented restore/generate steps. Scope narrowed from three symptoms to two roots; no product-template change or acceptance expansion is needed.
