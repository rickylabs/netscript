## Summary

Plan and implement truthful CLI identity for MCP command execution: CLI-hosted servers re-enter the
host binary, standalone MCP visibly retains its pinned published fallback, and command receipts can
truthfully authorize `record_drift`.

## Scope

- Archetype / area: A6 CLI/tooling · `packages/mcp` + minimal CLI host composition
- Closes #1376
- Explicit boundary: no #1375 docs-root, host-config, environment, or corpus work

## Slices

- [x] S0 Research, design, exact live acceptance, and PLAN-EVAL cycle-1 repair
- [x] S1 RED tests with separately recorded compile-time and behavioral failures
- [x] S2 MCP execution-identity contract and standalone policy
- [x] S3 minimal CLI host re-entry composition
- [x] S4 exit-aware receipts, refusal text, and published MCP documentation
- [x] S5 full gate set, including the granted serialized runtime pass

## Validation

- Git baseline — clean at `aa8e151e6`
- Live #1376 — ten acceptance rows copied verbatim into the harness plan
- PLAN-EVAL cycle 2 — separate Claude · Fable 5 verdict `PASS`
- Focused MCP tests — 24 passed, 0 failed; post-rebase full MCP package — 121 passed, 0 failed
- Decisive CLI-host tests — 4 passed, 0 failed, including mismatched host version and no JSR child
- Scoped check/lint/fmt, MCP-scoped code-quality scan, MCP export-map `doc:lint`, JSR audit,
  publish-assets check, workspace `publish:dry-run`, and review-thread gate — raw exit 0
- Root `quality:gate` and `arch:check` — raw exit 0 but explicitly not MCP evidence due #1403
- MCP doctrine checker — slice-caused A8 repaired; raw exit 1 remains for baseline/#1403 findings
- `scaffold.runtime` — raw exit 0, `passed=78 failed=0 skipped=2`; both skips declared under #1398
- Pre/post leak artifacts — no slice-owned survivor; foreign `redis-jfgcbtaf` left untouched
- Post-#1401 rebase — both shared-file behaviors preserved; publish-assets and asset-barrel freshness
  guards raw exit 0; decisive CLI-host suite 4/4

```acceptance-evidence
issue: 1376
entries:
  - box-index: 1
    evidence: "S3 host-re-entry tests 4/4 and implementation evidence: https://github.com/rickylabs/netscript/pull/1400#issuecomment-5229326570"
  - box-index: 2
    evidence: "S3 mismatched-host execution proves no JSR child: https://github.com/rickylabs/netscript/pull/1400#issuecomment-5229326570"
  - box-index: 3
    evidence: "S2 shared executor identity plus S3 CLI_PACKAGE_VERSION host wiring: https://github.com/rickylabs/netscript/pull/1400#issuecomment-5229317589"
  - box-index: 4
    evidence: "S2 execute result schema exposes executor command and version: https://github.com/rickylabs/netscript/pull/1400#issuecomment-5229317589"
  - box-index: 5
    evidence: "S4 success/failure receipt tests in the 24/24 focused suite: https://github.com/rickylabs/netscript/pull/1400#issuecomment-5229342145"
  - box-index: 6
    evidence: "S4 successful execute_command to record_drift behavioral test: https://github.com/rickylabs/netscript/pull/1400#issuecomment-5229342145"
  - box-index: 7
    evidence: "S4 refusal text and authorizing-tool test: https://github.com/rickylabs/netscript/pull/1400#issuecomment-5229342145"
  - box-index: 8
    evidence: "S2 standalone characterization, S3 host resolution, and S4 receipt exit-path tests: https://github.com/rickylabs/netscript/pull/1400#issuecomment-5229418381"
  - box-index: 9
    evidence: "S4 all five denied commands overwrite green evidence and cannot authorize drift: https://github.com/rickylabs/netscript/pull/1400#issuecomment-5229342145"
  - box-index: 10
    evidence: "S3 9.9.9-host negative test fails with host wiring reverted and passes with no MCP-pinned spawn: https://github.com/rickylabs/netscript/pull/1400#issuecomment-5229418381"
```

## Harness

- Run dir: `.llm/runs/release-0.0.5--orchestration/slices/w3-b3-1376/`
- Phase: `ready-merge`; PLAN-EVAL passed and IMPL-EVAL bookkeeping repair accepted.
- Do not merge until separate-session PLAN-EVAL and IMPL-EVAL pass and every acceptance row has evidence.

## Drift / Debt

- PLAN-EVAL cycle 1 corrected a slice-path error and a false version-equality authority claim; no
  architecture debt accepted.

## Definition of Done

- [x] Every live #1376 acceptance row has linked evidence.
- [x] Focused tests and required non-serialized scoped/framework/publish gates pass with raw exits recorded.
- [ ] Separate-session IMPL-EVAL passes.
- [x] Serialized `scaffold.runtime` ran once after ledger grant and the token was released.
