# Plan: Aspire 13.5 S5 literal ports

PLAN-EVAL: N/A — inherited ratified parent D-14/OF-3a decisions and owner-locked slice plan.

1. Extend `check:aspire-host-ports` and add the exact S5 literal grep as a RED-first test.
2. Remove the sagas publisher fallback, retain/deprecate its compatibility constant, and update its
   CLI/probe/scaffold/docs surface with JSR evidence.
3. Make sagas/triggers/streams/workers contributions use allocated ports and resource references.
4. Make generated plugin and infrastructure host-port pins explicit-only; green the fitness gate.
5. Resolve plugin behavior probe URLs from Aspire describe resource `urls[].url`.
6. Regenerate checked-in assets and run scoped static, fitness, consumer, and scaffold-plugin gates.

The independent Fable 5 supervisor owns slice review and implementation evaluation. This lane will
not start AppHost resources or mark the PR ready.
