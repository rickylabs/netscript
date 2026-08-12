use harness

# Slice brief — #1589 split Fresh/SDK versions produce distinct cache-provider singletons

**Codex · GPT-5.6 Sol · medium**. **P0.** This slice is **plan-first**: produce research + a concrete
plan and open a draft PR at plan phase. **Do not implement until the orchestrator confirms PLAN-EVAL
passed** — the fix involves a genuine design choice, not a mechanical change.

| Field | Value |
| --- | --- |
| Issue | **#1589** (`priority:p0`, `area:fresh`, `area:sdk`, `area:deps`) |
| Worktree | `/home/codex/repos/ns006-1589` |
| Branch | `fix/1589-sdk-provider-closure` |
| Base | `main@fc312f211` — the canary.4 terminal-green checkpoint |

Read `slices/triage-1589.md` first (on `chore/release-0.0.6-runtime-reopen`; fetch with
`git show chore/release-0.0.6-runtime-reopen:<path>` if absent). It contains the located mechanism and
the ranked options — **do not re-derive them.**

## SKILL

- `netscript-deno-toolchain` — **read first.** Version resolution, workspace/import-map semantics,
  and why two module instances can coexist.
- `netscript-doctrine` — `packages/sdk` is published surface.
- `netscript-tools`, `netscript-pr`, `netscript-harness`.

## The mechanism — already located, do not re-investigate

`packages/sdk/src/cache/cache-provider.ts:37`:

```ts
let _provider: CacheProvider | null = null;
```

A **module-local mutable singleton**. When an app pins `@netscript/fresh` subpaths at a canary while
keeping `@netscript/fresh` root and `@netscript/sdk` stable, two SDK module instances load. Each has
its own `_provider`. The app initializes its copy; Fresh reads the other, still `null`, and throws at
`:62` — *"[NetScript SDK] Cache provider not initialized"*.

Classic **dual-package hazard**: it compiles, builds, and type-checks, because nothing in the type
system says two module instances must be the same instance.

Reported failure modes (consumer-exact, EIS Chat): (1) stable root `definePage` emitted the stable
defer implementation while the layout imported the canary island; (2) after aligning only the Fresh
root to canary.3, route partials failed with the uninitialized-provider error.

## Do not confuse this with the `isPartial` class

#1589's symptom appears **on partial navigation**. That is superficially close to the `isPartial`
cache-suppression class — EIS Chat #191, closed-invalid #1550 — and the two are **unrelated**.

**Never** "fix" this by suppressing a cache read or seed because a request is a partial. Fresh client
navigation *is* a partial; suppression is itself the forbidden pattern. If your plan contains anything
resembling that, it is wrong.

## Scope the plan to these options, ranked

The issue demands **mechanical enforcement** — documentation alone is out.

1. **Reject incoherent closures at build/init — preferred first cut.** Detect that the Fresh root, its
   subpaths, and SDK resolve to different versions and fail with a message naming the closure, rather
   than proceeding to a runtime `null` provider. Cheapest, changes **no** ownership semantics, and
   there is prior art to model on: `.llm/tools/validation/check-netscript-jsr-specifiers.ts` already
   rejects versionless / stale-exact / range-pinned first-party specifiers.
   **A subpath pin must not be able to imply a split root** — the issue's own wording.
2. **Declare an exact peer-compatible closure** for Fresh/SDK/telemetry. Complements (1); mechanical,
   but touches published metadata.
3. **Move the provider off module-local state** (e.g. a `globalThis`-keyed registry). Fixes the
   *class* rather than detecting it, but it is the **largest** change and raises its own question:
   with two versions loaded, which implementation legitimately owns the singleton? **Not a first cut**
   — if you believe it is necessary, argue it explicitly rather than assuming it.

**Preserve the verified workaround:** pinning the full coherent closure together (Fresh root + SDK +
telemetry at the same canary) works today and must remain valid. A fix that invalidates it is wrong.

## What the plan must contain

- The chosen option with its trade-off stated, and why the rejected ones were rejected.
- **Where enforcement fires** — build, init, or both — and what the operator sees. A failure that
  reads "Cache provider not initialized" at runtime is precisely the outcome to eliminate; the new
  message must name the incoherent closure and the versions involved.
- **False-positive analysis.** Legitimate multi-version situations must not be broken. Say which are
  legitimate and how the check avoids them.
- The test plan, including a **negative** case: an incoherent closure is rejected, and a coherent one
  is not.
- Whether any published surface changes.

## Boundaries

- **Do not touch `packages/fresh/src/runtime/ai/**`** — a sibling slice (#1583) is live in that
  subtree right now.
- **Do not touch `packages/fresh/src/application/{defer,builders/define-page}/**`** — the Fresh group
  (#1576/#1568/#1569) follows there.
- **`deno.lock`:** if it moves and you added no dependency, **stop and report**. If you added one, the
  delta is whatever Deno deterministically generates — never hand-reduced. Incomplete lock closures
  cost this lane a canary cycle and two P0 issues.

## Commit trail

Commit research + plan to `.llm/runs/release-0.0.6-features--orchestration/slices/` and open **one
draft PR** against `main`. Title:
`fix(sdk): enforce a coherent Fresh/SDK cache-provider closure`.
Body per `netscript-pr` with **`Closes #1589`** in `## Scope`, the chosen option and its rationale,
and an explicit note that implementation is pending PLAN-EVAL. Labels `type:fix`, `area:sdk`,
`area:deps`, `area:fresh`, `priority:p0`, `status:plan`, milestone `0.0.6`.

**Do not implement yet. Do not flip to ready.** The orchestrator triggers PLAN-EVAL via the label
pair and will tell you to proceed. No manual OpenHands, no Fable.

## Reporting contract

Report the chosen option, the enforcement point, the false-positive analysis, and **anything you could
not verify** — particularly any legitimate multi-version scenario the check would break. That is the
finding most likely to change the plan.
