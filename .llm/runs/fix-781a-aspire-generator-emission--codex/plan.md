# Plan — fix #791 Aspire/CLI generator emission

## Run metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-781a-aspire-generator-emission--codex` |
| Branch | `fix/781a-aspire-generator-emission` |
| Base | `origin/feat/beta10-integration` at `7d353be` |
| Primary archetype | 6 — CLI/Tooling |
| Secondary archetype | 2 — Integration (`@netscript/aspire`) |
| Scope overlay | Service |
| Issues | Closes #791; Part of #781 |

## Goal

Correct #791 findings 1–6 and 8 at their owning generator/template/helper layers, add or reverse
regression assertions for every finding, and prove the emitted project with the full
`scaffold.runtime` suite.

## Locked decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Omit `withBrowserLogs()` for `addExecutable()` apps. | Aspire 13.4.6's generic executable promise does not expose that capability. |
| D2 | Remove dependency-age only from `deno task` argv. | The flag is rejected by `deno task` but remains valid and intentional on `deno run`/cache paths. |
| D3 | Add `--unstable-no-legacy-abort` to plugin `deno run` argv. | Plugin API resources include the workers HTTP path and bypass generated service tasks. |
| D4 | Normalize invalid characters to `_` in Vite full-key segments. | Preserves the full alias while producing a valid Vite/esbuild define identifier. |
| D5 | Project the configured primary DB key to both provider aliases. | Existing service diagnostics consume `DB_PROVIDER` first and `DATABASE_PROVIDER` as compatibility alias. |
| D6 | Build SQLite consumer URLs with `pathToFileURL(resolve(appHostDir, 'database', key, filename)).href`. | The URL becomes independent of each resource workdir and stays cross-platform. |
| D7 | Keep DB CLI/tool relative SQLite paths where the executable workdir is already the DB directory. | Those paths are correct on the current base; changing them would broaden scope. |
| D8 | Bound `dotnet tool restore` to 10 seconds. | Keeps the existing best-effort runtime-edge provisioning but cannot consume Aspire's 60-second startup window. |
| D9 | Regenerate `embedded.generated.ts` after every source-template cluster. | Generated assets must remain byte-derived from their owning templates. |
| D10 | Deliberately reverse existing invalid-output assertions. | #791 explicitly requires calling out tests that currently lock the regressions. |

## Open-decision sweep

No implementation-forcing decision remains open. The following are safe to defer:

| Decision | Status | Reason |
| --- | --- | --- |
| Move Garnet restore to a separate preflight resource | safe to defer | The bounded runtime-edge restore meets #791 without redesigning the AppHost graph. |
| Remove the generated Aspire npm island | safe to defer | Existing recorded debt is unrelated to these emission regressions. |
| Change DB CLI/tool SQLite URL policy | safe to defer | Current workdirs make those relative URLs correct. |

## Commit slices

| Slice | What it proves | Primary files | Proving gate |
| --- | --- | --- | --- |
| C1 — executable capability/argv emission (findings 1, 2, 8) | Generic executables no longer receive unsupported browser logging; task argv is valid; plugin HTTP resources opt into corrected request signals. | `generate-register-{apps,tools,plugins}.ts`; three focused test files; run artifacts | Focused Aspire generator tests plus scoped CLI wrappers |
| C2 — consumer environment projection (findings 3, 4, 6) | Hyphenated Vite keys are valid, DB provider aliases reach every DB consumer, and SQLite URLs are workspace-absolute. | Aspire helper + test; compat and register templates/generators; embedded asset; focused tests; run artifacts | Aspire helper tests, generator tests, asset parity, scoped Aspire/CLI wrappers |
| C3 — bounded Garnet restore (finding 5) | Docker-less restore is best-effort but cannot block AppHost startup indefinitely. | `_aspire-compat.ts.template`; embedded asset; pipeline regression; run artifacts | Focused pipeline/infrastructure tests, then all required final gates |

Each slice will be committed separately. The draft PR commit list plus one PR comment per cluster is
the commit trail.

## Gate set

- Focused regression tests for Aspire helpers and CLI generator/template owners.
- Asset parity: `deno task check:assets-barrel` after template changes.
- Scoped wrappers over `packages/cli` and `packages/aspire` for check, lint, and TypeScript format.
- `deno task quality:scan` and `deno task arch:check`.
- JSR surface gates: full-export doc lint and package publish dry-runs for both touched packages.
- Required generated-runtime verdict:
  `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`.

## Risk register

| Risk | Mitigation |
| --- | --- |
| Removing dependency-age from valid `deno run` paths | Change only argv whose subcommand is `task`; negative assertions retain valid run flags. |
| Vite package/helper and embedded compatibility copy drift | Change both owners in one cluster and regenerate/check embedded assets. |
| Absolute SQLite URL differs across Windows and WSL | Use Node's `pathToFileURL`, not manual slash replacement. |
| Provider aliases applied to resources that do not require DB | Emit them only inside existing `RequiresDb` branches. |
| Garnet timeout hides restore failure | Preserve current behavior: restore failures surface when the executable resource starts; only the blocking duration changes. |
| Existing tests report green while asserting regressions | Reverse the identified expectations and add explicit absence assertions. |
| Full E2E mutates `deno.lock` | Inspect lock diff against the true base and do not commit unrelated churn. |

## Deferred / excluded scope

- Finding 7: already fixed before this slice.
- Finding 9: sibling #792.
- Garnet preflight/resource-graph redesign.
- Generated Aspire npm-island lock debt.
- Broader queue, worker runtime, deployment, or database-topology changes.

## Debt implications

No new debt or suppression is planned. Existing debt entries remain open unless a gate proves their
full closing condition; this slice will not over-claim closure.

