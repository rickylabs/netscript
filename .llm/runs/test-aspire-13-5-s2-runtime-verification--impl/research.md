# Research — Aspire 13.5 S2 runtime verification

## Re-baseline

- Carried-in source: issue #1714, epic #1712, and the ratified research run on
  `origin/research/aspire-13.5-0.0.7`.
- Re-derived against `origin/main` @ `21d516224fe35e92957f0998ee848bbf2024eda0` on 2026-08-30.
- Main still emits Aspire 13.4.6 pins. This slice therefore applies S1 PR #1727's exact 13.5.3 train
  only inside the disposable generated project; the generator and `packages/cli` remain untouched.

## Findings

| # | Finding                                                                                                                                                                          | How to verify                                                                                                       |
| - | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 1 | The lease baseline contained no running Aspire AppHost.                                                                                                                          | `aspire ps --format Json --non-interactive --nologo` → `[]` at `2026-08-29T22:26:47Z`.                              |
| 2 | The lease baseline contained no visible Docker containers.                                                                                                                       | `docker ps -a --format '{{json .}}'` → empty output at `2026-08-29T22:26:47Z`.                                      |
| 3 | Research marks C9, C11, C14, C16, C20, C25 and BC-5 as runtime obligations, not settled facts.                                                                                   | `git show origin/research/aspire-13.5-0.0.7:.../research.md`, sections 2, 3, 5, 6, and 7.                           |
| 4 | The 13.4.6 MCP baseline has 14 tools: `refresh_tools` is present and `get_integration_docs` is absent.                                                                           | `receipts/aspire-13.4.6-mcp-baseline.json` on the research branch.                                                  |
| 5 | `agentic:leak-check --help` and `agentic:teardown --help` are not implemented on this baseline; both reject `--help` as an unknown argument.                                     | Command output captured during bootstrap; parser source accepts the documented slice/worktree/owned-root arguments. |
| 6 | The shipped consumer Aspire skill's 13.4.6 assertions to recheck are detached telemetry exit 12, ~20 s DCP exit, broad-stop unreliability, MCP tools, and the `resources` alias. | `skills/aspire/SKILL.md` and ratified research §5.                                                                  |

## jsr-audit surface scan

- N/A: this slice changes no package, plugin, export map, published source, dependency, or
  generator.

## Open questions

- None that can force implementation rework. Observed 13.5 behavior is the deliverable and any
  divergence is recorded as evidence for S9/S10 rather than repaired here.
