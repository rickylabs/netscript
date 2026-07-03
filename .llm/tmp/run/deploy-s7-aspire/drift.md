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
