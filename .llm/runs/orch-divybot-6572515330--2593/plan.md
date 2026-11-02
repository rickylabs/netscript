# Plan & Design — READY FOR REVIEW

Feature-tier release regression, one scoped owner fix and guard. PLAN-EVAL: N/A for a focused import-boundary correction using existing surfaces; no new runtime abstraction. Cross-family IMPL-EVAL belongs to the Cockpit lane per owner instruction.

1. Bootstrap the reviewable harness record and draft PR.
2. Reproduce published canary build with the relevant AI fixture, trace the canary delta, fix the smallest module boundary, and add a pre-publish regression check with a meaningful negative control.
3. Run scoped structured check/test/lint/fmt, quality:gate and applicable owner gates; record before/after Vite evidence, self-review and lessons. Push final head and request Cockpit exact-head evaluation. The coordinator arms the required e2e-cli CI verdict and owns merge/canary.

Locked decisions: no aliases/externals workaround, no publication, no local full runtime E2E, no lock churn, no force-push/rebase, no labels/milestones. A runtime-owning fix uses Archetype 6 (CLI template/tooling); a contract-only change uses Archetype 1. No structural redesign is justified until the failing edge is identified. Risks: local-source graph can hide inline npm resolution; use exact published version. Temporary filesystem is noexec; native modules must use an executable project-owned dependency location without deleting caches. No accepted new architecture debt. Public API expansion, cosmetic Fresh UI work and release operations deferred.
