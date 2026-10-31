# Issue #2233 acceptance evidence

Boxes are numbered in the original issue. The coordinator already accepted boxes 1–5 and 7–9:
https://github.com/rickylabs/netscript/issues/2233#issuecomment-6535216808.
This leaf completes remaining option (b); it does not mutate the issue checklist.

| Box | Evidence |
| --- | --- |
| 1 Deterministic | Existing nonvolatile-provenance and double-generation regression passes. Provenance sidecar stays schema/version only. New manifest test varies API clock while proving both prose rows stable. |
| 2 Docs bundle line-mergeable | Real-Git two-branch independent-page test passes; stored carrier and sidecar byte unchanged. |
| 3 Export corpus line-mergeable | Real-Git independent-entrypoint test passes; no export corpus changes. |
| 4 No redundant copies | Single MCP carrier still owns prose; llms-full remains derived; no new stored aggregate. Frozen page/full-corpus parity passes. |
| 5 Carrier audit | Existing generated-carriers.md inventory retained, compatibility semantics documented. No new generated carrier. |
| 6 Consumer parity | Full independent expected MANIFEST compared as bytes against generated output and real initAgent installed file. Both rows restored; four row-removal/volatility negative mutations each fail this byte assertion. Frozen MCP offline prose/export parity tests still pass. |
| 7 Package size | #2234 accepted measurement CLI −15.2%, MCP +8.8%. This leaf only adds a small CLI adapter block (exact byte delta in validation.md); MCP and stored carriers unchanged. Native CLI publish dry-run succeeds. |
| 8 Gates unchanged | No workflow/gate edits. All four original carrier freshness tasks plus quality:gate pass. |
| 9 Safety net | Existing generated-carriers workflow unchanged. Coordinator accepted live main runs in Step 0. |

Local validation: validation.md; negative controls: negative-controls.json.
Full CLI E2E verdict is not required for this scope; scaffold/runtime local smoke deliberately not run.
