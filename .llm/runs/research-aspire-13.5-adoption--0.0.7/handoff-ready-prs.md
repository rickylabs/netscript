# Human-merge handoff — RETRACTED (independent close-gate audit, 2026-08-30)

The handoff issued at `02c4303e` for **#1738** and **#1740** is **withdrawn**. Both PRs are now
`status:ci-fail` with exact blocker comments **5467924143** (#1738) and **5467925281** (#1740).
Heads (`732992415`, `aa822069e`) and issue checklists are preserved untouched.

| PR         | Why the handoff was wrong                                                                                                                                                                  | What is owed before any refreshed attribution                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| #1738 (S4) | Exact-head manual E2E shows **three #1734 hydration baseline failures**; the evaluator states a runtime verdict is owed.                                                                   | After #1734 (PR #1736) lands: rebase, rerun the exact runtime gates at the new head, then re-attribute.                   |
| #1740 (S5) | CI E2E was policy-skipped and the NAS 26/27 run **never reached Aspire**, so runtime acceptance for #1717 / #1370 / #979 is insufficient; a **two-concurrent-start receipt** is also owed. | After #1734 lands: rebase, exact runtime gates at the new head incl. the two-concurrent-start receipt, then re-attribute. |

Lesson (recorded as D-41): close-gate = CI `close-gate` job + review threads + checked boxes is
**necessary, not sufficient** for a runtime-affecting slice; the acceptance boxes' runtime claims
must be backed by an executed runtime verdict at the exact head. A green `close-gate` job with a
policy-skipped E2E lane is the same "believed covered, never executed" family as D-23/D-26/D-28.
