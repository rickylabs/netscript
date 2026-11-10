# Supervisor Identity — rfc-gpuix-desktop--rfc

Written at run start per `workflow/lane-policy.md` § Supervisor identity.

| Field    | Value                                                                                   |
| -------- | --------------------------------------------------------------------------------------- |
| Model    | Claude Opus 5.5 (`claude-opus-5-5`) · Anthropic                                         |
| Session  | Claude Code session `f9a3cc0e-0d62-4261-9cbb-ce349db1fb02` (T3 Code, N5)                |
| Host     | N5 agent container · Debian 12 · user `node` (uid 1000); Docker via `netscript-dind`    |
| Checkout | `/home/agent/projects/netscript/repo`                                                   |
| Worktree | `/home/agent/projects/netscript/worktrees/rfc-gpuix-desktop`                            |
| Branch   | `docs/rfc-gpuix-native-desktop`                                                            |
| Baseline | `origin/main` @ `0f821911a` (fetched 2026-11-09)                                        |
| Run ID   | `rfc-gpuix-desktop--rfc`                                                                |

## Routes in force

| Task lane                     | Provider / model / effort                         | Role in this run                                                    |
| ----------------------------- | ------------------------------------------------- | ------------------------------------------------------------------- |
| Owner-directed researcher/POC | Anthropic / Claude Opus 5.5 / this session        | Research, PoC build, benchmark, RFC author (generator)              |
| PLAN-EVAL (feature tier)      | Per `deno task agentic:matrix --tier feature --plan-evaluator`; Anthropic-family candidates skipped | Separate-session, different-family review of the RFC + evidence |

Tier: `feature` (no owner authorization for `complex`/`architecture`; the privileged-row rule caps
it). Reference `.llm/harness/workflow/lane-policy.md` for the full matrix.

## Recorded lane/eval overrides

- **Owner-directed generator.** The owner asked this Claude session directly for research, a working
  PoC, a benchmark, an installable and the RFC. No WSL Codex implementation lane was used: the PoC is
  evaluation evidence under `.llm/runs/`, not `packages/`/`plugins/` framework source, so the
  supervisor-does-not-write-framework-code boundary is not crossed. Any accepted implementation
  (adapter package, CLI packager, SDK seams) returns to the normal Codex implementation lane.
- **Runs location.** `~/projects/netscript/runs/` is root-owned on this host; all run evidence lives
  in this tracked run dir instead.
