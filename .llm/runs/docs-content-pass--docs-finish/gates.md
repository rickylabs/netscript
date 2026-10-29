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

## Review repair recheck

- `check:agent-docs-prose`: PASS (exit 0).
- `check:mcp-export-corpus`: PASS (exit 0).
- `check:assets-barrel`: PASS (exit 0).
- `check:publish-assets`: PASS (exit 0).
- `check:aspire-version-parity`: PASS (exit 0).
- `docs:links`: PASS (exit 0).
- `docs:snippets`: PASS (exit 0).
- `docs:accuracy`: PASS (exit 0).
- `docs:exports-drift`: PASS (exit 0).
- `docs:readme-fences`: PASS (exit 0).
- `docs/site verify`: PASS (exit 0).

Local docs browser: PASS, 124 tests across four theme/viewport combinations.
Full CLI runtime attempt: UNPROVEN, Docker daemon unreachable at preflight; cleanup could not inspect Docker. This is not a passing runtime result. Read-only leak-check reviewed 24 unproven foreign entries and mutated none.
