# Triage — #1589 split Fresh/SDK versions produce distinct cache-provider singletons

**P0, milestone 0.0.6. Next runtime blocker after Canary.4 terminal proof.** Not started.

## Root mechanism — located, not inferred

`packages/sdk/src/cache/cache-provider.ts:37`:

```ts
let _provider: CacheProvider | null = null;
```

A **module-local mutable singleton**. Two module instances — the app's `@netscript/sdk@0.0.5` and the
one `@netscript/fresh@0.0.6-canary.3` owns — each get their **own** `_provider` binding. The app
initializes its copy; Fresh reads the other, which is still `null`, and throws at `:62`
*"[NetScript SDK] Cache provider not initialized"*.

This is the classic **dual-package hazard**: it compiles, builds, and type-checks, because nothing in
the type system says "these two module instances must be the same instance."

## The distinction that must not be lost

#1589's symptom appears **on partial navigation** — *"route partials failed with `Cache provider not
initialized`"*. That is superficially close to the `isPartial` cache-suppression class
(EIS Chat #191 / closed-invalid #1550), and the two are **unrelated**:

| | #1589 | isPartial suppression (invalid) |
| --- | --- | --- |
| Cause | two SDK module instances, two singletons | a read/seed skipped because `ctx.isPartial` |
| Fix shape | make the closure coherent or reject incoherence | **none — the suppression itself is the bug** |
| Where it lives | package resolution / provider ownership | defer policy |

**Conflating them is actively dangerous:** someone reasoning "partials fail on cache access, so guard
the cache access on `isPartial`" would implement the **forbidden pattern** while appearing to fix
#1589. Recorded here so the eventual slice brief states it up front. See `guard-partial-cache.md`.

## Verified workaround — preserve, do not regress

Pinning the **full coherent closure together** — Fresh root **+** SDK **+** telemetry all at the same
canary — is verified working and stays the documented answer until a mechanical fix lands. Any fix
must keep that path valid rather than replacing it.

## Candidate fixes, ranked by "smallest mechanically enforced"

The issue asks for mechanical enforcement, so documentation alone is out.

1. **Reject incoherent closures at build/init (preferred first cut).** Detect that the Fresh root,
   its subpaths, and SDK resolve to different versions, and fail with a message naming the closure —
   rather than proceeding to a runtime `null` provider. Cheapest to enforce, changes **no** ownership
   semantics, and there is prior art to model on: `.llm/tools/validation/check-netscript-jsr-specifiers.ts`
   already rejects versionless/stale-exact/range-pinned first-party specifiers.
   **A subpath pin must not be able to imply a split root**, which is the issue's own wording.
2. **Declare an exact peer-compatible closure** for Fresh/SDK/telemetry so resolution cannot silently
   split. Complements (1); mechanical, but touches published metadata.
3. **Move the provider off module-local state** — e.g. a `globalThis`-keyed registry. This fixes the
   *class* rather than detecting it, but it is the **largest** change and carries its own hazard: with
   two versions loaded, which implementation legitimately owns the singleton? Not a first cut.

**Recommendation to carry into planning:** (1), optionally with (2). Option 3 is a design change that
deserves its own decision rather than being smuggled into a P0 fix.

## Sequencing

Behind Canary.4 terminal proof, then ahead of the other queued runtime work given P0 + consumer-exact
provenance. Plan + automatic PLAN-EVAL warranted — the choice among (1)/(2)/(3) is a genuine design
decision, not a mechanical fix. **No Fable, no manual OpenHands.**
