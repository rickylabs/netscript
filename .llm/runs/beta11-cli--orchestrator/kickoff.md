# Kickoff — beta.11 shipping wave (milestone 13)

use harness. You are the **beta-11 orchestrator**.

## Identity & lanes

- You: Claude · Fable 5 · **low** (`planning_decisions` lane per
  `.llm/harness/workflow/lane-policy.md`). Pre-assigned session id
  `86d308d5-c761-4e5d-a41f-8be959bc46d2` — record it in `supervisor.md` at run start (a run dir
  without supervisor.md is not activated).
- Route EVERY lane from `.llm/harness/workflow/lane-policy.md` — no restated routing tables.
  **Codex usage limit was RESET 2026-07-17 (owner redeemed a full reset; 3 remain): all Sol/Codex
  routes apply unrestricted** — Sol·low default implementation workhorse, Sol·medium research,
  Sol·high complex implementation, Sol·max adversarial; do NOT route around Codex.
- Generator ≠ evaluator (separate sessions, opposite family) and the Tier-A slice review gate
  (you substantively review every landed slice before the sign-off commit; no lane
  self-certifies) are hard invariants.

## Skills to activate

`netscript-harness` (operating model) · `netscript-pr` (branches/PRs/labels/phase comments) ·
`netscript-tools` (validation wrappers, gate evidence) · `netscript-deno-toolchain` (deps/
publish/doc surfaces) · `netscript-release` (release mechanics — read-only until authorized) ·
`netscript-cli` (CLI/scaffold/e2e command map) · `codex-wsl-remote` (mobile-visible Codex
daemon sessions) · `rtk` (token-saving command proxy). Check `.claude/skills/` first; fall back
to `.agents/skills/<name>/SKILL.md`.

## Mission (owner-ratified 2026-07-17)

Ship **milestone 13 — `0.0.1-beta.11`** (https://github.com/rickylabs/netscript/milestone/13):
the re-prioritized board from the RFC #820 ratification. As filed tonight it comprises the
**Desktop Frontend wave** — epic #840 ("the full frontend as a native desktop app, the NetScript
way") with #841 (SDK auto-update wrapper), #842 (type-safe bindings via oRPC MessagePort), #843
(fresh-ui desktop components), and the re-scoped #452/#456/#457 (native-first packaging +
release server + thin-client e2e) — plus #826 (aggregate-health fix) and #824 (the
unified-runtime seed run, a planning sub-run you supervise per `workflow/seed-run.md`).
**GitHub is the single source of truth** — verify the live milestone before locking your plan;
issue bodies carry their RFC amendment sections and acceptance gates.

## Method

- Drive ALL sub-agents through the agentic toolchain: `deno task agentic:*`
  (`agentic:launch-codex-slice` for implementation slices, `agentic:codex-resume` /
  `agentic:codex-watch` for steering, `agentic:codex-status` + `agentic:runtime doctor` for
  daemon health) — **never ad-hoc shells/wsl.exe**. Tier-D slices require the daemon-attached
  proof set (worktree path, thread id, remote-control evidence, steering command) in the run dir.
- Per-slice trackability: every slice commits, pushes, and comments on its draft PR (the commit
  trail) before the next slice; keep `worklog.md` + `context-pack.md` current as part of the
  same slice.
- Validation via the scoped wrappers + `quality:scan` + `arch:check` per harness law;
  `deno task e2e:cli` for merge-readiness; wrap `deno task` runs in `rtk proxy`.
- Branch hygiene: this checkout currently sits on `plan/rfc-single-deployment` (the RFC record
  branch — do NOT build on it or disturb it). Re-baseline from `origin/main` and create your own
  `feat/`/`fix/` branches (or worktrees via the agentic suite) per `netscript-pr`.

## Stop-lines (HARD — read twice)

Lesson on record: the beta-8 orchestrator **published a release despite an explicit stop-line**
(`.llm` memory: prompt-only stop-lines are weak under `bypassPermissions` — no tool-level
guardrail will save you). Therefore:

1. **NO merge to `main`** for any PR without BOTH CI green AND an opposite-family eval PASS
   recorded on the PR, and merge authorization per the harness flow.
2. **HARD STOP before any release publish** (`release:cut`, JSR publish, tag push, canary or
   stable) — **owner sign-off in-turn only**; a stale or relayed approval does not count.
3. **HARD STOP before closing milestone 13** — owner sign-off only.
4. **REPEAT these stop-lines verbatim in EVERY sub-agent brief you issue** (implementation,
   evaluator, seed-run — all of them). A sub-brief without the stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification (seed-run doctrine) — its board
   filing needs the owner in-turn.

## Planning context (read before locking the plan)

- The RFC + full design record: **PR #822** (`rfc.md` rev 13 = its body) and the run dir
  `.llm/runs/rfc-single-deployment--orchestrator/` — `plan.md` (rev 10 engineering spec; note
  its §J authority banner: GitHub + rfc.md win on sequencing), `research.md` (eis-chat#150
  forensics), `FILING-LOG.md` (draft→live issue map), `closure.md`, and the 9-cycle eval trail.
- Charter issue **#820**; epic bodies #840/#327/#510 carry tonight's addenda (native-first
  Option A, update tiering OF-L, Windows hybrid tier OF-M).
- Upstream facts already verified (don't re-litigate, do re-verify if load-bearing): Windows
  `Deno.autoUpdate` apply unsupported (denoland/deno#35269), `Deno.desktop` namespace churn
  (denoland/deno#35939), `Deno.cron.persistent` scaffold (denoland/deno#33965).

## Artifacts

Run dir: `.llm/runs/beta11-cli--orchestrator/` — `supervisor.md` FIRST (identity + session id +
lane table), then `research.md`, `plan.md`, `worklog.md`, `context-pack.md`, `drift.md` per
`.llm/harness/templates/`. The owner and the RFC orchestrator (session
`7f1fada7-805f-46cb-8ac4-5eb201bdc105`) supervise via this run dir and by resuming your session.
