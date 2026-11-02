# Independent slice review

Requested/observed reviewer: native Claude Opus 5.5, high effort, separate Anthropic session, read-only. Reviewed the final working tree before implementation sign-off.

**SLICE_REVIEW_PASS**

I re-read the changed and untracked files under `packages/cli/` and the run's drift and worklog notes. I ran no tests and changed nothing. All four findings are repaired, the boundary note is recorded, and I found no new correctness problems.

## The four findings

1. **Duplicate ID sort (SQL Server): fixed.**
   - In `service/domain/entity.ts.template:19`, sorting by `id` now gives a single `ORDER BY id`. Other sort fields still get `id` as a tiebreaker.
   - The generated domain test checks both cases: an unknown sort field gives one entry, and `amount` gives `amount` then `id` with the status filter kept.
   - `sample-records_test.ts` checks the same thing for each engine.

2. **Pagination losing status/sort, and the empty-filter message: fixed.**
   - `ScaffoldRecords.query` holds the sort field, sort order and status (if set). `scaffoldPageHref` adds them back to the URL, and the Previous/Next links in `records/index.tsx.template` use it.
   - Both page adapters say "No records match this status." when a filter matches nothing. The regression test covers the rebuilt link and that message.
   - Because the parser only accepts known values, `query` can only hold valid sort fields, sort orders and statuses.

3. **Clients able to set `reference`: fixed.**
   - Both create and update inputs now drop `reference` (`.omit({ reference: true })` in `service/contract.ts.template`). The database default (`cuid()`) fills it in, so a name-only create still works.
   - The seed writes through Prisma directly, so it is unaffected. Negative tests confirm a submitted `reference` is removed.
   - The memory contract only allows status updates, so it never exposed this field.

4. **Raw status on the detail page: fixed.**
   - The detail header badge and the Status field in both adapters now use `scaffoldStatuses[...]`, the same label and style as the table.

## Boundary note (5)

`drift.md` now records why the Prisma repository imports its runtime schema from the generated v1 contract file by a relative path, and that framework package boundaries are unchanged. That's acceptable. You report that the live SQLite run (real Prisma-generated Zod, migrations and seed) worked, which settles my earlier question about `.extend()` on the generated input schemas.

## Other checks

- **Generated registry:** `embedded.generated.ts` already contains all the repaired template text.
- **Overview loader:** it still strips query parameters, so it pages in the default order (newest first, then by `id`). That order is stable, so pages don't overlap or skip rows.
- **Run notes:** no absolute local paths or session IDs in the run artifacts.

## Still open (not blocking this slice)

- **Page past the end:** a valid filter on a page beyond the last one (total > 0, no rows) shows "Records from {{serviceName}}." with an empty table. This behaviour predates this slice and is optional to change.
- **SQL Server:** no live mssql run yet. The duplicate-sort fix is proven by query-shape tests only, not by a real SQL Server database.

Leave both for the final IMPL-EVAL, along with the carrier, assets-barrel and CI `scaffold.runtime` receipts at the committed head.


# CI repair slice

**SLICE_REVIEW_PASS**

I read the uncommitted diff against HEAD `4689292`, which touches four files: the docs support tool, the generated domain test template, the embedded template carrier and `drift.md`. I did not run the compile fixture or `scaffold-static` again, so I'm relying on your statement that those two CI failures account for the red build.

## 1. Docs service fixture (`.llm/tools/docs/service-scaffold-support.ts`)

- **New file emitted.** The fixture now writes `services/users/src/adapters/sample-records.ts` from the canonical template (`TEMPLATE_KEYS.serviceSampleRecords`) using the same template renderer. That is the file the memory repository template imports (`./sample-records.ts`, alongside it in `adapters/`), so the missing-module error goes away. The order of the module list doesn't matter, because every file is written before anything is compiled.
- **`modelName: 'User'` added.** The sample template's only variable is `{{modelName}}`, and the docs fixture would otherwise have rendered a blank seed name. With `'User'` the first record is "Seed User", matching the seeded value the runtime probe expects. Adding the variable leaves the other rendered templates unchanged: the memory contract, application, domain, repository and health router never reference `{{modelName}}`.
- **Scope.** No checker, fence exemption or skip list was changed. The wider write scope (this file under `.llm/tools/`) is recorded in `drift.md`, and `.llm/tools/` generators were already within the allowed write surface listed in `supervisor.md`.

## 2. Generated domain test (`service/domain/entity_test.ts.template`)

- **The TS2339 error.** `orderBy` is an array literal built from either `{ id }` or a computed-key `{ [field]: order }`. The computed key widens to an index-signature object, so each element's type is a union of the two shapes. Reading `.amount` on that union fails because the `{ id }` shape has no `amount` property, which is exactly the error `scaffold-static` reported.
- **The fix.** `'amount' in primary` narrows the union before `primary.amount` is read, so the read type-checks.
- **The test still bites.** The narrowing is a runtime check as well as a type guard: if the first sort entry isn't keyed by `amount`, the test throws. The other conditions are unchanged: two `orderBy` entries, `amount` ascending, `id` ascending as tiebreaker, and the `status` filter preserved. The `.length` and `orderBy[1].id` reads type-check against both shapes.
- **Strict array indexing.** Generated projects don't enable `noUncheckedIndexedAccess`, so `primary` can't be `undefined` as far as the type-checker is concerned.

## 3. Embedded carrier

- `embedded.generated.ts` changes only that template's entry (`template_113`), and it contains the `'amount' in primary` text. That is consistent with a canonical regeneration from the updated template.
- The new sample template was already embedded at HEAD, so nothing else in the carrier needed to change.

## Remaining for final IMPL-EVAL (not blocking this slice)

- A green CI run at the new commit for the documentation compile build and `scaffold-static`.
- The post-commit assets-barrel check.
- The CI `scaffold.runtime` receipt.


# Runtime repair slice

**SLICE_REVIEW_PASS**

I reviewed the uncommitted diff on top of `44491ca`: two example route templates, the seed generator, three test files, the embedded carrier and a `drift.md` entry. I ran no tests and changed nothing. Your focused tests and the generated-project lint are still running, and I'm relying on them for execution proof.

## 1. Lint fix in the example routes (`examples/crud.tsx.template`, `examples/index.tsx.template`)

- **What changed.** Each template now binds `{{hasService}}` to `const HAS_EXAMPLE_SERVICE` at the top. All three conditions now test that name: `serviceHref` in crud, and `canonicalHref` plus the service/telemetry spread in index.
- **Why it works.** Deno's `no-constant-condition` rule only flags conditions that are literal values. It does not follow const bindings, so the rule stays fully on and nothing is suppressed. I'm reasoning from how the rule behaves; your generated-project lint and the CI rerun will confirm it.
- **Same output either way.** For both `true` and `false`, the same branches render with the same types as before. The no-service case still compiles, because `appRoutes.serviceExample` was already referenced in the unused branch before this change.
- **Tests.** They now check the binding for both values and that each condition uses the name.
- **Carrier.** `embedded.generated.ts` changes exactly those two template entries. Each new string is present once per template.
- **Scope.** No layout, copy or lint configuration changed.

## 2. Seed insertion order (`generate-database-seed.ts:30`)

- **What changed.** The seed now loops over `createSampleRecords().toReversed()`, so rows are written oldest first. On a fresh database, REC-10443 gets the first auto-increment ID and REC-10482 ("Seed {{modelName}}") gets the last.
- **Why it matters.** The generic CRUD list defaults to ID descending, 10 per page. With oldest-first insertion, its first page shows the ten newest samples, including the representative Seed row. The probe looks for that row.
- **Nothing else changes.**
  - Reruns still upsert by reference with an empty update, so existing IDs and edits are preserved.
  - Sample content, schema, contracts and projections are unchanged.
  - The records page and overview sort by `createdAt` explicitly, so they don't depend on insertion order.
  - The memory repository doesn't use this seed and defaults to `createdAt` descending.
- **`toReversed()`.** It's ES2023 and supported by Deno 2.9's runtime and default type libraries. It returns a copy, so the source array isn't mutated.
- **Test.** The seed test now checks that the first and last upsert calls are REC-10443 and REC-10482. All the existing idempotence and disconnect checks are kept. Call order is a reasonable stand-in for ID order with auto-increment.

## Fit with the plan

This stays within the locked plan ("upsert by reference, update empty, reruns preserve edits") and the existing generic CRUD behaviour. No checker, gate or exemption was weakened. `drift.md` records both repairs and the reason for each.

## Residual notes (not findings)

- **Another literal in the records page.** `records/index.tsx.template:11` still renders `{ {{hasService}} && <Button…> }`, which becomes a literal `true && …` / `false && …`. CI didn't report it, which is consistent with `no-constant-condition` checking only `if`/loop/ternary tests. If a stricter rule is enabled later, apply the same named-constant pattern there.
- **Old databases.** A database seeded by an earlier head keeps its original IDs. The new insertion order only applies to fresh databases, which is the scaffold case.

## Still needed at the new head before final IMPL-EVAL

- Green focused tests and generated-project lint.
- Regenerated-carrier checks after commit (assets-barrel and publish-assets).
- A full manual e2e-cli run with both lanes green: postgres `scaffold.runtime` (43/43 gates, including generated.quality-negative) and SQLite runtime.
- Source-tree equality between the evaluated head and the final evidence head, outside `.llm/runs/`.
