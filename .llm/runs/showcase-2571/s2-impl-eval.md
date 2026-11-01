**IMPL-EVAL (S2 and final, #2580 / PR #2577): PASS.** #2580 can be marked implemented, pending two things: `check:assets-barrel` passing again on the sign-off commit, and the required remote CI going green. I found no source defect, no auth or failure-handling dishonesty, and no boundary violation. This verdict covers only the Northwind orders foundation: parent #2571 stays open and #2581 stays independent. I made no edits; `s2-impl-eval.md` needs this verdict recorded.

## Verified in source and receipts

- **Runtime probe** (`packages/cli/e2e/src/application/gates/scaffold/runtime/probe-northwind.ts`).
  - **Real address:** it finds the app through Aspire (`resolveProjectAppUrls`, `:40`) rather than a fixed port, and requires HTTP 200 (`:50`).
  - **Rendered cells only:** it strips `<script>` before reading `<td>`/`<dd>` text (`:12-14`), so rows that exist only in hydration data cannot pass.
  - **Real detail page:** the detail path comes from the seeded row's generated link (`:58-63`), not a hard-coded id.
  - **Failure control:** the "unavailable" mode needs the unavailable message and no stale seed rows (`:15-21`), and the "ready" mode fails on "Records unavailable" or "No connected data" (`:28-30`).
  - **Tests:** `probe-northwind_test.ts` covers an empty HTTP 200 page, script-only rows, a missing field and stale rows.
  - **Recorded run:** `runtime-controls.json` records stop → down probe passes → ready probe fails as expected → restart → recovered.
- **Seed:** `seed-proof.json` shows six references at every stage, with the edited `held` status surviving a repeat seed.
- **Real generation:** generated-workspace typecheck passes on SQLite (182 files) and on Postgres (183 files). That covers the S1 concern that the hand-written placeholder might not match the real generated schema. The Postgres runtime is correctly not claimed.
- **Northwind-only table variant:**
  - **Asset selection:** the table and CSS are picked the same way as the records adapter (`write-app-files.ts:419-434`), and they reuse the shipped `ResponsiveTable` without copying it (`assets/northwind/record-table.tsx.template`).
  - **CSS scoping:** the preset CSS is appended to the shared template only when Northwind is selected; the shared CSS is untouched. `css-size.json` shows the default CSS hash matches the snapshot and no budget changed.
  - **Default output:** the full default-init snapshots still pass.
- **Detail timestamps:** these are now concise UTC values (`assets/northwind/scaffold-records.ts.template:11-14`). They rely on the contract's `Date` output type, which the generated typecheck confirms.
- **S1 conditions all closed:**
  - **Baseline:** its provenance and an opt-in regeneration path are documented (`packages/cli/tests/fixtures/northwind/README.md`; `UPDATE_NORTHWIND_BASELINE`, `northwind-preset_test.ts:94`).
  - **Kernel conflict test:** a direct `executeInit` call with MySQL is rejected and nothing is written (`:285-300`).
  - **Registry:** it is documented as descriptive only (`preset-registry.ts:12`).
  - **Dry-run suite:** `dry-run-fs_test.ts` now has a receipt (`s1-review-conditions.json`, 28 passed).
- **Honesty:**
  - **Auth:** the README states the CRUD is unauthenticated.
  - **Full runtime:** the full `scaffold.runtime` attempt is reported as exit 1 at `preflight.aspire` because there is no Docker, and is marked UNPROVEN.
  - **Visual review:** the reviewer states its own limits (no detail or mobile reference frames; HTTP 200 and Aspire provenance not independently checked).
  - **No overclaim:** nothing about plugins, AI or external providers is claimed.

## Before marking #2580 implemented

1. **Rerun `check:assets-barrel` on the sign-off head.** `embedded.generated.ts` changed in S2, and the final gate receipt lists 14 of the 15 root `check:*` tasks, missing exactly this one.
2. **Use the right keywords in the PR body.** It should say `Closes #2580` and only `Refs #2571`, with no closing keyword on the parent or the #2412 epic. Then let `check:review-threads` and the required remote checks pass on that head.

## Optional improvements (not blocking)

- **Tie probe fields to one row.** The ready probe checks fields anywhere on the page. `Hanari Carnes` and `Brazil` also belong to NW-10250, so only the reference and `$1,444.80` are unique to NW-10253. Checking all fields inside the NW-10253 `<tr>` and on its detail page would bind them to one record.
- **The probe is a manual script.** It is not wired into any e2e suite, so CI won't catch a regression. The parent's showcase suite should absorb it.
- **Receipts lack commands.** `seed-proof.json` and `runtime-controls.json` record outcomes but not the commands or commit that produced them; adding those would strengthen provenance.
- **Label-coupled table cells.** The table finds cells by matching adapter labels (`field(row, 'Total (USD)')`). Both files are Northwind-only, but typed fields on the projection would be less fragile.
- **Hard-coded sizes.** The preset CSS uses pixel sizes and spacing; theme tokens would track the design system if it changes.
