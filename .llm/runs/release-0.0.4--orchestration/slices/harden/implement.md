use harness

# Slice: harness hardening — the release-blocking tooling defects (#1087, #1084, #1080, #1083)

Worktree: `/home/codex/repos/ns004-harden` · branch `fix/1087-harness-hardening` · base `origin/main`
@ `4833a1676`.

**This is the last slice before the 0.0.4 release cut.** Four issues, in priority order. Read every
issue body in full — each was written from a real incident during this release, with the evidence in
the body.

## SKILL

- `.agents/skills/netscript-harness` — run loop, lane policy, slice contract, commit trail.
- `.agents/skills/netscript-tools` — repo tooling, validation evidence, lock hygiene.
- `.agents/skills/netscript-pr` — `Closes #N` in the PR **body**; every `gh` call passes
  `--repo rickylabs/netscript`.
- `.agents/skills/netscript-release` — for #1083 only.
- `.agents/skills/rtk` — prefix read-heavy `git`/`gh`/`grep` with `rtk`.

## 1. #1087 (p0) — the evaluator recruits paid help. Do this first.

A bound open-model evaluator (`qwen/qwen3.7-max` over `claude-openrouter`) launched correctly and then
**autonomously spawned closed-model sub-agents** — prohibited on that transport because they bill the
owner's OpenRouter balance. A supervisor interrupted it before verdict; measured spend across the
window was ~$1.79, small only because someone was watching.

The control gap is precise, and worth stating so you fix the right thing:
`resolveCanonicalFormalEvaluatorRoute()` validates **the route we launch**. It does not constrain what
the launched model does next. The guard is enforced at the entry point and absent thereafter.

**Enforce it on the child surface, not the launch route.** An evaluator session must not be able to
instantiate a model outside `OPEN_EVALUATOR_MODEL_IDS`. Deny it by **configuration of the spawned
environment** — not by an instruction in a prompt, which is exactly the kind of "optional" control
this release has repeatedly shown agents route around. Attempting a prohibited model must abort the
evaluation loudly and be logged with the model id and requesting session, so a run interrupted by luck
is distinguishable from one that never tried.

This is the release's only open p0 and it is a cost-safety control. Do not weaken the existing
open-models-only invariants while adding it; the guard tests must still pass, including
`formal evaluator rejects the Gemini documentation-authoring generator lane`.

**Never echo a credential.** The key lives at `~/.config/netscript-agentic/openrouter.env` and its
value must never reach a log, worklog, PR body, commit, or shell trace. You do not need it here.

## 2. #1084 (p1) — a PR body can be published onto the wrong PR

Two concurrent slices wrote a PR body to the same scratch filename; one session's
`gh pr edit --body-file` published the **other session's body**, closing keywords included. Caught and
corrected within minutes, both PRs verified intact — but this is a near-miss of the failure that
already destroyed a merged PR's body once, now reachable without any mis-typed argument. The payload
is closing keywords: swapped and unnoticed, it auto-closes the wrong issues on merge.

Scratch artefacts intended for publication go to a **per-slice or per-session** path, and
`agentic:gh-pr` must not publish a body file it did not write this session.

## 3. #1080 (p1) — the tests that close #1064 never run

Every Redis regression test added by #1075 is gated on `NETSCRIPT_TEST_REDIS_URL`, which is set
**nowhere** in `.github/`. They all skip in CI. #1064's recorded root cause was that
`packages/kv/tests/` contained zero Redis adapter tests — a test that exists but never executes
reproduces that condition exactly, while showing green.

Provide the Redis service and the env var to the check/test lane, and make sure a skipped integration
test cannot silently pass the suite. The closing proof is the last acceptance box: **reverting the
#1075 adapter fix must turn CI red.** Demonstrate that.

## 4. #1083 (p2) — the breaking-change release note

`ServiceStreamProducerOptions.assertResolvable` was removed from `@netscript/plugin-streams-core` in
#1076. It must appear in the 0.0.4 release notes with the replacement behaviour (fail-fast at startup)
stated, and any lingering reference removed.

## close-gate is part of the work

It reads the `- [ ]` boxes on all four issues and fails until each is ticked. Verify each criterion as
you land it, tick it, and post the evidence — command, observed output, and for tests proof they fail
against pre-fix behaviour. **Tick nothing you cannot evidence.** An unmet criterion is a legitimate
outcome: drop that closing keyword and state the remaining scope.

## Lessons from the seven PRs already merged in this release

- **A gate that has only ever run in one place is not evidence.** `Deno.Command` *throws* on a missing
  binary rather than returning non-zero.
- **Blast radius ≠ files edited.** Run the package suite, not the file suite.
- **Two stated root causes in this release were wrong.** Establish the real path empirically.
- **Read the actual error text.** A red `classify changes` turned out to be a cancellation artifact of
  a superseded run; a `duplicate_sender_risk` refusal exits 0.

## Gates

`deno task check` · `deno test` over `.llm/tools/agentic/` (including
`config/no-hardcoded-volatile_test.ts` and `runtime/routing-policy_test.ts`) · scoped lint/fmt
wrappers. Verify the artefact, never the exit code. Do not run `scaffold.runtime` concurrently with
another slice.

## Deliverable

One draft PR closing #1087, #1084, #1080 and #1083, driven to ready-for-merge. Commit per issue; push
and comment commit hash + gate evidence before the next. Report as soon as #1087 lands — it is the
release's last p0 and the orchestrator is waiting on it.
