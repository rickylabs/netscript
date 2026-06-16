# Phase Registry — PR #44 IMPL-EVAL Remediation (supervisor)

Supervisor: Claude (Opus 4.8). Source of truth for live phase status. See `final-plan.md` for scope.

## Umbrella

- **PR #44** `chore/deno-2.8-aspire-13.4-upgrade` — Phase 0 (B) + Phase 1 (A). Active.
- **Repo Process Automation** (deferred) — Phase 2 (C/D/E). Not started; documented in `final-plan.md`.

## Phase 0 — Supervisor ground-work (sequential on #44, supervisor-authored)

| Slice | Status | Owner | Notes |
| ----- | ------ | ----- | ----- |
| B0 final-plan + phase-registry | in_progress | supervisor | this commit |
| B1 deps toolbelt (`.llm/tools/deps/*`) + tasks | done | supervisor | latest/outdated/why/audit/prod-install + 5 deps:* tasks + entry.md; validated (fedify 2.2.5, @hono/hono dead) |
| B2 `netscript-deno-toolchain` skill | done | supervisor | `.agents/skills/netscript-deno-toolchain/SKILL.md` — native deno toolchain map + prerelease trap + catalog rules; cross-links deps toolbelt + netscript-tools |
| B3 `netscript-pr` skill (skill-creator) | done | supervisor | `.agents/skills/netscript-pr/SKILL.md` — branch/PR/phase-comment/label house format (Phase E seed). Authored per skill-creator guidance; benchmark eval-loop deferred to explicit request. |
| B4 AGENTS.md updates | done | supervisor | new skills + deps toolbelt default + prerelease trap + deno doc/why + watch-run |
| B5 `.llm/tools/watch-run.ts` | done | supervisor | validated: exit 0 on change, exit 2 on timeout heartbeat |
| B6 prod-install lane (`deno ci --prod`) | done | supervisor | delivered in B1 as `deps/prod-install.ts` + `deno task deps:prod-install` (additive lane) |

## Phase 1 — PR #44 remediation (Codex WSL, sequential)

| Slice | Eval | Status | Owner | Notes |
| ----- | ---- | ------ | ----- | ----- |
| R1 subpath pins + dax | C1/C3 | done | codex-wsl | `104bfc5` — preact ^10.29.2 + render-to-string ^6.7.0 catalog-aligned, dax ^0.48 (cli+plugin-workers-core); deps:latest 0 behind, scoped check passed |
| R2 dead imports | C5 | done | codex-wsl | `3e7368f` — removed 5 dead entries (`@hono/hono` ×2 + 3 internal `@netscript/*` subpaths), all `fullyRemovable`; kept hono/zod/@tanstack/db/@durable-streams (used); scoped check+lint green (127 files) |
| R3 catalog → stable latest | C2 | in_progress | codex-wsl | launched via `send-message-v2` (mobile-visible, thread TBD) 2026-06-16; brief `sub-agent-briefs/R3.md`; fedify→2.2.5, logtape→2.1.5, preact↔Fresh; DEBT rows for held majors |
| R4 scaffold parity + check-scaffold-versions.ts + init smoke | C6 | todo | codex-wsl | E-12 guard |
| R5 merge-readiness (ci + e2e native WSL) | C6 | todo | codex-wsl | scaffold.runtime |

## Gate

- IMPL-EVAL (separate session) after Phase 1 → expect `PASS` to clear `CHANGES_REQUESTED`.

## Escalations

_none_
