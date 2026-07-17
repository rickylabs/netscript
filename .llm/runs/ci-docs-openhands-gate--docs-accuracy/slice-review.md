# Slice Review (A1) — ci-docs-openhands-gate--docs-accuracy, slice 1

- Reviewer session: Claude (opposite-family review of Codex-authored slice) — separate from the
  generator; precedes the supervisor sign-off commit. Slice is still uncommitted against `HEAD`,
  so this is the correct A1 ordering.
- Scope reviewed: full uncommitted diff vs `HEAD` (workflow, prompt, audit note, labels, PR skill +
  mirror, run artifacts), plan, PLAN-EVAL, worklog, context-pack, pr-body, drift, and the existing
  `openhands-agent.yml` / handoff skill / models config for contract alignment.

## Verdict basis

Independent re-verification (read-only):

- **Mirror parity** — `.agents/skills/netscript-pr/SKILL.md` and `.claude/skills/netscript-pr/SKILL.md`
  are byte-identical; the added `docs-eval:skip` note is the same in both.
- **Workflow YAML** — parses; `on.pull_request.types=[opened,synchronize,labeled]`; job `if`
  gates on `type:docs || area:docs`; `env.OPENHANDS_MODEL=openrouter/minimax/minimax-m3`.
- **Labels** — 69 total / 69 unique; `docs-eval:skip` has name/color(`d4c5f9`, 6-hex)/description;
  0 malformed colors.
- **Model route** — `models.ts:49` `minimax: 'minimax/minimax-m3'`, member of
  `OPEN_EVALUATOR_MODEL_IDS`; the `openrouter/` prefix is the OpenHands litellm route form.
- **Runner contract** — `openhands-agent.yml` parses params **only from the first line containing
  `@openhands-agent`** (lines 183–203), so the head-SHA marker and prompt body cannot hijack
  `model`/`output`/`iterations`; downstream `issue_comment` job gates on
  `OWNER/MEMBER/COLLABORATOR` (line 136); summary marker `<!-- openhands-agent-summary -->` and
  `OPENHANDS_SUMMARY_PATH` / `pr-comment` output match the handoff skill and the prompt.

Assessed items from the review brief:

- **Trigger events + docs applicability** — correct: `opened/synchronize/labeled`, job runs only when
  `type:docs` or `area:docs` is present.
- **Explicit attributed skip** — the started job's "Skipped on demand" step writes actor/reason/
  head-SHA to `$GITHUB_STEP_SUMMARY` and no dispatch step runs (all three are guarded
  `SKIP_REQUESTED != 'true'`). No silent job skip. Correct.
- **Open-only model guard** — closed-model substring blocklist + exact `openrouter/minimax/minimax-m3`
  equality, failing nonzero before any comment. Hardcoded, not PR-derived. Correct.
- **PAT-only chained comment** — both the token pre-check and the `github-script` post use
  `secrets.PAT_TOKEN`; absent PAT fails visibly with a summary and never falls back to
  `GITHUB_TOKEN`. Correct and load-bearing for the chain.
- **Trusted-base prompt loading** — prompt is fetched via `repos.getContent` at
  `pull_request.base.sha` (not the PR checkout) and asserted to begin with `use harness`; the
  workflow performs no `actions/checkout`, so no untrusted PR code executes. Strong security posture.
- **Dedupe** — exact full-body match scoped by the `head=<sha>` marker, suppressed only while no
  later comment carries the OpenHands summary marker. Matches locked D5; fails safe (worst case a
  duplicate trigger, bounded by per-PR concurrency on both workflows).
- **Prompt contract** — conditional executable-claim hand-testing with the exact mandated
  no-executable-claims sentence, mandatory full changed-set read, per-file `accurate/inaccurate/
  unverifiable` table, blocking hallucinated verb/flag/path findings, and a single PASS/FAIL_FIX.
  Correct.
- **Scope drift** — none; no `packages/`/`plugins/` source touched. Diff matches the plan's file set.

## Findings (by severity)

No blocking findings.

1. **[Low / advisory] Re-run on unrelated label churn after an answer.** Once an OpenHands summary
   exists for a head SHA, any later `labeled` event on that same SHA (e.g. adding `priority:p2`)
   makes `identical && !answered` false, so a fresh trigger is reposted and OpenHands re-runs on
   unchanged docs. This is exactly the locked D5 semantics ("not permanently suppressing reruns")
   and is bounded (Minimax M3, small iteration budget, per-PR concurrency), so it is acceptable —
   noting it as a known cost, not a fix.
2. **[Low / advisory] Fork docs PRs show a failed token check.** On `pull_request` from a fork,
   `secrets.PAT_TOKEN` is empty, so "Require a chainable comment token" exits 1 with an explicit
   summary. This is the intended fail-visible D4 behavior and fork support was scoped as deferred;
   just be aware external-contributor docs PRs will surface a red (non-required) check rather than a
   silent skip.
3. **[Info] Chain depends on PAT identity.** The downstream OpenHands job only fires if the
   PAT-authored comment's `author_association` is `OWNER/MEMBER/COLLABORATOR`. This is a repo-secret
   configuration invariant that cannot be asserted in-workflow; research/plan already acknowledge it.
4. **[Nit] Taxonomy note placement.** `docs-eval:skip` is documented as a continuation line under the
   `ci:` bullet even though it is its own `docs-eval:` namespace. It reads consistently with the
   pre-existing `gate:` nesting in the same bullet and the label name is correct, so no change is
   required.

## Process compliance

- Generator ≠ evaluator: satisfied (opposite-family review session).
- PLAN-EVAL `PASS` recorded before implementation; validation evidence in `worklog.md` matches the
  diff (YAML/label/prompt assertions, volatile-config guard, `agentic:sync-claude:check`, focused
  fmt, `git diff --check`). `actionlint` not installed is compensated by the structural YAML parse.
- Lock hygiene: no `deno.lock` or source churn in the diff.
- No OpenHands dispatch performed by this review; no files modified except this review.

PASS
