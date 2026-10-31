# Independent PLAN-EVAL cycle 2

**PLAN-EVAL, issue #2290, cycle 2 (feature tier)**

Both cycle-1 blockers are fixed, and I found no new ones.

1. **Gate set selected: now checked.**
   - Slice 1 now names every docs gate that was missing:
     - the tutorial-executing test, `guarded-client-docs_test.ts`
     - the service README examples test
     - `docs:exports-drift`, which will catch the new root constant and type
     - `docs:snippets` and `docs:readme-fences`
   - It also names a consumer-import check: a regression test that imports the new constant and type from the package root and from `./auth`, type-checks those imports and runs them. `deps:prod-install` is added where it is supported.
   - The archetype fix is correct. The doctrine table lists `packages/service` as Archetype 4 (DSL/Builder) with a Refactor verdict. In the Archetype 4 column, consumer import validation is required and runtime/Aspire validation is optional. The plan covers the first and correctly hands runtime wiring to the coordinator-armed CI end-to-end verdict instead of running it locally.
   - Generated doc carriers (`agent-docs-prose.generated.ts`) will drift when the docs change. That is not a blocker: those carriers are checked and repaired by the regeneration workflow after a push to main, not at PR time, and they are outside the authorized write surface.

2. **jsr-audit planned surface: now checked.**
   - The `retired?: true` marker is listed as public. It sits on the matched branch of `ProcedurePolicyResolution`, which is exported from the package root and from `./auth`.
   - Making the field optional is backwards compatible for anyone who reads or builds that type.
   - It is covered by JSDoc, full-export doc lint and the reference page.
   - The plan says overlay authorizers never set it. That matches the overlay resolver in the source, which only returns policy matches.

The rest of the checklist still holds from cycle 1:
- Research is current against the baseline commit.
- Decisions are locked, and the open-decision sweep is clean: parameterized retirement and SDK upgrade UI are safe to defer.
- There are three ordered slices, each well under 30 files, and each names its files and the gate that proves it.
- The risk register covers route disclosure, retirement shadowing a live route, encoding ambiguity and regressions to the existing 403.
- Deferred scope is stated explicitly.

Implementation may begin.

VERDICT: PASS
