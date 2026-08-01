# PLAN-EVAL — fix/1026-aspire-agent-wiring

Evaluator: Opus 5 supervisor (owner-waived open-model lane, 2026-08-01)
Subject: `.llm/runs/fix-1026-aspire-agent-wiring--discoverability/plan.md` @ `eabdc828d`
Base: `origin/main` @ `3ab64720f`
Archetype: 6 — CLI / Tooling

## Plan-Gate checklist

- [x] **Research present and current.** `research.md` re-baselines on `origin/main` `3ab64720f`
      and states the branch started clean. Findings 1-3 match the tree I inspected independently:
      `init-agent.ts` writes only the `netscript` entry; `skills/manifest.json` lists three skills
      (164 lines); the bundle hash is verified in `verifyBundle` so manifest + barrel + hash are one
      atomic contract. Finding 5 correctly treats my environment observations as inputs and *not*
      as repository truth.
- [x] **Decisions locked.** Seven numbered decisions with rationale. Decision 3 (consumed
      `AspireAgentInitializer` port + Deno adapter, no `Deno.Command` in the use case) is the one
      that matters for doctrine and is justified against AP-25 / R-A6-N8 in research finding 4.
- [x] **Open-decision sweep.** Deferred items listed (non-Claude skill locations, subprocess
      telemetry, #1024) and none of them forces rework: each is additive to the port surface. The
      one "resolve during implementation" item — how the skip warning is carried — is bounded by
      the locked behaviour (one non-fatal line) and cannot change file writes.
- [x] **Commit slices.** Four, ordered, each naming files and the gate that proves it. S2 (assets)
      before S3 (installer) is the correct order: the referential-integrity test in S2 would
      otherwise fail against a manifest S3 has not yet extended.
- [x] **Risk register.** Seven risks with mitigations, including the two I most wanted to see —
      abort not terminating the child, and manifest/hash drift.
- [x] **Gate set selected.** `gen:assets-barrel` + `check:assets-barrel`, scoped check/lint/fmt on
      `packages/cli`, feature-scoped tests, `quality:gate`. `scaffold.runtime` correctly excluded
      with a stated reason (scaffold output unchanged) rather than silently dropped.
- [x] **Deferred scope explicit.** #1024, scaffold templates, `packages/mcp`, alternate hosts.
- [x] **jsr-audit.** Applied: no new export, `mod.ts` unwidened, seam internal to the feature. The
      real publish delta is the embedded barrel growing by ~675 lines of inlined skill text —
      string literals only, no slow types. Acceptable.

## Where I am reviewing my own framing

I wrote the brief this plan implements, so these are the parts I am least likely to question, and
they are the ones I pressed hardest.

1. **`{ command: "aspire", args: ["agent","mcp"] }` assumes `aspire` on the consumer's PATH.** I
   specified that verbatim and the plan adopted it unexamined. It is defensible — a NetScript
   project already requires the Aspire CLI to run its AppHost — but the failure mode when it is
   absent is an MCP server that fails to start in the user's host, with no NetScript-side signal.
   Not a `FAIL`: the entry is inert until an agent host launches it, and writing it is exactly what
   acceptance criterion 1 asks for. **Condition:** the skip warning from a missing `aspire` binary
   (decision 4) must also be emitted when the binary is missing but the MCP entry was written, so
   the user learns about it at init time rather than at first tool call.
2. **Delegation idempotence is not addressed.** My brief said "attempt delegation", the plan locked
   "always attempt". `aspire agent init` takes ~7 s and rewrites its skill tree on every run, so a
   second `netscript agent init` will report "already current" (NetScript's `changedFiles` is
   empty) while having just spent 7 s in a subprocess that touched files outside NetScript's
   accounting. That is my omission, not the slice's. **Condition:** skip delegation when its
   product is already present (e.g. `.claude/skills/playwright-cli/SKILL.md` exists), and keep the
   second-run no-op honest.
3. **The discoverability evidence I demanded is weaker than the bar I set.** I asked for a grep
   from symptom strings. A grep proves the text is on disk; it does not prove an agent reaches it.
   The plan inherits that weakness. It is still the strongest cheap evidence available, but it must
   be a *chain*: the `AGENTS.md` block (the only file an agent reads unprompted) must name the
   symptom and the skill, the router must resolve to installed skills, and the symptom string must
   land in `help.md`. **Condition:** show all three links, not just the last one.
4. **Scope overlap with #1023.** The plan ships #1023's skill surface under #1026's branch, because
   I told it to. This is correct for the owner's cluster priority but must be visible: the PR body
   carries `Closes #1026` and an explicit `Refs #1023` note stating which of #1023's boxes this
   PR satisfies, so #1023 is not silently half-resolved.

None of these four invalidates the design; each is a condition on implementation, and all four are
cheap to satisfy inside the already-planned slices S3 and S4.

## Verdict

PASS

Conditions 1-4 above are binding on slices S3 and S4 and will be checked at IMPL-EVAL.
