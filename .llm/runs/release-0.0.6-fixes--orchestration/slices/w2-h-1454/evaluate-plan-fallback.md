use harness

# PLAN-EVAL fallback — Slice W2-H / PR #1574 / issue #1454

You are a **formal PLAN-EVAL evaluator**, read-only. You did not write this plan and you must not
change it. Your output is a verdict with evidence.

| Field | Value |
| --- | --- |
| Route | Codex · OpenAI · GPT-5.6 Sol · **high** (owner-directed fallback, drift D-8) |
| Your worktree | `/home/codex/repos/ns006-w2h-planeval` — detached at `ad7574bb7`, **read-only** |
| Author's worktree | `/home/codex/repos/ns006-w2-1454` — **never touch it** |
| Plan under evaluation | `.llm/runs/release-0.0.6-fixes--orchestration/slices/w2-h-1454/plan.md` at that head |
| PR | #1574, immutable head `ad7574bb70dbba8ad3de28ff699c484fd97583e6` |
| Issue | #1454 (p1) |
| Verdict file | `slices/w2-h-1454/verdict-plan-fallback.md` |

## SKILL

- `netscript-harness` — evaluator protocol, evidence discipline
- `netscript-doctrine` — **required**: archetype, public surface, gates, debt
- `netscript-cli` — plugin install/doctor and the E2E suites
- `netscript-tools` · `rtk`

## Why you exist, stated honestly

The automatic evaluator adjudicated this plan **once** (MiniMax M3, cycle 1) and returned
**FAIL_PLAN** — on checklist hygiene, not substance. It verified every load-bearing architectural
claim against the tree and judged the root cause, fix surface, and published-surface answer
**correct**. The author then amended the plan. Cycle 2 was dispatched and returned **NONE**: the
evaluator hit its 500-iteration limit and failed. **The amended plan has never been adjudicated.**

You are the owner-directed fallback. One consequence you must know: `lane-policy.md` routes
formal plan evaluation of a Codex-authored plan to an **opposite-family** evaluator, and you are
Codex evaluating Codex. That independence is genuinely reduced. It is recorded as drift D-8, and it
is why your job is narrow and your evidence standard is high — you are not a rubber stamp brought in
because the real evaluator was unavailable.

## Scope — evaluate the amendments, do not re-litigate the architecture

Cycle 1's opposite-family verdict already confirmed the architecture. **Do not re-derive it and do
not overturn it on preference.** If you find a *factual* error in it, say so explicitly and show the
evidence — but that is a finding, not your assignment.

Your assignment is whether the **four required amendments** are genuinely present and adequate:

### 1. Risk register

Not a non-goals list — risks with **mitigations and owning slices**. Required entries:

- **Type-breaking `RegisteredPluginConfig` migration.** `workdir`/`rootDir` are required today; the
  discriminated source makes them local-only. Does the register enumerate the actual readers, and is
  the enumeration *correct*? Spot-check the cited sites exist and read those fields
  (`deploy-config-background.ts`, `deploy-config-resolvers.ts`, `doctor-plugin-use-case.ts`,
  `list-plugins-command.ts`, the `plugin-registry` unit fixtures, and the two E2E files).
- **Runtime permission behaviour change** — treated as user-visible, with a locking test, CHANGELOG,
  and a doctor warning on divergence from a user override.
- **Package beats incidental local directory** — documented in help/doctor output and release notes.
- **The precedence contradiction** carried as a resolved risk rather than silently fixed.

### 2. Open-decision sweep

Each decision marked **must-resolve-in-slice-N** or **safe-defer**, with required evidence:
bounded-probe JSON/error schema; `RegisteredPluginConfig.workdir` migration; #1022 close-out
evidence. The plan claims **no remaining safe-defer decisions** — check that claim rather than
accepting it.

### 3. One canonical precedence chain

Stated **once**, canonically, preserving the `pluginService.permissions` slot:

```
explicit appsettings/service permissions
  > pluginService.permissions
    > plugin.permissions
      > global defaults
```

**Verify no other section of the plan contradicts it** — the original defect was §3 and sequence
step 5 disagreeing. Read the whole plan for a second ordering, not just the LOCKED section.

### 4. Named gate authorities

**Archetype Gate Matrix — ARCHETYPE-5** and the **JSR Publishing Audit (`jsr-audit`)** cited by name
where gate coverage and published-surface safety are asserted. Confirm the citations are load-bearing
rather than decorative — does the plan's published-surface claim actually measure against the rubric?

## How to evaluate

- **Read the plan at your pinned head only.** Do not fetch, do not follow the branch.
- **Spot-check citations against the tree.** The plan names files and line ranges; confirm they exist
  and say what the plan claims. A plan whose citations have drifted is not amended, it is stale.
- **Reproduce, do not relay.** Quote real command output for anything you assert.
- If an amendment is present but hollow — a heading with no substance, a risk with no mitigation, a
  decision marked resolved with no evidence — that is **FAIL_PLAN**. Presence is not adequacy; this
  lane has spent a milestone on exactly that distinction.

## Hard constraints

- **Read-only.** No commits, no pushes, no edits to the plan or any source file, no label changes.
- Do not touch `/home/codex/repos/ns006-w2-1454`.
- **No publication of any kind.** Another lane holds a live release.
- Do not run the expensive `scaffold.runtime` gate; you are evaluating a plan, not an implementation.
- Leave your worktree clean and say so.

## Verdict format

Write `verdict-plan-fallback.md`:

- **VERDICT: PASS** / **FAIL_PLAN** — one line, first.
- **Per amendment (1–4): adequate / inadequate**, with the evidence that establishes it.
- Any factual error found in cycle 1's architectural findings, with proof — or an explicit statement
  that you found none.
- Findings, each blocking or non-blocking, each with a concrete consequence.
- What you executed, verbatim; and what you could **not** verify.
- An explicit note that you are a **same-family** evaluator per drift D-8, so a reader weighs your
  verdict accordingly.

A PASS releases a p1 slice to implement against this plan. Make it earned.
