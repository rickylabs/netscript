# IMPL-EVAL — W3-B2 #1375

- Evaluator session: separate native Claude · Fable 5 session, 2026-08-09
- Source: PR #1401 comment `5229490053`
- Evaluated head: `5f59b6a7c`
- Verdict: `PASS`

## Verified

- All eleven live #1375 acceptance rows are proven with none deferred.
- At test-only S1 commit `0c4f910e3` against baseline product, the decisive real stdio test
  reproduced the two-document corpus: `mcp` and `help`. Every S1 RED failed as an assertion rather
  than a setup/module-resolution error.
- The real composition-edge precedence test uses both an indexable probe candidate and environment
  override; the single exact 262,144-byte budget has no `256_000` residue.
- #1376 separation holds: `run-agent-mcp.ts` is untouched and shared `cli.ts`/README changes are
  docs-corpus-only. If #1401 merges first, #1400 owns the rebase and publish-asset regeneration.
- #1403 attribution holds in both directions: base/head pre-existing F-16/A9/A14 doctrine reports
  are byte-identical; the owned A8 regression fired at 305 lines at `66e27713a` and is absent at
  head (299 lines, 298 at base).
- Lock diff is empty; no new lint ignores, casts, or `any`; #1197 remains unclaimed.

## Non-verdict-flipping findings

1. **FI-1 (low):** optional `createDocsFlows` selection can produce a result that does not satisfy
   the required `list_docs.corpus` schema. Current sole composition always supplies it. Record for
   the next flows-map touch; do not widen this PR.
2. **FI-2 (info):** correct the recorded A8 peak from 304 to 305.
3. **FI-3 (info):** project probing means the decisive stdio test alone is insufficient to preserve
   host flag emission post-fix. Exact host-argument assertions independently hold acceptance row 1
   and are load-bearing.

## Disposition

FI-2 is corrected in the gate ledger. FI-1 and FI-3 are recorded in `worklog.md`. No product change
is required. The slice may advance to `status:ready-merge`; pre-merge gate and merge remain with the
milestone orchestrator.
