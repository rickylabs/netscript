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
- Twelve coherent receipts attest that head: eleven PASS and full `test` honestly FAIL/raw 1 due to
  foreign `.llm/tmp/claude/hooks/unscoped/events.jsonl` content. The evidence set is intentionally
  `INSUFFICIENT`; details are in `sa4-evidence.md`.
- Known Contracts/Fresh UI doc-lint reds and `check:mcp-export-corpus` red remain preserved.
  JSR/member selection proves the regenerated CLI and MCP assets ship to upgrading consumers.

## Resume rule

Implementation author commits/pushes SA-4 run artifacts, comments, and stops for the second fresh
Tier-A. Fresh delta IMPL-EVAL, readiness, issue boxes, close-gate, labels, draft state, and merge
remain coordinator-owned.
