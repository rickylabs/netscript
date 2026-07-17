# PLAN-EVAL — `mcp-skills--orchestrator/s1` (cycle 2)

- Plan evaluator session: separate local PLAN-EVAL session (opposite-family) / 2026-07-12
- Run: `mcp-skills--orchestrator/s1`
- Surface / archetype: `packages/mcp` (new) / Archetype 6 — CLI / Tooling v2
- Scope overlays: none

> Cycle-1 returned `FAIL_PLAN` on an unresolved Archetype-6 v2 shape decision. The plan was revised
> during this evaluation. All findings below are verified directly against the current source
> artifacts (`plan.md`, `worklog.md`, `research.md`, `arch-debt.md`) at HEAD `7c800e74`, not against
> any claim restated in this file.

## Checklist results

| Plan-Gate item | Result | Evidence / location |
| --- | --- | --- |
| Research present and current | PASS | `research.md` re-baselined against `7c800e74` (verified = current HEAD via `git rev-parse`). Spot-checked four load-bearing facts against the tree: `packages/mcp` absent (`ls`), root `deno.json` workspace = `packages/*` (line 4), siblings `packages/cli`/`packages/telemetry` at `0.0.1-beta.8`, and the folder-shape conflict is now named in Findings + Open Questions. |
| Decisions locked | PASS | `plan.md` D1–D8. D8 explicitly locks the owner horizontal folder law over the A6 v2 kernel/vertical shape, with rationale, and reconciles it via the doctrine-sanctioned deviation path. The prior "No architecture debt is expected" contradiction is removed — §Anti-Patterns now reads "Architecture debt `MCP-A6-V2-SHAPE` is accepted … No other debt is expected." `worklog.md` §Design marks the horizontal shape "an explicit Archetype-6 v2 deviation tracked as `MCP-A6-V2-SHAPE`, not an assertion of full v2 conformance." |
| Open-decision sweep | PASS | `plan.md` §Open-Decision Sweep now lists "Archetype-6 v2 folder shape — resolved now (owner brief wins; deviation documented and debt-registered)." Independent evaluator sweep (below) finds no remaining decision that forces S1 rework. |
| Commit slices (< 30, gate + files each) | PASS | 3 ordered slices, each naming what it proves, its gate, and **concrete** paths (e.g. `src/domain/{schema,tool-contracts,tool-types,telemetry-probe-port}.ts`, `src/application/runner/{mcp-server,truncation}.ts`, `tests/{doctor,stdio,truncation}_test.ts`). Slice 3's previously-unbounded fix scope is now bounded: run artifacts only, diagnostic corrections restricted to the responsible named Slice-1/2 file, scope expansion requires rescope. |
| Risk register | PASS | `plan.md` §Risk Register — five risks with mitigations, each mapped to a slice. R5 now names the exact actions: README `Archetype 6 v2 deviations` disclosure, register `MCP-A6-V2-SHAPE`, manual F-CLI assessment, and S7 reassessment. |
| Gate set selected | PASS | `plan.md` §Anti-Patterns and Gates selects scoped check/lint/fmt wrappers, scoped tests, `arch:check`, full-export doc lint, publish dry-run, manual F-CLI-1..31 (PENDING_SCRIPT structural evidence), and consumer import/stdio smoke — consistent with the A6 required-gate order and the gate matrix (consumer import validation required for A6). |
| Deferred scope explicit | PASS | `plan.md` §Goal and Scope Non-scope + `worklog.md` §Deferred Scope exclude telemetry aggregation, docs corpus, command execution, endpoint discovery beyond explicit/env/default, skills, CLI registration, scaffold changes, S2–S9. |
| jsr-audit surface scan (pkg/plugin) | PASS | `research.md` §Planned JSR Surface Scan applies the publishability rubric to the planned surface: `deno.json` name/version/description/`.`+`./cli` exports/publish include-exclude/README permissions; explicit types + JSDoc; `@module` on both entrypoints; ESM-only, no self-referential bare imports, no published tests; doc-lint / dry-run / clean-file-list / slow-type gates named. |

## Open-decision sweep (evaluator-run)

None force S1 rework.

- **Archetype-6 v2 folder shape** — previously the sole rework-driving open decision; now locked by D8
  and reconciled through the doctrine-sanctioned deviation mechanism. The deviation is disclosed
  (README section, slice 1) and debt-registered. Verified: `arch-debt.md:2089` `MCP-A6-V2-SHAPE`
  carries ID, title, context, why-deferred, **owner** (Agentic-combo epic #721 / S7 CLI slice),
  **target** (reassess at S7), **linked plan** (D8), created date, **status** (open, DEBT_ACCEPTED),
  and a **concrete closing gate** (S7 migrates to the v2 shape and passes F-CLI-1..31, or doctrine
  classifies a protocol-engine subtype whose horizontal shape is normative). All required debt fields
  present; this is a valid acceptance, not a masked rescope — none of the A6 §"Rescope Triggers"
  apply to a greenfield single-flow protocol engine.
- Zero-dependency subset (D1), contract representation (D2), probe-port placement (D3),
  registry-as-data (D4), `not_implemented` behavior (D5), truncation boundary (D6), and workspace
  wiring (D7) are adequately locked; later analytics and CLI-twin timing are safely deferred to
  S2–S9.

## Verdict

`PASS`

## Notes

Cycle-1 required fixes are satisfied and verified in the source artifacts (not merely restated):

1. The Archetype-6 v2 deviation is explicitly decided (D8), planned for README disclosure (slice 1),
   and registered as accepted debt `MCP-A6-V2-SHAPE` with a complete field set and concrete closing
   gate; the "no debt expected" inconsistency is removed.
2. All three commit slices carry bounded, concrete file scopes and proving gates.
3. The risk register matches the selected deviation/debt handling.

Advisories for IMPL-EVAL (non-blocking; do not affect this Plan-Gate verdict):

- Confirm the debt-covered horizontal shape passes `deno task arch:check` scoped to `packages/mcp`,
  and specifically that the `src/infrastructure/` folder name and the `cli.ts` root executable
  satisfy (or are debt-covered for) F-11 folder vocabulary and F-CLI-15/F-CLI-16 (`Deno.exit`/`Deno.*`
  confined to `bin/**`/adapters). These fall under the `MCP-A6-V2-SHAPE` deviation umbrella; IMPL-EVAL
  should verify the umbrella actually covers whatever `arch:check` flags rather than assuming it.
- Verify the README `Archetype 6 v2 deviations` section is actually present in slice 1 output and
  points at `MCP-A6-V2-SHAPE`.

This verdict evaluates the plan only; implementation gates remain for IMPL-EVAL. Spot-checks performed
against the tree at HEAD `7c800e74`: `packages/mcp` absent, workspace `packages/*`, siblings
`0.0.1-beta.8`, `MCP-A6-V2-SHAPE` present at `arch-debt.md:2089`.

PASS
