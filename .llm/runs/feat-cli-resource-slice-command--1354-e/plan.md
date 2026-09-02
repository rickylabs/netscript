# Plan: Slice E — unregistered resource command

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-cli-resource-slice-command--1354-e` |
| Branch | `feat/cli-resource-slice-command` |
| Phase | `plan` |
| Target | `packages/cli` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `frontend` (runtime/browser acceptance explicitly deferred to Slice G) |

## Archetype and Doctrine

`packages/cli` remains Archetype 6 with the current **Keep** verdict: preserve the kernel/surface
split. The vertical resource feature owns parsing and orchestration, application primitives stay in
the kernel, and adapters enter only through injected dependencies. Presentation composes
application; application never imports presentation.

## Goal

Implement and test the five-file `generate resource` command internals with full preflight and zero
application writes on every pre-apply failure, while leaving the command unregistered.

## Scope

- Public input/flag mapping, use-case orchestration, Cliffy definition, and their focused tests.
- Existing app-root, planner, renderer, reconcilers, filesystem/template ports, and Fresh staging
  adapter are consumed through explicit dependencies.
- D3 dry-run, conflict, owned-only force, idempotency, and failure proofs execute through the command.

## Non-Scope

- No edit to `public-command-dependencies.ts`, `generate-group.ts`, or command-tree registration.
- No selector reimplementation, init convergence, template changes, journal, lock, rollback,
  recovery flags, Aspire, Docker, browser, or `e2e:cli`.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1/D8 | A vertical resource feature defines the command and calls existing application services. | Keeps Cliffy/formatting at the public edge. |
| D2 | Static absolute routes only; `--client` is forwarded to one injected resolver. | Matches the evaluated contract without duplicating #1664. |
| D3 | Resolve/validate → render in staging → transform shared sources → reconcile all targets → dry-run/apply. | Guarantees no application write before complete preflight. |
| D9-E | `public-command-dependencies.ts` is off-limits and registration is deferred. | Avoids live #1664 overlap; owner directive. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Concrete client discovery | Safe to defer | Slice A's `client-selector.ts` supplies the named resolver seam before F registers the command. |
| Cross-file crash atomicity / locking | Safe to defer | Explicitly outside D3. |
| Runtime/browser acceptance | Safe to defer | Hosted Slice G owns it. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| A staging failure leaks application writes | Tests snapshot every application byte around each injected failure. |
| Force replaces user content | Command-level tests exercise owned, owned-edited, and unowned leaves. |
| Fresh output is derived from an incomplete route tree | Staging mirrors current routes before overlaying candidates. |
| Selector behavior is accidentally cloned | Resolver is injected; no candidate scanning or auto-pick is implemented. |
| Command becomes reachable early | No registration or root dependency edit. |

## Anti-Patterns to Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-1 | risk | Keep command ≤150 LOC and orchestration ≤250 LOC; split only within the five planned files. |
| AP-11/AP-25 | risk | Host IO behind injected filesystem/staging dependencies. |
| AP-18 | risk | Assert semantic reports, file bytes, and exit codes rather than giant snapshots. |
| AP-23 | avoided | No composition-root edit or inline root action. |

## Validation Plan

1. Focused resource feature/parser tests through the structured test wrapper, with exact counts.
2. Full package-owned CLI tests through the structured wrapper, with exact counts.
3. Structured CLI check/lint/fmt wrappers.
4. `docs:readme-fences`, `docs:jsdoc-examples`, CLI JSR audit, publish dry-run, `arch:check`, and
   `quality:gate`.
5. Confirm `deno.lock` unchanged and no public carrier cascade required.

## PLAN-EVAL

`PLAN-EVAL: N/A` — the owner supplied a locked, already evaluated multi-slice plan and explicitly
directed exact Slice E implementation. The upstream plan run reached native opposite-family Fable 5
`PASS_PLAN_WITH_FINDINGS` at `409630338d9db4c94dac33c37a083c29050318ea`; this run transcribes
that decision set and does not reopen it.
