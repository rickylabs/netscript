# Independent PLAN-EVAL — round 2

Requested/observed model: claude-opus-5-5; effort high; same separate Anthropic reviewer, read-only tools, stdin closed.

**PLAN-EVAL round 2 of 2 for #2382: VERDICT: PASS. Code changes can start.**

**Checklist**
- **Research and baseline:** Pass. Unchanged from round 1 and still against current main at `462f15c`.
- **Locked decisions:** Pass. The constraint step is now conditional, in the same style as `command-outbox.migration.sql`.
- **Open decisions:** Pass. Whether PostgreSQL is available locally is correctly treated as safe to defer. The real proof is required from CI, a skipped test never counts as a pass, and a local SQLite run can only add evidence, not replace PostgreSQL.
- **Commit slices:** Pass. Slice S1 now covers the manifest, the PostgreSQL upgrade helper and the negative controls.
- **Risks:** Pass. Unchanged and adequate.
- **Gates:** Pass. The checks are scoped. The scaffold E2E run goes to coordinator CI, and the PostgreSQL verdict is requested explicitly.
- **Deferred scope:** Pass.
- **Publish (JSR) check:** Pass. No new exports. Declaring the new migration file in `mod.ts` keeps the manifest in line with the shipped `database/**/*.migration.sql` files.

**Round 1 blockers**
1. **Manifest and existing CI test: resolved.**
   - The plan declares the new file in `plugins/sagas/src/public/mod.ts` and checks it in `manifest_test.ts`. Both files, plus `v1-types.ts`, are now on the allowed write list (`supervisor.md` lines 24–30).
   - Extending `saga-command-postgres_test.ts` means its `pending.length === 1` check (line 194) gets updated in the same change.
   - No workflow change is needed: `command-postgres.yml` already runs on `plugins/sagas/**` and `packages/database/**`, and `command-postgres-conformance.sh:22` runs that test file. The new `saga-status-upgrade.ts` is a helper module, not a test file, so it needs no CI shard entry.
2. **Backfill proof: resolved.**
   - The test deploys the old schema, seeds old-style and versioned rows in every status, including conflicting completion flags and unknown or missing statuses.
   - It upgrades through `runMigrationWithArtifacts`, which accepts an injected command runner (`migrate.ts:319`, `plugin-migrations_test.ts:21`), so a real Prisma create-only, append, deploy run is feasible.
   - It checks the backfilled status, that JSON, version, `updated_at` and ids are unchanged, that an invalid status is rejected, and that nothing is left pending.
   - The negative control clears only the new migration file and requires the test to fail.

**Not blocking, for implementation review:**
- Run the upgrade test in the `fresh` mode at least. If it also runs in `adoption` mode, the old-schema setup must not clash with the adopted copy of the outbox model.
- `migrate dev --create-only` needs a shadow database. The local trust-auth superuser the CI script sets up allows this.

No blockers.

VERDICT: PASS
