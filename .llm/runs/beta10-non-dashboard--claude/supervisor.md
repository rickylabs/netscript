# Supervisor — beta.10 non-dashboard stream

## Route identity

| Field | Requested | Observed |
| --- | --- | --- |
| Lane | Claude (Tier A/B supervisor) | Claude |
| Provider | Anthropic | Anthropic |
| Model | `opus-4.8` | `claude-opus-4-8` |
| Effort | high | high |

Requested and observed identity match. No route drift.

## Identity

- **Run id:** `beta10-non-dashboard--claude`
- **Reports to:** beta.10 orchestrator (`.llm/runs/beta10--orchestrator/supervisor.md`)
- **Brief of record:** `.llm/runs/beta10--orchestrator/briefs/non-dashboard.md`
- **Host:** WSL2 (linux)
- **Orchestrator worktree:** `/home/codex/repos/netscript-beta10` (`feat/beta10-integration`)
- **Working worktree:** `/home/codex/repos/ns-b10-715` (detached at PR #715 head)
- **Target branch:** `feat/netscript-mcp-skills` (PR #715 head)
- **Baseline:** `5b1a9877` — `chore(mcp): align @netscript/mcp to beta.9 + declare cli->mcp dep`

## Scope

Milestone 12, **non-dashboard only**.

- **P0** — PR #715: (a) `run-deno-lint.ts` CI swallow bug + the real batch failure it hid;
  (b) `packages/cli` + `packages/mcp` README rewrite; (c) merge readiness.
- **P1** — #763 (published-mode `scaffold.plugin.ai.lifecycle`), #762 (`@ts-ignore`/`as never`
  sweep → repo-drift CI blocking), #695 (checkpoint-execution tutorial validation).

**Out of scope (parallel design stream):** `plugins/dashboard`, DDX issues #410–#432 / #551–#557,
#507, #509, the Claude Design project, `tools/design-sync/`.

## Lanes

| Lane | Assignment | Rationale |
| --- | --- | --- |
| Supervisor / Tier A | Claude · Anthropic · `opus-4.8` · high (this session) | Orchestration, slice review, sign-off |
| Repo tooling (`.llm/tools/`, `deno.json` tasks) | this session | Not framework source; permitted on this lane |
| Documentation authoring (READMEs) | this session | CLAUDE.md documentation-authoring exception |
| Framework source (`packages/**`, `plugins/**`) | **WSL Codex (Tier D)** | Doctrine: supervisor does not write framework code |
| PLAN-EVAL / IMPL-EVAL | Separate opposite-family session (Codex / OpenHands) | Generator ≠ evaluator (hard invariant) |

## Invariants acknowledged

- Generator ≠ evaluator. This session **never self-certifies**.
- Slice review gate: Tier-A review before any sign-off commit.
- `Closes #N` in PR bodies; namespaced labels + milestone on every issue/PR.
- No lock-file deletion; no `deno cache --reload` without approval.
- Nothing merges without owner sign-off.
