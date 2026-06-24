You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
use harness

@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment

# IMPL-EVAL — PR #118 root README (docs/root-readme)

You are the **IMPL-EVAL** evaluator (separate session from the generator). This is the final
documentation PR of the "road to JSR publish" topology (PR1 #116 publish mechanics, PR2 #117 package
READMEs — both merged). The single deliverable is the repository root `/README.md`: the JSR + GitHub
landing page for the NetScript meta-framework. Authored under the Claude documentation-authoring
exception (Markdown only; no `packages/`/`plugins/` source, no `deno.json`, no `deno.lock`).

Check out the PR branch (`docs/root-readme`) and evaluate the committed `/README.md` against the
PASSed plan. Do NOT rewrite the README; produce a verdict.

## SKILL

Activate and follow these repo skills before evaluating (read each `SKILL.md`; mandatory):

- `.agents/skills/netscript-harness` — the IMPL-EVAL protocol and verdict definitions. Read
  `.llm/harness/evaluator/protocol.md`, `.llm/harness/evaluator/verdict-definitions.md`, and the
  `SCOPE-docs` overlay. You are the final evaluator pass; you do not self-author fixes.
- `.agents/skills/jsr-audit` — JSR rendering rules. Confirm every device renders on GitHub AND
  degrades cleanly on the JSR scope page (mermaid is stripped on JSR — verify the ASCII canvas is the
  always-visible source of truth and the mermaid is only an optional `<details>` enrichment).
- `.agents/skills/netscript-doctrine` — the true 31-package public surface, so the package-map
  accuracy/completeness check is grounded, not guessed.
- `.agents/skills/netscript-deno-toolchain` — `deno doc` / shipped docs to ground-truth the quick
  start CLI command if you challenge it.

## Read

- `.llm/tmp/run/docs-root-readme/plan.md` — the PASSed plan (locked decisions D1–D5, gates, debt).
- `.llm/tmp/run/docs-root-readme/deep-search-brief.md` — the authoritative 31-package map (exact
  names + one-liners) at lines 60–92. This is the accuracy ground truth.
- `.llm/tmp/run/docs-root-readme/followups.md` — recorded, non-blocking follow-ups (brand/banner
  asset; `@netscript/queue` ref-page existence; the deferred `dx` CLI command sweep). These are
  intentionally OUT of scope for PR3 — do not fail the PR for them.
- `.llm/tmp/run/docs-root-readme/commits.md` — the single commit (b6faf31b).
- `/README.md` — the deliverable.
- A few merged PR2 package READMEs (e.g. `packages/sdk/README.md`, `packages/service/README.md`,
  `plugins/auth/README.md`) for badge-style / voice / cross-link consistency.

## Verdict criteria (per the plan's gates)

1. **Structure (D1):** the 10-chapter order is present (Title+hero+3 badges → value prop → What is
   NetScript → 60-Second Quick Start → Architecture → Packages → Documentation → Roadmap & Maturity
   → Contributing → License).
2. **Hero + badges (D2/D5):** JSR-safe ASCII hero (no missing image asset); exactly 3 badges (JSR
   scope `jsr.io/badges/@netscript`, CI `ci.yml/badge.svg`, Docs `docs-rickylabs.github.io-blue`).
3. **Architecture (D3):** an ASCII canvas is present and is the always-visible diagram; any mermaid
   is optional under `<details>` and not the sole diagram.
4. **Package map completeness (D4):** ALL 31 packages from the authoritative map are present, with
   EXACT names, grouped into the six layers, columns Package · JSR · Capability · Reference — no
   drops, no invented rows, no wrong names. Confirm the count is exactly 31.
5. **Voice (D5):** zero banned tokens ("honest/honesty/honestly", candor-announcing or
   apologetic-alpha framing). Alpha is signalled as a factual noun-phrase callout with a roadmap
   link.
6. **Links:** every doc link is absolute (`https://rickylabs.github.io/netscript/...` or an absolute
   `github.com` URL); zero relative doc links.
7. **Quick start truthfulness:** the CLI command is ground-truthed
   (`deno install ... jsr:@netscript/cli/bin/netscript.ts` + `netscript init`, and the no-install
   `deno run -A jsr:@netscript/cli/bin/netscript.ts` form) — it matches the shipped
   `docs/site/cli-reference.md`. (The shorter `deno dx` form is a recorded, deferred follow-up — its
   absence is correct, not a defect.)
8. **fmt:** `deno fmt --check README.md` is clean.
9. **Scope:** ONLY `/README.md` changed (plus run artifacts under `.llm/tmp/run/docs-root-readme/`).
   No source, no `deno.json`, no `deno.lock`.

## Output

Post a PR comment with: an explicit verdict (`PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`),
a per-criterion checklist (1–9 above) with pass/fail, and — if not PASS — the minimal concrete fix
list. Report the raw `deno fmt --check README.md` result. Preserve lock hygiene: do NOT commit
`deno.lock`, source churn, or any file other than (if needed) `.llm/tmp/run/docs-root-readme/`
evaluator artifacts.


Issue/PR title: docs(root-readme): meta-framework landing README (PR3)

Operational contract:
- Read AGENTS.md first.
- Your iteration budget is limited. Create deliverable files in the repository
  workspace EARLY and grow them incrementally as you learn; never defer all
  writing to the end of the run. Uncommitted workspace files are committed back
  to the branch automatically when the run ends, even if you run out of budget.
- If the task says "use harness", follow .agents/skills/netscript-harness/SKILL.md.
- If the work touches packages/ or plugins/, use .agents/skills/netscript-doctrine/SKILL.md.
- Use rtk for read-heavy git/grep/gh/docker commands when it is available.
- Preserve user changes and avoid destructive git commands.
- Run the smallest validation that proves the change.
- Do not post GitHub issue or PR comments directly. The workflow owns GitHub comments.
- Write /home/runner/work/_temp/openhands/28132700264-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28132700264-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-118/run-28132700264-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 118
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28132700264
