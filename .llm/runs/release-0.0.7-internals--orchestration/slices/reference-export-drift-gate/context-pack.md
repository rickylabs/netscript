# Context pack — reference-export-drift-gate

## Current state

- Branch: `fix/reference-export-drift-gate`
- Base: `baf1cdf67a4e931af17b4772ddf6101f36152184`
- PR: #1666, draft, closes exactly #1296
- PLAN-EVAL: cycle 2 `PASS` at `45c249b9c`
- Implementation: S1/S2 reviews passed; S3 and refusal-test repair completed; preserved IMPL-EVAL
  PASS at `ee67d12b4` is pre-finding evidence only
- Readiness: revoked after quality CI found stale tracked agent-docs mirrors; PR remains draft at
  `status:impl`; issue boxes unchanged
- Current pass: SA-3 plan-only amendment. No checkout generation until fresh Tier-A PASS
- S3 immutable implementation head: `47ca22abe94b9d2e54d3778edc8944094b227886`
- `fresh-browser`: N/A / waived, `NOT_RUN`; no runtime lease

## S1 result

The checker now makes coverage mode explicit and reason-bearing, validates policy fail-closed,
reports every package's mode/reason/group counts, and exposes an injectable exit-code seam. Fresh UI
is complete-mode with all 168 live symbols documented. Its seven extra Dropzone inventory names are
machine-readably classified as the copy-source non-exports the page visibly says they are.

All four residual Contracts examples now import from the entrypoint that exports their symbols. The
diff is limited to the import subpath line in each file.

## Evidence state

- Focused checker tests: 6 passed / 0 failed.
- Named direct checker: raw exit 0, PASS.
- Docs source format: raw exit 0.
- Docs accuracy: raw exit 0.
- Pages workflow/classifier tests: 1 + 60 passed / 0 failed.
- Controlled drift: named task and aggregate each raw exit 1; aggregate surfaced child output and
  threw fail-closed; target restored byte-exactly.
- Single-execution/permission/trigger audit: raw exit 0.
- Contracts doc lint: raw exit 1 with the accepted baseline nine private-type-ref findings.
- Fresh UI doc lint: raw exit 1 with the accepted baseline 123 `/interactive` findings.
- Seven-gate durable evidence set: `SUFFICIENT` at `47ca22abe`; every receipt PASS/raw exit 0.
- Workspace publish dry-run: raw exit 0, static packaging evidence only.
- JSR audits: raw exit 0 for Contracts and Fresh UI; sanctioned/pre-existing INFO/WARN findings
  retained.
- Thirteen-path/forbidden-surface/lock audit: raw exit 0; lock blob identical to base.
- Browser/runtime/Aspire/Docker/E2E: `NOT_RUN`.

## S2 result

The already-enforced drift checker now has a least-permission `docs:exports-drift` identity. The
accuracy aggregate invokes that named task once while retaining stdout/stderr failure visibility,
and Pages displays the same command once from repository root behind its existing run guard. The
workflow trigger surface is unchanged.

## SA-3 verified cascade

The Fresh UI reference change propagates through exactly four canonical outputs:

- `.llm/assets/agent-docs/prose.json.gz`
- `.llm/assets/agent-docs/provenance.json`
- `packages/cli/src/kernel/assets/agent-docs.generated.ts`
- `packages/mcp/src/publish-assets.generated.ts`

The coordinator's rescope brings the implementation ceiling to seventeen paths; an eighteenth path
requires rescope. `gen:mcp-export-corpus` is explicitly excluded: its check is red at base and leaf,
and base/head regeneration produces byte-identical output. CLI/MCP generated sources are real
publish deltas and require fresh JSR/member dry-run evidence.

## SA-4 generated-content state

- Fresh Tier-A passed SA-3 and canonical generation is complete at immutable content head
  `46528ae4c71b3744f0af64bd749d01d831f70c89`.
- Exactly four approved generated files changed. Two pre-commit passes produced the same diff hash;
  the post-commit owner rerun and all freshness checks left no diff.
- The original full `test` receipt remains RED/raw 1 at 4,202/1/19. The supervisor attributed its
  only match to the supervisor's ignored unscoped hook transcript and quarantined that subtree
  intact outside the repo with identical pre/post SHA-256.
- The one authorized `test-attempt2` at immutable content head `46528ae4c` passed raw 0 at
  4,203/0/19. The authoritative twelve-gate evidence set selects attempt 2 and is `SUFFICIENT`; both
  receipts remain append-only in `receipts/sa4/` with exact totals.
- Known Contracts/Fresh UI doc-lint reds and `check:mcp-export-corpus` red remain preserved.
  JSR/member selection proves the regenerated CLI and MCP assets ship to upgrading consumers.

## Resume rule

Implementation author commits/pushes the SA-4 attempt-2 attribution and evidence index, comments,
and stops for the second fresh Tier-A. Fresh delta IMPL-EVAL, readiness, issue boxes, close-gate,
labels, draft state, and merge remain coordinator-owned.

## CI changed-source quality repair

After post-integration IMPL-EVAL cycle 4 PASS, ready-triggered Code quality run `31908898023` found
two leaf-owned checker findings: one explicit `any` parameter and one unsafe `as any` access. The
focused repair replaces both with the typed Deno exports union and narrowing helpers. Target-level
`null` deliberately resolves to `''`; malformed top-level exports throw fail-closed.

The exact nine-file changed-source scan is green with zero findings/allowances. Root test is
4,217/0/19, focused checker tests are 12/0, and direct drift retains its eight package reports and
PASS. No generator output or lock moved. The author stops after commit/push/comment for fresh
internals Tier-A; no evaluator is launched by the author.
