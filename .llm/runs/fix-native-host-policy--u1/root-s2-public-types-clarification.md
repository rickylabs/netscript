# Root normative S2 public-type compatibility clarification

Coordinator `/root`, 2026-10-27, recorded before the authorized identity re-export change.
Original actual PLAN, addendum, verdict and first doc-lint failure remain unchanged.

Root read the actual five privateTypeRef findings on the new public module and service source.
If required by real doc-lint, identity re-exports of these EXISTING native public types through
the existing `./service` owner(s) are authorized:

- `PluginServiceContext` from `@netscript/plugin/sdk`.
- `CorsOptions`, `RunningService`, `ServeOptions` from `@netscript/service`.
- `ServiceAuthPolicy` from `@netscript/service/auth`.

These retain their exact native identities. This does not authorize new structural types,
aliases/options/behavior, another owner/dependency/lock change, or blanket `export *`. The original
two-named-export prose was not permission for undocumented expansion; this explicit root
compatibility clarification controls that narrow conflict. Prove the public consumer and actual
doc-lint, preserving the initial five-finding RED. Root reviews the final exact exports and gates.

Root also requires accurate docs: the existing caller context seam is ONLY `context.env.PORT`;
the plugin runtime still selects its native global `getKv`. Do not add RPC/host-context propagation
to satisfy inaccurate prose. Do not present a deliberately rejected context KV resolver as working
host setup. Verify the guarded recipe against the real native constructor, global KV registration
and listener options. Runtime principal/context identity remains the required S3 oracle.

No S2 acceptance, release approval, evaluator signoff or S3 scope expansion is implied.
