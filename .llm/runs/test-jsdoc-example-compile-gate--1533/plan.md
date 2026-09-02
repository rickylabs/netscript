# Plan: JSDoc `@example` compile gate

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `test-jsdoc-example-compile-gate--1533` |
| Branch | `test/jsdoc-example-compile-gate` |
| Phase | `implementation` — owner-authorized after bounded PLAN-EVAL amendment; no cycle 2 |
| Target | Repo fitness tooling over published `packages/**` and `plugins/**` JSDoc |
| Archetype | `6 — CLI / Tooling`, applied proportionally to a checked-in Deno gate rather than a published CLI package |
| Scope overlays | `docs` |

## Archetype

The implementation is user-run repository automation exposed through a Deno task, so Archetype 6
is the smallest applicable tooling profile. It does not change `packages/cli` or create a published
binary. The profile's package-only spine classes, feature tree, registries, composition root, and
permission README are therefore N/A; inventing them would be ceremony. The applicable Archetype 6
rules are a small command surface, effects at the tool edge, explicit permissions, semantic tests,
and deterministic structured evidence.

The docs overlay applies because the gate changes the truth conditions for published JSDoc and may
repair or explicitly exempt source examples. Source alignment comes from `deno doc`, package export
maps, publish rules, and scaffold generators—not duplicated prose.

## Current Doctrine Verdict

The live publish denominator contains 35 members: 29 Keep and six Refactor rows in
`docs/architecture/doctrine/10-codebase-verdict-and-handoff.md`. This leaf does not change those
verdicts or package architecture. It adds executable evidence for the doctrine's existing A14,
F-5, and F-7 requirements that public examples compile.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1 | The documented consumer contract and checker result are defined before implementation. |
| A2 | An example that looks simple but cannot compile is a broken published boundary. |
| A6 | New seams exist only for command testability and deterministic policy evaluation. |
| A7 | `deno doc --json` identifies examples and `deno check` compiles them; no local parser/compiler replaces Deno. |
| A8 | Publish selection, example policy, compilation, supports, and CLI/CI wiring remain distinct concerns. |
| A14 | The gate makes example correctness an executable fitness function. |

## Goal

Ship a checked-in, compile-only gate that discovers JSDoc TypeScript examples from the actual
publish set, injects the documented public symbol when convention requires it, resolves only
shipped NetScript entrypoints plus verified scaffold aliases, reports every reasoned exemption,
and fails CI on invalid examples without executing them.

## Scope

- Discover the 35 publishable workspace members under `packages/**` and `plugins/**`; continue to
  exclude `packages/bench` and `packages/cli/e2e` through their checked-in `publish:false`, not a
  second hard-coded list.
- Apply each member's `publish.include` / `publish.exclude` rules to TypeScript and TSX files.
- Extract module-level JSDoc examples from every published source file and symbol-level examples
  reachable through at least one declared package export.
- Compile each unexempted `ts`, `tsx`, or `typescript` fence against the exact published export map,
  strict compiler settings, copied lockfile, and verified scaffold-alias supports.
- Repair every genuine first-run compile defect within the supervisor-set rescope ceiling. Unbound
  application-side names use visible stand-in declarations in the example body, or the example is
  narrowed when the stand-in would exceed the substance being demonstrated.
- Add semantic negative controls for both historical SDK relative-import defects, symbol injection,
  undeclared NetScript subpaths, malformed exemptions, and generated aliases.
- Expose the gate as root tasks, add it to `.llm/tools/gates/catalog.ts`, and run it via a durable
  receipt in the core CI quality job.

## Non-Scope

- Executing examples or starting services, Aspire, Docker, browsers, or scaffold E2E.
- Fenced prose snippets under `docs/site/**` (#1374), README content (#1377), README checks (#767),
  or generated reference-page/export-map verification (#1108).
- Changing the repo's JSDoc convention that symbol examples omit an import for the documented
  symbol.
- Changing package exports, public TypeScript signatures, package versions, dependencies, or the
  doctrine verdict table merely to make examples compile.
- Merging, marking the PR ready, closing issues, changing issue labels/milestone, or launching an
  evaluator.

## Hidden Scope

- A published-only mode for the existing workspace resolver; otherwise `publish:false` member
  exports could create a false green.
- A public-symbol index from `deno doc --json` over declared entrypoints, including deterministic
  handling when a declaration is re-exported through more than one subpath.
- A lower-level reusable synthetic-module compiler factored from the #1374 implementation so JSDoc
  and site snippets share strict config, lock isolation, cleanup, and diagnostic handling.
- Exact scaffold-alias alignment tests against `generateAppDenoJson`; typed supports are never added
  just because an example asks for an arbitrary alias.
- A checked/exempt coverage ratchet populated only after the first real census is reviewed.
- Workflow-structure tests that prove the durable gate runs before a quality job can report green.

## Coordinator-authorized asserted contract — 2026-08-30

The blocking gate contract is narrowed, explicitly and only, to **published import-specifier and
fence integrity**:

1. Every TypeScript-fenced published `@example` may import only shipped consumer specifiers. A
   relative/absolute path or an undeclared `@netscript/*` subpath fails.
2. Every `@example` fence carries a language. An unlabelled fence is `malformed` and fails.

This is the #1425 failure class that #1533 was filed to prevent. The compiler continues to type-check
all selected bodies so it can emit classifier-owned deferred lists, but unbound-name and published-
API type errors are not part of this leaf's blocking assertion. They are neither repaired nor
exempted nor described as passing: ceilings of 116 unbound-name examples and 21 type-error examples
fail on growth and feed coordinator-owned follow-up issues. This section supersedes the original
repair-all reading of D12–D14 and the pre-census Fix-or-Baseline Position below.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | The denominator is the actual publishable workspace set under `packages/**` and `plugins/**`, currently 35 members. Source files are selected with existing publish rules. | JSR ships that set; all `packages/**` would wrongly include `publish:false` tooling/e2e members. Reusing discovery prevents denominator drift. |
| D2 | `deno doc --json` is the primary extractor. Declared entrypoints provide public symbol examples and their declaration owners; published source files additionally provide module docs. `--private` is not used. | Deno already understands JSDoc and exports. This catches the pagination module example without compiling private-symbol prose or hand-parsing JSDoc. |
| D3 | Example tags are de-duplicated by member, owner kind, declaration/source, symbol when present, example ordinal, and fence ordinal. A symbol re-exported through multiple entrypoints is compiled once. | Prevents duplicate work and duplicate diagnostics while retaining stable provenance. |
| D4 | Every `@example` tag is counted. Every `ts`, `tsx`, and `typescript` fence is a candidate. Tags containing only explicitly labelled non-TypeScript fences are reported as `nonTypeScript`. An unfenced example or a fence with no language is `malformed` and fails until labelled/fenced. | A bare fence is a reason-less opt-out, not non-TypeScript evidence; the gate must distinguish it from an explicitly labelled shell/output example. |
| D5 | Deliberate TypeScript fragments use the existing opening-fence form ``ts no-check:<nonblank reason>`` (and TSX/typescript variants). Every exemption prints `path · owner · reason`. Missing/blank/misplaced markers fail. A bad import specifier, undeclared `@netscript/*` subpath, or type error against the documented symbol's real signature may not be exempted. I4 lists every exemption and reason in its PR phase comment. | Reuses #1374's reviewed syntax while preventing the author-set first ratchet from excusing the exact consumer breakages this gate exists to catch. |
| D6 | For symbol-owned examples, the checker injects only that documented symbol. It chooses the shortest public specifier exposing the exact declaration, breaking ties lexically, and declares the symbol in a synthetic ambient preamble so an explicit import in the example may safely shadow it. The preamble handles `const` as a value binding, `type` as a type binding, and class declarations as both value and type; I3 tests all three shapes. Module examples receive no injection. | Preserves the existing convention without smuggling unrelated names into scope or causing duplicate-binding errors. Exact declaration matching prevents same-name false greens. |
| D7 | If a symbol example has no declared public specifier, it is outside the symbol corpus rather than injected from a file URL. Module docs from published files remain in the corpus and must import/declare their own dependencies. | The gate protects shipped consumer entrypoints, not workspace-only implementation paths, while retaining the explicitly cited pagination module defect. |
| D8 | Compilation is one `deno check --unstable-kv` over isolated synthetic modules with strict/no-implicit-any settings, a copied temporary lock, and the shared workspace config. No module is imported or executed by the gate process. Zero candidates or zero checked modules is `FAIL`, with an explicit census diagnostic, independent of the D13 floor; the compiler never spawns `deno check` with an empty path list. | `deno check` is the requested compile primitive, but zero paths exits 0. The gate refuses empty selection before spawning so Deno's warning cannot become a false green. |
| D9 | The synthetic import map contains exact exports from publishable `@netscript/*` members only, canonical external imports/catalog entries, and typed supports justified by scaffold generators. Undeclared NetScript subpaths fail. | Compilation must model the shipped layout, not a permissive monorepo graph. |
| D10 | Relative and absolute-path imports in published JSDoc examples are rejected. Consumer examples use a declared package export or a scaffold-generated alias; illustrative path fragments require a reasoned exemption. | This directly catches both real SDK defects and prevents a coincidental temporary-directory layout from making them pass. |
| D11 | Existing canonical supports such as `@app/lib/orders.ts` and `@my-app/contracts` remain allowed only with alignment tests proving `@app/` and `@<project>/contracts` are generated. A new alias requires a typed support plus the same proof. | Avoids both false reds on valid scaffold examples and false greens from arbitrary hand-written aliases. |
| D12 | The enforced contract is the bad-specifier and fence-integrity surface only. Repair all 27 bad specifiers and the one malformed fence without deletion, hollowing, or exemption. Keep compiling bodies solely to emit attributable deferred classes; do not repair, exempt, or failure-baseline the 116 unbound-name or 21 published-API type-error examples in this leaf. | This exactly protects the motivating #1425 consumer-specifier defect while separating a 137-example documentation/API campaign into coordinator-owned follow-ups. Deferred diagnostics remain visible rather than being laundered into a green claim. |
| D13 | Lock minimum example/candidate/checked counts and maximum exemption count after GREEN. Also lock maximum deferred counts at 116 unbound-name and 21 type-error examples; either class growing fails. Enforced bad-specifier/unfenced/malformed counts must be zero. | Coverage and deferred-class ceilings prevent silent shrink, exemption growth, or new body defects. The deferred ceilings are follow-up inventory ratchets, not accepted-failure allowances. |
| D14 | The authoritative RED census is 27 bad specifiers, 21 type errors, 116 unbound names, 0 unfenced, and 1 malformed. The coordinator selected option 1 on 2026-08-30: repair the bounded 28 enforced failures, emit classifier-owned lists for the 137 deferred body examples, and enable CI only after the narrowed contract is green. Any public API/export change remains an immediate stop. | The original repair-all ceilings correctly stopped I4. The explicit owner rescope now authorizes the issue's import/fence contract without silently weakening it or treating deferred body diagnostics as passing. |
| D15 | The root surface is `docs:jsdoc-examples` plus a targeted `docs:jsdoc-examples:test`. Durable evidence uses gate catalog id `jsdoc-example-compile`. | Names align with the existing docs tooling family and gate receipt contract. |
| D16 | CI wiring lives in `.github/workflows/ci.yml`'s quality job under `RUN_DENO`, invoked through `run-gate.ts`. | The classifier already selects this job for package/plugin/tool changes; the gate protects source JSDoc, not only the Pages build. |
| D17 | Output is deterministic: one enforced census line, one deferred census line, one line per exemption, and classifier-owned deferred entries with path/owner/example/fence/TS codes. Exit is non-zero on bad specifier, unfenced/malformed policy, deferred-ratchet growth, zero candidates, or zero checked modules; existing within-ceiling deferred body diagnostics do not change the narrowed verdict. | Humans and durable receipts must see both the blocking contract and the deferred debt without conflating them. Empty selection and ratchet growth remain fail-closed. |

## Fix-or-Baseline Position — superseded by coordinator rescope

The first run's failure count is intentionally unknown. The policy is fixed before measuring it:

1. A genuine missing binding, bad import, invalid call, or type error is repaired in this leaf when
   the committed I3 census is within D14's ceiling.
2. Unbound application-side names receive visible stand-ins, or the example is narrowed when the
   stand-in would outweigh the documented substance.
3. A deliberately illustrative/partial TypeScript fence receives a specific source-local reason
   through the existing marker and appears in every census.
4. Bad specifiers, undeclared NetScript subpaths, and real documented-signature type errors cannot
   be exempted.
5. No compile error is entered into a detached allowlist, numeric failure budget, or follow-up issue.
6. The reviewed exemption total becomes a maximum ratchet; it may later shrink without ceremony but
   cannot grow without an explicit reviewed policy change.
7. Any D14 ceiling breach triggers rescope before repair, not baselining.

This historical position settled policy before the tool revealed N. The authoritative 165 census
crossed D14, and the dated coordinator section above now governs implementation: repair 28 enforced
failures, emit and ratchet 137 deferred body failures, and do not treat the deferred classes as
passing or accepted debt.

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Failure repair versus baseline/follow-up | resolved now | D12–D14; no failure baseline or automatic split. |
| All packages versus publish set | resolved now | D1; published 35-member denominator. |
| Extraction mechanism | resolved now | D2–D4; `deno doc --json` plus existing fence extractor. |
| Non-executing compilation | resolved now | D8; isolated `deno check`. |
| Illustrative examples | resolved now | D5 and D12; reasoned source marker and census. |
| Symbol injection | resolved now | D6–D7; exact public declaration mapping and ambient preamble. |
| App aliases and relative imports | resolved now | D9–D11. |
| Task, gate catalog, and CI location | resolved now | D15–D16. |
| Numeric census/floor values | safe to defer until first run | The measurement is unknown by design; D13 locks how measured values become the ratchet, so no implementation choice remains open. |
| Broader README/site/reference coverage | safe to defer | Owned by #1374/#1377/#1108; no implementation rework in this leaf. |
| Runtime execution of examples | safe to defer | Explicit non-goal; a future execution gate would be additive. |

No must-resolve decision remains for PLAN-EVAL.

## Risk Register

| Risk | Mitigation |
| --- | --- |
| A broad workspace import map makes invalid package imports pass. | Published-only exact export resolution plus undeclared-subpath negative control. |
| The checker recompiles the same re-exported symbol many times. | Declaration-based de-duplication and deterministic specifier choice. |
| Injection hides missing application names such as `UserSchema`. | Inject exactly the documented symbol and nothing else; module docs receive no injection. |
| Explicit imports collide with injected bindings. | Synthetic ambient global declaration permits local shadowing; test both convention and explicit-import forms. |
| Illustrative fragments create unreviewable noise. | Reasoned marker, printed census, maximum exemption ratchet, no generic allowlist. |
| Valid scaffold aliases false-red or arbitrary aliases false-green. | Reuse typed supports and prove each alias family against generator output. |
| Relative imports accidentally resolve in the synthetic directory. | Reject relative/absolute specifiers before compilation and keep historical controls. |
| Deno subprocess output loses source attribution. | Stable owner provenance and diagnostic remapping to source/owner/fence ordinal. |
| Lockfile or temporary files leak into the worktree. | Copy the lock, compare root before/after, `finally` cleanup, and test both properties. |
| Gate runtime is excessive across the publish set. | Batch `deno doc` per member and all synthetic modules into one `deno check`; record elapsed time in GREEN evidence. |
| First census reveals broad mechanical or type-error repair. | Commit the classified census in I3, apply D14's 25-package / 90-example / eight-type-error ceilings before I4, and never convert an over-ceiling result into exemptions. |
| Tooling grows into an Archetype 6 framework. | Small internal contracts and function seams only; no spine classes, registry, DI container, or speculative folder tree. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-1 monolithic file | risk | Split contract/policy/compiler/CLI concerns and keep tests semantic. |
| AP-2 helper reinvention | risk | Reuse `deno doc`, `deno check`, snippet extractor/compiler/workspace resolver, and publish discovery. |
| AP-8 premature DI | avoid | Injectable command functions only where tests require a real subprocess seam; no container. |
| AP-18 giant snapshots | avoid | Assert census fields, diagnostics, exit codes, and provenance rather than whole generated files. |
| AP-19 implicit permissions | avoid | Root task declares only read/write/run required for temp modules and Deno subprocesses. |
| AP-25 side effects outside edges | avoid | File/process effects stay in compiler/CLI edges; extraction and policy functions remain pure. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1 file size | yes | `quality:gate`; owned-file review. |
| F-2 wrap, do not reinvent | yes | Imports from existing docs/release tooling; no JSDoc/compiler implementation. |
| F-5 public surface | yes | New gate compiles JSDoc examples against declared exports; negative undeclared-path control. |
| F-6 JSR publishability | yes for repaired package roots | Existing publish dry-run remains green; no export/signature change. |
| F-7 doc score/reference quality | yes | `deno doc --lint` plus the additive example compiler. |
| F-10 test shape | yes | Focused test files below doctrine limits; semantic fixture assertions. |
| F-19 scoped/structured runners | yes | Root structured tasks for standard gates and durable `run-gate.ts` receipt for the new gate. |
| Archetype-6 F-CLI structural family | proportional/N/A | No published CLI/package surface changes; manually confirm small command surface, effects, permissions, and tests. |
| Docs source alignment | yes | `deno doc` JSON, export maps, publish rules, generator-alignment test. |
| Docs link/terminology/drift | yes | Local path review, doctrine names, and append-only `drift.md`. |

## Arch-Debt Implications

| Entry/path | Action | Notes |
| --- | --- | --- |
| `.llm/harness/debt/arch-debt.md` | none | No existing #1533 debt; genuine example failures are repaired, not accepted. |
| Repaired JSDoc roots | none | Reasoned illustrative exemptions are explicit source policy, not architecture debt. |

## Commit Slices

| # | Slice | Proving gate | Files |
| --- | --- | --- | --- |
| B0 | Bootstrap and re-baseline the carried claims | Re-run `deno doc`/synthetic compile evidence | Existing run artifacts; commit `a1a4328ba4706f3fe8e7c541e43763975a8df485` |
| P1 | Lock plan and Design checkpoint | PLAN-EVAL checklist inspection | `plan.md`, `worklog.md`, `context-pack.md` |
| I1 | Define example/census/result contracts and expose reusable publish-file discovery | Targeted `deno check --unstable-kv` | `.llm/tools/docs/jsdoc-example-contract.ts`, `.llm/tools/release/preflight-text-imports.ts` and focused test adjustments |
| I2 | Implement Deno-doc extraction, exact symbol mapping, published-only workspace resolution, and generic compile-only runner | Targeted `deno check --unstable-kv`; focused implementation probes | New `jsdoc-example-policy.ts` / `jsdoc-example-compiler.ts`; existing snippet compiler/workspace/support modules |
| I3 | Add semantic tests and historical controls; commit the observed corpus RED and classified census before repairs | Targeted tests prove relative-import, zero-candidate/zero-checked refusal, and `const`/`type`/class injection; the live-corpus assertion remains non-zero | Focused tests/fixtures plus run artifacts containing N split by bad specifier / type error / unbound name / unfenced / malformed; evaluate D14 before I4 |
| I4 | Repair genuine corpus defects within the ceiling, add only reviewed reasoned exemptions, and lock measured floors | `deno task docs:jsdoc-examples:test`; direct checker GREEN; one `deno doc --html`/JSR preview over an exempted example | Published JSDoc files identified by I3; policy floors; run artifacts; PR comment listing every exemption and reason plus render-marker evidence |
| I5 | Wire CLI task, gate catalog, durable CI receipt, and workflow structure test | `deno task gates:test`; workflow test; durable `jsdoc-example-compile` receipt | `check-jsdoc-examples.ts`, `deno.json`, gate catalog, `ci.yml`, workflow test |
| I6 | Run final scoped/full gates and prepare IMPL-EVAL handoff | Validation plan below; all applicable gates GREEN | Run artifacts and PR phase comment only unless a reviewed fix is required |

I1–I6 each commit, push with the explicit refspec, update `worklog.md`/`context-pack.md`, and post a
per-slice PR comment. I3 is the required visible RED commit; I4 is GREEN. PLAN-EVAL cycle 1's seven
bounded corrections are incorporated in a standalone amendment; the owner explicitly authorized
implementation without cycle 2. IMPL-EVAL is the next formal gate.

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Contract check | Targeted `deno check --unstable-kv` over new/changed tool modules | Selected modules type-check. |
| 2 | RED controls | Targeted JSDoc example tests at I3 | Historical defects, zero candidates/checked, bare fences, three declaration shapes, and live unrepaired corpus produce asserted evidence; run artifact records classified N before repairs. |
| 3 | Focused GREEN | `deno task docs:jsdoc-examples:test` | All unit, fixture, alias, injection, lock, and workflow tests pass. |
| 4 | Corpus GREEN | `deno task docs:jsdoc-examples` | Exit 0; deterministic census; every exemption printed; zero malformed/compile failures. |
| 5 | Durable receipt | `deno run --allow-read --allow-write --allow-run --allow-env .llm/tools/gates/run-gate.ts --gate jsdoc-example-compile ...` at immutable head | PASS receipt names exact command/head and contains bounded output hash. |
| 6 | Gate infrastructure | `deno task gates:test` | Catalog/receipt suite and new workflow structure assertion pass. |
| 7 | Structured static gates | `deno task check`, `deno task lint`, `deno task fmt:check`, `deno task test` | Wrapper-sourced PASS; root test is usable on this host. |
| 8 | Doctrine/code quality | `deno task quality:gate` | PASS with no new allowance/cast/debt. |
| 9 | Repaired JSR docs | `deno task doc:lint --root <each repaired package/plugin root> --pretty` | Zero new doc diagnostics; existing unrelated debt is not hidden. |
| 10 | Publish surface | `deno task publish:dry-run` | Existing publish set remains statically publishable; no new slow-type issue. |
| 11 | Git/PR evidence | direct `git status`, `git log`, `git ls-remote`, draft PR metadata/thread gate as applicable | Clean owned diff, copied SHA, remote head match, draft retained. |

Aspire, Docker, browser, `e2e:cli`, and `scaffold.runtime` are explicitly not run without the
coordinator's expensive-gate lease; they do not prove this compile-only tooling change.

## Dependencies

- Deno 2.9.5 `doc --json` and `check --unstable-kv`.
- #1374 implementation at `d558f9ab`.
- Existing workspace/export resolver and typed snippet supports.
- Existing publishable-member and publish-rule discovery.
- Existing gate receipt infrastructure and CI classifier.
- PLAN-EVAL and IMPL-EVAL are separate supervisor-dispatched sessions.

## Deferred Scope

- Compiling README and `docs/site` snippets beyond #1374's owned floor.
- Executing examples or verifying runtime side effects.
- General support for arbitrary app-local aliases; each future support needs generator proof.
- Changing JSR package settings, release automation, or public export maps.

## Drift Watch

- Publishable member count or `publish:false` exclusions differ from the measured 35/2 census.
- `deno doc --json` loses structured example tags or declaration ownership.
- Existing snippet primitives cannot support symbol-aware preambles without a parallel compiler.
- First-run repair requires a public export/signature change or crosses an issue boundary.
- Root lock changes, temp files leak, or batching makes the gate unsuitable for CI.
- Any implementation file cannot trace to the Design checkpoint below.
