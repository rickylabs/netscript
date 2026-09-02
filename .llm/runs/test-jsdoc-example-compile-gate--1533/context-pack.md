# Context Pack: implementation after bounded PLAN-EVAL amendment

## Stop State

PLAN-EVAL cycle 1 returned `FAIL_FIX` at the planned head. The owner supplied the missing repair
convention and numeric ceilings, declared there is no cycle 2, and authorized implementation after
a standalone amendment commit. `plan-eval.md` is immutable; IMPL-EVAL is the next formal gate.

## Objective

Close exactly #1533 by adding a compile-only gate for TypeScript JSDoc `@example` blocks on the
actual JSR publish surface, repairing all genuine first-run failures and wiring durable CI evidence.

## Verified Research

- `packages/contracts/deno.json` publishes `.`, `./crud`, `./query`, and `./transform`.
- The four examples named by the inherited ledger resolve every imported symbol from the `query`
  or `transform` subpath they actually name. The ledger's non-exporting-root blocker is false.
- All four cited contracts source examples and both entrypoint module examples fail direct compile.
  The classes include unbound names, `filters.ts` literal widening, and the
  `transform-helpers.ts` inference defect; see research finding 12 and the drift correction.
- `deno doc --lint` exits zero on invalid example bodies. `deno doc --json` does provide structured
  example tags, declarations, owners, and source locations and is therefore the extraction source.
- #1374 already supplies fence extraction, reasoned `no-check`, strict synthetic compilation,
  workspace export resolution, and typed app-alias supports. Reuse/factor these primitives.
- The live denominator is 35 publishable members; `packages/bench` and `packages/cli/e2e` are
  excluded by `publish:false`.

Full citations and commands are in `research.md`.

## Plan Decisions Requiring Evaluation

- D1: scope is the 35-member publish set, selected through existing publish rules.
- D2–D4: public symbol examples come from declared entrypoints; module examples come from all
  published source files; `deno doc --json` owns JSDoc parsing and the existing fence extractor owns
  code-fence parsing.
- D5: deliberate fragments use the existing source-local reasoned marker and are always reported.
- D6–D7: inject exactly one documented public symbol by exact declaration identity; module examples
  get no injection.
- D8–D11: isolated strict `deno check --unstable-kv`, exact published export map, no execution,
  rejected relative/absolute imports, and only generator-proven app aliases.
- D12–D14: visible stand-ins (or narrowing) repair unbound application names; never exempt bad
  specifiers, undeclared NetScript subpaths, or real signature type errors; commit the classified
  RED census first and stop above 25 packages / 90 mechanical examples / eight genuine type-error
  examples, or on any public API/export change.
- D13: first GREEN measurements become minimum coverage / maximum exemption ratchets, not a failure
  baseline.
- D15–D17: root task, gate catalog, durable quality-job receipt, and deterministic output contract.

## Planned History

1. B0 research re-baseline — complete and pushed at
   `a1a4328ba4706f3fe8e7c541e43763975a8df485`.
2. P1 plan/Design checkpoint — the current slice.
3. I1 contracts and reusable publish discovery.
4. I2 implementation.
5. I3 semantic controls plus visible live-corpus RED commit.
6. I4 repair every genuine failure and reach GREEN.
7. I5 task/catalog/CI wiring.
8. I6 final validation and IMPL-EVAL handoff.

## Implementation Progress

- P2 amendment pushed at `551f4edc81807df755de5e745e5e7ceba3a3ee39`.
- I1 contracts and reusable published-source discovery are complete; targeted Deno check passed.
- I2 Deno-doc extraction, exact symbol mapping, published-only resolver, and compile runner are
  complete; full extraction currently measures 35 members / 2020 files / 353 example tags / 352
  candidates and one malformed bare fence.
- I3 semantic controls are complete (9/9 PASS) and the live corpus is visibly RED: 27 bad
  specifier/import, 21 type-error, 116 unbound-name, 0 unfenced, 1 malformed; total 165 failing
  examples. Evidence is in `red-census.md`.
- I3 supervision found ANSI-sensitive diagnostic attribution: color-enabled output undercounted the
  same 262 diagnostics as 24 failures. The hardening slice forces `NO_COLOR=1`, strips ANSI before
  attribution, and adds a color-invariance regression. Full color-on and color-off corpus runs now
  both classify 165 failures (`27 / 21 / 116 / 0 / 1`) from 262 diagnostics; 165 remains the
  authoritative census.
- I4 is blocked by the owner-set ceiling before any repair: mechanical classes total at least 144
  (>90) and type errors total 21 (>8). Supervisor rescope is required; no baseline or exemption was
  introduced.
- I5 non-enforcing plumbing is complete: root checker/test tasks, catalog id
  `jsdoc-example-compile`, and a structure test are wired. The test explicitly asserts that
  `ci.yml` does not invoke the gate while the 165-failure rescope is open; blocking enforcement is
  deliberately deferred.
- Coordinator decision on 2026-08-30: option 1 is authorized. The asserted gate contract is now
  published import-specifier plus fence-language integrity. Repair exactly 27 bad specifiers and one
  malformed fence; emit classifier-owned deferred lists for 116 unbound-name and 21 type-error
  examples, ratchet both against growth, and do not modify those 137 examples. Enable blocking CI
  only after the narrowed contract is green.

This ordering preserves contract → implementation → tests and the user's separately committed RED
before GREEN requirement.

## Files to Inspect

- `.llm/runs/test-jsdoc-example-compile-gate--1533/plan.md`
- `.llm/runs/test-jsdoc-example-compile-gate--1533/worklog.md`
- `.llm/runs/test-jsdoc-example-compile-gate--1533/research.md`
- `.llm/runs/test-jsdoc-example-compile-gate--1533/drift.md`
- `.llm/tools/docs/snippet-extractor.ts`
- `.llm/tools/docs/snippet-compiler.ts`
- `.llm/tools/docs/snippet-workspace.ts`
- `.llm/tools/docs/snippet-supports.ts`
- `.llm/tools/release/preflight-text-imports.ts`
- `.llm/tools/gates/catalog.ts`
- `.github/workflows/ci.yml`

## Gate State

- Research accuracy: PASS.
- PLAN-EVAL: cycle 1 `FAIL_FIX` at `0f30c4f4…`, verdict commit `9b34b657…`; owner-authorized bounded
  amendment, no cycle 2.
- Implementation: authorized after the amendment commit. IMPL-EVAL remains separate and has not
  been launched.
- Aspire, Docker, browser, `e2e:cli`, and `scaffold.runtime`: intentionally not run; this leaf has no
  expensive-gate lease and they do not prove the compile-only tool.

## Open Questions

No implementation decision remains open. The coordinator-owned rescope is settled; only the
follow-up issue identifiers for the emitted 116/21 lists remain external to this leaf.

## Drift and Debt

The inherited false blocker and the corrected probe location are recorded in `drift.md` and the
worklog. No architecture-debt entry is created: genuine failures are repaired, deliberate
fragments remain attributable source policy, and no package architecture changes are accepted.
