# PLAN-EVAL — mcp-skills--orchestrator/s5

- Plan evaluator session: opposite-family (Opus 4.8) local PLAN-EVAL, 2026-07-12, cycle 1
- Run: `mcp-skills--orchestrator/s5` (`@netscript/mcp` S5 doctor aggregation)
- Surface / archetype: `packages/mcp` — Archetype 6 (CLI / Tooling), horizontal shape under accepted `MCP-A6-V2-SHAPE`
- Scope overlays: none

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | `research.md` re-baselined against `dd89ced9` (= current HEAD, verified `git log`). Load-bearing findings spot-checked below. |
| Decisions locked                        | PASS   | `plan.md` §Locked Decisions D1–D10, each with rationale. |
| Open-decision sweep                     | PASS   | `plan.md` §Open-Decision Sweep marks each decision resolved-now / must-resolve-before-Slice-2 / safe-to-defer. Evaluator sweep found no unflagged rework-forcing decision (below). |
| Commit slices (< 30, gate + files each) | PASS   | `plan.md` §Commit Slices — 3 slices, ordered (contract/aggregation → families+composition → merge evidence); each names what it proves, its gate, and files. Ordering matches Archetype-6 "domain/ports/abstracts first". |
| Risk register                           | PASS   | `plan.md` §Risk Register — 6 risks with mitigations, incl. family-exception isolation and scaffold-marker drift. |
| Gate set selected                       | PASS   | `plan.md` §Gates and Debt selects scoped check/lint/fmt, MCP tests, `arch:check`, full-export doc lint, publish dry-run, consumer smoke; F-13 N/A; runtime/Aspire fixture/upstream-inspector based — consistent with `archetype-gate-matrix.md` (Arch 6: runtime optional, consumer required). |
| Deferred scope explicit                 | PASS   | `plan.md` §Goal and Scope "Deferred:…" + `worklog.md` §Deferred Scope (S7 adapter, analytics, docs tools, commands, generic Aspire env doctor, live-app). |
| jsr-audit surface scan (pkg/plugin)     | PASS   | `research.md` §Planned JSR Surface Scan: no new entrypoint; new exported decls require explicit return types + JSDoc; only `@netscript/aspire` import added; JSON-stable bounded output; doc-lint + publish dry-run named as the covering gates; README to document project-metadata reads + S7 seam. |

## Spot-check of load-bearing facts (tree at `dd89ced9`)

- `packages/mcp/src/application/flows/doctor-flow.ts` exists; current flow probes once and returns `pass|warn` (never `fail`) on unreachable — matches the research premise D4 modifies. ✓
- `inspectAspire` is exported from `packages/aspire/mod.ts` (leaf integration package). ✓
- `doctorPlugin` is **not** exported from `packages/cli/mod.ts` (grep empty) — validates D7's dependency-inversion rationale and the S7 cycle-avoidance claim. ✓
- `@netscript/aspire` and `@netscript/mcp` are both workspace members via the `packages/*` glob — D6's "clean leaf workspace dependency" holds. ✓
- `DoctorResult`/`DoctorCheck` in `src/domain/tool-contracts.ts` carry `endpoint`/`checks`/`counts`/`status` — the additive-family plan (D2) is compatible with the real contract. ✓
- `MCP-A6-V2-SHAPE` debt entry is present and `open, DEBT_ACCEPTED`; D10's "no new debt expected, preserve accepted shape" is consistent. ✓

## Open-decision sweep (evaluator-run)

None force rework when deferred.

- The only "must resolve now" item — generated-registry marker names — is correctly gated to before Slice 2 (derive from current scaffold, record in worklog). Deferring it does not force rework because Slice 1 (contract/aggregation/telemetry) does not depend on the marker names; the dependency ordering is sound.
- The S7 real CLI plugin-doctor adapter is genuinely deferrable: D7 introduces `ProjectDoctorPort` as the real (non-speculative) injection seam with an explicit informational-`warn` stub, so no rework is forced when the real adapter lands in S7. This is an AP-2 concern the plan self-flags and the port maps a real S7/test seam.
- Output-shape compatibility (D2), severity math (D3), and explicit-endpoint failure semantics (D4) are all locked, removing the highest-rework-risk decisions before slicing.

## Verdict

`PASS`

## Notes

- D6 adds a `@netscript/aspire` import to `packages/mcp/deno.json`; the JSR surface scan and Slice 2's named `deno.json` edit plus publish dry-run cover the jsr specifier/publish-shape risk. No lock reload is planned (AGENTS.md rule 6 respected).
- Slice 3 is artifact/evidence-only with a stated rescope trigger on scope expansion — consistent with the merge-readiness gate expectations.
