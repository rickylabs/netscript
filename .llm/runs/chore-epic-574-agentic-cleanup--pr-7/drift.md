# Drift log: PR 7 — production-grade cleanup of `.llm/tools/agentic/`

Stated plainly, not dressed up.

## 2026-07-10 — Process deviation: no external PLAN-EVAL (owner-authorized)

- **Severity:** recorded process deviation (not a defect).
- **What:** this run did NOT follow the standard harness slice protocol. There was **no external
  PLAN-EVAL and no external IMPL-EVAL** by a separate evaluator session before implementation. The
  run dir accordingly has no `plan.md` / `plan-eval.md` / `impl-eval.md`.
- **Why this is acceptable here:** the owner authorized this as an **exceptional, single
  deliberately-spawned Fable 5 (high) cleanup task** — structure + dead-code removal + config
  centralization + docs on repo-internal `.llm/tools/` tooling, touching no `packages/`/`plugins/`
  source. This is consistent with epic #574's owner-wide external-evaluator waiver already recorded
  across the #574 sub-run drift logs (the Claude coordinator owns Plan-Gate/Tier-A/merge; workers do
  not self-certify). The design (folder taxonomy, module boundaries, config shape, docs) was
  explicitly delegated to this agent.
- **What was done instead of PLAN-EVAL:** the implementer ran the full gate set at every phase (see
  `worklog.md`) as independent verification, and the Claude coordinator ran an **independent
  opposite-family GPT-5.6 review** of the finished PR. That review returned CONCERNS with three
  findings, which were remediated in commit `edd77a1e` (Phase 9).
- **Impact:** no self-certification of a PLAN-EVAL that never happened. This artifact set is
  reconstructed honestly after the work, not backdated. No evaluator verdict is claimed.

## 2026-07-10 — Run artifacts were initially incomplete

- **Severity:** process gap (raised by the GPT-5.6 review as Finding 2).
- **What:** the run dir originally held only `supervisor.md` + `inventory.md`; the standard
  `worklog.md` / `context-pack.md` / `drift.md` were missing.
- **Resolution:** reconstructed them from the real commit sequence and the captured gate output
  (Phase 9). They describe what actually happened; nothing is fabricated or backdated.

## 2026-07-10 — Centralization was incomplete on first pass

- **Severity:** implementation defect (raised by the GPT-5.6 review as Finding 1, High).
- **What:** after the Phase-4 config work, `rollout-canary-runner.ts` still hardcoded the native
  model ids `claude-opus-4-8` and `gpt-5.6`, and `wsl-foundation-lib.ts` hardcoded the Antigravity
  install marker `official-installer`. The original enforcement guard used a closed allowlist of
  known strings, so it could not catch these.
- **Resolution:** moved both into `config/` (`NATIVE_CANARY_MODEL_ARGS`,
  `ANTIGRAVITY_INSTALL_MARKER`) and rebuilt the guard to derive its forbidden set from ALL exported
  config values plus a structural shape layer. The strengthened guard caught the
  `official-installer` leak that the closed-list version had missed. Lesson: an enforcement guard
  that only forbids a hand-maintained list is weaker than one that derives its set from the source
  of truth and adds a structural check.

## 2026-07-10 — Guard over-claimed its coverage

- **Severity:** minor accuracy defect (raised by the GPT-5.6 review as Finding 3, Medium).
- **What:** the guard's header said "no hardcoding anywhere under `.llm/tools/agentic/**`" while it
  scanned only non-test `.ts`, and it excluded the entire test corpus, and the README hardcoded
  `gpt-5.6-sol`.
- **Resolution:** narrowed the claim to "production TypeScript sources," replaced the blanket
  test-corpus exclusion with an explicit per-file allowlist, added README scanning with an
  illustrative allowlist, and marked the README example illustrative in prose.

## Scope boundaries honored throughout

- No `packages/`/`plugins/` source touched. No `.llm/runs/**` history other than this run dir
  edited.
- `.claude/skills/**` never hand-edited — always regenerated from `.agents/skills/**`.
- `deno.lock` unchanged except the owner-sanctioned `@std` additions (`@std/assert@1`,
  `@std/path@1`).
- Not merged or promoted; awaiting coordinator sign-off.
