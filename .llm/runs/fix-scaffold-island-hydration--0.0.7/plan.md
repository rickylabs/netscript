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

---

## Rescope v2 (2026-09-02, after IMPL-EVAL `FAIL_RESCOPE` at `dd039a791`)

**Trigger.** The v1 stop clause fired: the package-level fixture hydrates in hosted CI (runs
`33539774285`, `33541399005`, `33542591593`). The only red receipt is PR #1664's hosted probe at
`377811da8` (`islandHydrated: false`, `freshIslandElement: null`), which predates every relevant
main commit. The premise of #1845 is therefore **undetermined**, not confirmed. v2 makes the
discriminator the first slice and conditions every product edit on its output.

**Ownership change.** #1773 (dynamic scaffold route gate) is MERGED; the CLI collision that locked
the v1 ceiling no longer exists. PR #1664 remains Features-owned and is still forbidden.

### v2 slices

| Slice | Purpose | Gate | Ceiling |
| ----- | ------- | ---- | ------- |
| S0a | **Served-surface discriminator.** New `scaffold.runtime` gate `behavior.island-served-surface`: on the real generated app, fetch the island page and assert (1) the Fresh island marker for the scaffold's data island is present, (2) every island `<script type="module">` / preload `src` resolves `200` with a JS content type, (3) the resolved bundle text contains the island export name. Emits a JSON receipt (`markers`, `scripts[]`, `bundleHit`). | `deno task e2e:cli gates scaffold.runtime` (hosted sqlite tier) | `packages/cli/e2e/src/application/gates/scaffold/**`, `packages/cli/e2e/tests/**`, suite registration only |
| S0b | **Browser discriminator.** Hosted managed-browser leg on the same generated app: navigate, wait for the island element, read `islandHydrated` via the same DOM contract #1664's probe reads (`data-*` marker + post-interaction row change), emit `{ islandHydrated, freshIslandElement }`. Reuses the `ci.yml:255` `@playwright/cli@0.1.17` install step, added to the e2e-cli sqlite tier. | e2e-cli sqlite tier, gate `behavior.island-hydration` | `.github/workflows/e2e-cli.yml` (install step only) + the S0a paths |
| S1v2 | **Disposition.** Record the S0 receipts in `worklog.md` and `drift.md`. Branch: **(A)** S0a+S0b green → the #1664 receipt was stale; #1845 premise refuted; S3 is *cancelled*; the PR ships S0a/S0b as regression guards and closes #1845 with the receipts as acceptance evidence. **(B)** any S0 leg red → the red leg names the first failing boundary (marker missing → `define-page` materialization; marker present but script 404 → scaffold asset/manifest emission in `packages/cli/src/kernel/assets/app/**`; script 200 but not hydrated → `packages/fresh/src/application/query/**`). Only that one boundary is opened. | run artifacts | none |
| S3v2 | **Minimal correction** (branch B only), in exactly the boundary S1v2 named; focused test colocated; no public-surface change (any `yes` → new PLAN-EVAL). | focused test + `surface-diff` + S0a/S0b re-run green | one boundary |
| S4v2 | **Completion receipt.** Hosted `scaffold.runtime` run at the final head with `behavior.island-hydration` → `islandHydrated: true`, non-null `freshIslandElement`. This replaces the v1 D5 dependency on PR #1664's probe. | e2e-cli at head | none |

### v2 forbidden

- PR #1664 files (`service-client-browser-probe.ts` and product files) — Features-owned.
- `deno.lock`, catalogs, Fresh vendoring/patches, cache-key/optimistic/selector changes (unchanged from v1).
- Any `packages/fresh/src/**` or `packages/cli/src/**` edit before S1v2 names the boundary.

### v2 DoD

- [ ] S0a gate present and green on hosted sqlite tier at head.
- [ ] S0b gate present and green (or red with a named boundary, then S3v2 green) at head.
- [ ] S1v2 disposition recorded (A or B) with run ids.
- [ ] S4v2 receipt `islandHydrated: true` at the final head.
- [ ] `desktop-native-linux` disposition recorded (out of scope: #1926, cleared by `main ≥ 09c07fd4e`).

### v2.1 amendments (PLAN-EVAL `PASS_PLAN` at `38060e707`, 2026-09-02, six non-blocking findings — all adopted)

- **Supersession (F6).** The v1 "Locked Product Path Ceiling", slice table, and D2 are **superseded** by
  § Rescope v2 for `packages/cli/e2e/**` gate files only; the v1 forbidden list otherwise stands.
- **S0a suite id (F5).** Register S0a/S0b through the shared `RUNTIME_GATES` list so both tiers carry
  them; the discriminator venue is `scaffold.runtime.sqlite` (`deno task e2e:cli gates scaffold.runtime.sqlite`),
  with postgres presence as the free parity check.
- **S0b mutation-path receipt (F2).** The interaction is the **Rename** click with a rename-specific row
  assertion (mirrors #1664's failing `service-client-browser-probe.ts:307`); hydration-only re-render does
  not satisfy S0b.
- **S0b fail-closed (F4).** S0b must fail closed when no browser is available — never skip-to-pass. The
  hosted sqlite tier already runs headless Chromium (`behavior.app-reference`); the `@playwright/cli`
  install step is dropped from the ceiling unless S0b proves it is needed (then justify the pin in drift).
- **Branch (B) flake rule (F3).** Branch (B) fires only on a red **inside the S0 gate's own verdict**.
  Suite-tier infra reds (`runtime.wait.*`, Aspire startup exit 18) are rerun before any disposition.
- **Branch (A) refutation scope (F1).** A green S0 refutes the premise for **current main's** island
  sources, not for #1664's modified island. The close comment says so and names the acceptance transfer:
  #1664's committed probe on a rebased head is the final 72/72 check; #1845 reopens if it reds there.
