use harness

## SKILL

- netscript-harness — run loop; commit-by-slice + push + PR comment trail; run-dir artifacts under
  `.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/leaf-1881/`; no self-certification.
- netscript-doctrine — `packages/cli/e2e` is gate code: no `any`/casts/lint-ignores; IO only at the
  gate runtime edge (README parsing is a pure function with unit tests; process spawning stays in the
  gate command layer as in `aspire-walk.ts`).
- netscript-tools — scoped `run-deno-*` wrappers, carrier chain (`gen:agent-docs-prose` →
  `gen:assets-barrel` → `gen:publish-assets` → `gen:mcp-export-corpus`) if README edits move a
  carrier; never hand-edit `*.generated.ts`.
- netscript-cli — `deno task e2e:cli suites|gates <id>` registry, `cli-surface.ts` constants.
- netscript-pr — labels/milestone/closing-keyword rules; `Closes #1881`, `Part of #863`.
- aspire (internal `.agents/skills/aspire`) — `aspire wait` / resource readiness semantics on 13.5.3;
  do not invent CLI flags.

# Slice leaf-1881 — `readme.quickstart`: clean-runner walk of the root README sequence (#863 gate 3)

Issue: #1881 (`status:plan`, coordinator-authorized 2026-09-03). Epic #1712 / parent #863 gate 3.
Worktree: `/home/agent/projects/netscript/worktrees/007-aspire-leaf-1881`, branch
`test/aspire-1881-readme-quickstart`, base main `79adb103b`. Route: Codex · OpenAI · GPT-5.6 Sol ·
medium (`normal_implementation`). Read `AGENTS.md`, `.agents/skills/netscript-harness/SKILL.md`,
`.agents/skills/netscript-pr/SKILL.md`, then the files named below. Do not read anything under
`worktrees/007-aspire/` other than this brief.

## Goal (verbatim from the coordinator)

Execute the root README Quickstart commands **verbatim on the hosted clean runner**
(`e2e-cli-prod.yml`, GitHub-hosted ubuntu, published JSR CLI). Add only the necessary stable markers
and drift parsing, and an **executable readiness step if required**. **Never hide divergence, never
add retry or manual recovery.** Preserve the foreign-resource cleanup doctrine. This is for the next
canary/stable admission and must not touch the running Canary 8 (no release refs, no tags, no
`.github/workflows/release*`, no publish surfaces).

## Current state (verified on main `79adb103b`)

- `packages/cli/e2e/suites/quickstart/quickstart-walk-suite.ts` walks `QUICKSTART_DOCUMENTED_COMMANDS`
  which mirrors `docs/site/quickstart.vto` (pinned by
  `packages/cli/e2e/tests/presentation/quickstart-command-drift_test.ts`), **not** the root README.
- `README.md` lines 28–76 ("## 🚀 Quickstart") print: `deno install … jsr:@netscript/cli@<version>`;
  `netscript init my-app --db postgres --service --yes`; `cd my-app/aspire`; `aspire restore`;
  `aspire start`; prose "wait until the `postgres` resource reports healthy"; `cd ..`;
  `netscript db init --name init`; `netscript db generate`; `netscript db seed`;
  `curl http://localhost:<port>/health`.
- Divergences README vs `quickstart.walk`: `--service` path never walked; `db *` without `--db`;
  `curl /health` never executed; the readiness wait is prose only (the #1880 seam);
  `ASPIRE_RESTORE_MAX_RETRIES = 2` in the walk suite is a retry the README does not print.
- `aspire start` is foreground/long-running; `src/application/gates/quickstart/aspire-walk.ts` already
  models restore/start with timeouts — reuse its process handling, not its retry.
- `createCleanupGates()` (`src/application/gates/scaffold/runtime-gates.ts`) provides the four-part
  zero-baseline cleanup with ownership proof (post-#1855). Foreign/unknown-owner resources are never
  touched. Inherit it unchanged.

## Deliverables (gate code + docs only; **no `packages/*/src` product code outside `packages/cli/e2e`**, no `plugins/`, no lockfile)

1. **README markers + parser.** Wrap the Quickstart's executable fences in
   `<!-- readme-quickstart:start -->` / `<!-- readme-quickstart:end -->` (README prose otherwise
   untouched except item 4). Add a small pure parser in `packages/cli/e2e/src/` that extracts the
   ordered command lines from the `bash` fences between the markers, dropping `#` comment lines and
   the `# {"status":…}` output-example line. Substitutions allowed: `<version>` → the published
   version from `--cli jsr:@netscript/cli@<version>`; `<port>` → the service port taken from the
   scaffold output / run receipt. Nothing else is rewritten. Unit-test the parser.
2. **`readme.quickstart` suite** (`packages/cli/e2e/suites/quickstart/readme-quickstart-suite.ts`,
   registered in the suite registry + `cli-surface.ts` constants; requires `--source jsr` like
   `quickstart.walk`). It executes the parsed commands **in README order, exactly once each, no
   retries** (`aspire restore` runs once; a failure is a verdict, not a retry trigger).
   `aspire start` is started as the walk does and left running for the later steps; `cd` lines
   change the cwd of following commands. Each command is one gate with a receipt (argv, cwd, exit,
   duration, bounded stdout/stderr tail). Append `...createCleanupGates()`. A README command that
   cannot be executed as printed is a **gate failure that names the README line** — do not paper
   over it in the transcript.
3. **Drift test** `packages/cli/e2e/tests/presentation/readme-quickstart-drift_test.ts` that pins the
   README marker block to the suite's expected ordered command list, in the style of
   `quickstart-command-drift_test.ts`, so a README edit and the walk cannot silently diverge.
4. **Readiness step, executable.** Replace the prose "wait until the `postgres` resource reports
   healthy" with one printed, executable README line inside the markers — use the Aspire CLI wait
   command that exists on Aspire 13.5.3 (`aspire wait …`; check `aspire wait --help` output recorded
   in `.llm/runs/research-aspire-13.5-adoption--0.0.7/research.md` or run it locally — do **not**
   invent flags) — so the manual step disappears and the walk executes it verbatim. If no such
   command can express it, do not add a poll loop: leave the prose, and make the walk record the
   gap as an explicit failing gate with the README line quoted (divergence is the finding).
5. **Workflow.** In `.github/workflows/e2e-cli-prod.yml`, add a step after the `quickstart.walk`
   step running `deno task e2e:cli run readme.quickstart --source jsr --cli "jsr:@netscript/cli@…"
   --cleanup --report .llm/tmp/readme-quickstart-prod-report.json --log-file
   .llm/tmp/readme-quickstart-prod.ndjson`, and include the report in the existing failure
   summary loop and artifact upload. **Commit the workflow change as its own last commit** — pushing
   it needs a workflow-scoped credential the supervisor holds; if your push is rejected for
   `workflow` scope, push the preceding commits and report; do not retry with other credentials.
6. **Docs/harness.** `packages/cli/e2e/README.md` (or its suite table) lists `readme.quickstart`.
   Write `.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/leaf-1881/worklog.md` in the
   worktree (design section, slices, gates run) and `drift.md` if reality diverges from this brief.

## Gates (run before every push)

- `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli/e2e --ext ts,tsx`
- `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/e2e/tests`
- `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli/e2e --ext ts,tsx`
- `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli/e2e --ext ts,tsx`
- `deno task e2e:cli suites` lists `readme.quickstart`; `deno task e2e:cli gates readme.quickstart`
  prints the gate list without starting anything.
- Do **not** run `scaffold.runtime`, `quickstart.walk`, or `readme.quickstart` locally — runtime
  proof is the hosted prod runner at the next canary (no runtime lease is granted for this slice).
- If `README.md` edits touch generated carriers (`deno task check:agent-docs-prose` etc.), run the
  generators listed in `AGENTS.md`'s carrier chain and commit the regenerated output; never hand-edit
  `*.generated.ts`.

## PR

Open PR `test(e2e): walk the root README quickstart verbatim on the clean prod runner (#863 gate 3)`
against `main` with labels `type:test area:cli area:aspire gate:e2e priority:p1 orchestrator:aspire
status:impl`, milestone `0.0.7`, body with a Definition of Done containing: hosted `readme.quickstart`
transcript at a canary tag attached (left unticked — supervisor fills it), separate-session
IMPL-EVAL PASS. Body must contain `Closes #1881` and `Part of #863` (no closing keyword for #863 or
#1712). Report the PR number, head SHA, and exact push result in your final message. Do not merge,
do not relabel after opening, do not touch release refs.
