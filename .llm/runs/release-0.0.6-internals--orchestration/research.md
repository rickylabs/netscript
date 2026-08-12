# Research: 0.0.6 internals quality rail

Written to close `plan-eval.md` finding 5 (`plan-protocol.md:11-22` and `plan-gate.md:16-34` require a
current `research.md`; the first PLAN-EVAL cycle had none). Every number is a command result at
`01aa12b67`/`63cd1cd58`, re-executed by this session. Where a figure disagrees with an issue body, the
issue is stale and the divergence is stated.

## Question the rail has to answer

`quality:gate` and `arch:check` are the repo's two self-assessment gates. Three issues say, in different
words, that both are **uninformative rather than wrong**: they run, report faithfully, and cannot
distinguish a pass from a did-not-run. The rail's job is to make each gate's scope and severity legible,
without turning a false green into a false red.

## The four gates, as they actually behave

| Task | `deno.json` | Behaviour at HEAD | Exit |
| --- | --- | --- | --- |
| `quality:scan` | `:50` | `DEFAULT_ROOTS = ['packages/cli/src', 'plugins']` (`scan-code-quality.ts:18`). 0 findings, `allowCount: 7`. | 0 |
| `quality:scan:repo` | `:51` | `--root packages --root plugins`. **5 findings**, `allowCount: 10`. | **1** |
| `arch:check` | `:156` | `deps:check` + **16** hand-listed `check-doctrine.ts --root` invocations in one ~2 kB shell string. `packages/plugin-streams-core` is the only `plugin-*-core` absent. | 0 |
| `arch:check:repo` | `:157` | bare `check-doctrine.ts`, **no `--root`**, so `:110-113` treats the repository root as one package. `FAIL=55`, `WARN=341`. | **1** |

### `quality:scan`'s five rules are line-regex, and two of its blind spots are structural

`scan-code-quality.ts` reports `explicit-any-ignore`, `unsafe-cast`, `explicit-any`,
`plugin-name-check`, `ts-error-suppression`.

- **`explicit-any` cannot see an export.** `:51` is `/(?:<|:\s*)any(?:\s*[,>;)\]}]|\b)/` against a raw
  line. There is no notion of `export`, so an `any` in a published type and an `any` in a local
  helper are the same finding at the same severity.
- **An export-aware rule exists elsewhere and is warn-only.** `check-doctrine.ts:467-484` emits
  `A1/F-5: 'any' in exported declaration` at **WARN**, matching only `export function` / `export type` /
  `export interface` line starts — not `export const`, class members, generic defaults, or re-exports —
  and only under `arch:check`'s 16 roots.
- **`isScannable` (`:86-89`) exempts `_test`/`.test`/`.spec` and `.generated.ts`, and nothing else.**
  `*_type.ts` negative fixtures are therefore scanned as production source. This is the whole of #1530
  (below).
- **Allowances are unbudgeted and unlinked.** `:136` accepts `// quality-allow: <any non-empty text>`.
  `--max-allow` exists at `:173-181` and is passed by **no** task and **no** workflow.
- **Markdown is never opened** (`:87` matches only `/\.[cm]?[jt]sx?$/`), and `:47` additionally skips any
  line beginning with a quote or backtick.

### `quality:scan:repo` is red on `main`, and the PR gate structurally could not have caught it

Five `ts-error-suppression` findings, all `@ts-expect-error` lines in
`packages/sdk/tests/type-fixtures/sdk-client-contributions-rfc_type.ts` — where the directive **is** the
fixture's assertion. Introduced by `b3dc006e8` (RFC 0001 acceptance). The blocking `code-quality-repo`
job has failed on **7 consecutive pushes to `main`**; last green `0fbe3dadd`.

`code-quality.yml:28` skips draft PRs and `:36-42` scans only files the PR changed, while the repo-wide
job (`:50-59`) runs on push-to-main and a Monday cron. So the only path that ever scanned this file runs
**after** merge. Filed as **#1530**.

Fixture surface: **12** `*_type.ts` files, all under a `tests/type-fixtures/` directory, in 3 packages
(`sdk`, `fresh`, `plugin-streams-core`); **3** contain `@ts-expect-error`. Two of them already carry
per-line `// quality-allow:` suppressions whose reasons both say, in prose, "negative compile fixture" —
a rule stated twice in comments and zero times in code.

### `arch:check:repo`'s 55 failures decompose into three origins, not two

#1380 D8 says 53 failures = 52 A14 false positives + 1 A1. Measured now: **55** = 54 A14 + 1 A1. The A14
population grows with every new BDD test, which is the argument for fixing the predicate rather than
enumerating residue.

`check-doctrine.ts:403-413` matches a bare `describe(` / `it(` / `expect(` identifier anywhere in a
`*_test.ts` file. It cannot tell where the identifier came from, and there are **three** origins:

| Origin | Count | Sanctioned? | Example |
| --- | --- | --- | --- |
| imported from `@std/testing/bdd` | **53** | yes — the Deno BDD API | `packages/database/tests/migrate-retry_test.ts:10` |
| **locally bound** in the test file | **1** | yes — an ordinary local helper | `packages/mcp/tests/service-endpoint-sources_test.ts:248` — `const describe = (workDir: string) => …`; the file imports nothing named `describe` (verified: imports at `:1-6` are `@std/assert` and four local modules) |
| genuinely unresolved global | **0 today** | **no — this is the real Jest/Vitest signal** | none at this baseline |

This is a correction to both #1380 and to the rail's own first-cycle plan, which treated all 54 as
`@std/testing/bdd` imports. It matters because the fix must **still fire** on origin 3 while going quiet
on 1 and 2 — so origin 2 is a live negative control, and a predicate that only collects imports would
re-flag it.

The single `A1: mod.ts missing` is structural: with no `--root`, the checker evaluates the repository
root as a package and walks `.llm/tmp/`, `docs/site/`, and `.llm/tools/`.

## The doctrine verdict table is not stale — for most rows it was never a measurement of this tree

Live units: **30** `packages/*` + **6** `plugins/*` = **36**. The table at
`10-codebase-verdict-and-handoff.md:22-51` parses to **28** rows: **6** name non-live units, and **14**
live units have no row (the whole auth family and the entire `plugin-*-core` tier).

Probed over the **full** history (`git log --all --diff-filter=A`), not just `main`:

| Removed row | Ever added? | Correct record |
| --- | --- | --- |
| `@netscript/streams`, `@netscript/triggers`, `@netscript/workers`, `@netscript/sagas` | **no** | never present under that name |
| `plugins/hello-world` | **no** | never present under that name |
| `@netscript/shared` | **yes**, `0ef13de35 chore: genesis eject` | genuinely removed; PR-C cites the removing commit |

#1380 hypothesises the four packages were "plausibly renamed into the `plugin-*-core` tier". The history
does not support that, and asserting it would fabricate provenance. #1380's box 2 was **amended with
owner authorization** to admit "never present in this repository under that name" **and** to require
per-row git evidence — strictly harder than the original label-only wording. Audit trail:
issue #1380 comment `5264580324`.

## The RFC divergence has already closed — the plan's first cycle got this wrong

#1380 D9/D10 states "Zero numbered RFCs have ever landed" and `ls rfcs/` → template + README only
(measured 2026-08-08). **False at `01aa12b67`:**

```text
$ ls rfcs/
0000-template.md  0001-sdk-client-contributions.md  0002-runtime-versioned-automation.md
0003-command-composition-kit.md  0004-deterministic-first-hybrid-mcp-doc-retrieval.md
0005-devtools-contribution.md  README.md
```

The accepting merges (`b3dc006e8`, `f3eb957ec`, `625be20a3`, `ef266832a`, `03680f6e8`) are all ancestors
of `01aa12b67` — they are in this run's own opening `git log` read. Each file declares
`status: Accepted`, and `rfcs/0005-devtools-contribution.md:10-18` names `rfcs/README.md` as canonical.

The rail's first-cycle plan inherited the stale claim without re-measuring and was failed on it
(`plan-eval.md` finding 2). Recorded as `drift.md` D-11 rather than quietly corrected, because the
lesson is the point: the plan's stated value was that it re-measured everything, and it did not
re-measure the one claim it had copied from a document it was in the business of correcting.

Consequence for #1380 box 10: the deliverable is no longer "choose a location". The repo has chosen.
Record `rfcs/NNNN-*.md` as canonical, classify `.llm/runs/*/design/canonical/` bundles as
provenance/draft artifacts, and map the five `DECISION_PENDING` entries onto the canonical process
without filing them.

## `deno doc --json` is fast enough, and its exit code is not a completeness proof

Measured by the evaluator and adopted as the rail's basis: `packages/sdk` (12 entrypoints) 0.17 s,
`packages/fresh` (15) 0.74 s, and a loop over all 30 package export maps **3.733 s** with zero non-zero
exits. Suitable for a PR gate.

But that loop emitted **567** `Warning Failed resolving types` while returning **exit 0** (156 for
`packages/ai`; 81 each for `database`, `kv`, `plugin-sagas-core`, `queue`; 87 for `fresh`). So an
export-awareness rule built on `deno doc --json` must decide what an unresolved declaration means. Exit
0 is not evidence that every published declaration was read — which is the same defect class the rail
exists to remove, one level up.

## Cross-lane collision: one fenced-TS extractor, not two

#1378 needs fenced-TypeScript extraction from `docs/site/**`. The **docs lane** is already building it
in draft PR **#1537** (#1374): a checked-in `.md`/`.vto` backtick/tilde extractor with an explicit
`ts`/`tsx` grammar, line/ordinal provenance, and tests under `.llm/tools/docs`.

Two extractors would disagree about what counts as a snippet, and each gate would pass on the corpus it
happened to parse. Owner-confirmed resolution: **#1374 owns the extractor; #1378's PR-D consumes it and
sequences after #1537 lands.** Coordination posted at PR #1537 comment `5264583905`, including the one
API request (stable per-snippet provenance) and the explicit fallback if the docs lane keeps it private.

## Workflow fact the rail must not re-learn

Neither `ci.yml:41` nor `e2e-cli.yml` lists `labeled` in `pull_request.types`, so applying
`status:ready-merge` creates **no run** — while `netscript-pr` and `check-close-gate.ts`'s own repair
hint both say it does. Cost one verification cycle on PR #1527. Owner decision: **correct the two
documents, not the workflow.** Folded into a rail PR as a docs-only change.

## What is deliberately not researched

- The six open verdict-Refactor/Restructure package refactors (#1380 Boundaries).
- #1278 Inventory B, #1276 T1–T5, #1245, #1249, #1093, #1280, #1320.
- `packages/fresh-ui` quality extension — blocked on #1379's lock policy.
- Anything about canary or stable publication; root 0.0.6 orchestration owns it.
