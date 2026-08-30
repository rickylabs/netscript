# IMPL-EVAL — PR #1783 (`docs/aspire-public-surface`)

## Verdict

**PASS**

## Evaluated Head

- PR #1783, base `main`, evaluated at exact head `b1a930364cefa02a035d91592c1870e1fdc93c1e`
- Merge-base with `origin/main`: `2a65a8cd0f3872c2b95b00fe0a9edae10531921b`
- Commits: `018a5bb53` (prose + run artifacts) → `b1a930364` (four derived assets only)
- Worktree `/home/agent/projects/netscript/worktrees/007-leaf-1782`; tree clean before and after all
  gate runs (`git status --porcelain` empty)

## Evaluator Identity

- Requested route: Claude · Anthropic · Fable 5 · medium (`formal_impl_evaluation`, native
  opposite-family for Codex-authored work)
- Observed: model id `claude-fable-5` ("Fable 5") per session identity. Effort is not
  introspectable from inside the session; requested effort was medium and no contrary signal was
  observed.
- Generator: Codex · OpenAI · `gpt-5.6-sol` · medium, thread
  `01a053cd-0c37-7290-9f5c-a09d53e53a93`. Generator ≠ evaluator holds: this is a separate Claude
  session that produced none of the evaluated commits.
- Read-only pass: no tracked edits, no commits/pushes, no PR/issue/label mutation. This file is the
  single new untracked artifact.

## Check 1 — Is "published exclusively through `@netscript/aspire/public`" true?

**TRUE — verified by exhaustive computation, not inherited.**

- `packages/aspire/deno.json` export map read directly: `.`, `./config`, `./schema`, `./types`,
  `./constants`, `./application`, `./adapters`, `./testing`, `./public`. **No `./domain`, no
  `./ports`** — `src/domain/mod.ts` and `src/ports/mod.ts` do export the four symbols but are
  internal barrels, unreachable as JSR entrypoints (JSR serves only declared exports; the
  `publish.include: **/*.ts` glob includes the files but does not make them importable paths).
- Symbol sets of all nine published entrypoints enumerated via `deno doc --json` and intersected
  programmatically. The set `public − (union of all other published entrypoints)` is **exactly**
  `{AspireError, AspireRuntime, DuplicateContributionError, ReferenceSpec}` — the page's exclusive
  list is complete and minimal: no exclusive symbol missing, no listed symbol reachable elsewhere.
- No `export *` exists anywhere in the package (grep over all entrypoint-transitive files).
- `DuplicateContributionError` is *used* internally by `src/runtime/contribution-registry.ts` but
  not re-exported by `src/runtime/mod.ts` (exports only `AspireNSPluginContribution`,
  `ContributionRegistry`, `HealthCheckSpec`), so it does not leak through `/application` or
  `/testing`.
- The only other repo reference to the four symbols outside `packages/aspire` is a scaffold
  template string in `packages/cli/src/public/features/plugins/new/new-plugin-use-case.ts:527`
  that itself imports `from '@netscript/aspire/public'` — consistent with the claim.

## Check 2 — Is the rewritten aggregate paragraph true?

**TRUE in the asserted direction; one completeness nuance recorded as an advisory.**

- Every export in `src/public/mod.ts` (99 symbols) traces to a category the paragraph names:
  config (schemas, `parseAppSettings`, `ParseOptions`/`ParseResult`), schema
  (`generateAppSettingsJsonSchema`), constants, types, application composition (including
  `ContributionRegistry`, which `/application` also publishes), adapters, diagnostics
  (`inspectAspire`, `InspectionReport`), testing (including `AspireNSPluginContribution`, which
  `/testing` also publishes), plus the "domain errors and contracts plus the runtime lifecycle
  port" clause (errors, ten domain contract types, `ReferenceSpec`, `AspireBuilder`,
  `AspireRuntime`). **Nothing in the file is undocumented or unlisted.**
- "that have no separate published sub-path" is true: there is no `/domain` or `/ports` sub-path.
  The ten domain types and `AspireBuilder` that are *also* reachable via `/application`,
  `/adapters`, `/testing` are correctly excluded from the exclusive table.
- "reserving the root `@netscript/aspire` entrypoint exclusively for diagnostics" (retained
  wording) is true: root `mod.ts` exports only `inspectAspire`, `InspectableAspireBuilder`,
  `InspectableAspireResource`, `InspectionReport` — all diagnostics.
- **Advisory (non-blocking):** "combines the package's public … surfaces" is not a set-equality:
  `/public` omits 12 `/config` symbols (`AspireSchema`, `AspireSafeParseSuccess/Failure/Result`,
  `BaseEntry`, `ReferenceEntry`, `HostPortEntry`, `DefaultsConfig`, `DefaultsSchema`,
  `LoggingConfig`, `SagaResourceConfig`, `SagaStoreBackend`), 3 `/types` symbols (`HostPortEntry`,
  `SagaResourceConfig`, `SagaStoreBackend`), and 2 root diagnostics types
  (`InspectableAspireBuilder`, `InspectableAspireResource`). The rewrite deliberately dropped the
  false "re-exports **all** … symbols" quantifier, and the page is adopted at
  `mode: 'entrypoints-only'` ("curating their primary APIs rather than every exported contract"),
  so this is imprecision, not a false statement. It becomes chargeable the day `aspire` is
  re-adopted at `mode: 'complete'` — the issue's own named follow-up. Candidate for the #1777
  ledger.

## Check 3 — Are the four descriptions accurate?

**YES — all four verified against source.**

- `AspireError` (`src/domain/errors.ts`): `class AspireError extends Error`, doc comment "Base
  error for Aspire package failures" — table row matches, signature exact.
- `DuplicateContributionError` (`src/domain/errors.ts`): `extends AspireError`; thrown by
  `ContributionRegistry.register()` exactly when `#items` already has `contribution.pluginName`
  (`src/runtime/contribution-registry.ts:15-17`) — "second contribution for the same plugin name"
  is precisely the condition.
- `AspireRuntime` (`src/ports/aspire-runtime-port.ts`): interface with `start(): Promise<void>`,
  `stop(reason?: string): Promise<void>`, `status(): 'idle' | 'running' | 'stopped'` — "Lifecycle
  port (`start`, `stop`, and `status`) implemented by adapters" is exact; kind "interface" and
  "—" signature correct.
- `ReferenceSpec` (`src/domain/reference-spec.ts`): `from` (source), `to` (target),
  `waitFor?: boolean` ("Whether the source should wait for the referenced resource") — "source,
  target, and whether startup waits for the target" matches.

## Check 4 — Modal-verb sweep

- "published **exclusively** through `@netscript/aspire/public`" — proven true (Check 1).
- "**no separate** published sub-path" — true (export map).
- "**exclusively** for diagnostics" (root entrypoint) — true (root exports audited).
- Sub-path table row "Production aggregate plus domain contracts and the runtime lifecycle port
  not published through separate sub-paths" — true; no completeness quantifier.
- "combines … surfaces" — the one residual overstatement risk; advisory above, not a false
  unconditional claim of the class this lane shipped before.

## Scope and Boundary Results

- `git diff --name-only 2a65a8cd0...HEAD` = **exactly 12 files**: 1 prose page
  (`docs/site/reference/aspire/index.md`), 4 derived assets (`.llm/assets/agent-docs/prose.json.gz`,
  `.llm/assets/agent-docs/provenance.json`,
  `packages/cli/src/kernel/assets/agent-docs.generated.ts`,
  `packages/mcp/src/publish-assets.generated.ts`), 7 run artifacts under
  `.llm/runs/docs-aspire-public-surface--1782/`.
- **Zero `packages/aspire` changes** (no path under it in the diff).
- **`AUTHORITATIVE_MAPPING` untouched**: `.llm/tools/docs/check-exports-drift.ts` has no diff; the
  two diff mentions of the identifier are prose in run artifacts stating the boundary.
- `deno.lock` unchanged (`git diff --exit-code 2a65a8cd0...HEAD -- deno.lock` = 0).
- Umbrella protection: **no closing keyword targets #1777 anywhere** — PR body uses `Part of
  #1777`; a keyword grep over both commit messages returns nothing (`grep` exit 1). Only
  `Closes #1782` closes.

## Regeneration Honesty

- `provenance.json` `sourceCommit` = `018a5bb53` = `git rev-parse --short=9 HEAD^` — the prose
  commit immediately preceding the asset commit. Matches in both `provenance.json` and
  `packages/mcp/src/publish-assets.generated.ts` (was `e4f47289b`).
- `b1a930364` touches **only** the four assets (`git show --stat`).
- Recomputed `sha256` of the decompressed corpus =
  `e2bf18a86714f4c245876336be93fe104eaa05eec6a86ff4ae0fb5e1eab0d044`, uncompressed 4,801,167 bytes
  — byte-for-byte equal to the values committed in `provenance.json` and
  `agent-docs.generated.ts`.
- The corpus carries the new prose: `zcat prose.json.gz | grep -c "published exclusively through"`
  = 1.

## Independent Gate Results (this session, at head `b1a930364`, real exit codes)

| Gate | Exit | Note |
| --- | ---: | --- |
| `deno task docs:exports-drift` | 0 | PASS; `Coverage [aspire]: mode=entrypoints-only` retained |
| `deno task docs:links` | 0 | PASS |
| `deno task docs:accuracy` | 0 | PASS (199 published source pages, 181 shipped corpus files) |
| `deno task docs:snippets` | 0 | PASS |
| `deno task --cwd docs/site check:source-format` | 0 | PASS |
| `deno task --cwd docs/site check:links` | 0 | PASS; 35,344 internal links across 227 pages |
| `deno task --cwd docs/site check:caveats` | 0 | PASS; 18 caveat markers |
| `deno task check:agent-docs-prose` | 0 | PASS; `"fresh":true`, provenance echoed exactly |
| `deno task check:assets-barrel` | 0 | PASS |
| `deno task check:publish-assets` | 0 | PASS |
| `deno task check:mcp-export-corpus` | 0 | PASS |
| `deno check --unstable-kv <2 generated consumers>` | 0 | PASS |
| `deno task docs:readme:check` | 1 | BASELINE RED — see below |
| `git diff --exit-code 2a65a8cd0...HEAD -- deno.lock` | 0 | lock unchanged |
| `git status --porcelain` after all runs | empty | no drifted generated asset |

`docs:readme:check` exit 1: sole finding is `packages/bench/README.md` missing `## Install`
(1/36 non-conformant). That file has **zero diff** in this PR, so the failure exists identically on
the merge-base — **I agree it is a pre-existing baseline and not chargeable to this PR.** (Verified
via diff emptiness rather than a detached clean checkout; the evidence is equivalent.)

`diagrams:check` N/A claim verified structurally: the diff touches no `_diagrams` source, asset, or
generator.

No Aspire/Docker started; all verification static, per the runtime-lease constraint.

## Process Checks

- PLAN-EVAL: `N/A` recorded with justification before implementation (bounded mechanical docs
  correction, no design decision) — acceptable per protocol rule 2.
- Design checkpoint present in `worklog.md` (public surface, domain vocabulary, ports, commit
  slices) — rule 3 satisfied.
- Worklog defers final gate evidence to the PR Validation table with a recorded rationale (amending
  S1 post-generation would invalidate `provenance.json`'s `sourceCommit`) — reasonable; minor
  template deviation noted, not a finding.
- Labels: `type:docs`, `area:docs`, `area:aspire`, `priority:p2`, exactly one status
  (`status:impl`), `ci:skip-e2e` + `ci:skip-scaffold` (docs-only lane, correctly intentional);
  milestone `0.0.7`. PR is ready (not draft).

## PR Body Truthfulness (close-gate)

All six Definition-of-Done boxes verified true:

1. `/public` description true of `src/public/mod.ts` — verified (Checks 1–2).
2. Four symbols documented with accurate source and entrypoint — verified (Check 3); the body's
   symbol table (source files, `/public` only) matches source exactly.
3. No `packages/aspire` source change; `AUTHORITATIVE_MAPPING` untouched — verified.
4. Derived chain regenerated; `provenance.json` names the S1 prose commit — verified
   byte-for-byte.
5. Every requested gate has a real exit code; `deno.lock` unchanged — independently reproduced
   above; all Validation-table rows reproduce.
6. Closing/reference linkage, evidence block, labels, milestone — verified.

`acceptance-evidence` block: `box-index` semantics checked against
`.llm/tools/validation/acceptance-evidence.ts` — indexes count only gate-relevant-heading boxes, so
1–5 map exactly to the five `## Acceptance` boxes of #1782 (the `## Scope` checklist is not
close-gated). SHAs in every evidence entry match the evaluated head. No mapping defect.

**Required PR-body edits: none.**

## Issue #1782 Acceptance Boxes — earned status (nothing ticked by this session)

| Box | Earned | Evidence |
| --- | --- | --- |
| 1. `/public` description true of `src/public/mod.ts` on main | YES | Checks 1–2 (deno.json + full symbol-set computation) |
| 2. All four symbols appear in the page | YES | four-row table in `docs/site/reference/aspire/index.md` diff |
| 3. `git grep -c 'AspireError'` on the page > 0 | YES | table rows for `AspireError`/`DuplicateContributionError` |
| 4. No `packages/aspire` source file modified | YES | 12-file diff contains no `packages/aspire` path |
| 5. `docs:exports-drift`, `check:agent-docs-prose`, `check:assets-barrel`, `check:publish-assets` green at pushed head, verified independently of the implementer | YES | this IMPL-EVAL re-ran all four at `b1a930364` in a separate session; all exit 0 |

The four `## Scope` boxes are also all satisfied by the same evidence but are not close-gated.

## Augment Thread

The resolved thread on `docs/site/reference/aspire/index.md` claimed the four derived assets were
missing and `provenance.json` still named `e4f47289b`. **The resolution was correct**: the comment
was accurate against `018a5bb53` and stale against head — `b1a930364` contains exactly those four
assets, provenance now names `018a5bb53`, and the shipped corpus carries the corrected prose
(verified from the gzip itself). No asset is missing.

## Blocking Findings

None.

## Advisories

1. **Aggregate completeness wording** — "combines the package's public … surfaces" reads stronger
   than reality: `/public` omits 12 `/config`, 3 `/types`, and 2 root-diagnostics symbols
   (enumerated in Check 2). Not false under `entrypoints-only` adoption, but record it as a #1777
   ledger candidate; it must be reconciled before any `mode: 'complete'` re-adoption of `aspire`.
2. **`docs:readme:check` baseline** — `packages/bench/README.md` missing `## Install` remains the
   sole red; belongs to whichever slice owns bench README conformance, not this PR.
3. **Worklog gate-results deferral** — the "gate evidence lives in the PR table" pattern is
   justified here by the provenance constraint; if reused, the worklog should keep naming the PR
   table explicitly as this one does, so evaluators do not read the absence as missing evidence.
