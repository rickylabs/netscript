use harness

# Correction slice — #1605: document the nine new telemetry exports

**Codex · GPT-5.6 Sol · low**. IMPL-EVAL returned **PASS** at `c50e88a5c` and your implementation is
final — this is a **docs-site-only** slice to clear a real CI gate. **Do not touch any file under
`packages/`.**

| Field | Value |
| --- | --- |
| Issue | **#1562** · PR **#1605** |
| Worktree | `/home/codex/repos/ns006-1562` |
| Head | `c50e88a5c` — clean |

## SKILL

- `netscript-tools`, `netscript-pr`, `netscript-harness`. Docs-site content conventions apply.

## The failure

CI `quality` fails on a genuine gate — `.llm/tools/docs/check-accuracy-and-discoverability.ts`:

```text
Symbol Drift Error [telemetry]: Document at docs/site/reference/telemetry/index.md OMITS exported symbol 'CacheAttributes'
Symbol Drift Error [telemetry]: … OMITS exported symbol 'CacheAttributeOptions'
Symbol Drift Error [telemetry]: … OMITS exported symbol 'CacheOperation'
Symbol Drift Error [telemetry]: … OMITS exported symbol 'CacheOperations'
Symbol Drift Error [telemetry]: … OMITS exported symbol 'CacheOutcome'
Symbol Drift Error [telemetry]: … OMITS exported symbol 'CacheOutcomes'
Symbol Drift Error [telemetry]: … OMITS exported symbol 'CacheTier'
Symbol Drift Error [telemetry]: … OMITS exported symbol 'CacheTiers'
Symbol Drift Error [telemetry]: … OMITS exported symbol 'createCacheAttributes'
```

This is **not** a flake and **not** something to work around. You added nine exports to a published
package; the docs site is required to describe them, and the gate is the mechanism that keeps the
reference page from silently falling behind the package.

## What to do

Add the nine symbols to `docs/site/reference/telemetry/index.md`, matching the **existing structure
and prose style of that page** — read its current entries first and follow them rather than inventing
a new section shape.

Write real reference content, not placeholders:

- **`CacheAttributes`** — the attribute-name constants. Say that the keys are `netscript.cache.*` and
  are a published compatibility surface.
- **`CacheOperations` / `CacheOperation`** — the logical operation verbs (`cache.read`,
  `cache.write`, `cache.invalidate`) used as span names. Note that promotion is an **event**, not a
  fourth verb.
- **`CacheTiers` / `CacheTier`** — `l1 | l2 | durable`, runtime-validated.
- **`CacheOutcomes` / `CacheOutcome`** — the bounded lookup-result enum. State that a **successful**
  operation through a provider whose tier chain is unknowable publishes `topology_complete=false`
  with **no `outcome`**, and `outcome=error` appears only when the operation throws. That semantic is
  the one this PR corrected; the reference page must not reintroduce the old claim.
- **`CacheAttributeOptions` / `createCacheAttributes`** — the builder and its bounded option set.
  Worth stating that it accepts no cache key, which is what makes key leakage structurally impossible.

Keep it consistent with `packages/telemetry/README.md`, which you already updated — the two must not
disagree.

## Do not

- **Do not modify anything under `packages/`.** The implementation is evaluated and final; a source
  change would void the PASS at `c50e88a5c`.
- Do not restructure the reference page or touch unrelated entries.
- Do not add an `unknown` outcome value or describe one — omission is the shipped design.

## Gates

```bash
deno task quality:gate
```

The symbol-drift check must pass. If `quality:gate` surfaces unrelated pre-existing findings, report
them rather than fixing them. Package suites are unaffected by a docs-only change, but confirm
`git diff --name-only` shows **no** `packages/` path.

Commit on the same branch, push by explicit refspec, and post a short `[PHASE: IMPL]` with the commit
hash, the changed file list, and verbatim gate output.

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

Report the changed file list (proving no `packages/` path), the symbol-drift gate result, and anything
you could not verify.
