# Context Pack for #2652

- Run: `fix-fresh-client-content-hash-2652--impl`
- Branch: `fix/fresh-client-content-hash-2652`
- Phase: implementation
- Archetype: 6, CLI / Tooling, with the frontend overlay
- Baseline: `87965d800b7d61312e8612c82bdb0cb98bdf5b29`

The emitted Vite config owns the naming policy. Fresh builds the client first and consumes Vite's actual client filenames through the manifest. The existing Chromium session supports the same-profile production regression. See `research.md`, `plan.md`, and `worklog.md` for source findings and gate status. The coordinator owns independent implementation review.

## Handoff

Draft PR #2655 targets `main`. The baseline two-build test exited 1 and the corrected carrier passed (0). Its measured URLs, hashes, byte counts, and cache headers are in `worklog.md`. Scoped checks, template and browser tests, generator checks, quality, architecture, release preflight, and docs accuracy passed.

The one-pass scaffold runtime at implementation commit `7ad9fc836c0a7904a1b80e4eb80e0788f6e601ae` exited 1 at `behavior.documented-scaffold` with a Postgres listener refusal and a database readiness timeout. Aspire cleanup passed and the ownership check found zero resources for this run. S2 records the result without changing the gate inputs. The full scaffold gate and independent review remain open.
