# Golden reference — `t1-storefront-api`

`netscript/` holds the **golden NetScript solution** for `t1`: a minimal, idiomatic service that
implements the task's full HTTP contract (products CRUD + orders with referential integrity, typed
`VALIDATION_ERROR` / `NOT_FOUND` from the framework's shared error vocabulary, and `@netscript/kv`
persistence that survives a restart). It passes the frozen suite **10/10**.

It exists for two reasons:

1. **Conformance mode** (`deno task cli conformance`) — a key-free CI gate that boots this reference
   and replays the frozen suite against it over HTTP, with a real process restart between probes. It
   proves the task and suite are internally consistent — a compliant NetScript service _can_ go
   green — without spending an agent run. The gate exits non-zero on any non-green suite.
2. **Task seeding** — later tasks may seed their starting state from this reference (OQ6).

It is **withheld from the agent sandbox**: the runner never copies `reference/` or `tests/` into an
agent's workspace.

## Files

| File        | Role                                                                      |
| ----------- | ------------------------------------------------------------------------- |
| `store.ts`  | Persistence adapter — products/orders in `@netscript/kv` (`getKv`).       |
| `router.ts` | Typed oRPC contract + handlers; shared error factories; in-handler rules. |
| `main.ts`   | Entry point — `defineService(router, …)` mounts REST at `/api/*`.         |

## Run it directly

```sh
PORT=8080 NETSCRIPT_BENCH_KV_PATH=./storefront.kv \
  deno run --allow-all --unstable-kv main.ts
# → POST http://localhost:8080/api/products, GET /api/products, …
```

`PORT` selects the bind port; `NETSCRIPT_BENCH_KV_PATH` selects the persistent KV file so data
survives a restart (the same file path, reopened, is how the `persistence-across-restart` probe
passes).

## Design notes (positioning-relevant)

- **Error vocabulary is the framework's.** Handlers raise through `@netscript/contracts`'
  `notFound()` / `validationFailed()` factories, and the builder declares the shared codes
  (`NOT_FOUND` 404, `VALIDATION_ERROR` 422). The wire body carries a top-level `code`, which is what
  the suite asserts.
- **`os.errors(...)`, not the public `baseContract`.** The reference builds procedures on
  `os.errors(...)` from `@orpc/server` — the exact primitive `@netscript/contracts` uses internally.
  The public `baseContract` export is type-erased (its procedures are `{ '~orpc': any }`), so
  binding a sound, non-`any` `.handler()` to it is not possible without a cast. This reference is
  **fully cast-free** (zero `as any` / `as unknown as` / `: any`).
- **Permissive contract inputs, in-handler validation.** A strict contract input schema makes oRPC
  reject invalid bodies with `BAD_REQUEST` (400) _before_ the handler runs — the wrong typed code
  here. Inputs validate _shape_ only; field rules run inside the handler (zod `safeParse`, so the
  success branch narrows with no cast) and surface as a typed `VALIDATION_ERROR`.
