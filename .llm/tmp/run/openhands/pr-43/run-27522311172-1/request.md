You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 output=pr-comment iterations=700 use harness

Activate SKILL
- netscript-harness
- netscript-doctrine
- netscript-cli
- aspire

**RESEARCH ONLY — deep-dive architecture research for `@netscript/cli` (Wave 6, run `feat-package-quality-wave6-cli--research`).** You are a research analyst, NOT an implementer. Produce analysis + a proposed target architecture + seams. **Zero code, zero `packages/` edits, zero edits to existing package docs.** The only files you create/modify live under `.llm/tmp/run/feat-package-quality-wave6-cli--research/`.

**START HERE (mandatory):** read `.llm/tmp/run/feat-package-quality-wave6-cli--research/research-brief.md` (the maintainer's 6 feedback points + research questions A–F + hard boundaries) and `context-pack.md` (read order). Follow that brief exactly.

**WRITE-ARTIFACT-FIRST (mandatory — prior OpenHands runs on this repo hit the iteration cap and produced synthesized-after-limit summaries; do NOT repeat that): your FIRST action is to open the skeleton `research.md` in that run dir and fill section A, then B, … re-saving AS YOU GO so the artifact is durable well before any cap. Budget reading so BOTH `research.md` and the `OPENHANDS_SUMMARY_PATH` summary are written and committed before the cap.**

Scope of the deep dive (full detail in research-brief.md):
- **A. Domain decomposition / enterprise folder structure** — the CLI owns scaffolding + runtime + deployment (+ future). Map current `src/{kernel,local,maintainer,public}` (esp. `kernel/adapters/{deploy,windows,runtime,scaffold,…}`) → true bounded domains. Propose the concrete target `src/` tree under Doctrine 05 (canonical role folders, no forbidden names, ≤12/dir, ≤4 depth, ≤500 LOC) and the **A6** gate matrix. This is the answer to the open **`packages/cli` AP-1 / Restructure** debt.
- **B. Standards** — propose `packages/cli/docs/standards.md` (command contract, typed error model, IO/output discipline incl. no `console.*` in domain code, naming, testing tiers, public-surface/doc-lint rules) + catalog current violations.
- **C. Future-impl readiness** — stable seams (command registry, ports, adapter registration, presets) + a protect-don't-implement list.
- **D. Aspire 13.4 deployment seams (DESIGN ONLY)** — read `.llm/tmp/run/master--public-release-program/notes/ASPIRE-13.4-13.5.md` and `packages/aspire/` FIRST, then research Aspire 13.4's latest deploy features (publishers/deployers, `aspire publish`/`deploy`, compute environments, k8s/container targets). Design a `deploy` port + target-adapter seam so today's hand-patched **Windows** path becomes one adapter alongside future **k8s / container / cloud** adapters. Name the exact Aspire 13.4 APIs each future adapter would wrap (wrap-don't-reinvent). **No implementation.**
- **E. Scaffolding improvements** — bounded, concrete, incremental (the scaffold path is good — Wave 5 proved `scaffold.runtime` E2E 41/41).
- **F. Own analysis** — slow-types/`deno publish --dry-run` blockers (mind the documented `--dry-run` false positive, nested PLAN §9), over-cap files, `console.*` leakage, vendor-type leaks, test gaps, the `e2e/` workspace member (Wave-6-owned).

Deliverable: `research.md` fully filled (each area A–F ends in a recommendation) + proposed target `src/` tree + deploy-seam design + standards outline + risk register + a **Wave-6 implementation slice plan for the LATER impl phase (not executed here)**. Summary via `OPENHANDS_SUMMARY_PATH` ending with EXACTLY one line: `RESEARCH COMPLETE`. No verdict, no implementation, no merging. Do NOT emit any `@openhands-agent` block.

Issue/PR title: [Wave 6] @netscript/cli — RESEARCH phase (enterprise architecture + Aspire 13.4 deploy seams)

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
- Write /home/runner/work/_temp/openhands/27522311172-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27522311172-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-43/run-27522311172-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 43
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27522311172
