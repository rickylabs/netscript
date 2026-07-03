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

## Gate results
_(populated during Implement/Gate phases)_
