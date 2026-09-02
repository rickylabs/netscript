# Research — locale SDK client contribution (#1467)

Baseline: `origin/main` / `77ad823dcb1874ccfc8964b4679ad92a3a145e0b`.

## Descriptor audit

The RFC 0001 descriptor contract already supplies the general machinery; this slice only needs a
first-party locale descriptor and consumer evidence.

- `SdkClientContribution` owns a versioned id, a typed context declaration, an exclusive lower-case
  header tuple, one response-cache law (`invariant`, `partitioned`, or `direct-only`), and one
  preparation callback. `defineSdkClientContribution()` preserves literal ids/header tuples/cache
  modes while validating each descriptor.
- `prepared-call.ts` validates exact descriptor fields, protocol major 1, id syntax, plain context,
  lower-case header syntax, per-descriptor limits, and the 16-contribution tuple cap. It rejects
  duplicate ids/context/header owners in tuple order and projects only declared context into each
  contribution.
- Reserved context keys are `signal`, `cache`, `retry`, `retryDelay`, `shouldRetry`, `onRetry`, and
  `traceHeaders`. Reserved headers include `content-type`, `traceparent`, `tracestate`, Fetch
  forbidden headers, `proxy-*`, and `sec-*`. `accept-language` is not reserved and is therefore a
  valid contribution-owned header.
- Preparation runs through the private prepared-call port, observes cancellation, validates emitted
  patches against declared ownership, and converts contributor failures to framework-authored,
  cause-free `SdkClientContributionError` diagnostics.
- Partitioned cache keys come only from each descriptor's synchronous `partition` callback. Pairs
  are sorted by contribution id, then appended to full server and TanStack keys; invariant tuples
  remain unsuffixed and direct-only services are omitted from generated query surfaces.
- The existing client/query/preset generic algebra already carries literal contribution tuples into
  direct clients, query factories, and `defineServices()` generated clients/query utilities.

## Reference implementation and baseline drift

The issue names `packages/plugin-auth-core/src/sdk/bearer-contribution.ts` as merged reference code.
That file is not present on the required main baseline. It exists on
`origin/feat/sdk-credential-contribution` at commit `fde87fe10`; the commit is not an ancestor of
`origin/main` (`git merge-base --is-ancestor` exit 1). Its conventions are still usable without
integrating the branch: a focused `create*SdkClientContribution` factory, explicit public return
type, fixed protocol/id/header ownership, public option/context types, and no ambient attachment.

Tests and documentation on this branch must therefore compose locale with an inline auth-shaped
descriptor. They must not import an unavailable auth-core subpath or merge/cherry-pick concurrent
work.

## Doctrine and placement

The current authoritative package assignment and verdict classify `packages/sdk` as Archetype 2 —
Integration, **Keep**, with the instruction to preserve discovery/client/cache adapter boundaries.
An earlier example paragraph in doctrine 06 mentions SDK under Archetype 4, but the later measured
assignment table, doctrine verdict table, and prior SDK harness research all classify it as A2; the
current measured assignment controls this run.

Locale belongs in `packages/sdk/src/client/locale-contribution.ts` and the existing
`@netscript/sdk/client` surface. Locale has no plugin lifecycle, manifest, backend adapter, or
separately versioned concern, so creating a plugin/core package would invent a distribution seam.
The SDK already owns request-contribution contracts and client composition. Exporting from the
existing client entrypoint also reaches the root barrel, so this is a public-symbol addition but not
an export-map/subpath change.

Relevant doctrine posture: A1/A2 public types first, A5 composition, A8 one reason per file, A11 the
named request-header axis, AP-9 avoidance (no second contribution abstraction), AP-11 avoidance (no
ambient locale/global state), and F-5/F-6/F-7 public-doc/publish gates.

## JSR/public-surface baseline

- Package metadata and the existing `./client` export are valid; no manifest or dependency change
  is needed.
- The planned factory and context type require explicit exported annotations and JSDoc.
- Baseline full-export doc lint: exit 1, 3 unique `private-type-ref`, 0 missing JSDoc, 0 other. The
  exact files are `src/ports/query-client.ts`, `src/query-client/query-client-factory.ts`, and
  `packages/plugin-streams-core/src/application/create-durable-stream.ts`. The `./client` entrypoint
  is clean. Post-change diagnostics must be an exact subset and the new symbols must be clean.
- Baseline `deno.lock` SHA-256:
  `e52c167e48e78a3c822ee1e63d5874401e1a02d0c49c214e1cd2df189272c46d`.

## Open questions

None that force implementation rework. The owner fixed the public home, partition law, prohibited
files, evidence rows, gate set, PR metadata, and no-closing-keyword policy.

