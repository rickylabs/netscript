# Worklog — docs-1377-content--leaf (PR-C of #1377)

## Design

Four decisions were made before authoring; each is recorded with the measurement that settled it.

### D-1 — The reference pages are hand-written; the index's generator claim was false

The brief required resolving this before authoring. Searched the repository for anything that
*writes* into `docs/site/reference/`:

```text
grep -rn "docs/site/reference" --include=*.ts --include=*.js --include=*.json --include=*.mjs .
```

Every hit is a **reader**, not a writer:

- `.llm/tools/docs/check-exports-drift.ts` — checks 8 hardcoded pages against declared entrypoints.
- `.llm/tools/docs/check-accuracy-and-discoverability.ts:29,:126` — reads `reference/sdk/index.md`
  and `reference/sagas/index.md`.
- `.llm/tools/release/publish-readiness.ts:302` — asserts a page path exists.
- `packages/mcp/tests/registry_test.ts:86,:121` — reads `reference/mcp/index.md`.
- `.llm/runs/beta5-impl--supervisor/slices/479-ai-docs/workflow.js:136-138` — a **past authoring
  run** that hand-wrote `reference/ai/`, `reference/plugin-ai/`, and `reference/plugin-ai-core/`.
  This is positive evidence of the hand-written route, not a generator.

The only `deno doc` consumers in tooling are `.llm/tools/run-deno-doc-lint.ts` (a `deno doc --lint`
runner) and `.llm/tools/release/surface-diff.ts` (`deno doc --json` surface snapshots). Neither emits
Markdown.

**Verdict: no generator exists.** `docs/site/reference/index.md:6-7` claimed the pages "are generated
from the source code with `deno doc`, so they always describe the published surface". Both halves
were false — nothing generates them, and therefore nothing guarantees they stay current. Correcting
that sentence was in scope per the brief; adding four hand-written pages beneath an unretracted
generation claim was not an option.

### D-2 — Page depth and structure modelled on the existing `-core` pages

`reference/plugin-auth-core/index.md` (88 lines, grouped symbol tables) and
`reference/plugin-ai-core/index.md` (266 lines, entrypoint table plus per-surface tables) are the two
existing pages for this archetype. The four new pages use both patterns: an **Entrypoints** table
with a measured export count per subpath, then grouped root-surface symbol tables, then the
behavioural notes that a symbol table alone cannot carry (ack-then-process ordering, replay-commit
semantics, typestate gating, synchronous-handler discipline).

Every symbol row is derived from `deno doc --json` output for the package's **declared** exports —
not from source reads. Root-surface tables are exhaustive against that output; each page's grouped
tables sum to the count `deno doc` reports:

| Package | Root exports | Rows on page |
| --- | --- | --- |
| `@netscript/plugin-sagas-core` | 41 | 41 |
| `@netscript/plugin-streams-core` | 51 | 51 |
| `@netscript/plugin-triggers-core` | 106 | 106 |
| `@netscript/plugin-workers-core` | 32 | 32 |

Subpath entrypoints are described by their module doc plus their measured export names, so no page
names a symbol the package does not export.

### D-3 — Path convention is described, not legislated

Measured over the whole workspace: 35 effective-publish members, 31 pages at the name-exact segment
(`@netscript/<x>` → `/reference/<x>/`), 4 exceptions where the **deployable** plugins drop the
`plugin-` prefix (`@netscript/plugin-sagas` → `/reference/sagas/`, and the same for streams,
triggers, workers). Their `-core` counterparts are name-exact, which is what makes the IA internally
inconsistent rather than uniformly divergent.

The index now records exactly that, and states explicitly that it is a description of today's site,
not a rule to follow when the two forms disagree — reconciling them is PR-D's decision.

### D-4 — `deno fmt` does not govern the files this slice touches

The brief's formatting gate is `deno fmt <touched files>`. Running it returns
`error: No target files found` (exit 1) for all five Markdown files, because:

- `docs/site/deno.json` `fmt.exclude` lists `**/*.md`, `**/*.mdx`, `**/*.vto`;
- the root `deno.json` `fmt.include` is `packages/**/*.{ts,tsx}` and `plugins/**/*.{ts,tsx}` only.

The real formatting gate for `docs/site` Markdown is `docs/site/_plugins/check-source-format.ts`
(`deno task check:source-format` in that directory), which this run uses in its place. The
`deno fmt` rewrap hazard the brief warns about therefore cannot apply to `docs/site/**/*.md`; it
still cannot apply to the READMEs either, for the same include-list reason. Every scripted edit was
still re-read and grepped after the fact.

## Gate baselines (before any edit, at `cd24e1679`)

| Gate | Exit | Result |
| --- | --- | --- |
| `deno task docs:links` | 0 | `docs=102 broken-links=0 broken-anchors=0 orphans=0` |
| `deno task docs:accuracy` | 0 | `PASS (… 192 published source pages …)` |

Reference-page count before: **35 effective-publish members, 4 missing pages**
(`plugin-{sagas,streams,triggers,workers}-core`).

## Slice 1 — four reference pages + reference index

Files:

- `docs/site/reference/plugin-sagas-core/index.md` (new)
- `docs/site/reference/plugin-streams-core/index.md` (new)
- `docs/site/reference/plugin-triggers-core/index.md` (new)
- `docs/site/reference/plugin-workers-core/index.md` (new)
- `docs/site/reference/index.md` (generator claim corrected; path convention recorded)

| Gate | Command | Exit | Result |
| --- | --- | --- | --- |
| Internal doc links | `deno task docs:links` | 0 | `docs=102 broken-links=0 broken-anchors=0 orphans=0` |
| Docs accuracy | `deno task docs:accuracy` | 0 | `PASS (… 196 published source pages …)` — up 4, one per new page |
| Docs source format | `docs/site/_plugins/check-source-format.ts .` | 0 | `Docs source format: OK` |
| `deno fmt` (touched files) | `deno fmt <5 files>` | 1 | `No target files found` — see D-4; not applicable to these paths |
| Reference-page existence | own count | — | before 31/35, after **35/35**; 0 missing |
