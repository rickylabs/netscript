You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/google/gemini-3.5-flash provider=openrouter output=pr-comment iterations=400 use harness — **deep-search research run, RETRY** (the prior run `28069821979` failed: it described file edits in prose instead of invoking the editor tool, so nothing was written). Produce the SOTA README dossier.

### CRITICAL — how to write (the prior run failed exactly here)
- Write the dossier ONLY by INVOKING the file-editor tool as a real function/tool call. Do NOT print `file_editor{...}` or `str_replace` as message text — that does nothing and is why the last run produced zero output.
- **Step 1, before any research:** create the file `.llm/tmp/run/docs-readme-revamp/sota-readme-dossier.md` with just the top-level headers (Track 1, Track 2, and their sub-section stubs).
- **Then** fill it incrementally: after EACH exemplar you analyze, append it to the file with a real editor tool call. Never hold more than one exemplar's worth of findings in your head before writing it down. Your uncommitted workspace is auto-committed to branch `docs/readme-revamp` on exit — but only files you actually wrote with tool calls exist.
- If a tool call fails, retry it; never fall back to describing the edit in prose.

### The task (full brief on the branch)
You are on branch **`docs/readme-revamp`**. Read **`.llm/tmp/run/docs-readme-revamp/deep-search-brief.md`** first — it defines the two tracks and exact deliverables. Follow it precisely. Two tracks, clearly separated in the dossier:
- **Track 1 (package READMEs):** 10–15 best-in-class TS/JS/Deno/Rust/Go library READMEs → ranked pattern list (each with URL + the specific device quoted), a canonical package-README skeleton, a quality checklist, anti-patterns.
- **Track 2 (framework-landing READMEs, higher bar):** 10–15 framework/meta-framework/monorepo root READMEs → ranked VISUAL + structural standout patterns (hero, banners, animated demos, badge rows, feature grids, architecture diagrams, packages-map tables, `<picture>` light/dark logos — each cited), a canonical framework-landing-README skeleton for NetScript (2–3 concrete hero options + a packages-map table design), a visual-design toolkit, anti-patterns.

### Hard constraints
- Research ONLY — do NOT modify any NetScript README, package, or plugin file. Only write the dossier.
- Cite every exemplar with its URL and the concrete device — no vague generalities.
- Distinguish markdown/HTML techniques that render on BOTH GitHub and JSR from GitHub-only ones (NetScript publishes to JSR — JSR rendering matters).
- NetScript ground truth: Deno-native JSR meta-framework, alpha `0.0.1-alpha.1`, install via `deno add jsr:@netscript/<pkg>`, docs at `https://rickylabs.github.io/netscript/`. No "honest/honesty/honestly" or candor-announcing framing.

When done, post a short index of the dossier (the section headings you wrote) in this PR thread so completion is verifiable.


Issue/PR title: docs(readme-revamp): package + framework README revamp (PR2)

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
- Write /home/runner/work/_temp/openhands/28071679235-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28071679235-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-117/run-28071679235-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 117
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/google/gemini-3.5-flash
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28071679235
