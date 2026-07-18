# Worklog: fresh-ui desktop components

## Run Metadata

| Field          | Value                                       |
| -------------- | ------------------------------------------- |
| Run ID         | `beta11-cli--orchestrator/slices/g5-843-ui` |
| Branch         | `feat/desktop-frontend-843-ui`              |
| Archetype      | `4 - Public DSL / Builder`                  |
| Scope overlays | `frontend`                                  |

## Design

### Public Surface

- `@netscript/fresh-ui/desktop`
- `createDesktopChrome(options): DesktopChromeLifecycle`
- L2 `DesktopWindowChrome`, `DesktopUpdatePrompt`, and desktop-gated island registry items

### Domain Vocabulary

- `DesktopMenuItem` — tagged declaration union for action, submenu, separator, and role items.
- `DesktopChromeOptions` — tray/menu declarations, action callback, optional structural capability.
- `DesktopChromeActive` / `DesktopChromeDisabled` — explicit runtime lifecycle states.
- `DesktopWindowAction` — documented `show | hide | focus | close | reload` actions.
- `AutoUpdateReadyEvent` — #841 source of truth for automatic/manual update UI.

### Ports

- None. A narrow injected structural desktop capability is the single-adapter test seam; no
  speculative port is justified.

### Constants

- `DEFAULT_DESKTOP_RPC_BINDING` — imported from #842 for desktop presence detection.
- Stable component `data-part`, `data-state`, and `data-desktop-action` values — UI contract.

### Commit Slices

| # | Slice                                                                                | Gate                                                                                                           | Files                                                                       |
| - | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 1 | Contract-first desktop runtime entrypoint and web/no-op tests                        | focused desktop test dir; scoped check/lint/fmt; `quality:scan`; `arch:check`                                  | `packages/fresh-ui/desktop.ts`, export config, desktop tests                |
| 2 | L2 desktop components/island, CSS, manifest, generated registry, full registry tests | full desktop + registry test dirs; consumer render; JSR rubric; `quality:scan`; `arch:check`                   | Fresh UI registry sources, manifest/generated files, tests                  |
| 3 | Scaffold design-gallery consumer and docs how-to/navigation                          | real browser proof; generated-asset check; scoped gates; full `scaffold.runtime`; `quality:scan`; `arch:check` | CLI app asset templates/generated embed; `docs/site/how-to/` and navigation |

Each slice stops after commit, push, gate-evidence PR comment, and supervisor-requested Tier-A
review.

### Deferred Scope

- Native desktop smoke — #457.
- Minimize/maximize window actions — not exposed by the documented Deno window API.
- Release/publish/merge/issue or milestone closure — outside this run's authority.

### Contributor Path

Add a self-contained TSX/CSS pair under `packages/fresh-ui/registry/components/ui`, declare it in
`registry.manifest.ts` under the desktop collection, regenerate embeds, add full-dir tests, then add
the scaffold gallery example and validate it in a real browser.

## Progress Log

| Time       | Slice    | Step            | Notes                                                                                                                                                                             |
| ---------- | -------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-18 | planning | re-baseline     | Rebased onto current integration SHA `1709dcba`; the later #456 merge does not alter the #843 design surface.                                                                     |
| 2026-07-18 | planning | research/design | Doctrine, harness, L0/theme/README, live issues, public docs, POC, JSR baseline, and consumer paths inspected.                                                                    |
| 2026-07-18 | planning | checkpoint      | Plan & Design prepared; implementation blocked pending group Plan-Gate PASS.                                                                                                      |
| 2026-07-18 | slice 1  | Plan-Gate       | Supervisor reported PASS; D1–D9 approved as locked.                                                                                                                               |
| 2026-07-18 | slice 1  | implementation  | Added the explicit desktop entrypoint, structural capability adapter, lifecycle, menus, dialogs, notifications, and documented window actions.                                    |
| 2026-07-18 | slice 1  | gates           | Focused and full Fresh UI tests, scoped static checks, JSR docs/dry-run, and quality scan passed; root `arch:check` hit an unchanged integration-base dependency-range violation. |
| 2026-07-18 | slice 1  | Tier-A          | PASS. Supervisor classified the SDK range mismatch as an integration-base defect and normalized all three ranges in integration commit `46e50cf2`.                                |
| 2026-07-18 | slice 2  | re-baseline     | Rebased (rather than merged) onto `origin/feat/desktop-frontend` @ `46e50cf2`; reviewed slice-1 SHA rewrote from `542c1e98` to `bde4fe50`. Root `arch:check` then passed.         |
| 2026-07-18 | slice 2  | implementation  | Added L2 window chrome and update prompt components, the hydration-safe desktop-only island, token CSS, desktop manifest collection, generated embeds, and full-dir tests.        |
| 2026-07-18 | slice 2  | gates           | Full Fresh UI and focused registry dirs, scoped static checks, DS fitness, JSR docs/dry-run, `quality:scan`, and root `arch:check` passed.                                        |

## Decisions

| Decision                          | Reason                                            | Source                                |
| --------------------------------- | ------------------------------------------------- | ------------------------------------- |
| Archetype 4 + frontend overlay    | Package publishes declarative registry vocabulary | Doctrine verdict and archetype matrix |
| Explicit desktop subpath          | Prevent root/env surface inflation                | Plan D1, AP-4                         |
| No speculative port               | Only one adapter exists                           | Plan D5, AP-2                         |
| No fake minimize/maximize         | Upstream does not document those calls            | Deno windows docs; Plan D7            |
| Real consumer is scaffold gallery | Required horizontal L2 proof                      | Fresh UI horizontal authority chain   |

## Drift

| Drift                                                                                 | Severity    | Logged in drift.md |
| ------------------------------------------------------------------------------------- | ----------- | ------------------ |
| Integration base initially lacked merged #842                                         | significant | yes                |
| Current `./interactive` JSR diagnostics exceed the audit skill's generic expectation  | significant | yes                |
| Root `arch:check` is blocked by an unchanged integration-base SDK range divergence    | significant | yes                |
| Supervisor fixed the base defect; this branch rebased and the reviewed S1 SHA changed | significant | yes                |

## Gate Results

### Static Gates

| Gate                          | Command or check                                       | Result | Notes                                                               |
| ----------------------------- | ------------------------------------------------------ | ------ | ------------------------------------------------------------------- |
| Scoped check/lint/fmt         | repo wrappers over `packages/fresh-ui`                 | PASS   | 137 TS/TSX files; zero findings.                                    |
| New export doc lint           | `deno doc --lint packages/fresh-ui/desktop.ts`         | PASS   | Zero documentation or private-type findings.                        |
| Raw package publish dry-run   | `deno publish --dry-run --allow-dirty`                 | PASS   | New `desktop.ts` and `src/desktop/**` included; no slow-type error. |
| Forbidden constructs          | focused `rg` for `any` and text/JSON import attributes | PASS   | Zero matches in slice-1 files.                                      |
| Slice-2 scoped check/lint/fmt | repo wrappers over `packages/fresh-ui`                 | PASS   | 142 TS/TSX files; zero findings.                                    |
| Desktop export doc lint       | `deno doc --lint packages/fresh-ui/desktop.ts`         | PASS   | Zero diagnostics after the slice-2 dependency additions.            |
| Package publish dry-run       | `deno publish --dry-run --allow-dirty`                 | PASS   | New registry surface included; no slow-type error.                  |
| Slice-2 forbidden constructs  | focused source scan                                    | PASS   | No `any`, ambient augmentation, or text/JSON import attributes.     |

### Fitness Gates

| Gate                   | Result        | Evidence                            | Notes                                                                                                                                                      |
| ---------------------- | ------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-4 public surface     | PASS          | doc lint, scoped check, raw dry-run | Explicit public return types and complete referenced types.                                                                                                |
| F-7 runtime boundary   | PASS          | six desktop tests                   | Browser/partial globals return inert disabled lifecycles.                                                                                                  |
| `quality:scan`         | PASS          | root task                           | No findings; current scanner covers CLI/plugins.                                                                                                           |
| `arch:check`           | FAIL_BASELINE | root task                           | Existing `@netscript/sdk` range divergence between CLI and Fresh; branch diff for both configs is empty. Focused Fresh UI doctrine scan has zero failures. |
| Resolved root baseline | PASS          | root task after rebase              | Integration commit `46e50cf2` normalized the ranges; no #843 policy exception was needed.                                                                  |
| L2 authority chain     | PASS          | manifest, generated-copy, DS scans  | Self-contained TSX/CSS pairs, token-only styling, and exact generated copies.                                                                              |
| Slice-2 `quality:scan` | PASS          | root task                           | Zero findings.                                                                                                                                             |
| Slice-2 `arch:check`   | PASS          | root task                           | Exit 0 after the integration normalization and slice-2 changes.                                                                                            |

### Runtime Gates

| Gate                        | Result  | Evidence                                       | Notes                                                         |
| --------------------------- | ------- | ---------------------------------------------- | ------------------------------------------------------------- |
| Browser/Aspire no-op        | PASS    | `tests/desktop/desktop-chrome.test.ts`         | Explicit null and auto-detected non-desktop paths are inert.  |
| Desktop-gated island        | PASS    | `tests/registry/islands/desktop-only.test.tsx` | SSR/browser default is empty; optional fallback is supported. |
| Native desktop smoke (#457) | NOT_RUN | issue #843                                     | Explicitly outside this PR's claim.                           |

### Consumer Gates

| Consumer                    | Result  | Evidence                                                              | Notes                                                                                           |
| --------------------------- | ------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Full Fresh UI tests         | PASS    | `deno test -A --lock=deno.lock --unstable-kv packages/fresh-ui/tests` | 144 passed, 0 failed; `.llm/tmp` scratch directory required by existing Markdown build fixture. |
| Slice-2 full Fresh UI tests | PASS    | same full-directory command                                           | 151 passed, 0 failed.                                                                           |
| Full registry test dirs     | PASS    | component UI + island directories                                     | 66 passed, 0 failed; generated content equals source exactly.                                   |
| Scaffold design gallery     | NOT_RUN | —                                                                     | Planned for slice 3.                                                                            |

## Handoff Notes

- Tier-A slice-2 review should inspect the exhaustive `AutoUpdateReadyEvent` rendering, absence of
  fake window semantics, hydration-safe browser no-op, L2 self-containment, and generated-copy
  proof.
- Do not dispatch evaluation/review from this G5 session; the Fable supervisor owns that action.
