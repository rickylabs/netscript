# C2 locked leaf plan

This leaf implements approved whole-chain slices S4–S6 for #1483. The full authoritative plan and independent PASS are in ../feat-command-c1-contracts--lane-d/plan.md and plan-eval.md, evaluated before product implementation at 359d17f426592d58a6f6388a9522bc3afbc45dde. No second PLAN-EVAL or plan expansion.

A4 service plus A2 database port and A3 failure discipline; SCOPE-service. S4 bound raw ports and atomic fake; S5 once-only executor, identity and buffered records; S6 seven fault seams and semantic/determinism conformance. Each slice pauses for supervisor review and commit/push/comment. Each new named test has a meaningful production mutant with failure and restored pass. Later provider/telemetry/relay/saga leaves remain deferred.

Native structured scoped static/runtime gates, full-map docs, quality/architecture, JSR publish/declaration and clean public consumers apply. No remote/global transaction, hidden singleton, automatic handler retry, root side writes, new debt or unsafe type suppression. C1 implementation is a predecessor dependency, not part of the incremental C2 diff.
