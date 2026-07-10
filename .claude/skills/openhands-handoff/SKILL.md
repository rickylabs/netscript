---
name: openhands-handoff
description: >
  Operate NetScript's OpenHands GitHub Actions, VPS, and PR-comment handoff workflow,
  including per-run model selection, output modes, and agent-to-agent triggers.
---

This skill is the routing card for OpenHands handoffs: comments and labels start cloud work, and the
required summary artifacts keep local and cloud agents synchronized.

## When to Use

- The user asks to trigger, configure, review, or debug OpenHands in this repo.
- A task mentions `@openhands-agent`, `agent:<model>`, `fix-me`, `[openhands ...]`, or OpenHands
  output modes.
- A local agent needs to hand work to cloud Actions or a VPS Web UI session.
- A cloud agent must respond to PR or issue review comments.

## When Not to Use

- For package or plugin architecture decisions, use `netscript-doctrine`.
- For harness run planning, evaluator protocol, or run artifacts, use `netscript-harness` first and
  this skill only for the OpenHands trigger/handoff mechanics.
- For JSR publish readiness, use `jsr-audit`.

## Routing policy — READ FIRST (open models + cloud only)

OpenHands is **not** the evaluator for local runs. Two hard rules:

1. **OpenHands runs OPEN models only** — e.g. `minimax/minimax-m3`, `qwen/qwen3.7-max`. NEVER dispatch
   OpenHands with a closed/paid model (Claude/`sonnet`, GPT/`gpt`, Gemini/`gemini`). Closed models on
   OpenHands route through paid OpenRouter/LiteLLM credit and can silently burn the owner's balance —
   this is prohibited.
2. **OpenHands is for CLOUD-driven runs only** — small GitHub-Copilot-style tasks the owner wants
   reviewed fully in the cloud with adversarial agents. For any run on the **local machine**, do NOT
   dispatch cloud OpenHands at all. Use a **local opposite-family adversarial agent** for
   PLAN-EVAL / IMPL-EVAL / review (e.g. Codex GPT-5.6 reviews Claude-authored work; a Claude session
   reviews Codex-authored work), launched locally. The **supervisor chooses what to trigger** —
   sub-agents/implementers must NEVER auto-dispatch a cloud evaluator.

If a local run's harness step calls for PLAN-EVAL/IMPL-EVAL and no local adversarial agent is
available, record the gap in `drift.md` and let the supervisor decide — do not fall back to OpenHands.

## Key Concepts

| Concept          | Meaning                                                                                                                                                                      |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Actions agent    | `.github/workflows/openhands-agent.yml`, used for short cloud runs.                                                                                                          |
| VPS session      | Long-running OpenHands Web UI/SDK deployment from `ops/openhands/docker-compose.yml`.                                                                                        |
| Model profile    | OPEN models only (e.g. `minimax/minimax-m3`, `qwen/qwen3.7-max`). Closed models (`sonnet`/`gpt`/`gemini`) are PROHIBITED on OpenHands — see the routing policy above.        |
| Literal model    | Any LiteLLM-compatible `provider/model` string supplied with `model=...`.                                                                                                    |
| Provider secret  | `LLM_API_KEY_<PROVIDER>`, inferred from the model prefix, with `LLM_API_KEY` fallback.                                                                                       |
| Output mode      | `pr-comment`, `respond-comments`, `thread-replies`, or `summary-only`.                                                                                                       |
| Iteration budget | `iterations=<n>` trigger token (default 500, clamped 50-3000); a run cut off at the limit reports `agent-failed` and keeps partial workspace files via the commit-back step. |
| Summary artifact | `OPENHANDS_SUMMARY_PATH`, required before the workflow exits.                                                                                                                |
| Status comment   | One workflow-owned PR/issue comment that starts as running and is edited with the final result.                                                                              |
| Thread replies   | Optional `OPENHANDS_REPLIES_PATH` review-comment replies.                                                                                                                    |
| Chainable token  | `PAT_TOKEN` or GitHub App token; required for cloud-created events to trigger more workflows.                                                                                |

## Trigger Syntax

Use one of these from GitHub mobile, a local agent, or another cloud agent:

- Add `fix-me` or `openhands` to an issue or PR.
- Add a model label: `agent:sonnet`, `agent:gpt`, or `agent:gemini`.
- Comment with `@openhands-agent ...` from an owner, member, or collaborator account.
- Push a commit whose message contains `[openhands ...]`.
- Run `OpenHands Agent` manually from Actions.

Provider/model/effort selection is per run and must come from
`.llm/harness/workflow/lane-policy.md`. Use the enforced dispatcher rather than hand-authoring a
model trigger:

```bash
deno task agentic:dispatch-openhands --pr <n> --prompt-file <path> \
  --provider <provider> --model <model> --effort <effort> --output pr-comment
```

The model precedence is:

1. manual workflow `model` input,
2. `model=...` in a comment or commit message,
3. `agent=<profile>` in a comment or commit message,
4. `agent:<profile-or-literal>` label,
5. repository variable `OPENHANDS_DEFAULT_MODEL`,
6. `anthropic/claude-sonnet-4`.

The workflow infers the provider from the selected model prefix unless `provider=...` is present:

| Model prefix           | Provider     | Preferred secret         |
| ---------------------- | ------------ | ------------------------ |
| `anthropic/`           | `ANTHROPIC`  | `LLM_API_KEY_ANTHROPIC`  |
| `openai/`              | `OPENAI`     | `LLM_API_KEY_OPENAI`     |
| `gemini/` or `google/` | `GEMINI`     | `LLM_API_KEY_GEMINI`     |
| `openrouter/`          | `OPENROUTER` | `LLM_API_KEY_OPENROUTER` |

Provider-specific secrets fall back to `LLM_API_KEY` when the specific key is absent; optional
provider-specific base URLs use the same suffix pattern (`LLM_BASE_URL_<PROVIDER>`, `LLM_BASE_URL`
fallback).

## Output Modes

| Mode               | Behavior                                                                                |
| ------------------ | --------------------------------------------------------------------------------------- |
| `pr-comment`       | Post one summary comment to the target issue or PR.                                     |
| `respond-comments` | Post one summary comment that explicitly responds to relevant review or issue comments. |
| `thread-replies`   | Post the summary and any review-thread replies from `OPENHANDS_REPLIES_PATH`.           |
| `summary-only`     | Upload artifacts only; do not comment.                                                  |

The agent must write `OPENHANDS_SUMMARY_PATH` before exit. For a harness run, the verdict of record
and its trace live in the **tracked** run dir: `OPENHANDS_RUN_DIR` is the run's `.llm/runs/<run-id>/`
dir (where the evaluator's `plan-eval.md`/`evaluate.md` is committed), and `TRACE_DIR` is `trace/`
beneath it (env `OPENHANDS_TRACE_DIR`) for compact trace metadata. Do not reuse legacy
`.llm/tmp/openhands/summary.md` or `.llm/tmp/run/openhands/…` scratch as the verdict — see
`.llm/harness/workflow/agent-handoff.md` for the full output contract.

## Token Rule

GitHub does not trigger follow-up workflows from events created with the default `GITHUB_TOKEN`. Use
a dedicated bot PAT or GitHub App token in `PAT_TOKEN` when cloud-emitted commits, comments, or
labels should trigger another workflow.

Local agents that push with your own credentials already produce chainable events.

## Default tooling — the agentic suite (use this to dispatch and check status)

`.llm/tools/agentic/` is the **default mechanism** for dispatching OpenHands runs and reading their
verdict — reach for it before hand-writing a `gh`/REST PowerShell one-liner (note: `gh` is not on
the Windows PATH here). See `.llm/tools/agentic/README.md` for full flags and exit codes.

| Need                                                                          | Tool                                                                            |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Validate the prompt contract → build the `@openhands-agent` trigger → POST it | `dispatch-openhands.ts` (`--dry-run` shows the exact comment, no token/network) |
| Read the run verdict (committed trace by default, or the PR status comment)   | `openhands-status.ts` (`--source local` \| `--source remote`)                   |

`dispatch-openhands.ts` enforces the handoff contract in code (prompt MUST begin with `use harness`
and carry a `## SKILL` chapter — see step 2 below) and reads the GitHub token only from an
in-process env var (`--token-env`, default `GH_TOKEN`), never from a file or argv. It posts exactly
one trigger comment, respecting the per-PR concurrency-cancel rule.
`openhands-status.ts --source
local` needs no token and reads the newest committed trace under the run's `TRACE_DIR`
(`.llm/runs/<run-id>/trace/`).

## Workflow

1. Read `AGENTS-handoff.md` for trigger syntax and token rules.
2. If the prompt says `use harness`, load `netscript-harness` and follow its evaluator separation.
   **Every dispatch prompt you author MUST begin with `use harness` and include a `## SKILL`
   chapter** — a bullet list naming each relevant repo skill for the cloud agent to activate
   (`netscript-harness`, `netscript-doctrine`, `jsr-audit`, `netscript-tools`, `netscript-pr`,
   `netscript-deno-toolchain`, etc.), each with a one-line note of why it applies. **Be generous:**
   the more relevant skills you pass, the more efficient the agent. Skills are thin and the agents
   use them appropriately, so under-listing is the failure mode, not over-listing.
3. Select the canonical route and invoke `dispatch-openhands.ts` with explicit `--provider`,
   `--model`, and `--effort`. Treat legacy labels/comments as compatibility triggers, not routing
   authority.
4. Choose an output mode:
   - `pr-comment` for ordinary summaries,
   - `respond-comments` when review comments must be addressed in one summary,
   - `thread-replies` only when exact PR review-comment IDs are available,
   - `summary-only` for artifact-only runs.
5. Require the cloud agent to write `OPENHANDS_SUMMARY_PATH` with changes, validation, comment
   responses, and risks. The workflow ignores legacy `.llm/tmp/openhands/summary.md`.
6. For long-running work, use the VPS Web UI deployment and leave a PR/issue comment that links the
   session outcome back to the GitHub thread.

## Common Pitfalls

- **Relying on `GITHUB_TOKEN` for chains**: GitHub suppresses workflows triggered by events created
  with the default Actions token. Use `PAT_TOKEN` or a GitHub App token when one cloud agent should
  trigger another.
- **Choosing thread replies without IDs**: `thread-replies` needs PR review-comment IDs in
  `OPENHANDS_REPLIES_PATH`. Use `respond-comments` for a single high-quality response when IDs are
  uncertain.
- **Skipping the summary artifact**: GitHub comments and PR bodies come from
  `OPENHANDS_SUMMARY_PATH`; missing summaries produce workflow failure diagnostics.
- **Reusing legacy OpenHands scratch files**: `.llm/tmp/openhands/` is gitignored runtime scratch.
  The workflow uses a clean per-run `OPENHANDS_RUN_DIR` and mirrors compact trace metadata to
  `OPENHANDS_TRACE_DIR`.
- **Posting duplicate comments**: the workflow owns the status/final comment. Agents write
  artifacts; they do not call `gh issue comment` directly.
- **Using Actions for long sessions**: move multi-step, human-in-the-loop work to the VPS Web UI.
- **Oversized single-run tasks**: a research+design+plan mega-prompt can exhaust the iteration
  budget during exploration, leaving zero artifacts. Split the task into sequential triggers and/or
  raise `iterations=`, and require the agent to create deliverable files early and grow them
  incrementally.
- **Eval run mutating `deno.lock`**: a PLAN-EVAL/IMPL-EVAL run's `deno check` / `deno publish
  --dry-run` can silently re-resolve and commit `deno.lock` churn (observed: a
  `@opentelemetry/semantic-conventions` downgrade riding into a merged umbrella). Rule: **an
  evaluator must never mutate the lock** — instruct the run prompt to `git checkout -- deno.lock`
  before committing. Diff the lock against the **true base** (the commit the wave forked/synced
  from), not the working baseline — an in-branch "unchanged" claim hides churn that predates the
  first slice. Reconcile-don't-revert mid-wave (Golden Rule 6: never delete the lock or `--reload`
  without approval). The lock is not the only churn: an IMPL-EVAL commit-back can also push
  scratch/junk files alongside the verdict artifact. **Verify the committed file set before merge** —
  the intended change is the run's `evaluate.md`/`plan-eval.md` plus any authorized fix, not a
  re-resolved `deno.lock` or stray workspace files; drop anything outside that set.
- **Trusting the persistent PR summary comment**: the `<!-- openhands-agent-summary -->` comment is
  one per PR and is **not always regenerated** for a new run — it can show a prior run's package,
  phase, and verdict while only its `updated_at` bumps. **The verdict source is the committed run
  artifact** (`plan-eval.md` for PLAN-EVAL, `evaluate.md` for IMPL-EVAL), never the PR comment;
  confirm it names the right run id, slices, and surface before accepting it.
- **Stacking `@openhands` comments on one PR**: multiple `@openhands` triggers on the same PR
  cancel all-but-one under the per-PR concurrency group. Post exactly one trigger per intended run.
  Trigger placement also chooses the checkout: a **PR comment** runs against the PR branch, an
  **issue comment** runs against `main`.

## Reference Files

| File                                     | Load when                                    |
| ---------------------------------------- | -------------------------------------------- |
| `AGENTS-handoff.md`                      | Any OpenHands trigger or handoff task        |
| `.github/workflows/openhands-agent.yml`  | Debugging or changing the Actions workflow   |
| `.openhands/setup.sh`                    | Adjusting cloud bootstrap/toolchain setup    |
| `.openhands/microagents/repo.md`         | Updating OpenHands repo context              |
| `ops/openhands/docker-compose.yml`       | Deploying or changing the VPS Web UI         |
| `.llm/harness/workflow/agent-handoff.md` | Integrating OpenHands with harness phases    |
| `.llm/tools/agentic/README.md`           | Dispatching/checking OpenHands via the suite |

## Checklist

- [ ] Trigger names the model/profile when default model is not desired.
- [ ] Output mode matches the requested comment behavior.
- [ ] `PAT_TOKEN` or GitHub App token is configured for chained cloud events.
- [ ] `OPENHANDS_SUMMARY_PATH` is written before exit.
- [ ] Harness evaluator separation is preserved when the task says `use harness`.
