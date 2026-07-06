use harness

## SKILL

Read these repo skills before any work (under `.agents/skills/<name>/SKILL.md`):
- `netscript-harness` — run mechanics, slice/commit-trail rules
- `netscript-doctrine` — package archetype + public-surface law
- `netscript-deno-toolchain` — `deno doc`, deps wrappers
- `netscript-tools` — scoped wrappers, gate-evidence rules, lock hygiene
- `netscript-pr` — branch/PR/label/milestone process
- `rtk` — prefix read-heavy git/grep with `rtk`

## Identity & scope

You are a WSL Codex implementation slice for **issue #402 — T1 telemetry convention** (beta.5
feature wave, run `beta5-impl--supervisor`). This is the FIRST slice on the telemetry critical
path; T2 (#403 ports/adapters restructure) runs strictly after your slice passes IMPL-EVAL —
do NOT do #403's restructuring work.

Worktree: `/home/codex/repos/netscript-402-telemetry` · branch `feat/402-telemetry-t1`
(cut from origin/main `1c175990`, NO upstream — keep it that way).

First step: `gh issue view 402 --repo rickylabs/netscript --json title,body` (gh works natively
in this clone) and implement EXACTLY the T1 scope in the issue body, honoring its acceptance
checklist. Re-verify each claim against your checkout before acting. If the issue body's scope
conflicts with what you find on main, STOP on that item and record it in `notes.md` for the
supervisor rather than improvising.

Run artifacts: write YOUR slice artifacts ONLY under
`.llm/runs/beta5-impl--supervisor/slices/402-telemetry/` — NEVER at the run-dir root
(root files belong to the supervisor session and collide on merge).

## Validation

- Scoped: `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages --ext ts,tsx`
  plus lint/fmt wrappers on touched roots; affected package tests.
- Full `deno task check` + `deno task test` at the end.
- If the public surface changes: full-export-map `deno doc --lint` on touched packages +
  `deno task publish:dry-run` must stay clean (no new slow-types allowances).
- Do NOT run `deno task e2e:cli` — the supervisor triggers it at merge-readiness.

## Process

- Commits in reviewable slices; push ONLY via `git push origin HEAD:refs/heads/feat/402-telemetry-t1`.
- Never force-push, never `git add -A`, zero `deno.lock` churn.
- Open a **draft PR** early: base `main`, title `feat(telemetry): #402 T1 telemetry convention`.
  Body: use `Closes #402` ONLY if your PR fully resolves the issue's acceptance criteria;
  otherwise `Refs #402` + explicit remaining scope. Labels: `type:feature`, `area:packages`,
  `priority:high`, `epic:road-to-stable`, `status:impl`; milestone `0.0.1-beta.5`.
- Comment per pushed slice with commit hash + evidence. End with a `SLICE-COMPLETE` comment.
