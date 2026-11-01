# IMPL-EVAL for #2396 / PR #2421 at head `6a6e390f`

One blocker: a test fixture now gets published to JSR. Everything else I reviewed in the source is sound. CI has not run yet because the PR is still a draft; that is expected and is not counted as a blocker.

## Blocker

**1. A workers test fixture would be published in the JSR package.**
- **The rule:** `plugins/workers/deno.json:63` includes `services/**/*.ts`. The excludes at `:69-73` only drop `**/*_test.ts`, `**/*.test.ts` and `**/test_utils/**`.
- **The file:** `plugins/workers/services/src/tests/service-test-fixture.ts` matches none of those excludes, so `@netscript/plugin-workers` would ship it. It is a 250-line helper that spawns Deno child processes.
- **Why it's new:** main at `6a71cd05` has no such fixture under the published workers folders.
- **Why it's a blocker:** jsr-audit Step 5 lists test files as content that must not be published. The plan also claimed a publish file-filtering audit. A published JSR version can't be changed afterwards, so this must be fixed before merge.
- **Fix:** move the file to `services/src/tests/test_utils/`, the way the streams sibling (`streams/.../tests/test_utils/service-runtime-fixture.ts`) already does, and update the imports. Then re-run the workers publish dry-run and check the file list.
- No other export, behaviour or debt entry changes. `services/src` stays at 12 entries.

## Source review (no other blockers)
- **Auth before I/O:**
  - Both factories call `assertServiceAuthPolicy` before any environment read, port lookup, dynamic import, storage or listener (`workers/services/src/service.ts:79`, `streams/services/src/service.ts:85`).
  - Both module files have only type imports and constants at the top level.
- **Port precedence:**
  - Workers: `serve.port`, then `context.env.PORT`, then `PORT`.
  - Streams: `serve.port`, then `PORT`, then `STREAMS_PORT`.
  - Error messages and number parsing match main. The tests use non-numeric decoy `PORT` values to prove an explicit `port: 0` wins.
- **Legacy entrypoints:**
  - Workers: the old entrypoint now calls the new factory with the same public reason. `cors` is `undefined` either way and `.serve(undefined)` is unchanged, so behaviour matches main.
  - Streams: the old entrypoint passes the same reason and `origin: '*'`, and gets byte-identical method/header lists through the defaults. It still starts on import, and the legacy test checks the wildcard origin header.
  - One gain: streams now stops the upstream server if startup fails, which main didn't do.
- **CORS, proxy and health:**
  - Caller CORS settings override the stream protocol defaults one field at a time, and the origin is never forced. The tests cover exact, unrelated, lookalike, `null` and malformed origins, preflights for all six methods, and the origin header on a 401.
  - The proxy still removes the bogus content-encoding header and returns an empty, up-to-date response when a client long-polls a stream that doesn't exist yet.
  - Streams needs `protect: ['/']`, because the native auth default only guards `/api` (`auth-middleware.ts:33`). The examples, module docs and guide all say so.
  - A custom anonymous-request list replaces the default `/health` exemption, and the tests and guide match.
- **Lifecycle:**
  - Workers never closes the host's KV store or stream producer. Stop can safely be called twice, and the test confirms the port and KV are reusable afterwards.
  - Streams stops its own upstream server through a shutdown hook.
  - If `serve()` fails, workers leaves its runtime behind. Main already does this, so it is not a regression.
- **SDK identity and discovery:**
  - The internal credential is added through an explicitly composed authenticator. Discovery goes through `getServiceUrl`.
  - Combining the internal credential with a host-supplied credential is rejected with `SDK_CONTRIBUTION_CONFLICT`. Using a credential derived for the wrong service returns 401.
  - The tests check that no secret material appears in logs, errors or response bodies.
  - The guide's credential example without a secret is valid: `secret` is optional and is loaded from the secret-file environment variable.
- **Guide:** it matches the source. The sagas/triggers boundary is stated without expanding #829 or #2364.

## Debt decisions
- **Existing workers (22) and streams (21) type-export debt: ACCEPTED as unchanged.** The `mod.ts` exports match the listed names exactly (2+1+7+12 and 2+7+12), and the 2026-11-10 deadline is not extended.
- **`HOST-POLICY-PUBLISHED-GRAPH-2396`: ACCEPTED.** `release-gates.md:38-39` requires exactly this deferral when a change alters plugin publish shape, and the packages can't be installed from JSR before they exist. Its limits are right: release-owned, first 0.0.9 canary, before stable, no pre-merge waiver. A publish dry-run remains static proof only.
- **`WORKERS-HOST-METADATA-CARDINALITY-2396`: ACCEPTED.** Doctrine `05-folder-structure.md:125` requires a CHANGELOG entry when exports change. The cap is fixed at 20 against main's 19, the deadline is 2026-11-10, and it adds no source-folder exception or scan exclusion. The CHANGELOG isn't in the published file list.

## Validation limits
- I ran nothing and wrote nothing. `git diff`/`log` were denied in this session, so I compared files directly against a checked-out tree of main `6a71cd05`.
- All test, gate and dry-run numbers come from the committed evidence, not from runs of mine.
- PR CI, `e2e-cli-gate` and the published-package proof are **pending or unproven**, not green.
- The full-export doc lint is red at the same counts as main (workers 2, streams 3, Fresh 45). The new factory paths have 0.
- The workers OpenAPI document returns 500 on main too; this branch is only tested to match main, not to be healthy.

VERDICT: CHANGES 6a6e390fcdaf8bab60d5cf1a1c1e280e9ab83a8e
