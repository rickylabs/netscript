# Research — feat-cli-auth-session-typed-transport--1352

## Re-baseline

- Carried-in source: issue #1352, merged PR #1915 (`37452f11f`), and its IMPL-EVAL.
- Re-derived against `main` @ `37452f11f5045f0f5a98e07d802bcc2a2e94333b` on 2026-09-02.
- What changed vs the carried-in version:
  - Nothing had drifted: `HEAD`, `main`, and `origin/main` matched the merge commit and the worktree
    was clean.
  - The live issue still had all seven acceptance rows unticked. The coordinator's latest comment
    identified row 2 as the residual and allowed either a transport extension or a narrower honest
    migration.

## Acceptance audit before implementation

| Row | Classification | File / symbol | Test or evidence |
| --- | --- | --- | --- |
| 1 | SHIPPED | `packages/plugin-auth-core/src/sdk/bearer-contribution.ts` / `createBearerSdkClientContribution`; `src/sdk/mod.ts` exports exactly three symbols | `bearer contribution module is universal and has no ambient credential reader`; `deno doc packages/plugin-auth-core/src/sdk/mod.ts` |
| 2 | PARTIAL | Application-supplied typed context exists in the public bearer contribution and docs, but `packages/cli/src/public/features/plugins/auth/auth-session-client.ts` / `FetchAuthSessionHttp` still issues raw exact-URL requests without the contribution | `bearer contribution makes its declared client context required`; existing `fetch session adapter lists projections and revokes through signout` proves exact URLs but no authorization header; PR #1915 explicitly deferred this adapter |
| 3 | SHIPPED | Public bearer contribution prepares the header and omits it when metadata/context says none/optional; server authentication is exercised end to end | `bearer procedure metadata controls credential resolution`; `public SDK retry and server authentication keep credentials undisclosed`; `bearer contribution makes its declared client context required` proves omission keeps request options optional |
| 4 | SHIPPED | `packages/plugin-auth-core/src/contracts/v1/auth.contract.ts` / procedure `meta.access.authentication`; bearer factory reads that metadata | `authContract declares public and credential-required routes`; `bearer procedure metadata controls credential resolution`; no `policy.public` dialect found |
| 5 | SHIPPED | `createBearerSdkClientContribution` makes contribution attachment explicit and declares its cache policy | `bearer cache policy remains caller-selected and non-secret` asserts `assertFalse(partition.includes(credential))`; `bearer contribution makes its declared client context required` compares attached and omitted clients |
| 6 | SHIPPED | SDK contribution reads only caller context; plugin manifest advertises rather than activates it | `bearer contribution module is universal and has no ambient credential reader`; PR #1915 explicit-starter and manifest tests; docs leave cookie/session/environment policy with the auth pack |
| 7 | SHIPPED | `docs/site/services-sdk/sdk.md` contains a complete authenticated typed call using the three public packages | PR #1915 IMPL-EVAL recorded root checks, tests, and publish dry-runs; this residual reruns every requested gate before closure |

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | The public SDK cannot target an arbitrary exact URL. `CreateServiceClientOptions` accepts discovery identity and path shaping, and its deprecated `port` is ignored. | `deno doc --filter CreateServiceClientOptions packages/sdk/mod.ts`; `packages/sdk/src/client/service-client.ts` |
| 2 | The CLI endpoints are not one SDK RPC surface: list GETs the supplied stream URL verbatim, while revoke POSTs `<authUrl>/signout`. | `packages/cli/src/public/features/plugins/auth/auth-session-client.ts` / `FetchAuthSessionHttp` |
| 3 | `packages/sdk/src/internal/**` is private under #1349 and has no package export. Reaching it from CLI would violate the public contract. | `packages/sdk/deno.json`; issue #1349 contract; source path audit |
| 4 | The public contribution descriptor is the sanctioned extension protocol: its `prepare` receives typed context, procedure metadata, and transport facts and returns a header patch. It does not own discovery or fetch. | `deno doc --filter SdkClientContribution packages/sdk/mod.ts`; `deno doc --filter SdkClientPrepareOptions packages/sdk/mod.ts` |
| 5 | A narrow migration can preserve exact URL behavior while using the canonical public bearer contribution to prepare authorization. This meets “application code supplies the bearer token/context,” routes credentials through the typed SDK contribution protocol, and adds no server-only import. | Planned focused CLI tests and import scan |
| 6 | Full request migration to `createServiceClient` is impossible without widening the public SDK transport surface and would mis-model the list endpoint. | Comparison of `FetchAuthSessionHttp` behavior with `CreateServiceClientOptions` public docs |
| 7 | `deno.lock` baseline SHA-256 is `e52c167e48e78a3c822ee1e63d5874401e1a02d0c49c214e1cd2df189272c46d`. | `sha256sum deno.lock` |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `packages/cli/mod.ts`, `scaffolding.ts`, `testing.ts`, and the proposed internal
  CLI auth-session files.
- Baseline `deno task doc:lint --root packages/cli --pretty`: exit 0, 0 diagnostics.
- Baseline `jsr-audit packages/cli`: exit 0 with 20 pre-existing warnings (helper/cardinality and
  slow-types advisories); no proposed public export is needed.
- Slow-type / surface risks: none added because the adapter/context seam remains below existing CLI
  entry points.

## Open questions

- Resolved for PLAN-EVAL: use the public contribution descriptor directly for credential
  preparation, while retaining exact-URL fetch ownership in the adapter. Do not claim discovery or
  RPC transport migrated.
- Resolved for PLAN-EVAL: application injection is an optional per-command context resolver; no
  flag, cookie, session reader, or environment convenience is introduced.
