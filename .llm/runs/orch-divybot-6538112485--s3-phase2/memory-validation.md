# Validation

S3 phase2 contracts: structured wrapper run-deno-test.ts with --allow-read
--frozen and catalog.test.ts+format.test.ts passes4/0. Entire tests/contracts
with --allow-read --allow-write --allow-run --allow-env --frozen passes81/0.
Scoped check/lint/fmt roots src/contracts and tests/contracts with --ext ts,tsx
select54 files and pass. Exact rows/counts are pending new component slices.
run-gate.ts does not accept --help; use its --gate/--id/--output interface.
