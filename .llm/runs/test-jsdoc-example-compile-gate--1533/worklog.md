# Worklog: JSDoc `@example` compile gate

## Metadata

| Field | Value |
| --- | --- |
| Run ID | `test-jsdoc-example-compile-gate--1533` |
| Issue | `#1533` |
| Branch | `test/jsdoc-example-compile-gate` |
| Current phase | `implementation` — bounded PLAN-EVAL amendment authorized; IMPL-EVAL is next formal gate |
| Archetype | `6 — CLI / Tooling`, proportionate internal-tool application |
| Overlay | `docs` |

## Public Surface

The proposed public surface is repository tooling only:

- root tasks `docs:jsdoc-examples` and `docs:jsdoc-examples:test`;
- durable gate-catalog id `jsdoc-example-compile`;
- deterministic command output containing census, exemptions, and diagnostics.

No package export, consumer TypeScript API, executable, dependency, or version changes are planned.

## Design Checkpoint

### Domain types

- `JsdocExampleOwner`: published member, source/declaration, owner kind, optional symbol, and public
  specifier.
- `JsdocExampleBlock`: owner plus tag/fence ordinals, language, source text, and source location.
- `JsdocExampleAnalysis`: checked candidate, reviewed exemption, non-TypeScript documentation, or
  malformed policy.
- `JsdocExampleCensus`: stable totals for examples, candidates, checked blocks, exemptions,
  non-TypeScript blocks, malformed blocks, and failures.
- `JsdocExampleFloor`: minimum corpus/check counts and maximum exemption count learned after the
  first reviewed run.
- `JsdocExampleCompilationResult`: exit code, diagnostics mapped to owners, elapsed time, cleanup,
  and lock-preservation evidence.
- `PublicSymbolBinding`: exact Deno declaration identity mapped to one deterministic shipped
  specifier.

### Ports and effects

- `deno doc --json` is invoked through a narrow command-runner seam and decoded into the domain
  contract; extraction/policy/de-duplication are pure.
- A reusable synthetic-module checker owns temporary files, copied lock state, one `deno check
  --unstable-kv`, diagnostic remapping, and `finally` cleanup.
- Publish-member and publish-file discovery remain at the filesystem edge and reuse the release
  tooling rather than duplicating rules.
- The CLI edge formats the deterministic census and selects exit status; CI invokes that command
  through the existing durable receipt runner.

### Constants and policy

- Checked fence languages reuse the existing `ts` / `tsx` / `typescript` set.
- Exemptions reuse exact opening-fence syntax `no-check:<nonblank reason>`.
- The corpus floor is populated from the reviewed first GREEN run, not guessed in PLAN.
- The only built-in app aliases are those backed by scaffold-generator alignment tests.
- Root task and catalog identifiers are the values locked by D15.

### Archetype-6 proportional checkpoint

This is one internal command, not a new CLI package. It intentionally has no abstract CLI spine,
feature registry, composition root, dependency-injection container, or command README. Its small
flow is discovery → policy → compile → report. Filesystem/subprocess effects sit at edges; Deno
permissions are explicit in the root task; semantic tests cover behavior and cleanup. This is the
minimum structure that satisfies the applicable tooling fitness gates without creating a local
framework.

### Semantic test strategy

- Public-symbol convention: omitted documented-symbol import compiles for `const`, `type`, and class
  (value+type) declarations; unrelated missing names do not become visible; explicit import may
  shadow the injected ambient binding.
- Export fidelity: declared subpaths compile; undeclared `@netscript/*` subpaths fail; a re-exported
  declaration is checked once through the deterministic specifier.
- Historical controls: both relative-import defect shapes fail even if a temporary path could
  resolve them.
- Documentation policy: fenced TypeScript is checked; explicitly labelled non-TypeScript is
  counted; unfenced and bare-fence examples plus malformed/blank exemptions fail; valid exemptions
  print their source-local reason and cannot excuse bad imports/subpaths or real signature errors.
- Scaffold fidelity: canonical aliases pass only with generator alignment; arbitrary aliases fail.
- Hygiene: copied lock and source tree remain unchanged, temporary outputs are removed on success
  and failure, and diagnostics retain owner/fence provenance.
- Empty selection: zero candidates and zero checked modules each fail before `deno check` is
  spawned and print the refusing census condition.
- Ratchet: silent corpus shrink or exemption growth fails; checked-count growth and exemption
  reduction pass.
- RED checkpoint: commit N split by bad specifier / type error / unbound name / unfenced / malformed
  and evaluate the 25-package / 90-example / eight-type-error ceilings before any repair.
- Render policy: preview at least one exempted example to prove highlighting survives and the
  reason text does not leak into the rendered page.
- Workflow: catalog task and quality-job receipt wiring are both structurally asserted.

## Commit Slices

| Slice | Status | Commit / evidence |
| --- | --- | --- |
| B0 Bootstrap + re-baseline | complete | `a1a4328ba4706f3fe8e7c541e43763975a8df485`; research evidence pushed |
| P1 Plan + Design checkpoint | complete | `0f30c4f4bd2c9e7b615dfc776f05d7b2c0c4bf93` |
| P2 PLAN-EVAL bounded amendment | complete | `551f4edc81807df755de5e745e5e7ceba3a3ee39`; `plan-eval.md` unchanged |
| I1 Contracts + reusable publish discovery | complete | Domain contracts plus publish-rule-selected source discovery; targeted check PASS |
| I2 Extractor/mapping/compiler implementation | complete | Structured Deno-doc policy, published-only resolver, isolated compile runner |
| I3 Semantic tests + visible classified live-corpus RED | complete | 9 semantic tests PASS; corpus RED 165 by class; `red-census.md` |
| I3a Deterministic diagnostic attribution | complete | Color-on/off corpus runs both classify 165 failures from 262 diagnostics |
| I4 Narrowed-contract repairs/deferred ratchets | complete | Enforced gate GREEN at 0 failures; classifier artifact/ratchets remain 116 + 21 |
| I5 Task/catalog/CI wiring | complete | Blocking quality receipt enabled after independently verified GREEN |
| I6 Final validation + IMPL-EVAL handoff | pending | Final evidence slice |

## Owner Decision — 2026-08-30

The coordinator authorized rescope option 1 after the authoritative census breached D14. The gate's
blocking assertion is now published import-specifier integrity plus fence-language integrity: 27 bad
specifiers and one malformed bare fence are repaired in-leaf. The compiler still measures all body
diagnostics, but the 116 unbound-name and 21 published-API type-error examples are emitted as
classifier-owned deferred lists, capped against growth, and left untouched for follow-up issues.

Rationale: this closes the exact #1425 consumer-layout defect that motivated #1533 without turning a
bounded gate leaf into a 137-example documentation/API campaign. Deferred classes are neither
exemptions nor a claim that bodies compile. CI enforcement remains off until the 28 enforced
failures are repaired and the narrowed contract is locally green; it is enabled only afterward.

## Contributor Path

1. Run `deno task docs:jsdoc-examples:test` while changing policy/tooling.
2. Run `deno task docs:jsdoc-examples` to check the current published JSDoc corpus.
3. Read the census first, then any source-attributed exemptions and diagnostics.
4. Repair genuine compile errors. Use a reasoned source marker only for intentionally partial
   TypeScript and expect the maximum-exemption ratchet to require review.
5. Use the durable catalog gate for merge evidence; do not treat compressed exploratory output as
   the receipt.

## Locked Decisions

`plan.md` D1–D17 are the authority. The especially consequential decisions are published-only
scope (D1), Deno-owned extraction (D2), exact single-symbol injection (D6), compile-only isolation
(D8), repair-without-failure-baseline (D12), measured coverage ratchet (D13), and quality-job
receipt wiring (D16).

## Drift Ledger

| Claim / possible divergence | Re-verification | Disposition |
| --- | --- | --- |
| Four contracts examples import from a non-exporting root | Re-ran export-map and `deno doc --filter` checks against the actual `query` / `transform` subpaths | Carried claim is false; corrected in `research.md` and must not be propagated. |
| Pagination example is a genuine failure | Compiled the exact fenced TypeScript as a temporary package-root probe | Confirmed TS2304 for `baseContract` and `UserSchema`; probe removed. |
| `.llm/tmp` is suitable for an exact compile probe | Initial check selected no files because the path is excluded | Recorded research-method drift; repeated from a temporary package-root file and removed it. |
| PLAN-EVAL result versus normal hard stop | Cycle 1 returned `FAIL_FIX`; owner supplied all bounded decisions, forbade cycle 2, and authorized implementation after amendment | Significant authorized workflow drift; `plan-eval.md` remains unchanged. |

Append future divergence to `drift.md`; do not rewrite the locked plan silently.

## Gates

| Gate | State |
| --- | --- |
| Research accuracy | CORRECTED — mechanism false, six cited examples genuinely defective |
| PLAN-EVAL | `FAIL_FIX` at `0f30c4f4…`; immutable verdict commit `9b34b657…`; owner-authorized amendment path, no cycle 2 |
| Implementation gates | NOT RUN — implementation has not begun |
| Expensive runtime gates | OUT OF SCOPE / NO LEASE |

## Slice Evidence

### I1 — contracts and publish discovery

- Defined ownership, block, disposition, census, floor, public-binding, classified-failure, and
  compilation-result contracts before implementation.
- Exported the existing release preflight's publish-rule-selected TypeScript file discovery instead
  of creating a second include/exclude implementation.
- `deno check --unstable-kv .llm/tools/docs/jsdoc-example-contract.ts
  .llm/tools/release/preflight-text-imports.ts` — PASS.
- Reconcile: #1533 remains open and owned only by draft PR #1756; closing keyword, milestone 0.0.7,
  and `status:impl` are current; no new reviewer comment changes the amended plan.

### I2 — extractor, public binding, and compiler

- Added concurrent `deno doc --json` loading over publish-rule-selected files, entrypoint-derived
  exact declaration bindings, structured fence policy, symbol de-duplication, and deterministic
  census formatting.
- Added published-only workspace resolution, relative/absolute and undeclared-subpath refusal,
  per-symbol ambient preambles, copied-lock isolation, diagnostic mapping, and pre-spawn empty
  selection refusal.
- Targeted `deno check --unstable-kv` over all owned tool modules — PASS.
- Real corpus extraction probe: `members=35 files=2020 examples=353 candidates=352 checked=352
  exempt=0 malformed=1`, elapsed 23.6s. This is preliminary I2 evidence, not the committed I3 RED
  classification.
- Compile probe spawned one non-executing Deno check, preserved the root lock, and exposed the
  expected live RED surface; classification tests and the authoritative N remain I3.
- Structured lint wrapper refused the `.llm` explicit files because Deno excludes the hidden tree;
  this is recorded as a non-verdict, not a PASS. Formatting and root structured gates remain I6.
- Reconcile: PR #1756 is still draft/`status:impl`; no issue/PR comment changes scope or ceilings.

### I3 — semantic controls and classified RED

- Added controls for bare versus labelled fences, attributable reasoned markers, published-only
  export selection, zero candidate/checked refusal, both historical bad-specifier shapes, exempt
  bad imports, explicit-import shadowing, and `const` / `type` / class value+type injection.
- Targeted check — PASS. Structured focused tests — PASS, 9/9 in 2.7s.
- Live corpus assertion — expected RED, exit 1. Corpus: 35 members, 2020 files, 349 tags, 348
  TypeScript candidates, zero exemptions, one malformed fence.
- Exclusive failure N: bad specifier/import 27; type error 21; unbound name 116; unfenced 0;
  malformed 1; total failing examples 165. Full bounded evidence is `red-census.md`.
- D14 decision: STOP before I4. Mechanical-class repairs total at least 144 (>90), and the type-error
  class is 21 (>8). No baseline/exemption or public-doc repair was made.
- Reconcile: the new measured scope materially exceeds the owner-set repair ceilings; the draft PR
  remains `status:impl` pending supervisor rescope, with IMPL-EVAL not launched.

### I3a — deterministic diagnostic attribution

- Supervision exposed an ANSI-sensitive attribution defect: the same 262 compiler diagnostics were
  classified as 24 failures with color and 165 with `NO_COLOR=1`.
- The subprocess now owns deterministic `NO_COLOR=1` output, and classification/mapping receives
  ANSI-normalized text as a defensive second boundary.
- Regression: compiler tests PASS, 7/7, including identical three-class attribution for plain and
  ANSI-decorated fixture diagnostics.
- Full corpus with `NO_COLOR=1`: expected RED, 165 failures (`badSpecifier=27`, `typeError=21`,
  `unboundName=116`, `malformed=1`) from 262 compiler diagnostics.
- Full corpus with ambient `NO_COLOR` removed and `FORCE_COLOR=1`: the identical expected RED and
  class census from the identical 262 compiler diagnostics.
- I4 remains blocked on the original D14 rescope ceiling; this hardening slice does not repair,
  exempt, or baseline any corpus example.
- Reconcile: #1533 and draft PR #1756 remain scoped to this gate; `Closes #1533`, milestone 0.0.7,
  and `status:impl` remain current. No evaluator was launched and coordinator rescope is still
  required before I4.

### I5 — non-enforcing gate plumbing

- Added `docs:jsdoc-examples` as the real checker CLI and `docs:jsdoc-examples:test` as the focused
  policy/compiler/workflow suite. The known-RED live corpus test is intentionally not hidden inside
  the focused test task.
- Added catalog id `jsdoc-example-compile` with exact argv
  `deno task docs:jsdoc-examples`, enabling durable receipts without enabling CI enforcement.
- Added a workflow structure test that locks both task commands, the catalog argv, and the required
  absence of `--gate jsdoc-example-compile` from `ci.yml` until coordinator rescope.
- Targeted check — PASS. `deno task docs:jsdoc-examples:test` — PASS, 11/11.
  `deno task gates:test` — PASS, 68/68.
- Direct task proof — expected RED, exit 1: 35 members, 2020 files, 349 examples, 348 candidates,
  165 failures (`27 / 21 / 116 / 0 / 1`) from 262 diagnostics.
- Blocking CI enforcement is deliberately not enabled. I4 remains blocked; no corpus example,
  exemption, failure baseline, or ratchet was changed.
- Reconcile: `main` advanced to `952cc106aafea61570d24247695ac23f5d810026`; per coordinator
  instruction this branch was not rebased because the two generated-asset changes contain no
  `@example` delta. PR #1756 remains draft at `status:impl`; no evaluator was launched.

### I4a — narrowed assertion and classifier-owned deferred inventory

- Changed the compiler verdict contract so only bad consumer specifiers, unfenced tags, and
  unlabelled/malformed fences are enforced; Deno still checks every selected body without executing
  it and classifies the resulting diagnostics.
- Added coverage floors plus non-growth ceilings of 116 unbound-name and 21 published-API type-error
  examples. The ceilings are ratchets for follow-up debt, not passing allowances for the asserted
  import/fence contract.
- Emitted `deferred-classes.md` directly from the classifier, retaining classifier precedence,
  source owner, example/fence ordinals, and TS codes for all 116/21 deferred examples. The six
  syntax fragments use the classifier's stable TypeScript syntax equivalents (`TS1109` / `TS1005`)
  because a batched Deno check aborts before later modules when those fragments reach its parser.
- Full corpus result remains expected RED before repairs: 35 members, 2020 files, 349 examples, 348
  candidates/checked, enforced failures 28 (`badSpecifier=27`, `malformed=1`), deferred classes
  unchanged at `unboundName=116`, `typeError=21`.
- Focused contract/compiler/workflow tests — PASS, 14/14. CI enforcement remains off until the 28
  bounded repairs make this narrowed assertion green.

### I4b / I5 activation — bounded repairs and blocking enforcement

- Repaired all 27 bad-specifier examples through declared `@netscript/*` exports or explicit
  consumer application aliases. No public export was added. Examples whose previously hidden body
  usage was invalid were narrowed to the documented factory/utility rather than deleted or hollowed.
- Labelled `packages/cron/ports/types.ts`'s non-TypeScript fence as `text`; final fence census is one
  attributable non-TypeScript example and zero malformed/unfenced examples.
- Hardened unclassified compiler-abort handling after a JSX-in-`ts` abort briefly produced a false
  PASS with a collapsed deferred census. The regression proves preclassified syntax debt cannot mask
  an unrelated unnumbered compiler failure.
- Final narrowed gate — PASS: 35 members, 2020 files, 349 examples, 348 candidates/checked, zero
  exemptions and enforced failures; deferred classes remain exactly 116 unbound-name / 21 type-error.
- Only after that green result, enabled `jsdoc-example-compile` once in the blocking CI quality job,
  under `RUN_DENO`, with durable receipt `quality/jsdoc-example-compile.json`. The coordinator then
  independently reproduced the same 0 / 116 / 21 result before authorizing the activation commit;
  enforcement was never enabled over the RED corpus.
- Focused suite — PASS, 15/15. Live corpus regression — PASS, 1/1. Gate tool suite — PASS, 68/68.

### I6 — integration re-anchor

- Committed blocking quality-job enforcement only after the coordinator independently reproduced
  the green narrowed contract at repair head `303be12eab5e54ada654d55f60e8cfbf1921ea73`.
- Rebased onto the coordinator-specified live `main`
  `3e5cbabfcd0a8c1aea5383fa7e1c4f111386dc3c`; no conflict resolution changed the leaf's intent.
- Immediate post-rebase gate — PASS, raw exit 0: 35 members, 2021 files, 351 examples, 350
  candidates/checked, zero exemptions and enforced failures; deferred classes remain exactly 116
  unbound-name / 21 type-error.
- The +1 file / +2 example denominator is attributable to the base's new
  `packages/contracts/src/domain/procedure-meta.ts`, not to this leaf. Both examples are clean. The
  coordinator's stop condition (movement in either deferred census) did not occur.
- A corrected coordinator brief required the full governed generator chain. Mechanical
  `gen:agent-docs-prose`, `gen:publish-assets`, and `gen:assets-barrel` outputs remain stable;
  `gen:mcp-export-corpus` updates its encoded payload because the leaf changed public JSDoc bodies,
  while package/subpath/symbol cardinality remains 35 / 270 / 7,623.
- The earlier I6 receipts at `65c2f99cf2b05debc00539ba1de58f3047115513` are superseded. Final
  exact-head I6 raw exit codes and catalog receipts are rerun after the mechanical MCP corpus
  commit, with no later evidence-only commit. Prohibited Aspire, Docker, `e2e:cli`, and
  `scaffold.runtime` gates remain excluded because this leaf has no serialized expensive-gate lease.

### IMPL-EVAL cycle 1 repairs

- Fast-forwarded artifact-only verdict `6d85d4f21eb17718485f13b8941889be1f2f4763` without editing
  `impl-eval.md`.
- Replaced five false-green service `@app/` imports with exported `ServiceRouter` and
  `AuthenticatorPort` stand-ins. Removed the router/auth supports and added an owner-scoped alias
  policy plus a generator-executing alignment test: the app generator emits `@app/`; the service
  generator does not and emits `@database` only when database-backed.
- Removed the reverse-ratchet exact census assertion. `JSDOC_EXAMPLE_RATCHET` remains the single
  ceiling source; a focused test proves a smaller deferred list is accepted while growth fails.
- Placeholder preclassification now ignores comments and strings. `parseAppSettings` compiles
  clean, while `buildOtelEnvVars` and `getMssqlConfig` reach Deno and classify as TS2451. The
  classifier-owned artifact and ceiling are corrected from 21 to 20 type-error examples; unbound
  remains 116.
- Set `FORCE_COLOR=0` with `NO_COLOR=1` at the compiler boundary, retaining ANSI stripping as
  defense in depth.
- Focused policy/compiler tests — PASS, 16/16. Corpus regression — PASS, 1/1. Live narrowed gate —
  PASS with enforced 0 / deferred 116/20.
- These repair commits supersede the pre-evaluation `c73fee39…` receipts. The full I6 matrix is
  rerun only after the corrected deferred list and governed MCP export corpus are committed.

## Evaluator Handoff

Inspect D1/D2/D6/D8/D12/D13/D16 in particular. Confirm the module-versus-symbol selection
asymmetry is intentional and bounded, the compiler cannot execute examples, and the first-run
policy cannot turn compile failures into an allowlist. Numeric floor values are intentionally a
post-census measurement; their governing policy is already locked.
