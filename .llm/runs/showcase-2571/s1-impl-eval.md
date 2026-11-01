**S1: PASS.** I read the source of all 25 changed or new files. I found no correctness, layering, seed, auth-honesty, dry-run or default-compatibility defect that blocks S1. This is not a final-readiness verdict: S2's runtime and visual proof is still outstanding. `s1-impl-eval.md` is still empty and needs this verdict recorded.

## What I verified

- **One preset resolver.** `applyInitPreset` (`packages/cli/src/kernel/domain/scaffold/northwind-preset.ts:27-61`) runs in four places:
  - public init, before prompts and before any preset fetch (`run-init-command.ts:83-102`);
  - the maintainer command (`maintainer/features/init/init-command.ts:79-100`);
  - maintainer orchestration again, before `syncPackages` (`orchestrate-maintainer-init.ts:93, 121-124`);
  - direct kernel init (`validate-init.ts:36`).
  Applying it a second time is harmless, because the filled values never conflict with themselves.
- **Rejections.** Every planned conflicting option is rejected before any I/O. Unknown presets list the supported name.
- **`--service false` versus omitted.** The maintainer `--service` default was removed, and the new expression (`init-command.ts:76-78`) keeps explicit `false` separate from "not given". For ordinary maintainer init, omitted now becomes `undefined`, which `?? false` in `validate-init.ts:102` resolves to the same result.
- **Validated type is narrowed.** `ValidatedInitOptions.from` is typed `'northwind'` (`scaffold-options.ts:97`) and set only when the preset is selected (`validate-init.ts:151`).
- **Scope of the database selector.** `DatabaseScaffoldOptions.preset` is documented as init-only (`domain/db-engine.ts:71-72`). Only `workspace-init.ts:41` passes it, so `db add` is unaffected.
- **Asset selection, no rewriting.** The schema, placeholder Zod and seed are chosen at the existing write calls (`adapters/database/scaffolder.ts:204-228`) and the records adapter at the existing page selection (`write-app-files.ts:408-414`). Nothing is overwritten afterwards or string-rewritten, and the contract template is unchanged.
- **Seed.** It upserts by the `@unique` order reference with `update: {}`, so repeat seeding keeps user edits (`assets/northwind/seed.ts.template:18`; `assets/northwind/schema.prisma.template:19`). All six rows are `pending`, so no lifecycle state is invented. They are genuine Northwind orders and totals, persisted through the normal database facade.
- **List and detail fields.** The records adapter puts customer, country and total into the list's description, status into the status column, and every field into the detail page (`assets/northwind/scaffold-records.ts.template:11-14`). That settles round-2 condition 3 for this leaf.
- **JSON output.** `from` is added only when selected, and `plugins` stays empty (`init-json-renderer.ts:31`). The public test asserts exactly one JSON line.
- **Auth honesty.** The README states plainly that the CRUD is unauthenticated and makes no auth claim (`packages/cli/README.md:423-424`).
- **Dry-run overlay.** `readDir` now merges recorded children, removals and copies with real entries (`dry-run-fs.ts:154-175`), without creating anything on the real filesystem, and two adapter tests cover it. No caller depended on the old throw-on-preview-only-directory behaviour, and the existing `dry-run-fs_test.ts` never asserts on `readDir`.
- **Tests do real checks.** The default baseline hashes the full emitted file set for `none` and for SQLite with an `orders`/`Order` service. That second variant is the strongest guard that the generic path is untouched under identical names. The conflict tests also assert that no directory was created; the interactive test fails if any database, service or cache prompt fires; and the maintainer test asserts `[['sqlite']]` reaches package sync and that conflicts never reach `runInit`.

## Conditions before the S1 sign-off commit (not blocking)

1. **Run the existing dry-run suite.** `dry-run-fs.ts` changed, but no receipt shows `packages/cli/src/kernel/adapters/scaffold/tests/dry-run-fs_test.ts` ran: neither test receipt mentions it. Run it and record a receipt.
2. **Baseline fixture provenance and upkeep.** `tests/fixtures/northwind/default-scaffold.json` (426 entries) only proves anything if it was captured before the edits; I cannot verify that from source. Record the capture command and base commit in the worklog. It hashes every emitted file, so any future scaffold-template change will break it: document how to regenerate it on purpose, or scope it to this guard.
3. **Two sources of truth for presets.** `PresetRegistry` is still populated (`preset-registry.ts:15-18`), but neither command consults it any more. Meanwhile `applyInitPreset` hard-codes the closed set and the "Available:" message. Either generate that list from the registry or mark the registry as descriptive only. As it stands, `register()` accepts presets the resolver will always reject.
4. **No direct-kernel conflict test.** `executeInit({ from: 'northwind', dbEngine: 'mysql' })` called directly is untested. Add one assertion so the kernel-level protection the plan claims is covered.

## S2 obligations (not S1 defects)

- **Real generation:** run `db generate` for real, then typecheck the generated workspace. This proves the hand-written Order placeholder matches the real `@database/zod` barrel; status and timestamps should become optional in the create input.
- **Seeding:** seed twice, edit a seeded row, seed again, and assert the row count is stable and the edit survives.
- **Running service:** render list and detail through the running `orders` service, asserting name, customer, country, status and total, plus the service-down "unavailable" control. Also assert the dashboard's service capability reflects the live read (carried from #2570).
- **Postgres:** scaffold and typecheck the Postgres variant; its runtime stays UNPROVEN.
- **README:** `packages/cli/README.md:420-422` describes runtime behaviour (the records pages, repeat seeding) that only S2 can prove. Keep it, but don't count docs:accuracy as proof of it.
- **Visual and labels:** the Astra visual scores of 8 or more, and separate labels for native Aspire versus Docker `scaffold.runtime`.

Parent #2571 stays open; #2581 is independent.
