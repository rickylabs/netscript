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
