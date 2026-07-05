# Gate Taxonomy

Gates are ordered checks that prove a harness run is complete enough to hand to an evaluator. The
archetype matrix decides which gates apply.

## Gate Families

| Family   | File                       | Purpose                                         |
| -------- | -------------------------- | ----------------------------------------------- |
| Static   | `static-gates.md`          | Typecheck, lint, format, docs, publishability   |
| Fitness  | `fitness-gates.md`         | Doctrine F-1 through F-19                       |
| Runtime  | `runtime-gates.md`         | Aspire, browser, services, traces, lifecycle    |
| Consumer | `consumer-gates.md`        | Downstream imports, generated clients, examples |
| Release  | `release-gates.md`         | `scaffold.runtime`, `e2e-cli-prod`, release-gate class (cut/release-gating runs only) |
| Matrix   | `archetype-gate-matrix.md` | Required gate set per archetype                 |

## Ordering

1. Static gates.
2. Fitness gates.
3. Runtime gates.
4. Consumer gates.

Runtime and consumer gates often reveal failures static gates cannot see. Do not skip them when the
matrix or scope overlay requires them.

## Phase A Caveat

Phase A is documentation-only. The surviving fitness scripts already exist (see `fitness-gates.md`
for the small real surface: `check-doctrine.ts`, `audit-jsr-package.ts`, and the `check-ds-*`
gates); the previously-referenced `check-cli-*` and aggregator scripts were **deleted dead code**,
not "coming later". When an F-gate has **no dedicated script**, the generator and evaluator record it
as `PENDING_SCRIPT` — meaning the gate is evidenced manually and/or via `check-doctrine.ts` coverage
(with a debt reference where applicable), not that a script will be added in a later phase.
