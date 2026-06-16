You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 output=pr-comment iterations=700 use harness

Activate SKILL
- netscript-harness
- netscript-doctrine
- aspire

**RESEARCH ONLY — coordinated toolchain-upgrade research for Deno 2.8.x + Aspire 13.4.x (run `chore-deno-2.8-aspire-13.4-upgrade--research`).** You are an upgrade analyst, NOT an implementer. Produce an adoption matrix + legacy-removal list + validation plan + seams. **Zero source/config edits** — no `deno.json`/`deno.jsonc`, no `*.csproj`/`global.json`, no lockfiles, no `packages/` code. The only files you create/modify live under `.llm/tmp/run/chore-deno-2.8-aspire-13.4-upgrade--research/`. **Never** delete lock files/caches or run `deno cache --reload`, and do NOT run `deno upgrade` or any SDK bump.

**START HERE (mandatory):** read `.llm/tmp/run/chore-deno-2.8-aspire-13.4-upgrade--research/research-brief.md` (questions A–F + boundaries) and `context-pack.md` (read order). The repo already has two prior notes you must read FIRST and re-verify, do not trust blindly: `.llm/tmp/run/master--public-release-program/notes/TOOLCHAIN-2.8.md` and `…/ASPIRE-13.4-13.5.md`.

**WRITE-ARTIFACT-FIRST (mandatory — prior OpenHands runs on this repo hit the iteration cap and produced synthesized-after-limit summaries; do NOT repeat that): your FIRST action is to open the skeleton `research.md` in that run dir and fill section A, then B, … re-saving AS YOU GO so the artifact is durable well before any cap. Budget reading so BOTH `research.md` and the `OPENHANDS_SUMMARY_PATH` summary are written and committed before the cap.**

Scope (full detail in research-brief.md):
- **A. Deno 2.8 adoption matrix** — for each program-affecting 2.8 feature decide adopt-now / defer / N-A with the concrete workspace action and named file(s): `isolatedDeclarations` + `lint.rules.tags:["recommended","jsr"]` + re-enabled `no-process-global`/`no-node-globals`; per-package `--allow-slow-types` carve-outs (`contracts`, `triggers`, `service`, `plugin`) as score-impacting debt (never a workspace default); `deno bump-version`; `deno publish` path→registry auto-rewrite; `deno ci`; `catalog:`; `deno audit`; TS 6.0.3; `lib.node` default; testing upgrades (per-test timeout, sanitizers-off, per-function coverage); `deno compile` framework detection; OTel console/gRPC exporters; `deno task` parallel output; `deno pack` (defer/stretch?).
- **B. Deno 2.8 legacy removal** — list file paths of bespoke machinery 2.8 makes obsolete (no back-compat).
- **C. Aspire 13.4 adoption matrix** — SDK `13.2.2→13.4.x` + CommunityToolkit `Deno`/`SQLite 13.1.0→13.4.x` (`dotnet/AppHost/AppHost.csproj`, `dotnet/global.json`); confirm the CLI-scaffolded **TS apphost matches the 13.4 GA shape** (`apphost.mts`, `.aspire/modules/`, startup validation); dashboard commands via typed resource-command args + `WithProcessCommand()`; `aspire logs/otel --search`. **Verify the live 13.4 surface + exact CommunityToolkit versions via the Aspire MCP** (`list_docs`/`search_docs`/`get_doc`/`list_integrations`).
- **D. Aspire legacy removal + 13.5 seam** — list superseded hand-patched/generated-artifact paths to remove; design the 13.4 apphost so it flips cleanly to the **native Deno apphost at 13.5** (`microsoft/aspire#16218`, which we requested), mirroring its validation checklist (toolchain resolution, `aspire doctor` Deno reporting, CLI E2E restore/run/doctor). Design only; 13.4 is self-sufficient, 13.5 is not a launch gate.
- **E. Coordinated validation plan (design only)** — exact gate commands + pass criteria (`deno task check:*`, `lint`, `test`, `fmt`, `arch:check`) + stack e2e (`netscript init → deno task check → aspire run` against the playground, nightly/release not per-PR).
- **F. Own analysis / risk register** — 2.8↔Fresh/Lume/JSR, `isolatedDeclarations` breakage in generic packages, .NET10 + 13.4 prerelease interplay, CI `v2.x`→`2.8.x` pin decision, Deno↔Aspire upgrade ordering/coupling, and the overlap with the Wave 6 CLI research (PR #43) — keep consistent (CLI owns apphost-scaffold/deploy seam; this owns toolchain version + feature adoption), do NOT duplicate.

Deliverable: `research.md` fully filled (each area A–F ends in a concrete recommendation) + Deno + Aspire adoption matrices + legacy-removal lists + validation plan + risk register + a suggested **upgrade slice plan (Deno-first vs Aspire-first; sub-branch order) for the LATER impl phase (not executed here)**. Summary via `OPENHANDS_SUMMARY_PATH` ending with EXACTLY one line: `RESEARCH COMPLETE`. No verdict, no implementation, no version bumps, no merging. Do NOT emit any `@openhands-agent` block.

Issue/PR title: [Toolchain] Deno 2.8.x + Aspire 13.4.x upgrade — RESEARCH phase

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
- Write /home/runner/work/_temp/openhands/27522478072-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27522478072-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-44/run-27522478072-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 44
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27522478072
