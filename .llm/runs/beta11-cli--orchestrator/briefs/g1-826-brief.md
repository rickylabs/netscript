use harness. You are the G1 implementation agent (Codex · GPT-5.6 Sol · low,
`light_implementation` lane) for run `beta11-cli--orchestrator`, supervised by the Fable 5
orchestrator (session 86d308d5-c761-4e5d-a41f-8be959bc46d2).

## SKILL

Activate: `netscript-harness`, `netscript-doctrine`, `netscript-pr`, `netscript-tools`. Read
`.llm/harness/workflow/run-loop.md`. Your nested run dir:
`.llm/runs/beta11-cli--orchestrator/slices/g1-826-health/` (create from `.llm/harness/templates/`).

## Task — issue #826: aggregate health must exclude unconfigured adapters

Branch `fix/826-aggregate-health` (already created off origin/main in this worktree). Full issue
body: GitHub #826 (read it live). Evidence base: eis-chat#150 — an unused MySQL adapter in a
SQLite-only app poisons aggregate health, forcing consumers to fall back to listener probes.

Scope: the service package's aggregate-health computation must exclude adapters that are not
configured/used by the running app. Find the aggregate health implementation (service package
health surface), fix the inclusion predicate, and cover per-adapter-class behavior with unit
tests.

Acceptance (from the issue — each is a gate you must run green):
1. Unconfigured/unused adapters excluded from aggregate health; per-adapter-class unit tests.
2. Consumer-compile check.
3. `scaffold.runtime` health-path assertion (add/extend the assertion; the full suite run is the
   supervisor's merge-readiness call — do not run the expensive suite for every loop).

## Method

- Research first (small): locate the health aggregation code, enumerate adapter classes, write a
  short plan in your slice dir BEFORE editing. This is a single-scope fix — no seed ceremony.
- Commit by slice; every slice: commit → push (`git push origin HEAD:refs/heads/fix/826-aggregate-health`)
  → comment on the draft PR with scope, commit hash, gate evidence. Open the draft PR to `main`
  titled `fix(service): exclude unconfigured adapters from aggregate health` with body carrying
  `Closes #826`, labels `type:fix,area:service,wave:v1,priority:p1,status:impl`, milestone
  `0.0.1-beta.11`.
- Validation: scoped wrappers (`.llm/tools/run-deno-check|lint|fmt.ts --root packages/<pkg> --ext ts,tsx`)
  + `deno task quality:scan` + `deno task arch:check` (mandatory — framework source). No new
  `deno-lint-ignore`, no `any`, no `as unknown as`.
- Do NOT dispatch any evaluator or review yourself — the supervisor triggers all evals
  (self-arranged evals are forbidden). Do NOT merge anything. Update your slice-dir worklog per
  slice.

## Stop-lines (HARD — read twice)

1. NO merge to `main` for any PR without BOTH CI green AND an opposite-family eval PASS recorded
   on the PR, and merge authorization per the harness flow.
2. HARD STOP before any release publish (`release:cut`, JSR publish, tag push, canary or stable)
   — owner sign-off in-turn only; a stale or relayed approval does not count.
3. HARD STOP before closing milestone 13 — owner sign-off only.
4. These stop-lines are repeated verbatim in EVERY sub-agent brief. A sub-brief without the
   stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification; its board filing needs the owner
   in-turn.
