use harness

## SKILL

- `netscript-harness` — run dir, worklog/drift, RED→GREEN discipline, separate-session eval.
- `aspire` — Aspire stop/teardown semantics and DCP container lifecycle.
- `netscript-tools` — scoped validation wrappers; durable receipts via `.llm/tools/gates/run-gate.ts`.
- `netscript-doctrine` — `packages/cli` archetype gates before touching e2e application code.
- `netscript-pr` — PR body/labels/milestone; `Closes #1977` only when every acceptance box is evidenced.

# Implement brief — #1977 cleanup.aspire-stop races `docker inspect` against container removal

Branch `fix/e2e-cleanup-inspect-race` (from `main` `4afbd82a7`), worktree `007-leaf-1977`.
Generator: Codex `gpt-5.6-sol` · high. Evaluator is a separate opposite-family session (not you).
Run dir: `.llm/runs/fix-e2e-cleanup-inspect-race--0.0.7/`. Contract = `gh issue view 1977` (read first).

## Defect

`packages/cli/e2e/src/application/gates/scaffold/runtime/evidence/cleanup.ts` `inspectAllContainers`
lists ids via `docker ps -aq` then `docker inspect <id>` per id through `requireSuccess`. A container
removed between the two calls raises `No such object` and fails the last gate of an otherwise
fully green tier (run 33709012909, sqlite tier, 90/91 passed).

## Slices

- **S1 RED** — unit test in `evidence/` that drives `inspectAllContainers` (or the stop-and-probe path)
  with an injected runner where an id is present in `ps -aq` and `inspect` returns exit 1
  `No such object`; assert the probe treats it as removed. Record the RED receipt.
- **S2 GREEN** — treat `No such object` for a listed id as "already removed" (record the id in the
  cleanup receipt as vanished); any other inspect failure still throws. Minimal diff; no budget or
  timeout changes anywhere. Keep the existing receipt shape backward compatible (additive field).
- **S3 evidence** — scoped check/lint/fmt wrappers over the touched files + the e2e gate tests;
  `deno task check:aspire-version-parity` if any receipt schema string changes; worklog/drift.

## Ceiling

`packages/cli/e2e/src/application/gates/scaffold/runtime/evidence/**` and its tests only. Do not
touch `.llm/tmp/pwcli/`, `deno.lock`, or any gate timeout. No local Aspire runtime — hosted tiers
prove S2.

## PR

Title `fix(e2e): treat containers removed during aspire stop as a successful cleanup observation`;
body per netscript-pr template with `Closes #1977`; labels
`type:fix area:cli area:aspire gate:e2e priority:p1 orchestrator:fixes status:impl ci:full`;
milestone `0.0.7`. Open as draft, then mark ready when S1–S3 are green.
