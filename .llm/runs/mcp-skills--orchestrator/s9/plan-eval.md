# PLAN-EVAL — mcp-skills--orchestrator/s9

- Plan evaluator session: opposite-family PLAN-EVAL (Opus), 2026-07-12
- Run: `mcp-skills--orchestrator/s9`
- Surface / archetype: `packages/mcp` + CLI docs/E2E + docs site — Archetype 6 (CLI / Tooling)
- Scope overlays: `docs`

## Checklist results

| Plan-Gate item                          | Result | Evidence / location                                                                                                                                                                                                                                                                                       |
| --------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | PASS   | `research.md` §Re-baseline: preflight `cf55fe69` ancestor of baseline `c6f9162`, `agent-group.ts` present; carried `../design.md` explicitly demoted to non-authoritative vs source. Spot-checks below all matched the tree.                                                                              |
| Decisions locked                        | PASS   | `plan.md` §Locked Decisions D1–D6, each with rationale (page location, source-derived catalog, smoke placement, real CLI spawn, protocol shape, public-docs law).                                                                                                                                         |
| Open-decision sweep                     | PASS   | `plan.md` §Open-Decision Sweep: named-suite (defer), non-trivial JSR (defer), endpoint-unavailable status (must-resolve, closed by D5). Evaluator sweep found no unflagged rework-forcing decision (see below).                                                                                           |
| Commit slices (< 30, gate + files each) | PASS   | 3 ordered slices; each names proof, gate, and files (`plan.md` §Commit Slices; mirrored `worklog.md` Design table).                                                                                                                                                                                       |
| Risk register                           | PASS   | `plan.md` §Risk Register: 5 risks w/ mitigations (child hang, telemetry variance, internal-design docs, expensive publish gate, lock churn).                                                                                                                                                              |
| Gate set selected                       | PASS   | `plan.md` §Gates selects the A6 matrix (static, universal F-_, F-CLI-_ as PENDING_SCRIPT, F-6/JSR, consumer/publish-dry-run) plus docs-overlay gates (source alignment, link integrity, prohibited-term grep, doc:lint). Consistent with archetype doc's statement that F-CLI-* have no dedicated script. |
| Deferred scope explicit                 | PASS   | `plan.md` §Goal Non-scope and §Debt/deferred: new tools/transports/deps, full scaffold E2E, published-package prod E2E, release/PR/merge all deferred; non-trivial findings recorded not fixed.                                                                                                           |
| jsr-audit surface scan (pkg/plugin)     | PASS   | `research.md` §JSR surface scan: `deno.json` name/exports/publish rules, both export entrypoints carry `@module`, named risks (undocumented exports, slow types, unintended file list). Each risk mapped to Slice 3 (`doc:lint --root packages/mcp` + repo JSR audit + `publish:dry-run`).                |

## Spot-check of load-bearing source facts

- `TOOL_NAMES` = exactly 13 entries — `packages/mcp/src/domain/tool-types.ts:4-18` (research names
  `tool-registry.ts` as the inventory; the frozen name list actually lives in `domain/tool-types.ts`
  and the registry maps over it at `application/tool-registry.ts:47`). Cardinality claim (13) is
  correct; minor sourcing nuance, not plan-blocking.
- `packages/mcp/cli.ts` exposes `McpCliOptions`, `docsRoot`/`endpoint` seams, `runMcpStdioServer`,
  `createMcpCliServer` — confirms D2/D4/D5 composition-root claims.
- `DEFAULT_COMMAND_POLICY` in `src/domain/command-policy.ts`; `execute-command-flow.ts` returns
  structured `code: 'command_denied'` — confirms the D5 must-resolve semantic-assertion contract.
- `initAgent` writes `.mcp.json` + marked `AGENTS.md` (Claude) plus VS Code config — confirms
  research finding 4.
- `packages/cli/e2e/tests/` contains only `application`/`presentation`; no `agent/` dir — D3 is a
  net-new placement, non-colliding.
- `docs/site/capabilities/` present without `agent-tooling.md` — D1 is net-new.

## Open-decision sweep (evaluator-run)

None that force rework if deferred. The three still-open items are correctly categorized: the two
deferrals (named E2E suite, non-trivial JSR fixes) do not block the polish surface, and the one
rework-sensitive item (exact endpoint-unavailable result) is bound to test the implemented schema
semantically (D5) rather than brittle prose, so a later behavior detail cannot invalidate the plan.
Docs slug (D1), smoke placement (D3/D6), and fixture docs root (D5) are all locked. The bounded
"minimal correction exposed by the smoke" is a controlled allowance, not an open decision; if a
non-trivial fix surfaces it is an IMPL-EVAL rescope trigger, correctly out of plan scope.

## Verdict

`PASS`

## Notes

- Minor, non-blocking: research attributes the tool inventory to `application/tool-registry.ts`; the
  authoritative frozen list is `domain/tool-types.ts` (registry consumes it). The load-bearing fact
  (13 immutable tools) is correct. Worth a one-line correction when Slice 1 cites source, but not a
  Plan-Gate defect.
- `packages/mcp/README.md` is 66 lines (research calls it "minimal"); the planned action — document
  the public composition surface + permissions/data boundary (AP-19) — is sound regardless of the
  exact starting size.
- Implementation may begin.
