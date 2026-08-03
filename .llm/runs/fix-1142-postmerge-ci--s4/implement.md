use harness

## SKILL

Read `.agents/skills/netscript-tools/SKILL.md`. You are the implementation lane
(Codex · GPT-5.6 Sol · low) for slice **S4** of epic #1169, closing #1142 and #1174.
Supervisor reviews before sign-off; commit but do NOT push; do not open PRs.

## Slice S4 — post-merge / deleted-ref CI hardening

Worktree `/home/codex/repos/ns004-s4-ci-hardening`, branch `fix/1142-postmerge-ci`.
Scope: `.github/workflows/e2e-cli.yml`, `.github/workflows/openhands-agent.yml`, run-dir worklog.
Do NOT touch `e2e-cli-prod*.yml`, `ci.yml`, or `.llm/tools/release/`.
Read #1142 and #1174 in full first (`gh issue view … --repo rickylabs/netscript`) — #1142 contains
the confirmed root cause.

### Design contract (LOCKED)

**A. #1142 — classify-changes corrupts `$GITHUB_OUTPUT` post-merge (`e2e-cli.yml:107-110`)**

1. Never write an unterminated heredoc: compute `git diff` into a temp file FIRST; only after it
   succeeds, append the complete `changed<<__EOF__ … __EOF__` block to `$GITHUB_OUTPUT`.
2. If `git diff` fails because `$BASE_SHA`/`$HEAD_SHA` is unresolvable (branch deleted post-merge),
   the step must state that reason in plain text and set an explicit output
   (e.g. `diff_unavailable=true`), and downstream jobs must skip cleanly — a merged PR must never
   gain a new red check from a post-merge re-run. Prefer also short-circuiting the whole job when
   the PR is already merged (`github.event.pull_request.merged == 'true'` on relevant event types)
   if that is expressible without breaking pre-merge runs.
3. The failure text, when a genuine diff error occurs pre-merge, must surface the git error — not
   the delimiter symptom.

**B. #1174 — `agent` check permanently red on deleted branches (`openhands-agent.yml`)**

4. Before any work in the `agent` job, resolve the target ref; if it no longer exists, exit the job
   as **skipped/neutral with an explanatory notice** (`echo "::notice::…"` + early `exit 0` guarded
   step outputs, or a job-level `if:`) — never a failure. No behavior change when the ref exists.

### Negative-case demonstration (required, local, in the worklog)

- Reproduce the #1142 corruption locally: a `bash -e` snippet using the OLD pattern with a failing
  `git diff` → show the unterminated heredoc in a fake `$GITHUB_OUTPUT`; then the NEW pattern →
  show the file stays well-formed and the true git error is printed. Paste both transcripts in
  `.llm/runs/fix-1142-postmerge-ci--s4/worklog.md`.
- For #1174: simulate the guard with a nonexistent ref locally (`git rev-parse --verify`) → show
  the guard path taken with the notice text.

### Gates

- `actionlint` if available (`command -v actionlint`); otherwise
  `deno run --allow-read npm:@action-validator/cli` is NOT approved — if no workflow linter is
  installed, validate YAML with `deno eval` yaml parse and say so in the worklog.
- `rtk git diff` review of your own change before committing; no other files touched.

### Done means

Worklog evidence (both negative cases + linter/parse result), single commit on
`fix/1142-postmerge-ci`:
`fix(ci): post-merge re-runs and deleted refs can no longer paint merged PRs or main red (#1142, #1174)`.
Commit, do not push.
