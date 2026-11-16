# Context pack

Issues #2630/#2631, main b0eb07957, branch fix/runtime-child-drain. Research/plan drafted, real Redis subprocess reproduction in progress, PLAN-EVAL required before implementation. Generated glue changes require one full scaffold.runtime smoke at the end. Do not merge or publish. No modifications under plugin-sagas-core/src/transports.

Confirmed baseline: real Redis child clean/timeout tests fail the exit watchdog (2/2); service clean/timeout likewise (2/2). These are genuine runtime failures after readiness, not startup failures. No production changes yet. PLAN-EVAL next.

## PLAN-EVAL cycle-one repairs

Evaluator accepted reproduction and coverage but returned FAIL_PLAN for five underspecified decisions. Plan now explicitly locks Deno.exit on clean and failed process-owned paths; Prisma dedup/disposal in raw withDatabase, inherited by presets; closeKv() rather than lazy context KV close(); bounded OTel flush without process termination and documented standalone behavior; and per-slice file groups (all below 30 files). Service's default 30 s total includes 25 s work and 5 s reserved cleanup; manual stop/external abort remain embeddable. No production code has changed. Cycle-two PLAN-EVAL is required before implementation.
