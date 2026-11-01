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

## CI repair verification

| Gate | Result |
| --- | --- |
| Combined CI repair regressions | PASS: 109 tests |
| Full structured check | PASS |
| quality:gate and scoped style | PASS |
| All root check:* tasks and carriers | PASS: 15 tasks |
| Generated full-project lint | PASS: with and without a service |
| Same-session independent CI repair review | PASS |

The first Docker run stopped at generated lint after 42 passing gates in both tiers. It proves
no runtime readiness. Its replacement run at the repair head is pending.


Runtime auth repair: full check (4,142 files, 35 batches), quality gate, all 15 root `check:*`
tasks, scoped source lint/format, release preflight, 36 focused auth/projection/probe tests and
3 real Chromium conformance tests pass. `scaffold.plugins --cleanup --format pretty` again passed
all 18 gates. Round 4 independent evaluation passed. No Docker runtime pass is claimed here.
