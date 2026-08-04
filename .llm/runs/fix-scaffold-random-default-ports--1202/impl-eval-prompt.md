use harness

## SKILL

- `netscript-harness` — enforce a separate formal IMPL-EVAL and write the tracked verdict artifact.
- `netscript-doctrine` — assess the Archetype-6 CLI/package layering and framework-wave law.
- `netscript-cli` — assess scaffold emission, generated workspaces, and the runtime suite contract.
- `netscript-tools` — interpret scoped gate and lock-hygiene evidence.
- `jsr-audit` — assess the CLI publish dry-run evidence.
- `netscript-pr` — assess Definition-of-Done and close-gate truthfulness.
- `rtk` — use token-efficient read-only git/grep commands.

# IMPL-EVAL — randomized scaffold default ports

Act as the independent formal implementation evaluator for draft PR 1211 on branch
`fix/scaffold-random-default-ports`. The Codex implementation session authored the change; you must
adversarially inspect it and must not self-certify based only on its prose.

Read the issue evidence and run artifacts under
`.llm/runs/fix-scaffold-random-default-ports--1202/`, then inspect the complete diff from base commit
`f7558aa1c4e06f076114d924c7324feddf554e45` through HEAD. Focus on:

1. Every automatically generated listener default is at least `49152`, while protocol-owned
   database/cache/OTLP ports remain unchanged.
2. The project/resource allocation is deterministic, stable, bounded, and probes configured
   collisions.
3. App/service Aspire host ports remain dynamic unless explicitly pinned; plugin API pins are
   deterministic high-range values and every E2E consumer follows the same allocation.
4. The generated-output tests are semantic and would fail on the baseline `3000`/`5173` behavior.
5. Prisma/DB wiring and runtime evidence are credible: the recorded one-pass is 70 passed, 0 failed,
   including `behavior.service-health` and cleanup.
6. No public-surface, layering, lint-ignore, or lockfile regression was introduced. The worktree's
   one-line `deno.lock` modification predates this run and is excluded from every commit.
7. The PR body truthfully leaves the owner-owned Windows-service task unclaimed and uses only
   `Refs` while that box remains external.

You may run bounded read-only inspections and focused tests if needed. Do not edit product source,
do not mutate or restore `deno.lock`, do not commit, push, update the PR, or start another full
`scaffold.runtime` pass.

Write the verdict of record to
`.llm/runs/fix-scaffold-random-default-ports--1202/evaluate.md` with:

- `**[PHASE: IMPL-EVAL] [VERDICT: PASS|FAIL_FIX|FAIL_RESCOPE]**`
- evaluator route/model and inspected commit
- blocking findings first, with file/line evidence
- gate-evidence assessment and residual risks
- a concise close-gate recommendation

PASS only if no implementation correction is required.
