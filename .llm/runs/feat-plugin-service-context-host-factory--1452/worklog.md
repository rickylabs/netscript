# Worklog: #1452 Slice 1 — lazy KV primitive and scaffold adoption

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-plugin-service-context-host-factory--1452` |
| Branch | `feat/kv-lazy-plugin-context` |
| Archetype | `2 — Integration` (`packages/kv`); `6 — CLI/Tooling` carrier (`packages/cli`) |
| Scope overlays | none |

## Design

Recorded before implementation on 2026-08-31. `PLAN-EVAL: N/A`: this is a mechanical extraction
whose contract, behavior, ceiling, and gates are fixed by the existing template class and
`WatchableKv` interface.

### Public Surface

- `createLazyKv(config?: SharedKvConfig): WatchableKv` from `@netscript/kv` root.
- No new subpath, CLI command, binary flow, plugin surface, or package dependency.

### Domain Vocabulary

- `WatchableKv` — existing package-owned port returned by the factory.
- `SharedKvConfig` — existing typed configuration passed unchanged to the first `getKv()` call.
- Lazy resolution promise — per-instance memoized promise created on the first forwarded operation.

### Ports and adapters

- Consumed port: existing `WatchableKv`; no new port.
- Resolver/composition edge: existing `getKv(config)`; no module-load-time call.
- Adapters: unchanged. Tests use a recording `WatchableKv` fixture following existing in-memory
  adapter conventions.
- CLI spine/layer-2 abstracts, vertical features, extension axes, registries, command/process/fs
  ports, and composition files: unchanged and not introduced by this asset-only carrier edit.

### Constants

- None. This slice introduces no finite variant vocabulary or magic identifiers.

### Generated output and semantic test strategy

- Generated output: `services/_shared/plugin-service-context.ts` imports `createLazyKv` and uses
  `kv: createLazyKv()`; the local `LazyPluginKv` class and its type-only imports disappear.
- Semantic assertions: prove no resolution at construction; one resolution at first use; one
  resolution across two operations; exact argument/result forwarding for CRUD, list, watch,
  watchPrefix, close, supportsWatch, and `[Symbol.asyncDispose]` → `close()`.
- Required permissions remain those of the selected adapter and are deferred until the first
  operation, exactly as in the reference class.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | Publish and prove `createLazyKv()` | scoped KV check/lint/fmt; KV tests; doc/JSR/quality gates | `packages/kv/application/lazy-kv.ts`, KV barrels, `packages/kv/tests/lazy-kv_test.ts`, run artifacts |
| 2 | Adopt the primitive in the scaffold and refresh the carrier | focused CLI template tests; scoped CLI check/lint/fmt; asset/export corpus gates | service-context template, `embedded.generated.ts`, run artifacts |

### Deferred Scope

- `@netscript/plugin` → `@netscript/kv` dependency ruling — architecture decision required.
- Full host factory location/API — depends on that ruling.
- Project-relative DB-client resolver injection — public contract decision required.
- `appsettings` — no current contract exists to implement.
- Slice 2 generated-consumer runtime boot proof — meaningful only after the above decisions.

### Contributor Path

Callers import `createLazyKv` from `@netscript/kv`. Maintainers change forwarding behavior in
`packages/kv/application/lazy-kv.ts`, update the focused test, then regenerate the CLI asset carrier
if the scaffold template changes. New KV adapters remain behind `getKv()` and require no lazy-wrapper
change.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-31 | bootstrap | re-baseline | Clean expected planning head; current main verified; lock hash recorded. |
| 2026-08-31 | design | ready | Doctrine, archetypes, public surface, reference class, and test conventions inspected. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Extract to KV application layer | The wrapper owns only `WatchableKv` + `getKv` behavior | plan LD-1/LD-2; doctrine A8/A10 |
| Preserve exact reference forwarding shape | Avoids semantic drift in every generated consumer | plan LD-3; template class |
| Keep Slice 2 untouched | Three public architecture questions remain unresolved | research; owner ceiling |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| RTK binary named by the repo skill is absent on this host | minor | yes |

## Gate Results

**Corrected 2026-08-31.** This section previously read "All gates are `NOT_RUN` until implementation
lands." That statement was left behind by the bootstrap and became false the moment Slice 1 landed —
recording the correction rather than silently overwriting it, because a stale `NOT_RUN` claim in a
committed harness artifact is exactly the false-done state the evaluator protocol exists to catch.

Actual results at integrated head `186cea472` / evidence head `3130fb52b`, receipts committed under
`receipts/`:

| Gate | Result | Evidence |
| --- | --- | --- |
| scoped `check` (`^packages/(kv\|cli)/`) | PASS | 303-byte stdout, 31,193 ms |
| scoped `lint` | PASS | 352-byte stdout |
| scoped `fmt-check` | PASS | 301-byte stdout |
| `packages/kv` tests | PASS | 80 passed / 3 ignored / 0 failed, 288-byte stdout |
| `check:assets-barrel` | PASS | exit 0; zero-byte stdout is correct for `gen && git diff --exit-code`, proven clean by an empty worktree afterwards |
| `docs:exports-drift` | PASS | — |
| `check:mcp-export-corpus` | PASS | 7678 symbols, +1 vs `main` = `createLazyKv` exactly |
| `deno.lock` | unchanged | `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c` |
| IMPL-EVAL | PASS | separate session, comment `5473634548` |
| `scaffold.runtime` | **PASS** | run `33357314826` @ `7bd87da5c` — aspire+docker+postgres **success**, aspire+sqlite+garnet **success**, deno-only **success** |
| repo `check-test` | **PASS** | full-workspace check + test at `7bd87da5c` |
| repo `quality` / `code-quality` / `build` / `close-gate` | **PASS** | same head |

Every check/lint/fmt receipt was verified for non-empty `stdout.bytes` before being trusted.

## Handoff Notes

- Review the template diff for strict import/class/construction-only change.
- Review the lazy test's observation points before trusting happy-path operation results.
- Confirm no `packages/plugin/` path and no `deno.lock` bytes changed.


## Runtime gate — why it was missing and what it now proves

This leaf originally recorded Runtime as `N/A — forbidden/no runtime lease`. That was wrong twice
over: the slice changes a **scaffold template** and its **generated carrier**, which is exactly the
change class `scaffold.runtime` exists to cover, and the PR sat as a draft where CI gates every heavy
lane on `pull_request.draft == false` — so the gate was not merely unrun, it was invisible.

Corrected by opting the non-draft PR into the explicit `e2e-cli-gate` label rather than by taking a
local Aspire lease (the local topology is parked). The gate now proves the scaffolded project still
builds and runs with the 43-line delegating `service-context.ts.template` in place of the former
123-line inlined `LazyPluginKv`.


## Final seam — integrated current `main` `eaea940be` (post-#1810)

The evidence-only push made the branch `CONFLICTING/DIRTY` against the advanced `main`, which is also
why the `pull_request` CI produced no run for that head: GitHub could not compute a merge ref, so
there was nothing to check out. Integrated once, at the final seam.

| Proof | Result |
| --- | --- |
| Conflict set | exactly one file — `export-surface-corpus.generated.ts`, a generated carrier |
| Resolution | took `main`'s carrier and **regenerated from tooling**; never hand-edited |
| Carrier currency | `check:mcp-export-corpus` exit 0 · `check:assets-barrel` exit 0 — both genuine tool output |
| Six hand-written product blobs | **byte-identical** to the evaluated head `3130fb52b` |
| Seventh blob (the corpus) | regenerated `1dd90409… → 6e84e995…` — it *was* the conflict, and `main`'s inputs moved; identity cannot and should not hold for a derivative |
| Product diff vs current `main` | exactly the seven files, no more |
| `deno.lock` | byte-identical `edfa0c24…` |

Gates re-cut at the seam `8ab11ddee`, each `gitHead == actualGitHead`: scoped check 303-byte stdout,
lint 352-byte, fmt-check 301-byte, `packages/kv` tests 289-byte, `assets-barrel` exit 0 (zero-byte
stdout is correct for `gen && git diff --exit-code`; proven clean by an empty product worktree
afterwards), `docs:exports-drift` PASS.
