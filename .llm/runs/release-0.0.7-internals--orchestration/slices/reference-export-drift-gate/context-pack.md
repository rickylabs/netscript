# Context pack — reference-export-drift-gate

## Current state

- Branch: `fix/reference-export-drift-gate`
- Base: `baf1cdf67a4e931af17b4772ddf6101f36152184`
- PR: #1666, draft, closes exactly #1296
- PLAN-EVAL: cycle 2 `PASS` at `45c249b9c`
- Implementation: S1 and S2 slice reviews `PASS`; S3 evidence complete and awaiting final
  coordinator substantive review
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

## Resume rule

Implementation author stops. Coordinator owns final substantive review, separate-session IMPL-EVAL,
readiness, and merge decisions.
