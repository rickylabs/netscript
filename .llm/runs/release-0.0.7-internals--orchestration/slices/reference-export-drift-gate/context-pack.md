# Context pack — reference-export-drift-gate

## Current state

- Branch: `fix/reference-export-drift-gate`
- Base: `baf1cdf67a4e931af17b4772ddf6101f36152184`
- PR: #1666, draft, closes exactly #1296
- PLAN-EVAL: cycle 2 `PASS` at `45c249b9c`
- Implementation: S1 review `PASS`; S2 complete and awaiting coordinator slice review
- S3: not started and not authorized in this pass
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
- Browser/runtime/Aspire/Docker/E2E: `NOT_RUN`.

## S2 result

The already-enforced drift checker now has a least-permission `docs:exports-drift` identity. The
accuracy aggregate invokes that named task once while retaining stdout/stderr failure visibility,
and Pages displays the same command once from repository root behind its existing run guard. The
workflow trigger surface is unchanged.

## Resume rule

Do not begin S3. First obtain the coordinator's substantive review of the exact pushed S2 head.
