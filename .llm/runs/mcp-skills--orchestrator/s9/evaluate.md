# IMPL-EVAL — mcp-skills--orchestrator/s9

- Impl evaluator session: fresh opposite-family IMPL-EVAL (Claude · Opus), 2026-07-12
- Run: `mcp-skills--orchestrator/s9`
- Surface / archetype: `packages/mcp` + CLI docs/E2E + docs site — Archetype 6 (CLI / Tooling)
- Scope overlays: `docs`
- Tree state at eval: no commits (HEAD `c6f91629`), working-tree changes only; correct for this
  user-directed pre-commit evaluation gate.

## Method

Read the run loop, all S9 artifacts (`research`, `plan`, `plan-eval` PASS, `worklog`, `drift`,
`context-pack`, `supervisor`, brief), and the complete working-tree diff. Independently reran only
cheap focused checks to substantiate the worklog matrix; did not run `scaffold.runtime`. Verified
docs/README claims against source (`TOOL_NAMES`, command policy, endpoint chain, installer output).

## Deliverable verification

| # | Deliverable | Verdict | Evidence |
| - | ----------- | ------- | -------- |
| 1 | Docs page `docs/site/capabilities/agent-tooling.md` | PASS | Combo intro, per-host install table, 13-tool catalog with CLI twins, token-efficiency (search→get funnel), data boundary, `--endpoint`→env→Aspire→default discovery chain, default-deny allowlist summary, smoke invocation. Public wording only. Uses valid `layouts/base.vto` (same layout as other content pages, e.g. `glossary.md`). |
| 2 | READMEs (`packages/mcp` + `packages/cli`) | PASS | MCP README documents public API, tool catalog, `McpCliOptions` seams, endpoint discovery, doctor composition, data boundary, required permissions, transport. CLI README gains a public-worded `## Agent tooling` section linking the capability page. |
| 3 | JSR audit + publish dry-run | PASS | Reproduced: `doc:lint --root packages/mcp` → `combinedTotal: 0` (exit 0); `deno publish --dry-run` → `Success`, clean packages/mcp-only file list. Worklog also records repo JSR audit PASS (benign slow-type-banner warning) and workspace `publish:dry-run` PASS after the timer fix. |
| 4 | Stdio e2e smoke | PASS | `packages/cli/e2e/tests/agent/agent-mcp-stdio_test.ts` spawns the real CLI bin (`deno run -A bin/netscript.ts agent mcp`) over stdio against a minimal temp fixture + unreachable endpoint `http://127.0.0.1:1`; asserts initialize serverInfo, `tools/list` == 13, `doctor` structured warn/fail, `search_docs` fixture slug, `get_app_status` structured non-crash, `execute_command deploy` → `isError`/`command_denied`/`deny_deploy`. Independently reran: **1 passed, 0 failed (398ms)**. |
| 5 | Umbrella evidence | PASS | `worklog.md` final validation matrix is complete and matches reproduced results. |

## Independently reproduced checks

| Check | Command | Result |
| ----- | ------- | ------ |
| Stdio smoke | `deno test --allow-all …/agent-mcp-stdio_test.ts` | 1 passed (398ms), exit 0 |
| MCP package tests | `deno test … packages/mcp/tests/` | 39 passed, 0 failed (fixture reflow did not break docs-corpus tests) |
| Fmt (touched .ts, repo config) | `deno fmt --check cli.ts spawn-command-executor.ts smoke_test.ts` | 3 files, exit 0 |
| Type check | `deno check --unstable-kv cli.ts mod.ts smoke_test.ts` | exit 0 |
| Doc lint | `deno task doc:lint --root packages/mcp --pretty` | combinedTotal 0, exit 0 |
| MCP publish dry-run | `deno publish --dry-run --allow-dirty` | Success, exit 0 |
| Public-docs law | `grep -rInE "eis\|VIF\|CSB\|PR #\|dogfood" docs/site packages/mcp/README.md` | empty (PASS) |
| Source alignment | catalog tables vs `domain/tool-types.ts` `TOOL_NAMES` | exact 13-name match, same order |
| No commits / no PR | `git log --oneline -1` | HEAD `c6f91629` unchanged |

`arch:check` accepted on worklog evidence (PASS, pre-existing warnings only); the slice adds no
framework-layer behavior, so rerun cost is unjustified.

## Scope discipline

- Only behavior change is the drift-recorded timer-portability fix
  (`spawn-command-executor.ts`: `number` → `ReturnType<typeof setTimeout>`), one line, covered by
  command tests and the stdio smoke. Within the plan's "minimal correction exposed by the smoke"
  allowance — not a rescope trigger.
- `packages/mcp/cli.ts` diff is **formatting-only** (double→single quote + comment reflow), no
  functional edit. Verified `cli.ts` passes `deno fmt --check` only in single-quote form under the
  repo's `singleQuote: true` config; neighbors (`mod.ts`, `src/**`) already use single quotes, so
  this is the fmt gate normalizing an inherited non-conforming file, disclosed in the worklog.
- No new dependencies; `deno.lock` untouched; no public API expansion; no new tool/command/transport.

## Minor observations (non-blocking, not rework)

1. Diff noise: `cli.ts`, CLI `README.md`, and three doctor doc fixtures carry formatter reflow
   beyond the semantic change. Formatter-driven and disclosed; benign.
2. The implementation agent reflowed its own brief `implement.md` (markdown line-wrap; content
   byte-identical). Cosmetic; briefs are ideally immutable.
3. MCP README "Archetype 6 v2 deviations" section names the internal debt id `MCP-A6-V2-SHAPE` and
   "owner-approved" in a JSR-published README. Not matched by the defined public-docs grep and it is
   accurate architecture documentation, but it is borderline internal-process vocabulary for a
   published artifact — worth a trim on a future pass.
4. `agent-tooling.md` is the only non-redirect content page under `capabilities/` (siblings are
   redirect stubs to relocated topic folders); a mild IA-orphan risk. PLAN-EVAL explicitly locked
   and blessed the D1 placement, the page builds clean (`docs:links` 0 broken), so this is a soft IA
   point, not a defect.

## Verdict

`PASS`

## Notes for supervisor

- Deliverables complete, accurate to source, and validated; safe to create the small logical
  conventional commits referencing `#733` (no closing keyword) and push the branch. Do not open or
  merge a PR — umbrella integration is the supervisor's step.
- Consider (optional, not gating) trimming the README internal debt-id vocabulary (observation 3)
  and confirming the capability page is reachable in site nav (observation 4) during umbrella
  review.
