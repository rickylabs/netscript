use harness

# Bounded repair — official sample config must declare `source: 'plugin'` (#1874)

## SKILL

- `netscript-harness` — slice discipline, worklog/drift, gate evidence.
- `netscript-doctrine` — `plugins/workers` archetype and public surface.

## Why this is urgent, not cosmetic

This **blocks the hosted `scaffold.runtime` D6 proof for PR #1872**. Your base is #1872's head
`898d3aada`, which contains the D6 discovery check; without this repair the scaffolded project's own
generated sample can be rejected by that check on a later config-aware regeneration — a project
failing on output the scaffolder itself wrote.

## The defect, exactly

`plugins/workers/src/cli/official-sample-configuration.ts:304` authors the sample job
`create-user-settings` with entrypoint `../../plugins/workers/jobs/create-user-settings.ts` but
**omits `source: 'plugin'`**. Slice C's normalization therefore resolves it to `source: 'local'`,
while D6 requires plugin discovery to reject exactly that id/path/source disagreement.

## The one rule

**Fix the sample writer. Do not weaken D6.** D6 rejecting a real mismatch is correct behaviour and
the reason #1872 exists; making the check lenient to accommodate a bad sample would destroy the
guarantee. If you conclude D6 itself is wrong, stop and write that in `drift.md` rather than
changing it.

## Bounded scope — expect 1 production file plus 1 test

1. `plugins/workers/src/cli/official-sample-configuration.ts` — declare the correct source for the
   plugin-owned entrypoint.
2. A test pinning that the authored sample survives a scaffold → config-aware regeneration cycle
   **without** a D6 diagnostic.

Check whether any other authored sample entry has the same latent mismatch; if so include it, and say
so in the worklog. If the fix needs more than these files, record why in `drift.md` first.

## Gates

Focused plugin check/test/lint/fmt via the structured wrappers. `deno.lock` must not move — this is a
data correction, not a dependency change. **Do not run any local runtime, Aspire, Docker, or
`e2e:cli` gate**; a prior lane worker leaked three containers doing that. The hosted lane owns runtime
proof and the supervisor runs it.

## PR contract

Open the PR with full metadata **in the same action**: `orchestrator:features`, `status:impl`,
`type:fix`, `priority:p2`, `wave:v1`, `area:workers`, milestone **0.0.7**. Use `Closes #1874` — this
repair fully resolves that issue — and confirm `closingIssuesReferences` is non-empty. Note in the body
that it is based on #1872's head and unblocks that PR's hosted D6 proof.

Keep `worklog.md` and `drift.md` under `.llm/runs/fix-workers-sample-plugin-source--1874/`.
