# Context Pack for #2652

- Run: `fix-fresh-client-content-hash-2652--impl`
- Branch: `fix/fresh-client-content-hash-2652`
- Phase: implementation
- Archetype: 6, CLI / Tooling, with the frontend overlay
- Baseline: `87965d800b7d61312e8612c82bdb0cb98bdf5b29`

The emitted Vite config owns the naming policy. Fresh builds the client first and consumes Vite's actual client filenames through the manifest. The existing Chromium session supports the same-profile production regression. See `research.md`, `plan.md`, and `worklog.md` for source findings and gate status. The coordinator owns independent implementation review.
