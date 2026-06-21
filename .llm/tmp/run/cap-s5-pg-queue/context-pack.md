# S5 PostgreSQL Queue Adapter Context Pack

- Run id: `cap-s5-pg-queue`
- Branch: `fix/cap-caveat-s5-pg-queue`
- Scope: implementation-only S5 slice for `packages/queue`; no PR opened.
- Archetype: ARCHETYPE-2 Integration.
- Implemented: PostgreSQL `MessageQueue<T>` adapter, lazy factory wiring, focused client-double
  tests, and package metadata coverage for the adapter.
- Validation: focused adapter test, scoped queue check, scoped queue lint, scoped queue fmt check.
- Lock hygiene: final `deno.lock` delta is limited to `pg` resolution lines for `packages/queue`.
- Drift: broad Deno lock workspace metadata rewrite was observed and rejected; see `drift.md`.
