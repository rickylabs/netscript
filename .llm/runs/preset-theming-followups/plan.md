# Plan & Design — READY FOR REVIEW

PLAN-EVAL: N/A. These are bounded diagnostics, guidance and performance cleanups with owner-defined contracts; the only gate policy decision is a strict content-hash baseline for existing CLI debt. No new public abstraction or runtime lifecycle.

Locked: keep credentials redacted; reject query and fragment with distinct messages. Index existing Figma objects once while preserving duplicate rejection and pre-mutation validation. Hoist schemas to module scope. Use the root npm catalog for plugin Zod. Quote generated get_doc slugs and include override registration/build in page hints. Move legacy upgrade guidance to a linked page to preserve get_doc headroom. Cover all CLI TS/TSX using structured wrappers and a no-exclude config; only unchanged baseline files may retain old findings. Do not grow the baseline automatically.

Risks: hash baseline makes editing a legacy file require cleanup of that file; document the remediation path. Doc move needs links and generated carriers. Lock peer-ID renames may be a valid Deno migration; retain if provenance proves intentional. Gates: CLI suite, focused Figma/ratchet regressions, scoped quality, quality:gate, CLI JSR audit, release:preflight, docs:links/accuracy/snippets, docs build, every root and site check:* task, full one-pass scaffold.runtime (unproven if unavailable), independent read-only Opus evaluation. Deno 2.9.7 throughout.

No open design decisions. Deferred: package-wide formatting and unrelated refactors; no dependency upgrades or release. No new architecture debt; existing CLI findings recorded in strict baseline.
