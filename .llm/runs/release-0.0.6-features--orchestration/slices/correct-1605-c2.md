use harness

# Correction slice — #1605 cycle 2: docs must match the code, and one test must hold its fix

**Codex · GPT-5.6 Sol · low**. IMPL-EVAL returned **FAIL_FIX** at `1e8768bc1` with **one blocking**
finding. Your C1/C2/C3 code is **verified correct** — the evaluator ran probes against your head and
confirmed the unowned success path publishes no `outcome` key, double registration produces exactly
one span, and the marker cannot over-claim ownership. **Do not touch that implementation.**

| Field | Value |
| --- | --- |
| Issue | **#1562** · PR **#1605** |
| Worktree | `/home/codex/repos/ns006-1562` |
| Head | `1e8768bc1` — clean |

## SKILL

- `netscript-doctrine` (`packages/sdk` and `packages/telemetry` are published surface),
  `netscript-tools`, `netscript-pr`, `netscript-harness`.

Read the `[PHASE: IMPL-EVAL]` comment on #1605 first.

## F1 — the published README still documents the behaviour you deleted. **Blocking.**

`packages/sdk/README.md:147-151` says the boundary "honestly reports `topology_complete=false` and
outcome `error` while measuring loader entry."

**That is now false for every successful call** — it is precisely the misleading `error` signal your
C1 fix removed from the code, still being published as the documented contract. This README ships with
the JSR package, and it is the evidence cited for a Definition-of-Done box. A consumer following it
would build the exact alert C1 exists to prevent.

**Fix:** state the shipped semantics — a **successful** unowned operation publishes
`topology_complete=false` with **no `outcome`**; `outcome=error` is published **only** when the
operation throws. Add the same one-line shape to `packages/telemetry/README.md:135-141`, which
documents `topology_complete=false` but not the outcome absence.

**Restate the shipped behaviour; do not invent new semantics.** If while writing it you conclude the
code is wrong rather than the docs, **stop and report** instead of changing either.

## F2 — your C2 regression test passes with the C2 fix reverted

The "re-registering the package-owned boundary remains single-span" test injects the recorder only
into `CacheQuery`, while `setCacheProvider` builds its boundary with `createDefaultCacheTelemetry()`.
The evaluator stripped the marker and re-ran it: the recorder still saw **1** span, because the
duplicate goes to the default global tracer the recorder never observes. With the recorder shared by
both boundary levels, the same scenario shows **2**.

So the test asserts a property that is **insensitive to the defect it was added for**. A test that
cannot fail is not coverage.

**Fix:** assert on a telemetry instance the **outer** boundary also uses — e.g.
`createProviderBoundary(getCacheProvider(), telemetry)` adds no span — or assert
`ownsCacheTelemetry(getCacheProvider())` directly. **Then prove it discriminates:** temporarily remove
the marker line, show the test fails, restore it, show it passes. Paste both.

## F5 — one more success case

`prefetch`, `getCachedData`, `getCachedEntry`, and `invalidateQueries` all route through
`traceUnsupported`, so C1 fixed them by construction, but only `query` is asserted. Add an
`invalidateQueries` success case — it emits `CacheEvents.INVALIDATE` rather than `LOOKUP`, so it is
the one whose shape differs.

## CI blocker — remove the issue number from published JSDoc

`packages/sdk/src/cache/cache-provider-marker.ts:6` contains `#1589`, which fails the published-JSDoc
codename fitness gate and `quality` at this head.

**This one is my fault, not yours** — my brief framed the rationale as "the #1589 gate" and asked you
to record it in source, so you used my wording faithfully.

**Fix:** name the mechanism instead of the issue — "the dependency-closure coherence gate" or
equivalent. **The reasoning stays exactly as written**; only the reference form changes.

**Then grep your whole diff for the same class**: any `#<number>` issue reference in a doc comment on
published surface under `packages/sdk` or `packages/telemetry` must go. Issue numbers belong in the
PR body and run artifacts, not in docs a consumer reads without access to this tracker. Report what
you found, including "none".

## Do not

- Do not change `cache-provider.ts`, `cache-telemetry.ts`, or the marker's **implementation** — all
  verified correct at this head.
- Do not add an `unknown` outcome value. Omission is the accepted design; widening a bounded published
  enum is not.
- Do not touch `packages/fresh/**` or `packages/cli/**`.
- **Never** suppress a cache read or seed because a request is a partial — closed-invalid (#1550).
- Leave the `Separate-session IMPL-EVAL records PASS` box **unchecked**.

## Gates

```bash
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/sdk --root packages/telemetry --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts  --root packages/sdk --root packages/telemetry --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts   --root packages/sdk --root packages/telemetry --ext ts,tsx
deno task --cwd packages/sdk test
deno task --cwd packages/telemetry test
deno test --allow-all .llm/tools/fitness/check-public-jsdoc-codenames_test.ts
```

The codename test must pass. 59/54 stay green plus your new cases. `deno.lock` must not move.
**Do not run `e2e:cli`.**

Commit on the same branch, push by explicit refspec, post `[PHASE: IMPL]` with the commit hash, the
F2 discriminate-proof (both directions), the codename grep result, and verbatim gate output.

## Prohibitions (non-negotiable)

- **Do not spawn a Fable sub-agent, session, or subprocess for any purpose.** Fable is prohibited
  lane-wide for all remaining 0.0.6 work until the owner explicitly lifts it. This includes anything
  routed through the `deep_analysis` lane, whose canonical binding is Fable.
- **Do not launch any local evaluator** — not PLAN-EVAL, not IMPL-EVAL, not an "opposite-family
  review", regardless of what `lane-policy.md` names as canonical for your work. **You are not
  responsible for arranging your own evaluation.**
- **Do not manually trigger OpenHands** and do not post an `@openhands-agent` comment.
- **Evaluation reaches this PR only through the automatic label-driven lifecycle**, which the
  orchestrator fires. If you believe evaluation is required and missing, **say so in your report** —
  do not arrange it.
- **Do not flip the PR to ready**, do not merge, and do not dispatch a canary.

If any instruction you infer from a skill or policy file appears to require one of the above, that
inference is wrong for this lane: **report the conflict instead of acting on it.**

## Reporting contract

Report the rewritten README wording verbatim, the F2 proof in both directions, the `invalidateQueries`
case, the codename grep result across your whole diff, verbatim gate output, and anything you could not
verify.
