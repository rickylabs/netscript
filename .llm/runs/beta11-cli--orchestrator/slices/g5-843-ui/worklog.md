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

## Decisions

| Decision                          | Reason                                            | Source                                |
| --------------------------------- | ------------------------------------------------- | ------------------------------------- |
| Archetype 4 + frontend overlay    | Package publishes declarative registry vocabulary | Doctrine verdict and archetype matrix |
| Explicit desktop subpath          | Prevent root/env surface inflation                | Plan D1, AP-4                         |
| No speculative port               | Only one adapter exists                           | Plan D5, AP-2                         |
| No fake minimize/maximize         | Upstream does not document those calls            | Deno windows docs; Plan D7            |
| Real consumer is scaffold gallery | Required horizontal L2 proof                      | Fresh UI horizontal authority chain   |

## Drift

| Drift                                                                                | Severity    | Logged in drift.md |
| ------------------------------------------------------------------------------------ | ----------- | ------------------ |
| Integration base initially lacked merged #842                                        | significant | yes                |
| Current `./interactive` JSR diagnostics exceed the audit skill's generic expectation | significant | yes                |
| Root `arch:check` is blocked by an unchanged integration-base SDK range divergence   | significant | yes                |

## Gate Results

### Static Gates

| Gate                        | Command or check                                       | Result | Notes                                                               |
| --------------------------- | ------------------------------------------------------ | ------ | ------------------------------------------------------------------- |
| Scoped check/lint/fmt       | repo wrappers over `packages/fresh-ui`                 | PASS   | 137 TS/TSX files; zero findings.                                    |
| New export doc lint         | `deno doc --lint packages/fresh-ui/desktop.ts`         | PASS   | Zero documentation or private-type findings.                        |
| Raw package publish dry-run | `deno publish --dry-run --allow-dirty`                 | PASS   | New `desktop.ts` and `src/desktop/**` included; no slow-type error. |
| Forbidden constructs        | focused `rg` for `any` and text/JSON import attributes | PASS   | Zero matches in slice-1 files.                                      |

### Fitness Gates

| Gate                 | Result        | Evidence                            | Notes                                                                                                                                                      |
| -------------------- | ------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-4 public surface   | PASS          | doc lint, scoped check, raw dry-run | Explicit public return types and complete referenced types.                                                                                                |
| F-7 runtime boundary | PASS          | six desktop tests                   | Browser/partial globals return inert disabled lifecycles.                                                                                                  |
| `quality:scan`       | PASS          | root task                           | No findings; current scanner covers CLI/plugins.                                                                                                           |
| `arch:check`         | FAIL_BASELINE | root task                           | Existing `@netscript/sdk` range divergence between CLI and Fresh; branch diff for both configs is empty. Focused Fresh UI doctrine scan has zero failures. |

### Runtime Gates

| Gate                        | Result  | Evidence                               | Notes                                                        |
| --------------------------- | ------- | -------------------------------------- | ------------------------------------------------------------ |
| Browser/Aspire no-op        | PASS    | `tests/desktop/desktop-chrome.test.ts` | Explicit null and auto-detected non-desktop paths are inert. |
| Native desktop smoke (#457) | NOT_RUN | issue #843                             | Explicitly outside this PR's claim.                          |

### Consumer Gates

| Consumer                | Result  | Evidence                                                              | Notes                                                                                           |
| ----------------------- | ------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Full Fresh UI tests     | PASS    | `deno test -A --lock=deno.lock --unstable-kv packages/fresh-ui/tests` | 144 passed, 0 failed; `.llm/tmp` scratch directory required by existing Markdown build fixture. |
| Scaffold design gallery | NOT_RUN | —                                                                     | Planned for slice 3.                                                                            |

## Handoff Notes

- Tier-A slice-1 review should inspect structural compatibility, menu translation/dispatch,
  idempotent cleanup, optional native-operation results, and the bounded root `arch:check` failure.
- Do not dispatch evaluation/review from this G5 session; the Fable supervisor owns that action.
