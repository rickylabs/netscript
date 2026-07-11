use harness

# Slice brief — #638: published-mode root import map omits @netscript/sdk

## SKILL

Read: `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/netscript-cli/SKILL.md`,
`.agents/skills/netscript-doctrine/SKILL.md` (packages/cli is framework source),
`.agents/skills/netscript-tools/SKILL.md`.

## Identity + ground rules

- WSL Codex implementation agent under the beta-7 orchestrator (`df71d36c`). Do NOT open PRs.
  **PLAN-EVAL waiver** (owner-waived, drift D1) — plan in worklog, then implement.
- Worktree: `/home/codex/repos/ns-wt-638`, branch `fix/638-scaffold-root-sdk-imports`.
- Push: `git push origin HEAD:refs/heads/fix/638-scaffold-root-sdk-imports`.
- Worklog at `.llm/runs/fix-638-root-sdk-imports--codex/worklog.md`, committed with the slice.

## Task (issue #638 — read it first; its three acceptance boxes are the contract)

Root cause (verified live by the orchestrator): published (`jsr`) mode `netscript init` writes a
root `deno.json` import map WITHOUT `@netscript/sdk` / `@netscript/sdk/client`, while the workers
plugin scaffolds `workers/jobs/health-check.ts` importing `@netscript/sdk/client`, and the
generated Aspire `workers` resource runs `deno run … --watch workers/runtime.ts` resolving against
the ROOT config → crashloop → `behavior.workers-executions` red in prod mode. Local mode passes
because the local import resolver (`packages/cli/src/kernel/adapters/scaffold/import-resolver.ts`)
emits `NETSCRIPT_SDK*` keys mapped into `packages/sdk/...`; find where the root-config emission
diverges per package source and align the published key set (the JSR resolver already defines
`NETSCRIPT_SDK`/`NETSCRIPT_SDK_CLIENT` → `jsr:@netscript/sdk@<v>[/client]`, see also
`packages/cli/src/public/adapters/jsr-import-resolver.ts`).

Second acceptance box: add a static guard (unit test or cheap e2e static gate) asserting every bare
`@netscript/*` specifier imported by root-level scaffolded code (workers/, contracts/, …) resolves
in the generated root import map in BOTH package-source modes — so the next omission of this class
fails fast instead of surfacing in a prod round.

Doctrine first: this is `packages/cli` framework source — identify the archetype/public-surface
impact in your worklog before editing.

## Validation (evidence in worklog)

- Scoped check/lint on `packages/cli` (`run-deno-check.ts`/`run-deno-lint.ts`, `--ext ts,tsx`).
- The new guard test red-before/green-after (show both runs if cheap).
- Affected template unit tests green.
- Do NOT run full scaffold.runtime yourself (orchestrator/CI owns merge-readiness); note in the
  worklog that the PR's CI scaffold-runtime job is the live verdict.

## Done means

Fix + guard + tests committed and pushed, worklog committed. Report "DONE" or "BLOCKED: <why>".
