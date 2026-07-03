# IMPL-EVAL brief — #338 [Deploy-S2] Archetype 7 doctrine (separate session)

You are the **separate-session evaluator** for a docs/doctrine harness slice. You did NOT
implement this; evaluate the BUILT artifact adversarially, then reproduce the applicable
quality gate. Write a verdict file and end with a single line `result: PASS_IMPL` or
`result: FAIL_IMPL` (+ blocking findings).

## What was built

Branch `feat/deploy-s2-doctrine` (PR #357, DRAFT), off `origin/main`. It authors a **new
Archetype 7 — Deployment Target Adapter** across the three harness archetype surfaces + a
debt entry, for the deployment epic #327. Commits: `287f3544` (doctrine), `72d055cf`
(harness surfaces), `c9845951` (debt), `1d981a70` (reconciliation follow-up).

## Files to read (worktree: C:\Dev\repos\netscript-framework\.claude\worktrees\deploy-s2)

- `docs/architecture/doctrine/06-archetypes.md` — the Archetype 7 section (~L232+), the
  "seven archetypes" intro count, the `## How to choose` decision step 7, the
  `## Archetype assignments for current packages` row (must be marked future/pending, NOT
  a relabel of `cli`), and the checklist rows.
- `.llm/harness/archetypes/ARCHETYPE-7-deploy-target-adapter.md`
- `.llm/harness/archetypes/README.md` (decision-order row)
- `.llm/harness/gates/archetype-gate-matrix.md` (Arch 7 must be in BOTH tables + F-DEPLOY prose)
- `.llm/harness/debt/arch-debt.md` (`DEPLOY-ARCHETYPE-7-CORE-SEED` entry)
- `.llm/tmp/run/deploy-s2-doctrine/contract-reconciliation.md` — the supervisor's op-contract
  reconciliation decision (authoritative). The doctrine MUST conform to it.
- Ground truth for the reconciliation: `packages/cli/src/kernel/domain/deploy/deploy-target-port.ts`
  (shipped 3-op `DeployTargetPort`) and `windows-service-deploy-target.ts` (stub adapter).

## Adversarial checks (the built artifact)

1. **Reconciliation is correct and present.** Archetype 7 prose must acknowledge the shipped
   3-op `DeployTargetPort` + `WindowsServiceDeployTarget` seed (commit `3137e455`) with the verb
   map `build→plan/emit · install→up · uninstall→down`, and state `status`/`logs`/`rollback`/
   `secrets` are net-new. The **7-op lifecycle must remain the canonical contract** — verify the
   doctrine did NOT get demoted to 3-op. The arch-debt entry must carry the 3-op→7-op expansion +
   stub-retire obligation with a closing gate (`F-DEPLOY-1` promoted `gated`).
2. **Three-surface consistency.** Archetype 7 is present and mutually coherent in
   `06-archetypes.md`, the `ARCHETYPE-7-*.md` harness file, and `archetype-gate-matrix.md`
   (both tables). Decision order + assignments updated. No dangling refs.
3. **PLAN-EVAL fixes F1–F4 held.** F1 intro says "seven". F2 assignments row is future/pending,
   `cli` not relabelled. F3 Arch 7 in BOTH gate-matrix tables. F4 no reliance on `arch:check` for
   markdown link integrity.
4. **Doctrine-shape sanity.** Archetype 7 is a genuine cross-package composite (A2 port/adapter +
   A6 thin router), package-agnostic except the intentional seed reference; gates seeded `reviewed`
   (correct for future-wave), not `gated`.
5. **No scope leak.** No product/adapter code, no `.claude/` config/skills/hooks, no `deploy-schema.ts`
   edit, no doctrine renumber. `validate-claude-surface.ts` correctly N/A.

## Quality gate to reproduce (docs slice — NO scaffold.runtime)

- `deno task arch:check` → expect exit 0 (no regression; it does NOT parse doctrine markdown, so
  it is a no-regression signal not a link proof).
- Scoped fmt on the fmt-governed harness files only:
  `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .llm/harness --ext md`
  → expect clean on the edited files. (The doctrine dir + arch-debt.md are baseline-dirty and NOT
  in the repo fmt include; do NOT treat repo-wide `deno fmt --check` as this slice's verdict — see
  the F4 caveat in the worklog.)
- Manual three-surface consistency read (the real proof).

Do not mark PR #357 ready; return the verdict only.
