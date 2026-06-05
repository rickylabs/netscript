# Gate Taxonomy

Gates are ordered checks that prove a harness run is complete enough to hand to an evaluator. The
archetype matrix decides which gates apply.

## Gate Families

| Family   | File                       | Purpose                                         |
| -------- | -------------------------- | ----------------------------------------------- |
| Static   | `static-gates.md`          | Typecheck, lint, format, docs, publishability   |
| Fitness  | `fitness-gates.md`         | Doctrine F-1 through F-15                       |
| Runtime  | `runtime-gates.md`         | Aspire, browser, services, traces, lifecycle    |
| Consumer | `consumer-gates.md`        | Downstream imports, generated clients, examples |
| Matrix   | `archetype-gate-matrix.md` | Required gate set per archetype                 |

## Ordering

1. Static gates.
2. Fitness gates.
3. Runtime gates.
4. Consumer gates.

Runtime and consumer gates often reveal failures static gates cannot see. Do not skip them when the
matrix or scope overlay requires them.

## Phase A Caveat

Phase A is documentation-only. Fitness functions are documented as required doctrine gates, but
their scripts are implemented in later phases. Until a script exists, the generator and evaluator
record the gate as `PENDING_SCRIPT` with manual evidence or debt references.
