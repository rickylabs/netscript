# refactor(sdk): HTTP method and GET-cache policy are decided inline inside the link — oRPC v2's POST-only default would break every client call path — DRAFT (no GitHub mutation; owner ratification pending)

**Draft-ID:** T1-04 · **Proposed milestone:** `0.0.7` (post-rename-shift "Typed seams +
generation", SYNTHESIS §5.3) · **Labels:** `type:refactor` `area:sdk` `area:contracts` `area:deps`
`priority:p1` `status:triage` · **Depends on:** T1-01 (RFC-A ratification, §3.11); must land before
or with T1-02

## Summary

NetScript's HTTP transport policy — which procedures are GET, and which requests are deduplicated
and cached — is three literals sitting inside `createHttpClientLink`. oRPC v2 is in public beta and
its `main` branch already carries `feat(rpc): restrict RPC handlers to POST, PUT, PATCH and DELETE by
default` plus a `MethodOverrideHandlerPlugin`. Once T1-02 makes the link publicly composable, that
policy becomes observable to every contribution and every app, and the v2 migration stops being a
one-function change. Consolidating it behind one NetScript-owned function now is cheap; doing it
after a public extension seam exists is not.

## Evidence

- Corpus: `research/external/orpc.md` §0 (v2 `beta` dist-tag `2.0.0-beta.25`; the two v2 commits
  verified absent from the 1.14.15 tarball), §6 "Upgrade implications" — *"Plan the remediation so
  the transport policy lives behind one NetScript-owned function, not scattered across link
  construction — otherwise the v2 migration touches every client call path"*;
  `research/repo-audit/services-sdk.md` §0, §3.1, gap register S21/S22.
- Source at baseline `fac9e339042c` (re-verified for this draft):
  - `packages/sdk/src/client/http-client-link.ts:17,82` — `inferRPCMethodFromContractRouter` is
    imported from `@orpc/client` and applied inline as `method:`. Repo-wide, `grep -rn
    'inferRPCMethodFromContractRouter\|StrictGetMethodPlugin\|fallbackMethod' packages plugins`
    returns **only** these two lines — there is no owned policy function anywhere.
  - `packages/sdk/src/client/http-client-link.ts:109` —
    `filter: ({ request }) => request.method === 'GET'`, i.e. the dedupe policy re-derives the method
    decision from the wire instead of from the contract.
  - `packages/sdk/src/client/http-client-link.ts:110-125` — the `force-cache` group condition is a
    second, independent literal keyed off `context?.cache`.
  - `packages/sdk/src/client/http-client-link.ts:103-107` — `ClientRetryPlugin` default frozen at
    `retry: 0`; `research/repo-audit/services-sdk.md` §3.2 lists the three upstream client plugins
    (`BatchLinkPlugin`, `RetryAfterPlugin`, `SimpleCsrfProtectionLinkPlugin`) that are unreachable.
  - `packages/sdk/src/desktop/application/desktop-rpc-client.ts:18-20` — the second transport makes
    its own independent decisions (`customJsonSerializers`), so there is already policy divergence
    across two links with no shared source of truth.
  - Version state: `deno.json:215-221` pins `^1.14.6` (`@orpc/otel` `^1.14.7`); `deno.lock` resolves
    `1.14.6`, which drags `@orpc/shared@1.14.6` **and** `@orpc/shared@1.14.7` into one graph — a
    known `instanceof ORPCError` hazard the pinned client already ships a `Symbol.hasInstance`
    workaround for (`research/external/orpc.md` §6).

## Current surface

Three coupled decisions with no owner: the contract-derived method, the GET-only dedupe filter, and
the `force-cache` grouping. They are consistent today only because one function wrote all three. A
consumer reading the SDK cannot discover the policy without reading the link body, and nothing
prevents the desktop link, a future in-process link (#451), or a contribution from disagreeing with
it. `deno task deps:latest` reports all seven oRPC packages at `1.14.6/1.14.7 → 1.14.15`, and the
1.14.6 → 1.14.15 public export list for `@orpc/server` is byte-identical, so the bump itself is
mechanical.

## Target contract

Per RFC-A §3.11:

1. One exported-internal function — e.g. `resolveTransportPolicy(contract, options)` — returns the
   full policy object: `method`, `fallbackMethod`, `maxUrlLength`, the dedupe predicate, and the
   cache-group descriptors. Every link (HTTP, desktop, and any future one) consumes it; no link
   re-derives policy from `request.method`.
2. The policy is derived from the **contract and procedure metadata**, not from the wire. When
   `NetScriptProcedureMeta.policy.cache` is present (RFC-A §3.6) it is an input to the policy
   function, not a second mechanism.
3. **Contributions never observe the HTTP method.** They observe procedure path, input, context and
   metadata. This is the forward-compat rule that keeps the v2 migration inside one function.
4. A documented policy-override point exists for the v2 transition (a single `transportPolicy?`
   option, resolved before contributions compose), so `MethodOverrideHandlerPlugin`-style adaptation
   is a config change rather than a code change.
5. oRPC is bumped `1.14.6 → 1.14.15` and the duplicated `@orpc/shared` copies collapse to one,
   using the `.llm/tools/deps/` wrappers rather than hand-rolled registry reads.

## Acceptance

- [ ] One NetScript-owned function returns the complete client transport policy for a contract.
- [ ] `createHttpClientLink` and the desktop link both consume that function; neither contains a
      method or cache literal.
- [ ] The dedupe predicate is derived from the resolved policy, not from `request.method`.
- [ ] Tests cover GET-inferred, POST-inferred, and metadata-overridden procedures against the policy
      function directly.
- [ ] NEGATIVE: a test asserts a contribution cannot read or alter the resolved HTTP method.
- [ ] NEGATIVE: a test pins the current wire behaviour (which procedures are GET, which requests
      dedupe) so the refactor is proven behaviour-preserving.
- [ ] A simulation test flips the policy to "POST for everything" and asserts every client call path
      still succeeds, standing in for oRPC v2's default.
- [ ] `deno task deps:latest` shows the oRPC family at `1.14.15` and `deno why @orpc/shared` shows a
      single resolved copy.
- [ ] `gate:` `deno task check`, `deno task test`, and `deno task publish:dry-run` pass.
- [ ] `gate:` `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` passes, proving the
      generated app's client calls are unchanged.

## Boundaries

- Do **not** migrate to oRPC v2 in this issue. This makes the future migration a one-function change;
  it does not perform it.
- Do **not** open the client construction seam here — that is T1-02. If T1-02 lands first, this issue
  must additionally prove no contribution can reach the method decision.
- Do **not** unfreeze the retry/dedupe defaults or expose `BatchLinkPlugin` / `RetryAfterPlugin` /
  `SimpleCsrfProtectionLinkPlugin` here — those become reachable through the contribution chain in
  T1-02.
- Do **not** duplicate **#1320** (`deps: collapse to a single Zod instance`, `0.0.6`, blocked) — that
  is a different duplicated dependency; this issue's dedup target is `@orpc/shared` only.
- Do **not** duplicate **#451** (in-process link-mode adapter) — it becomes a third consumer of the
  policy function, and stays its own issue.
- Do **not** change server-side handler method policy (`StrictGetMethodPlugin` and friends are
  unused today); server-side transport policy is out of scope.

## Docs/consumer proof

The SDK reference gains one short "transport policy" section stating where the method and cache
decisions are made and that they are contract-derived — replacing the current situation where the
only answer is "read `http-client-link.ts`". Consumer proof is the scaffold runtime E2E: the
generated app's showcase calls behave identically before and after, and the pinned-behaviour test
names the exact procedures whose method would change under oRPC v2, so the migration's blast radius
is a list rather than a guess.

## Provenance

Seed run `plan-fable5-remediation-roadmap--seed`, PR #1347, 2026-08-08. Sourced from
`research/external/orpc.md` §0/§6 (the explicit forward-compat recommendation) and
`research/repo-audit/services-sdk.md` (S21, S22); all cited lines re-verified against worktree
baseline `fac9e339042c`, including the repo-wide grep proving there are exactly two policy call
sites. No GitHub mutation was performed.
