# Implementation self-review

This is the implementer's self-review, not an independent IMPL-EVAL verdict. Independent Cockpit cross-family review remains required at the final head.

No local blockers identified. Traced the canary delta and the production SSR phase; provider code is reached through the new CLI runtime glob, not the Fresh UI type import. Both AI globs are removed. File lookup uses the already-discovered workspace root, so relocating built output does not change lookup. Deno resolves the app-owned provider's import map at request time; model data is still schema-validated and provider handle readiness still executes. Missing optional files do not become successful readiness.

The new pre-publish gate builds the shipped embedded loader with Vite, rejects provider traversal independently of the npm cache, and executes the built result across six capability states. The negative control restores the actual glob edge and fails on the original inline npm specifier. Unrelated service dependencies are isolated only in this focused fixture; the separate published full-app Vite build and the required e2e-cli CI verdict cover integration.

Reviewed source footprint: two CLI templates, one existing capability test, maintainer documentation, one internal gate, task/catalog/workflow wiring, and canonical embedded carrier. No public export changes, Fresh UI edits, lock changes, credentials, private execution paths or unrelated source changes. The auth BFF imports focused contracts/client contributions rather than provider implementations.

Limits: warmed published baseline can pass; cold production artifact supplies the original failing evidence and the controlled regression supplies a deterministic pre-publish failure. Focused no-Aspire fixture uses two empty generated registry stand-ins. Full local scaffold.runtime was expressly prohibited. e2e-cli CI, Cockpit exact-head review and next-canary production E2E are still required; no merge/publication certification is claimed.
