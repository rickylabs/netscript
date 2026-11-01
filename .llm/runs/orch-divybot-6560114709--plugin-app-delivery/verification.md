# Verification on Deno 2.9.7

| Gate | Result |
| --- | --- |
| Structured full check | PASS: 4,142 files in 35 batches |
| Structured focused tests | PASS: 825 tests |
| Scoped source lint and format | PASS: all 27 authored TypeScript files |
| quality:gate | PASS: quality scan, dependency and architecture gates |
| release:preflight | PASS |
| docs:accuracy | PASS |
| JSR audits: CLI and workers | PASS; existing advisory warnings recorded |
| scaffold.plugins --cleanup | PASS: 18 gates |
| Independent IMPL-EVAL | PASS on repair round 2 |
| check:desktop-native-fixture | PASS |
| check:emitted-samples | PASS |
| check:streams-types | PASS |
| check:child-health-docs | PASS |
| check:mcp-export-corpus | PASS |
| check:assets-barrel | PASS |
| check:agent-docs-prose | PASS |
| check:publish-assets | PASS |
| check:scaffold-versions | PASS |
| check:aspire-version-parity | PASS |
| check:netscript-jsr-specifiers | PASS |
| check:aspire-host-ports | PASS |
| check:figma-names | PASS |
| check:review-threads | PASS |
| check:design-skill | PASS |

Docker scaffold.runtime is pending CI dispatch. This table records local pre-commit evidence;
CI at the pushed head remains the final check surface. Raw logs and receipts are not public run artifacts.
