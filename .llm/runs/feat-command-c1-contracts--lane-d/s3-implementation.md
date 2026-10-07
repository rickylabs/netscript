# C1 S3 implementation evidence — frozen supervisor handoff

S1 was signed off at `5023427004b37a561570a1a23bb4b7e21faf0c51`; S2 at `f9d0ccc99f1ecf98de4d8778196be99b4d795c1b`. Locked S3 is implemented and frozen for substantive supervisor review. No final implementation verdict or whole-chain completion is claimed. C1 acceptance evidence boxes1–4 are recorded; box5 remains pending independent IMPL-EVAL. No executor/later leaf, commit/push/GitHub action or evaluator artifact edit by this lane.

## Product and consumer proof

The only S3 product addition is `packages/service/tests/commands-consumer_test.ts`. Its named test composes real contracts/service command exports: immutable definition/envelope, response encode→canonical storage→strict decode, route metadata, and safe service failure→opt-in transport conversion. It preserves the retry hint and excludes a trusted cause. It adds no production behavior or duplicate codec algorithm assertions. The production retry-hint mutation makes this exact test fail with exit1, then restored source passes with exit0; [mutation evidence](./s3-mutation-evidence.json).

Clean consumers reuse S1/S2 real-export positive/negative fixtures. Source qualification includes the actual SDK/client import, exact nine-code/client metadata checks, selected-definition input invariance, immutable/opaque definitions, actor/version/failure negatives and private-capability rejection. The standalone smoke executes against copied published sources. Both consumer profiles have workspace:[] and explicit entrypoint maps; they inherit no repository workspace aliases. Upstream and first-party dependency mappings come from materialized member manifests; test-only SDK/client is explicitly release-matched0.0.7. There are no ambient shadow types, casts, suppression comments or --no-lock consumer shortcuts.

Native `.llm/tools/release/publish-workspace.ts` materializes all catalog entries through its existing dry-run path. An injected scoped command runner performs actual native publish dry-run and pack for contracts/service, then copies only native publication-inventory files into the isolated source consumer. Catalog imports become exact manifest npm ranges through the existing tool. No repository tooling was rewritten. Native file inventories contain24 contracts source files and38 service source files, all declared entrypoints and command implementations, and no tests/run artifacts. Native archives contain22 contracts and27 service declaration files. See [JSR audit](./s3-jsr-audit.json).

The emitted declaration profile uses unmodified native .d.ts output and those same explicitly declared dependencies. Deno direct local .d.ts imports initially followed relative .js exports as JavaScript, losing types; that nonzero probe is retained. Explicit import-map routes now select each real companion .d.ts for its generated relative .js specifier, with no emitted-file rewrite or source fallback. Both real-export fixtures pass. To prove the checker detects declaration loss, a production expectedVersion widening is packed into regenerated native declarations: the negative fixture fails with TS2578/exit1, then a restored native pack and frozen declaration check pass0. Both native pack attempts themselves exit0. This is genuine generated-declaration qualification, separate from source checking.

Each isolated consumer created its own lock on the initial check and repeated with --frozen. Final source and declaration checks exit0 with unchanged before/after lock hashes. The clean source smoke also passes with --frozen. Exact config/dependency routing and hashes are in [source manifest](./s3-source-manifest.json), and the initial/final reports are in [consumer evidence](./s3-consumer-evidence.json).

## Actual stable gates

[Gate evidence](./s3-gate-evidence.json) records actual argv, pre-signoff head, exits and source-manifest identity. Raw receipts remain task-private.

| Gate | Actual exit | Result |
| --- | --- | --- |
| Frozen structured contracts/service check | 0 | 93 files, no diagnostics |
| Complete affected package regressions | 0 | 180 passed, 0 failed, 0 ignored; baseline179 plus new consumer test |
| Structured contracts/service lint and source fmt | 0 / 0 | 93 files, no findings |
| Full-map service docs | 0 | All four entries, zero findings |
| Full-map contracts docs | 1 | Unchanged sanctioned17 combined upstream oRPC refs; missingJSDoc0/other0 |
| quality:scan / arch:check | 0 / 0 | Durable receipts; no new findings or suppression, existing architecture warnings |
| Whole-map docs export/symbol drift | 0 | Native complete inventory qualification |
| Root frozen production install | 0 | Actual deno ci --prod; before/after lock hashes equal |
| Native materialized contracts/service publish | 0 / 0 | Default isolated declaration/fast-type bar, no allow-slow-types override |
| Native contracts/service pack | 0 / 0 | Real emitted declarations and audited file inventories |
| Clean source / emitted declaration frozen check | 0 / 0 | Real positive/negative fixtures; locks unchanged |
| Clean source frozen runtime smoke | 0 | One new consumer test passes |
| Production runtime / emitted declaration mutations | 1→0 / 1→0 | Named runtime failure and fixture diagnostic, restoration proved |
| git diff --check | 0 | No whitespace defects |

Contracts raw doclint1 uses the existing doctrine/02-public-surface.md section “Sanctioned exception: slow-types for oRPC-bound packages”, already substantively reviewed in S1. It is unchanged in S3, no new waiver or type erasure; isolated publish/pack pass independently. Service docs are zero.

JSR review confirms scoped names, release versions, valid complete export maps, descriptions within250characters, license metadata, module/symbol documentation and default fast declaration extraction. Both root mod.ts files match baseline byte-for-byte. Service bindings export only marker/capability types; no runtime handler/token/key is exposed by the manifest. Published file lists exclude new and existing tests. Direct StandardSchema and database imports remain the accepted S2 pins with no lock or dependency changes in S3.

Native pack limitation: npm-format package.json omits the type-only StandardSchema/database dependencies while emitted declarations retain their imports. This run qualifies JSR source/import maps and emitted declarations with declared member dependencies, not an npm release. No npm consumer completeness or authenticated registry upload is claimed, and unrelated pack tooling remains unchanged.

## Supervisor review boundary

Review this frozen slice and all22 C1 source hashes, then own sign-off/commit/push/comment reconciliation. Independent separate-family C1 IMPL-EVAL must still review the exact signed-off head; acceptance box5 stays pending. Later leaves remain outside this lane. Root production install and all final subprocesses route writable runtime directories into task-private storage. No cache/lock deletion or reload was performed by this S3 lane.
