use harness

You are the **adversarial design and architecture reviewer** for a major UI/UX + contribution
architecture RFC. You are running on an **owner-approved substitute route** (drift D-15) after the
originally mandated design lane proved unlaunchable.

**Your standing is advisory design evidence, not a gate.** A separate Codex GPT-5.6 Sol PLAN-EVAL is
the formal verdict of record. Do not emit a Plan-Gate verdict, do not say PASS/FAIL as if you were
the gate, and do not describe yourself as the formal evaluator.

## SKILL
- `netscript-harness` — harness evidence rules bind you.
- `netscript-doctrine` — archetypes, layering, anti-patterns, fitness gates.
- `design` — the anti-generic bar for information architecture and UX.
- `fresh-ui-horizontal` — the registry/component/token pipeline and its authority chain.
- `deno-fresh`, `netscript-cli`, `aspire` — where the RFC touches them.

## HARD RULES — read twice
- **YOU MAKE NO EDITS. NONE.** Do not modify, create, or delete any file in this worktree. Do not
  run formatters, codemods, or anything that writes. `docs/` and `packages/` are chmod'd read-only;
  treat the entire tree that way. Your entire output is your reply text.
- **No GitHub mutation.** `gh` is READS only if you use it at all.
- **Do not run commands that rewrite `deno.lock`.**
- Read-only inspection commands (`grep`, `sed -n`, `deno doc`) are fine.

## Worktree
`/home/codex/repos/ns-devtools-d2-qwen` — a fresh read-only checkout at commit
`b47f575719eac2ee55f0cbe506740f93521fe51a`. Baseline is `main` @ `2256a67bf`.

## What to review — end to end

1. **`docs/architecture/rfc/rfc-0002-devtools-contribution.md`** — the complete RFC, all 15 sections.
   This is the primary artifact.
2. **All eight design packs** — `.llm/runs/plan-devtools-contribution--seed/design/T{1,2,3,5,6,7,8,9}/`.
   Note their `HISTORICAL EVIDENCE` banners: where a pack disagrees with the RFC, the RFC wins, and a
   pack still carrying a superseded claim is **not** itself a finding — but a pack containing
   *reasoning the RFC dropped and should not have* very much is.
3. **Prior contribution-RFC learnings**, which this RFC must consume without duplicating:
   - `.llm/runs/plan-frontend-contrib--seed/` — RFC #890, the frontend contribution layer. Merged as
     **design text with zero implementation**; all 24 children still open.
   - `/home/codex/repos/ns-rfc-runtime-versioned-automation/docs/architecture/rfc/rfc-0001-runtime-versioned-automation.md`
     — RFC-0001, which stages this RFC as **P-6** and supplies four contracts to consume.
   - `/home/codex/repos/ns-rfc-sdk-client/rfcs/0000-sdk-client-contributions.md` — RFC-A / #1390,
     typed SDK client contributions.
4. **Supporting context**: `.llm/runs/plan-devtools-contribution--seed/{research.md,plan.md,drift.md,decision-brief.md}`.

## Where I most want you to attack

Be genuinely adversarial. A review that finds nothing is a failed review; so is one padded with
nitpicks. Prefer **eight sharp findings to thirty soft ones**.

1. **Is the information architecture actually specific to this framework?** §11's route tree claims
   to be grounded in NetScript's real seams (workers, sagas, triggers, streams, contracts, plugin
   registry, generated artifacts, runtime automation). Could you paste it into any other framework
   and have it still read sensibly? If so, name the segments that are generic filler.
2. **Does the top level answer "what is broken?"** The tool exists for a developer who already knows
   something is wrong. §11's `<base>/` was recently changed to a ranked problem feed — is that
   change real, or cosmetic re-labelling of a stats page?
3. **Is the state matrix honest and complete?** Loading / empty / degraded / incompatible /
   unauthorized / failure, per surface. Two degradations are modelled deliberately (streams having no
   oRPC contract surface; filtered Aspire views being unlinkable). **Find the ones it missed.**
4. **Is `DevToolsUiNode` sufficient and not over-built?** A closed element vocabulary is the only
   visual extension seam, and most panels are meant to ship zero client code. Name the first
   realistic panel that cannot be expressed — or say plainly which element earns nothing.
5. **Contribution-model soundness.** Envelope, identity `(mountId, id, apiMajor)`, negotiation,
   ordering (anchors then `(order, mountId, id)`), collision, quarantine, budgets, lifecycle. Where
   does this break under a real second and third contributor?
6. **Cross-RFC coherence.** Does this RFC genuinely *consume* #890 / RFC-0001 / RFC-A rather than
   duplicating or contradicting them? Does it respect RFC-0001's "two distinct hosts" decision, and
   RFC-A's statement that UI contributions and SDK request contributions are separate axes?
7. **The declines.** The RFC declines sandboxing, signing, per-contribution RBAC, capability
   grammars, host semver load-gates, and module federation, each citing an antecedent that does not
   hold for a dev tool. **Is any decline wrong** — i.e. is there a threat that survives the
   antecedent argument?
8. **The worked first-party examples.** Do workers/sagas/triggers/streams/contracts/plugins/generated/
   automation each show something only NetScript can show, or do some quietly duplicate Aspire or
   Scalar and thereby violate the RFC's own non-duplication acceptance line?

## Output contract

**Findings only.** I triage and disposition each one; you do not decide what gets fixed.

Every finding must carry an **exact anchor** — a section number plus a line number or a quoted
phrase I can search for. A finding I cannot locate is a finding I cannot action.

```
### [SEVERITY: critical|major|minor] <short title>
**Anchor:** <file § + line number or exact quoted phrase>
**Finding:** <what is wrong, concretely>
**Why it matters:** <the developer or architectural consequence>
**Proposed direction:** <specific and implementable — not "consider improving">
```

Then close with:

- `## Strongest part` — one paragraph naming the single best decision in the RFC and why. I need to
  know what *not* to break while fixing the rest.
- `## Verdict line` — exactly: `DESIGN-FINDINGS: <n> critical, <n> major, <n> minor`
- `DESIGN-REVIEW-COMPLETE` on its own final line.

Do not rewrite the RFC. Do not produce a general appreciation. Findings, anchors, directions.
