use harness

# Leaf: scaffold-generated-output-correctness (#1262, #1263, #1588)

You are the implementation supervisor for one grouped direct-to-`main` NetScript milestone leaf.
Work only in `/home/codex/repos/netscript-007-leaf-scaffold-generated-output-correctness` on
`fix/scaffold-generated-output-correctness`, created from immutable live `origin/main`
`01e0960494c95ce56eb35892c211a095eb13e6ed` with no upstream.

## SKILL

Read completely before acting:

- `AGENTS.md`
- `.agents/skills/netscript-harness/SKILL.md`
- `.agents/skills/netscript-doctrine/SKILL.md`
- `.agents/skills/netscript-tools/SKILL.md`
- `.agents/skills/netscript-pr/SKILL.md`
- `.agents/skills/netscript-cli/SKILL.md`
- `.agents/skills/aspire/SKILL.md`
- `.agents/skills/jsr-audit/SKILL.md`
- `.agents/skills/netscript-deno-toolchain/SKILL.md`
- `.agents/skills/rtk/SKILL.md`

Also read the approved coordination contract at
`/home/codex/repos/netscript-547-lffix/.llm/runs/release-0.0.7--orchestration/leaf-contracts.json`
for `scaffold-generated-output-correctness`, plus live issues #1262, #1263, and #1588. These three
issues must remain one PR and share one `scaffold.runtime` verdict. The coordinator alone merges,
publishes, changes milestone scope, or mutates central cluster state. Never publish locally and
never touch a different worktree.

## Contract

- Own only #1262, #1263, and #1588 and the declared `packages/cli/e2e`, CLI asset/template, and
  database generator surfaces in `leaf-contracts.json`. Stop and report drift before crossing a
  file boundary.
- Run independent red-first probes for all three filed defects against current `main`: placebo
  seeds for schemas with models; missing by-id/update/delete rows becoming 500 instead of defined
  404 and missing OpenAPI projection; unreachable PostgreSQL/MySQL/MSSQL parsers in SQLite runtime
  and Prisma config output. Record an approved fallback only when reproduction is impossible.
- Preserve a truthful empty-schema path for #1262, defined NOT_FOUND behavior plus projection for
  #1263, and SQLite/libSQL plus generated typed Prisma-client behavior for #1588.
- This grouped leaf has material cross-template/runtime choices. Produce research, a locked design,
  ordered reviewable slices, and the bounded plan-gate decision before implementation. Do not use
  ceremonial `PLAN-EVAL: N/A`; only record N/A if the completed research proves every change is
  mechanical and the issue/contract already resolves all material choices. Otherwise stop for the
  orchestrator to launch a separate PLAN-EVAL.
- Select Archetype 6 CLI/tooling and its required gate family. Contract gates are structured
  check/test evidence, publish dry run/JSR audit, `quality:gate`, `arch:check`, and one shared
  `scaffold.runtime` verdict.

## Harness and delivery

Bootstrap the tracked run dir
`.llm/runs/fix-scaffold-generated-output-correctness--0.0.7-wave0/` with `supervisor.md`,
`research.md`, `plan.md`, `worklog.md` containing `## Design`, `context-pack.md`, `drift.md`,
`implement.md`, and `receipts/`. Preserve live issue timestamps/state and red-first outputs.

Use the structured NetScript Deno check/test/lint/fmt reporters and durable JSON gate receipts.
Because this leaf touches `packages/**`, run `quality:gate` plus the applicable JSR
audit/publish-dry-run surface; raw root commands are not verdict evidence. Do not run
`scaffold.runtime`, Aspire, or Docker until the topic orchestrator explicitly confirms the single
global expensive-gate lease. Once granted, run exactly one full one-pass
`deno task e2e:cli run scaffold.runtime --cleanup --format pretty` for the grouped leaf, preserve its
JSON/domain report as the shared verdict, and verify the exact AppHost/container cleanup with
`agentic:leak-check`. Never split the three issues into separate runtime executions.

Commit in reviewable slices. The first run-artifact commit opens a draft PR against `main` in the
same session. Push only with
`git push origin HEAD:refs/heads/fix/scaffold-generated-output-correctness`; never set an upstream.
Use `Closes #1262`, `Closes #1263`, and `Closes #1588` only when each issue's full live acceptance
is truthfully satisfied and mapped with fenced `acceptance-evidence`; downgrade any incomplete
issue to a plain reference and state remaining scope. Apply the required namespaced labels and
milestone `0.0.7`, keep exactly one `status:` label, and post one structured comment per slice.

After automated gates, stop for the topic orchestrator's substantive Tier-A review. The
orchestrator owns the sign-off commit. A separate opposite-family IMPL-EVAL is mandatory before
coordinator handoff; do not mark ready, merge, publish, or self-certify.

Report progress by updating the run artifacts and conclude each turn with branch/head, draft PR,
gates/receipts, PLAN-EVAL state, blockers, resource cleanup state, and the exact same-thread resume
request you need from the orchestrator.
