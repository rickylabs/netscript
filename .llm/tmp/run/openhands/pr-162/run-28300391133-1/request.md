You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max provider=openrouter output=pr-comment iterations=600

use harness

You are the IMPL-EVAL evaluator (separate session from the generator) for **PR #162 — docs realignment**. This is a **documentation accuracy** validation against framework ground truth. You are the evaluator only: you do NOT edit docs or "fix" anything. You read the changed docs, verify each claim against the actual code, run the docs build, and emit a **per-domain verdict**.

## SKILL

Activate and follow these repo skills before any work:
- `netscript-harness` — IMPL-EVAL protocol, verdict definitions (PASS / FAIL_FIX / FAIL_RESCOPE / FAIL_DEBT), evaluator-separation rule.
- `netscript-doctrine` — package/plugin public-surface truth for the capabilities being documented.
- `netscript-deno-toolchain` — use `deno doc <module>` / `deno doc --filter <symbol>` to confirm a documented symbol/type actually exists and is exported; `deno why <pkg>` for coupling questions. `deno doc` is the cheapest ground-truth check — prefer it over guessing.
- `netscript-cli` — the `init` scaffold surface, `--db` / `--cache` flags, db-engine domain.
- `netscript-tools` — scoped check/lint/fmt wrappers and gate-evidence rules; raw root noise is not a verdict.

## Scope of this PR (three docs passes, one branch)

The PR branch `docs/alpha11-cli-surface` carries three commits. Validate each as its own domain:

1. **Cache → multi-backend** (commit `b847c6a8`). Claim: `redis` is the default cache backend; `garnet` and `deno-kv` are first-class alternatives selected via `--cache-backend`; cache is enabled by default and disabled with `--cache=false` (NOT `--no-cache`).
2. **Database → polyglot** (commit `28539811`). Claim: scaffold-time `--db` accepts **four** engines `postgres | mysql | mssql | sqlite`; **Postgres is the recommended default** (tutorials keep `--db postgres`); `postgres`/`mysql`/`mssql` provision an Aspire container; **`sqlite` is file-backed, no container**.
3. **Prisma-backed subsystems follow the scaffolded engine** (commit `474a47ca`). Claim: the sagas `prisma` store and the better-auth backend persist through the project's Prisma client and therefore run on whichever engine was scaffolded (NOT Postgres-only).

## Ground-truth anchors you MUST verify against code (do not trust the prose)

- **DB engine domain:** `packages/cli/src/kernel/domain/db-engine.ts` — confirm `DbEngine = 'postgres'|'mysql'|'mssql'|'sqlite'`, that the `DbEngineProvider` for `sqlite` has `supportsContainerMode: false` (file-backed, no container) and the other three have container mode, and that Prisma providers map postgres→`postgresql`, mysql→`mysql`, mssql→`sqlserver`, sqlite→`sqlite`.
- **CLI default:** the literal `init` default DB is `none` (no DB) — confirm the docs frame Postgres as the *recommended* default, never claim the CLI's literal default is Postgres.
- **`--cache` surface:** confirm `--cache` (default on) + `--cache-backend` exist and disable is `--cache=false`; the docs must not invent `--no-cache`.
- **CRITICAL — runtime adapter vs scaffold `--db`:** the runtime *second-datasource* adapter barrel (see `capabilities/database.md` and the generate-engine code) ships **three** engines (postgres / mssql / mysql) — there is **no sqlite runtime adapter**. Scaffold-time `--db` = 4 engines; runtime adapter barrel = 3. Verify the docs keep these DISTINCT and did NOT fabricate a sqlite runtime adapter.
- **Queue coupling (subsystem pass):** the queue PostgreSQL provider is genuinely Postgres-specific (`packages/queue/adapters/postgres.adapter.ts` uses `FOR UPDATE SKIP LOCKED`, `JSONB`, `TIMESTAMPTZ`, raw `$N` SQL). Verify the docs did **NOT** relabel the queue as polyglot. Conversely verify the sagas `prisma` store (`plugins/sagas/src/runtime/prisma-saga-store.ts`) and better-auth (`packages/auth-better-auth`) are genuinely Prisma-delegating (engine-agnostic), so the new "follows your scaffolded engine" framing is correct.

## Gate

- Build the docs site from `docs/site`: `deno task build` (Lume). It must succeed (expect ~306 files). Report the file count and any Vento/Lume error. Do NOT treat root composite `deno task build` lint/arch failures as a docs verdict — those are package gates out of scope here.
- Spot-check that no internal xref/link introduced by these commits is broken.

## Output

`output=pr-comment`. Emit a **per-domain verdict table** — one row each for (1) cache, (2) database polyglot, (3) subsystem framing — each `PASS` or `FAIL_FIX` with the specific file:line and the code anchor that proves or refutes the claim. If anything is a real but deferrable inaccuracy, mark `FAIL_DEBT` and name it. End with an overall verdict and the Lume build result. Keep it concise and evidence-first; cite `file:line` and the verifying symbol. Do not edit any file.


Issue/PR title: Docs: alpha.11 CLI surface + multi-backend cache + polyglot database realignment

Operational contract:
- Read AGENTS.md first.
- Your iteration budget is limited. Create deliverable files in the repository
  workspace EARLY and grow them incrementally as you learn; never defer all
  writing to the end of the run. Uncommitted workspace files are committed back
  to the branch automatically when the run ends, even if you run out of budget.
- If the task says "use harness", follow .agents/skills/netscript-harness/SKILL.md.
- If the work touches packages/ or plugins/, use .agents/skills/netscript-doctrine/SKILL.md.
- Use rtk for read-heavy git/grep/gh/docker commands when it is available.
- Preserve user changes and avoid destructive git commands.
- Run the smallest validation that proves the change.
- Do not post GitHub issue or PR comments directly. The workflow owns GitHub comments.
- Write /home/runner/work/_temp/openhands/28300391133-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28300391133-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-162/run-28300391133-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 162
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28300391133
