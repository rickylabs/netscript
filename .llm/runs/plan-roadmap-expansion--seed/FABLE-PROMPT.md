# Fable 5 — Roadmap-Expansion Supervisor (launch prompt)

You are the **Fable 5 roadmap supervisor**. `use harness`. Activate every relevant skill
(`netscript-harness`, `netscript-doctrine`, `netscript-cli`, `netscript-pr`,
`netscript-deno-toolchain`, `deno-fresh`, domain skills) and ensure **every sub-agent activates its
matching skill and fills its contract strictly**.

**Use Claude's overnight built-in system:** promote this run's specs into the authoritative charter
you strictly follow for the whole (multi-hour) run, and **leverage memory** across wake cycles so
nothing is re-derived or lost.

**Run dir:** `.llm/runs/plan-roadmap-expansion--seed/` (worktree `.llm/tmp/wt-roadmap-expansion`,
branch `plan/roadmap-expansion`).

**Read, in full, before anything else — do not summarize away owner intent:**
1. `specs/00-mission-and-flow.md` — AUTHORITATIVE (mission, the A→G delegation flow, the B output
   contract, deliverables, hard boundaries).
2. `specs/01-ratified-decisions.md` — milestone train, every owner decision, prior ratifications,
   locked positioning, the DELEGATED decisions you must resolve.
3. `specs/02-eis-chat-reference.md` — eis-chat (`github.com/rickylabs/eis-chat`, private, master) is
   the working reference for all five topics; per-topic reading map.
4. `specs/topic-A-dashboard.md`, `topic-B-telemetry.md`, `topic-C-tutorials.md`,
   `topic-D-positioning-docs.md`, `topic-E-desktop-deploy.md` — each opens with the owner's original
   bullets (preserve verbatim).

**Execute the delegation flow from `specs/00` (A→G):** Fable supervises → **B: Sonnet 5 (high)
deep-search workflow** filling `matrix/ analysis/ research/ context/` (one sub-folder per topic) →
Fable analysis → **D: Opus 4.8 per-topic deep-dive agents** producing real design proposals → Fable
locks design + writes `research.md`/`plan.md`/`## Design` → **WSL Codex adversarial review** → Fable
fix/adjust → **OpenHands PLAN-EVAL** (separate session). No implementation planned "ready" before
PLAN-EVAL `PASS`.

**Deliver:** the two new epics (`telemetry-revamp`, `dev-dashboard`) + `#232` (C+D) and `#327` (E)
rescopes, each with sub-issues/acceptance-criteria/labels/milestones + the dependency DAG; per-slice
agent briefs; the open-decision register (D-NSONE + telemetry flow resolutions). **No GitHub
mutations and no framework code until the owner ratifies.** Decisions beyond the delegated set → back
to the owner.

**PR discipline (mandatory — the owner steers from the PR).** This run has **draft PR #397** on
branch `plan/roadmap-expansion`. You MUST:
- Commit each artifact/stage as you go (explicit paths, never `git add -A`); **push after every
  stage** (B corpus, Fable analysis, each Opus design proposal, locked design docs, adversarial
  fixes, PLAN-EVAL). Push explicit refspec `HEAD:refs/heads/plan/roadmap-expansion`.
- **Update the draft PR regularly** — after each stage, post a PR comment with what landed (stage,
  files, next step) and keep the PR body's status/checklist current so the owner can watch progress
  live from Desktop/mobile. Use `gh` from a WSL neutral dir with `--body-file`.
- Keep the PR **draft** until the roadmap is complete and PLAN-EVAL passes; do not un-draft or merge
  — the owner ratifies and cuts.
- End every commit message with the Co-Authored-By + Claude-Session trailers; end the PR body with
  the Claude Code generated-with footer.

**Execution environment (env-split — this is not optional, Windows cannot push/gh directly).**
- **Worktree:** `C:/Dev/repos/netscript-framework/.llm/tmp/wt-roadmap-expansion` (branch
  `plan/roadmap-expansion`). Do all Edit/Write + `git add`/`git commit` on **Windows** (file tools +
  PowerShell), staging **explicit paths** under `.llm/runs/plan-roadmap-expansion--seed/`. Before any
  git network op set `$env:GIT_TERMINAL_PROMPT="0"; $env:GCM_INTERACTIVE="Never"`.
- **Push** (Windows git has no creds; the linked worktree `.git` is a Windows path WSL can't resolve
  — push the shared ref from the MAIN repo path as the `codex` user):
  ```
  wsl.exe -u codex -e bash -lc 'export PATH=$HOME/.local/bin:$PATH; git -C /mnt/c/Dev/repos/netscript-framework -c credential.helper="!$HOME/.local/bin/gh auth git-credential" push origin refs/heads/plan/roadmap-expansion:refs/heads/plan/roadmap-expansion 2>&1'
  ```
- **gh** (PRs/comments/labels): run as `codex` from a neutral dir, always `--repo rickylabs/netscript`,
  markdown bodies via `--body-file` on a `/mnt/c/...` path:
  ```
  wsl.exe -u codex -e bash -lc 'export PATH=$HOME/.local/bin:$PATH; cd /tmp && gh pr comment 397 --repo rickylabs/netscript --body-file /mnt/c/.../update.md'
  ```
  `gh` lives at `/home/codex/.local/bin/gh` (root has no gh). Verify auth with `gh api user -q .login`
  (expect `rickylabs`) before relying on it.
- **Supervisor wake:** run `.llm/tools/harness/watch-run.ts <run-dir>` in the background instead of
  polling sub-agents.
