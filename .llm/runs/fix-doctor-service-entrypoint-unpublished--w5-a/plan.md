# Plan: W5-A plugin doctor service entrypoint release window

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-doctor-service-entrypoint-unpublished--w5-a` |
| Branch | `fix/doctor-service-entrypoint-unpublished` |
| Phase | `plan` |
| Target | `packages/cli` plugin doctor |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Archetype and Doctrine

The doctor is a user-run CLI flow, so Archetype 6 is the smallest fitting profile. The current
doctrine verdict is **Keep**: preserve the kernel/surface split. This leaf fix stays inside the
existing vertical `public/features/plugins/doctor` feature and its JSR adapter.

## Goal

Treat only an exact-version JSR metadata 404 as a named, visible service-entrypoint exclusion while
keeping published-version validation and every non-404 failure hard.

## Scope

- Add a structural exact-HTTP-status failure contract to the JSR export-map adapter.
- Convert exact 404 to a warning exclusion under the existing critical check identity.
- Add red-before/green-after tests for 404, published genuine failure, and 503.
- Prove the focused tests and requested gates, including `scaffold.plugins`.

## Non-Scope

- No changes to #1597's `behavior.package-backed-plugin-doctor` E2E path.
- No disabling, deletion, or non-critical reclassification of the check.
- No release branch, cut, publication, tag, or merge operations.
- No public CLI command vocabulary or package export changes.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Preserve `SERVICE_ENTRYPOINT_RESOLVES_CHECK`; represent exclusion as a named warning with an explicit reason. | Warnings render and do not fail while the check remains visible and active. |
| D2 | Use structured HTTP status data, never parse error text. | Only a confirmed exact 404 may degrade; network/503 failures remain hard. |
| D3 | Keep export-map absence at a published version as an error. | Proves the check still runs fully in the normal case. |
| D4 | Test through `doctorPlugin` and the command exit contract. | Prevents a helper-only false green. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Error representation | resolved now | Internal typed error/result with exact numeric status. |
| Warning wording | resolved now | Names the check, exact package version, and exclusion reason. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Catching a generic/network failure as unpublished | Predicate requires structured status exactly `404`. |
| Silently disabling the published check | Published fixture returns an export map without `./services` and must still exit 1. |
| Regressing #1597 | Do not edit its gate/predicate files; run `scaffold.plugins`. |
| Lock churn | Explicit lock diff assertion before staging. |

## Anti-Patterns to Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-10 | risk | Catch only to translate a confirmed registry condition; preserve all other failures. |
| AP-18 | risk | Assert semantic status, message, export loader invocation, and command exit. |
| AP-25 | existing boundary | Keep `fetch` in the existing public JSR adapter. |

## Fitness and Validation Gates

| Order | Gate | Command / evidence |
| --- | --- | --- |
| 1 | Discriminating tests | Focused doctor invariant tests, pre-fix red then post-fix green |
| 2 | Static check | scoped check wrapper for `packages/cli` |
| 3 | Test | `rtk proxy deno task test` |
| 4 | Lint | `rtk proxy deno task lint` |
| 5 | Format | `rtk proxy deno task fmt:check` |
| 6 | Quality/doctrine | `rtk proxy deno task quality:gate` |
| 7 | Consumer E2E | `deno task e2e:cli run scaffold.plugins --format pretty` |

## Arch-Debt Implications

- No new or deepened doctrine debt expected. Existing unrelated CLI debt remains untouched.

## Deferred Scope

- Any generalized registry availability abstraction beyond the existing export-map adapter.

