# Worklog — fix-aspire-ephemeral-host-ports--952

## Design

Recorded before any implementation file was created, per `run-loop.md` §3b.

### 1. Public surface

| Surface                                                                 | Change                                                                                   |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `@netscript/aspire` `ServiceEntry` / `PluginEntry` / `AppEntry`           | `Port` becomes optional (already optional on `AppEntry`); new optional `HostPort: number`   |
| `@netscript/aspire` `ServiceEntrySchema` / `PluginEntrySchema` / `AppEntrySchema` | matching zod fields (widening only)                                               |
| ~~`@netscript/config` `ServiceConfigSchema`~~                            | **dropped during implementation** — that surface never reaches the apphost (`drift.md` D-6) |
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

### Slices 2–4 — host-port contract, single renderer, regression tests

**Plan readjustment.** `plan.md` sliced the renderer (3) and its tests (4) separately, but slice 3's
named gate *is* the generator unit tests, so they cannot land apart without a slice that proves
nothing. Folded into one commit. `packages/config` was also dropped from slice 2's file list: its
`ServiceConfig.port` is the `netscript.config.ts` surface and does **not** feed appsettings — the
only `port` → `Port` bridge in the repo is `generate-appsettings.ts`'s own local option type
(verified by `rg '\.port\b'` across `templates/aspire` and `application/scaffold`). Widening it would
have been a speculative change with no consumer. Recorded in `drift.md` D-6.

**What landed**

- `packages/aspire/config.ts` — new `HostPortEntry` mixin (`HostPort` + `@deprecated Port` alias),
  mixed into `ServiceEntry` / `AppEntry` / `PluginEntry`; matching `HostPortFields` zod shape. Both
  fields optional — a widening, so no existing `appsettings.json` becomes invalid.
- `packages/aspire/types.ts` — `HostPortEntry` re-exported alongside the other entry types.
- `register/render-http-endpoint.ts` (new) — owns the `HostPort ?? Port ?? no-pin` rule and the
  emitted string. One seam, three callers (D-4).
- The three `generate-register-*.ts` generators call it. The apps generator additionally gained
  `needsHttpEndpoint(...)`: a web `app` now always gets an endpoint (it is a web server; previously
  the endpoint was gated on a truthy `Port`, so un-pinning would have removed it entirely), while
  `tauri` / `task` keep the historical opt-in and `desktop` keeps getting none.
- `register-http-endpoint_test.ts` (new, 18 assertions) + two existing assertions tightened from
  `'.withHttpEndpoint({ port: 3000'` to the full emitted line.

**Gate evidence**

| Gate                            | Command                                                                  | Result |
| ------------------------------- | ------------------------------------------------------------------------ | ------ |
| Type-check (scoped wrapper)     | `run-deno-check.ts --root packages/aspire --root .../templates --ext ts`  | 0 occurrences |
| Lint (scoped wrapper)           | `run-deno-lint.ts --root .../templates --ext ts`                          | 0 occurrences |
| Format (scoped wrapper)         | `run-deno-fmt.ts --root .../templates --root packages/aspire --ext ts`    | 0 findings |
| Generator tests                 | `deno test packages/cli/src/kernel/templates/aspire/helpers/tests/`       | 18 passed, 0 failed |
| **Fails-before proof**          | renderer temporarily reverted to unconditional `port:`, same suite re-run | **4 failed** — then restored |

**Slice review (Amendment A1).** Reviewed the landed diff: the renderer is pure and total; the
`?? ` chain has one home; the apps-generator condition change is the only behavioural widening and
it is covered by three tests including the "task app still gets no endpoint" case that proves the
widening is bounded. No `any`, no lint-ignore, no plugin-name coupling introduced.

**Reconcile note:** no new comments on #952. No related issue moved. Drift D-6 appended.

### Slice 5 — the pristine scaffold stops pinning

**What landed**

- `validate-init.ts` — `--service-port` is now the only source of a pin. The
  `[3000, 3099]` rejection is replaced by `USER_PORT_RANGE` `[1024, 65535]`; `servicePort`
  (the source-literal fallback) and `serviceHostPort` (the Aspire pin) become two derived values
  from one flag.
- `constants/port-ranges.ts` — `USER_PORT_RANGE` added beside `PORT_RANGES`.
- `render-ts-apphost.ts` / `generate-appsettings.ts` — neither writes a port for the example
  service or the app; both emit `HostPort` only through a conditional spread. `appProxyPort`
  (the 8010 literal) is gone.
- `scaffold-plan.ts` / `scaffold-options.ts` — `hostPort` / `serviceHostPort` threaded through,
  each documented as "pin" vs "source fallback" so the two never get conflated again.
- `plugin/scaffolder.ts` — `collectPorts` now counts `HostPort` as well as `Port` when deciding
  which ports are taken, so plugin allocation still avoids a pinned service port.
- `service-shape.ts` / `list-services-command.ts` — `DiscoveredService.port` is optional;
  `netscript service list` prints `aspire` rather than `undefined` for an unpinned service.
- `init-orchestrator.ts` / `init-pipeline.ts` — the "next steps" output no longer promises
  `http://localhost:3000/api/rpc`. It points at the dashboard when Aspire assigns the port, prints
  the literal URL for `--no-aspire` or a pinned port, and warns that a pin defeats `--isolated`.
- `init-command.ts` — `--service-port` help text states what the flag now means.

Three existing tests encoded the old contract and were rewritten to the new one, each keeping a
positive assertion for the compat path: `ServiceEntrySchema: rejects missing Port` →
`accepts a service that pins no host port` + a new `HostPort`/alias/`0` case;
`generateAppsettings should include example service` → asserts no pin, plus a new pinned case;
`initNextSteps reports the ... oRPC endpoint` → three cases (dashboard / pinned / no-Aspire).

### Slice 6 — the regression guard

Two layers, because the defect crossed a seam that unit tests on either side both passed:

1. **`pristine-scaffold-ports_test.ts`** (behavioural, primary) — runs the real
   `generateAppsettings()` for a pristine init, feeds the parsed result into the real register
   generators, and asserts the produced `register-services.mts` / `register-apps.mts` contain no
   `withHttpEndpoint({ port:`. This is the assertion that would have caught #952: the appsettings
   test and the generator test each passed while the composed output shipped a pin.
2. **`deno task check:aspire-host-ports`** (static sweep, wired into `ci:quality`) — scans
   `packages/cli/src` for a generated `withHttpEndpoint` with a literal port and for an
   *unconditional* `Port:`/`HostPort:` write in the two files that compose scaffold entries.
   An `aspire-host-port-ok: <reason>` marker allows a deliberate exception; an empty reason fails.

The static rule was written twice. The first version matched only numeric literals — which would
have looked straight past the four lines that actually shipped (`Port: appProxyPort`,
`Port: options.servicePort`, `Port: options.service.port`, `Port: appPort`, all identifiers). Its
test now asserts all four verbatim.

### Slice 7 — docs corrected where this change makes them wrong

- `packages/aspire/README.md` — new **Host ports** section: host vs target, why the default pins
  nothing, how to opt in with `HostPort`, and the `Port` alias compatibility statement.
- `docs/site/concepts.vto` — the "Your service :3000" row now says the dashboard is the authority.
- `docs/site/tutorials/chat/{02,05}` — the `curl localhost:8010` examples take the app URL from the
  dashboard into `$APP`.

Deliberately **not** touched: the ~20 `:8091–:8094` plugin-API references, which stay correct
because plugin resources still pin (`plan.md` D-5), and `services-sdk/how-to/add-a-service.md`,
which documents `netscript service add` — a command this change does not alter.

### Slice 8 — gate sweep and close-out

| Gate | Command | Result |
| --- | --- | --- |
| Repo tests | `deno test --allow-all` | **2245 passed, 0 failed, 12 ignored** (3m8s) |
| Type-check | `run-deno-check.ts` — `packages/cli`, `packages/aspire` | 0 occurrences |
| Lint | `run-deno-lint.ts` — 789 files | 0 occurrences |
| Format | `run-deno-fmt.ts` — 969 files | 0 findings on touched files; 3 pre-existing elsewhere in `.llm/tools`, confirmed against a stashed tree |
| Fitness | `deno task arch:check` | `FAIL=0` on every root |
| Code quality | `deno task quality:scan` | `ok: true`, 0 findings, 7 pre-existing allowances |
| JSR | `deno task publish:dry-run` | `Success Dry run complete` |
| New guard | `deno task check:aspire-host-ports` | 590 files, 0 findings |
| Runtime/Aspire | `deno task e2e:cli run scaffold.runtime` | **NOT RUN** — needs Docker + dotnet Aspire host (`drift.md` D-5) |

**End-to-end proof.** `netscript init smoke952 --service --db none` + `netscript generate` produced
`appsettings.json` with no `Port`/`HostPort` under `Services` or `Apps`, and
`aspire/.helpers/register-services.mts:58` / `register-apps.mts:73` both emit
`.withHttpEndpoint({ env: 'PORT' })`. Scratch workspace removed.

**Reconcile note.** PR #978 opened with `Closes #952`, labels `type:fix` / `area:aspire` /
`area:cli` / `status:impl-eval` / `priority:p1`, milestone `0.0.1-beta.12`; impl phase comment
posted. Deferred scope filed as #979 (plugin API ports, blocked on E2E endpoint resolution) and #980
(`netscript service add` still pins). #952 stays open until the merge auto-closes it.
