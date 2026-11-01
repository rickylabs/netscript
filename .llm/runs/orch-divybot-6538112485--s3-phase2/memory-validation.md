# Validation

S3 phase2 contracts: structured wrapper run-deno-test.ts with --allow-read
--frozen and catalog.test.ts+format.test.ts passes4/0. Entire tests/contracts
with --allow-read --allow-write --allow-run --allow-env --frozen passes81/0.
Scoped check/lint/fmt roots src/contracts and tests/contracts with --ext ts,tsx
select54 files and pass. Exact rows/counts are pending new component slices.
run-gate.ts does not accept --help; use its --gate/--id/--output interface.

2026-10-31 New runtime exports need docs/site/reference/fresh-ui/index.md
inventory updates and `deno task docs:exports-drift`. docs:accuracy covers CLI
command/claim census and does not prove API symbol coverage. Pages CI build
runs export drift before snippets/build/link/caveat checks even on this draft.
For an individual completed job while its workflow still runs, `gh run view
--log-failed` withholds logs; `gh api .../actions/jobs/<job>/logs` fetches them
(use --allow-escape-sequences for redirected ANSI logs). Establish head currency
with agentic:pr-checks first. Never weaken the inventory gate to green it.
