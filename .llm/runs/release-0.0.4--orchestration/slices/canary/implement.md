use harness

# Slice A: canary label surface (#1121)

Worktree: `/home/codex/repos/ns004-canary` · branch `feat/canary-label-surface` · base `origin/main`
@ `0b05217cc`.

Part of epic **#1120**. This is the **first landed slice** of the milestone-orchestrator work and it
will be **exercised on two real canaries of 0.0.4** within hours of merging. Keep it thin enough to
be exercised in that window.

## SKILL

- `.agents/skills/netscript-harness` — run loop, slice contract, commit trail.
- `.agents/skills/netscript-release` — **read it to know what NOT to build.** It owns all publish
  mechanics: `release:canary`, `publish:readiness`, `release:preflight`, OIDC, the green canary
  pair, rollback. You consume its output; you do not reimplement or restate any of it.
- `.agents/skills/netscript-pr` — `Closes #N` in the PR **body**; every `gh` call passes
  `--repo rickylabs/netscript`. Labels are namespaced colon labels.
- `.agents/skills/netscript-tools` — scoped check/lint/fmt wrappers, validation evidence.
- `.agents/skills/rtk` — prefix read-heavy `git`/`gh`/`grep` with `rtk`.

Read #1121 and #1120 in full before writing anything.

## What to build — and nothing more

A canary **label** surface: derive the label from the published version, compute the payload from
merge history, apply the label, and gate against drift.

### 1. The identity constraint — this is the point of the slice

The label **is** the published prerelease version string: `canary:<version>-canary.<n>`, e.g.
`canary:0.0.4-canary.1`. Derived from what was actually published. Never typed.

**The concrete trap:** `deno.json` currently reads `0.0.3`. `release:canary`
(`.llm/tools/release/canary.ts`) takes a **stable target** (`0.0.4`) and derives `0.0.4-canary.N`;
`validateStableTarget` refuses a prerelease target. A generator that read the repo's `version` field
would emit `canary:0.0.3-canary.1` — silently wrong, and wrong in exactly the way this slice exists
to prevent. **Source of truth is the publish result, not the repo version field.**

If `release:canary` does not currently expose the resolved version in machine-readable form, adding
that is in scope — it is the input your generator needs. Prefer extending its output over parsing
log text.

### 2. Payload is content-derived, not plan-derived

From the observed 0.0.4 trace (`.llm/runs/release-0.0.4--orchestration/cut-trace.md`, read it): PR
#1086 was dispatched mid-wave because #1089 blocked another lane, and merged **between** two wave-2
PRs. A rule of the form "the canary contains the PRs dispatched in wave N" would have mislabelled it.

Compute membership from **merge history between canary points** — the PRs merged since the previous
canary, and the issues those PRs closed. A PR that landed out of plan order is still in the payload.

### 3. Drift gate

Fails when a `canary:` label exists with no matching published version, or a published canary has no
label. **Demonstrate the negative case** — a deliberately mismatched pair must fail.

### 4. Every gate emits an explicit result

**Silence is a failure, not a pass.** A pass must be distinguishable from a did-not-run in the
output. This is a hard requirement, not a style preference: 0.0.4 shipped two guards whose condition
could never become true — a PR watcher requiring non-draft when every PR was a draft, and a
merged-branch check using commit ancestry under a squash-merge workflow. Both silently did nothing
and reported nothing. Same failure class as #1022 (a doctor that could not fail) and #1012 (healthy
without a readiness check), both fixed in 0.0.4.

## Explicitly out of scope — do not absorb

Publish mechanics · wave sequencing · cadence judgement (when to cut) · the orchestrator skill · the
harness profile · renaming `agentic:provider-canary`/`agentic:rollout-canary` (separate issue; note
they are **AI provider/model rollout** canaries, unrelated to release canaries — do not touch or
conflate them).

This slice lands first, which makes it the natural magnet for everything. Anything not needed to
**label, publish-link and observe** a canary belongs in a later slice. If you believe something else
is required, say so rather than adding it.

## Gates

`deno task check` · `deno test` for what you add · scoped lint/fmt wrappers ·
`deno task quality:scan`. Verify the artefact, never the exit code — a piped command reports the last
stage's status. Do not run `scaffold.runtime`; it is irrelevant here and expensive.

## close-gate is part of the work

It reads the `- [ ]` boxes on #1121 and fails until each is ticked. Verify each as you land it, tick
it, and post the evidence. **Tick nothing you cannot evidence.** The two exercise criteria (real
canaries) cannot be satisfied from inside this PR — leave them unticked, drop nothing else, and state
that the orchestrator will tick them after the live cuts. That pattern is #1090's precedent.

## Deliverable

One draft PR closing #1121, driven to ready-for-merge, thin and exercised. Commit per unit; push and
comment gate evidence before the next.
