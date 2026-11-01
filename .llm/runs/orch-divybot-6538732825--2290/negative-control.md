# Negative control — 2026-10-31

After the implementation auth suite passed (231 results), replaced only
`packages/service/src/auth/contract/contract-authorizer.ts` and
`packages/service/src/auth/auth-middleware.ts` with their baseline main contents.
Kept the new types/options/tests so this checks runtime behavior, not a compile failure.

Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts --
--allow-all --filter '/procedure availability: (authenticated unknown|declared retired)/'
packages/service/tests/auth/procedure-availability_test.ts`.

Actual wrapper exit: **1**. Two selected tests executed, both failed on status assertions:

- authenticated unknown: actual **403**, expected **404**;
- declared retired: actual **403**, expected **410**.

The files were restored in a `finally` block and verified byte-for-byte against the implementation
captured before replacement. The restored full service suite is recorded in worklog.md.
No locks, caches, other runs, or resource state were changed by this control.
