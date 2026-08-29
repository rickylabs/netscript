# Drift Log: agent-init guidance and cross-host skills

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-08-30 — #1674 older scope refinement conflicts with current re-intake

- **What:** Live issue comment `5313223606` says to delete `apps/<app>/AGENTS.md` and rewrite one
  root file; the current grouped re-intake explicitly requires linking the app guide and forbids
  changing example routes.
- **Source:** #1674 comment and run `implement.md`.
- **Expected:** Carried issue discussion and current brief would agree.
- **Actual:** They prescribe opposite generated-file relationships.
- **Severity:** significant
- **Action:** accept the newer explicit re-intake as current authority; preserve/link the app guide.
- **Evidence:** `research.md` Re-baseline and #1674 acceptance mapping.

## 2026-08-30 — #1672 older skill expansion is outside the current ceiling

- **What:** Live issue comment `5311467701` proposes editing the repository's
  `netscript-deno-toolchain` skill, while the current re-intake explicitly forbids it.
- **Source:** #1672 comment and run `implement.md`.
- **Expected:** Carried issue discussion and current brief would agree.
- **Actual:** The re-intake narrows this leaf to generated consumer guidance.
- **Severity:** significant
- **Action:** accept the newer explicit ceiling; link to the generated `.agents/skills/deno` skill
  and leave the internal skill unchanged.
- **Evidence:** `research.md` Re-baseline and product path ceiling.
