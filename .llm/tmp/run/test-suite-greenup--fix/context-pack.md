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

1. JSONC parser bug in `packages/config/workspace.ts` — fixed in `a88e219`.
2. Windows absolute path handling in runtime schema generation — fixed in `b7f130b`.
3. Newly surfaced plugin-workers-core Deno runtime adapter tests — fixed in `023c758`.
4. CLI config fixture failures in plugin registry and compile tests — fixed in `bb7a521`.
5. Official plugin sample fixture drift — fixed in `a621a8c`.
6. Catalog graph-resolution blocker — `103f9a8` and `9262399` rejected by maintainer directive.
   Catalog wiring restored in `20d6b03`: root imports `{}`, 67 member `catalog:` refs across 18
   member `deno.json` files, root catalog retained.

Current hard-stop gate:

```text
ok | 484 passed (356 steps) | 0 failed | 12 ignored (46s)
error: Unsupported scheme "catalog" for module "catalog:"
at packages/contracts/src/application/contract-primitives.ts:1:20
```

Narrow repro:

```text
deno run --allow-all packages/contracts/src/application/contract-primitives.ts
```

exits 1 with the same unsupported-scheme error. `deno check` of the same file exits 0, so the
blocker is runtime module loading of restored member `deno.json` import-map `catalog:` values.
