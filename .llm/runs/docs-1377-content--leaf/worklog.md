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

### D-4 — `deno fmt` governs the READMEs but not `docs/site/**/*.md`

The brief's formatting gate is `deno fmt <touched files>`. Measured, it splits in two:

- **`docs/site/**/*.md`** — exits **1** with `error: No target files found`, because
  `docs/site/deno.json` `fmt.exclude` lists `**/*.md`, `**/*.mdx`, `**/*.vto`, and an exclude beats
  an explicit path argument. The real formatting gate here is
  `docs/site/_plugins/check-source-format.ts` (`deno task check:source-format` in that directory),
  which this run uses in its place.
- **`README.md` files** — exit **0** and are reformatted. The root `fmt.include` is
  `packages/**/*.{ts,tsx}` and `plugins/**/*.{ts,tsx}`, so a bare `deno fmt` never discovers a
  README, but an explicit path is honoured because nothing excludes it.

The S1 record of this decision claimed `deno fmt` covered neither, generalizing from the `docs/site`
observation before a README had been touched. Corrected here and in `drift.md` DR-4 during S2. The
rewrap hazard the brief warns about is therefore **real for the READMEs**: both were reformatted by
`deno fmt`, and the edited passages were re-read and grepped afterwards to confirm the edits survived
(they did).

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
| `deno fmt` (touched files) | `deno fmt <5 files>` | 1 | `No target files found` — see D-4; excluded for `docs/site` Markdown |
| Reference-page existence | own count | — | before 31/35, after **35/35**; 0 missing |

## Slice 2 — `packages/sdk/README.md` (the JSR landing page)

`jsr-package-settings.json:6` sets `readmeSource: "readme"`, so this file is the consumer-facing JSR
page.

Two measurements that shaped the edit:

1. **`createQueryFactory` is a real export**, not a wrong symbol name
   (`packages/sdk/src/query/query-factory.ts:41`). It is the single-resource form;
   `createQueryFactories` (`:192`) is the map form. The README's defect was emphasis, not naming.
2. **`createServiceQueryUtils` cannot simply be demoted out of the page.** `defineServices` builds
   its returned `queryUtils.*` from it (`packages/sdk/src/presets/define-services.ts:9,:120`), so the
   README's own Quick example already exercises both dialects. Removing the symbol would have made
   the page describe an API the package does not have.

Result: the golden path leads, and a new "Two query dialects" section frames `createServiceQueryUtils`
as the narrower helper — `queryOptions({ input })` versus `queryOptions(input)`, no server KV tier —
matching `docs/site/reference/sdk/index.md:111` rather than inventing a second framing. Call shapes
verified against source (`query-factory.ts:140-146`), not copied from the reference page.

The `docs:accuracy` single-page exception for `createServiceQueryUtils`
(`check-accuracy-and-discoverability.ts:63-74`) walks `docs/site` only, so a mention in
`packages/sdk/README.md` does not contend with it — confirmed by the gate still passing.

## Slice 3 — root `README.md`

- Removed "The scaffold reports **183 files, 44 directories**", which contradicted
  `quickstart.vto:51` ("treat the printed result—not a static number in this guide—as the
  authority"). Replaced with a statement that the scaffold prints its own totals and why they vary.
  `README.md:78-80` already described `--dry-run` as reporting the counts it would create, so the two
  statements now agree.
- The install line's `jsr:@netscript/cli@<version>` is left as a placeholder with an explicit
  substitution instruction and a pointer to the latest release / JSR page, plus the note that bare
  `jsr:@netscript/*` specifiers do not resolve on the pre-release line. Pinning it to `0.0.5` would
  have reproduced the hardcoded-count defect one release later; the site can derive its specifier
  (`_data.ts:30-33`) and a static README cannot.
- **Not changed:** `:148` "29 packages and 6 first-party plugins". Re-measured — 35 effective-publish
  members, 6 of them under `plugins/`. The claim is correct.

### Gates for slices 2 and 3

| Gate | Command | Exit | Result |
| --- | --- | --- | --- |
| Code quality | `deno task quality:gate` | 0 | pass; doctrine readiness `FAIL=0` for every package (WARN/INFO pre-existing) |
| Publish dry-run | `deno task publish:dry-run` | 0 | `Success Dry run complete` |
| Markdown format | `deno fmt README.md packages/sdk/README.md` | 0 | reformatted, `--check` clean, edits re-verified after rewrap |
| Internal doc links | `deno task docs:links` | 0 | `broken-links=0 broken-anchors=0 orphans=0` |
| Docs accuracy | `deno task docs:accuracy` | 0 | `PASS` |

**#1417 side effect did not occur.** `git status --short` immediately after `publish:dry-run` was
empty — no catalog-backed manifest rewritten, nothing to revert, `deno.lock` untouched.

## Slice 4 — CLI reference: six verbs and the deploy verb surface

### D-5 — The deploy verb counts, measured

The brief said to verify the operations array myself and not to copy #1377's wording. Doing so
produced a result that contradicts **the orchestrator's own research correction**, so it is set out
in full.

There are **two** arrays, and only their intersection reaches the CLI:

1. Each adapter advertises `operations`:

   | Target(s) | Source | Advertised |
   | --- | --- | --- |
   | `compose`, `docker` | `aspire-compose-deploy-target.ts:64-71` | plan · emit · up · down · status · logs |
   | `kubernetes`, `azure-aca`, `azure-app-service`, `azure-aks`, `cloud-run` | `aspire-cloud-deploy-target.ts:125` | plan · emit · up · down |
   | `deno-deploy` | `deno-deploy-target.ts:57-63` | plan · up · down · status · logs |
   | `windows-service`, `linux-service` | `service-deploy-target.ts:21-29` | plan · emit · up · down · status · logs (+`rollback` with an `ActivationPort`, +`secrets` with a `SecretsStorePort`) |

2. The router walks a **fixed candidate list** and skips anything the adapter does not advertise
   (`target-deploy-command.ts:15-23`, gate at `:59`):

   ```ts
   const ROUTED_OPERATIONS: readonly DeployOperation[] = [
     'plan', 'up', 'down', 'status', 'logs', 'rollback', 'secrets',
   ];
   ```

   **`emit` is not in that list.** It has an entry in `OPERATION_DESCRIPTIONS` (`:28`) and is
   implemented on the compose, cloud, and service adapters, but no public CLI path exposes it — the
   only other `'emit'` occurrence under `packages/cli/src/public/` is in a test.

So the CLI verb surface is the intersection:

| Group | CLI verbs | Count |
| --- | --- | --- |
| `deploy docker`, `deploy compose` | plan · up · down · status · logs | **5** |
| `deploy kubernetes`, `azure-aca`, `azure-app-service`, `azure-aks`, `cloud-run` | plan · up · down | **3** |

Consequences for the two claims this slice was sent to fix:

- **`cli-reference.md:246-249` — wrong, corrected.** "`deploy docker` and `deploy compose` … are not
  wired — they only print help" is false: each exposes five working verbs routed to
  `AspireComposeDeployTarget`, whose `plan`/`emit`/`up`/`down`/`status`/`logs` methods are all
  implemented (`:91`–`:152`). The bare group does print help, but so does every command group in the
  CLI, including `deploy` itself — that is the default action, not evidence of a stub.
- **`reference/cli/commands.md:209` — CORRECT; deliberately not "fixed".** "the same three-verb
  lifecycle — `plan`, `up`, `down`" describes the five cloud targets, and three is exactly what they
  expose, because their advertised `emit` is not routed. The orchestrator's research (C-2) called
  this claim contradicted and instructed fixing it; measuring shows the claim was right and the
  correction would have introduced the error. The section was rewritten for coverage — it now names
  `docker`/`compose` and their two extra verbs, and explains *why* the verb lists differ — but the
  three-verb statement for the cloud targets was preserved because it is true.
- **#1377's "five-verb surface" for docker/compose — also correct**, at the CLI level. The research's
  "it is six" counts the adapter's advertised operations, which is a different (and unreachable-by-one)
  number. Both were describing real arrays; neither said which one the user types.

### Content added

`docs/site/reference/cli/commands.md` (the exhaustive page) gains all six previously undocumented
verbs, `docs/site/cli-reference.md` (the curated page) gains the five that fit its narrative:

| Verb | Curated page | Exhaustive page |
| --- | --- | --- |
| `agent drift` (+ `drift record`) | yes | yes, with the 15-minute receipt gate |
| `plugin ai` | yes | yes, framed as a pass-through |
| `deploy list` | yes | yes, with the ten default targets |
| `deploy desktop` (+ `package`, `release`) | yes | yes |
| `deploy package-cli` | yes | yes, with all four flags and defaults |
| `config list` | — (no config section on the curated page) | yes, incl. the `(not read by the generator)` marker |

Two behaviours were read from source rather than paraphrased from a description string, because the
description alone would have been misleading:

- `agent drift record` refuses unless a diagnostic receipt for `--resource` exists, exited `0`, and
  is under `DIAGNOSTIC_RECEIPT_TTL_MS` = **15 minutes** (`record-drift-flow.ts:5,:31-42`). The same
  gate backs the MCP `record_drift` tool.
- `plugin ai` uses `.useRawArgs()`, strips only `--project-root`, and forwards everything else to the
  installed `@netscript/plugin-ai` CLI in a child `deno run` (`ai-plugin-command.ts:49-68,:92-113`).
  Its verbs therefore belong to that plugin's release, not to this reference — documenting a verb
  list here would go stale on the plugin's schedule, not NetScript's.

### Gates for slice 4

| Gate | Command | Exit | Result |
| --- | --- | --- | --- |
| Internal doc links | `deno task docs:links` | 0 | `broken-links=0 broken-anchors=0 orphans=0` |
| Docs accuracy | `deno task docs:accuracy` | 0 | `PASS` |
| Docs source format | `docs/site/_plugins/check-source-format.ts .` | 0 | `Docs source format: OK` |
| Six-verb coverage | own grep over `docs/site/` | — | all six present in `reference/cli/commands.md`; five also on `cli-reference.md` |
| Stale-claim removal | own grep | — | `not wired` / `only print help` gone from `docs/site/` |
