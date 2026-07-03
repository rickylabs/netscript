# Drift Log — deploy-s7-aspire (#343 / PR #363)

Append-only. Severity: minor | significant | architectural.

## D1 — S2 port-expansion reconciliation (Risk R1 materialized) — significant

The plan's **S2 (3-op → 7-op DeployTargetPort expansion)** was landed independently
by **S0 (#370, commit `95576c44`)** and merged into this branch (`e6c46758`) before
implementation began. This is exactly the planned Risk R1 / Open-Decision outcome:
"if a sibling lands the port expansion first, S7 rebaselines S2 — a merge
reconciliation, not a redesign."

Verified state of the merged S0 surface:

- `kernel/domain/deploy/deploy-target-port.ts` already defines the canonical 7-op
  `DeployOperation` (`plan | emit | up | down | status | logs | rollback |
  secrets`) plus retained `LegacyDeployOperation` (`build | install | uninstall`)
  aliases. All op methods are **optional**; adapters advertise supported ops via
  `operations`.
- `windows-service-deploy-target.ts` still compiles unchanged (it uses the legacy
  `build/install/uninstall` verbs, which S0 kept as aliases).
- `deploy-target-registry.ts`, `deploy-target-registry-port.ts`, and
  `deploy-target-port_test.ts` already reference the expanded surface.

**Reconciliation decision:** S7 does **NOT** re-expand or redefine the port. S2
collapses to a no-op verification. The windows stub, registry, and port test are
left untouched (S0 already migrated them). No rework required — consistent with
the plan's R1 mitigation.

## D2 — S3 core secrets/rollback convention is a cross-slice dependency (BLOCKED) — significant

The plan's **S3** centralizes the `secrets` + `rollback` convention primitives in
the deploy core (R-DEPLOY-3, shared not per-adapter). Those core primitives do
**not** exist on `main` yet. The S0 port doc comment is explicit:

> `rollback`/`secrets` bodies land with the deployment hardening slice (#341);
> until then adapters may declare them unsupported (omit the method) rather than
> provide a silent no-op.

Per the implementer guardrail ("if the core convention primitives do NOT yet exist,
STOP and report as a blocking cross-slice dependency rather than forking the
convention"), S7 does **NOT** fork/implement secrets or rollback itself.

**Reconciliation decision:** The Aspire compose adapter ships the supported subset
(`plan`/`emit`/`up`/`down`/`status`/`logs`) and **omits** `rollback`/`secrets`
(declares them unsupported), exactly as the port doc sanctions. S3 is deferred to
the #341/#364 core-conventions slice. Recorded as NEEDS-CORE dependency.

## D3 — S1 "re-home docker sub-block" interpreted non-destructively — minor

Plan L7 / S1 says "re-home the existing `docker` sub-block". The base
`deployTargetBaseShape.docker` image block (`denoBaseImage`/`dotnetBaseImage`) is
**consumed by `resolveWindowsDeploy`** (`kernel/adapters/config/deploy-config-resolvers.ts`),
so physically moving it off the base would break the Windows resolver. The new
`DockerComposeDeployTargetSchema` **spreads `deployTargetBaseShape`**, so it
inherits the `docker` image block (with the `denoland/deno:2` default) — that is
its natural home for container targets. The base block is left in place; no
breaking move. R-DEPLOY-4 (member spreads the base, no base class) is satisfied.

## D4 — F-9 permission manifest: CLI runs under `--allow-all` (no narrower manifest) — minor

The plan's F-9 asks for `--allow-run` declared for `aspire`/`docker` in the CLI
permission manifest. The NetScript CLI has **no fine-grained permission manifest**:
`packages/cli/deno.json` `dev`/`build`/`install`/`test` tasks and `bin/netscript.ts`
all run under `--allow-all`. The adapter shells `aspire`/`docker` via the existing
`DenoProcess` (`Deno.Command`), whose run authority is already granted ambiently by
`--allow-all`. No manifest exists to narrow, so S7 documents the external commands
in the adapter JSDoc instead. Narrowing the CLI to explicit permissions is a
pre-existing, CLI-wide concern outside this slice.

## D5 — S5 adapter registration lives in the composition root (layering) — minor

The plan's S5 lists `deploy-target-registry.ts` among the files to touch for
registration. The `AspireComposeDeployTarget` requires a `ProcessPort`, which only
exists in the composition root. `application/registries/deploy-target-registry.ts`
would have to import a `kernel/adapters/**` class to register it there, inverting
the layering (application → adapters). Instead the two adapter instances are
registered in `public/features/root/public-command-dependencies.ts` (the DI
composition root, which already constructs `process` and other adapters) via the
registry's public `register`/constructor API. The registry module is left generic.
This preserves F-3 layering; R-DEPLOY-2/A11 (registry as the named extension axis)
is unchanged.

## D6 — packages/cli is excluded from repo lint + fmt gates — minor

`deno.json` `lint.exclude` and `fmt.exclude` both list `packages/cli/`, and the
`deno task lint` / `deno task fmt:check` commands additionally `--exclude` cli.
Therefore `deno lint`/`deno fmt` report "No target files found" for cli paths and
the scoped wrappers exit non-zero with **zero findings** — a scoping artifact, not
a real finding (reproduced against the pre-existing, known-good windows stub). The
authoritative gate for cli source is `deno check` (type), which passes for all S5
changes, plus the co-located unit tests. cli code is still hand-kept to the repo
style (2-space, single quotes, semicolons, width 100).

## D7 — S4 (apphost compose-publishing generation) deferred as a coordinated cross-slice primitive — significant

**Grounding (Aspire docs MCP, `docker-integration`):** the TypeScript AppHost API
names in the plan are confirmed real — `await builder.addDockerComposeEnvironment("compose")`,
`resource.publishAsDockerComposeService(async (r, service) => …)`,
`builder.addParameterFromConfiguration(name, ENV)`, `builder.addDockerfileBuilder(name, ctx, cb, {stage})`.
Two decisive facts emerged:

1. **Auto-publish:** "When a Docker Compose environment is present, all resources
   are automatically published as Docker Compose services — no additional opt-in
   is required." So `publishAsDockerComposeService` is an *optional customization*,
   and the minimal enabler is (a) adding the official `Aspire.Hosting.Docker` NuGet
   to `aspire.config.json` `packages` (re-emits correctly, unlike the community Deno
   one — see `generate-aspire-config.ts` L44-56) and (b) one
   `builder.addDockerComposeEnvironment("compose")` call.
2. **Deno-resource blocker:** NetScript registers Deno services/apps/background as
   `builder.addExecutable('deno', …)` (the deliberate SDK-primitive approach, same
   file L44-56). Aspire's compose publisher containerizes resources; an *executable*
   is not a container, so publishing Deno resources to compose requires the
   `denoland/deno:2` `addDockerfileBuilder` / container-resource weave the plan
   calls for. That weave is **cross-cutting** across the shared
   `register-services` / `register-apps` / `register-background` generators.

**Why deferred (guardrail: STOP if risky/unvalidatable or cross-slice):**

- **Unvalidatable here.** Whether `aspire publish` emits a *valid* compose for
  NetScript's Deno executable resources cannot be proven without the Aspire .NET
  SDK + Docker daemon (`aspire restore` → `aspire publish` → `docker compose config`).
  That is exactly the S8/S9 merge-readiness / `scaffold.runtime` gate the guardrails
  say NOT to run per-slice — it needs the evaluator environment. A green snapshot
  test would lock the *string* but not prove Aspire accepts it, risking a
  false-green.
- **Shared convention, not a per-target fork (R-DEPLOY-3 / centralization law).**
  The per-resource compose-publishing generation (Deno `denoland/deno:2` Dockerfile +
  `publishAsDockerComposeService` + config→`Parameters__*`) is a SHARED publishing
  primitive. The concurrent **#342 Deno Deploy adapter** needs the same
  apphost-publishing surface; three deployment-epic agents (ace40639 coordinator,
  a57afc0d #339/#340, a5a1f7ea #342) are live on it now. Landing an isolated fork of
  this generation on this branch risks a merge collision and a doctrine violation
  (forked convention).

**Decision:** S4 apphost-gen is deferred to a coordinated slice under the epic
coordinator, implemented ONCE as a shared primitive (compose env + Docker NuGet +
Deno `denoland/deno:2` Dockerfile weave + `Parameters__*`) with the full
`scaffold.runtime` + `docker compose config` E2E as its runtime gate. The S5 adapter
already delegates `plan`→`aspire publish`, so it works unchanged the moment the
apphost gains the compose environment — the deferral is cleanly separable and does
not block the adapter/router/config slices. Recorded as NEEDS-COORDINATION +
NEEDS-EVALUATOR-ENV. See also arch-debt entry DEPLOY-S7-APPHOST-COMPOSE-GEN.

## D8 — S8 merge-readiness E2E requires the evaluator/Docker environment — significant

The plan's S8 (Slice-9 gate) is the CI-safe compose-artifact emit +
`docker compose config` validation plus the full `deno task e2e:cli run
scaffold.runtime` smoke. Both require the Aspire .NET SDK and (for `docker compose
config`) a Docker daemon, which are not available in this implementation
environment, and the guardrails explicitly forbid running the expensive
`scaffold.runtime` smoke per-slice. This gate is therefore handed to the
evaluator/merge-readiness environment (OpenHands IMPL-EVAL / Docker-capable host).
It is additionally gated on D7 (there is no compose environment to publish until the
apphost-gen slice lands).
