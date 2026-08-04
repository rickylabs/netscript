# Locked Plan — W5-V3 plugin remove

## Scope and archetype

- Surface: `packages/cli`, public and local `plugin remove` command composition.
- Archetype: 6 — CLI / Tooling.
- Doctrine verdict: `Restructure`; changes remain in the existing vertical
  `public/features/plugins/remove/` slice and do not widen structural debt.
- Existing debt: close `ISSUE-167-PLUGIN-REMOVE-UNINSTALL` only when its recorded gate is proven.

## Locked decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Introduce an explicit removal plan containing configured name, package specifier, owned paths, and pre-mutation snapshots. | Contract-first; all resolution and validation occurs before state changes. |
| D2 | Resolve package identity from `--pkg` or installed `scaffold.plugin.json`; never send the configured name to JSR as a package. | Matches documented bare-name input while preserving explicit override. |
| D3 | Dispatch the plugin-owned `remove` verb before host cleanup. | A dispatch failure leaves host state untouched. |
| D4 | Wrap host cleanup and regeneration in a filesystem rollback journal. | Any post-mutation failure restores the exact pre-command state. |
| D5 | Remove plugin directory, plugin-specific generated registries, and DB schema-fragment directories; regenerate plugin references and Aspire helpers. | Closes the recorded uninstall debt and makes the lifecycle symmetric. |
| D6 | Keep help syntax unchanged and make all errors removal-specific. | The bare configured name is already the public contract. |
| D7 | Formal PLAN-EVAL is composed per `milestone-run.md` and owner-supplied orchestrator ruling D6. | Avoids duplicate per-PR evaluator dispatch while preserving independent draft→ready/pre-merge evaluation. |

## Open-decision sweep

- Must resolve now: exact installed metadata lookup, rollback scope, generated-wiring regeneration,
  and user-authored file safety. Resolved by D1–D5.
- Safe to defer: general marketplace uninstall hooks for third-party post-install side effects not
  represented by the static scaffold manifest. The command removes only paths it can prove belong
  to the configured plugin.

## Commit slices

| Slice | Proves | Gate | Files |
| --- | --- | --- | --- |
| S0 | Harness plan is current and locked under milestone composition. | composed plan-gate row | run artifacts |
| S1 | Baseline reproduces bare-name half-removal through the public CLI surface. | focused RED test at baseline | remove command test + worklog |
| S2 | Preflight resolves package identity and failures before mutation; post-start failures roll back. | focused unit/command tests | remove feature, composition dependencies, tests |
| S3 | Install→generate→remove returns owned state to pre-install and doctor is clean. | public CLI lifecycle test | CLI lifecycle test, debt row, run evidence |
| S4 | Archetype-6, JSR, full CLI E2E, and independent composed evaluation are green. | selected gate set | run artifacts / PR evidence |

## Gate set

- Focused Deno tests for remove, dispatch, lifecycle, and doctor.
- Scoped check/lint/fmt wrappers for `packages/cli` (`--ext ts,tsx`).
- `deno task quality:gate` and `deno task arch:check`.
- Archetype-6 F-CLI-1…31 manual/structural row where scripts remain pending.
- `deno task doc:lint --root packages/cli --pretty` and CLI JSR audit/publish dry-run.
- `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` at merge readiness.
- No new lint ignores, casts, or `deno.lock` churn.

## Risk register

| Risk | Mitigation |
| --- | --- |
| Dispatch succeeds but host cleanup fails | Snapshot every owned mutation path and restore on catch. |
| Metadata is absent/corrupt | Fail preflight with a removal-specific error before mutation; explicit `--pkg` remains available. |
| User-authored files are deleted | Delete only the configured plugin root and manifest-derived plugin-specific generated/schema roots; test unrelated files survive. |
| Regeneration touches shared wiring | Snapshot config/Aspire/generated targets and restore on any failure. |
| Existing lock modification is committed | Exclude `deno.lock` explicitly from staging and diff evidence. |

## Deferred scope

- A general arbitrary third-party uninstall script protocol and marketplace trust policy.
- Reworking the broader Archetype-6 CLI structure.
- Repo-wide formatting or dependency changes.
