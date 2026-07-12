# Worklog — beta.10 non-dashboard stream

## Slice 1 — P0(a): `run-deno-lint.ts` swallowed batch failures (PR #715 `quality` job)

**Status:** implemented, gates green locally. Awaiting IMPL-EVAL (separate session).

### Reproduction

`deno task lint` at PR #715 head (`5b1a9877`) reproduced CI run `29202385340` / job `86675839110`
byte-for-byte:

```json
{"source":{"mode":"command","exitCode":1},"selection":{"filesSelected":1685,"batches":9},
 "summary":{"totalOccurrences":0,...},"groups":[]}
```

Exit 1, nine batches, zero occurrences, **no diagnostics**.

### Bug 1 — the wrapper (tooling)

`runLint()` concatenated each batch's stdout+stderr into a single `text` blob that was only ever fed
to `parseOccurrences()`. A batch that exits non-zero *without* emitting a parseable lint occurrence
— i.e. a **crash**, not a finding — had its exit code propagated while its stderr was discarded by
the parser. Result: exit 1 with an empty `groups[]` and nothing in the log.

Fix (`.llm/tools/run-deno-lint.ts`):

- Modelled the crash class as `BatchFailure` (`batchIndex`, `exitCode`, `fileCount`, `files`,
  `stderr`, `stdout`).
- `runLint()` classifies each non-zero batch: parseable occurrence ⇒ ordinary lint finding; zero
  parseable occurrences ⇒ `BatchFailure`.
- `BatchFailure[]` is surfaced on the JSON report (`failures`) **and** rendered to stderr via
  `formatFailures()`.
- Added the never-silent invariant: non-zero exit + empty `groups[]` + no captured failure now
  prints an explicit "re-run with `--batch-size 1`" diagnostic rather than exiting silently.
- Made `runLint` injectable (`BatchRunner`) and guarded `main()` behind `import.meta.main` so the
  behaviour is testable without shelling out.

Cross-check: `run-deno-check.ts` (`failedBatches`) and `run-deno-fmt.ts`
(`failedWithoutParsedFindings`) already model failed batches. `run-deno-lint.ts` was the only
sibling missing it — this fix aligns it with them rather than inventing a new shape.

### Bug 2 — the real failure the wrapper was hiding

With the wrapper fixed, the underlying error surfaced immediately:

```text
--- batch 2 — exit 1 — 200 file(s)
stderr:
error: Failed to parse "workspace" configuration.
Caused by:
    invalid type: string "packages/*", expected struct WorkspaceConfig
```

Source: `packages/mcp/tests/fixtures/doctor/broken/deno.json` — `{ "workspace": "packages/*" }`, an
**intentionally malformed** fixture for the MCP doctor's broken-project test. The lint selection was
picking up `packages/mcp/tests/fixtures/doctor/broken/netscript.config.ts`; `deno lint` walks up
from each file to discover a config, finds the deliberately-broken `deno.json`, and aborts before it
ever lints anything.

Fix: the doctor fixtures are synthetic **projects** (each carries its own `deno.json`), not library
source, and were never meaningful lint targets. Excluded `packages/mcp/tests/fixtures/` from the
root `lint` task selection and from `lint.exclude` in `deno.json`.

Blast radius was checked before choosing the exclusion: a blanket `tests/fixtures` exclusion would
have silently dropped real lint coverage on `packages/ai`, `packages/cli`, and `packages/fresh`
fixture code, so the exclusion is scoped to the one fixture tree that is a nested Deno project.

### Regression test

`.llm/tools/run-deno-lint_test.ts` — 4 cases, all pinning the distinction the bug turned on:

1. a batch failing with **no** occurrences is captured, and `formatFailures()` renders exit code,
   file set, and stderr;
2. a batch failing **with** occurrences is a lint finding, not a `BatchFailure`;
3. the `No target files found.` empty-batch exit is still tolerated;
4. every failing batch is reported, not just the first.

### Gates

| Gate | Command | Verdict |
| --- | --- | --- |
| Regression test | `deno test --allow-all .llm/tools/run-deno-lint_test.ts` | **PASS** — 4 passed, 0 failed |
| Lint (the failing CI job) | `deno task lint` | **PASS** — exit 0, 1682 files, 9 batches |

File count moved 1685 → 1682: exactly the three `.ts` files under the excluded doctor fixture tree.

**Self-certification:** none. These are generator-session results only; the verdict is IMPL-EVAL's.

---

## Slice 2 — P0(b): README rewrite (`packages/cli`, `packages/mcp`)

**Status:** implemented, gates green locally. Awaiting IMPL-EVAL (separate session).
**Commit:** `394f9223`

### House style, established from the exemplars first

Read `packages/telemetry`, `packages/service`, and `packages/ai` before writing. The repo has two
README shapes: the **majority/emoji** style (telemetry, service, aspire, fresh, cli, plugin-\*-core)
and a plain-heading style used only by `packages/ai`. Since `cli` and `mcp` ship together as the
agentic combo and `cli` was already emoji-styled, both targets follow the majority style. No new
shape invented.

### `packages/cli/README.md`

Was deploy-skewed to the point of misrepresenting the package: **~110 of 198 lines** were deployment
targets, the Quick Start led with the `createPublicCli` *embedding* API rather than the command
surface, and there was **no command map at all** — a reader could not learn what verbs exist.

Rewritten around what the CLI is: scaffold a workspace, then grow it with verbs that regenerate the
derived layers (Aspire helpers, plugin registries, contract aggregates). Added a command map for
every top-level group — **generated from the live `netscript --help` tree, not from memory** — kept
the embedding API as a real but secondary capability, and compressed deployment into one target table
plus the permissions matrix.

### `packages/mcp/README.md`

Was a 128-line API stub for a brand-new published package. Rewritten to the depth of the strongest
siblings: why the package exists, the mental model, the 13-tool catalog, recipes, configuration
seams, command policy, data boundary, observability, and layering.

An uncommitted ~313-line draft existed in the stale orchestrator worktree (see drift D1). It was
treated as **input to review, not landed work** — and reviewing it caught two factual errors that
would otherwise have shipped:

| Draft claim | Reality |
| --- | --- |
| Layered `domain → ports → application → adapters` with `ports/` and `adapters/` folders | Actual layout is `src/domain/`, `src/application/`, `src/infrastructure/` — no such folders exist |
| `truncation` is an `McpCliOptions` composition seam | `truncation` is a `createMcpServer` (`McpServerOptions`) seam; `McpCliOptions` has no such field |

Every other claim was re-verified against source rather than carried over: the 13 tool names from
`TOOL_NAMES`; the 50-item / 2,000-UTF-16-code-unit bounds from `DEFAULT_TRUNCATION_POLICY`; the
allow/deny lists from `DEFAULT_COMMAND_POLICY`; protocol version `2025-11-25` from
`MCP_PROTOCOL_VERSION`.

### `docs/site/reference/mcp/index.md` (new)

`@netscript/mcp` is a new published package and was the **only one without a reference page** — every
sibling has `docs/site/reference/<pkg>/index.md`. The README's reference link would have shipped as a
404. Added the page in the established shape. Reference pages are hand-authored (no generator), so
this is not generated output.

### Gates

| Gate | Command | Verdict |
| --- | --- | --- |
| Format | `deno fmt --check` (3 files) | **PASS** |
| Internal doc links | `deno task docs:links` | **PASS** — 96 docs, 0 broken links/anchors |
| Public-docs wording | grep for issue/PR numbers, harness/evaluator/slice/orchestrator terms | **PASS** — clean |

### Finding (not fixed here) — `docs:readme:check` is a dead gate

`deno task docs:readme:check` is **not wired into any CI workflow** and currently **fails for nearly
every README in the repo**: it enforces the `docs/site/_includes/readme-template.md` shape (`##
Install` / `## Quick example` / `## Docs` as literal H2 text), which the shipped house style diverged
from long ago (emoji H2s, `### Installation` nested under `## 🚀 Quick Start`). Conforming `cli` and
`mcp` to the checker would have made them the only two packages that look nothing like their
siblings.

Chose consistency with the shipped house style, per the brief ("match the existing best-in-class
READMEs; do not invent a new shape"). The checker/template/house-style three-way divergence should be
reconciled repo-wide as its own item — it is CI-gate hygiene and pairs naturally with #762. Raised to
the orchestrator rather than fixed inside #715.

---

# COLD-START STATE (for the owner, morning pickup)

Written at the end of the beta.10 non-dashboard stream session. **Nothing was merged, published,
released, or closed.** Per orchestrator stop-line.

## PR #715 — `feat/netscript-mcp-skills` — MERGE-READY, awaiting IMPL-EVAL + owner

**All CI checks green** (check-test, quality, scaffold-static, scaffold-runtime, close-gate,
surface-diff, code-quality, deps-report). Already carries `Closes #725 … Closes #733`.

Commits added by this stream (on top of `5b1a9877`):

| Commit | What |
| --- | --- |
| `907423d0` | lint wrapper: surface crashed batches + regression test; exclude the malformed mcp doctor fixture |
| `394f9223` | `packages/cli` + `packages/mcp` README rewrite; new `docs/site/reference/mcp/index.md` |
| `25a986e7` | worklog evidence |
| `97eed9b1` | JSR preview descriptions fit the 250-**byte** cap; false Node/Bun compat claim corrected |
| `9a2be44d` | fmt wrapper: same silent-failure fix + regression test; same fixture exclusion |

**IMPL-EVAL dispatched** to OpenHands (Qwen 3.7, opposite family) — verdict not yet returned.
**Owner action needed:** merge decision after IMPL-EVAL. Nothing self-certified.

### The headline finding

The `quality` job had **two** silent-failure bugs, not one. Fixing the lint wrapper moved the failure
to the Format check step, exposing the identical bug in `run-deno-fmt.ts`. Both wrappers exited 1
while swallowing the real error. The error both were hiding was the same:
`packages/mcp/tests/fixtures/doctor/broken/deno.json` (an intentionally malformed
`{"workspace":"packages/*"}` fixture) makes `deno lint` **and** `deno fmt` abort during config
discovery. Both wrappers are now silent-failure-proof and regression-tested.

## In flight — two WSL Codex slices (launched, unattended)

| Issue | Branch / worktree | Codex thread | Route |
| --- | --- | --- | --- |
| **#763** | `fix/763-pin-plugin-cli-specifier` @ `/home/codex/repos/b10-763-pluginspec` | `019f588f-44df-7013-842c-be28f1bb1a56` | openai · gpt-5.6-luna · max (matched) |
| **#762** | `quality/762-ts-ignore-sweep` @ `/home/codex/repos/b10-762-tssweep` | `019f5891-881b-77d1-b348-9556bb76e4fa` | openai · gpt-5.6-sol · medium (matched) |

Both worktrees are **upstream-free** by design; push is explicit-refspec only. Briefs are in
`slices/<id>/implement.md`. Neither is reviewed yet — **read the actual diffs, not just their
verdicts** (a sibling stream had a slice pass every gate while writing NUL bytes into a `.ts` file).

Steering (same thread only — never a second `send-message-v2` at the same worktree):

```bash
codex exec resume 019f588f-44df-7013-842c-be28f1bb1a56 -- "<follow-up>"
codex exec resume 019f5891-881b-77d1-b348-9556bb76e4fa -- "<follow-up>"
```

### #763 — root cause corrected (the filed hypothesis was wrong)

The issue guessed "barrel re-emit / JSR module resolution". **Actual cause:** the E2E gate
(`packages/cli/e2e/src/application/gates/scaffold/plugin-install-gates.ts:114`) hardcodes
`jsr:@netscript/plugin-ai/cli` with **no version**. Deno resolves that to `*`, and **semver `*` does
not match pre-releases**. Every `@netscript/plugin-ai` version is a `0.0.1-beta.x` pre-release, so
JSR reports `latest: null` and resolution fails outright. Deterministic, not a race; published-mode
only because the local import map short-circuits JSR.

**Nothing was skipped from the beta.9 publish** — `plugin-ai@0.0.1-beta.9` *is* in `meta.json`. The
specifier simply cannot select it.

**Wider than the test:** `resolvePluginCliSpecifier()`
(`packages/cli/src/public/features/plugins/dispatch/dispatch-plugin-verb.ts:69`) emits the same
unpinned spec, so **real users** dispatching any plugin verb against a published pre-release plugin
hit the identical wall. The slice fixes both. Root cause posted to #763; issue relabelled
`status:in-progress`.

## Deferred

**#695** (tutorial checkpoint validation) → milestone `Backlog / Triage`, with rationale comment. Not
started; nothing stranded.

## Open items needing an owner decision

1. **Merge #715** after the IMPL-EVAL verdict lands.
2. **`docs:readme:check` is a dead gate.** It is wired into **no CI workflow** and currently fails for
   nearly every README: it enforces the `docs/site/_includes/readme-template.md` shape (`## Install` /
   `## Quick example` / `## Docs` as literal H2 text), which the shipped house style abandoned long
   ago (emoji H2s, `### Installation` nested under `## 🚀 Quick Start`). `packages/ai` follows the
   template; everything else follows the house style. Three-way divergence between checker, template,
   and reality. Not fixed here (out of #715's scope) — needs a repo-wide decision on which shape wins.
   Pairs naturally with #762 as CI-gate hygiene.
3. **JSR descriptions of already-published packages are truncated mid-sentence** (`@netscript/telemetry`,
   `@netscript/service`, and others) because their README taglines exceed the 250-byte cap. Fixed for
   `cli` and `mcp`; the rest would need a tagline pass + a `jsr-settings` re-run. Cosmetic but public.

---

## Session end — slice status at handoff

### Slice review performed (Tier-A duty, per the NUL-byte warning)

**#762** — reviewed the 3 landed commits directly, not the verdict:

- No binary/NUL corruption: `git diff --numstat` shows no binary files; no `\x00` in any changed file.
- **22 suppressions removed, 0 new suppressions introduced** — grepped every `+` line for
  `quality-allow` / `deno-lint-ignore` / `@ts-ignore` / `as never` / `as unknown as` / `: any`:
  **empty**. No laundering.
- Spot-checked `packages/fresh/src/application/query/hooks.ts`: it imported the real upstream types
  (`Context` from `@tanstack/react-db`, `IslandLiveQueryData`) and **deleted** the `as never` casts so
  the calls type-check naturally. That is the brief's bar — typed, not annotated away.

Verdict so far: on track. Still running; final review pending its completion.

### Live slice state

| Slice | Branch | Commits | State |
| --- | --- | --- | --- |
| **#762** | `quality/762-ts-ignore-sweep` | 3 (+6 dirty) | Working — fresh, sagas-core, streams-core done |
| **JSR taglines** | `docs/jsr-tagline-byte-cap` | 1 seed (+16 dirty) | Working — editing the 16 over-cap READMEs |
| **#763** | `fix/763-pin-plugin-cli-specifier` | 0 | **Thread alive but no writes yet** — gpt-5.6-luna at `max` effort; last reasoning event 01:08. Watch it; if it stays silent, relaunch with `send-message-v2` (do **not** `codex exec resume` a dead thread) and release the sender lease first if it reports `duplicate_sender_risk`. |

None of the three has pushed. **None is reviewed-and-signed-off. Nothing may merge.**

### New this session

- **#767 filed** (`Backlog / Triage`) — `docs:readme:check` is a dead gate; checker ⇄ template ⇄
  house-style three-way divergence; resolution recorded as "house style wins". Not started.
- **`deno task docs:tagline:check`** — new gate (`.llm/tools/validation/check-jsr-tagline-length.ts`)
  that extracts the tagline exactly as the release tool does and measures it in **bytes**. Currently
  `checked=35 over=16`. It is committed on the `docs/jsr-tagline-byte-cap` branch, not on #715.

### JSR registry — untouched, deliberately

`jsr-set-package-settings.ts` / `jsr-provision-packages.ts` were **not run**, and no call that writes
to jsr.io was made. The tagline slice prepares README fixes only. **The descriptions on jsr.io will
not change when that branch merges** — the registry re-sync is a publish action and happens later
under owner supervision.
