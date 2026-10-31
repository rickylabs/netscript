# Drift

2026-10-31: Adopt existing PR branches instead of opening a duplicate on the dispatcher branch,
as explicitly required by the operator adoption instructions. Existing draft 2421 satisfies the
early draft review surface. Owner addendum keeps 2422/2423 non-draft. Explicit Refs-only policy
wins over the generic closing-keyword template. Final canonical publication uses the requested
file handoff. RTK absent; raw focused inspection is the available fallback.

2026-10-31 PLAN-EVAL round 1: FAIL_PLAN on trigger/post-publish handling, workflow push
capability, sibling review ownership and unnamed new file scope. Plan now records exact
new S3 paths and canonical carriers before writing them; assigns sibling read-only review;
verifies workflow scope; delegates CI label arming to the coordinator as explicitly authorized;
and proposes canonical post-publish production-gate debt for the first 0.0.9 canary.
No implementation began; same evaluator is re-steered for round 2.

S3 routine documentation scope addition before writing: docs/site/services-sdk/how-to/index.md
needs one link to the named host-plugin-services.md recipe, as the PLAN evaluator noted.
Correct adopted streams JSDoc examples to explicitly select native raw-route protect prefixes;
no native policy rewriting or new resolver is introduced. Initial Linux qualification has one
compiler deadline failure; retain it as evidence and rerun the same control in isolation.

The compiler control timed out again on the integrated graph with no other heavy compiler
job. Its checked child needs the same explicit30-second compilation budget already used by
HTTP/TLS compiler consumers. Set only that caller's deadline; preserve the default10-second
runtime budget, the500ms stuck-child negative, sanitizers and all positive/negative compiler
assertions. This changes a bounded test budget, not acceptance or permission grants.

The worker host test will use the real streams factory as its dependency and retain/stop
its host-owned native producer explicitly, proving registration/mutation wiring without a
copied stream server or disabled hook. Reuse the native streams test sandbox through its
existing test_utils module; add only an opt-in unstable-KV flag for this combined child.
All existing permission-negative modes retain their original default arguments.

Documentation scope before writing: add docs/site/reference/streams/index.md beside the
already owned workers reference. Both new singular service subpaths need a reference section
and a link to the single host recipe. Baseline main6a71cd05 workers OpenAPI document is HTTP500;
the combined host test compares legacy/factory parity rather than inventing a healthy document
claim. Its SDK, REST/RPC, credential ownership, SSE, producer/dependency and cleanup checks pass.

S3 measured scope expansion before repair: plugins/workers/tests/public/type-refs_test.ts
contains the pre-existing exact export-target list. The complete plugin suite returned230 pass,
1 fail because the new ./service is absent from that list. Add the singular entrypoint while
retaining every legacy target and all precision/doc-lint controls. No acceptance reduction.

S3 measured layout correction before editing: adopted factory tests plus new host controls
raise workers/streams services/src to17/19 immediate entries (generic audit counts17/18
after its test-directory exclusion), above cap12. Move only service*_test.ts owners and the
workers service-test-fixture.ts into services/src/tests/. Streams already has that directory.
Update parent-relative module URLs, plugin-root resolution and fixture imports only. Preserve
all assertions, test names, budgets, permissions, fixture content and public source. This exact
path relocation is allowed scope; no new F16 exception or scan exclusion is introduced.
Historical records retain their original source paths; final evidence will use current paths.

Independent IMPL round1: CHANGES at6a6e390fcdaf8bab60d5cf1a1c1e280e9ab83a8e.
The sole blocker is workers service-test-fixture.ts matching services/**/*.ts but missing
existing publish exclusions. All other source/migration behavior was accepted; draft CI was
correctly unproven and not counted as a source blocker. Both proposed postpublish/metadata
debts and unchanged native facade debts were accepted. Exact fix scope before editing: move
services/src/tests/service-test-fixture.ts into that directory's test_utils/ child and update
its four local imports. This reuses existing publish exclusions without adding any filter or
changing fixture logic, tests, source cap or API. Re-run native worker tests, scoped wrappers,
workers dry-run and native pack file-list inspection, then re-steer the same evaluator.
