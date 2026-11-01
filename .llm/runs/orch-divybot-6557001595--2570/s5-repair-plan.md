# S5 CI repairs — bounded follow-up

CI full shards revealed missing local inventory: web-scaffold, app-navigation,
route-templates, app manifest shape, public-command-tree tests. Keep their behavioral
coverage; update stale assertions for approved capability-aware routes, no-fake rows,
shared shell and new generated imports. Canonicalize layout/navigation with the
existing generated formatter policy. Canonical old/new rendered output is identical
for5project names; browser acceptance remains current. Expand local regression set.

Public init rerun conflict was reproduced read-only in the real review-service app:
only the owned members-loaders.ts conflicts. Init supplies pagination initialInput
{limit:25,offset:0}; public resource regeneration forgets that explicit initialInput
and renders{}. Do not remove pagination, force overwrite, weaken ownership checks,
or change the public test to accept broken regeneration.

Proposed contract-first repair: extend schema1 OwnedResourceSliceLeafMetadata with
an OPTIONAL queryInput record on loader leaves only: clientModule:string,
factory:string (same plan.query.factory),value:flat primitive record. Existing marker
shape remains valid. renderResourceSlice persists this only when initialInput is
explicit. Parser validates structure and canonical serialization. Public generation
recovers it only from the expected loader path, matching resource/role/client/factory,
and only when the stored body hash proves unedited generator ownership. An explicit
request/resolver initialInput takes precedence. Then render through the same existing
planner. Preserve authored-file conflicts. No arbitrary source sniffing or input
inference from service names/config; no new command flag or plugin abstraction.

Tests: marker roundtrip/invalid metadata; init followed by public resource dry-run
remains no-op; matching owned input recovered, edited/unowned/mismatched-client input
not silently adopted. Existing public-command-tree regression must pass unchanged.
Contributor docs explain persisted generator-owned query input. Scope remains CLI
resource-slice contract/render/reconciliation boundary needed by this scaffold change.
Independent substantive code review before sign-off and push. No next slice.

## Accepted review refinement

The authoritative refinement is s5-plan-review.md C1–C5. Persist only the flat
queryInput record, not clientModule/factory fields. Recovery must reproduce the
entire existing loader, including its marker, under the selected current client
and procedure. A body hash alone does not authenticate marker contents. Keep the
existing reconciliation policy unchanged. Document safe conflicts with older CLIs.
