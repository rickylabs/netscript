# Drift Log: canonical shipped skill references

## 2026-08-31 — Supervisor re-baseline after serial-queue correction

- **What:** The resumed slice base is `eaea940bea4c19593b97b9895b09f512039f4e13` rather than the
  original `65cd8a07787504b5ed94408510d4ab85260bc21a`.
- **Source:** Supervisor resume instruction and `git rev-parse HEAD`.
- **Expected:** Original issue brief base.
- **Actual:** Current `main` after an authorized reset; both defects remain live and unchanged.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md`, `research.md`, and re-baseline commands.

## 2026-08-31 — Shared generated carrier with PR #1759

- **What:** PR #1759 (`fix/aspire-13-5-s9-skills-mcp-alignment`) and this leaf both modify the
  generated carrier `packages/cli/src/kernel/assets/skills.generated.ts` from disjoint source files.
- **Source:** Supervisor collision declaration for PR #1759.
- **Expected:** Source ownership is disjoint: this leaf owns `skills/netscript/SKILL.md` and
  `skills/netscript-operate/SKILL.md`; #1759 owns `skills/aspire/SKILL.md` and `skills/help.md`.
- **Actual:** Both source sets project into the same generated TypeScript barrel, creating an
  expected textual merge conflict whichever PR lands second.
- **Severity:** minor
- **Action:** accept; coordinator owns merge ordering, and the second PR resolves by regenerating
  the barrel after the first lands. This leaf will not rebase onto or coordinate against #1759.
- **Evidence:** PR #1759 and `packages/cli/src/kernel/assets/skills.generated.ts`.
