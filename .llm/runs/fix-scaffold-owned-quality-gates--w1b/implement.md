use harness

# Canary.15 W1-B — scaffold-owned quality gates

You are the sole implementation writer and PR supervisor for W1-B. Work only in
`/home/codex/repos/ns005-c15-w1b-scaffold-quality` on branch
`fix/scaffold-owned-quality-gates`, freshly based on `origin/main` at
`7af6d1c02ab3f380dde7354ebac190e67d363db0`.

## SKILL

- `netscript-harness` for the run artifacts, phase gates, commit trail, and independent evaluation.
- `netscript-doctrine` before changing `packages/cli` or generated package/plugin architecture.
- `netscript-cli` for scaffold, generated task, installed agent-tool, and CLI E2E behavior.
- `netscript-pr` for one draft PR directly against `main`, issue closure, taxonomy, milestone, and PR comments.
- `netscript-tools` for trustworthy wrapper gates, current-head evidence, and lock/worktree hygiene.
- `netscript-deno-toolchain` for native Deno inspection and publication checks.
- `codex-wsl-remote` for the daemon-attached, mobile-visible, exactly-one-writer lifecycle.
- `rtk` for compressed exploratory reads only; use raw verdict sources for final gate evidence.

## Authoritative scope

Implement the connected W1-B cluster only:

- #1024: close its one remaining unchecked acceptance item by proving a scaffolded consumer can run the full E2E smoke without cloning the framework repository. Preserve the already-shipped agent tooling/docs bundle behavior and evidence from #1092.
- #1328: make generated quality tasks cover every scaffold-owned TypeScript/TSX surface executed by the default AppHost; make a fresh full scaffold inherently lint/format clean; fix generator defects instead of hiding them; exclude offline docs, generated bundles, caches, and non-product files only where they are not generator-owned product source; add deliberate TS and TSX/plugin/runtime negative probes; use the repository's scoped quality-runner conventions rather than shell globs.

Re-query both current issue bodies and current `origin/main` before locking the plan. Treat every acceptance box verbatim. Inspect the merged #1092 implementation and current `scaffold.runtime`/consumer tool path before changing code. Keep this a small repair of generated contracts and their proving tests; do not absorb W1-C, Billing Run, publication, release orchestration, or unrelated repo-wide formatting.

## Phase lifecycle

1. Confirm the worktree is clean except for this pre-staged run skeleton, has no upstream, and is exactly at the declared base. Never mutate any other worktree, including the quarantined T2 worktrees or the old `ns004-agenttools` worktree.
2. Preserve `deno.lock`: do not stage, restore, delete, regenerate, or reload caches.
3. Research current code and complete `research.md`, `plan.md`, `supervisor.md`, `worklog.md`, `context-pack.md`, and `drift.md`. Identify the CLI/tooling archetype, public/generated contract, negative tests, and smallest trustworthy gates.
4. This cluster is decision-heavy enough to require PLAN-EVAL. Commit and push the run bootstrap with an explicit refspec, then open one DRAFT PR with head `fix/scaffold-owned-quality-gates` and base `main`. The body must use `Closes #1024` and `Closes #1328`, truthful unchecked DoD boxes, run-dir link, slices, validation, drift/debt, and fenced `acceptance-evidence` mappings. Apply milestone `0.0.5` and valid namespaced labels with exactly one `status:`. Reconcile issue lifecycle labels without deleting unrelated labels.
5. Stop before product-code edits and leave a concise PLAN-EVAL handoff naming the PR, head SHA, plan risks, exact evaluator route, and files the evaluator should inspect. Do not self-certify the plan.
6. After the supervisor supplies a separate-session PLAN-EVAL PASS, resume this same thread. Address any findings, then implement contract/tests first and code second in one or a few reviewable slices. Push explicitly, post structured PR comments, and keep artifacts current.
7. Run focused semantic tests and scoped check/lint/fmt wrappers first. Prove generated task coverage with deliberate failing TS and TSX/plugin/runtime fixtures, then green fresh-scaffold quality. Run the installed consumer smoke without a framework clone. Run the one-pass `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` only at merge readiness after a clean leak-check and without overlapping foreign resources.
8. Perform substantive self-inspection, but do not write an IMPL-EVAL PASS, mark ready for review, or merge. Stop after implementation gates are green and leave an exact independent IMPL-EVAL handoff. OpenHands is paused; never trigger it and never repeat a valid PASS.

## Protected state

- Exactly one implementation writer owns this worktree.
- Never overlap app-server and CLI/tmux writers for this thread/worktree.
- Preserve the root worktree's dirty `deno.lock` and all foreign/quarantined worktrees.
- Do not publish any package or start Billing Run.
