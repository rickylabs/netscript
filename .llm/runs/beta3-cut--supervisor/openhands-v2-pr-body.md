# feat(ci): OpenHands agent workflow v2 — deterministic verdicts, step isolation, commit-back hygiene

## SKILL

Relevant skills for review and follow-up work on this PR: `netscript-tools` (OpenHands
triggers, validation evidence, lock hygiene), `netscript-harness` (evaluator protocol the
action runs), `netscript-pr` (GitHub process), `openhands-handoff` (dispatch contract).

## What was rewritten and why

`.github/workflows/openhands-agent.yml` (the `@openhands-agent` cloud-agent action) was
rewritten end-to-end. The v1 action worked, but the last 24h of production runs exposed five
recurring failure modes that made supervisor automation unreliable: verdicts had to be
scraped heuristically, housekeeping failures masqueraded as eval failures, commit-back
pushed `deno.lock` churn and trace junk to PR branches, per-PR concurrency silently
cancelled queued runs, and naive matchers confused template text with real verdicts.

The rewrite keeps the public trigger contract byte-compatible (`@openhands-agent`
comment with `model=` / `provider=` / `output=` / `iterations=` params, `workflow_dispatch`
inputs, `fix-me`/`openhands`/`agent:*` labels, `[openhands...]` commit messages) and moves
all reporting guarantees from the agent to the workflow itself.

## Before/after failure-mode table

| # | Observed failure mode (production, last 24h) | v1 behavior | v2 fix |
|---|---|---|---|
| 1 | Agent exhausts iteration budget without posting its verdict comment or writing the summary file; runner posts a raw context-dump; supervisors scrape verdicts heuristically | `agent_runner.py` synthesizes a summary from the final agent message; no formal verdict field anywhere | The workflow-owned finalize step always publishes one structured comment with an explicit `OPENHANDS_VERDICT:` line. The verdict is parsed with a strict matcher from (a) the agent summary file and (b) agent-posted comments created after run start (the dispatch contract asks evaluators to post the verdict comment *early*, so budget-cut runs still deliver it). No parsable verdict ⇒ the comment states `OPENHANDS_VERDICT: NONE` explicitly. No heuristics remain. |
| 2 | "Job status: failure" even though the eval substantively PASSED (failure came from summary/commit-back housekeeping) | Summary-post and commit steps could fail the job after a successful agent run | All housekeeping steps (`ack`, `trace`, `commit-artifacts`, `create-pr`, `replies`, `finalize`, artifact upload) run `if: always()` **and** `continue-on-error: true`. The job conclusion now reflects only the agent path (request → checkout → toolchain → bootstrap → credentials → agent). Each housekeeping step's own outcome is reported on a `Housekeeping:` line in the final comment. |
| 3 | Commit-back pushes junk to PR branches: full traces, ~193-line `deno.lock` re-resolution churn, scratch files | `git add -A` of the whole workspace (minus two dirs) committed anything the agent left behind, including lock churn | The workflow commits **only** an allow-list: `.llm/tmp/run/openhands/**` and `.llm/runs/**`, with `deno.lock` and `node_modules` excluded even inside those roots (`:(exclude)` pathspecs + a defensive `git reset -- '*deno.lock'`). Agent *source* changes are the agent's own job to commit and push (the request contract says so, replacing the v1 "uncommitted files are committed back automatically" clause). Disallowed leftovers are never pushed: they are counted and sampled in the final comment and preserved as `uncommitted.txt` / `uncommitted.patch` (bounded) in the Actions artifact. |
| 4 | Multiple `@openhands-agent` comments on one PR cancel all-but-one run silently | Same concurrency group, semantics undocumented; superseded runs vanished without explanation | Group stays keyed per event + PR/issue number with `cancel-in-progress: false`; the header now documents the exact GitHub semantics (one RUNNING + one QUEUED per group; a newer trigger **supersedes** the previously queued run, the running one always finishes) and the operating rule of one trigger per intended run, matching the note already in `dispatch-openhands.ts`. Supersession is now a documented, predictable behavior rather than a surprise. A superseded queued run never starts, so it cannot comment — this residual limit is stated in the header. |
| 5 | Prompt/trigger comments containing template text like `[VERDICT: <verdict>]` are indistinguishable from real verdict comments to naive matchers | Params were scanned across the whole comment/issue/PR body; no formal verdict grammar existed | Two independent guards: (a) run parameters (`model=`, `output=`, …) are parsed **only from the trigger line** (the first line containing `@openhands-agent`) for comment triggers, so prompt bodies cannot hijack configuration; (b) the verdict matcher accepts only `^OPENHANDS_VERDICT:[ \t]*(PASS\|FAIL_FIX\|FAIL_RESCOPE\|FAIL_DEBT\|FAIL_PLAN)[ \t]*$` — exact token, alone on its own line, **outside code fences** (fence-aware stripping in both the bash and JS implementations). `OPENHANDS_VERDICT: <PASS\|...>` placeholders, `[VERDICT: <verdict>]`, quoted lines, and lowercase variants all fail to match (unit-tested locally, 11 fixtures). The workflow's own comments are excluded from the scan via the `<!-- openhands-` marker, and the trigger comment is excluded by id. |

## New output contract

Every run that reaches the request step ends with exactly **one** final status comment
(the "Running" acknowledge comment edited in place; a fresh comment if the ack failed):

```text
<!-- openhands-agent-summary -->
<!-- openhands-run: {"run_id":123,"attempt":1,"conclusion":"success","state":"completed","verdict":"PASS","verdict_source":"summary-file"} -->
## OpenHands Agent — <heading>

OPENHANDS_VERDICT: <PASS|FAIL_FIX|FAIL_RESCOPE|FAIL_DEBT|FAIL_PLAN|NONE>

Model: `...`
Provider: `...`
Job status: <success|failure|cancelled>
Verdict source: <summary-file|pr-comment|none> [MISMATCH note when summary and comment disagree; summary file wins]
[Verdict comment: <url>]
Summary source: <agent|agent-after-retry|synthesized...|none>
Housekeeping: ack=... trace=... commit-artifacts=... replies=... draft-pr=...
[Commit-back skipped N non-allow-listed path(s) ...]
[Draft PR: <url>]
Trace: <dir> (committed to the PR branch | in the Actions artifact)
Artifact: openhands-agent-<run>-<attempt>

<agent summary, truncated at 55k chars>

Run: <actions run URL>
```

- **`<!-- openhands-run: {...} -->`** is the stable machine marker: `run_id`, `attempt`,
  `conclusion` (job status), `state` (the run-state slug: `completed` / `summary-missing` /
  `agent-failed` / `bootstrap-failed` / `not-run`), `verdict`, `verdict_source`.
- **Heading vocabulary is frozen** (`Running`, `Completed`, `Completed — no agent summary`,
  `Agent failed`, `Bootstrap failed`, `Did not run`) — exactly the strings
  `parseOpenHandsStatusComment()` maps today.
- The same body is written to the job step summary, and `metadata.json` (committed in the
  trace and uploaded in the artifact) gains an `agent_verdict` key next to the existing
  run-state `verdict` key.
- The strict verdict matcher exists twice by design (bash/awk in the trace step for
  `metadata.json`; JS in the finalize step, which has no toolchain dependency so the
  guarantee holds even when setup failed). Both sites carry KEEP IN SYNC comments and were
  fixture-tested for identical behavior.

## Compatibility with `dispatch-openhands.ts` / `openhands-status.ts`

No changes to `.llm/tools/agentic/` are needed or made:

- **Trigger line**: `buildOpenHandsComment()` puts all `key=value` params on the
  `@openhands-agent` line — exactly the only place v2 reads them from for comment triggers.
- **`openhands-status.ts --source remote`**: keys off `OPENHANDS_MARKER`
  (`<!-- openhands-agent-summary -->`) and parses heading / `Model:` / `Provider:` /
  `Job status:` / `Run:` lines — all preserved verbatim, including the em-dash heading form
  and the `Running` non-final ack heading.
- **`openhands-status.ts --source local`**: reads `metadata.json` + `summary.md` from
  `.llm/tmp/run/openhands/pr-<n>/run-<id>-<attempt>/` — path scheme and existing keys
  unchanged; `agent_verdict` is additive.
- **Planned eval-prompt contract** (early verdict comment + `OPENHANDS_VERDICT:` line in
  both PR comment and summary file) is exactly what the finalize step consumes; the request
  contract sent to the agent now spells out the required literal form.
- Semantics change to be aware of: `Job status: failure` now always means the *agent/infra
  path* failed — housekeeping failures no longer produce it (that is the point of the fix
  for failure mode 2). Supervisors should prefer the `OPENHANDS_VERDICT:` line and the
  `openhands-run` marker over job status.

## Behavior changes (deliberate)

1. **Agent source changes are no longer auto-committed to PR branches.** The request
   contract instructs the agent to commit and push its own source work (the checkout has
   push credentials); the workflow pushes only allow-listed run artifacts. Forgotten work is
   surfaced (leftover count + sample in the comment) and preserved in the Actions artifact,
   never silently pushed — this is what designs out the lock-churn/junk pushes.
2. **Comment param parsing is trigger-line-scoped.** A `model=`/`output=` string in the
   prompt body below the trigger line no longer alters the run. Label- and push-triggered
   runs keep the legacy body/commit-message scan (they have no trigger line).
3. **`workflow_dispatch` prompts no longer leak params**: explicit inputs are the only
   param source for dispatch runs.

## Security / permissions changes

- Workflow-level `permissions: {}`; the single job declares least privilege
  (`contents: write`, `issues: write`, `pull-requests: write`) with per-grant comments.
- All actions pinned to full commit SHAs (with `# vN` comments): `actions/github-script`,
  `actions/checkout`, `denoland/setup-deno` (v2.0.5 — no floating `v2` tag exists),
  `actions/setup-dotnet`, `docker/setup-docker-action`, `actions/setup-python`,
  `astral-sh/setup-uv`, `peter-evans/create-pull-request`, `actions/upload-artifact`.
- `timeout-minutes: 300` bounds the job (previously unbounded up to the 6h default).
- Token handling unchanged and audited: LLM key is `::add-mask::`-ed and exported only via
  `GITHUB_ENV`; the GitHub token appears only in `x-access-token:` push URLs and
  `github-token:`/`GH_TOKEN` inputs; nothing echoes secrets.
- Runtime files (`setup.sh`, `agent_runner.py`, `toolchain.env`) are still hydrated from the
  workflow's own ref, never executed from the (attacker-influenceable) PR head checkout.
- No new helper scripts were added under `.github/scripts/`: the deterministic-output
  guarantee must hold even when checkout/toolchain setup fails, so the finalize logic is
  inline `github-script` (no Deno/Python/checkout dependency). This is a deliberate choice,
  documented in the finalize step comment.

## Local validation performed (and its honest limits)

- **YAML parse**: `deno eval` with `jsr:@std/yaml@1` parses the file; structure dump
  verified 22 steps, job/workflow permissions, concurrency group, and the exact
  `continue-on-error` step set (`ack`, `trace`, `commit-artifacts`, `create-pr`, `replies`,
  `finalize`, upload).
- **Embedded bash**: every `run:` block extracted and passed `bash -n` (with `${{ }}`
  expressions stubbed). Manual shellcheck-style review of quoting, `set -euo pipefail`
  interactions, `$(...)`+`|| true` under `set -e`, and git pathspec magic (`:(exclude)`,
  slash-crossing wildcards).
- **Embedded JS**: all three `github-script` bodies compiled via `AsyncFunction` (syntax
  check).
- **Verdict matcher**: 11-fixture unit test of the JS matcher (placeholders, fences,
  quotes, prefixes, lowercase, `NONE`) — all pass; the awk/grep twin extracted the correct
  verdict from a fixture containing both a fenced decoy and a placeholder line.
- `actionlint`/`shellcheck` binaries were not available on this machine.

**What could NOT be validated locally** — the workflow itself cannot be executed outside
GitHub Actions. CI must prove:

1. A normal PR eval run: ack comment appears, is edited in place into the final structured
   comment; `OPENHANDS_VERDICT` reflects the agent's line; trace commit contains only
   `.llm/tmp/run/openhands/**`.
2. A run where the agent writes no summary/verdict: final comment says
   `OPENHANDS_VERDICT: NONE` with heading `Completed — no agent summary`.
3. A forced housekeeping failure (e.g. branch deleted before commit-back): job stays green
   when the agent succeeded; `Housekeeping:` line shows `commit-artifacts=failure`.
4. Lock hygiene: an agent run that dirties `deno.lock` leaves the branch lock-clean and the
   final comment reports the skipped path.
5. `workflow_dispatch` and label triggers still resolve model/output correctly
   (trigger-line scoping regression check).
6. `openhands-status.ts --source remote` and `--source local` still parse the new comment
   and metadata (additive fields only).

Recommended first CI probe: a low-iteration `@openhands-agent output=pr-comment
iterations=50` smoke on a scratch PR from this branch.

## Rollback

Single-file revert: restore `.github/workflows/openhands-agent.yml` from its pre-rewrite
state on `main` — last touched by commit `893c0904d1d94c43c0f72dd70d02aefbf4228a7b`
(branch base: `eab02889fb94f00ff0af741ccda39c5b44951f51`):

```bash
git checkout eab02889fb94f00ff0af741ccda39c5b44951f51 -- .github/workflows/openhands-agent.yml
```

No other files participate in the rewrite; `.openhands/setup.sh`, `.openhands/agent_runner.py`,
`.github/toolchain.env`, and `.llm/tools/agentic/*` are untouched.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
