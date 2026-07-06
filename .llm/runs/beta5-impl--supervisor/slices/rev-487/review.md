use harness

## SKILL

Read these repo skills before any work (under `.agents/skills/<name>/SKILL.md`):
- `netscript-harness` — gate context
- `netscript-tools` — gate-evidence rules
- `netscript-pr` — label taxonomy (`ci:*` labels this PR adds)
- `rtk` — prefix read-heavy git/grep with `rtk`

## Identity & scope

You are an UNORIENTED ADVERSARIAL REVIEWER for draft PR #487
(`chore/ci-skip-expensive-lanes` — CI skip lanes for docs-only PRs + explicit skip labels).
You did NOT write this; assume it is wrong until proven otherwise. READ-ONLY: never edit,
commit, or push. Worktree: `/home/codex/repos/netscript-rev487` (checked out at the PR head).

This PR gates expensive CI (e2e-cli.yml scaffold-static/scaffold-runtime) behind a classifier:
docs-only auto-detect + `ci:skip-scaffold`/`ci:skip-e2e` labels, `ci:full` override, expensive
jobs always start but short-circuit to SUCCESS. HARD CONSTRAINTS it must not violate:
`publish.yml`, `e2e-cli-prod*`, and the required checks (`quality`, `check-test`, `deps-report`
in ci.yml) must be completely untouched; no skipped-state stranding of any check.

Review `git diff origin/main...HEAD`. Attack surfaces:
1. **Classifier correctness** (`.github/scripts/ci-classify-changes.ts` + tests): construct
   adversarial file lists — e.g. `packages/cli/README.md`, `.github/workflows/x.yml`, deno.json
   in a nested dir, mixed docs+source, empty diff, renamed files, case variants, `docs/` vs
   `docsx/` prefix collisions. Does the denylist REALLY always win? Does the GITHUB_OUTPUT CLI
   path compute the changed-file list correctly for PR events (base..head vs merge commit)?
2. **Workflow YAML** (`e2e-cli.yml`): expression injection risks (label names in `if:`),
   fork-PR label visibility, `pull_request` event types (does label add/remove re-trigger?
   if `ci:full` is added AFTER a skip run, does it re-run?), concurrency-group interactions,
   short-circuit jobs still emitting SUCCESS on all paths, matrix/needs edges.
3. **Skip semantics**: any path where a genuinely source-impacting PR is classified docs-only
   (worst-case failure). Any path where the classify job itself fails and the guard defaults
   OPEN (skip) instead of CLOSED (run).
4. **Labels**: `.github/labels.yml` additions consistent with taxonomy; note the PR intentionally
   does NOT sync labels to GitHub.
5. Confirm zero changes to publish.yml / e2e-cli-prod* / ci.yml required jobs.

## Output

Post ONE PR comment on #487 titled `**[PHASE: ADVERSARIAL-REVIEW] [Codex]**` with: verdict
`CLEAN` or `CAVEATS`, then numbered concrete caveats (file:line + why + suggested fix) or
explicit "no findings" per attack surface. End your turn with the same verdict word.
