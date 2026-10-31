# PostgreSQL conformance baseline comparison

The S1 head `54f1d57290c6f979391391ab55b2173a8bc86d60` has a red command-postgres workflow, reported during S2 implementation.

- PR run: https://github.com/rickylabs/netscript/actions/runs/41149972794
- Latest previous main run: https://github.com/rickylabs/netscript/actions/runs/40537299671
- Both fail `real HTTP saga process crash replay reversed delivery and stale PostgreSQL writer`, at the generated client child-test exit assertion in `packages/plugin-sagas-core/tests/fixtures/transition-store/provider-fixture.ts`. Both report the same oRPC/OpenTelemetry peer mismatch during that child's resolution. S1 changes no database or saga source.
- Fresh baseline dispatched on current main `6a71cd0599673d70cd6311de3bb20b2d6a9dde2c`: https://github.com/rickylabs/netscript/actions/runs/41150334391 . FAILURE confirmed, with the same fixture failure.
- Exact underlying exception: `SyntaxError: The requested module '@opentelemetry/api' does not provide an export named 'logs'`, originating in the newly resolved instrumentation auto-loader in the generated child fixture. This happens before any conformance test executes (0 passed / 1 uncaught failure), and reproduces on unchanged current main.

No unrelated dependency changes, lock edits or CI weakening are justified by this existing failure. The final report must state the actual final-head verdict and baseline evidence.

## S2 CI found an additional PR regression

Run https://github.com/rickylabs/netscript/actions/runs/41151028663 at S2 head
`466fa8e1c718cd14e559ca2170bf47dc9a6b466d` fails earlier in `saga-relay-cohort_test.ts`:
its generated consumer context omits the newly required `deadLetters` field. This is introduced by
the PR, distinct from main's dependency failure. The correction keeps the direct-dispatch context
backward compatible and composes the same KV default lazily when terminal storage is needed. A
real-KV regression uses a context without the field and verifies durable terminal storage, so
compatibility does not weaken DLQ acceptance.

## Baseline repair incorporated

Main subsequently landed PR #2476 as `a410a815ce1401d533b18f2a85eb75e266de94a5`, bounding the
instrumentation dependency and freezing generated-fixture resolution. That reviewed main commit is
merged into this branch. Its lock changes are inherited from main, absent from the PR diff against
main, and are not a local dependency refresh. New-head CI must be judged independently of the
historical red runs above.
