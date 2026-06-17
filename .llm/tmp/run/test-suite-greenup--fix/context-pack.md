# Context Pack

Run: `test-suite-greenup--fix`

Branch: `chore/test-suite-green-up`

Mission: make `deno task test` green under Deno 2.8.3, or delete/quarantine any obsolete remaining
failures with rationale. Do not publish to JSR and do not merge main.

Current baseline after Step 0:

```text
FAILED | 473 passed (354 steps) | 11 failed (2 steps) | 12 ignored (27s)
```

Active root-cause slices:

1. JSONC parser bug in `packages/config/workspace.ts` — fixed locally; commit pending.
2. Windows absolute path handling in runtime schema generation.
3. Newly surfaced plugin-workers-core Deno runtime adapter tests.
4. CLI config fixture failures in plugin registry and compile tests.
5. Official plugin sample fixture drift.
