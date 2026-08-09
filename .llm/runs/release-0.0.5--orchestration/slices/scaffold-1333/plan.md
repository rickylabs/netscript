# Plan: #1333 — default app reference quality

## Harness selection and status

- Doctrine archetype: **6 — CLI/tooling**. The CLI application layer owns scaffold composition;
  checked-in templates are its generated consumer surface.
- Overlay: **SCOPE-frontend** for Fresh routes, islands, browser behavior, responsive states, and
  contract/client integration.
- Public package API: unchanged. Published CLI asset content and package size change, so the JSR
  publishability rubric applies: no new export map, no new slow public type, all NetScript
  specifiers versioned, generated barrel reproducible, doc lint/publish dry-run/JSR audit required.
- `PLAN-EVAL: REQUIRED — pending owner-launched separate session.` This is a hard stop. No product
  source may change until `PASS`.

## Locked design decisions

1. **Promote one flow; do not create another.** Upgrade the existing generated service resource
   path into the canonical reference and retain the dashboard, health, static CRUD, telemetry, and
   design examples. The DB and memory variants share the same topology and state contract.
2. **Contract-first resource ownership.** The resource directory owns `(_lib)/route-contract.ts`,
   `(_lib)/service-query.ts`, `(_shared)`, `(_components)`, and `(_islands)`. The page uses the
   inline route contract plus typed path/search params, then resources/layers/forms. The query
   module derives from the versioned API contract; it does not call the service route directly.
3. **One explicit state model.** Loading, empty, error, success, optimistic pending, rollback, and
   server-confirmed states are named renderable outcomes. Optimistic mutation snapshots canonical
   query data before update and restores it on error in both DB and memory modes.
4. **Auth-ready, not fake auth.** Add a typed authorization-policy boundary consumed by the route
   with a permissive scaffold default and a documented replacement seam. Do not scaffold a mock
   identity provider or claim authentication exists.
5. **Existing database provenance stays authoritative.** The generated Prisma/Zod schemas continue
   to feed `...SchemaV1` and the service contract; the page consumes that contract through the SDK.
   No duplicate view schema or corpus is introduced.
6. **Stable app-name derivation.** Omitted `--app-name` derives a kebab-safe name from the validated
   project name. The proposed rule is `<project-name>-web`, except an existing `-web` suffix is not
   duplicated. Both interactive and noninteractive paths use the same pure domain function;
   explicit `--app-name` wins unchanged. This avoids a workspace member having the same identity as
   its root package while remaining project-specific.
7. **Living design reference is explicit.** Product-facing home/chrome name and link both `/design`
   and `/design/composition` using typed route references. Existing deeper token/component links
   remain.
8. **Generated quality is executable.** Golden tests inspect semantics and the file tree, not giant
   snapshots. The generated project's own check/lint/quality tasks are exercised, and a deliberate
   `any` mutation must fail the same gate.
9. **Byte ceiling.** Baseline app assets are 165,796 bytes and the generated barrel is 283,217 raw /
   62,035 gzip. Planned app-template growth is capped at **32,000 source bytes** (app assets at most
   197,796) and the generated barrel at **330,000 raw bytes**. These are slice budgets, not existing
   repo gates. Crossing either requires a drift entry and owner decision; no useful example may be
   silently dropped.
10. **Exactly one decisive runtime pass.** Fold route/state/browser assertions into
    `scaffold.runtime`; after every non-Aspire gate is green, record `EXPENSIVE-GATE-REQUEST`, push,
    and stop for a durable grant. Then run exactly one full one-pass command bracketed by leak
    checks. Focused AppHost/container runs also require a prior grant and are not substitutes.

## Ordered commit slices

| Slice | Purpose | Named files | Proving gate |
| --- | --- | --- | --- |
| S0 | Research, design, scope recommendation, draft PR | `.llm/runs/release-0.0.5--orchestration/slices/scaffold-1333/{supervisor,research,plan,worklog,context-pack,drift,plan-eval}.md` | clean baseline; live issue rows quoted; separate PLAN-EVAL |
| S1 | Derive a project-specific app name while preserving explicit authority | `packages/cli/src/kernel/domain/scaffold/app-name.ts` (new), `app-name_test.ts` (new), `application/scaffold/validate-init.ts`, `public/features/init/init-interactive.ts`, maintainer interactive equivalent if separate, focused init/plan tests | omitted-name test is RED on `dashboard`, then GREEN for `<project>-web`; explicit-name control; focused public+maintainer init tests |
| S2 | Establish the resource-local contract/topology and generated-asset registration | `assets/app/routes/examples/service/(_lib)/{route-contract,service-query}.ts.template` (new/moved), service `(_shared)` templates, `assets/manifest.ts`, `adapters/templates/scaffold-template-assets.ts`, `application/scaffold/writers/{write-app-files,write-example-service-app-files}.ts`, writer tests, `assets/embedded.generated.ts` | generated-tree golden requires all four local folders and rejects the old global `lib/example-service.ts`; `check:assets-barrel`; focused template/writer tests |
| S3 | Complete the executable canonical flow and state machine | service `index.tsx.template`, `index.layout.tsx.template`, `(_components)` form/state/view templates, DB+memory `(_islands)/ServiceShowcaseLab*.tsx.template`, `(_shared)/service-showcase*.ts.template`, partial template, focused route-template tests | structural contract chain; DB and memory optimistic rollback unit tests; managed-form invalid/success tests; compile generated DB+memory variants; deliberate comparator/state mutation REDs |
| S4 | Promote the flow and living design reference without deleting useful examples | `assets/app/routes/{index,_layout}.tsx.template`, home/examples views, `templates/app/agent-conventions.ts`, their focused tests | exact typed links to `/design` and `/design/composition`; retained-example manifest/file-set test; canonical-route discovery assertions |
| S5 | Lock generated quality, browser states, and runtime acceptance | `packages/cli/e2e/src/domain/cli-surface.ts`, `e2e/src/application/gates/scaffold/{runtime-gates,probe-app-reference}.ts`, related gate tests, scaffold golden/runtime suite tests | pre-fix old tree/state gate RED; generated check/lint/quality including deliberate `any` RED; browser desktop+mobile loading/empty/error/success/rollback assertions; exact one-pass `scaffold.runtime` after token grant |
| S6 | Reconcile publish size, evidence, and closure truth | regenerated `assets/embedded.generated.ts`, run artifacts, PR body/comments | byte ceilings; full CLI/package gates; JSR audit/doc lint/publish dry-run; review-thread gate; acceptance reconciliation |

Each slice is commit → explicit-refspec push → PR comment with raw exits → worklog update before the
next slice. S2/S3 filenames may be split mechanically if a template exceeds doctrine's 300-line
review threshold, but the locked resource ownership and required behaviors do not change.

## Acceptance-to-proof map

| Row | Final proof | Pre-fix status |
| --- | --- | --- |
| 1 | Golden import scan plus real desktop/mobile resource interaction using app-owned controls | already largely GREEN structurally; browser canonical-flow proof absent (qualitative/behavioral) |
| 2 | Generated DB+memory compilation and route-flow/rollback tests | RED: zero route/resource APIs; DB island lacks `onMutate`/restore (compile-time + behavioral) |
| 3 | Form handler tests and browser state/partial/telemetry/auth-boundary assertions | RED: zero `withForm` and auth seam; no state browser gate (behavioral) |
| 4 | Render DB scaffold, verify generated Zod → `SchemaV1` → client/page type chain | currently GREEN; preservation/integration proof |
| 5 | Home/chrome golden with typed links and browser navigation to both routes | RED: product surface does not link both named routes (structural + behavioral) |
| 6 | Exact generated resource tree including `(_lib)` | RED: `(_lib)` absent (behavioral filesystem) |
| 7 | Exact retained-example set plus browser smoke of promoted and retained routes | currently GREEN structurally; usefulness remains review judgment |
| 8 | Pure derivation matrix and public+maintainer init tests | RED: omitted name resolves to `dashboard` (behavioral) |
| 9 | Golden tree/import tests, generated type/lint/no-any gates, browser states, full runtime | RED: new advanced-flow/state assertions fail old output (compile-time + behavioral) |
| 10 | Not claimable by this implementation. Owner must relocate to #1090 or run/score an external measured study. | observational; no valid repository RED |

## Validation order — cheapest first

1. Run each focused unit/golden test and record its concrete pre-fix RED before implementing the
   behavior it guards. For preservation rows, record pre-fix GREEN rather than manufacturing RED.
2. Focused app-name, template registry, writer, route-template, generated-quality, and E2E gate
   unit tests.
3. Generate both memory and DB-backed workspaces in temporary directories; run their check, lint,
   no-`any` quality gate, and state-focused tests. Require no lock/source residue.
4. Regenerate and verify the asset barrel; report raw/gzip size and delta against the locked budget.
5. Scoped check/lint/fmt for every touched CLI/E2E/run-artifact TypeScript root, with `--no-lock`
   passed through the check wrapper and `--unstable-kv` where required.
6. Package-decisive `scan-code-quality --root packages/cli/src` and
   `check-doctrine --root packages/cli`; root `quality:scan` and `arch:check` are additional
   aggregates, not substitutes for package coverage.
7. `check:assets-barrel`, `check:netscript-jsr-specifiers` (`failures=0`), CLI doc lint, JSR audit,
   package publish dry-run, then root publish dry-run. If publish dry-run triggers #1417 manifest
   mutation, record it and restore only explicit manifest paths; do not fold that defect in.
8. Non-AppHost browser/component checks for desktop/mobile and all named states. Any real AppHost or
   container work waits for the serialized grant.
9. Once all above are green: write `EXPENSIVE-GATE-REQUEST`, commit/push it, and stop. After a durable
   grant, run leak-check → exactly one
   `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` → leak-check. Report raw exit,
   passed/failed/skipped totals, step count, and every skip. Do not retry without a new grant.
10. Review threads, acceptance reconciliation, and owner-controlled IMPL-EVAL. Never self-certify
    or mark ready.

## Open-decision sweep

### Must resolve before implementation

- **Row 10 ownership / closing shape.** Recommendation: owner edits #1333 to relocate the
  observational criterion to #1090, then rows 1-9 may close #1333. Until that happens the draft PR
  uses `Refs #1333`, not `Closes #1333`. Leaving this undecided would make closure dishonest.

### Safe to defer

- Whether the controlled #1090 study runs before or after the stable tag; it does not alter product
  code in this plan.
- Visual polish beyond responsive, accessible use of the existing app-owned registry primitives.
  The browser gate proves behavior and layout at two viewports; subjective redesign is not required.
- Adding new public Fresh/SDK abstractions. Existing APIs are the plan boundary; inability to compose
  them is a rescope trigger, not permission to expand this PR.

## Risk register

| Risk | Mitigation |
| --- | --- |
| Large generated island repeats the original 676-line failure | Split state, form, view, and query responsibilities into resource-local files; apply 300-line review threshold before generation. |
| DB and memory modes drift | Same behavioral contract suite against both rendered variants, including optimistic rollback. |
| Fake auth is mistaken for real security | Name a typed policy seam with permissive starter implementation and explicit replacement guidance; do not claim authentication. |
| Golden tests pass by matching strings | Pair semantic file/import assertions with generated compilation and real browser state transitions; mutation-prove load-bearing gates. |
| Browser assertions depend on timing/environment | Use explicit state fixtures/test hooks and role/text semantics, bounded waits, desktop+mobile viewports; no color/terminal-dependent text matching. |
| App-name change breaks E2E assumptions hardcoded to `dashboard` | Central derivation plus full search/update of app-name consumers; tests exercise omitted and explicit names across public and maintainer paths. |
| Asset growth bloats the published CLI | Locked raw budgets, reported delta, reproducible barrel, package/root publish dry-run; stop on overrun rather than deleting examples. |
| Runtime token is consumed before cheaper defects are found | All non-Aspire tests, static gates, generation, package checks, and publish checks precede the request. |

## Scope recommendation

Implement rows **1-9** as the stable blocker, emphasizing the substantive gaps in 2, 3, 5, 6, 8,
and 9 while preserving/proving 1, 4, and 7. Do not reduce this further: removing the executable
state/rollback or generated-quality portions would leave the same hand-rolling failure mode the issue
was opened to correct. Move row **10** to #1090 because it is an external adoption observation, not
implementation acceptance. If the owner declines that move, ship the implementation as a partial PR
referencing #1333 and leave the issue open for the measured study.

