# Research — leaf-1881-readiness

## Re-baseline

- Carried-in source: issue #1881 and Canary 9 production run `33712927776`.
- Re-derived against `origin/main` at `632528888ad033f0e23dfd4f6718d089bfe3eeab` on 2026-09-03.
- Canary 9 commands 1–10 passed. Command 11 selected port `32923` after the Postgres wait, then an unbounded printed `curl` hung for 900 seconds and exited 143. Cleanup passed, but its durable child receipt was not in the workflow upload path.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | Endpoint allocation is not service readiness. | Run `33712927776`; `state.json` names `aspire describe users run receipt` before users was awaited. |
| 2 | The README prints only the Postgres readiness boundary. | `README.md` marked Quickstart block. |
| 3 | Aspire 13.5.3 supports `aspire wait users --status healthy --timeout 60 --apphost aspire/apphost.mts`. | `aspire wait --help`. |
| 4 | The printed curl has no failure or time bound, so the suite's generic 900-second ceiling becomes user-visible failure behavior. | `README.md`; `readme-quickstart-suite.ts`. |
| 5 | Cleanup writes wrapper and child JSON under `.llm/tmp/gate-receipts/readme.quickstart/`; the production workflow uploads neither. | `runtime-gates.ts`; `.github/workflows/e2e-cli-prod.yml`. |

## jsr-audit surface scan

- N/A: this changes root documentation and private E2E/release-gate code, not a published package export or dependency surface.

## Open questions

- None. The incident fixes are bounded by the exact failed run: printed users readiness, a bounded actionable curl, honest one-line execution, and complete cleanup evidence upload.

