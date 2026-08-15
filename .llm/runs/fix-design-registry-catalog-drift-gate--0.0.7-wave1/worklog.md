# Worklog: generated design registry catalog drift gate

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-design-registry-catalog-drift-gate--0.0.7-wave1` |
| Branch | `fix/design-registry-catalog-drift-gate` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `frontend` |

## Design

### Public Surface

- No package export or CLI command changes.
- Generated consumer surface: `registryMeta`, `registryCatalog`, and the new
  `registryCollections` constant in the app-owned `(_shared)/registry.ts` asset.
- Authoritative package surface remains `freshUiRegistryManifest` from
  `@netscript/fresh-ui/registry`.

### Domain Vocabulary

- `RegistryCatalogItem` — generated gallery projection of manifest name/kind/layer/description.
- `RegistryCatalogCollection` — generated gallery projection of manifest collection name/item
  membership.
- `RegistryCatalogSnapshot` — test-only parsed projection containing meta, items, and collections.
- `RegistryCatalogDrift` — test-only named missing/extra/changed differences.

### Ports

- No new runtime port. The test-only filesystem read consumes Deno's declared test permission and
  is excluded from both package publish graphs.
- Existing CLI spine remains unchanged: `CliCommand<Input, Result>`, `CliCommandGroup`, `CliRoot`,
  `UseCase<Input, Result>`, and `Registry<TKey, TValue>`.

### Constants

- `registryMeta` — `name`, `version`, `packageName`, and exact item `total`.
- `registryCatalog` — ordered 66-item static projection.
- `registryCollections` — ordered eight-collection static membership projection.
- No new command-name, exit-code, output-format, adapter, permission, or layer-2 abstract constant.

### Archetype-6 Design Checkpoint

- Command surface/public flow APIs: unchanged; `ui:add`, `ui:list`, and `ui:update` keep consuming
  the live `freshUiRegistryManifest` through `kernel/application/ui/registry.ts`.
- Extension axis: Fresh UI registry item name → manifest item. Population remains in
  `packages/fresh-ui/registry.manifest.ts`; CLI flows consume the live map and the generated route
  consumes its checked static projection.
- Generated output: only `routes/(design)/design/(_shared)/registry.ts` content changes.
- Adapters/ports/permissions: unchanged; no new runtime IO.
- Composition declarativity and vertical feature catalog: unchanged.
- Semantic test strategy: parse the generated TypeScript constants and compare exact domain values
  to the manifest, including symmetric negative fixtures.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| S0 | Bootstrap red research and locked design. | Red probe exit 0 with 66/50/16; artifact review. | Run dir only. |
| S1 | Complete item and collection projections. | Focused catalog inventory/check/fmt. | CLI registry template + run bookkeeping. |
| S2 | Enforce semantic bidirectional drift gate. | Structured focused/package tests + static/fitness/JSR gates. | Fresh-ui drift test + run bookkeeping. |

### Deferred Scope

- `fresh-browser` route validation — explicitly lease-gated by the coordinator.
- Tier-A review/sign-off and opposite-family IMPL-EVAL — separate sessions owned by the
  orchestrator/coordinator.

### Contributor Path

Add or change a registry item once in `packages/fresh-ui/registry.manifest.ts`; the focused
`registry-doc-drift.test.ts` gate then names exactly what must be regenerated in the CLI catalog
template, including collection/meta drift. A contributor updates that one template projection and
reruns the focused test.

## PLAN-EVAL Decision

`PLAN-EVAL: N/A` — justified before implementation. This is a small mechanical repair with a
complete frozen contract, exact authoritative/source and consumer files, measured symmetric diff,
explicit acceptance criteria, and predetermined gates. No architecture, sequencing, scope, risk,
or trade-off decision remains that would benefit from a separate plan evaluator. IMPL-EVAL remains
mandatory and separate after implementation.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-15T07:46:21+02:00 | S0 | research | Reproduced 66 manifest items versus 50 catalog items; named all 16 missing and confirmed 0 extra. |
| 2026-08-15T07:46:21+02:00 | S0 | root cause | Confirmed renderer covers all kinds; independent incomplete static snapshot is the defect. |
| 2026-08-15T07:46:21+02:00 | S0 | plan | Locked static projection + semantic symmetric test; recorded `PLAN-EVAL: N/A`. |
| 2026-08-15T07:52:00+02:00 | S1 | implement | Added the 16 omitted items at their authoritative manifest positions, changed the declared total to 66, and added all eight ordered collection memberships. |
| 2026-08-15T07:52:00+02:00 | S1 | gate | Semantic data-URL import probe returned exact item/meta/collection projections, 0 missing, 0 extra, raw exit 0. |
| 2026-08-15T07:52:00+02:00 | S1 | reconcile | Issue #1358 remains open; draft PR #1657 carries `Closes #1358`, milestone 0.0.7, required type/area/priority/gate labels, and exactly one `status:plan` pending the S1 phase transition. No new reviewer comments existed before this slice. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Preserve a static app-owned catalog projection | Maintains copy ownership and avoids published runtime asset/import-meta reads. | plan LD-1; fresh-ui copy-fidelity contract; JSR audit |
| Add collection projection | Issue acceptance requires exact membership, absent from current catalog. | issue #1358; plan LD-2 |
| Use semantic fixtures, not source mutation | Proves both failure directions without destructive edits or giant snapshots. | AP-18; plan LD-5 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Frontend overlay references absent `.claude/05-frontend.md`. | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Red inventory | `deno eval` command recorded in `research.md` | PASS (exit 0) | Reproduced 66/50/16 before edits. |
| S1 semantic catalog inventory | data-URL import of the generated TypeScript template compared to `freshUiRegistryManifest` | PASS (exit 0) | 66/66 items, 0 missing, 0 extra, exact ordered item/meta and eight-collection membership projections. |
| Template format-wrapper probe | `run-deno-fmt.ts --file <registry.ts.template> --ext template --pretty` | NOT_RUN (wrapper exit 2) | Wrapper correctly refused false green because Deno excludes `.template`; it is not claimed as formatting evidence. Scoped TypeScript formatting remains an S2 gate. |
| check/test/lint/fmt | structured wrappers | NOT_RUN | Full authorized gate phase follows S2. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `quality:scan` | NOT_RUN | pending | Required after package edits. |
| `arch:check` | NOT_RUN | pending | Required after package edits. |
| JSR audits/publish dry-runs | NOT_RUN | pending | Required for CLI and fresh-ui. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Aspire/Docker/E2E | NOT_RUN | coordinator prohibition | No lease; must remain untouched. |
| `fresh-browser` | NOT_RUN | coordinator lease boundary | Stop when this is the remaining gate. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Generated `/design/components` route | NOT_RUN | pending static catalog repair | Browser proof is lease-gated. |

### S1 Gate Detail

| Assertion | Observed |
| --- | --- |
| Manifest/catalog items | 66 / 66 |
| Missing / extra | 0 / 0 |
| Ordered name/kind/layer/description projection | exact |
| Manifest/catalog collections | 8 / 8 |
| Ordered collection membership projection | exact |
| Meta name/version/package/total | exact |

## Handoff Notes

- First inspect the semantic comparator and its named symmetric diagnostics.
- Verify the template contains all 66 items and eight collections and that no published runtime
  asset/import-meta read was introduced.
- Do not treat green automated gates as Tier-A sign-off.
