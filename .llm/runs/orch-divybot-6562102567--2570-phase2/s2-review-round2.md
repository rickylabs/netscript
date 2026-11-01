**FAIL_FIX** — two remaining correctness issues in the revised rendering and activity paths.

| Previous finding | Review of supplied fixes |
|---|---|
| Resource health | Resolved: background processors require all three readiness fields, and the identified streams resource uses `/health/ready`. |
| Generic field preservation | Envelope collections and ordinary extra fields are fixed; structured values in mapped fields can still disappear, as detailed below. |
| Currency formatting | Resolved: conversion requires explicit units, the sample writer opts in, and malformed currency strings have a safe fallback. |
| Bounded recent activity | Pagination, read limits, HEAD skipping, and qualified freshness descriptions address the original problems. The new persistent cursor needs reset recovery. |
| Stream privacy | The shared-credential concern is resolved for the supplied public entrypoint: activity GET and HEAD requests send no credentials, and denied GET responses return no cached items. |

1. **[P2] Rich-row rendering still loses values that its eligibility check accepts.**
   In [query-result-template.ts](packages/cli/src/kernel/application/ui/page/query-result-template.ts), `rich` validates `reference`, `ownerName`, `currency`, and `amount`, but `mappedFields` also removes `name` and `ownerEmail` from the generic details. Those two values are rendered through `String(...)`.

   For example, this valid unknown payload passes the rich-row check:

   ```ts
   [{
     reference: 'R-1',
     ownerName: 'Ada',
     amount: 100,
     currency: 'USD',
     name: { en: 'Actual record' },
     ownerEmail: { primary: 'ada@example.test' },
   }]
   ```

   Both structured values become `[object Object]`; their actual contents are absent from the table and details.

   **Fix:** consume those fields only when their values match the formatter’s supported types. Otherwise retain them in generic rendering, or make the row fall back to the generic table. Add a behavioral assertion that both nested values remain visible.

2. **[P2] A rejected saved stream cursor is retried indefinitely without recovery.**
   In [scaffold-plugin-capabilities.ts.template](packages/cli/src/kernel/assets/app/lib/scaffold-plugin-capabilities.ts.template), every non-404 unsuccessful activity response leaves `snapshot.offset` unchanged. The supplied streams entrypoint documents that the default memory backend loses its history on restart, while the app’s process snapshot can survive that restart.

   After a successful read saves a cursor, restarting and recreating the topic can invalidate that cursor. If the server rejects it with a cursor error rather than 404, every refresh submits the same rejected cursor. Successful readiness probes cannot restore activity; recovery requires app restart or incidental cache eviction.

   **Fix:** handle the protocol’s documented invalid-cursor/reset condition by clearing the affected snapshot and performing bounded recovery. Keep offsets opaque, and preserve the current refusal behavior for 401/403. Add a test covering successful population, topic reset with cursor rejection, and subsequent recovery without restarting the app.

The reported behavioral test results support the covered cases, but I have not rerun them or verified the regenerated golden. This remains an S2 source verdict, with final IMPL-EVAL and visual/accessibility validation pending.
