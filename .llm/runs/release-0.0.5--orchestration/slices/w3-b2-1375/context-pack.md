# Context Pack — W3-B2 #1375 MCP docs root and fallback

## Run metadata

| Field | Value |
| --- | --- |
| Run ID | `release-0.0.5--orchestration/slices/w3-b2-1375` |
| Branch | `fix/agent-mcp-docs-root` |
| Current phase | `ready-merge` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `docs` |

## Current state

Research and the ordered plan are complete against live issue #1375 and baseline `aa8e151e6`.
Draft PR #1401 is open against `main` with `Closes #1375`; all eleven rows have evidence. Separate
Claude/Fable PLAN-EVAL passed in comment `5229304606`. F1-F4
are incorporated. S1 behavioral RED is recorded and S2/S3 are implemented green. Non-serialized S4
commands are complete; #1403 requires scoped evidence because aggregate quality/doctrine root lists
omit MCP. The one granted serialized runtime passed 78/0/2, with exactly the two #1398 deferrals.
Separate Claude/Fable IMPL-EVAL passed in comment `5229490053`. A final-head CI finding in the
changed generated MCP payload was fixed at its checked-in compressed prose source; focused gates
are green on the replacement payload. The corresponding CLI embedded-docs consumer omitted from
that commit has now been regenerated through the canonical asset-barrel generator; all generated
consumers are current.

## Completed

- Required skills, harness workflow, A6 profile/doctrine, relevant debt, and JSR guidance read.
- Live #1375 and #1260 state fetched.
- Current CLI/MCP/generator/tests/docs inspected.
- Four implementation slices, gates, risk register, public contract, and RED proof locked.
- PLAN-EVAL PASS preserved in `plan-eval.md`; textual #1376 overlap and second-to-merge rule named.
- Post-eval generated-source CI correction recorded in `s5-ci-fix.md`; #1400 remains second to
  merge and owns its later rebase/regeneration.
- Deterministic CLI generated-consumer completion recorded in `s6-cli-asset-completion.md`; it
  changed no source behavior and did not require another runtime pass.

## In progress

- Implementation, gates, and separate-session evaluation complete; awaiting orchestrator pre-merge
  gate and merge decision.

## Next steps

1. Orchestrator runs the pre-merge gate and decides merge ordering.
2. If #1401 merges first, #1400 rebases and regenerates publish assets; do not modify #1400 here.

## Key decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Flag > env > probe > embedded | Live #1375 + plan LD-2 | Invalid explicit/env roots remain errors; empty probe degrades observably. |
| Minimal five-page generated fallback + README | Plan LD-5 | #1260 retains SDK-specific breadth. |
| All three host emitters wired | Plan LD-1 | Truthfully satisfies “every host config”. |
| Textual #1376 overlap | PLAN-EVAL F1 | Both edit `cli.ts`/README; second-to-merge rebases and regenerates assets. No `run-agent-mcp.ts` edit. |

## Files changed

Implementation and tests are committed through S3. S4's scoped doctrine audit compacted the changed
`packages/mcp/src/domain/tool-contracts.ts` schema declaration below the 300-line A8 cap.

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| PLAN-EVAL | PASS | PR comment `5229304606`; local `plan-eval.md`. |
| IMPL-EVAL | PASS | PR comment `5229490053`; local `evaluate.md`; all eleven rows proven. |
| Static | PASS | Focused 48/48 with no skips; scoped check/lint/fmt green; direct MCP quality scan exit 0 with no findings/allowances. |
| Fitness | PRE-EXISTING_FAIL | Direct MCP doctrine rerun exit 1 only for untouched F-16/A9/A14 findings assigned to #1403; owned A8 regression repaired. |
| Runtime | PASS | One granted pass: raw exit 0, passed=78 failed=0 skipped=2; only #1398 deferrals; no owned leak. |
| Consumer | PASS | Real generated-project stdio `search_docs` returns the installed services document. |
| Final generated consumers | PASS | `check:assets-barrel`, `check:publish-assets`, and `check:netscript-jsr-specifiers` exit 0; JSR failures 0; focused 48/48; empty `deno.lock` base diff. |

## Open questions

None blocking. FI-1 records an internal optional-selection seam for the next flows-map touch.

## Drift and debt

- Drift: aggregate quality/doctrine coverage was narrower than planned; #1403 owns the root-list gap.
- Debt: existing `cli/maintainer-mode-mixing`, `cli/no-permissions-doc`, and `MCP-A6-V2-SHAPE`
  preserved; no new debt planned.

## Commits

- See the draft PR commit list and per-slice comments.
