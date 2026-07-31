# Research — fix(aspire): generated fixed host ports defeat `aspire start --isolated` (#952)

## 1. Re-baseline

No plan or audit was carried in. The issue body was written from a symptom report by four models
building apps on `0.0.1-beta.11`, plus one direct verification of the generated line in a pristine
scaffold. Every claim below was re-derived against `main @ 8e0bcef39`.

Two of the issue's own statements did **not** survive re-baselining — see §4.

## 2. Findings

### F-1 — The generators emit a fixed **host** port for three resource classes

| Generator                       | Line | Emitted                                                     |
| ------------------------------- | ---- | ----------------------------------------------------------- |
| `generate-register-services.ts` | 74   | `.withHttpEndpoint({ port: ${entry.Port}, env: 'PORT' })`     |
| `generate-register-plugins.ts`  | 79   | `.withHttpEndpoint({ port: ${entry.Port}, env: 'PORT' })`     |
| `generate-register-apps.ts`     | 85   | `.withHttpEndpoint({ port: ${entry.Port}, env: 'PORT' })`     |

All three are unconditional: `entry.Port` is always interpolated, so the generated apphost always
pins a host port. Verified by reading the three files.

### F-2 — Aspire endpoint semantics: `port` is the host/proxy port, `targetPort` is the listen port

`aspire start --help` (13.4.6, installed at `/usr/local/bin/aspire`) documents `--isolated` as "Run
in isolated mode with randomized ports and isolated user secrets, allowing multiple instances to run
simultaneously". String inspection of the CLI binary shows isolated mode randomises the CLI-owned
endpoints (`ASPIRE_DASHBOARD_OTLP_ENDPOINT_URL`, `ASPIRE_RESOURCE_SERVICE_ENDPOINT_URL`,
`ASPIRE_ALLOW_UNSECURED_TRANSPORT`) and copies user secrets. **It exports no signal an AppHost can
read to detect isolated mode** — there is no `ASPIRE_ISOLATED` variable. A resource endpoint the
AppHost pinned therefore stays pinned under `--isolated`.

Aspire's own documentation (aspire.dev, `what-is-the-apphost`, TypeScript AppHost tab) shows the
canonical shape for a non-.NET executable/frontend resource as:

```ts
await builder.addViteApp("frontend", "../frontend")
    .withHttpEndpoint({ env: "PORT" })
```

— **no port at all**. Aspire allocates both the host port and the target port and injects the target
port into the process through the named env var.

### F-3 — The repo already knows the `targetPort` idiom, for containers

`generate-register-infrastructure.ts` L293/L346/L403 emits
`.withEndpoint({ name: 'http', targetPort: 4512, scheme: 'http' })` for the DenoKV container and the
Garnet executable. So infrastructure resources already leave the **host** port ephemeral and are
isolation-safe today. Only the service/plugin/app registrations pin a host port.

### F-4 — The scaffolded processes already honour `PORT`

`assets/service/main.ts.template` L16: `port: parseInt(Deno.env.get('PORT') || '{{servicePort}}')`.
`assets/app/main.ts.template` L17: `const port = parseInt(Deno.env.get('PORT') || '{{appPort}}')`.

Both bind whatever Aspire injects, falling back to the scaffold literal only outside Aspire. So
removing the pinned host port needs **no runtime change** — the injected `PORT` already carries
Aspire's dynamically allocated target port.

### F-5 — Cross-resource wiring already resolves dynamically

`generate-register-services.ts` pass 2 wires references through `getEndpoint('http')` +
`services__{name}__http__0`. `generate-register-apps.ts` uses `getResourceEndpoint(...)` and
`buildViteEnvVarName(...)`. None of this reads `entry.Port`. Service discovery is therefore
unaffected by dropping the pin.

### F-6 — The `[3000, 3099]` restriction is a scaffold-time input check, not a runtime constraint

`application/scaffold/validate-init.ts` L107–L118 rejects `--service-port` outside
`PORT_RANGES.SERVICE`. `constants/port-ranges.ts` defines `SERVICE {3000,3099}`, `APP {8000,8099}`,
`PLUGIN_API {8091,8099}`, `INFRA_PLUGIN {4400,4499}`. The ranges exist so
`adapters/plugin/scaffolder.ts` and `adapters/scaffold/workspace-writer.ts` can hand out
non-colliding *defaults* within one workspace. Nothing at runtime requires a service to be in
`[3000,3099]`.

### F-7 — The existing generator tests asserted the defect

`templates/aspire/helpers/tests/generators-service-plugin_test.ts` L71 asserts
`'.withHttpEndpoint({ port: 3000'` and L200 asserts `'.withHttpEndpoint({ port: 4400'`;
`generators-background-app_test.ts` L272 asserts `".withHttpEndpoint({ port: 8000, env: 'PORT' })"`.
These are the checks that "looked slightly past the problem" — they pinned the exact defective line
into the suite, so the defect could not regress *out*.

### F-8 — Blast radius: what depends on a pinned port today

| Consumer                                                          | Depends on                     | Effect of making it ephemeral      |
| ----------------------------------------------------------------- | ------------------------------ | ---------------------------------- |
| `e2e/src/application/gates/scaffold/runtime-gates.ts` L140–L235    | live probes `127.0.0.1:8091–8094` and `--allow-net=127.0.0.1:8091,…` | **breaks** the `scaffold.runtime` merge-readiness gate |
| `docs/site/**` (tutorials, explanation, concepts)                  | `:8091 :8092 :8093 :8094` prose + `curl` examples | breaks ~20 doc references          |
| `docs/site/concepts.vto` L62                                       | `":3000"` for "Your service"    | one prose reference                |
| `docs/site/tutorials/chat/*`                                       | `curl localhost:8010`           | two `curl` examples                |
| `e2e` gates                                                        | **no** probe of `:3000` or `:8010` — verified by grep | none                              |

This asymmetry is the reason the fix is scoped to services + apps and explicitly not to plugin API
resources (see `plan.md` § Deferred scope).

## 3. jsr-audit surface scan

The change touches `@netscript/cli` (generator internals, not exported), `@netscript/aspire`
(`config.ts` entry interfaces + `schema.ts` zod schemas — both public), and
`@netscript/config` (`service-schema.ts`, public).

- Making an existing required field **optional** (`Port: number` → `Port?: number`) is additive for
  consumers *reading* the type and narrowing for consumers *constructing* it — no new slow types,
  no new exported symbol.
- The new `HostPort` field is a plain optional `number`; zod `.optional()` on `z.number().int()
  .positive()` keeps `isolatedDeclarations` satisfiable because the schemas are already explicitly
  annotated (`packages/aspire/schema.ts` uses concrete `z.ZodType<T>` annotations).
- No re-export of upstream, no new subpath, no new dependency. F-6 (JSR publishability) is expected
  to hold; `deno task publish:dry-run` is in the gate set.

## 4. Two issue claims that did not survive re-baselining

### C-1 — "`targetPort` appears nowhere in `packages/aspire/src`" — true but misleading

Literally true for `packages/aspire/src`. But the fix does not belong there: the generated apphost
is produced by `packages/cli/src/kernel/templates/aspire/helpers/register/*`, and that directory
**already uses `targetPort`** (F-3). The idiom is present; it was simply never applied to the
executable resources.

### C-2 — The suggested direction ("treat the configured port as the target port") does **not** fix the bug

This is the substantive correction. For **container** resources a target port is namespaced inside
the container, so pinning it is free. For **executable** resources — which is what every NetScript
service, plugin and app is (`builder.addExecutable(...)`) — the target port is a real port on the
host machine: it is the port the `deno` process itself binds.

So:

| Shape                                     | host/proxy port | port the process binds | second workspace |
| ----------------------------------------- | --------------- | ---------------------- | ---------------- |
| today: `{ port: 3000, env: 'PORT' }`      | **3000 fixed**  | random                 | proxy collision  |
| issue's suggestion: `{ targetPort: 3000 }`| random          | **3000 fixed**         | bind collision   |
| `{ env: 'PORT' }`                         | random          | random                 | **no collision** |

Adopting `targetPort` would move the collision from the proxy to the process and would additionally
prevent Aspire replicas, but it would not make `--isolated` work. The only shape that actually
isolates is emitting **no port at all**. The plan follows the issue's *intent* ("isolated mode
isolates the instance", "if a fixed host port is genuinely wanted, name the setting `HostPort`") and
rejects its *mechanism*.

## 5. Open questions closed by this research

| Question                                                          | Answer                                                                 |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Can the AppHost detect `--isolated` and drop pins conditionally?   | **No.** No env signal (F-2). A conditional design is not available.     |
| Does dropping the pin break service discovery?                     | No (F-5).                                                              |
| Does dropping the pin need a runtime/template change?              | No (F-4).                                                              |
| Can plugin API ports be made ephemeral in this run?                | **No** — `scaffold.runtime` live-probes them (F-8). Separate wave.      |
| Is the `[3000,3099]` window load-bearing at runtime?               | No (F-6). It only shaped default assignment.                           |
