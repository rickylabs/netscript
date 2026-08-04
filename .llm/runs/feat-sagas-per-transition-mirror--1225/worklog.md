# Worklog

## 2026-08-04

- Read live #1225 first and created the exact branch from fetched `origin/main`.
- Preserved the foreign unstaged `deno.lock` change and excluded it from every commit.
- Locked the D6-composed plan.
- RED: `producer_transition_test.ts` failed because `SagaStreamInstanceProjection` did not exist.
- GREEN: three successive durable projection records emitted three `sagaInstance` upserts,
  including compensating and completed compensation states.
- Targeted publish boundary, runner, and producer tests: 4 passed, 0 failed.
- Scoped check selected four implementation files with zero findings.
- Commit `b2d93140b` pushed using explicit refspec; draft PR #1284 opened.
- Fresh default Postgres scaffold installed local sagas + streams, generated/migrated the database,
  and ran through the generated TypeScript AppHost.
- Populated named health reports were Healthy for sagas, sagas-api, and streams.
- Inspected lifecycle: three-step terminal instance reached completed/version 3; compensation reached
  compensating with an OTEL `outcome=compensated` span.
- The durable stream contained distinct version 1, 2, and 3 transition upserts for the same key.
- Aspire traces joined API publish, queue transport, saga.handle, stream.publish, and the streams
  HTTP POST with one trace id; logs/spans/traces were inspected and exported.
- Processor restart retained both durable instances and a post-restart publish produced a correlated
  stream POST. Full artifact summary and `aspire-export.zip` are under `evidence/`.
- Plugin suite: 50 passed, 0 failed, 1 environment-gated Redis test ignored. Scoped lint/fmt: 84
  files, zero findings. Quality scan and architecture fitness passed with baseline warnings only.
- Package publish dry-run passed. Doc lint reported the existing package baseline of 15 private-type
  references; this diff adds none. Docs build, caveat references, and 32,775 internal links passed.
- Exact run AppHost stopped. Teardown found no run-owned survivors and left three foreign stale
  Postgres containers untouched.
