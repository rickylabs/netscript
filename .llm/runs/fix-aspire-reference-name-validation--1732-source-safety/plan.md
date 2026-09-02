# Plan: #1732 background reference-name validation / source safety

## Run Metadata

| Field          | Value                                                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Run ID         | `fix-aspire-reference-name-validation--1732-source-safety`                                                                                                                     |
| Branch         | `fix/aspire-reference-name-validation`                                                                                                                                         |
| Baseline       | `13878a80a50c55b9662099fed64555f2310ae4a3`                                                                                                                                     |
| Phase          | `implementation authorized`                                                                                                                                                    |
| PLAN-EVAL      | cycles 1 and 2 returned `FAIL_FIX`; the owner independently verified and mechanically resolved cycle-2 F1/F2, released the gate, and authorized implementation with no cycle 3 |
| Target         | `packages/aspire` config boundary and the CLI background AppHost generator                                                                                                     |
| Archetype      | `6 — CLI / Tooling` (dominant combined surface; `packages/aspire` remains Archetype 2 Keep)                                                                                    |
| Scope overlays | none                                                                                                                                                                           |

PLAN-EVAL is closed by the owner's bounded release after the final granted cycle. There is no cycle
3. The next formal gate is separately dispatched IMPL-EVAL; this lane must not launch, simulate, or
self-certify it.

## Archetype and Doctrine Position

Archetype 6 governs because the source-safety behavior under repair is generated AppHost TypeScript
emitted by `@netscript/cli`. The companion schema change remains inside `@netscript/aspire`, an
Archetype 2 integration package. No new port, adapter, export entrypoint, folder, or dependency is
warranted.

Current doctrine verdicts:

- `packages/aspire`: **Keep** — preserve SDK-independent contribution and configuration contracts.
- `packages/cli`: **Keep** — preserve the Archetype-6 kernel/surface split.

A1/A2 make the observable `parseAppSettings` contract explicit before implementation. A7 favors
native `JSON.stringify` over a custom escaping helper. A8 keeps the new grammar definition in a
focused internal Aspire domain module. A14 requires semantic RED tests and static gate evidence.

## Goal

Make generated background AppHost source parseable for every input name independently of grammar
correctness, then reject names outside Aspire 13.4.6's default resource-name contract at config
parse time with deterministic, contextual diagnostics. Preserve accepted hyphenated resource names
and the exact raw `services__<ref>__http__0` environment-key contract verified in #1371.

## Locked Decisions

### D1 — Source-safe literals and bindings are the load-bearing property

Every config-derived string emitted into a TypeScript string-literal position will pass through
`JSON.stringify`. Every generated binding will be derived locally from fixed prefixes and stable
ordinals so its validity and uniqueness do not depend on user input:

- processor bindings are exactly `bg_${processorIndex}`;
- service-reference bindings are exactly `ref_service_${processorIndex}_${referenceIndex}`;
- plugin-reference bindings are exactly `ref_plugin_${processorIndex}_${referenceIndex}`.

No user-supplied text participates in identifier derivation. The fixed prefixes make reserved words
irrelevant, and the ordinals guarantee uniqueness even when distinct names would sanitize alike. No
generated binding can equal `builder`, `config`, `infrastructure`, `_services`, `_plugins`, or
another generator binding. The shared `_utils.ts` and `safeIdentifier(...)` implementation remain
untouched; the background generator simply stops relying on it for emitted bindings. No shared
identifier policy or exported helper is introduced.

This is implemented before the grammar lock because the grammar is derived from upstream Aspire
source, release documentation, and a maintainer discussion—not from executing Aspire in this leaf.
The run has no runtime lease and must not start Aspire. If that documentation-derived grammar is
wrong in the loose direction, source-safe literals plus collision/reserved-safe bindings still
guarantee parseable generated TypeScript. The defect then degrades to an inaccurate or delayed
validation diagnostic; it can never regress to the original syntax error or a binding-shadowing
`ReferenceError`. Making grammar the only defense would leave those defects reachable whenever the
documentation-derived rule misses an input.

Slice 2 enumerates emissions by site rather than name origin:

1. `config.BackgroundProcessors[...]`, `builder.addExecutable(...)`, `buildOtelEnvVars(...)`, and
   `backgroundProcessors.set(...)` stringify the processor name;
2. `_services.get(...)`, `_plugins.get(...)`, and the corresponding discovery environment keys
   stringify each reference name without normalizing the key;
3. the resolved `entrypoint` and `workdir` arguments are stringified unconditionally, whether
   defaulted or user-supplied through `Entrypoint` / `Workdir`;
4. the `ConcurrencyEnvVar` environment key is stringified whenever that conditional binding is
   emitted;
5. the already-safe `entryPermissions` / `defaultPermissions` (lines 64/68) and `sagaStoreBackend`
   (line 136) retain their existing `JSON.stringify` calls;
6. the already-safe `watchMode` is emitted as a boolean (line 69), and `entry.Concurrency` remains
   in its numeric code position (line 167). It must not be stringified: `JSON.stringify` maps a
   non-finite number to `null`, while this emission site is code rather than a string literal.

No user text remains in the comment site: it becomes `// --- processor <ordinal> ---`. Traceability
remains on the immediately following stringified config lookup and executable call. Neutralizing
`\n`, `\r`, U+2028, and U+2029 specially in the comment would invent a second escaping mechanism
used nowhere else, with its own test and maintenance contract. The ordinal comment makes source
safety structural at that site and introduces no new churn class because bindings already use the
same processor ordinals. Inserting a processor mid-config can therefore churn subsequent ordinal
bindings and comments in user-committed generated helpers; that deterministic diff noise is accepted
in exchange for binding validity and collision safety.

Existing error messages already use `JSON.stringify` and remain so. Static internal
`RESOURCE_DEFAULTS` literals are not config-derived and remain unchanged. The now-unused
`safeIdentifier` import is removed from the background generator.

### D2 — Exact Aspire grammar is layered above escaping

The config boundary will enforce exactly this default Aspire resource-name rule:

- length 1–64;
- first character is an ASCII letter (`A-Z` or `a-z`);
- remaining characters are ASCII letters, digits, or hyphens;
- no consecutive hyphens;
- no trailing hyphen.

The grammar is neither the lowercase-only scaffold rule nor a normalization rule. Uppercase names
remain accepted. Underscores, quotes, backslashes, backticks, leading digits, consecutive/trailing
hyphens, and over-64-character names are rejected; inputs are never silently rewritten.

### D3 — A separate private module owns the platform rule

Define `ASPIRE_RESOURCE_NAME_PATTERN` once in `packages/aspire/src/domain/aspire-resource-name.ts`,
alongside an `ASPIRE_RESOURCE_NAME_RULE` diagnostic description if needed to avoid duplicating the
platform rule in error messages. `packages/aspire/config.ts` consumes that definition through a
relative internal import. Do not reuse or alter `SCAFFOLD_VALIDATION.NAME_PATTERN`: it is
lowercase-only and would reject platform-valid uppercase names.

The Aspire platform rule is a package-internal parsing invariant, not a consumer extension point.
Publishing it through the existing `@netscript/aspire/constants` export would permanently enlarge
the JSR surface without a demonstrated external caller. The export map and public constants module
therefore remain unchanged. The private module still receives clear local documentation and focused
tests, but it does not create a new published symbol or JSDoc obligation.

Slice 3 must not re-export the rule through `packages/aspire/src/domain/mod.ts`, any package barrel,
or any export-map entry, and must not expose it in the type of an exported symbol. `config.ts` uses
the values only inside composed validation implementation so the rule remains absent from `deno doc`
and published JSON-schema types.

The pattern will encode the entire rule in one place so a future platform-driven relaxation is a
one-line contract change backed by the constant's boundary tests.

### D4 — Background-only contextual validation

Apply the grammar to:

1. each key under `NetScript.BackgroundProcessors` (reference kind `processor name`);
2. every `ServiceReferences` value on that processor;
3. every `PluginReferences` value on that processor.

Validation belongs in the `NetScriptConfig` Zod composition where both the processor key and its
reference arrays are available. This avoids broadening the observable change to reference fields on
services, apps, or plugins, whose generators are outside #1732. Each custom issue will carry the
precise Zod path and a deterministic message naming:

- the processor;
- the reference kind (`processor name`, `ServiceReferences`, or `PluginReferences`);
- the rejected name;
- the Aspire resource-name rule that rejected it.

Validation runs as part of `AppSettingsSchema` / `parseAppSettings`, before helper generation. It
remains a composed-level `superRefine` / `check` on the background object. Slice 3 must not place
`.regex()` on shared `ReferenceFields` or the record key: doing so would surface through
`z.toJSONSchema(AppSettingsSchema)` in `packages/aspire/schema.ts` and change published JSON-schema
output for sections outside D4's boundary.

### D5 — Compatibility position

`a--b`, `a-`, and names longer than 64 characters become rejected at config parse. They are not
runnable Aspire resource names today—Aspire 13.4.6 rejects them—so this moves an existing failure
earlier and supplies a better message. It does not remove working Aspire behavior.

This is nonetheless an observable change to what `parseAppSettings` accepts. It is an intentional
**fail-fast correction**, not a no-op. The PR body must state this position, cite the upstream
platform rule, and explicitly disclose that the grammar was documentation/source-derived rather than
runtime-executed in this no-lease leaf.

## Per-Path Change Plan

| Path                                                                                                       | Planned change                                                                                                                                                                                                           | Why this path owns it                                                                                                                                          |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/aspire/src/domain/aspire-resource-name.ts`                                                       | Add the separately named exact Aspire resource-name pattern and canonical rule text as package-private exports.                                                                                                          | Keeps an internal parsing invariant reusable by config/tests without permanently expanding the JSR-published constants surface.                                |
| `packages/aspire/config.ts`                                                                                | Add background-processor key/reference validation at the composed config boundary with contextual Zod issues.                                                                                                            | This is the earliest boundary that knows the processor, reference kind, and rejected value and runs before generation.                                         |
| `packages/aspire/tests/config_test.ts`                                                                     | Add table-driven boundary cases for processor names and both reference kinds.                                                                                                                                            | Existing semantic contract tests for `AppSettingsSchema` and `parseAppSettings`; proves diagnostics and accepted/rejected grammar.                             |
| `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-background.ts`                | Stringify every config-derived literal emission; derive processor/reference bindings from generator-local prefixes plus stable ordinals; leave shared `safeIdentifier` untouched.                                        | This is the only generator in #1732; it owns both the raw-literal seam and the accepted reserved/shadowing identifier seam.                                    |
| `packages/cli/src/kernel/templates/aspire/helpers/tests/generate-register-background_test.ts`              | Add semantic generated-module parse/execution and exact discovery-key tests across the required matrix; update existing assertions that pin single-quote spelling while retaining the full positive discovery-key count. | Existing focused executable test harness for this generator; avoids AP-18 giant-string snapshots without weakening current coverage.                           |
| `packages/cli/src/kernel/templates/aspire/helpers/tests/generators-background-app_test.ts`                 | Update narrow expectations that pin current processor identifiers and single-quoted literal spelling; preserve semantic assertions.                                                                                      | Existing tests pin `workers`/`benchmark`/`triggers` binding text and raw lookup/key literals that slice 2 intentionally changes.                               |
| `packages/cli/e2e/src/application/gates/scaffold/prepare-flow-b-fixture.ts`                                | Update the fixture's generated-helper anchors and derive the new processor binding from the surviving `workers` executable call; do not execute E2E.                                                                     | The merge-readiness fixture consumes the exact helper shape changed by slice 2 and otherwise breaks before `scaffold.runtime` can exercise its owned behavior. |
| `.llm/runs/fix-aspire-reference-name-validation--1732-source-safety/{worklog.md,context-pack.md,drift.md}` | Update only in later slices with RED output, commit SHAs copied from Git, reconcile notes, and final-head receipts.                                                                                                      | Harness evidence and resumability; no implementation claim lives only in chat.                                                                                 |

## Required Test Matrix

The RED tests cover all three input positions: processor name, `ServiceReferences`, and
`PluginReferences`.

| Input class        | Example              | Generator source-safety expectation                         | Config-boundary expectation                                     |
| ------------------ | -------------------- | ----------------------------------------------------------- | --------------------------------------------------------------- |
| single quote       | `it's`               | parseable when generator is invoked directly                | reject contextually                                             |
| backslash          | `back\\slash`        | parseable when generator is invoked directly                | reject contextually                                             |
| backtick           | ``tick`name``        | parseable when generator is invoked directly                | reject contextually                                             |
| hyphen             | `workers-api`        | parseable; raw discovery key preserved exactly              | accept                                                          |
| underscore         | `workers_api`        | parseable when generator is invoked directly                | reject contextually                                             |
| ordinary           | `workers`            | parseable and behavior unchanged                            | accept                                                          |
| reserved word      | `class`              | parse and execute; binding cannot be `class`                | accept; platform-valid                                          |
| async reserved     | `await`              | parse and execute; binding cannot be `await`                | accept; platform-valid                                          |
| generator binding  | `builder`            | parse and execute without TDZ/shadowing                     | accept; platform-valid                                          |
| uppercase boundary | `Workers-API2`       | parseable                                                   | accept; prevents accidental reuse of lowercase scaffold grammar |
| consecutive hyphen | `a--b`               | parseable when generator is invoked directly                | reject as fail-fast correction                                  |
| trailing hyphen    | `a-`                 | parseable when generator is invoked directly                | reject as fail-fast correction                                  |
| length boundary    | 64 and 65 characters | both parseable when generator invoked directly              | accept 64; reject 65                                            |
| comment terminator | `a<U+2028>b`         | direct generator output parses; no name in comment position | reject contextually at config boundary                          |

For invalid references, fixtures must also define the referenced service/plugin where necessary so
cross-reference existence warnings cannot mask the name-rule diagnostic. The hyphen test asserts the
exact key `services__workers-api__http__0` and explicitly rejects normalized alternatives such as
`services__workers_api__http__0`.

The first RED run records the actual failing test names and diagnostics before any production code
changes. Inputs already safe at baseline (for example a backtick inside a single-quoted literal) may
pass individually; the committed RED slice is valid only when the suite as a whole demonstrates the
known quote/backslash source failures and missing config rejection.

`class`, `await`, and `builder` are exercised as processor names and in both reference kinds where
bindings are derived. They must be accepted by config validation and the generated module must both
parse and execute. Direct-generator cases also prove quote/backslash/backtick-safe bindings even
though the config boundary rejects those values. Separate fixtures inject quoted/backslashed
user-supplied `Entrypoint`, `Workdir`, and `ConcurrencyEnvVar` values and prove the generated module
parses. A direct-generator U+2028 processor-name case proves the generated module parses with no
user text in comment position; this pins the cycle-2 F2 correction by emission site.

## Commit Slices

| # | Slice and proof                                                                                                                                                                                                                                                                                                              | Gate                                                                                                                                    | Files                                                                             |
| - | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| P | **Plan only:** lock compatibility, ordering, exact paths, risks, tests, and published-surface position; stop for real PLAN-EVAL.                                                                                                                                                                                             | Human review, then separate PLAN-EVAL                                                                                                   | complete run-artifact set                                                         |
| 1 | **Visible RED:** add the complete generator/config test matrix, including reserved/shadowing bindings and config-derived non-name literals, and record baseline failures before implementation. Commit remains intentionally red and is pushed/commented as RED evidence.                                                    | Focused structured wrapper over `config_test.ts` + `generate-register-background_test.ts`; expected nonzero with captured failing tests | those two test files + run artifacts                                              |
| 2 | **Source-safe emission and bindings:** stringify every enumerated config-derived literal; use exact ordinal-backed `bg_` / `ref_service_` / `ref_plugin_` bindings; replace the user-derived comment with an ordinal; update existing narrow text assertions and the flow-B fixture honestly while grammar tests remain red. | Focused generator tests and scoped check/lint/fmt; fixture edit only, with no E2E execution                                             | background generator + both generator test files + flow-B fixture + run artifacts |
| 3 | **Grammar lock:** define the exact separate private rule module and add composed-level contextual background validation without JSON-schema broadening; make the full focused matrix green.                                                                                                                                  | Focused config and generator tests; scoped check/lint/fmt                                                                               | Aspire private rule/config + run artifacts                                        |
| 4 | **Final static evidence and handoff:** run every authorized final-head gate, record exact copied SHAs/receipts, reconcile the GitHub surface, and update the draft PR.                                                                                                                                                       | Full static gate table below                                                                                                            | run artifacts only unless a gate exposes an in-scope fix                          |

Slice 2 updates `prepare-flow-b-fixture.ts` under this exact contract:

1. locate the `workers` block by the surviving stringified `builder.addExecutable("workers",` call
   (or equivalently the stringified `config.BackgroundProcessors["workers"]` lookup), never by the
   comment marker;
2. derive its binding by matching `const (bg_\d+) = builder.addExecutable("workers"`; do not
   hardcode `workers` as a binding and do not pin a literal ordinal, because scaffolded processor
   order determines that ordinal;
3. update the `.set(...)` replace anchor to its stringified form and construct the injected
   `withEnvironment` call from the derived binding.

This is a fixture edit, not E2E execution. This no-lease leaf does not fire `scaffold.runtime`; that
suite remains a merge-readiness responsibility.

The owner released PLAN-EVAL after the second and final cycle with these bounded mechanical
corrections. Slices now follow this order, receive substantive review before sign-off, commit
atomically, push with the explicit refspec, and post their scope/SHA/evidence on the draft PR. The
draft remains draft; this lane does not trigger IMPL-EVAL.

## Validation Plan

No runtime lease, Aspire, Docker, browser, `scaffold.runtime`, `e2e:cli`, or root `deno task test`
is permitted. The host's unreapable zombie processes make the root test task an invalid signal; it
will be reported **NOT FIRED**, never PASS.

Every final receipt must be produced at the final pushed head. Type-check, test, lint, and format
evidence comes from the structured wrappers or their wrapped root tasks.

| Order | Gate                        | Command / evidence contract                                                                                                | Expected result                                                                                                   |
| ----- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 1     | Focused tests               | `.llm/tools/run-deno-test.ts` over the three changed test files                                                            | RED before implementation on the two matrix files; all three PASS at final head                                   |
| 2     | Focused check               | `.llm/tools/run-deno-check.ts` over the changed Aspire/CLI TypeScript surface with `--unstable-kv` where delegated to Deno | nonempty selection, PASS                                                                                          |
| 3     | Focused lint                | `.llm/tools/run-deno-lint.ts` over changed source/test paths                                                               | nonempty selection, PASS                                                                                          |
| 4     | Focused format              | `.llm/tools/run-deno-fmt.ts` over changed source/test paths                                                                | nonempty selection, PASS                                                                                          |
| 5     | Root structured check       | `deno task check`                                                                                                          | PASS                                                                                                              |
| 6     | Root test                   | **NOT FIRED by owner instruction**                                                                                         | record host constraint; do not substitute a false green                                                           |
| 7     | Root structured lint        | `deno task lint`                                                                                                           | PASS                                                                                                              |
| 8     | Root structured format      | `deno task fmt:check`                                                                                                      | PASS                                                                                                              |
| 9     | Code-quality scan           | `deno task quality:scan`                                                                                                   | PASS with `allowCount` remaining exactly 7                                                                        |
| 10    | Doctrine fitness            | `deno task arch:check`                                                                                                     | PASS                                                                                                              |
| 11    | Asset barrel                | `deno task check:assets-barrel`                                                                                            | PASS with no generated diff; canonical regeneration only if this gate proves an owned asset moved                 |
| 12    | Aspire doc-lint comparison  | `deno task doc:lint --root packages/aspire --pretty`                                                                       | No new finding versus pre-change exit 1: zero missing JSDoc/combined errors; existing private-type refs only      |
| 13    | Aspire JSR audit comparison | `deno run --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/aspire --text`      | No new finding versus pre-change exit 1: four F-JSR-2 failures + one F-JSR-7 warning; internal dry-run remains OK |
| 14    | Generated-source semantics  | focused tests parse/import the generated helper for every matrix row and assert accepted runtime keys                      | PASS                                                                                                              |

The pre-change published-surface baselines were captured on 2026-08-30 at
`13878a80a50c55b9662099fed64555f2310ae4a3`: doc-lint reports no missing JSDoc and no combined
publish errors but exits 1 for existing private-type references; the JSR audit exits 1 with four
existing missing-`@module` failures and one slow-types warning while its publish dry-run is OK.
These are attributable baselines, not green gates. The implementation may add neither a public
export nor a new warning/failure.

## Risk Register

| Risk                                                                                                                        | Mitigation / evidence                                                                                                                                                    |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Documentation-derived Aspire grammar differs from executable 13.4.6 behavior because this leaf cannot take a runtime lease. | Make `JSON.stringify` the load-bearing safety property; disclose the unexecuted assumption in plan/PR; exact private rule makes a later correction one line plus tests.  |
| Reusing the lowercase scaffold pattern rejects platform-valid uppercase names.                                              | New private `ASPIRE_RESOURCE_NAME_PATTERN`; uppercase acceptance test; do not touch/import `SCAFFOLD_VALIDATION.NAME_PATTERN`.                                           |
| A package-internal invariant accidentally becomes permanent JSR API.                                                        | Keep the rule under `packages/aspire/src/domain/`; do not barrel it or expose it in exported types; compare doc-lint and JSR-audit baselines.                            |
| Schema validation broadens beyond background processors or changes published JSON schema.                                   | Use a composed-level custom issue only; do not attach `.regex()` to shared `ReferenceFields` or record keys.                                                             |
| Literal escaping fixes named sites but misses config-derived `Entrypoint`, `Workdir`, or `ConcurrencyEnvVar`.               | Enumerate by emission site; stringify resolved entrypoint/workdir unconditionally and the concurrency key whenever emitted.                                              |
| A processor name containing a line terminator escapes string positions but breaks a generated comment.                      | Remove user text from the comment site entirely; emit only the processor ordinal and parse a direct-generator U+2028 case.                                               |
| Name-derived bindings emit reserved words, invalid tokens, collisions, or shadow generator bindings.                        | Remove user text from background binding derivation; use exact ordinal-backed `bg_`/`ref_service_`/`ref_plugin_` identifiers; parse+execute `class`, `await`, `builder`. |
| Ordinal-backed bindings create source churn when a processor is inserted before existing entries.                           | Accept deterministic helper diff noise; fixture derives the `workers` binding rather than pinning an ordinal, and semantic tests avoid ordinal snapshots.                |
| Existing tests fail from intentional identifier or quote-style churn and are weakened to get green.                         | Update only narrow output-spelling assertions in both generator test files; retain/strengthen semantic execution and discovery-key assertions.                           |
| Sibling service/plugin/app generators retain the pre-existing identifier exposure.                                          | Record in drift/PR and leave those generators untouched; the owner carries the cross-generator concern upstream.                                                         |
| Discovery-key normalization breaks #1371 contract.                                                                          | Exact raw hyphenated-key assertion and negative underscore-normalization assertion.                                                                                      |
| Cross-reference validation masks grammar errors.                                                                            | Build complete service/plugin fixtures and assert exact contextual name-rule diagnostics.                                                                                |
| Host resource exhaustion produces unrelated failures.                                                                       | Focused wrapper tests only; root test NOT FIRED; never stop a process this run did not start.                                                                            |
| Generated assets or lockfile drift appear during gates.                                                                     | No asset/template/lock changes planned; inspect and exclude unrelated churn; never delete/reload caches or lock files.                                                   |

## Anti-Patterns and Fitness Concerns

| Concern                                | Plan                                                                                                                                         |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| AP-2 / A7 custom escaping helper       | Avoid: use `JSON.stringify` directly at emission sites.                                                                                      |
| AP-9 duplicate validation policy       | Avoid: one named private Aspire rule, not the scaffold constant and not copied regexes.                                                      |
| AP-18 giant generated-string snapshots | Avoid: parse/import generated source and assert semantic lookup/key behavior plus narrow fragments only where literal shape is the contract. |
| F-5 public surface                     | No export-map, root entrypoint, or public constants expansion; the rule stays under `packages/aspire/src/domain/`.                           |
| F-10 test shape                        | Extend two matrix files and update one existing narrow-assertion file without creating a monolithic snapshot suite; review final sizes.      |
| F-19 evidence                          | Use scoped/root structured wrappers, never raw root check/test/lint/fmt commands as verdicts.                                                |

No new or deepened architecture debt is expected. Any implementation reality that requires another
package, another generator family, scaffold validation harmonization, or runtime proof is a rescope
and returns to the owner before edits.

## Deliberately Untouched

- `packages/cli/src/kernel/constants/scaffold/scaffold-validation.ts` and scaffold service-name
  validation: known looser producer behavior is documented compatibility context, not this leaf's
  fix. In particular, do not tighten or reuse its lowercase pattern.
- `packages/cli/src/kernel/templates/aspire/helpers/_utils.ts`: shared `safeIdentifier` is too weak
  to guarantee valid/collision-safe bindings but remains unchanged; slice 2 uses background-local
  ordinal identifiers instead of changing the cross-generator policy.
- Service, plugin, and app registration generators retain the evaluator-confirmed pre-existing
  identifier exposure; the owner carries that cross-generator concern upstream. Tool,
  infrastructure, and database registration generators also remain outside #1732. None of those
  files may change in this leaf.
- Generic `ReferenceFields` behavior for non-background entries, unless the contextual Zod
  composition can reuse its value schema without changing those sections' acceptance.
- #1728 fail-fast endpoint behavior, #1365, apps registration, `packages/sdk`, and runtime behavior.
- `packages/aspire/src/domain/mod.ts`, public constants, exported symbol types, export maps,
  dependency versions, `deno.lock`, generated asset barrels, docs, release metadata, issue labels,
  and issue status.
- Runtime/E2E activity, publication, merge/readiness transitions, issue closure, and IMPL-EVAL
  dispatch.

## Open-Decision Sweep

Cycle 1 correctly found that the previous sweep was incomplete. The following decisions are now
resolved before cycle 2:

- **Identifier seam — resolved, must not defer:** choose option (a), with exact ordinal-backed
  generator-local bindings and no user text in emitted identifiers. Do not reject platform-valid
  reserved words and do not change shared `safeIdentifier`.
- **Non-name literals — resolved, must not defer:** stringify resolved `entrypoint` and `workdir`
  unconditionally, stringify `ConcurrencyEnvVar` whenever emitted, retain already-safe string and
  boolean emissions, and leave numeric `entry.Concurrency` in code position.
- **Comment site — resolved, must not defer:** remove user text and emit the processor ordinal;
  direct-generator U+2028 coverage proves parseability without a bespoke comment neutralizer.
- **Flow-B fixture — resolved, must not defer:** locate `workers` by a stringified executable/config
  anchor, derive `bg_\d+`, update the stringified `.set(...)` anchor, and inject through that
  derived binding without executing E2E in this leaf.
- **Validation/schema placement — resolved, must not defer:** composed-level custom validation only;
  no shared-field/record-key regex and no published JSON-schema broadening.
- **JSR reachability — resolved, must not defer:** no domain barrel, export-map entry, or exported
  type may expose the private rule.
- **Sibling generators — safe to defer and explicitly out of scope:** record the known exposure; the
  owner carries it upstream, and this leaf changes no sibling generator.

No implementation decision remains open after those resolutions. PLAN-EVAL cycle 2 was the final
granted cycle; after independently verifying F1/F2, the owner supplied the satisfying conditions
above, released the plan gate without a cycle 3, and authorized the RED slice. IMPL-EVAL is the next
formal gate and remains owner-dispatched.
