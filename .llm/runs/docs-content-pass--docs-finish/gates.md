# Content gates

| Command | Result | Exit |
| --- | --- | ---: |
| `check:desktop-native-fixture` | PASS | 0 |
| `check:emitted-samples` | PASS | 0 |
| `check:streams-types` | PASS | 0 |
| `check:child-health-docs` | PASS | 0 |
| `check:mcp-export-corpus` | PASS | 0 |
| `check:assets-barrel` | PASS | 0 |
| `check:agent-docs-prose` | PASS | 0 |
| `check:publish-assets` | PASS | 0 |
| `check:scaffold-versions` | PASS | 0 |
| `check:aspire-version-parity` | FAIL — repaired manifest; recheck follows | 1 |
| `check:netscript-jsr-specifiers` | PASS | 0 |
| `check:aspire-host-ports` | PASS | 0 |
| `check:review-threads` | PASS | 0 |
| `docs:links` | PASS | 0 |
| `docs:snippets` | PASS | 0 |
| `docs:accuracy` | PASS | 0 |
| `docs:exports-drift` | PASS | 0 |
| `docs:readme-fences` | PASS | 0 |
| `docs/site verify` | PASS | 0 |

Durable receipts for allowlisted gates were produced with `.llm/tools/gates/run-gate.ts`. The initial Aspire parity failure was manifest freshness only; the native manifest generator added one maintained docs path with an existing ownership rule (zero unmatched paths). Recheck recorded separately. CI must still pass at the final head.
