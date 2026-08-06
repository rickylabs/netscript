# S1 ordinary review identity

| Field | Evidence |
| --- | --- |
| Role | Fresh independent advisory `REVIEW`; never PLAN-EVAL or IMPL-EVAL |
| Requested route | OpenRouter `x-ai/grok-4.5`, effort `medium` (owner-authorized temporary drift) |
| Observed route | provider `xAI`, model `x-ai/grok-4.5`, effort `medium` |
| Session | `bad4a807-6399-4af8-b97b-2cbbb8d0cdb5` |
| Worktree | `/home/codex/repos/ns005-deepseek-review` |
| Branch / target | `review/deepseek-v4-formal-impl-evaluator-1338-s1` at exact PR head `f2bc222667b369b1749248a7b74befa2e08e9da8` |
| Transport | checked-in `.llm/tools/agentic/claude/remote-model-launcher.ts` credential-isolated gateway |
| Permissions | `bypassPermissions` observed in transcript and CLI |
| Phone / Remote Control | **FAILED / NOT ATTACHED** — custom model endpoint does not support Remote Control |
| CLI visibility | `tmux attach-session -t ns1338-grok-review-gateway` displays the actual Claude Code CLI backed by Grok |
| Transcript | `/home/codex/.claude/projects/-home-codex-repos-ns005-deepseek-review/bad4a807-6399-4af8-b97b-2cbbb8d0cdb5.jsonl` |
| Cost | Provider did not expose currency cost; `unavailable`, never inferred as zero |
| Verdict | Advisory `PASS`; complete evaluator-authored body in `review.md` (trailing Markdown hard-break whitespace normalized to blank lines) |

## Failed launch attempts excluded from review evidence

- The canonical OpenHands dispatcher posted trigger comment `5208807248`, but GitHub materialized
  no `issue_comment` Actions run or workflow status comment in the bounded observation window.
- A fresh Codex OpenRouter launcher attempt in the review worktree created thread
  `019fd8b7-d5a7-7ec2-a255-0e10276d9ade` and observed the requested Grok/medium identity, but the
  turn failed before inference because `OPENROUTER_API_KEY` was absent from the child environment.
  Its observed approval/sandbox were `on-request`/`readOnly`, not the required bypass/full-access
  contract. It is excluded completely; the launcher-caused review-worktree lock delta was restored
  to exact HEAD before the valid gateway session.

## Review-local lock incident

The valid Grok reviewer ran an intermediate scoped check whose child resolved `deno.lock` despite
the outer `--no-lock`. It immediately restored only its isolated review-worktree lock, reran the
focused tests with explicit lockless arguments, and finished with HEAD/worktree blob
`ef28b1b056705b456a66601ceeb46eede9def7b0` and clean status. The implementation, root, and T1-B
worktrees were untouched. This incident is provenance, not product diff or merge evidence.
