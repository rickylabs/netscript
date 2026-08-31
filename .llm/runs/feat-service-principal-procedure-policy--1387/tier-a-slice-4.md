# Tier-A — #1387 Slice 4 (contract-policy service ports, type contract only)

**Content head:** `9cc8c4c5f84acef262bca2cec9169ebbaa410eb5`
**Evidence head:** `3ee15ca913b37bc354c4670e8b6bfef05dc1d34c` — product-neutral
**Base:** `2d7d1b79a` · **Verdict:** ACCEPTED, certified after the routing-update hold (see below)

## The hold

This slice was dispatched and completed while a coordinator routing-update required obtaining a
sanctioned second-opinion IMPL-EVAL on **Slice 3** before releasing Slice 4. It was authored and
pushed correctly by its own thread, but I did not review it until that Slice 3 gate cleared — DeepSeek
V4 Flash 0731 independently concurred with Opus 5's `ACCEPTED_WITH_FINDINGS` on Slice 3 at `c297064aa`.
With Slice 3 doubly certified, this review proceeds.

## Ceiling

Exactly the six authorized files plus the corpus carrier under the standing exemption. No breach.
`deno.lock` byte-identical.

## Substance

`contract-policy.ts` defines a contract-local resolver keyed off `contract.~orpc.meta.access`
(`ContractPolicyContract`), a `ProcedurePolicyResolver` returning matched/unmatched with the policy
attached, binding types carrying the builder's *actual* REST/RPC prefixes and aliases
(`ContractPolicyBindingOptions`), and a factory signature
(`ContractAuthorizerFactory<TContract>`) that constructs the adapter from the contract itself. This
matches research finding 15's rejection of a router/URL-keyed policy map exactly: policy travels with
the contract, not a parallel structure that can drift from a renamed router key.

`MatchAwareAuthorizerPort` extends `AuthorizerPort` with `authorizeMatch`, returning
`{matched: false}` or `{matched: true, decision}` — the type that lets a fallback distinguish "no
rule applies" from "rule applies and denies," which research finding 5/6 requires so contract
metadata can win on disagreement rather than a path rule silently overriding it.

**`AuthorizerPort` is untouched.** `options.ts`'s diff adds only a new `ContractAuthorizerOptions`
type; `AuthnOptions`/`AuthzOptions` are unchanged. `createScopeAuthorizer` still satisfies
`AuthorizerPort` with no signature change — verified by the test file assigning
`createScopeAuthorizer({rules: []})` directly to `const standaloneAuthorizer: AuthorizerPort`.

## The type-assignability test is a real proof, not decoration

It constructs an actual `@netscript/contracts` procedure with `.meta({ access: {...} })` and reads the
result back through `~orpc.meta.access` — proving the shape round-trips through the real contract
builder, not a hand-typed stand-in. And it includes a **negative** proof:

```ts
const _invalidContractAuthorizerOptions: ContractAuthorizerOptions = {
  // @ts-expect-error Contract fallbacks must distinguish no match from an explicit deny.
  fallback: standaloneAuthorizer,
};
```

A plain `AuthorizerPort` is rejected as a `fallback` — only a `MatchAwareAuthorizerPort` qualifies.
That is exactly the invariant the design depends on, proved by rejection rather than by acceptance
alone. (This lane has been burned before by tests that only prove the right type is accepted; this
one also proves the wrong type is refused.)

## Gate results — all at content head `9cc8c4c5f`, `gitHead == actualGitHead`

| Gate | Outcome | Duration |
| --- | --- | --- |
| `check` (scoped) | PASS | 490 ms |
| `lint` (scoped) | PASS | 560 ms |
| `fmt:check` (scoped) | PASS | 496 ms |
| `test` (service) | PASS | 3 498 ms |
| `doc:lint` | PASS | 540 ms |
| `quality:gate` | PASS | 8 205 ms |
| `mcp-export-corpus` | PASS | 6 817 ms |
| `exports-drift` | PASS | 3 008 ms |
| `publish:dry-run` | PASS | 31 074 ms |

Evidence set **SUFFICIENT**, zero reasons. Corpus grew 7 628 → 7 652 symbols (24 new), consistent
with the twelve new public types this slice exports — an expected, explained delta, not drift.
Archives for Slices 1–3 present and untouched; top level holds only Slice 4's set.

## Findings

None beyond what the plan already anticipated. This is a clean type-contract slice with a genuine
negative-assignability proof.

## Verdict

**ACCEPTED.** Ceiling respected, lock unchanged, evidence set sufficient, `AuthorizerPort`
compatibility preserved and proven, contract-local design matches research's rejected-alternatives
reasoning, and the fallback-typing invariant is proved by a real `@ts-expect-error` rejection.
