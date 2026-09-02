# Worklog: scaffolded showcase island hydration

## Run Metadata

| Field         | Value                                                      |
| ------------- | ---------------------------------------------------------- |
| Run ID        | `fix-scaffold-island-hydration--0.0.7`                     |
| Branch        | `fix/scaffold-island-hydration`                            |
| Base          | `6c195acaf3f7e650c4235fc3fbc51232e210e7a4`                 |
| Archetype     | `4 - Public DSL / Builder`                                 |
| Scope overlay | `frontend`                                                 |
| Phase         | S2 package reproduction — hydration proven, incidental 404 attributed |

## Design

### Public Surface

- No public export, entry point, signature, CLI command, scaffold contract, or dependency change.

### Domain Vocabulary

- `registration` — Fresh discovers and includes the island module.
- `server marker` — rendered HTML carries the Fresh island comment boundary or element.
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

| #  | Slice                                              | Gate                                        | Files                                            |
| -- | -------------------------------------------------- | ------------------------------------------- | ------------------------------------------------ |
| S1 | Prove registration/build and lock the next ceiling | Static source/generated-project measurement | `plan.md`, `research.md`, `worklog.md`           |
| S2 | Reproduce marker/hydration at package level        | Fresh browser fixture                       | Server leg measured; managed-browser leg pending |
| S3 | Fix first proven package boundary                  | Focused static/browser gates                | Deferred pending S2                              |
| S4 | Prove generated consumer                           | Hosted `scaffold.runtime`                   | Supervisor dispatched                            |

### Deferred Scope

- Product implementation — unauthorized until browser localization completes.
- CLI scaffold assets/E2E — registration is not missing and PR #1773 owns those paths.
- PR #1664 files — immutable source of hosted proof.
- Cache/mutation/helper hypotheses — already eliminated by the brief.

### Contributor Path

Read `research.md` first, reproduce in the existing package browser fixture, then follow the first
failing marker/hydration assertion into one allowed `packages/fresh` concern. Do not begin from the
CLI scaffold templates.

## Progress Log

| Time (UTC) | Slice | Step                          | Notes                                                                                                                                                                                        |
| ---------- | ----- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-31 | S1    | Bootstrap                     | Read harness, Fresh, doctrine, CLI, PR, tooling, RTK and JSR authorities. RTK was unavailable on PATH; focused raw commands were used.                                                       |
| 2026-08-31 | S1    | Re-baseline                   | Confirmed branch base and HEAD are `6c195aca`; worktree began clean.                                                                                                                         |
| 2026-08-31 | S1    | Fresh source measurement      | Inspected locked core 2.3.3 and plugin-vite 1.1.2 discovery/client/server snapshot code.                                                                                                     |
| 2026-08-31 | S1    | Generated-project measurement | Exact Fresh client snapshot hook emitted the showcase Rollup entry and module import from a retained generated service app.                                                                  |
| 2026-08-31 | S1    | Ownership                     | Rejected scaffold registration gap; narrowed next proof to package render/hydration boundary without selecting a faulty function.                                                            |
| 2026-08-31 | S1    | Baselines                     | Relevant type-load, lint and format pass; full Fresh export doc lint is pre-existing red at exactly 45; lock hash matches HEAD.                                                              |
| 2026-09-01 | S2    | Supervisor sequencing         | Reproduction explicitly authorized before PLAN-EVAL; no product source authorized.                                                                                                           |
| 2026-09-01 | S2    | Fixture                       | Added direct control and generated-style route-local island -> lab layer -> callable slot -> `useSlots()` layout case, including the real query hydration/provider sequence.                 |
| 2026-09-01 | S2    | Served measurement            | Both routes returned the Fresh island comment, client boot import, initial row, and server-hydrated cache; generated-style route also returned its layout and layer markers.                 |
| 2026-09-01 | S2    | Browser attempt               | Focused test could not spawn absent `playwright-cli`; cached Chromium could not load absent `libnspr4.so`. No page navigation occurred, so this is environment-only and not defect evidence. |
| 2026-09-01 | S2    | Localization                  | Ruled out served-marker loss and layer/slot reachability/identity loss. Client/provider branch remains unmeasured; no product edit made.                                                     |
| 2026-09-01 | S2    | Hosted receipt                | Staged the browser from `about:blank` and added request/load/failure, module/outer/inner render, singleton/provider/query-hook, hydration-effect, click, and runtime-error observations.     |
| 2026-09-01 | S2    | Generated scaffold            | Created a no-Aspire local-source SQLite scaffold under `.llm/tmp`, initialized/seeded it, and ran only its service and Fresh Vite processes.                                              |
| 2026-09-01 | S2    | HTML discriminator            | `GET /examples/users` returned 200 with `Typed query lab`, `Seed User`, `frsh:island:ServiceShowcaseLab`, and its client boot mapping. The client-side branch is selected.                  |
| 2026-09-01 | S2    | Draft PR                      | Opened draft PR #1885 at `7154c2a91` with the required labels, milestone, closing keyword, plain measurement outcome, and unticked acceptance/DoD boxes.                                  |
| 2026-09-01 | S2    | Hosted browser scheduling     | Draft PR policy skipped `classify`/`check-test`, so `fresh-browser` did not execute. The in-app browser control runtime is not exposed in this session. No client-path observation exists yet. |
| 2026-09-01 | S2    | Hosted browser observation    | Run `33539774285` loaded both Fresh client entries with 200 responses, resolved the provider/query client and query hook, ran the hydration effect, and changed the row after click. The package fixture hydrates. |
| 2026-09-01 | S2    | Assertion correction          | Removed the post-hydration comment-node requirement, split query-client data into pre-click and post-click observations, and added an all-response ledger for the unattributed 404 URL/status/resource type. |
| 2026-09-01 | S2    | Response-ledger observation   | Run `33541399005` repeated successful hydration; all corrected expectations passed, and only the console-only 404 remained. No response >= 400 was observed, so console location plus all requests/failures are now captured. |
| 2026-09-01 | S2    | 404 attribution               | Run `33542591593` identified `/favicon.ico`; hydration remained successful and no network response/request failure was observed. The fixture now serves 204 for this incidental browser request while retaining strict application-error assertions. |
| 2026-09-02 | S0a   | RED contract                  | Added the served-surface receipt schema and focused test first; `deno test` exited 1 because `probe-island-served-surface.ts` did not yet exist (`TS2307`). |
| 2026-09-02 | S0a   | GREEN implementation          | Added `behavior.island-served-surface`, shared runtime-suite registration, live URL resolution, Fresh marker/module extraction, JS status/content-type/export assertions, and durable receipt persistence. Focused gate/builder/registry tests pass 51/51. |
| 2026-09-02 | Merge | Restore PR mergeability       | Merged `origin/main` at `8c549c061` as directed. Resolved the sole Fresh browser conflict on main's shared locked-Vite helpers while retaining the branch's full route-local query-island browser test. Structured Fresh test-tree check and format gates both pass. |
| 2026-09-03 | S0b   | RED contract                  | Added the hydration receipt and Rename-transition tests first; `deno test` exited 1 because `probe-island-hydration.ts` did not yet exist (`TS2307`). |
| 2026-09-03 | S0b   | GREEN implementation          | Added fail-closed headless-Chromium/CDP navigation, `ul[data-state]` island-surface discovery, exact first-row Rename assertion (`name` → `name*`), two-field receipt persistence, shared runtime-suite registration, and command wiring. Focused gate/builder/registry tests pass 53/53. |
| 2026-09-03 | Gates | Full-tree lint baseline       | Exact S0 brief lint command reached zero findings but exited 2 before linting seven pre-existing `fixtures/desktop-native/**` files: their non-workspace config was ignored and Deno reported `Package 'zod' not found in catalog`. Coordinator steer requires focused touched-file gates for the recovery commit. |

## Decisions

| Decision                                 | Reason                                                                                          | Source                          |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------- |
| Route-local registration lead is false   | Core crawl, client/server snapshot code, and generated app output all include the island.       | `research.md` measurement chain |
| No CLI edits                             | No registration gap exists; PR #1773 collision is explicit.                                     | Leaf brief and measurement      |
| Reproduction precedes PLAN-EVAL          | Supervisor explicitly reordered the gates because product scope is conditional on reproduction. | 2026-09-01 supervisor directive |
| No product edit after server measurement | The remaining query/provider branch has not been observed in a browser.                         | S2 evidence                     |
| Hosted proof remains authoritative       | Only the real browser gate proves generated-project hydration.                                  | Leaf brief                      |

## Drift

| Drift                                                                                                                        | Severity                     | Handling                                                                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| The lead predicted route-local islands might be unregistered; measurement shows they are registered and built.               | Significant                  | Recorded in research and used to change the product ceiling away from CLI.                                                           |
| Doctrine handoff says Fresh doc-lint debt is resolved; the full export-map command at this base reports 45 diagnostics.      | Significant baseline drift   | Recorded as exact non-increase contract; cleanup remains out of scope.                                                               |
| Raw Fresh 2 HTML uses `frsh:island` comment boundaries, while the initial fixture assertion expected a `<fresh-island>` tag. | Minor measurement correction | Replaced the detector with the exact served comment marker and retained the hosted receipt's separate `freshIslandElement` contract. |

## Gate Results

### Static and measurement gates

| Gate                        | Command/check                                                                        | Result          | Notes                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------ | --------------- | ---------------------------------------------------------------------------------------- |
| Base identity               | `git rev-parse HEAD`; `git merge-base HEAD origin/main`                              | PASS            | Both `6c195acaf3f7e650c4235fc3fbc51232e210e7a4`.                                         |
| Relevant module graph       | `deno test --no-run --allow-all` for Fresh route manifest and Vite tests             | PASS            | 2 modules checked; tests not executed.                                                   |
| Focused lint                | `deno lint` focused Fresh paths                                                      | PASS            | 7 files.                                                                                 |
| Focused format              | `deno fmt --check` focused Fresh paths                                               | PASS            | 7 files.                                                                                 |
| Full export doc lint        | `deno doc --lint` over 16 Fresh exports                                              | FAIL (baseline) | Exactly 45 diagnostics; post-change cap is `<= 45`, with no new touched-file diagnostic. |
| Fresh registration/build    | Read locked crawler/snapshot code and invoke client snapshot hook over generated app | PASS            | Showcase has production Rollup entry and virtual snapshot import.                        |
| S2 focused check            | `deno check --unstable-kv` over fixture entry and browser test                       | PASS            | No product source or dependency change.                                                  |
| S2 focused lint             | Structured lint wrapper over fixture and browser test                                | PASS            | Zero findings.                                                                           |
| S2 focused format           | Structured format wrapper over fixture and browser test                              | PASS            | Zero findings before final artifact update.                                              |
| Code quality / doctrine     | `deno task quality:gate`                                                             | PASS            | Quality scan has zero findings; doctrine gate has no failures.                           |
| S2 browser correction check | Structured check wrapper over `form-navigation_browser.ts`                          | PASS (exit 0)   | One file selected; zero diagnostics.                                                      |
| S2 browser correction lint  | Structured lint wrapper over `form-navigation_browser.ts`                           | PASS (exit 0)   | One file selected; zero findings.                                                         |
| S2 browser correction fmt   | Structured format wrapper over `form-navigation_browser.ts`                         | PASS (exit 0)   | One file selected; zero findings.                                                         |
| S2 browser compile          | Structured test wrapper with `--no-run` over `form-navigation_browser.ts`            | PASS (exit 0)   | Browser module compiled; host still has no runnable Chromium.                             |
| S2 browser quality          | `deno task quality:gate`                                                            | PASS (exit 0)   | Quality scan and doctrine fitness both completed without failures.                        |
| S2 served direct control    | Package Vite + raw fetch `/examples/service-direct`                                  | PASS            | Island marker, client boot import, initial row, and query hydration all present.         |
| S2 served hook-layout route | Package Vite + raw fetch `/examples/service`                                         | PASS            | Layout, layer, row, island marker, client boot import, and query hydration all present.  |
| Generated-app discriminator | Generated service + Fresh Vite; fetch `/examples/users`                              | PASS (exit 0)   | HTTP 200; lab, seeded row, exact showcase island comment, and client boot mapping present. |
| `deno.lock`                 | SHA-256 worktree versus `HEAD:deno.lock`                                             | PASS            | After integrating `origin/main`, both are `01ff3a232713a35e9bd5c9f34db7669568fadd16273cb9c82389832b10b55cbe`. |

### Runtime gates

| Gate                      | Result                    | Evidence                                       | Notes                                                                                                 |
| ------------------------- | ------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Local managed browser     | BLOCKED BEFORE NAVIGATION | Focused wrapper exit 1                         | `playwright-cli` absent; cached Chromium also lacks system libraries. This is not an application red. |
| Draft PR managed browser  | NOT SCHEDULED             | PR #1885 checks at `7154c2a91`                 | Repository policy skips core CI while draft; the brief forbids marking ready.                         |
| Hosted `scaffold.runtime` | CARRIED-IN FAIL           | Run `33410348563` on PR #1664 head `377811da8` | 71 passed / 1 failed; sole failure is authoritative target gate.                                      |

### Consumer proof contract

| Consumer              | Current                                                      | Required completion evidence                                                                                                 |
| --------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Fresh package fixture | Hydration and interaction proven; one unknown 404 remains to attribute | Hosted rerun names every response with status >= 400; incidental resources may then be classified without inference. |
| Generated scaffold    | `islandHydrated: false`, `freshIslandElement: null`          | Hosted receipt regenerates with `islandHydrated: true` and non-null `freshIslandElement`.                                    |

Registration-only unit coverage is necessary but not sufficient.

## Handoff Notes

- The generated-app HTML discriminator selected the client-side branch; served marker loss,
  module-identity loss, and falsy loader/layer materialization are ruled out for the real scaffold.
- Open the mandated draft PR with the measurement recorded, then use its managed-browser CI to read
  the already-landed request/load/provider/query instrumentation.
- Do not select a product edit until that browser observation names the first failing client
  boundary. Do not self-certify or mark the draft ready.
