use harness

## SKILL

Read these repo skills before any work (under `.agents/skills/<name>/SKILL.md`):
- `netscript-harness` — run mechanics, slice/commit-trail rules
- `netscript-doctrine` — package archetype + public-surface law
- `netscript-cli` — the CLI/deploy command surface you are editing
- `netscript-deno-toolchain` — deps/inspection wrappers
- `netscript-tools` — scoped wrappers, gate-evidence rules, lock hygiene
- `netscript-pr` — branch/PR/label/milestone process
- `aspire` — Aspire resource lifecycle (if your scope touches Aspire helpers)
- `rtk` — prefix read-heavy git/grep with `rtk`

## Identity & scope

You are a WSL Codex implementation slice for **issue #347 (Deploy S11)** of the beta.5 feature
wave (run `beta5-impl--supervisor`, deployment epic under road-to-stable).

Worktree: `/home/codex/repos/netscript-347-deploy` · branch `feat/347-deploy-s11`
(NO upstream — keep it that way).

First step: `gh issue view 347 --repo rickylabs/netscript --json title,body` and implement
EXACTLY the S11 scope in the issue body, honoring its acceptance checklist. Re-verify each
claim against your checkout before acting (the issue body was Phase-0-reconciled on
2026-07-05, but trust the code over the text). If scope conflicts with reality, STOP on that
item and record it in `notes.md` for the supervisor rather than improvising. Sibling slices
#346 and #348 run in parallel — do NOT touch their scope; if you find a genuine file-level
collision, note it and keep to your own.

Run artifacts: write YOUR slice artifacts ONLY under
`.llm/runs/beta5-impl--supervisor/slices/347-deploy/` — NEVER at the run-dir root.

## Validation

- Scoped check/lint/fmt wrappers on touched roots; affected package tests.
- Full `deno task check` + `deno task test` at the end.
- Public surface changes: full-export-map `deno doc --lint` on touched packages +
  `deno task publish:dry-run` stays clean.
- Do NOT run `deno task e2e:cli` — supervisor triggers it at merge-readiness.

## Process

- Commits in reviewable slices; push ONLY via `git push origin HEAD:refs/heads/feat/347-deploy-s11`.
- Never force-push, never `git add -A`, zero `deno.lock` churn.
- Open a **draft PR** early: base `main`, title `feat(deploy): #347 S11 <short scope>`.
  Body: `Closes #347` ONLY if fully resolving its acceptance criteria, else `Refs #347` +
  remaining scope. Labels: `type:feature`, `area:deploy`, `priority:high`,
  `epic:road-to-stable`, `status:impl`; milestone `0.0.1-beta.5`.
- Comment per pushed slice with commit hash + evidence. End with a `SLICE-COMPLETE` comment.
