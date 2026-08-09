# Context Pack: #1333

Branch `feat/default-app-reference-quality` starts at `origin/main@35358886a`. This turn is plan
only. The selected design upgrades the existing generated service example instead of adding a new
parallel exemplar, derives omitted app names as `<project>-web`, preserves the generated-DB-schema
to versioned-contract seam, and adds semantic golden plus browser/runtime coverage.

Rows 1, 4, and 7 are substantially present and need preservation/evidence. Rows 2, 3, 5, 6, 8,
and 9 contain the substantive implementation delta. Row 10 is observational: deterministic tests
cannot prove agent adoption, and #1090 already owns the controlled six-agents-per-arm experiment.
The owner must decide that relocation before implementation/closure. The plan therefore opens a
draft PR with `Refs #1333`, not a closing keyword.

The owner approved option A and authorized implementation on 2026-08-09 after moving row 10 to
#1090. No Aspire/container work or serialized runtime grant exists.

S1 is implemented and locally green: the omitted-name pre-fix run failed with actual `dashboard`,
the explicit-name control stayed green, and the final focused suite passed 14/14. Scoped
check/lint/fmt and the package quality scan exit 0. Package doctrine exits 1 with the exact same
50 failures / 51 warnings / 1 info finding as a detached `origin/main` archive; S1 adds no finding.

S2 replaces init's global `lib/example-service.ts` with resource-owned `(_lib)/service-query.ts`
and `route-contract.ts`; the old-shape golden failed pre-fix and the final focused suite passes.
The service-add command deliberately continues writing the #1373 golden-path
`apps/<app>/lib/<service>.ts` from the same template.

S3 composes typed route/search state, auth and showcase resources, layers, a managed form,
telemetry, partial navigation, QueryIsland hydration, four query states, and optimistic rollback in
the canonical generated service route. Fresh memory and DB workspaces type-check at 108 and 117
selected files respectively. Deliberate rollback, invalid-form, and success-form mutations each
produce focused red evidence.

S4 promotes the typed canonical route and living design references without deleting the independent
CRUD or telemetry examples. Home and navigation links use `appRoutes.design` and
`appRoutes.designComposition`; app guidance discovers the new contract/form/auth/resource seams.
