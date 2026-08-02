# PLAN-EVAL — fix-1046-run-owned-teardown--enforced-teardown

- Plan evaluator session: **supervisor (Claude Code, Opus 5)**, 2026-08-02 — under the owner's
  2026-08-01 waiver of the open-model Plan-Gate evaluator. No OpenRouter / Qwen / OpenHands /
  `claude-print` / `provider-canary` lane was invoked; that lane is dead for this run.
- Run: `fix-1046-run-owned-teardown--enforced-teardown`
- Surface / archetype: Archetype 6 (CLI/tooling) + docs overlay; `.llm/tools/**`, `.llm/harness/**`,
  `.agents/skills/**`, `AGENTS.md`, `deno.json`.
- Scope overlays: docs.

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | `research.md` F1–F10 — all derived on this checkout/host, incl. live `aspire ps` JSON and live `docker` label dump; no carried-in facts |
| Decisions locked                        | PASS   | `plan.md` D1–D8, each with rationale tied to a numbered finding |
| Open-decision sweep                     | PASS   | `plan.md` § Open-decision sweep — 8 rows, 6 resolved-now, 1 safe-to-defer (staleness value), 1 resolved |
| Commit slices (< 30, gate + files each) | PASS   | 11 slices, each with a named gate and file list |
| Risk register                           | PASS   | R1–R8; the two Critical rows are the parallel-run kill and the MCP kill |
| Gate set selected                       | PASS   | § Gate set; N/A classes recorded explicitly rather than omitted |
| Deferred scope explicit                 | PASS   | 3 items, each with a reason |
| jsr-audit surface scan (pkg/plugin)     | N/A    | no `packages/**` or `plugins/**` surface touched |

## Open-decision sweep (evaluator-run)

Decisions that would force rework if deferred — all closed in the plan:

1. **Ownership proof mechanism.** Would have forced a rewrite of every consumer if resolved late.
   Closed by D1 on evidence (F4) rather than on a mechanism we cannot apply.
2. **Two-valued vs three-valued classification.** A boolean `isOwned` would have made "unproven"
   collapse into one of the two branches; whichever way it collapsed would be wrong. Closed by D2.
3. **Enforcement seam.** Closed by D5 on `parseDoneContract`, which F5 shows is the single funnel.
4. **`skills/**` fork vs route.** Closed by D7; a fork would have to be undone on #1034's merge.

None remain open.

## Adversarial review of the two Critical risks

- **R1 (killing a sibling's resources).** The plan's default branch is `unproven → escalate`, and
  the actionable set is the *intersection* of two independent positive proofs' union with a
  re-verification at the moment of removal. The empty-registry test and the forbidden-command grep
  test give this a red-able assertion rather than a promise. Accepted.
- **R2 (killing `aspire mcp start`).** Accepted specifically because D4 is structural — the tool has
  no verb that can express "stop an MCP server" — with the pattern guard as defence in depth rather
  than as the mechanism. A plan that relied on the guard alone would have been `FAIL_PLAN`.

## Verdict

`PASS`

## Notes

- The plan must not be read as promising acceptance box 5 in full: `skills/aspire`, `skills/deno`
  and `skills/help.md` are not on `main` (F8), so "installed for this repo's own agents" is
  satisfied by the routing/install task (D7) against whatever the bundle contains today. If, at
  IMPL-EVAL, that cannot be evidenced end-to-end, the PR must drop the closing keyword and carry a
  Remaining-scope section rather than tick the box.
- `--unstable-kv` must not be passed to `.llm/tools/run-deno-check.ts`; it is emitted by default and
  the flag is rejected with exit 1. Recorded in the brief.
