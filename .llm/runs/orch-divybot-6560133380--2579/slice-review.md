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
