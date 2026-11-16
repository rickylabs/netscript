# Context pack

Issues #2630/#2631, main b0eb07957, branch fix/runtime-child-drain. Research/plan drafted, real Redis subprocess reproduction in progress, PLAN-EVAL required before implementation. Generated glue changes require one full scaffold.runtime smoke at the end. Do not merge or publish. No modifications under plugin-sagas-core/src/transports.

Confirmed baseline: real Redis child clean/timeout tests fail the exit watchdog (2/2); service clean/timeout likewise (2/2). These are genuine runtime failures after readiness, not startup failures. No production changes yet. PLAN-EVAL next.
