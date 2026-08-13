# Drift Log: NetScript Database Architecture and Prisma 8 RFC

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-08-13 — Issue #313 solution premise superseded

- **What:** The carried-in plan preserves classic Prisma and adds Prisma Next as an opt-in Postgres
  pilot. The owner now requires a clean architectural break with no backward-compatibility
  constraint.
- **Source:** GitHub issue #313 body and the current owner directive.
- **Expected:** Reuse #313's additive migration architecture.
- **Actual:** Reuse only its evidence/problem inventory; redesign the target architecture from
  current NetScript and Prisma 8 facts.
- **Severity:** architectural
- **Action:** rescope
- **Evidence:** <https://github.com/rickylabs/netscript/issues/313>

## 2026-08-13 — Final refinement lane override

- **What:** The final gate must use Fable 5 high and refine the RFC in place, not merely provide an
  adversarial report.
- **Source:** Current owner directive.
- **Expected:** Ordinary docs/evaluator routing would use Fable medium for final polish or formal
  evaluation.
- **Actual:** Owner-authorized Fable high is reserved as the absolute last substantive gate.
- **Severity:** significant
- **Action:** accept
- **Evidence:** `supervisor.md` routes and override record.
