# Resume worker trace isolation

Issue #2393 / inbox harness#750. Branch `orch/divybot-750`, baseline a833dfa8.
Run plan/worklog record the pre-implementation design. Root cause: inbound extraction falls back to
ambient worker context, including masking valid headers without a registered propagator.

Next: implement S1 regressions and isolate inbound context with ROOT_CONTEXT; run structured gates,
whole consumer suites, quality:gate and full CLI E2E. Obtain separate different-family evaluation
using the feature matrix (muse_spark_1_3/xhigh, fallback opus_5/xhigh). No self-certification.
Do not commit assignment/final-report files. New operational memory lives in the project run
`/home/agent/projects/orchid/runs/2026-10-18-worker-traces/memory/`.
