# Worklog — fix-aspire-ephemeral-host-ports--952

## Design

Recorded before any implementation file was created, per `run-loop.md` §3b.

### 1. Public surface

| Surface                                                                 | Change                                                                                   |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `@netscript/aspire` `ServiceEntry` / `PluginEntry` / `AppEntry`           | `Port` becomes optional (already optional on `AppEntry`); new optional `HostPort: number`   |
| `@netscript/aspire` `ServiceEntrySchema` / `PluginEntrySchema` / `AppEntrySchema` | matching zod fields (widening only)                                               |
| `@netscript/config` `ServiceConfigSchema`                                | `port` becomes optional; new optional `hostPort`                                           |
| `netscript init --service-port <n>`                                      | unchanged flag; new meaning "pin the Aspire host port"; range widened to `[1024, 65535]`   |
| `deno task check:aspire-host-ports`                                      | **new** repository validation task                                                         |
| `render-http-endpoint.ts`                                                | internal to `@netscript/cli` — not exported from any barrel                                |

No new subpath, no new export from `mod.ts`, no re-export of upstream.

### 2. Domain vocabulary

```ts
/** A resource entry that may pin an Aspire host port. */
interface HostPortCarrier {
  /** Pinned Aspire host (proxy) port. Weakens `aspire start --isolated`. */
  readonly HostPort?: number;
  /** Deprecated alias for {@link HostPortCarrier.HostPort}. */
  readonly Port?: number;
}
```

One type, used by the renderer. No discriminated union is needed: the decision is
`number | undefined`, not a closed set of modes. Introducing an `EndpointBinding` union here would be
a speculative seam — rejected.

### 3. Ports

**None introduced.** The renderer is a pure string function; the validation script uses `@std/fs`
`walk` directly, matching the existing `check-netscript-jsr-specifiers.ts` precedent. No external
dependency and no testability seam justifies a port (`run-loop.md` §3b.3).

### 4. Constants

| Constant                                          | Home                                              | Value                       |
| ------------------------------------------------- | ------------------------------------------------- | --------------------------- |
| `RESOURCE_DEFAULTS.PortEnvVar`                    | existing, `packages/aspire/constants.ts`          | `'PORT'` — reused, not re-declared |
| `USER_PORT_RANGE`                                 | `packages/cli/src/kernel/constants/port-ranges.ts` | `{ start: 1024, end: 65535 }` |

`USER_PORT_RANGE` is added next to `PORT_RANGES` because it is the same kind of finite domain value
and the file already owns the `PortRange` type. No string literal for the env var name is
introduced — the existing constant is used, so the emitted `env:` stays a single source of truth.

### 5. Commit slices

As enumerated in `plan.md` § Commit slices (8 slices). Order is load-bearing: the contract (2) must
land before the renderer (3) type-checks, and the renderer before the scaffold (5) can stop writing
a port.

### 6. Deferred scope

Per `plan.md` § Deferred scope: plugin API resources stay pinned (blocked on E2E endpoint
resolution); the dashboard-first docs rewrite; `PORT_RANGES.SERVICE` retained for default literal
selection; no second CLI flag.

### 7. Contributor path

A contributor who wants to change *which* resources pin a host port edits exactly one thing: what
they pass to `renderHttpEndpoint(...)` in the relevant `generate-register-*.ts`. A contributor who
wants to change *how* a pin is expressed edits `render-http-endpoint.ts` alone, and the three
generators follow. A contributor adding a new resource class copies the two-line call from
`generate-register-services.ts`.

---

## Slice log

### Slice 1 — harness artifacts

Design recorded above before implementation. `research.md`, `plan.md`, `supervisor.md`, `drift.md`
seeded.

**Reconcile note:** #952 is `status:` unset, `type:fix`, `area:aspire`, milestone `0.0.1-beta.12`,
state OPEN. No linked PR yet. No new comments since the run started beyond the one the brief cites.
Two issue claims were corrected during research and are recorded in `drift.md` (D-2, D-3).
