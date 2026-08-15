# Tier-A plan review — #1355 + #1360 `app-service-client-wiring`

Reviewer: `topic-features-0.0.7`, native Claude Opus 5 · high · Remote Control, session
`19621a0b-c6a0-47c6-b826-93c1634a6875`. Opposite-family to the Codex author thread
`01a004f9-f033-7592-a0bc-63927753fb43`.

Subject: `research.md` (245 lines) and `plan.md` (251 lines) at head
`6aea4a5eaac4932605435d2a346da2c545f33d92`, PR **#1664** draft.

Verdict: **`CHANGES_REQUESTED`** — one required repair (T-1, gate class), one precision requirement
(T-2). No design finding; the plan's substance is sound.

## Phase-1 stop verified

| Check | Result |
| --- | --- |
| Author process | **terminal** |
| Tree | clean |
| local == remote == PR head | all `6aea4a5eaac4932605435d2a346da2c545f33d92` |
| PR #1664 | open **draft** |
| Closing keywords | **`Closes #1355`** and **`Closes #1360`** both present (body lines 7-8) |
| PR opened at first slice | yes — D-15 is discharged; the per-slice comment trail has an artefact from the start |

## What the plan gets right

**Citations were re-verified at the new base, and drift was recorded rather than absorbed.**
`research.md:5-6` states the carried-in citations were verified at `fac9e339042c` and re-derived at
`3fc0f2f92`; `:50` records one citation drift; `:93` records that the verb gap "only partly drifted";
`:203` records a reference-path drift (`.claude/05-frontend.md` absent at this baseline). This is
exactly the discipline #1293 taught — that leaf's stated gap 2 was false against live code, and a
plan that trusted the issue would have built the wrong thing.

**The key-shape mismatch is shown as data, not prose.** `research.md:39-48` gives the concrete
arrays: generated queries produce `['service', 'list', { input: … }]` and client keys
`['service', 'list', '{"limit":3,"offset":0}']`, while `bridgeInvalidation()` returns exactly
`[resource, action]` or `[resource]`. That is what makes #1355's dead-invalidation defect checkable
rather than assertable, and it also exposes the second half of the defect — two generated factories
sharing both cache namespaces because the object key is passed as `resource`.

**Compatibility is answered, not deferred.** D6 fixes the rule that existing apps change only when
newly generated or explicitly regenerated, and `:157` addresses generated-but-not-regenerated apps
directly. Package upgrades do not mutate consumer source.

**The expensive-gate release conditions are preconditions, not claims.** `plan.md:222-233` requires
the scaffold suite to *have been extended* before a lease is requested. It does **not** assert the
existing suite already proves two-service key isolation or invalidation — the failure mode the
coordinator warned against. That framing is correct as written.

## T-1 (required repair) — `scaffold.runtime` is the wrong gate class in this plan

The plan proposes routing `scaffold.runtime` through `.llm/tools/gates/run-gate.ts` and adding a
catalog entry: `:79` ("resolve the missing durable `scaffold.runtime` catalog entry"), `:101`
("recommend an allowlisted exact catalog entry with tests"), `:177` ("missing `scaffold.runtime`
run-gate catalog entry → resolve in PLAN-EVAL"), `:208` (gate 7 as an "allowlisted `run-gate.ts`
command"), and `:217` listing `receipts/s5-scaffold-runtime.json` among the binding receipts.

Verified against the repo rather than accepted from the correction:

- `.llm/tools/gates/catalog.ts` contains **no** `scaffold.runtime` entry. The only match on
  "scaffold" is `scaffold-versions` → `deno task check:scaffold-versions`, a different gate.
- `fresh-browser` **is** a catalog gate — `catalog.ts:55` → `deno task test:browser`.
- `.llm/harness/gates/release-gates.md:7` declares itself "the **single source** for the
  release-gate class inside the harness", and `:22` names `scaffold.runtime` with command
  `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`, describing it as
  "local-source merge-readiness" and `:26` as "a merge-readiness gate that also runs pre-release".

So the absence from the catalog is **deliberate**, not a gap to be filled. Adding an entry would
fold a release-gate into the per-slice static-gate class — a category error rather than a plumbing
detail — and `receipts/s5-scaffold-runtime.json` would be a hand-authored receipt for a gate the
catalog intentionally excludes. That is precisely the shape of evidence this lane has spent the
milestone refusing to accept from others.

**Required correction.** Remove the catalog-entry proposal and the `run-gate` routing for
`scaffold.runtime` at `:79`, `:101`, `:177`, `:208`, `:217`. Restate its evidence as: the
**suite-owned exact-head output** of `deno task e2e:cli run scaffold.runtime --cleanup --format
pretty`, plus the **central expensive-gate lease and cleanup record**. It is a separate release-gate
class per `release-gates.md`, not a contracted `run-gate` receipt, and the binding receipt list must
name only the gates that actually produce receipts. `fresh-browser` is unaffected — it stays a
catalog gate with a normal `run-gate` receipt.

## T-2 (precision requirement) — name the exact scenario assertions

`plan.md:224-229` requires the scaffold suite to "assert both module type-checking, cross-tier key
isolation, and actual invalidation behavior", and the browser command to include
"old-versus-fresh server-snapshot hydration assertions". Those are the right *properties*, but they
are not yet assertions an implementer could write or a reviewer could check.

State the exact scenarios: which command sequence adds the second service, which two key arrays are
compared and what distinguishes them, what mutation is issued and what observable proves the
invalidation actually took effect (rather than merely being called), and what two timestamps the
hydration assertion compares. Without this, "the suite has been extended" is unfalsifiable, and the
lease precondition it gates becomes a formality.

## Determinations

**PLAN-EVAL: required.** Concurring with the coordinator, and for reasons visible in the plan itself
— the additive `bridgeInvalidation(queryKey)` SDK overload is a public surface change with a retained
string overload; the generator's result/overwrite contract becomes public behaviour; three
publishable members are touched (`cli`, `fresh`, `sdk`); a compatibility migration is stated; and two
distinct runtime consumers must both be proven. The plan's own open question 1 (`:239-240`) — accept
the additive overload, or emit `{ queryKey: queries.list.clientKey() }` directly and leave the SDK
surface unchanged — is a genuine architectural fork left correctly open for the gate.

**Both expensive gates: load-bearing, but only after cheap convergence.** `scaffold.runtime` is
load-bearing because this leaf changes generated scaffold/client output *and* generator command
behaviour, so the only proof that the emitted app still builds and runs is running the emitted app.
`fresh-browser` is separately load-bearing because hydration timing — whether `initialDataUpdatedAt`
actually preserves snapshot age across hydration — cannot be observed without a real browser; a unit
test can only prove the option was passed, not that TanStack honoured it. They are not redundant with
each other and neither substitutes for the other.

**No lease is requested at this stage**, and none may be granted before coordinator review. The
gates run serially under one lease after all cheap gates and a pre-gate Tier-A.

## Next

Repair T-1 and T-2 on the same thread, push, then PLAN-EVAL dispatches on the immutable repaired plan
head. No implementation before `PASS`.
