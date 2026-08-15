# Context pack — reference-export-drift-gate

## Current state

- Branch: `fix/reference-export-drift-gate`
- Base: `baf1cdf67a4e931af17b4772ddf6101f36152184`
- PR: #1666, draft, closes exactly #1296
- PLAN-EVAL: cycle 2 `PASS` at `45c249b9c`
- Implementation: S1 complete; awaiting coordinator slice review
- S2/S3: not started and not authorized in this pass
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
- Direct checker: raw exit 0, PASS.
- Docs source format: raw exit 0.
- Docs accuracy: raw exit 0.
- Contracts doc lint: raw exit 1 with the accepted baseline nine private-type-ref findings.
- Browser/runtime/Aspire/Docker/E2E: `NOT_RUN`.

## Resume rule

Do not begin S2. First obtain the coordinator's substantive review of the exact pushed S1 head. If
review authorizes continuation, resume with S2's named-task/aggregate/Pages discoverability wiring;
do not fold S3 into it.
