# Worklog — #707 Fresh UI CLI

## Plan

PLAN-EVAL is owner-waived (carried drift D1). Implement scope 1–4 in three slices: (1) shared web
generators plus `ui:add page|island`; (2) registry list/update/remove with drift-safe behavior; (3)
docs, focused tests, scoped gates, commit and push. Item 5 (`ui token set`) is deferred as p3.

## Design

- **Public surface:** `ui:add page <path>`, `ui:add island <Name>`, `ui:list`, `ui:update`, and
  `ui:remove`; shared application functions return generated/changed file data for a dashboard caller.
- **Domain vocabulary:** scaffold kind (`page`/`island`), registry installed state, update drift,
  generated file result.
- **Ports:** the existing `FileSystemPort`; no new external dependency.
- **Constants:** route/island directory names and generated query dependency specifiers live beside
  the generator.
- **Commit slices:** generator verbs (targeted tests); registry lifecycle verbs (targeted tests);
  docs/e2e coverage and validation (scoped check/lint/fmt and targeted tests).
- **Deferred scope:** p3 token mutation; orchestrator-owned `scaffold.runtime`; PLAN-EVAL per D1.
- **Contributor path:** add templates/behavior in kernel `application/ui`, then a vertical command
  folder under `public/features/ui`, register it in the public command tree, and extend semantic tests.

## Evidence

| Gate | Result |
| --- | --- |
| Targeted UI + command-tree tests | PASS — 16 tests across generator, lifecycle, existing registry, public root, and local composition |
| Scoped check: `kernel/application/ui` | PASS — 7 files, 0 findings |
| Scoped check: `public/features/ui` | PASS — 9 files, 0 findings |
| Scoped check: `public/features/root` | PASS — 2 files, 0 findings |
| Scoped lint: the same touched roots | PASS — 0 findings |
| Scoped fmt wrappers: the same touched roots | PASS — 0 findings |
| CLI help registration | PASS — `ui:add`, `ui:init`, `ui:list`, `ui:update`, `ui:remove` shown |
| Lock hygiene | PASS — no `deno.lock` diff |

`scaffold.runtime` / `deno task e2e:cli` was not run because the orchestrator owns that gate. The
generated page is semantically tested against the real `definePage`/typed-route builder shape, but
the next-build manifest pickup remains unproven until that orchestrator gate runs.

## Drift

- D1 (carried, owner-approved): PLAN-EVAL waived; this short plan/design checkpoint precedes source edits.
- D2: p3 `ui token set` deferred as allowed by the slice brief; no token mutation surface added.
