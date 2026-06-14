# Slice 16 - Fresh Scaffold E2E Proof

Date: 2026-06-12

## Scope

Slice 16 validates the freshly generated scaffolded frontend app after the scaffold revamp:

- Generate a new app from the CLI.
- Run the generated Fresh app.
- Browser-gate `/design/tokens`, `/design/components`, `/design/composition`, and one app route.
- Validate theme flip both ways, mobile `390x844`, reduced motion, and console cleanliness.
- Record the full scaffold runtime E2E verdict.

## Full Scaffold Runtime E2E

Command:

```powershell
rtk proxy deno task e2e:cli run scaffold.runtime --cleanup --format pretty
```

Result: **FAIL** at `database.init`.

Passed gates before the failure:

- `preflight.deno`
- `preflight.aspire`
- `scaffold.init`
- `scaffold.plugin.worker`
- `scaffold.plugin.saga`
- `scaffold.plugin.trigger`
- `scaffold.plugin.stream`
- `scaffold.plugin-list`
- `cleanup.aspire-stop`
- `cleanup.docker-created-containers`

Failure summary:

```text
database.init failed with exit code 1
Prisma schema engine exited with ERR_STREAM_PREMATURE_CLOSE
schema-engine-windows.exe ... cli can-connect-to-database
Premature close
```

The generated Postgres resources reached healthy/ready state before Prisma failed. The failure is
inside the Prisma Windows schema engine during the DB migration connectivity check, not inside the
fresh-ui scaffolded frontend pages validated below.

Artifact:

- `slice16-full-scaffold-runtime-e2e.ndjson`

## Generated Frontend App

Command:

```powershell
deno run -A packages/cli/bin/netscript-dev.ts init slice16-proof --path .llm/tmp/scaffold-smoke-slice16 --db none --ci --yes --no-git --force --no-aspire
```

Result: **PASS**.

- Created 110 files / 23 directories.
- Copied 21 local packages.
- Generated route-scoped design folders under `routes/(design)/design`.

Generated app check:

```powershell
deno check --unstable-kv apps/dashboard
```

Result: **PASS** from the generated project root.

## Browser Proof

Generated app served from:

```text
http://127.0.0.1:8026
```

Viewport:

```text
390x844
```

Route results:

| Route | Expected title | Result | Overflow |
|---|---|---:|---:|
| `/design/tokens` | `Design tokens — NetScript design system` | PASS | none, `scrollWidth=375`, `innerWidth=390` |
| `/design/components` | `Components — NetScript design system` | PASS | none, `scrollWidth=375`, `innerWidth=390` |
| `/design/composition` | `Composition rules — NetScript design system` | PASS | none, `scrollWidth=375`, `innerWidth=390` |
| `/dashboard` | `slice16-proof — dashboard` | PASS | none, `scrollWidth=375`, `innerWidth=390` |

Browser screenshots:

- `slice16-design-tokens-390x844.png`
- `slice16-design-components-390x844.png`
- `slice16-design-composition-390x844.png`
- `slice16-dashboard-390x844.png`
- `slice16-dashboard-theme-flip-dark.png`
- `slice16-dashboard-theme-flip-light.png`
- `slice16-design-tokens-reduced-motion-390x844.png`

Console:

- Result: **PASS**
- Errors: `0`
- Only Vite debug connection messages were observed.

Theme flip:

- Initial computed `color-scheme`: `light`
- `Switch to dark mode` button found: `1`
- After first click: computed `color-scheme=dark`; button label became `Switch to light mode`
- After second click: computed `color-scheme=light`; button label became `Switch to dark mode`

Reduced motion:

- Playwright media emulation: `prefers-reduced-motion: reduce`
- `matchMedia('(prefers-reduced-motion: reduce)').matches`: `true`
- `.ns-token-ramp__step` computed `transition-property`: `none`
- `.ns-token-copy` computed `transition-property`: `none`
- No horizontal overflow under reduced motion: `scrollWidth=375`, `innerWidth=390`

## Slice Gates

| Gate | Result | Evidence |
|---|---|---|
| full scaffold runtime E2E | FAIL | DB branch failed at Prisma `schema-engine-windows.exe` `ERR_STREAM_PREMATURE_CLOSE` |
| generated frontend scaffold | PASS | `slice16-proof` generated with 110 files / 23 dirs |
| generated app check | PASS | `deno check --unstable-kv apps/dashboard` from generated root |
| browser routes | PASS | All required design/app routes rendered with expected titles |
| mobile `390x844` | PASS | No route had document/body overflow |
| theme flip | PASS | Light -> dark -> light verified through real button clicks |
| reduced motion | PASS | Emulated media matched; relevant transitions computed as `none` |
| console | PASS | 0 browser errors/page errors |
| package check | PASS | `rtk proxy deno task check` from `packages/fresh-ui` |
| package test | PASS | `rtk proxy deno task test`, 39 tests passed |
| package tokens | PASS | `rtk proxy deno task tokens:check` |
| DS no raw hex | PASS | `deno run --allow-read .llm/tools/fitness/check-ds-no-raw-hex.ts packages/fresh-ui` |
| DS color utilities | PASS | `deno run --allow-read .llm/tools/fitness/check-ds-color-utilities.ts packages/fresh-ui` |
| arch:check | PASS | `rtk proxy deno task arch:check`, existing manifest-size WARN only |
| lock hygiene | PASS | `deno.lock` and `packages/fresh-ui/deno.lock` unchanged |

## Verdict

The frontend scaffold revamp proof passed on a fresh generated app, including generated design
routes, an app route, mobile layout, theme flip, reduced motion, and console cleanliness.

The broader full runtime scaffold suite still needs a separate DB/Prisma follow-up because
`database.init` failed inside Prisma's Windows schema engine after Aspire/Postgres readiness.
