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

Make every unexempted `ts`/`tsx`/`typescript` fence on the nine #1373 Tier-1 pages compile against
exact workspace-declared public entrypoints, report an auditable exemption/coverage census, prove
three real red controls, demote literal API needles, and make package/plugin changes rerun the site
gate.

## Scope

- Add a checked-in extractor/compiler under `.llm/tools/docs` plus focused tests and fixtures.
- Add root tasks for the green gate, its tests, and explicit negative-control runs.
- Add reasoned `no-check` markers to the 14 deliberate Tier-1 partial/counter-example fences.
- Keep 21 Tier-1 fences checked; report 14 exemptions and 260 outside-floor TS-like blocks.
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
and recognize exactly the `ts`, `tsx`, and `typescript` language tokens. Normalize `typescript` to
the `.ts` compilation path; it is an alias, not an untracked language. For each unmarked Tier-1
block:

1. Create one page-isolated synthetic root under a single `Deno.makeTempDir` directory.
2. If the first code line begins with a path comment whose first token ends in `.ts` or `.tsx`
   (for example `// apps/dashboard/lib/widgets.ts` or
   `// routes/contact.tsx — bare Fresh`), materialize that path inside the page root so relative
   imports between that page's blocks resolve. Otherwise name it
   `blocks/<page-slug>-L<opening-line>-B<ordinal>.<ts|tsx>`.
3. Reject duplicate materialized paths instead of overwriting one block with another.
4. Prepend only a provenance comment and a reference to a shared strict preamble. The preamble
   declares no ambient application names and no permissive types. Typed support modules provide
   only the explicit scaffold/app aliases required by the 21 checked blocks. In particular,
   materialize strongly typed page-local modules at the paths resolved by
   `web-layer/query.md:214` (`<page-root>/lib/docs.ts`) and `:267`
   (`<page-root>/apps/dashboard/lib/todos.ts`) so those primary island examples remain checked
   rather than exempted to fit the harness. Both supports derive their procedures through the
   public dialect-A `createQueryFactories` surface—not hand-shaped `queryOptions` objects. The docs
   fixture types `{ id: string } -> { status: "pending" | "embedding" | "ready" }`; the todos
   fixture types `list` plus `update({ id: string; done: boolean })`, exposing the real
   `clientKey`/`mutationOptions` contracts used by the fences. They contain no cast escape hatch.
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
- Merge declared external imports from the root/member configs, resolving member `catalog:` values
  through the root npm catalog and comparing canonicalized package/version requirements before
  failing on conflicts. Deno-equivalent range spellings such as `jsr:@std/assert@1` and
  `jsr:@std/assert@^1` are the same mapping; literal spelling differences are not conflicts. Also
  materialize every root catalog entry that has no declared-import mapping as `<catalog-key>` →
  `npm:<catalog-key>@<catalog-range>`. This catalog-fallback pass is mandatory: bare imports such as
  `@opentelemetry/api` can be reachable through `@netscript/sdk` while appearing in no `imports`
  block. A declared import and catalog fallback for the same key must canonicalize to the same npm
  package/range or configuration fails; no silent precedence is allowed. Against the current root
  plus 37 members, canonicalized declared-import comparison yields zero conflicts (literal
  comparison would yield 40), and declared-versus-catalog comparison also yields zero. These are
  intentionally fail-closed configuration guards: even though neither fires on today's repo, a
  future real conflict stops config construction loudly instead of letting an unchecked graph pass.
- Add only the named, typed support aliases (`@database/zod`, `@playground/contracts`,
  `@my-app/contracts`, `@app/utils.ts`, `@app/lib/contacts.ts`) and exact Preact JSX runtime
  mappings required by Tier-1 examples.

The generated config copies the root `catalog` section (currently 38 entries) verbatim so Deno's
auto-discovered member configs can resolve their own `"catalog:"` imports while their workspace
source is reached through file-URL exports. Top-level import-map entries do not replace this config
section. The config also keeps `strict`, `noImplicitAny`, and `noImplicitReturns`; sets
`isolatedDeclarations: false` because examples are consumers rather than publishable declarations;
and selects Preact `jsx: precompile`. Before every check, copy the repository `deno.lock` to
`<temp>/deno.lock`. The subprocess is:

```text
deno check --unstable-kv --lock <temp>/deno.lock --config <temp>/deno.json <entries...>
```

The checker uses `Deno.execPath()`/`Deno.Command`, executes no snippet, grants no snippet runtime
permissions, and starts no service. It deliberately does not pass `--frozen`: Deno must reconcile
the copied lock's workspace/config metadata with the synthetic config. The seeded temporary lock
retains the repository's dependency resolutions, any synthetic-workspace rewrite is discarded with
the temp root, and the tracked root lock is never passed as a writable target. It also deliberately
does not use `--no-lock`, which would let npm resolution float. User code is never run.

**Reason.** The snippet text continues to import `@netscript/*`, while exact declared-export map
generation makes a missing export or undeclared subpath fail. Root-catalog materialization closes
the transitive bare-specifier gap. A disposable copy of the real lock preserves its pins without
asking a synthetic workspace to satisfy the real workspace's frozen metadata, avoiding both the
always-red `--frozen` design and unpinned `--no-lock` resolution.

### D3 — Marker grammar and census

**Decision.** The only exemption form is an opening fence whose complete info string matches:

```text
^(ts|tsx|typescript)[ \t]+no-check:[ \t]*(\S(?:.*\S)?)[ \t]*$
```

In source this is, for example, ```` ```tsx no-check:partial builder chain uses surrounding state ````.
The separator is one or more spaces; the reason is trimmed and must contain a non-whitespace
character. For any fence whose first info token is `ts`, `tsx`, or `typescript`, the complete info
string must be either that token alone or the exact reasoned marker grammar. Thus `no-check`,
`no-check:`, extra attributes, or a marker on the closing fence is malformed and exits non-zero with
page/line. The alias follows the same marker rules and cannot bypass coverage.

The gate prints one stable summary to stdout and the GitHub step summary when available:

```text
docs snippets: PASS scanned=578 ts=211 tsx=77 typescript=7 ts_like=295 tier1=35 checked=21 exempt=14 outside_floor=260 malformed=0
```

It also prints a per-page exemption list (`page:line — reason`). A checked-in policy records the
nine Tier-1 pages, `minimumChecked: 21`, `maximumExempt: 14`, and `minimumCandidates: 35`. The gate
fails if checked coverage drops below 21, the exemption count exceeds 14, or recognized Tier-1
candidates drop below 35; lower exemption counts and higher checked/candidate counts are reported
as ratchet opportunities. The implementation tests the exact baseline census and an explicit
language-alias regression that renames a floor fence from `ts` to `typescript` without reducing
coverage.

**Reason.** An inline, reason-required opt-out is reviewable beside the code. Separate `checked`,
`exempt`, and `outside_floor` counts plus a checked-count floor make day-one coverage honest; a
language rename cannot turn a checked block into an invisible success.

### D4 — CI owner and unchanged `ci.yml`

**Decision.** Put the trigger fix in `.github/workflows/pages.yml`:

- Add `packages/**`, `plugins/**`, `.llm/tools/docs/**`, `deno.json`, and `deno.lock` to both PR and
  push path filters.
- Add a root-working-directory `deno task docs:snippets` step before the Lume build.
- Add an unconditional structural workflow test under `.llm/tools/docs` that parses `pages.yml`
  and asserts both PR and push filters include `packages/**` and `plugins/**`, and that the build job
  invokes `deno task docs:snippets` before Lume. A typo in either trigger arm or the step ordering
  fails `docs:snippets:test` and the repo suite.
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
- The exact one-page `createServiceQueryUtils` containment rule: the set of pages containing the
  term must remain exactly `[docs/site/reference/sdk/index.md]`. This vocabulary policy
  distinguishes the golden-path `createQueryFactories` dialect from valid reference-only dialect B;
  compilation cannot prove page placement.
- `ALLOWED_FRESH_ROOT_SYMBOLS` and `checkFreshRootImports` unchanged across all docs. The compile
  gate overlaps it on covered fences, but removal is deferred until the compile ratchet covers the
  remaining corpus; this PR must not open an unvalidated window.
- Invocation of `check-exports-drift.ts` unchanged.

Remove, named:

- `defineSaga`/`spawn` source regexes and positive signature/source needles.
- Positive saga markers `event.payload.body`, `type: "=> never"`,
  `options?: SpawnOptions): never`, and the `SagasError.notImplemented(...)` source spelling.
- The eight preferred-path presence needles.
- The three `--with-client` presence checks and the two quickstart path/role needles.
- Only the three positive needles on `docs/site/reference/sdk/index.md`:
  `queryOptions({ input })`, `queryOptions(input)`, and `no server KV tier`. The one-page
  `createServiceQueryUtils` containment remains.
- The 18 hardcoded CLI mutation-family presence needles: `init`, `config set`, `contract add`,
  `contract add-route`, `contract version add`, `service add`, `service set`, `service ref`,
  `db add`, `db init`, `plugin install`, `plugin update`, `generate plugins`,
  `generate runtime-schemas`, `generate aspire`, `ui:init`, `ui:add`, and `deploy`.
Update the existing accuracy tests so they cover the surviving stale-claim, vocabulary-containment,
Fresh-root, and mutation-column policies. Do not change `check-exports-drift.ts` or its tests.

**Reason.** Forbidden vocabulary, required table columns, and dialect page-containment are
inherently textual policy. Export and call-shape truth on covered pages belongs to the compiler;
the Fresh-root guard cannot be removed from the remaining uncovered corpus yet, and
package/reference export-table truth stays in the code-derived drift checker.

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
| 2 | Compiler contract: exact workspace export-map resolver, root-catalog fallback, copied temporary lock, synthetic config/preamble/support fixtures (including the two query-island modules), actual `deno check`, non-exported and dialect-aware red controls plus both dialect green controls. Tests must exercise an `@netscript/sdk` graph that reaches catalog-only `@opentelemetry/api`, prove a green synthetic config with the copied lock, and assert the tracked root lock bytes remain unchanged. | Checker/test/support fixtures; run artifacts. | Scoped wrappers; `deno task docs:snippets:test`; direct non-exported and dialect-A negative commands each exit non-zero. |
| 3 | Tier-1 green floor and demotion: fix the add-service barrel binding, apply 14 reason markers, compile 21 blocks, record the expansion plan, remove only named API needles while retaining containment and Fresh-root guards. | Nine Tier-1 pages as needed; accuracy checker/test; `.llm/tools/docs/snippet-coverage.md`; run artifacts. | `deno task docs:snippets`; `rtk proxy deno task docs:accuracy`; `rtk proxy deno task docs:links`; scoped wrappers. |
| 4 | Site trigger contract and final evidence: Pages owns the snippet step and package/plugin paths; add an unconditional structural workflow assertion and complete all requested gates. | `.github/workflows/pages.yml`; `.llm/tools/docs/pages-workflow_test.ts`; run artifacts. | All three scoped wrappers; `deno task docs:snippets:test` (including the workflow assertion); docs links; docs accuracy; green snippet gate; all three raw red controls; `rtk proxy deno task test`. |

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
   clean the seven `typescript` tags to the canonical `ts` spelling. They are already recognized
   and compiled as `ts` aliases from day one, so this wave is tag cleanup rather than coverage.
5. Non-published source/templates under underscore directories are last and reported separately;
   package READMEs remain #1377.

Each expansion PR must add pages to the checked-in coverage policy, make every new unmarked block
green, add reason markers only for deliberate fragments, lower the outside-floor count, and never
increase the exemption baseline without an explicit reviewer-approved rationale.

The coverage document must name one deliberate window until wave 4: removing the three positive
reference-page needles (`queryOptions({ input })`, `queryOptions(input)`, `no server KV tier`)
means their sanctioned-page presence is not compiler-covered while
`docs/site/reference/sdk/index.md` remains outside the day-one floor. The retained exact one-page
`createServiceQueryUtils` containment still blocks dialect B on every golden-path page; only positive
presence on the one sanctioned reference page is deferred, avoiding continuation of the
false-green needle class this issue removes.

**Reason.** Section-sized ratchets keep fixtures coherent and make coverage movement auditable;
tutorials and references have distinct owners and failure shapes.

## Planned Tier-1 exemptions (14)

| Page / current opening line | Marker reason |
| --- | --- |
| `web-layer/query.md:71` | `uses cache entries defined earlier in the surrounding application` |
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

The three removed candidates are not exemptions. `web-layer/query.md:214` and `:267` compile
against strongly typed materialized `docs.ts` and `todos.ts` support modules. The add-service block
at current line 152 is a documentation defect found by the gate: slice 3 changes it to import
`UsersContractV1` and `UsersV1`, re-export those local bindings, then build `v1` from the imported
`UsersV1`. This is a code-fence correction, not prose expansion, and it must compile unmarked.

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Synthetic compiler config/import-map construction | Resolved now | D2 locks exact declared exports, root-catalog fallback, and a disposable copied lock without `--frozen`. |
| TSX runtime | Resolved now | Preact precompile with exact JSX-runtime import mapping. |
| `isolatedDeclarations` behavior | Resolved now | Disabled only in the synthetic consumer config; strictness remains. |
| CI owner | Resolved now | Pages; `ci.yml` intentionally unchanged except its existing accuracy invocation. |
| Day-one exemption count | Resolved now | 14 exemptions / 21 checked / 35 Tier-1 candidates. |
| `typescript` fence alias | Resolved now | Recognized as `ts` from day one; reference expansion later canonicalizes spelling only. |
| Package README coverage | Safe to defer | Owned by #1377. |

No open decision would force implementation rework.

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Import map accidentally exposes private source | Generate only exact keys from each package's declared `exports`; negative non-exported fixture proves failure. |
| Reachable workspace source imports a catalog-only bare package | Materialize every root catalog key as an npm fallback and exercise the SDK→telemetry→`@opentelemetry/api` graph. |
| Preamble makes fragments falsely green | No ambient application declarations, no `any`, and only explicit strongly typed support modules; partials use reason markers. |
| Dialect test becomes a blanket text ban | Compile a typed dialect-A red fixture and both dialect-A/dialect-B green controls. |
| `isolatedDeclarations` creates consumer-example noise | Disable only that publish-oriented option in synthetic config; retain strict type checks. |
| Relative imports cross-contaminate pages | Page-isolated synthetic roots; duplicates fail within a page. |
| Language rename or exemption count hides coverage loss | Recognize `typescript`, enforce checked/candidate floors and an exemption ceiling, and print per-page reasons. |
| Generated files leak into git | OS temp root plus unconditional `finally` removal; no worktree output. |
| Lockfile churn or synthetic-config frozen failure | Copy the root lock into the temp root, omit `--frozen`, discard the copy, inspect raw git state before each commit, and never reload/delete cache. |
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
| Tier-1 snippet gate | Yes | New task exits 0 and prints `checked=21 exempt=14 outside_floor=260`. |
| Three negative controls | Yes | Each direct fixture command exits non-zero; raw codes/diagnostics recorded. |
| Repo test suite | Yes | `rtk proxy deno task test` exits 0. |
| Runtime/Aspire/browser/E2E CLI | N/A | Compilation-only docs tooling; explicitly excluded. |
| jsr-audit / package quality gate | N/A | No package/plugin implementation or export change. |

## Arch-Debt Implications

No new architecture debt is planned. Existing package verdicts and #1531 remain unchanged. Any
Tier-1 block that requires `any`, `as any`, or `as unknown as` to pass will be recorded in
`drift.md` and left unlegalized for #1278 rather than hidden in the preamble.

## Deferred Scope

- The 260 TS-like blocks outside Tier-1 follow D8's ratchet.
- Seven `typescript` fences are covered by the alias now and canonicalized cosmetically in the
  reference wave.
- Package READMEs, installed-consumer proof, export-drift expansion, and stale generated MCP prose
  stay with their named issues.

## Drift Watch

- A planned checked block needs a cast or permissive fixture.
- Exact workspace exports cannot be derived without a prefix/private mapping.
- The observed Tier-1 census drops below `35 candidates / 21 checked`, exceeds `14 exempt`, or an
  alias rename changes coverage.
- `pages.yml` cannot run the root task without changing lock or install policy.
- A current line/path no longer matches the research baseline after PLAN-EVAL resumes.
