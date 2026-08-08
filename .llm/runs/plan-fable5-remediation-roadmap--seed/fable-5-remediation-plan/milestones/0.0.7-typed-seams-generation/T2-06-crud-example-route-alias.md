# fix(scaffold): appRoutes.crudExample aliases serviceExample so /examples/crud is unreachable, and a template test asserts the alias — DRAFT (no GitHub mutation; owner ratification pending)

**Draft-ID:** T2-06 · **Proposed milestone:** 0.0.6 (a one-line generated-output defect plus a test
correction; drafted inside the new-0.0.7 pack for topical grouping but independent of the generator
train) · **Labels:** `type:fix` `area:cli` `area:fresh` `priority:p1` `status:triage` ·
**Depends on:** none

## Summary

The generated app's route alias map points `crudExample` at the service-example route. Both example
cards on the home page and the examples index therefore navigate to `/examples/<serviceName>`, and
the CRUD example route that the scaffold also emits is unreachable from the generated UI. The defect
is locked in by a template test that asserts the aliasing line verbatim, so any correct fix fails
the suite first — the test must change with the template.

## Evidence

Repo, verified at `fac9e339042c`:

- `packages/cli/src/kernel/assets/app/router.ts.template:33-34`:
  ```ts
  serviceExample: routes.examples.serviceExample,
  crudExample: routes.examples.serviceExample,   // same target
  ```
- `packages/cli/src/kernel/assets/app/routes/examples/crud.tsx.template:6` binds the page to
  `routes.examples.crud.$route` — a real, distinct route.
- Link sites that consume the wrong alias:
  `packages/cli/src/kernel/assets/app/routes/examples/index.tsx.template:15` and
  `packages/cli/src/kernel/assets/app/routes/index.tsx.template:24`, both
  `href: appRoutes.crudExample.href()`.
- The bug is asserted as expected output:
  `packages/cli/src/kernel/templates/app/route-templates_test.ts:76` —
  `assertStringIncludes(output, 'crudExample: routes.examples.serviceExample,');`
- Corpus: `research/repo-audit/web-layer.md` §10 and gap-register item 3; `§13` records that no
  board issue covers it.

## Current surface

`appRoutes` exposes two names for one route. The generated app ships a "CRUD" card that does not
lead to the CRUD page, and the CRUD page has no inbound link. A regression test enforces the alias,
which is why the defect survived template edits.

## Target contract

1. `appRoutes.crudExample` resolves to the CRUD route (`routes.examples.crud`), so every generated
   link reaches the page it names.
2. `route-templates_test.ts` asserts the corrected alias, and the assertion is written so that a
   future alias collapse fails rather than passes.
3. A structural check makes the class of defect visible, not just this instance: no two distinct
   `appRoutes` keys may resolve to the same route target unless the duplication is explicit and
   commented.
4. Adjacent naming/IA note recorded, not fixed here: `routes/examples/crud.tsx.template` renders
   three hard-coded records with no create/update/delete, while the real CRUD flow lives in
   `ServiceShowcaseLab` on the service-example route. Renaming or reworking that example is a
   separate product decision (see Boundaries).

## Acceptance

- [ ] `appRoutes.crudExample` targets the CRUD route in the generated `router.ts`.
- [ ] Both generated link sites navigate to `/examples/crud` in a scaffolded project.
- [ ] `route-templates_test.ts` asserts the corrected mapping and no longer asserts the alias.
- [ ] Negative test: a check fails when two `appRoutes` keys resolve to the same route target
      without an explicit annotation.
- [ ] gate: `deno task e2e:cli run scaffold.runtime --cleanup` type-checks the generated app with
      the corrected router.

## Boundaries

- **#1333** owns whether the example routes are redesigned at all; this issue only fixes the alias
  so the *existing* example is reachable. Do not fold the "is `crud.tsx` really CRUD?" product
  question into this fix — record it as an amendment to #1333 instead.
- **#1335** owns the conformance inventory that would have caught this class.
- **T2-01** owns route registration for *newly generated* slices; this is the shipped template.
- Not in scope: the layer→partial stringly-typed binding (`web-layer.md` §2.3) and the inline
  `createRouteReference` in `ui:add page` (T2-04).

## Docs/consumer proof

A scaffolded project where clicking the "CRUD" card lands on `/examples/crud` is the proof; the
corrected template test plus the duplicate-target check keep it true. No docs page currently claims
otherwise, so no docs change is required — if one is found during implementation, it changes in the
same PR.

## Provenance

Seed run `plan-fable5-remediation-roadmap--seed`, PR #1347, 2026-08-08. Drafted from
`research/repo-audit/web-layer.md` §10; every line re-verified against worktree `fac9e339042c`.
No GitHub mutation performed.
