# Plan: docs snippet compile gate for #1374

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `test-1374-docs-compile-gate--leaf` |
| Branch | `test/1374-docs-snippet-compile-gate` |
| Phase | `plan` |
| Target | `.llm/tools/docs`, Tier-1 `docs/site` code fences, and Pages CI |
| Archetype | N/A — internal documentation fitness tooling, no package/plugin public surface |
| Scope overlays | `SCOPE-docs` |

## Archetype and doctrine boundary

No package/plugin implementation archetype applies: the new surface is a repo-internal Deno tool
and task. Doctrine A1 and A14 still govern the consumed boundary: snippets must name public
`@netscript/*` entrypoints, and the compile gate is the fitness function preserving that contract.
Doctrine file 10's individual package verdicts are inputs, not scope; this PR changes none of them.

## Goal

Make every unexempted `ts`/`tsx` fence on the nine #1373 Tier-1 pages compile against exact
workspace-declared public entrypoints, report an auditable exemption/coverage census, prove three
real red controls, demote literal API needles, and make package/plugin changes rerun the site gate.

## Scope

- Add a checked-in extractor/compiler under `.llm/tools/docs` plus focused tests and fixtures.
- Add root tasks for the green gate, its tests, and explicit negative-control runs.
- Add reasoned `no-check` markers to the 17 identified Tier-1 partial/counter-example fences.
- Keep 18 Tier-1 fences checked; report 17 exemptions and 253 outside-floor TS/TSX blocks.
- Demote `docs:accuracy` exactly as specified below; keep `check-exports-drift` intact.
- Add the snippet gate and `packages/**`/`plugins/**` triggers to `pages.yml`.
- Check in a tooling-facing coverage/expansion document under `.llm/tools/docs`.

## Non-Scope

- No cast/`any` inventory or cast guard (#1278); support fixtures contain no `any`, `as any`, or
  `as unknown as`.
- No expansion of `check-exports-drift` mappings (#1108).
- No package README coverage (#1377), README gate repair (#767), prose tutorials (#1208), or API
  deep dives (#1210).
- No installed-artifact proof (#1343), execution, service start, browser smoke, or E2E CLI run.
- No edit to the stale MCP generated corpus (#1531).

## Locked Decisions

### D1 — Extraction, module assembly, naming, and lifetime

**Decision.** Scan every `.md`/`.vto` below `docs/site`, parse matching backtick or tilde fences,
and recognize exactly the `ts` and `tsx` language tokens. For each unmarked Tier-1 block:

1. Create one page-isolated synthetic root under a single `Deno.makeTempDir` directory.
2. If the first code line begins with a path comment whose first token ends in `.ts` or `.tsx`
   (for example `// apps/dashboard/lib/widgets.ts` or
   `// routes/contact.tsx — bare Fresh`), materialize that path inside the page root so relative
   imports between that page's blocks resolve. Otherwise name it
   `blocks/<page-slug>-L<opening-line>-B<ordinal>.<ts|tsx>`.
3. Reject duplicate materialized paths instead of overwriting one block with another.
4. Prepend only a provenance comment and a reference to a shared strict preamble. The preamble
   declares no ambient application names and no permissive types. Typed support modules provide
   only the explicit scaffold/app aliases required by the 18 checked blocks.
5. Run one `deno check` over the generated entry set and map diagnostics back to source page/line.
6. Delete the entire temp root in `finally`, on green and red exits.

Generated files live outside the worktree in the OS temp directory. They are not committed and do
not need a gitignore rule; no directory named `coverage` is introduced. The source path plus opening
line and ordinal make diagnostics and repeated runs deterministic even though the temp prefix is
random.

**Reason.** Page-isolated roots preserve real relative-import semantics without letting an example
on one page accidentally satisfy another. A minimal preamble makes missing context fail or require
an explicit marker; it cannot silently legalize a fragment.

### D2 — Exact `@netscript/*` resolution

**Decision.** Build the synthetic import map from repository data at runtime:

- Expand the root workspace globs and read every member `deno.json`.
- For each member whose `name` starts with `@netscript/`, map only its declared export keys: `.` to
  the package name and each `./subpath` to the exact `@netscript/name/subpath` specifier.
- Resolve targets to absolute file URLs for the declared entrypoint files. Do not add a package
  prefix mapping and do not expose undeclared files.
- Merge declared external imports from the root/member configs, resolving `catalog:` through the
  root npm catalog and failing on conflicting mappings.
- Add only the named, typed support aliases (`@database/zod`, `@playground/contracts`,
  `@my-app/contracts`, `@app/utils.ts`, `@app/lib/contacts.ts`) and exact Preact JSX runtime
  mappings required by Tier-1 examples.

The generated config keeps `strict`, `noImplicitAny`, and `noImplicitReturns`; sets
`isolatedDeclarations: false` because examples are consumers rather than publishable declarations;
and selects Preact `jsx: precompile`. The subprocess is:

```text
deno check --unstable-kv --frozen --lock <repo>/deno.lock --config <temp>/deno.json <entries...>
```

The checker uses `Deno.execPath()`/`Deno.Command`, executes no snippet, grants no snippet runtime
permissions, and starts no service. Registry resolution remains the normal frozen Deno module-graph
resolution; user code is never run.

**Reason.** The snippet text continues to import `@netscript/*`, while exact declared-export map
generation makes a missing export or undeclared subpath fail. Deriving the map avoids hardcoded
relative-source imports and automatically follows workspace export changes without pretending to
be an installed-artifact canary.

### D3 — Marker grammar and census

**Decision.** The only exemption form is an opening fence whose complete info string matches:

```text
^(ts|tsx)[ \t]+no-check:[ \t]*(\S(?:.*\S)?)[ \t]*$
```

In source this is, for example, ```` ```tsx no-check:partial builder chain uses surrounding state ````.
The separator is one or more spaces; the reason is trimmed and must contain a non-whitespace
character. `no-check`, `no-check:`, extra attributes, or a marker on the closing fence is malformed
and exits non-zero with page/line. Normal unmarked info strings remain exactly `ts` or `tsx`.

The gate prints one stable summary to stdout and the GitHub step summary when available:

```text
docs snippets: PASS scanned=578 ts_tsx=288 tier1=35 checked=18 exempt=17 outside_floor=253 malformed=0 typescript_alias=7
```

It also prints a per-page exemption list (`page:line — reason`). A checked-in policy records the
nine Tier-1 pages and the baseline exemption count `17`; the gate fails if the count exceeds the
budget and reports when the observed count is lower so the same PR can ratchet the baseline down.
The implementation tests the exact baseline census.

**Reason.** An inline, reason-required opt-out is reviewable beside the code. Separate
`exempt` and `outside_floor` counts make day-one coverage honest; a single success count would hide
the remaining 270 TS/TSX blocks.

### D4 — CI owner and the unchanged workflow

**Decision.** Put the trigger fix in `.github/workflows/pages.yml`:

- Add `packages/**`, `plugins/**`, `.llm/tools/docs/**`, `deno.json`, and `deno.lock` to both PR and
  push path filters.
- Add a root-working-directory `deno task docs:snippets` step before the Lume build.
- Keep the existing build/link/caveat and deploy behavior.

Do not add a duplicate job or step to `ci.yml`; its existing `docs:accuracy` step remains, and the
snippet task remains independently owned by Pages.

**Reason.** Pages is the site-owning workflow and, unlike current core CI, runs on draft PRs. This
directly proves that a package/plugin (including CLI/SDK) change rebuilds and revalidates the site,
while avoiding duplicate expensive checks and competing ownership in `ci.yml`.

### D5 — Exact `docs:accuracy` demotion

**Decision.** Keep only string-policy assertions plus the code-derived drift subprocess.

Survive, named:

- Forbidden stale saga call/send shapes: `defineSaga({`, the four orphan `send(...)` forms, and
  `{ kind: 'service', id: 'payments' }`.
- Forbidden golden-path claims across published source: `lib/api-clients.ts`, `@contracts`,
  `@/lib/`, and `apps/<app>/client.ts` presented as a data client.
- The `## Mutation and regeneration map` presence and its five columns: `Command`,
  `Source of truth mutated`, `Generated artifacts`, `Runtime consumers`, `Preview`.
- Invocation of `check-exports-drift.ts` unchanged.

Remove, named:

- `defineSaga`/`spawn` source regexes and positive signature/source needles.
- Positive saga markers `event.payload.body`, `type: "=> never"`,
  `options?: SpawnOptions): never`, and the `SagasError.notImplemented(...)` source spelling.
- The eight preferred-path presence needles.
- The three `--with-client` presence checks and the two quickstart path/role needles.
- The one-page `createServiceQueryUtils` count and its three positive dialect/KV needles.
- The 17 hardcoded CLI mutation-family presence needles.
- `ALLOWED_FRESH_ROOT_SYMBOLS` and `checkFreshRootImports`; real public imports move to Deno check.

Update the existing accuracy tests so they cover only the surviving stale-claim and mutation-column
policy. Do not change `check-exports-drift.ts` or its tests.

**Reason.** Forbidden vocabulary and required table columns are inherently textual policy. Export
and call-shape truth belongs to the compiler; package/reference export-table truth stays in the
code-derived drift checker.

### D6 — Three real red controls (plus the dialect positive control)

**Decision.** Check in isolated fixture sites and make every test spawn the actual CLI entrypoint,
assert a non-zero process code, and assert the diagnostic names the source fence:

1. `non-exported-symbol`: a `ts` fence imports a definitely absent named export from
   `@netscript/sdk`; Deno check must exit non-zero. A unit-only parser assertion is insufficient.
2. `empty-exemption-reason`: a `ts no-check:` opening fence; extraction must exit non-zero before
   compilation with a missing-reason diagnostic.
3. `dialect-a-object-input`: a typed fixture constructs dialect-A `createQueryFactory` helpers
   through exported `@netscript/sdk/client` and `@netscript/sdk/query` contracts, then calls
   `queryOptions({ input: { limit: 1 } })`; Deno check must exit non-zero.

The dialect fixture suite also has two green controls: dialect A with
`queryOptions({ limit: 1 })`, and `createServiceQueryUtils` dialect B with
`queryOptions({ input: { limit: 1 } })`. This prevents implementation as a blanket string ban that
would reject correct dialect-B docs.

Expose deterministic negative commands through the task, one case at a time, so Phase 2 records
three raw non-zero exits rather than hiding them inside a passing test runner.

**Reason.** These controls cross the same extractor → synthetic workspace → `deno check` boundary
as production. Positive dialect controls prove the predicate discriminates the API, not the text.

### D7 — Commit slices and named gates

| # | Slice and proof | Files | Named gate before commit |
| --- | --- | --- | --- |
| 1 | Extractor contract: fence parsing, Tier-1 policy, exact marker grammar, census, and missing-reason red control. | New checker/test/policy/fixture files under `.llm/tools/docs`; `deno.json`; run artifacts. | Scoped check/lint/fmt wrappers; `deno task docs:snippets:test`; direct empty-reason negative command exits non-zero. |
| 2 | Compiler contract: exact workspace export-map resolver, synthetic config/preamble/support fixtures, actual `deno check`, non-exported and dialect-aware red controls plus both dialect green controls. | Checker/test/support fixtures; run artifacts. | Scoped wrappers; `deno task docs:snippets:test`; direct non-exported and dialect-A negative commands each exit non-zero. |
| 3 | Tier-1 green floor and demotion: apply 17 reason markers, compile 18 blocks, record the expansion plan, remove only named API needles. | Nine Tier-1 pages as needed; accuracy checker/test; `.llm/tools/docs/snippet-coverage.md`; run artifacts. | `deno task docs:snippets`; `rtk proxy deno task docs:accuracy`; `rtk proxy deno task docs:links`; scoped wrappers. |
| 4 | Site trigger contract and final evidence: Pages owns the snippet step and package/plugin paths; complete all requested gates. | `.github/workflows/pages.yml`; workflow assertion test if needed; run artifacts. | All three scoped wrappers; docs links; docs accuracy; green snippet gate; all three raw red controls; `rtk proxy deno task test`. |

Every slice updates `worklog.md` and `context-pack.md`, is committed, pushed with the explicit
refspec, and receives one PR phase/slice comment before the next slice. Implementation does not
start until separate-session PLAN-EVAL returns `PASS`.

### D8 — Written expansion plan beyond Tier-1

**Decision.** Check in `.llm/tools/docs/snippet-coverage.md` with the machine census and these
ratchet waves; each wave lowers `outside_floor` and records checked/exempt deltas:

1. Remaining golden-path families: the rest of `web-layer/**`, `services-sdk/**`, and
   `quickstart/**`.
2. Runtime guides: `ai/**`, `background-processing/**`, `data-persistence/**`,
   `durable-workflows/**`, `identity-access/**`, `observability/**`,
   `orchestration-runtime/**`, and `explanation/**`.
3. Tutorials: `tutorials/**`, one tutorial track per change so multi-file context stays reviewable.
4. Reference code blocks: `reference/**`, coordinated with #1108 but limited here to prose fences;
   normalize the seven `typescript` info strings explicitly rather than silently aliasing them.
5. Non-published source/templates under underscore directories are last and reported separately;
   package READMEs remain #1377.

Each expansion PR must add pages to the checked-in coverage policy, make every new unmarked block
green, add reason markers only for deliberate fragments, lower the outside-floor count, and never
increase the exemption baseline without an explicit reviewer-approved rationale.

**Reason.** Section-sized ratchets keep fixtures coherent and make coverage movement auditable;
tutorials and references have distinct owners and failure shapes.

## Planned Tier-1 exemptions (17)

| Page / current opening line | Marker reason |
| --- | --- |
| `services-sdk/how-to/add-a-service.md:152` | `barrel excerpt omits the local binding used in the following line` |
| `web-layer/query.md:71` | `uses cache entries defined earlier in the surrounding application` |
| `web-layer/query.md:214` | `depends on the app-local docs query module omitted from this page` |
| `web-layer/query.md:267` | `depends on the app-local todos query module omitted from this page` |
| `web-layer/examples.md:90` | `uses cached values supplied by the surrounding page loader` |
| `web-layer/form.md:29` | `counter-example intentionally omits bare Fresh setup` |
| `web-layer/form.md:279` | `partial field-array fragment uses the surrounding form state` |
| `web-layer/form.md:353` | `partial JSX fragment uses the surrounding form state` |
| `web-layer/query-bridge.md:29` | `counter-example intentionally omits bare Fresh setup` |
| `web-layer/query-bridge.md:42` | `counter-example intentionally omits bare TanStack setup` |
| `web-layer/query-bridge.md:108` | `pseudocode compares key shapes rather than defining runnable values` |
| `web-layer/query-bridge.md:124` | `partial invalidation fragment uses surrounding query utilities` |
| `web-layer/query-bridge.md:139` | `partial invalidation fragment uses surrounding cache values` |
| `web-layer/query-bridge.md:164` | `partial builder chain uses page-local declarations omitted here` |
| `web-layer/query-bridge.md:198` | `object-shape pseudocode documents generated query options` |
| `web-layer/query-bridge.md:208` | `partial component uses page-local types and view components` |
| `web-layer/query-bridge.md:257` | `partial builder chain continues from surrounding page code` |

Line numbers are research provenance, not stable identifiers; the gate reports current lines at
runtime. The budget is the count, and every marker remains inline with its reason.

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Synthetic compiler config/import-map construction | Resolved now | D2 locks exact declared exports plus declared external imports. |
| TSX runtime | Resolved now | Preact precompile with exact JSX-runtime import mapping. |
| `isolatedDeclarations` behavior | Resolved now | Disabled only in the synthetic consumer config; strictness remains. |
| CI owner | Resolved now | Pages; `ci.yml` intentionally unchanged except its existing accuracy invocation. |
| Day-one exemption count | Resolved now | 17 exemptions / 18 checked / 35 Tier-1 candidates. |
| `typescript` fence alias | Safe to defer | Reported as 7; normalized explicitly during reference expansion, never silently accepted. |
| Package README coverage | Safe to defer | Owned by #1377. |

No open decision would force implementation rework.

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Import map accidentally exposes private source | Generate only exact keys from each package's declared `exports`; negative non-exported fixture proves failure. |
| Preamble makes fragments falsely green | No ambient application declarations, no `any`, and only explicit strongly typed support modules; partials use reason markers. |
| Dialect test becomes a blanket text ban | Compile a typed dialect-A red fixture and both dialect-A/dialect-B green controls. |
| `isolatedDeclarations` creates consumer-example noise | Disable only that publish-oriented option in synthetic config; retain strict type checks. |
| Relative imports cross-contaminate pages | Page-isolated synthetic roots; duplicates fail within a page. |
| Exemption count hides outside-floor work | Print `checked`, `exempt`, and `outside_floor` separately, plus per-page marker reasons. |
| Generated files leak into git | OS temp root plus unconditional `finally` removal; no worktree output. |
| Lockfile churn | Use root lock with `--frozen`; inspect raw git state before each commit; never reload/delete cache. |
| Pages trigger looks correct but does not run checker | Add explicit workflow step and a repository test/assertion covering both package/plugin paths and task name. |
| Root test discovers negative fixtures as normal tests | Fixtures are Markdown/support modules outside `_test.ts` discovery; negative execution is explicit. |

## Anti-Patterns to Resolve or Avoid

| AP / axiom | Status | Plan |
| --- | --- | --- |
| A1 public types first | In scope | Resolve only declared package entrypoints and compile typed consumer calls. |
| A7 platform first | In scope | Use Deno file APIs, temp dirs, workspace config data, and `deno check`; no custom compiler. |
| A14 tests as fitness functions | Core deliverable | Three actual red controls plus green controls and the Tier-1 gate. |
| False-green text needles | Existing defect | Remove named API needles; keep only textual policy. |
| Permissive ambient test doubles | Risk | Strongly typed support modules only; no `any` or cast-based legalization. |

## Fitness and Validation Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| Scoped tool type-check | Yes | Required wrapper command exits 0. |
| Scoped tool lint | Yes | Required wrapper command exits 0. |
| Scoped tool format | Yes | Required wrapper command exits 0. |
| Docs links | Yes | `rtk proxy deno task docs:links` exits 0. |
| Docs accuracy after demotion | Yes | `rtk proxy deno task docs:accuracy` exits 0. |
| Tier-1 snippet gate | Yes | New task exits 0 and prints `checked=18 exempt=17 outside_floor=253`. |
| Three negative controls | Yes | Each direct fixture command exits non-zero; raw codes/diagnostics recorded. |
| Repo test suite | Yes | `rtk proxy deno task test` exits 0. |
| Runtime/Aspire/browser/E2E CLI | N/A | Compilation-only docs tooling; explicitly excluded. |
| jsr-audit / package quality gate | N/A | No package/plugin implementation or export change. |

## Arch-Debt Implications

No new architecture debt is planned. Existing package verdicts and #1531 remain unchanged. Any
Tier-1 block that requires `any`, `as any`, or `as unknown as` to pass will be recorded in
`drift.md` and left unlegalized for #1278 rather than hidden in the preamble.

## Deferred Scope

- The 253 TS/TSX blocks outside Tier-1 follow D8's ratchet.
- Seven `typescript` fences are reported and normalized in the reference wave.
- Package READMEs, installed-consumer proof, export-drift expansion, and stale generated MCP prose
  stay with their named issues.

## Drift Watch

- A planned checked block needs a cast or permissive fixture.
- Exact workspace exports cannot be derived without a prefix/private mapping.
- The observed Tier-1 census differs from `35 / 18 / 17` after only marker edits.
- `pages.yml` cannot run the root task without changing lock or install policy.
- A current line/path no longer matches the research baseline after PLAN-EVAL resumes.
