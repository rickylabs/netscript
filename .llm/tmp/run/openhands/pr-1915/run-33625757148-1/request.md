You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/z-ai/glm-5.3-flash provider=openrouter effort=max output=pr-comment iterations=500 phase=impl head=a6fababde69a6964914207d7bc8ec29cb8b4d84e

use harness

## SKILL

- `netscript-harness` — IMPL-EVAL protocol, verdict vocabulary, evidence rules.
- `openhands-handoff` — publish exactly one machine-readable verdict.
- `netscript-deno-toolchain` — `deno doc` for published-surface claims.

Formal IMPL-EVAL for PR **#1915** — issue **#1352**, `[sdk-client S5] prove typed credential
contributions end to end` — at immutable head **`a6fababde`**. Do not edit, commit, push, or repair.

## Operating constraints — a previous attempt burned its whole budget, read these first

The prior run at `88df4839e` **hit the 800-iteration limit without producing a verdict**, stuck
re-entering an interactive pager. Avoid that:

- **Never invoke a pager.** Pipe anything that might page through `| cat`, or use `--no-pager` /
  `PAGER=cat`. If a command appears to hang, do not send keystrokes to it — kill it and move on.
- **Budget your work.** This is a bounded review, not an exhaustive audit. Prefer `deno doc`,
  targeted file reads, and the focused `packages/sdk` + `packages/plugin-auth-core` suites. Do not
  run the repo-wide `deno task test` or `deno task check` — CI already ran both green at this head
  and you can cite that.
- If you run out of useful work, **emit the verdict**. An early, well-grounded verdict beats an
  exhausted budget.

## Gate state at this head — cite it, do not re-derive it

`check-test` **success**, `quality` **success**, `code-quality` **success**, `build` **success**,
core CI lane visibility **success**. `close-gate` is red on exactly one honestly-unticked DoD box —
*"Separate-session IMPL-EVAL passes"* — which is your verdict. It is not an independent defect.

## Head note — the verdict carries by byte-identity if you agree it does

The previous evaluation attempt targeted `88df4839e`. The current head `a6fababde` adds **only
regenerated carriers**: `.llm/assets/agent-docs/prose.json.gz` + `provenance.json`,
`packages/cli/src/kernel/assets/agent-docs.generated.ts`,
`packages/mcp/src/publish-assets.generated.ts`. Verify that claim (`git diff 88df4839e a6fababde
--stat`) and say whether you agree no product source moved. If product source did move, that is a
finding.

## Judge exactly this

1. **The bearer contribution is genuinely explicit, never implicit.** The slice's own claim is that
   the auth plugin makes the contribution *declaratively available* **without auto-attaching
   credentials**. Verify no code path installs it implicitly — a contribution that attaches itself is
   the failure mode this whole epic exists to prevent.
2. **Non-disclosure.** No token, credential, header value, or context value may appear in any error,
   diagnostic, log, or cache key. The slice claims a "cleartext policy" and a metadata tri-state;
   check the negative tests actually pin it, including the redaction path.
3. **Cache partitioning is caller-selected and never derived from the token.** The PR body states the
   cache behaviour is "caller-selected partitioned or direct-only and never derives a token
   partition". That is the single most security-relevant claim here — a partition derived from a
   bearer token would leak credential material into cache keys. Find the test that pins it, and
   satisfy yourself it would fail if the behaviour changed.
4. **Public surface.** `deno doc` the new `@netscript/plugin-auth-core/sdk` entrypoint. Is the
   exported surface exactly what the slice describes — no accidental export of internals, no leak of
   `createHttpClientLink` / `ClientLinkPort` / `ClientLinkCallOptions` (which must stay private per
   #1349)?
5. **Scope.** 27-file ceiling claimed. Check the touch set matches, and that the slice stayed out of
   `packages/sdk/src/internal/client-contributions/prepared-call.ts` and out of
   `traceparent`/`tracestate` — **#1921 (#1353)** and **the #1349 row-7 gap-fill** are concurrent and
   own those surfaces.
6. **Deferred scope honesty.** The body defers "CLI auth-session revoke/list raw-fetch migration"
   because its explicit auth URLs are not modelled by the public SDK transport. Is that deferral
   accurate, or is it deferring something the slice should have handled?

## Output

STRICT format, last line the verdict:

```
[PHASE: IMPL-EVAL] [VERDICT: PASS|FAIL_FIX|FAIL_IMPL]
```

Ground every claim in a command you actually ran or a file you actually read.

---

<!-- openhands-verdict-contract -->

## OUTPUT CONTRACT (mandatory — verdict first)

1. Post the verdict PR comment IMMEDIATELY after you form the verdict — BEFORE any
   optional deep-dive, extra verification, or long context dump. Iteration budgets
   exhaust; a verdict comment deferred to the end of the run is frequently lost.
2. That PR comment MUST start with the formal header line, exactly:
   **[PHASE: <phase>] [VERDICT: <verdict>]**
   where <phase> is your eval phase (e.g. IMPL-EVAL, PLAN-EVAL) and <verdict> is one
   of PASS, FAIL_FIX, FAIL_RESCOPE, FAIL_DEBT, FAIL_PLAN.
3. ALWAYS end BOTH the verdict PR comment AND your summary file with one final
   machine-readable line of the exact form:
   OPENHANDS_VERDICT: <verdict>
   using a literal token from: PASS, FAIL_FIX, FAIL_RESCOPE, FAIL_DEBT, FAIL_PLAN,
   NONE. Use NONE only when no verdict could be reached.


<!-- route-identity requested provider=openrouter model=openrouter/z-ai/glm-5.3-flash effort=max; observed provider=pending model=pending effort=pending -->

Issue/PR title: feat(sdk): add typed bearer credential contribution

Operational contract:
- Read AGENTS.md first.
- Your iteration budget is limited. Create deliverable files in the repository
  workspace EARLY and grow them incrementally as you learn; never defer all
  writing to the end of the run.
- Commit AND push your own source-code changes to the working branch before you
  finish when is_pr is true (the checkout has push credentials). The workflow
  does NOT push source changes for you; it only commits run artifacts under
  .llm/tmp/run/openhands/ and .llm/runs/. Anything else you leave uncommitted
  stays off the branch and is only preserved in the Actions artifact.
- When is_pr is false, do NOT push. Leave your changes in the working tree and
  the workflow opens a draft pull request from them.
- NEVER commit deno.lock (or any lock-file re-resolution churn) unless the task
  explicitly requires a reviewed dependency change. Never commit node_modules,
  caches, scratch files, or logs.
- If your task defines a verdict, emit exactly one line of the form
  OPENHANDS_VERDICT: PASS
  (one token from PASS|FAIL_FIX|FAIL_RESCOPE|FAIL_DEBT|FAIL_PLAN, alone on its
  own line, outside code fences, with NO bold/backtick/prefix decoration) in
  BOTH your summary file and your verdict comment — as the FIRST line of the
  verdict comment. Use ONLY that harness vocabulary: GitHub review terms
  (CHANGES_REQUESTED, APPROVED, REQUEST_CHANGES) are NOT verdicts and report
  OPENHANDS_VERDICT: NONE to the supervisor, as does any other form.
- You may post the PR/issue comments your task instructions require (for
  example an early verdict comment). Do NOT imitate the workflow's own status
  comment: never write an '<!-- openhands-' marker or a '## OpenHands Agent —'
  heading. The workflow owns the final status comment.
- If the task says "use harness", follow .agents/skills/netscript-harness/SKILL.md.
- If the work touches packages/ or plugins/, use .agents/skills/netscript-doctrine/SKILL.md.
- Use rtk for read-heavy git/grep/gh/docker commands when it is available.
- Preserve user changes and avoid destructive git commands.
- Run the smallest validation that proves the change.
- Write /home/runner/work/_temp/openhands/33625757148-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, Remaining risks,
  and the OPENHANDS_VERDICT line when your task defines a verdict.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/33625757148-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-1915/run-33625757148-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 1915
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/z-ai/glm-5.3-flash
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/33625757148
