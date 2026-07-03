# Worklog: [Deploy-S1] `deploy.targets.*` config contract (#337)

## Phase log

### 2026-07-03 — Plan phase (supervisor)
- Slice worktree `.claude/worktrees/deploy-s1` created off origin/main `56ea68b2`, branch
  `feat/deploy-s1-targets-config`.
- Read-only recon mapped the full deploy-config surface (schema, root wiring, public exports,
  resolver/resolved-config, build consumers, tests, docs). Results folded into `plan.md` Change Map.
- Archetype selected: ARCHETYPE-1 (small-contract). Gate set + validation plan locked.
- **Evaluator-path note:** the harness delegation contract prefers OpenHands (minimax M3) for
  PLAN-EVAL. The coordinator (on the user's 2026-07-03 impl-greenlight) explicitly authorized running
  the evaluator as a **separate Claude/Opus session** instead of OpenHands, provided it is a different
  session from this implementer/supervisor session. Recording that authorization here per contract.
- Next: commit research + plan, open draft PR, dispatch PLAN-EVAL (separate session). No code slice
  before PLAN-EVAL PASS (Plan-Gate hard stop).

### 2026-07-03 — PLAN-EVAL #1 → FAIL_PLAN (separate Opus session)
- Verdict `plan-eval.md`: FAIL_PLAN, 4 blocking findings — (1) no enumerated commit-slice list;
  (2) Change Map missed two re-export barrels (`mod.ts:117`, `src/merge/mod.ts:46`) + left F-5 rename
  open; (3) F-6 jsr slow-type risk unnamed for the new Zod exports; (4) stub-scope contradiction
  (Scope said ship linux/deno-deploy/docker stubs; Non-Scope/L-4 said windows-only).
- Supervisor plan revision (no code): added `## Commit Slices` (CS-1…CS-5); resolved F-5 as a
  **rename** to target-oriented names (L-7) enumerated across all four barrels; added L-8 mandating
  explicit `z.ZodType<…>` on every new exported schema (F-6); resolved stub scope to **base + windows
  only** (L-6, drop speculative member schemas). Folded in the two non-blocking notes (merge
  granularity test + comment-only prose fixes). Open-Decision Sweep now shows all decisions resolved.
- Re-dispatching a fresh separate-session PLAN-EVAL on the revised plan (2nd of max-2 cycles before
  escalation).

### 2026-07-03 — IMPLEMENTER + EVALUATOR LANE CORRECTION (coordinator, on user's behalf)
- **Implementer lane REVISED:** deployment epic does NOT use WSL Codex. Implementers are **Opus 4.8
  sub-agents ONLY**, spawned via the Agent tool at **high reasoning effort** (max code quality over
  token-efficiency). `codex-wsl-remote` + agentic WSL-Codex dispatch are DROPPED from this epic's
  skill set. Supervisor (this session) still does not write framework code — it delegates to the
  Opus implementer sub-agent.
- **Evaluator lane AMENDED:** the adversarial-review / IMPL-EVAL pass may be either (a) a separate
  Opus 4.8 session, OR (b) **Codex GPT-5.5 at xhigh** (preferred — different model family = real
  perspective diversity). Either satisfies the separate-agent rule absolutely (must not be the
  implementer session). The evaluator, whichever, still reproduces the CI quality gate
  (`fmt:check` + lint + `check --unstable-kv`) and runs `scaffold.runtime` e2e for scaffold-touching
  slices before signing off.
- These corrections supersede the earlier "WSL Codex implements / OpenHands or separate-Opus
  evaluates" note above for THIS epic only.

### 2026-07-03 — PLAN-EVAL #2 → PASS_PLAN (fresh separate Opus session)
- Verdict `plan-eval-2.md`: PASS_PLAN. All 4 prior blocking findings RESOLVED (commit slices present;
  four-barrel rename enumerated + both new barrels verified real; F-6 slow-type `z.ZodType<…>` mandate
  in L-8/F-6/CS-1; stub-scope resolved to base+windows only). Tree anchors verified; no new
  contradiction. Non-blocking: docker-in-base wording reconcilable; merge test planned (CS-4).
- **Plan-Gate CLEARED.** Proceeding to Implement phase.
- Implement lane: Opus 4.8 high-effort sub-agent builds CS-1…CS-5 in this worktree with per-slice
  commit + push to draft PR #352.

## Drift

### 2026-07-03 — CS-1/CS-2 merged into one commit (type-check coupling)
- The plan assigned the schema (CS-1) and derived types + four barrels (CS-2) to separate commits.
  In practice they are inseparable for a green-per-slice discipline: `deploy-schema.ts` imports the
  new derived types (`DeployTargetBase`/`WindowsDeployTarget`), and renaming the type/schema exports
  forces every barrel re-export in the same commit or type-check fails. CS-1 cannot type-check
  without CS-2. Merged into a single atomic commit labeled `CS-1+CS-2`. No scope change; all planned
  files land. CS-3/CS-4/CS-5 remain separate.
- `src/domain/mod.ts` uses a wildcard re-export, so the rename is picked up with no edit needed
  (verified). Only `src/public/mod.ts`, root `mod.ts`, and `src/merge/mod.ts` needed explicit edits.
- `DeployTargetBase` added to `src/public/mod.ts` + root `mod.ts` type barrels; not added to
  `src/merge/mod.ts` (per plan L-7 — merge entrypoint only renames the Windows symbol).

### 2026-07-03 — deno-doc-generated reference doc will need regeneration (out of scope / #344)
- `docs/site/reference/config/index.md:85` lists `WindowsDeployConfig` in a table that is explicitly
  "generated from the package public surface with `deno doc` (US-2)". The rename makes that entry
  stale; it regenerates from the new surface. Not hand-edited here (docs rewrite is #344's scope).
- `docs/architecture/doctrine/06-archetypes.md:227` uses `deploy.windows` as an illustrative config
  topic in doctrine prose — left as-is (doctrine, not this slice's surface); noted for #344.

## Gate results

### CS-1+CS-2 — schema split + derived types + four-barrel rename
- `run-deno-check.ts --cwd <wt> --root packages/config --ext ts` (passes `--unstable-kv`): **PASS**
  (33 files, 0 errors). NOTE: the wrapper must be given `--cwd <worktree>` or it resolves the main
  repo's import map and false-fails every `zod`/`@std/*` import with TS2307.
- `deno publish --dry-run --allow-dirty` on packages/config (F-6 slow-type authority): **PASS**
  ("Success Dry run complete") — new `z.ZodType<…>`-annotated exports are not slow types.
- `deno doc --lint mod.ts src/public/mod.ts src/merge/mod.ts`: 1 error — pre-existing missing-JSDoc
  on `PathsConfigSchema` (`paths-schema.ts`, untouched by this slice); my new exports
  (`DeployTargetBaseSchema`, `WindowsDeployTargetSchema`) are documented and NOT flagged.
