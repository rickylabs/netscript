## Summary

Plan and implement truthful CLI identity for MCP command execution: CLI-hosted servers re-enter the
host binary, standalone MCP visibly retains its pinned published fallback, and command receipts can
truthfully authorize `record_drift`.

## Scope

- Archetype / area: A6 CLI/tooling · `packages/mcp` + minimal CLI host composition
- #1376 (closing keyword will be added only when every live acceptance row is truthfully tickable)
- Explicit boundary: no #1375 docs-root, host-config, environment, or corpus work

## Slices

- [x] S0 Research, design, exact live acceptance, and PLAN-EVAL cycle-1 repair
- [x] S1 RED tests with separately recorded compile-time and behavioral failures
- [x] S2 MCP execution-identity contract and standalone policy
- [x] S3 minimal CLI host re-entry composition
- [x] S4 exit-aware receipts, refusal text, and published MCP documentation
- [x] S5 non-serialized gates and serialized runtime-token request

## Validation

- Git baseline — clean at `aa8e151e6`
- Live #1376 — ten acceptance rows copied verbatim into the harness plan
- PLAN-EVAL cycle 2 — separate Claude · Fable 5 verdict `PASS`
- Focused MCP tests — 24 passed, 0 failed; full MCP package — 113 passed, 0 failed
- Decisive CLI-host tests — 4 passed, 0 failed, including mismatched host version and no JSR child
- Scoped check/lint/fmt, `quality:gate`, named `arch:check`, MCP export-map `doc:lint`, JSR audit,
  publish-assets check, workspace `publish:dry-run`, and review-thread gate — raw exit 0
- `scaffold.runtime` — token requested; not started before grant

## Harness

- Run dir: `.llm/runs/release-0.0.5--orchestration/slices/w3-b3-1376/`
- Phase: `impl`; PLAN-EVAL passed, IMPL-EVAL remains orchestrator-launched after runtime evidence.
- Do not merge until separate-session PLAN-EVAL and IMPL-EVAL pass and every acceptance row has evidence.

## Drift / Debt

- PLAN-EVAL cycle 1 corrected a slice-path error and a false version-equality authority claim; no
  architecture debt accepted.

## Definition of Done

- [ ] Every live #1376 acceptance row has linked evidence.
- [x] Focused tests and required non-serialized scoped/framework/publish gates pass with raw exits recorded.
- [ ] Separate-session IMPL-EVAL passes.
- [ ] Serialized `scaffold.runtime` gate runs only after an orchestrator token grant.
