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
