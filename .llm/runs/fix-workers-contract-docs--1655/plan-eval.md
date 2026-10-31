# Independent PLAN-EVAL

**Verdict: FAIL_PLAN.** I couldn't find a bounded source design that gets the native doc lint to zero while keeping the exact oRPC types. What's needed next is an owner decision, not implementation.

This was a read-only review: I wrote no files and ran no probes, as you asked. The verdict rests on reading the source, the run artifacts, doctrine 02, the debt registry, and the prototype results recorded in `research.md`. The supervisor needs to copy this into `.llm/runs/fix-workers-contract-docs--1655/plan-eval.md`.

## Blocker 1: the required invariants can't all hold at once

**What the lint checks.** Native `deno doc --lint` checks each public declaration on its own written text, not on the resolved type:
- `WorkersRouter = ReturnType<typeof workersContractV1.$context<…>>` is clean. It only names a public value.
- The only two findings come from the root annotations in `packages/plugin-workers-core/src/contracts/v1/workers.contract-types.ts`:
  - `WorkersContract` points at the private `WorkersContractDefinition`.
  - `WorkersContractImplementer` points at the upstream `implement`.

**Where the frontier sits.** Every derived alias can be rewritten as `typeof <public value>` plus standard library utilities, with no findings. The values they derive from are `workersContract`, `createWorkersContract` and `workersContractV1`. Those root values still need an explicit annotation; leaving it out produces `missing-explicit-type` / slow types instead, which only moves the diagnostic. The annotation has to end at a named type, and the exact oRPC types only exist under upstream names (`implement`, `Implementer`, `ContractProcedureBuilderWithInputOutput`, `MergedErrorMap`, `z.Zod*`). Naming those triggers the finding:
- The isolated prototypes show the finding survives type references, namespace qualification, `import()` queries, `typeof` on a private const, and interface inheritance.
- Two accepted debt rows hit the same wall: `packages/plugin contract mount` and `fresh-ai-native-send-doc-2087`.
- Doctrine itself says it: `docs/architecture/doctrine/02-public-surface.md:257-264`.

**What's left, and why each is excluded:**
- Re-exporting upstream types: banned by doctrine 02 (`:214-215`, `:310`), and the nested SDK types grow with each re-export.
- An owned copy of the SDK types: you excluded it, and it would drift from upstream and break the `implement` assignability tests.
- Erasing types, suppressions, `@internal`, or a different diagnostic class: all excluded.

So there will always be at least one upstream reference. The current baseline of 2 is effectively at that floor, and zero isn't reachable from source. Issue #1655's zero requirement conflicts with doctrine 02's "soundness wins" exception for oRPC-bound packages.

**Next action:**
1. Add an `architectural` entry to `drift.md` setting out this argument.
2. Escalate one decision to the owner/coordinator: which invariant gives way.
   - #1655's zero-diagnostic requirement and the two debt closing gates,
   - or the doctrine 02 ban on vendor re-exports,
   - or a dependency on an upstream change (Deno doc lint or the oRPC typings), with a re-evaluation trigger like the one on the contract-mount row.
3. Keep both debt rows open and the code unchanged until the owner rules. I'm not recommending which way they rule.

## Blocker 2: the plan's design decision isn't locked

`plan.md` still proposes publishing the complete owned route/schema type closure, which its own research disproves (40 private refs and 55 missing-JSDoc findings). The plan-gate's "Decisions locked" and "Open-decision sweep" items can't pass while that has to be resolved first. Slices 2–3 also depend on it.

**Fix:** after the owner rules, rewrite the design and slices against the chosen invariant. The slices must keep the bidirectional assignability and context/config/middleware/router/lazy tests in `plugins/workers/tests/public/contract-graph_test.ts`.

## Blocker 3: the closure proof is missing a baseline

- The `workers-doc-baseline-2066` closing gate says "all worker export doc-lint diagnostics zero", which covers all 19 `plugin-workers-core` targets. `research.md` records only the plugin baseline.
- The `workers-private-type-ref-1655` gate text still says 13 targets, but the plugin has 14.

**Fix:** record a per-target core baseline at a9620a3, and measure closure across all 14 plugin targets.

Once the owner decision is recorded and the plan is revised, re-run PLAN-EVAL in this same evaluator session.
