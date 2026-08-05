# Drift — #1227 reopened restore stability

- Owner D6 ruling replaces the default local PLAN-EVAL with composed draft→ready augmentation,
  OpenHands label, and orchestrator pre-merge gate.
- Issue body retains the original three checked boxes; the owner reopening comment supplies four
  new unchecked acceptance rows and is authoritative for this continuation.
- The cloud diagnostic run was still in progress when identical retained local logs closed the
  root-cause decision. Implementation proceeded from those logs; the branch artifact remains a
  required corroboration before ready state.
- Proof run 30962998528 cleared restore in 22.58s from a confirmed v2 cache hit, then exposed that
  Quickstart step 7 reused the runtime suite's database-aware health assertion. The generated users
  service correctly returned healthy with no DB check, so the walk could not become green. The
  suite-only call now requests service health while the runtime gate continues passing an explicit
  database and retains its stronger assertion.
