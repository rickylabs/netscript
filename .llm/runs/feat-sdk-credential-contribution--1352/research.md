# Research — typed bearer credential contribution (#1352)

## Re-baseline

- Carried-in source: `clustered-plan.md`, section “Slice S5 — typed bearer credential contribution
  (`#1352`)”, plus RFC `rfcs/0001-sdk-client-contributions.md`.
- Re-derived against `origin/main` @ `fafffd58d3ebcb52dd217891d706cdde3a01a5e5` on 2026-09-02.
- Branch source differs from that base only by the committed cluster brief; package/plugin source is
  byte-identical to the base before implementation.
- The carried lock hash `01ff3a…55cbe` is historical. Current base and working-tree `deno.lock`
  hash is `e52c167e48e78a3c822ee1e63d5874401e1a02d0c49c214e1cd2df189272c46d`.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | The stable public seam is `SdkClientContribution`; preparation receives projected context, normalized procedure metadata, and resolved transport facts. | `deno doc --filter SdkClientContribution packages/sdk/mod.ts`; `packages/sdk/src/ports/sdk-client-contribution.ts` |
| 2 | `defineSdkClientContribution()` already validates descriptors; S5 can be a public auth-core consumer without SDK internals or new client options. | `deno doc --filter createServiceClient packages/sdk/src/client/mod.ts`; `packages/sdk/src/client/sdk-client-contribution.ts` |
| 3 | `PluginContributions` has no SDK-client group and `PluginBuilder` has no corresponding method. | `deno doc --filter PluginContributions packages/plugin/mod.ts`; `deno doc --filter PluginBuilder packages/plugin/mod.ts` |
| 4 | Auth procedures are currently unmarked; the SDK normalizer already preserves `none`, `optional`, and `required`. | `packages/plugin-auth-core/src/contracts/v1/auth.contract.ts`; `packages/sdk/src/internal/client-contributions/stable-v1-adapter.ts` |
| 5 | The server authenticator already accepts `Authorization: Bearer …` through a WebCrypto comparison and is reusable in a fake-fetch compatibility test. | `deno doc --filter createStaticCredentialAuthenticator packages/service/src/auth/mod.ts`; `packages/service/src/auth/static-credential-authenticator.ts` |
| 6 | `port` and `timeout` remain accepted and deprecated on `CreateServiceClientOptions`; S5 has no reason to touch them. | `deno doc --filter CreateServiceClientOptions packages/sdk/src/client/mod.ts` |
| 7 | The auth installer currently emits `auth/plugin.ts` and `auth/mod.ts`; a third starter resource can make the bearer contribution available without attaching it to a service. | `plugins/auth/src/adapter/plugin.ts`; `plugins/auth/src/adapter/resources/resources.test.ts` |
| 8 | Current doc-lint baselines are SDK 3, service 0, auth-core 4, plugin 15, auth plugin 13 combined findings. All are `private-type-ref`; missing JSDoc is zero. | `deno task doc:lint --root <root> --pretty` before implementation |

## jsr-audit surface scan (package/plugin waves)

- Surfaces scanned: complete export maps for `packages/plugin-auth-core`, `packages/plugin`, and
  `plugins/auth`.
- `packages/plugin-auth-core`: audit exits 0 with one pre-existing slow-type warning; the planned
  `./sdk` subpath must add no diagnostic and must carry `@module` docs.
- `packages/plugin`: audit exits 1 on four pre-existing missing-module-tag findings plus existing
  cardinality warnings; the changed `./config` and `./sdk` surfaces must add no finding.
- `plugins/auth`: audit exits 0 with pre-existing cardinality and slow-type warnings; manifest and
  starter resources must remain secret-free and publishable.
- Planned exports use explicit return types, package-owned types, ESM, public subpaths, and no
  ambient environment access. Publish dry-runs and doc-lint A/B are required after implementation.

## Open questions

- None. Factory shape, metadata defaults, cleartext exceptions, cache law, manifest reference
  fields, explicit selection, touch set, and deferrals are locked by the RFC and clustered plan.
