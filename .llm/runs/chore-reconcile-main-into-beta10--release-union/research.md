# Research — beta.10 release union

## Re-baseline

- Carried-in source: owner-supplied reconciliation brief.
- Re-derived against `origin/main` @ `10162bfd`, fetched 2026-07-17.
- `origin/main` is three commits ahead of the integration head: `6a710bd5`, `f391190f`, and
  `10162bfd`.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | The integration head is `d962502f` and the worktree began clean. | `git status --short --branch`; `git rev-parse HEAD` |
| 2 | Main adds the OpenCode lane, Fable restoration, and the MCP/skills/agent-CLI combo. | `git log --oneline HEAD..origin/main` |
| 3 | Both sides changed routing policy and lane-policy documentation. | `git diff --name-status HEAD...origin/main` |

## jsr-audit surface scan

- N/A: this slice designs no package surface; it forms a merge union of already-reviewed commits.
  The newly present `packages/mcp` surface receives the owner-requested focused smoke test.

## Open questions

- None. Conflict semantics and the required gate set are owner-ratified in the task brief.
