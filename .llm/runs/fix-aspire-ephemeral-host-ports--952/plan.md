# Plan — fix(aspire): generated fixed host ports defeat `aspire start --isolated` (#952)

## Archetype and verdict

| Field                | Value                                                                             |
| -------------------- | --------------------------------------------------------------------------------- |
| Primary subject      | `@netscript/cli` — the Aspire helper generators + the `init` scaffold plan          |
| Archetype            | **ARCHETYPE-6 (CLI / Tooling)**                                                    |
| Secondary surfaces   | `@netscript/aspire` (Archetype 2 — config contract), `@netscript/config` (Arch. 1) |
| Scope overlay        | **SCOPE-service** (Aspire service work)                                            |
| Doctrine verdict     | `@netscript/aspire` = **Keep**; `@netscript/config` = **Refactor** (unrelated to this change — schema split, not the port contract) |

Archetype selection rationale: per `archetypes/README.md`, when two archetypes apply, take the
larger and fold the smaller inside. The change is a **generator + CLI flag** change (A6) whose blast
radius includes two contract fields on the Aspire integration package (A2). A6 is the larger surface
and owns the deliverable, so A2 concerns are folded in rather than split out.

## Anti-patterns in scope

- **AP: hardcoded host coupling** — the generators emit a machine-global port into generated
  orchestration code unconditionally. The fix removes the unconditional emission.
- **AP: tests that assert the defect** — three generator tests pinned the defective line
  (`research.md` F-7). Rewriting them is part of the fix, not incidental.

## Architecture decisions — LOCKED

### D-1 — The isolation-safe shape is *no port*, not `targetPort`

`research.md` §4 C-2. For `addExecutable` resources both `port` and `targetPort` are real
host-machine ports; pinning either collides across workspaces. `.withHttpEndpoint({ env: 'PORT' })`
— Aspire's own documented shape for non-.NET resources — is the only shape that isolates.
**Rationale:** it is the only option that satisfies the issue's stated expected behaviour
("isolated mode isolates the instance"). We follow the issue's intent and reject its mechanism, and
say so in the PR.

### D-2 — `HostPort` is the new name; `Port` stays a working deprecated alias

A new optional `HostPort` field on `ServiceEntry` / `PluginEntry` / `AppEntry` means "pin this Aspire
**host** (proxy) port; this weakens `aspire start --isolated`". The existing `Port` keeps **exactly
its current meaning and behaviour** and is read as a fallback.

Resolution order: `HostPort ?? Port ?? (no pin)`.

**Rationale (the compatibility story).** Every workspace already on disk has `Port: 3000` in
`appsettings.json`. Re-interpreting that value as a target port (the issue's suggestion) would
silently change what an existing config *does* — the failure mode the issue itself warns about. Not
reading it at all would silently move a service the developer had bookmarked. Reading it unchanged
means **an existing workspace's behaviour is bit-identical after this change**; only *newly
scaffolded* workspaces get the isolation-safe default. `HostPort` exists because `Port` reads as
"the port my service listens on", which is precisely the misreading that produced this bug.

### D-3 — `Port` becomes optional on `ServiceEntry` and `PluginEntry`

Currently `Port: number` (required) on both. New scaffolds omit it, so it must be optional.
`AppEntry.Port` is already optional. This is a **widening** of what the schema accepts — no existing
config becomes invalid.

### D-4 — The pin decision lives in one renderer, used by all three generators

`register/render-http-endpoint.ts` owns the `HostPort ?? Port ?? none` rule and the emitted string.
The three register generators call it. **Rationale:** doctrine F-2 (helper-reinvention scan) — three
copies of the same conditional is exactly the duplication the gate exists to catch, and a single
seam is what lets the plugin-API resources be flipped later by changing one call site's input.

### D-5 — Scope: services and apps are un-pinned; plugin API resources are not

A pristine `netscript init` produces exactly two pinned host ports: the example service (`3000`) and
the app (`8010`). Both are un-pinned by this change, which is what makes the issue's reproduction
pass. Plugin API resources (`8091–8094`) keep their pins because
`e2e/src/application/gates/scaffold/runtime-gates.ts` **live-probes those exact ports** and passes
`--allow-net=127.0.0.1:8091,127.0.0.1:8092` to the generated project (`research.md` F-8).
Un-pinning them requires the E2E gates to resolve endpoints from the Aspire resource service first —
a separate wave. The generator seam from D-4 is already in place for it.

### D-6 — The `[3000, 3099]` restriction is replaced, not deleted

`--service-port` keeps a validation, widened from `PORT_RANGES.SERVICE` to the general
unprivileged-TCP range `[1024, 65535]`. **Rationale:** the narrow window existed to hand out
collision-free *defaults inside one workspace* (`research.md` F-6); once the default is "no pin",
the window's only remaining effect is to force every workspace on a machine into the same 100 ports.
Keeping *a* check preserves the useful part (reject `0`, `70000`, privileged ports) and drops the
harmful part.

### D-7 — `--service-port` now means "pin the host port", explicitly, with a warning

Passing `--service-port` is the documented opt-in from D-2. It sets `HostPort` in `appsettings.json`
**and** the source-literal fallback in `services/<name>/src/main.ts`, and the init summary states
that the pin weakens `--isolated`. Omitting it (the default) pins nothing.

## Open-decision sweep

| Decision                                                     | State          | Note                                                                 |
| ------------------------------------------------------------ | -------------- | -------------------------------------------------------------------- |
| `targetPort` vs no-port                                       | **resolved**   | D-1. Deferring would force a full rewrite of the generator change.    |
| `HostPort` new field vs re-using `Port`                       | **resolved**   | D-2. Deferring would force a second contract change later.            |
| Whether apps are in scope                                     | **resolved**   | D-5. Deferring leaves the issue's own repro failing.                  |
| Whether plugin API ports are in scope                         | **resolved**   | D-5 — deferred *with a named blocker*, not left open.                 |
| Range check: delete vs widen                                  | **resolved**   | D-6.                                                                  |
| Docs corpus rewrite to "read the URL from the dashboard"      | **safe to defer** | Only the 5 references that this change makes *wrong* are corrected here; the broader dashboard-first docs rewrite is its own wave and does not force rework. |
| E2E endpoint resolution for plugin APIs                       | **safe to defer** | Blocks D-5's remainder only; no rework of what lands here.            |

No open decision would force rework if deferred.

## Risk register

| # | Risk                                                                                  | Likelihood | Mitigation                                                                                          |
| - | ------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------- |
| R1 | Un-pinning breaks cross-resource wiring                                               | low        | `research.md` F-5: wiring is already `getEndpoint('http')`-based and never reads `Port`. Generator tests assert the pass-2 blocks are unchanged. |
| R2 | The scaffolded process fails to bind because `PORT` is not injected                   | low        | F-4: both templates already read `PORT` with a literal fallback. `env: 'PORT'` is retained in every emitted shape. |
| R3 | Making `Port` optional breaks a downstream consumer that constructs `ServiceEntry`     | low        | Widening a type is source-compatible for readers; the only in-repo constructors are the scaffold writers, both updated in the same slice. `deno task check` proves it. |
| R4 | `scaffold.runtime` E2E regresses                                                       | medium     | Plugin API ports deliberately untouched (D-5); no gate probes `:3000` or `:8010` (F-8 grep). The gate itself needs Docker + dotnet and is **not runnable in this worktree** — declared, not skipped silently. |
| R5 | Plugin port allocation double-assigns because `getUsedPorts` misses `HostPort`         | low        | `adapters/plugin/scaffolder.ts` `collectPorts` is extended to read `HostPort` as well as `Port`.      |
| R6 | The fix regresses at the next release cut, exactly as it shipped this time             | medium     | This is what the guard is for: a new `check:aspire-host-ports` validation script wired into `deno task ci:quality`, plus generator tests that assert the *absence* of a pin. |

## Gate set (from `gates/archetype-gate-matrix.md`, Arch 6 + SCOPE-service)

| Gate                         | Status in this run                                                        |
| ---------------------------- | -------------------------------------------------------------------------- |
| Static gates (check/lint/fmt)| **required** — scoped wrappers + `deno task check|lint|fmt:check`           |
| F-1, F-3, F-5, F-11, F-12, F-16, F-19 | **required** — `deno task arch:check`                             |
| F-6 JSR publishability       | **required** — `deno task publish:dry-run`; surface scan in `research.md` §3 |
| F-7 Doc-score                | **required** — new public field carries a JSDoc one-liner                    |
| F-10 Test-shape              | **required** — semantic assertions, no snapshot                              |
| Code-quality gate            | **required** — `deno task quality:scan` (wave touches `packages/**`)         |
| Consumer import validation   | **required** — `deno task check` across `packages` + `plugins`               |
| Runtime/Aspire validation    | **optional → DECLARED NOT RUN**: `deno task e2e:cli run scaffold.runtime` needs Docker + the dotnet Aspire host and cannot run in this worktree. Stated in the PR rather than silently skipped. |
| Release-gate class           | `n/a` — this run does not cut a release. **But** it changes scaffold output, so `gates/release-gates.md` makes `scaffold.runtime` required *before the next cut* — recorded as a PR callout. |

## Commit slices

| # | Slice                                                                 | Proves                                                        | Files                                                                                                                            | Gate                        |
| - | --------------------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| 1 | Harness artifacts (research, plan, design, supervisor)                | The Design checkpoint exists before implementation             | `.llm/runs/fix-aspire-ephemeral-host-ports--952/*`                                                                                | n/a (plan slice)            |
| 2 | `HostPort` contract: optional `Port`, new `HostPort`, zod + types      | The config contract accepts an un-pinned resource              | `packages/aspire/config.ts`, `packages/config/src/domain/schemas/service-schema.ts`                                               | `deno task check`           |
| 3 | Single endpoint renderer + all three generators call it                | Absence of a pin emits `{ env: 'PORT' }`; presence still pins  | `packages/cli/src/kernel/templates/aspire/helpers/register/render-http-endpoint.ts` (new) + the three `generate-register-*.ts`     | generator unit tests        |
| 4 | Generator tests: assert the isolation-safe shape and the pin path      | The defect cannot regress *in*                                 | `helpers/tests/generators-service-plugin_test.ts`, `helpers/tests/generators-background-app_test.ts`                              | `deno test`                 |
| 5 | Scaffold plan: pristine `init` writes no `HostPort` for service/app    | The issue's reproduction passes                                | `application/scaffold/validate-init.ts`, `render-ts-apphost.ts`, `workspace-init.ts`, `init-pipeline.ts`, `init-orchestrator.ts`, `templates/aspire/generate-appsettings.ts`, `adapters/plugin/scaffolder.ts` | `deno test`                 |
| 6 | `check:aspire-host-ports` guard + `deno task` wiring                   | The defect cannot regress at the next release cut              | `.llm/tools/validation/check-aspire-host-ports.ts` (new), `deno.json`, guard unit test                                            | `deno task check:aspire-host-ports` |
| 7 | Docs: correct the references this change makes wrong                   | Shipped docs match shipped behaviour                           | `docs/site/tutorials/chat/02-durable-chat-route.md`, `05-mcp.md`, `docs/site/concepts.vto`, `packages/aspire/README.md`           | `deno task fmt:check`       |
| 8 | Full gate sweep + run-artifact close-out                               | Every required gate has recorded evidence                      | run dir                                                                                                                          | full gate set               |

8 slices, < 30. Slices 2→3→5 are strictly ordered (contract before renderer before scaffold).

## Debt implications

- **Closes nothing** in `arch-debt.md`.
- **Opens one deferred item** (D-5): plugin API resources still pin `8091–8094`. This is recorded in
  `drift.md` and filed as a follow-up issue rather than an `arch-debt.md` entry, because it is a
  product-behaviour gap with a named blocker (E2E endpoint resolution), not an architectural
  deviation.

## Deferred scope

1. **Plugin API resources stay pinned** (D-5) — blocked on `scaffold.runtime` resolving endpoints
   dynamically. Follow-up issue.
2. **The dashboard-first docs rewrite** — ~20 references teach `curl :8091`. Those stay correct
   because plugin ports stay pinned; only the 5 references this change actually invalidates are
   corrected in slice 7.
3. **`PORT_RANGES.SERVICE` is not deleted** — still used by `workspace-writer.ts` /
   `port-allocator.ts` to pick a sensible default *literal* for the service source fallback. Only
   the `init` input restriction is widened.
4. **No `--host-port` CLI flag** — `--service-port` already carries the meaning (D-7); a second flag
   would be speculative surface.
