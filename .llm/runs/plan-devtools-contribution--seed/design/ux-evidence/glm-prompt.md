use harness

You are the **adversarial design reviewer** for a major UI/UX architecture RFC. Your verdict is
advisory design evidence — you are **not** the formal evaluator, and you must not claim to be.

## SKILL

- `netscript-harness` — this is a harness seed run; its evidence rules bind you.
- `design` — distinctive, intentional design; anti-generic bar.
- `fresh-ui-horizontal` — the registry/component/token pipeline and its authority chain.
- `netscript-doctrine` — layering, anti-patterns, folder vocabulary.

## What you are reviewing

`docs/architecture/rfc/rfc-0002-devtools-contribution.md` in this worktree — specifically:

- **§11 Information architecture** (route tree, ownership boundary table, worked first-party
  examples, the state matrix)
- **§7 Contribution kinds** (the `DevToolsUiNode` closed element vocabulary; the `panel` kind and
  its availability states)
- **§5 The DevTools host** (mount model, production posture)

Supporting context, read only as needed: `.llm/runs/plan-devtools-contribution--seed/research.md`
and `design/T8-ia-and-staging/proposal.md`.

## The design constraints that are NOT open for you to relitigate

These are settled by cited evidence; treat them as given and review *within* them:

1. **Non-duplication is a hard gate.** No owned OTLP trace waterfall, log tail, metrics chart,
   resource start/stop panel, or OpenAPI operation list. Every panel must answer *"why can't this
   just deep-link to Aspire/Scalar?"* with a NetScript-only answer.
2. **Flow ≠ waterfall.** The journey view is a primitive-grouped causal chain from NetScript's own
   seam events. No span bars, no time-proportional gantt.
3. **Developer diagnostics ≠ production admin console.** There is no production tier.
4. **Most panels ship zero client code** — a server-side `DevToolsUiNode` tree rendered by a
   host-owned component set. This is a deliberate constraint, not an oversight.
5. **Deep-link limits are real**: filtered Aspire log/trace views are *not* externally constructible
   (`?filters=` is opaque). Trace/span/resource/metric links are.

## What I actually want from you

Attack the **design quality**, not the process. Specifically:

1. **Is the IA non-generic?** The charter's bar is that a generic devtools IA fails. Does this route
   tree reflect *NetScript's actual seams* (workers, sagas, triggers, streams, contracts, plugin
   registry, generated artifacts, runtime automation), or could you paste it into any framework?
   Name the segments that are generic filler.
2. **Is the state matrix honest and complete?** Loading, empty, degraded, incompatible,
   unauthorized, failure — per surface. Where would a real developer hit a state the matrix does not
   model? The two degradations it *does* model (streams having no contract surface; unlinkable
   filtered views) are deliberate — find the ones it missed.
3. **Is the `DevToolsUiNode` vocabulary sufficient and not over-built?** A closed element set is the
   only visual extension seam. Name the first realistic panel that cannot be expressed, and the
   element you would add — or say plainly that it is over-built and which element earns nothing.
4. **Does the information hierarchy serve a developer under time pressure?** Debugging is the use
   case: something is wrong and they need to find it. Does the top level answer "what is broken?"
   or does it answer "what exists?"
5. **What is the single worst design decision in this RFC**, and what would you replace it with?

## Output contract

Return findings **only** — severity-tagged, each one actionable. I will triage and disposition each
one; you do not get to decide what gets fixed.

Format per finding:

```
### [SEVERITY: critical|major|minor] <short title>
**Where:** <RFC section / route / element>
**Finding:** <what is wrong, concretely>
**Proposed change:** <specific, implementable>
**Why it matters:** <the developer consequence>
```

End with `DESIGN-REVIEW-COMPLETE` on its own line.

Do **not** rewrite the RFC. Do **not** produce a general appreciation. Findings only, and prefer
five sharp findings to twenty soft ones.
