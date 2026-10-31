Refs https://github.com/rickylabs/netscript/issues/2161

## Summary

Let helper and dependency-injected factory modules opt out of generated plugin runtime registries with a first-line `// @netscript-registry-ignore` comment. Generation and read-only inspection use the same source selector, and `plugin doctor` names excluded modules.

The module-level option fits static registry generation: it can be checked without evaluating a factory or project configuration, and exclusions follow the source file. Existing manifest exclusions and strict validation of unmarked definitions remain in place.

## Scope

- Shared plugin CLI selection, runtime registry generators, protocol inspection, and doctor reporting.
- Part of milestone coordinator #2474, group A3. Empty-saga handling belongs to #2162.

## Slices

- [x] S0 plan and independent PLAN-EVAL (round 2 PASS).
- [x] S1 shared directive, generator selection, inspection and doctor evidence (60 focused tests, scoped gates and independent review PASS).
- [x] S2 installed-project proof, policy negative control, documentation, and generated MCP carrier refresh.

## Validation

Plan & Design — READY FOR REVIEW. Implementation and local validation pending.

The coordinator must arm `e2e-cli-gate` and obtain the `scaffold.runtime` CI verdict. Local full runtime E2E is explicitly prohibited for this run.

## Harness

Run: `.llm/runs/orch-divybot-6539498806--2161/`.

Do not merge until the selected Plan-Gate and mandatory final independent implementation review are complete. Only the coordinator merges.

## Drift / Debt

No new accepted architecture debt. Owner instructions require a Refs-only body and coordinator-owned labels/milestone/merge.

## Definition of Done

- [ ] Helpers can opt out consistently and remain absent from generated imports.
- [ ] Doctor names excluded modules without changing project files.
- [ ] Negative controls preserve clear failures for unmarked invalid modules.
- [ ] Plugin registry documentation explains the directive.
- [ ] Focused local gates and independent exact-head review pass.
