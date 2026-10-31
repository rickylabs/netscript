# Drift

- RTK is absent; use focused raw commands with structured validation wrappers.
- Owner-specific evaluation route, no-label policy and Refs-only PR opening take precedence over generic skill defaults. Dispatcher also requests a final closing line; apply only if all acceptance is proven, otherwise preserve owner Refs-only close gate.

- PLAN-EVAL round 1 found migration metadata was not consumed. Expanded delivery within the authorized assignment to generic SQL sidecars through existing plugin schema installation plus database migration tooling; added CI Postgres entry. Switched eligibility-filtered queries to primary-key cursor scans to bound examined rows. Parse/validate metadata in TypeScript to preserve malformed rows, and support per-saga policies with conservative shared outbox window.

- Added targeted command-postgres workflow path filters for schema-copy/integrity code and the CLI installation probe so future CLI-only delivery regressions execute the real install proof. The S1 CI-script registration moved forward from S2.

- JSR audit found existing missing @module tags on the saga backend and plugin doctor entrypoints. Added documentation tags within S3 to satisfy final audit; no runtime behavior changes.

- Owner's later instruction: “merge-conflict: rebase onto the latest base branch, resolve conflicts, force-push.” This explicitly supersedes the brief's earlier no-force-push rule for this repair. Rebased onto main 2f426b970d7a00bdbeb09c59b72b49478b839a5a. Preserved both database changelog entries and regenerated combined embedded prose. The first four commits replay byte-equivalently; implementation unchanged. Generated corpus incorporates upstream watcher/connection-string changes. Push uses the exact old remote head as a force-with-lease precondition.

- The owner subsequently required active repair of the red PR. Manually dispatched the supported remote E2E workflow at the reviewed head without editing coordinator-owned labels or running local scaffold.runtime. The run also selected desktop packaging and exposed an inherited failure seen on main: the native driver derives a nonexistent launcher by stripping `.so` from a differently named runtime. A real `.deb` reproduces it. Extend the CI repair slice to discover the isolated install's unique `/usr/bin` launcher, with focused filesystem and real-package proof. No production package output or command-retention change.

Rebase reconciliation: owner requested another latest-main rebase. Base ad252e8c8ce14b05390d70d94fa876ae81376958 already includes the independently implemented native launcher repair and regression in merged #2483 (1c9da73). Retained that upstream implementation byte-for-byte and removed this lane's overlapping helper/test. The previous S5 real-package proof remains historical; rerun the upstream regression and exact-head remote workflow on the combined head. No authored retention/schema source conflict.
