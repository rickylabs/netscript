# Plan: fresh-ui registry SDK subpath dependencies (#953 / #956)

## Run Metadata

| Field          | Value                                 |
| -------------- | ------------------------------------- |
| Run ID         | `fix-freshui-registry-sdk-pin--953`   |
| Branch         | `fix/freshui-registry-sdk-pin`        |
| Phase          | `plan`                                |
| Target         | `packages/cli`, `packages/fresh-ui`, `.llm/tools/validation` |
| Archetype      | `6 - CLI / Tooling`                   |
| Scope overlays | `frontend`                            |

## Archetype

Archetype 6. Two archetypes could apply — `@netscript/fresh-ui` is Archetype 4 (DSL/builder) and
`@netscript/cli` is Archetype 6 — and `archetypes/README.md` says to take the larger and fold the
smaller inside it. The behavioural defect lives in the CLI (`ui:add`'s import-map merge); the
fresh-ui change is a data-literal correction inside an already-typed manifest, not a surface
change. `SCOPE-frontend` applies because the manifest is the design-system registry.

## Current Doctrine Verdict

`@netscript/cli` — **Restructure** (Archetype-6 layout; split `pipeline.ts`,
`official-plugin-copier.ts`). `@netscript/fresh-ui` — **Keep** (confirm runtime registry shape).
Neither headline action is in scope for a fix PR; this run must not enlarge either debt.

## Axioms in Play

| Axiom | Why it matters |
| ----- | -------------- |
| Contract first | The import-map entry `ui:add` emits *is* the contract with the user's workspace; it is defined once and both write and prune read it. |
| Wrap, do not reinvent | Import-map subpath resolution is a Deno platform behaviour — the fix conforms to it (`"@std/fs": "jsr:@std/fs@^1"`) rather than inventing a NetScript resolution rule. |
| Drift is explicit | The version skew that is *not* breakage (range pins) is reported, not silently rewritten. |

## Goal

A `ui:add` on a beta.11 workspace produces an import map in which every registry dependency —
including the SDK's `/desktop` and `/auto-update` subpaths — resolves, and a release cut cannot
ship a `@netscript/*` pin from a previous release again.

## Scope

- `packages/cli/src/kernel/application/ui/registry-deno-json.ts` — one exported helper that turns a
  registry dependency specifier into the `{key, value}` import-map entry, normalising a subpath
  specifier to its package root.
- `packages/cli/src/kernel/application/ui/registry.ts` — dependency pruning uses the same helper so
  add and remove agree on the entry, and shared-value deps are not orphaned.
- `packages/fresh-ui/registry.manifest.ts` — the two `0.0.1-beta.10` SDK pins → `0.0.1-beta.11`.
- `.llm/tools/validation/check-netscript-jsr-specifiers.ts` — two new rules (version currency,
  subpath export existence) on the guard that already runs in `ci:quality`.
- Tests for all three.

## Non-Scope

- **Range-pinned `@netscript/*` specifiers** (`^0.0.1-alpha.12` in six plugin adapters,
  `^0.0.1-alpha.18` in the contracts scaffold template, `^0.0.1-beta.5` in the manifest,
  `^0.0.1-alpha.0` in the plugin skeleton). All resolve to `0.0.1-beta.11` today, so they are skew,
  not breakage. Converting a range to an exact pin changes what a user's workspace resolves to over
  time — a release-policy decision, not a bug fix. Reported by the new guard, carried by a
  follow-up issue.
- The CLI's Archetype-6 restructure debt.
- Any change to `@netscript/sdk`'s exports — beta.11 already exports both subpaths (F7).

## Hidden Scope

- **Pruning symmetry.** `removeUiRegistryItem` finds the import to delete by matching the raw
  dependency string against the map *value*. Normalising the written value breaks that match unless
  pruning uses the same helper. Missing this would leave orphan imports behind on `ui:remove`.
- **Shared-value pruning.** Once `/desktop` and `/auto-update` both normalise to
  `jsr:@netscript/sdk@0.0.1-beta.11`, the existing `stillRequired` check (raw-string equality)
  would delete an import another installed item still needs. Must compare normalised entries.

## Locked Decisions

| ID | Decision | Rationale |
| -- | -------- | --------- |
| D1 | The import-map **value** is normalised to the package root; the subpath is dropped, not moved into the key. | One entry serves the package root and every subpath, matches Deno's documented behaviour, and removes the last-one-wins collision between two subpath deps of one package. Executed proof in F6. |
| D2 | The version-currency and export-existence rules extend `check-netscript-jsr-specifiers.ts` rather than becoming a new tool. | It already scans `packages/**` + `plugins/**` with comment masking and an allowance marker, and its task is already a `ci:quality` dependency — so the guard runs per-PR, not only at a release cut (F12). |
| D3 | Currency is asserted against the **workspace member's own declared version**, not the root version. | Precise: it names the package that disagrees, and it survives a member deliberately off the release train. |
| D4 | Range specifiers are reported, never failed. | Q1. Failing them would force either a six-adapter refactor inside a fix PR or fourteen suppression markers — both worse than a visible report plus a follow-up issue. |
| D5 | PLAN-EVAL / IMPL-EVAL are recorded `NOT_RUN`, not `PASS`. | `run-loop.md` §4/§7 require a separate session; a single-session run cannot self-certify. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Normalise value vs. key (Q2) | resolved now | D1 — would force rework of both merge and prune if deferred. |
| Range pins fail or report (Q1) | resolved now | D4 — determines the guard's exit-code contract. |
| Auto-rewrite stale pins during `version:bump` | safe to defer | `replaceVersionFiles` does a blind whole-file `replaceAll`; running that over arbitrary `.ts` would rewrite unrelated version mentions. A loud failing guard is the correct instrument; the follow-up issue can consider targeted rewriting. |

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| Normalising the value silently changes existing consumers' import maps. | The write is additive-only (`if (imports[key] === undefined)`), so an existing workspace entry is never overwritten. New installs get the correct entry. |
| The export-existence rule fires on template placeholders (`@<version>/cli`). | Pre-checked every subpath specifier in the repo against its workspace package's exports — all ten resolve (`mcp./cli`, `plugin-*./cli`, `telemetry./attributes`, `./query`, `sdk./desktop`, `./auto-update`). |
| The guard fails on a package that is not a workspace member. | Unknown `@netscript/*` names are skipped, not failed — the guard reports what it can prove. |
| `deno check`/`lint` exclude `packages/fresh-ui`, so the manifest edit is not covered by the root task. | Run `packages/fresh-ui`'s own `deno task check` as the slice gate. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| AP-9 premature abstraction | risk | The new helper exists because two call sites (merge + prune) need identical behaviour today — not speculatively. |
| AP-13 `console.log` in published code | avoid | All new output is in the `.llm/tools` guard, which is not published. |

## Fitness Gates

| Gate | Required | Expected evidence |
| ---- | -------- | ----------------- |
| F-5 Public surface audit | yes | One new exported helper in an internal `kernel/application` module; no published-surface change. |
| F-6 JSR publishability | yes | `deno task publish:dry-run`. |
| F-10 Test-shape audit | yes | New tests are behavioural (merged-map shape, guard verdicts), not snapshots. |
| F-19 Scoped source gate runners | yes | `run-deno-check/lint/fmt` wrappers + `packages/fresh-ui` own check. |
| Consumer import validation | yes | Executed `deno check` probe of the emitted import map against published JSR (F6). |
| release-gate class | n/a | Not a release cut; no scaffold-output, DB-wiring, or Aspire-helper change. `ui:add` is not part of `scaffold.runtime`. |

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| CLI Archetype-6 restructure | none | Untouched; the change is inside an existing kernel module. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| ----- | ---- | ---------------- | --------------- |
| 1 | unit (CLI) | `deno test packages/cli/src/kernel/application/ui/` | fails before S2, passes after |
| 2 | unit (guard) | `deno test .llm/tools/validation/check-netscript-jsr-specifiers_test.ts` | fails before S4, passes after |
| 3 | guard | `deno task check:netscript-jsr-specifiers` | fails on the beta.10 pins before S3, passes after |
| 4 | static | `deno task fmt:check`, `deno task lint`, `deno task check` | PASS |
| 5 | fresh-ui | `cd packages/fresh-ui && deno task check` | PASS (root `check` excludes fresh-ui) |
| 6 | suite | `deno task test` | PASS |
| 7 | fitness | `deno task arch:check` | PASS |
| 8 | consumer | `deno check` of the emitted map against published JSR | resolves |

## Dependencies

- Published `@netscript/sdk@0.0.1-beta.11` on JSR (network) for the consumer probe only.

## Drift Watch

- If `@netscript/sdk` ever drops `/desktop` or `/auto-update`, the export-existence rule fails —
  that is the intended signal, not a false positive.
- If a package is deliberately taken off the release train, D3's per-member comparison must be
  revisited.
