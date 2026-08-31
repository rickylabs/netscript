# Worklog: scaffolded showcase island hydration

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-scaffold-island-hydration--0.0.7` |
| Branch | `fix/scaffold-island-hydration` |
| Base | `6c195acaf3f7e650c4235fc3fbc51232e210e7a4` |
| Archetype | `4 - Public DSL / Builder` |
| Scope overlay | `frontend` |
| Phase | S1 research / measurement |

## Design

### Public Surface

- No public export, entry point, signature, CLI command, scaffold contract, or dependency change.

### Domain Vocabulary

- `registration` — Fresh discovers and includes the island module.
- `server marker` — rendered HTML carries the Fresh island element.
- `hydration` — browser runtime activates the island.
- `authoritative receipt` — hosted `service-client-browser-probe.ts` output on PR #1664.

### Ports

- Locked Fresh crawler/snapshot source — registration measurement.
- Package browser fixture — future local render/hydration proof.
- Hosted browser gate — final generated-consumer proof, supervisor dispatched.

### Constants

- Run ID: `fix-scaffold-island-hydration--0.0.7`.
- Island: `ServiceShowcaseLab`.
- Hosted gate: `behavior.service-client-refetch`.
- Required fields: `islandHydrated: true`, `freshIslandElement != null`.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| S1 | Prove registration/build and lock the next ceiling | Static source/generated-project measurement | `plan.md`, `research.md`, `worklog.md` |
| S2 | Reproduce marker/hydration at package level | Fresh browser fixture | Deferred pending PLAN-EVAL |
| S3 | Fix first proven package boundary | Focused static/browser gates | Deferred pending S2 |
| S4 | Prove generated consumer | Hosted `scaffold.runtime` | Supervisor dispatched |

### Deferred Scope

- Product/test implementation — S1 is artifact-only.
- CLI scaffold assets/E2E — registration is not missing and PR #1773 owns those paths.
- PR #1664 files — immutable source of hosted proof.
- Cache/mutation/helper hypotheses — already eliminated by the brief.

### Contributor Path

Read `research.md` first, reproduce in the existing package browser fixture, then follow the first
failing marker/hydration assertion into one allowed `packages/fresh` concern. Do not begin from the
CLI scaffold templates.

## Progress Log

| Time (UTC) | Slice | Step | Notes |
| ---------- | ----- | ---- | ----- |
| 2026-08-31 | S1 | Bootstrap | Read harness, Fresh, doctrine, CLI, PR, tooling, RTK and JSR authorities. RTK was unavailable on PATH; focused raw commands were used. |
| 2026-08-31 | S1 | Re-baseline | Confirmed branch base and HEAD are `6c195aca`; worktree began clean. |
| 2026-08-31 | S1 | Fresh source measurement | Inspected locked core 2.3.3 and plugin-vite 1.1.2 discovery/client/server snapshot code. |
| 2026-08-31 | S1 | Generated-project measurement | Exact Fresh client snapshot hook emitted the showcase Rollup entry and module import from a retained generated service app. |
| 2026-08-31 | S1 | Ownership | Rejected scaffold registration gap; narrowed next proof to package render/hydration boundary without selecting a faulty function. |
| 2026-08-31 | S1 | Baselines | Relevant type-load, lint and format pass; full Fresh export doc lint is pre-existing red at exactly 45; lock hash matches HEAD. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Route-local registration lead is false | Core crawl, client/server snapshot code, and generated app output all include the island. | `research.md` measurement chain |
| No CLI edits | No registration gap exists; PR #1773 collision is explicit. | Leaf brief and measurement |
| PLAN-EVAL required before S2 | Exact package owner function remains an open must-resolve decision. | Harness plan gate |
| Hosted proof remains authoritative | Only the real browser gate proves generated-project hydration. | Leaf brief |

## Drift

| Drift | Severity | Handling |
| ----- | -------- | -------- |
| The lead predicted route-local islands might be unregistered; measurement shows they are registered and built. | Significant | Recorded in research and used to change the product ceiling away from CLI. |
| Doctrine handoff says Fresh doc-lint debt is resolved; the full export-map command at this base reports 45 diagnostics. | Significant baseline drift | Recorded as exact non-increase contract; cleanup remains out of scope. |

## Gate Results

### Static and measurement gates

| Gate | Command/check | Result | Notes |
| ---- | ------------- | ------ | ----- |
| Base identity | `git rev-parse HEAD`; `git merge-base HEAD origin/main` | PASS | Both `6c195acaf3f7e650c4235fc3fbc51232e210e7a4`. |
| Relevant module graph | `deno test --no-run --allow-all` for Fresh route manifest and Vite tests | PASS | 2 modules checked; tests not executed. |
| Focused lint | `deno lint` focused Fresh paths | PASS | 7 files. |
| Focused format | `deno fmt --check` focused Fresh paths | PASS | 7 files. |
| Full export doc lint | `deno doc --lint` over 16 Fresh exports | FAIL (baseline) | Exactly 45 diagnostics; post-change cap is `<= 45`, with no new touched-file diagnostic. |
| Fresh registration/build | Read locked crawler/snapshot code and invoke client snapshot hook over generated app | PASS | Showcase has production Rollup entry and virtual snapshot import. |
| `deno.lock` | SHA-256 worktree versus `HEAD:deno.lock` | PASS | Both `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c`. |

### Runtime gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Local browser/runtime | NOT RUN | S1 constraint | No runtime lease; static commands only. |
| Hosted `scaffold.runtime` | CARRIED-IN FAIL | Run `33410348563` on PR #1664 head `377811da8` | 71 passed / 1 failed; sole failure is authoritative target gate. |

### Consumer proof contract

| Consumer | Current | Required completion evidence |
| -------- | ------- | ---------------------------- |
| Fresh package fixture | No equivalent semantic hydration proof measured in S1 | Route-local component yields non-null server island marker and hydrates in browser. |
| Generated scaffold | `islandHydrated: false`, `freshIslandElement: null` | Hosted receipt regenerates with `islandHydrated: true` and non-null `freshIslandElement`. |

Registration-only unit coverage is necessary but not sufficient.

## Handoff Notes

- PLAN-EVAL is a hard stop and must run in a separate supervisor-selected session.
- Review `research.md` sections 2-4 first; they are the evidence that kills the original lead.
- The first future implementation action is a package-level semantic browser reproduction, not a
  product fix.
- If that fixture passes unchanged, stop and ask the supervisor to rescope. Do not edit any
  `packages/cli` path.
- No PR is to be opened from this S1.
