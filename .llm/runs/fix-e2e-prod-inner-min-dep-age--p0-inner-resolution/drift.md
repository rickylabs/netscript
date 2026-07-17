# Drift

## D-1 — generated-project policy candidate rejected

The initial candidate assumed the generated root `minimumDependencyAge` policy could govern the
inner resolution. Deno 2.9.3 reproduction showed the `deno x` JSR re-run ignores both discovered
and explicit config. The plan therefore uses a direct `deno run` URL so the explicit flag governs
the single resolver. No doctrine drift results.

## D-2 — Plan-Gate explicitly waived by owner

The local formal evaluator credential was unavailable. On 2026-07-17 the owner explicitly directed
the implementation session to implement S1 without attempting PLAN-EVAL because evaluations are
supervisor-dispatched. This instruction is the written Plan-Gate waiver required by the run loop;
the implementation session did not self-evaluate.
