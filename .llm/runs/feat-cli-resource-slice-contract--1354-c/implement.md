# Implementation: Slice C resource contract and safe reconciler

Implement the locked Slice C section from the master plan without re-planning. Keep all product
changes inside `packages/cli/src/kernel/application/resource-slice/` and exactly the ten enumerated
files. Define contracts first, then the structural planner, leaf/full-preflight reconciler, bounded
`appRoutes` transform, and conditional State transform. The application layer remains pure: no
filesystem, process, network, adapter, presentation, command, init, journal, lock, or rollback code.

Use exact canonical ownership markers and SHA-256 body verification. A default conflict and every
pre-apply failure must produce no apply plan. `--force` is represented only as a reconciler input
and can replace a positively owned divergent leaf; it never replaces owned-edited/unowned/shared
source. Preserve deterministic path and report ordering.

## Delivered

- `resource-slice-contract.ts` defines validated normalized input, finite variants/leaf roles,
  selected client/query procedure, the exact canonical schema-1 marker, staged candidates,
  classification, reports, and the reconciliation result union.
- `plan-resource-slice.ts` produces the six core leaves and exact form/partial/stream deltas. Query
  bindings are factory-derived (`queryOptions` and `clientKey`), and shipped variants declare no
  request-state mutation.
- `reconcile-resource-slice.ts` validates all staged candidates, classifies all owned leaves, builds
  the complete deterministic report, and exposes an apply plan only for a conflict-free non-dry
  run. Canonical additive transitions are exact-byte and prior-render constrained.
- `reconcile-app-routes.ts` recognizes the stock post-Slice-F router imports/object anchor, safely
  finds the matching object brace, parses top-level properties independent of indentation, and
  inserts only a generated-route property chain.
- `reconcile-state.ts` recognizes only the empty `Record<string, never>` alias and unextended
  `State` interface. It preserves unrelated bytes and scans property conflicts inside the State
  body rather than elsewhere in `utils.ts`.

No command, init path, renderer, filesystem adapter, Fresh adapter, journal, lock, rollback, or
package export was added. No command calls this planner yet.

## D3 proof map

| Contract | Pinning test |
| --- | --- |
| Exact first-line canonical JSON marker and UTF-8 body SHA-256 | `writes and parses the exact canonical first-line marker` |
| Missing/malformed/schema/resource/role mismatch is unowned | `missing, malformed, unsupported-schema, wrong-resource, and wrong-role markers are unowned` |
| Hash mismatch is `owned-edited` and force-ineligible | `mismatched body hash is owned-edited and never replaceable under force` |
| Recomputed forgery is owned-by-convention, not authenticated | `recomputed marker forgery is owned by convention but needs force` |
| Identical second run skips all selected outputs and writes none | `identical second run skips every path and plans zero writes` |
| Options render before an edited-base dry-run conflict | `additive option is selected and fully reported before an edited-base dry-run conflict` |
| Canonical additive option transition needs no force | `canonical additive transition writes without force` |
| Default conflicts report every path and expose no apply plan | `default conflict reports every path, force eligibility, and no apply plan` |
| Force replaces only a positively owned divergent leaf | `force replaces only positively owned leaves and leaves shared/exact bytes alone` |
| Unowned content remains force-ineligible | `unowned content remains a conflict under force` |
| Input/client/procedure/Fresh/shared-transform failures are pre-apply | `each injected pre-apply failure structurally proves zero application writes` |
| Invalid staged ownership metadata is pre-apply | `invalid staged ownership metadata fails before an apply plan exists` |

The pre-apply proof is structural: every failure/conflict/dry-run result omits `applyPlan`; the test
also snapshots an application map and proves each injected failure leaves it byte-identical.
