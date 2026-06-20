# Implement Brief — Slice `service-auth-seam`
## Service auth seam (framework-prime-time blocker batch)

## Who you are
You are a WSL Codex daemon-attached implementation agent. You implement ONE approved slice to a
production / enterprise bar. PLAN-EVAL already PASSED for this slice (OpenHands minimax-M3) — do NOT
re-plan or re-litigate the design; implement the approved plan.

## Activate harness
`use harness`. Read, in order:
1. `AGENTS.md` (read-order + operating rules)
2. `.agents/skills/netscript-harness/SKILL.md` → `.llm/harness/workflow/activation.md` +
   `.llm/harness/workflow/run-loop.md` (focus the Implement → Gate phases)
3. `.agents/skills/netscript-doctrine/SKILL.md` + the doctrine files your plan cites under
   `docs/architecture/doctrine/`
4. Your archetype file (per `plan-meta.json` `archetype`) under `.llm/harness/archetypes/` + any
   scope overlay under `.llm/harness/gates/SCOPE-*.md`
5. `.llm/harness/gates/archetype-gate-matrix.md` + `.llm/harness/debt/arch-debt.md`
6. `.agents/skills/netscript-deno-toolchain`, `.agents/skills/jsr-audit`,
   `.agents/skills/netscript-pr` (and `netscript-cli` only if your slice touches scaffold/CLI)

## Your approved plan (authoritative — read fully; deviation requires a `drift.md` entry)
- `.llm/tmp/run/feat-framework-prime-time--supervisor/slices/service-auth-seam/research.md`
- `.llm/tmp/run/feat-framework-prime-time--supervisor/slices/service-auth-seam/plan.md`  ← locked decisions,
  contracts, commit slices, and the `## Gates to run` set
- `.llm/tmp/run/feat-framework-prime-time--supervisor/slices/service-auth-seam/plan-meta.json`  ← archetype,
  scopeOverlays, lockedDecisions, contracts, testPlan

## Pre-flight
- `cd /home/codex/repos/netscript-pt-service-auth-seam`
- `git fetch origin` and confirm HEAD is on branch `feat/prime-time/service-auth-seam` tracking
  `origin/feat/prime-time/service-auth-seam`.
- Confirm the three plan files above exist in this worktree.
- Create your run dir `.llm/tmp/run/feat-prime-time-service-auth-seam--impl/` and scaffold
  `worklog.md` / `commits.md` / `context-pack.md` / `drift.md` from `.llm/harness/templates/`.

## Production / enterprise bar (NON-NEGOTIABLE)
- Real persistence, real error handling, idempotency, observability, and graceful shutdown wherever
  your archetype demands them. NO stubs, NO no-ops, NO `TODO` placeholders, NO silent fallbacks.
- Implement EVERY locked decision and contract in `plan-meta.json`. Deliver the full unit +
  integration + failure-path tests in `testPlan`.
- Adhere to the Architecture Doctrine and your archetype's fitness gates.

## Surfaces / boundaries (HARD)
- Stay strictly inside this slice's surfaces: service composition roots (auth seam) per your plan-meta.json contracts; SCOPE-service.
- Cross-surface change = STOP and record an escalation in `drift.md`; do not silently widen scope.
- Do NOT touch: `packages/aspire/src/public/mod.ts`, `scaffold-versions.ts`, or any version pin
  (LD-8). Never de-catalog dependencies (npm via `catalog:`, JSR inline `jsr:`). Never delete lock
  files or caches, and never run `deno cache --reload`.
- Do NOT merge your branch. The supervisor merges after IMPL-EVAL PASS.

## Commit / push / PR cadence (one commit per slice-step in your plan's commit-slice list)
- Commit by slice-step (each ≤ ~30 files), not a monolith; conventional commit messages.
- Push EXPLICITLY every time: `git push origin feat/prime-time/service-auth-seam` — never a bare `git push`.
- After each commit: append `.llm/tmp/run/feat-prime-time-service-auth-seam--impl/commits.md`
  (`- <sha>: <msg>`) and comment on your sub-PR with the slice scope + commit sha + gate evidence.

## Gates (run exactly the set named in your plan's `## Gates to run`)
- Scoped wrappers, not raw root CLI: `.llm/tools/run-deno-check.ts` / `run-deno-lint.ts` /
  `run-deno-fmt.ts` with `--ext ts,tsx` and your explicit roots. Add `--unstable-kv` to check for
  KV code.
- `deno task test` for your package(s) + the targeted tests in `testPlan`;
  `deno task publish:dry-run` + jsr-audit on the changed public surface; `deno task arch:check`.
- Do NOT run the expensive `deno task e2e:cli` scaffold.runtime suite (no slice in this batch
  changes scaffold output) unless your plan explicitly requires it.
- Record every gate result (command + raw exit code + summary) in `worklog.md`.

## When done
- All gates green with required features intact. Write `context-pack.md` (resumable summary) and a
  final verdict line in `worklog.md`.
- Comment your sub-PR: "Slice `service-auth-seam` implementation complete — ready for IMPL-EVAL" with a gate
  evidence table and the commit list.
- STOP. Do not start another slice. The supervisor runs IMPL-EVAL (OpenHands qwen3.7-max, separate
  session) and merges after PASS.
