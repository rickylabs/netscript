# Drift

- Owner-selected existing implementation session uses Sol xhigh. All subsequent eval routes follow the pinned matrix with session/family independence.
- Current main exposes explicit service hostname options, not the environment convention claimed by #2631. Reuse native hostname option and document this evidence.
- Deno KV alone is not a process-retaining handle in this environment; use real Redis sockets to test the reported lifecycle failure.

- S2 file scope expands from 12 to 17 (<30): embedded signal tests must opt out of process termination, and new cleanup contract tests follow type definition. No acceptance weakened.
- T3 requires a new delegate for each review/re-check; cycle two used the same selected model/route with the full prior verdict carried in its brief instead of re-steering the prior session. Session/family independence remained intact.

- S3 composition revealed the same DB client can be both raw-builder registered and owned by the host disposal callback. Added disposeDatabaseOnSignal (default true); generated service composition sets false when its explicit context disposer owns DB cleanup. A real signal subprocess proves exactly one disconnect. This keeps the accepted ownership rule without a global registry.
- Auth serve wiring lives in auth-service-runtime.ts, so that sibling composition file changes instead of main.ts. Sagas runner DB acquisition is already tracked by the generated host resolver; no runner implementation edit is needed. Generated host disposal handles DB only; process edges call closeKv once.
- S2 touched 18 files including its scrubbed resource evidence, still below 30. S3a expands to at most 22 to include the ownership refinement and tests.

- S3b source-derived child-health documentation requires updating its existing generator symbol list; it now includes the public process options/function. Subprocess self-imports are corrected to local module URLs to satisfy release:preflight. This adds three scoped files to the prose slice and remains below 30.

- Baseline-only doc/JSR findings were measured rather than assumed: plugin doc-lint 18 and telemetry 7 match base distribution exactly; plugin module-tag audit fails on three untouched entrypoints. Service doc-lint is clean. No unrelated publishability repair is folded into runtime lifecycle work.

- The required runtime smoke was repeated only after diagnosing a concrete environment failure: container loopback endpoints were in the Docker daemon's namespace. A temporary, owned-only port bridge supplies local reachability without changing generated output or weakening gates. Native PostgreSQL readiness passed through it.
- S4 includes two pre-existing test expectation updates: manual-stop host DB ownership and Deno-watch's explicit-exit diagnostic. Both retain their behavioral assertions; the slice remains below 30 files.

- S4 hostname decision is now resolved after IMPL-EVAL F2: generated workers/sagas/triggers forward NETSCRIPT_CHILD_HEALTH_HOSTNAME as the existing native hostname option. Unset retains loopback, including generated Aspire host executables. Containers explicitly request 0.0.0.0. No generic HOSTNAME fallback and no new service hostname behavior. All three generated artifacts have a native bind plus non-loopback HTTP regression.
- Cycle one IMPL-EVAL FAIL_FIX is preserved. F1 waits on supported-runner runtime evidence; the hostname repair requires a new final-head CI run and a new evaluator session under T3 re-check policy.


## Native supported-runner restart evidence

Full S4 gate remains unresolved at a native web-resource restart. To stop discarding the only decisive diagnostic, minimally include native exit code plus stderr/stdout fallback in the existing CLI refresh error, with two red-before/green-after tests. No retry/bypass/resource-target changes, no new command/API. This is bounded S4 failure diagnosis within the required full-runtime gate, not a new lifecycle design. Two CLI files plus run evidence, below30files. No new local smoke attempt on the unsupported Docker host.
