# IMPL-EVAL cycle 1 — PR #1729 grouped agent-init leaf

Verdict: **PASS_IMPL** (two ADVISORY findings, zero BLOCKING).

## Head identity

| Field | Value |
| --- | --- |
| PR | #1729 `fix(cli): improve agent init guidance and cross-host skills` (draft, milestone 0.0.7) |
| Issues | #1674 (p0), #1672, #1675 — PR body carries `Closes` for all three |
| Evaluated head | `9abc76d48cb7bf63ee25b413fb72160362bc2e8c` — equals `pr.headRefOid` at evaluation time |
| Base | `main@8b1e42f725919457c64781d5973fd419017fab13`; `git merge-base --is-ancestor` → ancestor; integrated by merge `a04e505f4` (not rebase) |
| Author | Codex `gpt-5.6-sol` (thread `01a04f8b-…`); evaluator is a separate Claude Fable 5 session |
| Evaluator worktree | `/home/codex/repos/netscript-007-eval-1729` (detached, read-only for product paths; `git status` clean before and after) |
| Product paths changed | exactly 5: `assets/agent/guidance.md.template` (new), `assets/embedded.generated.ts`, `assets/manifest.ts`, `features/agent/init/init-agent.ts`, `features/agent/init/init-agent_test.ts` — no sixth product path (`git diff --name-only base..head | grep -E '^(packages|plugins)/'`) |
| Non-product | 8 run-artifact files under `.llm/runs/fix-agent-init-guidance-and-cross-host-skills--0.0.7/` |

## Reproduction environment

- All probes ran in pristine tracked-files-only archives (`git archive <sha> | tar -x`) under
  `$CLAUDE_JOB_DIR/tmp`: `head-a` (barrel regen + focused test + scoped wrappers), `head-b`
  (`quality:gate`, own lock), `head-c` (fresh scaffold), `base` (control, `8b1e42f72`). Lock-sensitive
  gates were never run sequentially in one archive.
- Fresh scaffold: `deno run -A packages/cli/bin/netscript-dev.ts init evalapp --path <archive>/.llm/tmp/evalapp --yes --non-interactive --no-git --editor vscode`
  (maintainer `init` requires the target beneath the monorepo root; the archive root satisfies that).
  Output lands at `<archive>/.llm/tmp/evalapp/evalapp` (150-file app + 28 copied local packages).
- `agent init --host all --editor vscode --with-docs` on a local-source scaffold fails on **both**
  head and base with `No installed @netscript/* package evidence was found in deno.json`; the
  disposable `"@netscript/cli": "workspace:"` import recorded in the author's `drift.md` was added to
  the fixture `deno.json`, then the real command was rerun. Pre-existing resolver behaviour, not a
  regression; controlled against base.
- No Aspire, Docker, browser, `e2e:cli`, or release gate was run.

## Re-derived gate table

| Gate | Command (archive) | Result |
| --- | --- | --- |
| Assets barrel reproduces committed bytes | `head-a`: `deno task gen:assets-barrel` then `cmp` of `embedded.generated.ts`, `skills.generated.ts`, `agent-tools.generated.ts`, `agent-docs.generated.ts` (cli) and `packages/plugin/.../embedded.generated.ts` against an untouched head archive | exit 0; **all 5 IDENTICAL** — the shipped barrel is current, not template-only |
| Focused installer suite | `head-a`: `run-deno-test.ts -- --allow-all packages/cli/src/public/features/agent/init/init-agent_test.ts` | exit 0; **22 passed, 0 failed** (incl. one named test per issue) |
| Scoped structured check | `head-a`: `run-deno-check.ts --root packages/cli/src/public/features/agent/init --root packages/cli/src/kernel/assets --ext ts` | exit 0; 15 files, 0 occurrences |
| Raw `deno check --unstable-kv` on the 4 changed `.ts` files | `head-a` | exit 0 |
| Scoped lint (agent path) | `run-deno-lint.ts --root packages/cli/src/public/features/agent --ext ts,tsx` | exit 2 `all-excluded` on **head and base** (18 selected / 0 processed both) — exclusion config, known pre-existing |
| Scoped lint (`packages/cli`) | `run-deno-lint.ts --root packages/cli --ext ts,tsx` | exit 2 `processed-count-unavailable` (`Package 'zod' not found in catalog` from `e2e/fixtures/desktop-native/deno.json`) on **head and base** — environment, identical on both |
| Scoped fmt (`packages/cli`) | `run-deno-fmt.ts --root packages/cli --ext ts,tsx` | head: 884 selected / 170 processed / **0 findings**, exit 2 `partial-exclusion`; base: identical 884 / 0 findings / exit 2 |
| Changed-line whitespace | `git diff --check 8b1e42f72 HEAD -- packages/` | clean |
| `quality:gate` (`quality:scan && arch:check`) | `head-b`: `deno task quality:gate` | exit 0; scan `ok:true`, 0 findings, 7 pre-existing allowances; `deps:check` + `deps:check:zod` PASS; doctrine FAIL=0 (pre-existing WARNs only) |
| Fresh scaffold `agent init --host all --editor vscode --with-docs` | `head-c` | exit 0: `Installed NetScript agent integration for claude, vscode.` + offline docs (181 prose files) |
| Idempotent re-run | same command again in the head scaffold | exit 0; sha256 of `.agents`, `.claude`, `AGENTS.md`, `.mcp.json`, `.vscode` tree **unchanged** |
| Non-Claude host run | copy of scaffold with `.agents/.claude/.mcp.json/AGENTS.md` removed, `agent init --host vscode --editor vscode` | exit 0; `.agents/skills/` (6 files) present, **`.claude` absent**, `AGENTS.md` 3,197 bytes with 0 `.claude` references, no-docs cue rendered (`Need offline framework or API guidance? Run netscript agent init --with-docs.`) |
| Base control scaffold | `base`: same scaffold + `agent init --host all --editor vscode --with-docs` | reproduces the issue evidence exactly: `AGENTS.md` **1,655 bytes**, diagnostics-only, `.agents/` **absent**, skills only in `.claude/skills/` |

## Per-issue conformance

### #1674 (p0) — root `AGENTS.md` teaches the build, links the app guide

Generated head `AGENTS.md` (3,214 bytes with docs; 3,197 without), section "Build in the framework's order":

| Acceptance | Evidence | Status |
| --- | --- | --- |
| Names the contract → service → SDK → page spine | `database-derived schemas → contract → service → typed SDK and query factories → definePage composition → islands` present verbatim; base: 0 | met |
| Links `apps/<app>/AGENTS.md` and states what it is for | `The app build guide at apps/<app>/AGENTS.md explains … read it before app work instead of inventing a parallel pattern.`; the target exists in the scaffold at `apps/evalapp-web/AGENTS.md` (2,072 bytes); base: 0 | met — see ADVISORY-1 on the accuracy of the description |
| Names the `ui:add` route/island verbs | `ui:add page <path> --island`, `ui:add island <Name> --query`, `ui:add data-table` | met |
| No duplication; root stays a pointer surface | Section is 2 paragraphs; no MCP/offline-doc content copied (the MCP/docs paragraph is the pre-existing pointer) | met |
| Behavioural a4 | `[post-merge]` by supervisor decision | not re-opened |

Separately evidenced by test `#1674 root guidance points to the build spine and app guide` (vscode host, so it proves the cue is host-neutral).

### #1672 — generated guidance teaches the Deno toolchain

Section "Inspect Deno before implementing":

| Acceptance | Evidence | Status |
| --- | --- | --- |
| References `deno.com/agents.md` and the inspection verbs | `<https://deno.com/agents.md>` + the one-line setup prompt; `deno doc <module>`, `deno doc --filter <symbol> <module>`, `deno info`, `deno eval`; base: 0 of `deno doc`/`deno eval`/`agents.md` | met |
| Names `deno doc` as the way to learn a package's public API | `Use deno doc <module> … to learn a package's public API … These come before reading package source over HTTP.` | met |
| Test task must run before a build is complete | `A run is not finished until deno task test has run.` | met |
| Links, does not duplicate, the toolchain skill | Deno section is 838 bytes; the shipped `.agents/skills/deno/SKILL.md` is 18,254 bytes; **0 lines >40 chars of `AGENTS.md` appear verbatim in the skill**; the section ends `For the deeper command map, invoke .agents/skills/deno/SKILL.md; this file only points to it.` The repo-internal `netscript-deno-toolchain` skill is not part of the consumer bundle (`skills/manifest.json`: netscript, netscript-operate, netscript-build, aspire, deno) so the consumer-facing link target is the shipped `deno` skill — consistent with the issue's "does not change the netscript-deno-toolchain skill" boundary | met |
| Dependency verbs | `deno outdated`, `deno why`, `deno add` instead of hand-editing imports | met |
| Behavioural a4 | `[post-merge]` | not re-opened |

Separately evidenced by test `#1672 root guidance teaches Deno inspection before implementation`.

### #1675 — canonical `.agents/skills/`, derived `.claude/skills/`

| Acceptance | Evidence | Status |
| --- | --- | --- |
| Fresh scaffold contains `.agents/skills/` with the canonical set | `--host all`: `.agents/skills/{aspire,deno,netscript,netscript-build,netscript-operate}/SKILL.md` + `help.md` (6 files = `skills/manifest.json` minus `manifest.json`); base: absent | met |
| `.claude/skills/` generated from it, not authored independently | Code direction (`init-agent.ts`): canonical write loop runs for every host **before** any host block; the Claude block does `dependencies.fs.readText(canonicalPath)` and throws `Canonical skill was not installed` if missing — the mirror is read back from the canonical file, not from the embedded bundle. Scaffold: all 6 mirrors `cmp` IDENTICAL to canonical. Test `#1675 installs canonical skills and derives Claude mirrors` asserts the same. `playwright-cli` under `.claude/skills/` only is the pre-existing Aspire `agent init` delegation (Claude-only, unchanged, outside this leaf) | met |
| A non-Claude host can discover the skills | vscode-only run: `.agents/skills/` present, `.claude` absent, `AGENTS.md` links every skill by its `.agents/skills/<name>/SKILL.md` path and has 0 `.claude` references | met — see ADVISORY-2 for a residual pointer inside two shipped skill bodies |
| Root `AGENTS.md` says when to reach for each skill | Six bullets, each `Use <path> to/for/before …` with a distinct trigger (route unfamiliar task / before scaffolding-generating / health-failures-docs-perf / AppHost lifecycle-telemetry / Deno runtime-types-deps / hang-vanish-silent → `help.md`). Base: one sentence listing names only | met |
| Behavioural a5 | `[post-merge]` | not re-opened |

## Judgement on the five specific questions

1. **Separable?** Yes. Three template sections map one-to-one (`Build in the framework's order` → #1674, `Inspect Deno before implementing` → #1672, `Invoke the right installed skill` + installer reorder → #1675), and `init-agent_test.ts` carries one named test per issue with disjoint assertions. A reviewer can attribute every hunk.
2. **Generator changes, not only a template?** Yes. `agentsSection()` now reads `EMBEDDED_TEMPLATE_CONTENT[TEMPLATE_KEYS.agentGuidance]`; `gen:assets-barrel` reproduces the committed barrel byte-for-byte; the fresh scaffold emits the new content; base control emits the old 1,655-byte content.
3. **Canonical → mirror direction.** Verified in code (mirror reads canonical bytes back, hard error if absent), in tests, and in the scaffold (`cmp` identical). Non-Claude discovery verified with a real vscode-only run.
4. **Pointer, not tutorial.** Deno section 838 bytes vs 18 KB skill, 0 verbatim lines; skill links rather than copies.
5. **Root content.** Spine named, app guide linked with a stated purpose, `ui:add` verbs named, per-skill triggers stated.

## Findings

### ADVISORY-1 — root guidance overstates what `apps/<app>/AGENTS.md` explains (within ceiling)

- Generated root: `The app build guide at apps/<app>/AGENTS.md explains the local examples, defineRouteContract, withResource, staleTime, dehydration, optimistic UI, and withForm`.
- Generated target `apps/evalapp-web/AGENTS.md` (2,072 bytes, unchanged by this leaf): `grep -c` → `defineRouteContract` **0**, `staleTime` **0**, `dehydrat` **0**, `optimistic` **0**; `withResource` 1, `definePage` 1, `withForm` 1, `ui:add` 3.
- Effect: the guaranteed-read file promises four topics the linked file does not cover; an agent following the pointer for `defineRouteContract`/`staleTime`/dehydration finds nothing there. #1674's acceptance boxes are still met (spine, link + purpose, verbs), so this is not blocking, but it is a factual defect in a pointer surface whose whole purpose is accurate routing.
- Fix is inside the five-path ceiling: adjust one sentence in `guidance.md.template` (e.g. attribute the missing topics to the offline docs / MCP `find_guidance`, or drop them), regenerate the barrel, update the `#1674` test string. Recommend before merge; Tier-A disposition.

### ADVISORY-2 — two shipped skill bodies still point at `.claude/skills/help.md` (outside ceiling)

- `skills/netscript/SKILL.md:43` and `skills/netscript-operate/SKILL.md:50` (repo source of the embedded bundle) say `.claude/skills/help.md`; they are copied verbatim into `.agents/skills/…` in the scaffold. In the vscode-only scaffold that path does not exist (`.claude` absent) while `.agents/skills/help.md` does.
- The root guidance itself is correct (`.agents/skills/help.md`, 0 `.claude` refs), and the relative `[help.md](../help.md)` link in the same files resolves from either tree, so discovery is not broken — but the prose contradicts the canonical-tree convention this leaf establishes.
- `skills/` is not one of the five permitted product paths, so this is correctly **not** fixed here. File a follow-up (`area:cli`, `type:fix`) to rewrite the two references host-neutrally and regenerate `skills.generated.ts`.

### Notes (not findings)

- `run-deno-lint.ts` at both scopes and `run-deno-fmt.ts` at `packages/cli` refuse/partial identically on head and base; the author's `BASELINE_BLOCKED` formatter disposition matches what I observe and remains a Tier-A call, not an evaluator block.
- The `--with-docs` local-source evidence requirement is pre-existing (base identical) and recorded in `drift.md`.
- Old guidance content dropped by the rewrite (`.llm/tools/README.md`, `run-deno-check.ts` pointers, 15-minute receipt window wording) is consistent with "pointer surface, keep it short"; no acceptance box depends on it.

## Verdict

**PASS_IMPL** at `9abc76d48cb7bf63ee25b413fb72160362bc2e8c`. All three acceptance sets are individually implemented, individually tested, and reproduced from a fresh scaffold against a base control; the shipped barrel is current; canonical→mirror direction is proven; no sixth product path. Two advisories recorded for Tier-A: ADVISORY-1 is a one-sentence accuracy fix inside the ceiling that I recommend taking before merge; ADVISORY-2 is a follow-up issue.

Evaluator: Claude Fable 5, separate session from author and topic supervisor; no product, test, docs, tooling, label, checkbox, lease, or PR state touched; temp archives under the job tmp dir only.
