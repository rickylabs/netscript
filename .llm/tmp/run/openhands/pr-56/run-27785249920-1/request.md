You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment iterations=400 use harness

## ROLE — IMPL-EVAL (Group 3 user docs, run `docs-user-site--diataxis`)

You are the **IMPL-EVAL** evaluator for PR #56 (`docs/user-site` → `release/jsr-readiness`), the Group 3 external user-documentation site. This is a **separate evaluator session** from the generator (a Claude dynamic workflow authored the content under the LD-DOCS-LANE exception; you validate, you do not self-certify). Read `.llm/harness/evaluator/protocol.md`, `.llm/harness/evaluator/verdict-definitions.md`, the `SCOPE-docs` overlay, and the plan's Locked Decisions.

**Branch tip to evaluate:** `b8085a1a` (`docs/user-site`).

### What landed (the doc fan-out + anchor fix)
- A Lume static-site under `docs/site/` (Diátaxis IA): **22 primary reference pages** generated from `deno doc`, **4 Diátaxis concept pages** (getting-started, add-a-plugin, architecture, plugin-model), **26 standardized READMEs**, a README conformance checker (`.llm/tools/check-readme-standard.ts`), and heading-id generation (`markdown-it-anchor` in `docs/site/_config.ts`).
- Plan + locked decisions: `.llm/tmp/run/docs-user-site--diataxis/plan.md` (US-1 Diátaxis IA; US-2 reference generated from `deno doc`; US-3 Lume; US-7 Pages base path `https://rickylabs.github.io/netscript/`; US-8 22 primary pages, the 4 `plugin-*-core` folded as `## Internals` under their public plugin; US-9 standardized README template).

### Re-verify per domain (run and paste raw output — do not trust generator claims)

**Build + nav (US-3, US-7):**
1. `deno task --cwd docs/site build` — expect exit 0, `_site` produced. Confirm `docs/site/_config.ts` sets `location` to the exact Pages base URL (US-7).
2. In-page anchors: confirm headings carry `id`s and that `href="#…"` targets resolve. (The generator reports 0 broken in-page anchors across 31 pages after adding `markdown-it-anchor`.) Note `docs/site/_site/` is now gitignored/untracked — that is intended (Pages CI rebuilds it).

**Reference accuracy (US-2) — the core doc-quality gate:**
3. Spot-check **at least 6 units across archetypes** (e.g. `logger`, `database`, `aspire`, `sdk`, `plugin`, one plugin like `sagas`). For each: run `deno doc <its public entry>` and confirm the reference page lists the real exported symbols/signatures and **invents no exports**. Reference pages must be reference-style (US-1), not tutorial prose.
4. US-8: confirm there are 22 primary reference pages and that the 4 `plugin-*-core` packages are folded as an `## Internals` subsection under their public plugin page (not standalone primary pages).

**README standard (US-9):**
5. `deno run --no-lock --allow-read .llm/tools/check-readme-standard.ts --pretty` — expect **26/26 conform**, exit 0.

**Diátaxis IA (US-1):**
6. Confirm the four sections (tutorials / how-to / reference / explanation) exist, are separated, and cross-link. Concept pages should be explanation-style, not reference dumps.

### A1 doc-lint context (IMPORTANT — avoid a known measurement trap)
The 26-unit A1 (`deno doc --lint`) gate is tracked on the umbrella, not this PR. **If you sample `deno doc --lint`, run it over each unit's FULL export map (all `deno.json` `exports` entries in ONE invocation), NOT `mod.ts` in isolation** — per-entry linting falsely flags types that are re-exported from a sibling entry as `private-type-ref` (see `.llm/harness/lessons/validation.md`). Authoritative census: **25/26 clean; the sole real A1 failure is `@netscript/fresh-ui`**, fixed in PR #58 (separate slice). Do not open A1 findings against `plugin`/`telemetry`/`database` — they are clean under full-export-set lint and `deno publish --dry-run`.

### Verdict
Emit `PASS` / `FAIL_FIX` / `FAIL_RESCOPE` / `FAIL_DEBT` with a **per-domain breakdown** (build+nav / reference accuracy / READMEs / Diátaxis) and raw gate output. A clean build, resolving anchors, accurate `deno doc`-derived reference, 26/26 README conformance, and a coherent Diátaxis IA should be `PASS`. Preserve lock hygiene: do not commit `deno.lock` or source churn; the `docs/site/deno.lock` already pins `markdown-it-anchor@9.2.0`.


Issue/PR title: docs(user-site): Diátaxis user docs site + per-package reference (Group 3)

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
- Write /home/runner/work/_temp/openhands/27785249920-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27785249920-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-56/run-27785249920-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 56
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27785249920
