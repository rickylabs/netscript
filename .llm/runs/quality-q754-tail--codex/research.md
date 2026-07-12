# Research — quality-q754-tail--codex

## Re-baseline

- Carried-in source: rejected unreachable commit `f656c0ca7a160447969b16d565a623712e4886c5`.
- Re-derived against baseline `3b3d615bb535d985e49a4d2dcdcce5e03097babc` on 2026-07-12.
- The rejected pass made the scanner green with 6 `quality-allow` markers. This run started from
  the mandated hard reset and found 16 unsuppressed findings with `allowCount: 0`.
- The remote branch was not advertised by `origin`; the rejected commit and allowance count were
  recovered from Git unreachable objects, not restored into the worktree.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | Baseline scanner reports 16 findings and 0 allowances across the seven roots. | Run the exact scanner command in the slice brief. |
| 2 | Three findings are prose-only lexical matches (`any` in Aspire, bench, and SDK comments). | Scanner output at the baseline SHA. |
| 3 | oRPC publicly exports `StandardHandlerOptions`, `StandardHandlerPlugin`, `Context`, and `ProcedureClientInterceptorOptions`; telemetry does not need a variadic `any` compatibility surface. | Cached `@orpc/server@1.14.6` declarations and `deno doc`. |
| 4 | oRPC method inference requires `AnyContractRouter`; SDK's public `ContractLike` deliberately exposes only a smaller structural metadata view. A runtime structural type guard can narrow that boundary without a cast. | `@orpc/contract@1.14.6` `AnyContractRouter` and `inferRPCMethodFromContractRouter` declarations; `packages/sdk/src/ports/service-client.ts`. |
| 5 | `BASE_PLUGIN_ERRORS.data` is published as `unknown`, while `oc.errors` requires standard-schema values. A schema guard plus a typed normalizer can turn the shared vocabulary into an `ErrorMap` without post-hoc casting. | `packages/plugin/src/contract-base/domain/base-errors.ts`; oRPC `ErrorMap` declaration. |
| 6 | Fresh UI's icon helper returns a Preact VNode, but `PrimitiveNode` duplicates it structurally; using the upstream VNode type removes the cast. | `packages/fresh-ui/src/presentation/primitives.tsx`. |
| 7 | The accordion trigger is rendered as `<summary>` but publicly typed as button attributes, forcing an event cast. Correcting the element contract makes the handler event exact. | `Accordion.tsx` and `accordion.types.ts`. |
| 8 | Preact intrinsic styles accept string or object style values; `mergePlatformStyle` incorrectly promises object-only `JSX.CSSProperties`. | Preact JSX declarations and all `mergePlatformStyle` consumers. |
| 9 | Dynamic OpenTelemetry modules can be loaded as `unknown` and validated with module-specific constructor/handle guards before use. The rejected generic `loadSdkModule<T>` cast would merely relocate unsoundness. | `packages/telemetry/src/adapters/otel/otel-sdk.ts`; rejected commit diff. |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: all declared export maps in the seven `deno.json` files and their root
  entrypoints. `@netscript/bench` is `publish:false`; the other six are JSR packages.
- Slow-type/surface risks: public Preact node and accordion prop types may change to their truthful
  upstream/intrinsic forms; oRPC-bound plugin cores may retain upstream private-type diagnostics but
  must not retain source casts; telemetry public plugin types must remain explicitly annotated.
- Planned proof: per-package full-export `doc:lint`, package-local publish dry-run, scoped
  check/lint/fmt, and tests. No export-map or dependency-version change is planned.

## Open questions

- None that force rework. If a package gate exposes an upstream invariant that cannot be narrowed
  by a guard or generic, stop and document it before considering an allowance; the ceiling is not
  permission to pre-approve one.

