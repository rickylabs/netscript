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
