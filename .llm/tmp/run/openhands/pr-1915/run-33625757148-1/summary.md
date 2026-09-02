# IMPL-EVAL — PR #1915 (`feat(sdk): add typed bearer credential contribution`)

## Summary

Formal IMPL-EVAL for issue #1352 at immutable head `a6fababde`. **Verdict: PASS.** All six judgment
points verified against commands run in this session; focused suites 10/10 green at this exact head.
Verdict posted as PR comment https://github.com/rickylabs/netscript/pull/1915#issuecomment-5509109094.

## Head-diff claim — AGREED

`git diff 88df4839e a6fababde --stat` → exactly 4 files (`.llm/assets/agent-docs/prose.json.gz`,
`provenance.json`, `packages/cli/src/kernel/assets/agent-docs.generated.ts`,
`packages/mcp/src/publish-assets.generated.ts`), 12 insertions / 12 deletions, no product source
moved. The prior evaluation at `88df4839e` carries by byte-identity.

## Gate state (cited, not re-derived)

CI run `33617994226` has `headSha = a6fababde69a6964914207d7bc8ec29cb8b4d84e` (verified via
`gh run view`): `check-test` pass (10m37s), `quality` pass (3m23s), `code-quality` pass (27s),
`build` pass (51s), `core CI lane visibility` pass. `close-gate` fail is solely the unticked
"Separate-session IMPL-EVAL passes" DoD box — this verdict. Not an independent defect.

## Judgment points

1. **Explicit-only contribution — PASS.** Descriptors flow declaratively: plugin builder
   `withSdkClients()` (`packages/plugin/src/config/builders/plugin-builder.ts:168`) →
   `contribution-merger.ts` (non-mutating concat) → host discovery
   (`resolveSdkClientContributions`, `packages/plugin/src/sdk/mod.ts:14`). The bearer descriptor
   (`plugins/auth/src/adapter/resources/sdk-client.ts`) is registered via the auto-discovered
   resources module — declaration, not attachment. `grep -rln '@netscript/plugin-auth-core/sdk'`
   finds only that resource file + docs. Credential attach happens only inside
   `createServiceClient` after explicit contract `$meta({access:{authentication}})` resolution.
   Test "bearer contribution module is universal and has no ambient credential reader" pins it.
2. **Non-disclosure — PASS.** `bearer-contribution.ts` rethrows resolution `TypeError` and
   partition errors bare (no credential material); transport policy error names only the URL
   protocol (cleartext test at `bearer-contribution_test.ts`). SDK redaction pinned:
   `SDK_PREPARATION_FAILED` contains only `contributionId` + `procedurePath`
   (`packages/sdk/src/internal/client-contributions/prepared-call.ts:459`);
   `packages/sdk/tests/client-contribution-validation_test.ts:313-328` asserts
   `SDK_CACHE_PARTITION_INVALID` messages exclude both the partition-source secret and the context
   value.
3. **Cache partitioning caller-selected — PASS.** Partition hook signature is
   `partition({ context, procedure })` — the token is never passed
   (`bearer-contribution.ts:71-74`, `90-93`). `resolveSdkClientCachePartition` resolves only
   declared `context`/`procedure`, never `authorization`. Test "bearer cache policy remains
   caller-selected and non-secret" (`bearer-contribution_test.ts:161-176`) uses a
   `crypto.randomUUID()` credential and asserts `partition === 'tenant-blue'` AND
   `assertFalse(partition.includes(credential))` — it fails if token-derived. Pairs then
   concatenate only after validation, so validated declarative data alone reaches cache keys.
4. **Public surface — PASS.** `deno doc --json packages/plugin-auth-core/src/sdk/mod.ts` →
   exactly `createBearerSdkClientContribution`, `CreateBearerSdkClientContributionOptions`,
   `NetScriptAuthenticationRequirement`. Zero references to `createHttpClientLink` /
   `ClientLinkPort` / `ClientLinkCallOptions` anywhere in `packages/plugin-auth-core/src/`;
   `packages/sdk/deno.json` exports no `./internal` subpath; `packages/sdk` untouched by the PR.
   #1349 privacy holds.
5. **Scope — PASS.** 30 product/docs files = 27 hand-authored + 3 regenerated carriers (matches
   the ceiling). Forbidden surfaces untouched: `git diff origin/main...HEAD --name-only` shows no
   `prepared-call.ts`, no `traceparent`/`tracestate`, no `packages/sdk/**` file, no
   `client-contributions/` path. #1921/#1353 surfaces intact.
6. **Deferred scope — HONEST.** `FetchAuthSessionHttp.list/revoke`
   (`packages/cli/src/public/features/plugins/auth/auth-session-client.ts`) accept raw URLs and
   issue raw `fetch` with a fixed header set; the `AuthSessionHttpPort` signature has no
   prepared-header parameter, so the typed SDK transport (prepared headers + context contract)
   cannot back it 1:1. Deferral is genuinely blocked, not evasive.

## Changes

None (review-only task). No code, no commits, no push. Deliverables: verdict PR comment (link
above) and this summary file.

## Validation

- `deno test --no-check -A packages/plugin-auth-core/src/sdk/bearer-contribution_test.ts
  packages/plugin/tests/config/sdk-client-contributions_test.ts` → ok | 10 passed | 0 failed (2s)
- `deno doc --json packages/plugin-auth-core/src/sdk/mod.ts` → 3-symbol surface (above)
- Gate states + head SHA via `gh pr checks 1915` / `gh run view 33617994226`
- Scope via `git diff --name-only 88df4839e a6fababde` and `git diff --name-only origin/main...HEAD`

## Remaining risks

- `close-gate` stays red until the supervisor ticks the DoD box with this verdict reference.
- The bearer descriptor is exposed through the auto-discovered `resources/sdk-client.ts` module —
  correct per the resources archetype, but plugins wishing to omit bearer support must drop the
  resource rather than a flag; acceptable and documented.

OPENHANDS_VERDICT: PASS
