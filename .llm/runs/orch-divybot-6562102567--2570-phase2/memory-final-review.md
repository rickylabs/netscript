# Final review lessons — 2026-11-01

CSV formula neutralization applies to untrusted text, never already validated numbers: refund minor units must remain signed numbers. The app-owned scaffoldRecordsCsv helper preserves numeric cells, escapes CSV quotes and guards formula/control-prefix text. Test a negative refund alongside formula-like reference/owner/email values.

Accept-Language quality matters: q=0 excludes a preference, higher q wins, equal weights preserve header order. Keep malformed tags non-fatal.

The generic service example validates a note but does not persist it. Empty guidance and navigation must not promise record creation or management; actions now say Open service and Validate note. Generated database data can be seeded through the existing CLI.

Final fixture is regenerated after review fixes to avoid stale SSR/island bundles from patching preview files. Individual Aspire web restart failed to stop on this host; stopping the positively owned AppHost succeeds. Foreign deployment resources were left alone. Use the current discovered URL after each AppHost start, never a copied port.

Mobile generic table selectors must target direct children. A rich outer row can contain a nested generic table inside More fields; descendant selectors hide the nested table's replacement field labels. Keep rich layout selectors at `table > tbody > tr > td` and verify expanded nested arrays at 390px. Private SDK scripts require `--config deno.json` when importing workspace modules from outside the worktree; a current working directory alone does not supply their import map.

A browser POST exposed a pre-existing generated resource-slice defect: `index.tsx.template` exported only the built default page, so Fresh never received the handler produced by `.withForm()`. POST returned a fresh initial page without validating. Export `handler` with `default: page`; use `RuntimeFormState.submitted && !hasErrors` for a visible validation-only confirmation. Keep this exercised through a real browser POST, not just source snapshots.
