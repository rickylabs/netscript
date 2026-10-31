# PostgreSQL conformance baseline comparison

The S1 head `54f1d57290c6f979391391ab55b2173a8bc86d60` has a red command-postgres workflow, reported during S2 implementation.

- PR run: https://github.com/rickylabs/netscript/actions/runs/41149972794
- Latest previous main run: https://github.com/rickylabs/netscript/actions/runs/40537299671
- Both fail `real HTTP saga process crash replay reversed delivery and stale PostgreSQL writer`, at the generated client child-test exit assertion in `packages/plugin-sagas-core/tests/fixtures/transition-store/provider-fixture.ts`. Both report the same oRPC/OpenTelemetry peer mismatch during that child's resolution. S1 changes no database or saga source.
- Fresh baseline dispatched on current main `6a71cd0599673d70cd6311de3bb20b2d6a9dde2c`: https://github.com/rickylabs/netscript/actions/runs/41150334391 . FAILURE confirmed, with the same fixture failure.
- Exact underlying exception: `SyntaxError: The requested module '@opentelemetry/api' does not provide an export named 'logs'`, originating in the newly resolved instrumentation auto-loader in the generated child fixture. This happens before any conformance test executes (0 passed / 1 uncaught failure), and reproduces on unchanged current main.

No unrelated dependency changes, lock edits or CI weakening are justified by this existing failure. The final report must state the actual final-head verdict and baseline evidence.
