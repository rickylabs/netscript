use harness

# Slice: repoint the Gemini documentation lane to Antigravity (#1082)

Worktree: `/home/codex/repos/ns004-lanefix` · branch `fix/lane-gemini-antigravity` · base
`origin/main` @ `2d58481e4`.

## SKILL

- `.agents/skills/netscript-harness` — slice contract, lane policy, commit trail.
- `.agents/skills/netscript-tools` — scoped check/lint/fmt wrappers, validation evidence.
- `.agents/skills/netscript-pr` — `Closes #N` in the PR **body**; every `gh` call passes
  `--repo rickylabs/netscript`.
- `.agents/skills/rtk` — prefix read-heavy `git`/`gh`/`grep` with `rtk`.

## Scope — small and exact. Read #1082 in full.

PR #1077 bound the `documentation_authoring` lane to **Claude · OpenRouter · Gemini 3.6 Flash**
(`claude-docs-gemini-3-6-flash`). Wrong transport: it bills the owner's OpenRouter **credit**.
Gemini must run on the **Antigravity CLI (`agy`)**, which uses his Google **subscription**.

1. Repoint `documentation_authoring` in `.llm/tools/agentic/runtime/routing-policy.ts` to
   **Antigravity CLI · Google · `agy`** (`MODEL_IDS.antigravity`) — bind it the same way the existing
   `research_extraction` lane is bound. That lane is your reference implementation; it was already
   correct.
2. Remove `OPENROUTER_MODEL_IDS.gemini` from `.llm/tools/agentic/config/models.ts` and the
   `claude-docs-gemini-3-6-flash` preset from `runtime/provider-profiles.ts`, so no lane can route
   Gemini to paid credit by following the config.
3. Update the rendered table row and the 2026-08-03 owner-decision paragraph in
   `.llm/harness/workflow/lane-policy.md`: name the Antigravity transport, and state plainly that
   Gemini over OpenRouter is **not** an approved route because it spends credit where a subscription
   exists. Keep it as a dated decision record — do not revert it to an open question.
4. Add a test asserting `documentation_authoring` is **not** bound to an OpenRouter provider.

## Do not touch

The evaluator invariants. The formal evaluator lane stays open-models-only (`qwen/qwen3.7-max`,
`minimax/minimax-m3`), and Gemini stays a **generator** lane rejected by
`resolveCanonicalFormalEvaluatorRoute()`. The existing test *"formal evaluator rejects the Gemini
documentation-authoring generator lane"* must still pass — if your change makes it pass for a
different reason, say so rather than deleting or rewriting it.

Do not hardcode a model id outside `config/` — `config/no-hardcoded-volatile_test.ts` fails the suite
if you do.

**Never echo a credential.** The OpenRouter key lives at `~/.config/netscript-agentic/openrouter.env`
and its value must never reach a log, worklog, PR body, commit, or shell trace. You do not need it
for this slice.

## Gates

`deno task check` · `deno test` over `.llm/tools/agentic/` (must include
`config/no-hardcoded-volatile_test.ts` and `runtime/routing-policy_test.ts`) · scoped lint/fmt
wrappers. Verify the artefact, never the exit code — a piped command reports the last stage's status.

## Deliverable

One PR closing #1082, driven to ready-for-merge. This is a small slice: one or two commits, pushed,
with gate evidence in a PR comment. The `close-gate` reads the `- [ ]` acceptance boxes on #1082 and
will fail until each is verified and ticked — tick them only with evidence.
