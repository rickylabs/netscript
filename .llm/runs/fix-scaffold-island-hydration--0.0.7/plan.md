# Plan: scaffolded showcase island hydration

## Run Metadata

| Field         | Value                                                                   |
| ------------- | ----------------------------------------------------------------------- |
| Run ID        | `fix-scaffold-island-hydration--0.0.7`                                  |
| Branch        | `fix/scaffold-island-hydration`                                         |
| Base          | `6c195acaf3f7e650c4235fc3fbc51232e210e7a4`                              |
| Phase         | `S2 reproduction — served boundary measured; browser execution pending` |
| Target        | `packages/fresh` render/hydration boundary                              |
| Archetype     | `4 - Public DSL / Builder`                                              |
| Scope overlay | `frontend`                                                              |
| PLAN-EVAL     | Supervisor-sequenced after the reproduction localizes product scope     |

## Decision

Route-local `routes/**/(_islands)` files **are registered and built as Fresh islands**. The
registration lead is rejected by code and generated-project measurement. There is no scaffold
registration fix to make.

The supervisor deliberately sequenced the package reproduction before PLAN-EVAL. Its served-HTML leg
now proves that the route-local island reaches the generated-style `definePage()` layer, callable
slot, and hook-owned layout with its Fresh boundary and client boot import intact. The direct-render
control produces the same boundary.

That measurement rules out server marker loss and layer/slot reachability loss. Browser execution is
still required to distinguish successful hydration from a client/provider exception. No product
source is authorized until that browser leg runs, and this plan does not promote the remaining
query/provider branch from a live possibility to a diagnosis.

## Archetype and Doctrine

`packages/fresh` is classified by the doctrine as Archetype 4 with a current **Keep** verdict:
preserve per-concern builders and route contracts. The frontend overlay adds route and browser
proof. The likely seam is internal runtime materialization of an existing builder definition, not a
new public builder method.

Relevant axioms:

| Axiom | Application                                                                       |
| ----- | --------------------------------------------------------------------------------- |
| A1    | No public contract change is planned; any discovered need for one forces re-plan. |
| A6    | Add no hydration helper until the failing render boundary is named.               |
| A8    | Keep a fix beside the query or define-page runtime concern it corrects.           |
| A11   | Name the actual varying boundary before abstracting it.                           |
| A14   | A browser hydration fitness test and hosted receipt carry the completion claim.   |

## Goal

Make the scaffolded service-showcase route hydrate the already-emitted Fresh island boundary in a
browser, without touching PR #1664's files or PR #1773's scaffold-owned paths.

## Locked Product Path Ceiling

The following ceiling is **LOCKED** for implementation after PLAN-EVAL:

### Allowed

- `packages/fresh/src/application/builders/define-page/**` — only if the reproduction proves the
  layer/layout materialization drops island identity or reachability.
- `packages/fresh/src/application/query/**` — only if the marker is emitted and the reproduction
  proves the query provider blocks hydration.
- `packages/fresh/tests/fixtures/route-binding-browser/**` — package-owned end-to-end Fresh fixture.
- Focused tests colocated with an allowed `packages/fresh` subject.
- `.llm/runs/fix-scaffold-island-hydration--0.0.7/**` — run evidence.

### Forbidden without supervisor rescope

- All `packages/cli/**`, especially `src/kernel/assets/app/**`, `src/kernel/assets/manifest.ts`,
  `src/kernel/assets/embedded.generated.ts`, and `packages/cli/e2e/**`; these collide with PR #1773.
- PR #1664's instrumentation and product files, including `service-client-browser-probe.ts`.
- `packages/fresh/deno.json`, root dependency/catalog files, and `deno.lock`.
- Fresh upstream vendoring, patches, or framework-version changes.
- Cache-key, optimistic callback, probe-selector, or generic helper changes already eliminated by
  the brief.

If the package-level fixture passes unchanged, stop and request rescope. Do not cross the CLI
collision boundary to chase the hosted failure.

## Design

### Public surface

- No new or changed export, entry point, builder method, CLI command, or scaffold contract.
- The existing `definePage()` layer/layout behavior and `QueryIsland` surface remain compatible.

### Domain vocabulary

- **registration** — Fresh crawler and snapshots include the module.
- **server marker** — rendered HTML contains the Fresh island comment boundary or element for the
  module.
- **hydration** — the browser activates that island and its initial interactive render.
- **authoritative receipt** — PR #1664's hosted browser-probe result.

### Ports and seams

- Fresh Vite discovery is an observed upstream seam, not a seam to modify.
- The package browser fixture is the local consumer seam.
- The hosted `scaffold.runtime` run is the authoritative generated-consumer seam.

### Constants

- Island module: `ServiceShowcaseLab`.
- Authoritative gate: `behavior.service-client-refetch`.
- Required receipt fields: `islandHydrated: true` and non-null `freshIslandElement`.

### Ordered slices

| #  | Slice                           | What it proves                                                                                                                      | Gate                                            | Files                                                                             |
| -- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------- |
| S1 | Research and plan               | Route-local registration/build is measured; ownership and ceiling are bounded.                                                      | Static evidence and base gate table             | Run artifacts only                                                                |
| S2 | Package browser reproduction    | Same route-local island survives `definePage()` layer/layout server rendering and hydrates, or reproduces the failure before a fix. | Focused Fresh browser fixture                   | `packages/fresh/tests/fixtures/route-binding-browser/**` and focused package test |
| S3 | Minimal package correction      | The first proven failing `packages/fresh` boundary is corrected without public-surface change.                                      | Focused test, static gates, browser fixture     | One allowed package concern only                                                  |
| S4 | Hosted generated-consumer proof | Real scaffold emits and hydrates the island.                                                                                        | Supervisor-dispatched hosted `scaffold.runtime` | No PR #1664 edits                                                                 |

S2 was authorized ahead of PLAN-EVAL by supervisor directive. Its server leg is complete; its
browser leg must run in a host with the managed Playwright runtime before S3 can be selected.

### Contributor path

Run the focused package browser fixture first. The served assertions already control out
registration and `definePage` slot/layout loss; follow only an observed client exception into the
query provider. Never use the scaffold asset tree as the reproduction harness for this defect.

## Locked Decisions

| ID | Decision                                                                                   | Rationale                                                                                              |
| -- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| D1 | Reject route-local non-registration as the cause.                                          | Locked Fresh core/plugin code and generated-project output include the showcase island.                |
| D2 | Do not modify CLI/scaffold paths.                                                          | Registration works; those paths are also owned by PR #1773.                                            |
| D3 | Require completion of the package browser reproduction before selecting a function to fix. | The server half killed two branches; the client half must prove or kill the remaining provider branch. |
| D4 | Keep the public JSR surface unchanged.                                                     | The defect is runtime behavior of existing APIs.                                                       |
| D5 | Treat hosted browser evidence as authoritative completion proof.                           | A registration unit test cannot prove browser hydration.                                               |

## Open-Decision Sweep

| Decision                                             | Status                     | Notes                                                                                             |
| ---------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------- |
| Exact `packages/fresh` function that fails hydration | Must resolve now           | Served marker/tree are intact; browser error evidence is still absent.                            |
| Define-page runtime versus query-provider ownership  | Partially resolved         | `define-page` marker/reachability branches are killed; query-provider ownership remains unproven. |
| Whether to change public API                         | Safe to defer only as `no` | Any evidence requiring `yes` forces rescope and new PLAN-EVAL.                                    |
| Hosted dispatch timing                               | Safe to defer              | Supervisor owns runtime lease and dispatch.                                                       |

## Anti-Patterns to Avoid

| AP    | Status | Plan                                                                                                             |
| ----- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| AP-1  | Risk   | Do not add behavior to a builder barrel; patch one proven runtime concern.                                       |
| AP-9  | Risk   | Do not add typestate/generics for a runtime hydration defect.                                                    |
| AP-18 | Risk   | Assert semantic marker/hydration behavior, not a giant generated snapshot.                                       |
| AP-25 | Risk   | Review query-client server lifetime if that concern becomes the proven owner; do not add load-time side effects. |

## Gate Baselines at Base

Measured on `6c195aca` under the S1 static/read-only command ceiling:

| Gate                           | Base command/evidence                                                                  | Base result                                                              | Post-change contract                            |
| ------------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------- |
| Relevant module graph          | `deno test --no-run --allow-all` for `manifest.test.ts` and `vite.test.ts`             | PASS, 2 modules checked, exit 0                                          | PASS                                            |
| Focused lint                   | `deno lint` over route manifest, NetScript Vite, query island, and define-page runtime | PASS, 7 files, exit 0                                                    | PASS                                            |
| Focused format                 | `deno fmt --check` over the same scope                                                 | PASS, 7 files, exit 0                                                    | PASS                                            |
| Full Fresh export doc lint     | `deno doc --lint` over all 16 `packages/fresh/deno.json` exports                       | **FAIL, exactly 45 diagnostics**, exit 1                                 | At most 45; no new diagnostic in a touched file |
| Route-local island build input | Locked Fresh hook over retained generated service app                                  | PASS; `fresh-island::ServiceShowcaseLab` and exact module import present | PASS                                            |
| Lock hygiene                   | SHA-256 of worktree and `HEAD:deno.lock`                                               | Both `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c`  | Byte-identical                                  |

Carried-in hosted baseline (not a base-commit local gate): PR #1664 head `377811da8`, run
`33410348563`, reported 71 passed / 1 failed; sole failure `behavior.service-client-refetch` with
`islandHydrated: false` and `freshIslandElement: null`.

## Validation Plan

| Order | Gate                             | Expected evidence                                                                                                                |
| ----- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Focused served-HTML reproduction | Measured: direct and hook-layout routes both emit `frsh:island:ServiceShowcaseLab`, the client boot import, and the initial row. |
| 2     | Focused package test             | After fix: route-local island produces a server marker and client hydration.                                                     |
| 3     | Static/package quality           | Check, lint, format, quality and doctrine gates pass; doc-lint does not exceed 45.                                               |
| 4     | Package browser fixture          | Non-null Fresh island marker plus interactive client behavior.                                                                   |
| 5     | Hosted `scaffold.runtime`        | `behavior.service-client-refetch` passes; receipt has `islandHydrated: true` and non-null `freshIslandElement`.                  |

The focused browser command, on a host with the CI-managed Playwright runtime, is:

```text
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts --pretty -- --allow-all --filter "definePage hook layout preserves" packages/fresh/tests/form-navigation_browser.ts
```

The hosted browser receipt is authoritative. A unit test or served-HTML assertion that proves
registration/marker emission without proving hydration is necessary but **not sufficient**.

## Risk Register

| Risk                                                     | Mitigation                                                       |
| -------------------------------------------------------- | ---------------------------------------------------------------- |
| Registration output is mistaken for render proof.        | Separate registration, server marker, and hydration assertions.  |
| Another unmeasured diagnosis drives a speculative fix.   | S2 must reproduce and name the first failing boundary before S3. |
| CLI collision with PR #1773.                             | Locked forbidden paths and immediate stop/rescope trigger.       |
| PR #1664 is edited to make the probe pass.               | Treat its committed probe as immutable external evidence.        |
| Pre-existing doc-lint red is hidden by a green claim.    | Preserve exact `<= 45` non-increase contract.                    |
| Local package green does not survive generated consumer. | Require hosted browser receipt before completion.                |

## Dependencies and Deferred Scope

- PLAN-EVAL disposition and the managed-browser dispatch belong to the supervisor.
- PR #1664 stays active and delivers after this fix lands.
- PR #1773 sequencing is irrelevant unless later evidence requires a forbidden CLI path; in that
  event, stop rather than edit.
- Query cache semantics, optimistic behavior, selector correctness, general scaffold refactors,
  dependency upgrades, and doc-lint debt cleanup are deferred.
