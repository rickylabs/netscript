# Research — chore-llm-tools-cleanup-sweep--codex

## Re-baseline

- Carried-in source: `.llm/tools/CLEANUP-PLAYBOOK.md` from merged PR #583.
- Re-derived against `main` at `b13ca0fa` on 2026-07-11.
- `git ls-remote origin refs/heads/main` and the corrected remote-tracking ref both resolve to the
  baseline.
- Scope contains 59 non-agentic files, 55 TypeScript files, and 12,988 TypeScript LOC.

## Findings

| # | Finding                                                                                                                                                                  | How to verify                                        |
| - | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| 1 | The baseline check and lint gates have zero findings; 23 tests pass; format has seven existing findings.                                                                 | `.llm/tmp/llm-tools-cleanup/baseline-*.log`          |
| 2 | `deno.json`, workflows, AGENTS, skills, and harness docs directly anchor deps, docs, fitness, git, harness, release, reporting, validation, generator, and runner tools. | `.llm/tmp/llm-tools-cleanup/reference-matrix.tsv`    |
| 3 | No authoritative source names any `search/*.ts` tool; their only maintained descriptions are self-referential tool indexes.                                              | reference matrix rows for `.llm/tools/search/*`      |
| 4 | `e2e/scaffold-e2e-test.ts` has no AGENTS/harness/skill/task/workflow reference and is superseded by `deno task e2e:cli` plus `packages/cli/e2e`.                         | reference matrix; AGENTS.md validation section       |
| 5 | The root run-deno wrappers are heavily referenced and their paths are explicit contracts; moving them would create churn without a concern gain.                         | `deno.json`, AGENTS.md, skills, harness static gates |
| 6 | `generate-cli-assets-barrel.ts` must remain at root because generated provenance embeds its path.                                                                        | `.llm/harness/workflow/tooling.md:106`               |

## jsr-audit surface scan

N/A: this run changes internal repository tooling, not a publishable package/plugin surface.

## Open questions

- Ambiguous keep: `git/git-commit-paths.ts` lacks direct authority but is imported by the
  harness-referenced `git-verify.ts`; keep to preserve that live tool.
- Ambiguous keep: docs-site-local checks have no harness mention but are invoked by
  `docs/site/deno.json`; keep as live consumer contracts.
