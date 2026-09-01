use harness

## SKILL

netscript-harness, netscript-doctrine, netscript-pr, netscript-tools

## Assignment — docs(plugins): adopt triggers, workers and plugin-auth; record the auth hub exclusion — refs #1857

Issue: https://github.com/rickylabs/netscript/issues/1857 (**final slice**)
Branch: `docs/adopt-plugin-pages-b` (created at `8e01a347a`, tracks `origin/main`)
Run dir: `.llm/runs/docs-adopt-plugin-pages-b--1857/`
`PLAN-EVAL: N/A` — adoption into an existing gate, with per-package `symbolCoverage` decided from
measured evidence.

## Why this slice matters

`main` maps **32 of 36** published reference pages. These **4 are the entire remainder**:
`auth`, `plugin-auth`, `triggers`, `workers`. When they are resolved, #1857's clause — *every
published reference page is either mapped with an explicit `symbolCoverage` or has a recorded reason
for exclusion* — is finally satisfiable, which is what lets umbrella **#1777** close. Do not expand
scope; do not leave any of the four unresolved.

## Measured evidence — probed on `8e01a347a` with the real checker, not estimated

I inserted temporary mappings, ran `deno task docs:exports-drift`, and reverted (tree verified
clean, checker exit 0 at 32 rows). **Re-derive all of this yourself; do not trust the brief.**

**There are ZERO `INVENTS` findings.** PR #1860 already removed the fabricated `/scaffolding`
sections. Everything below is an omission or a path mismatch — do not go looking for false claims.

### `triggers` — 1 finding (`plugins/triggers`, 11 exports)
```
OMITS exported entrypoint '@netscript/plugin-triggers/adapter-cli' (./cli.ts)
```

### `workers` — 4 findings (`plugins/workers`, 13 exports)
```
OMITS '@netscript/plugin-workers/adapter-cli'        (./cli.ts)
OMITS '@netscript/plugin-workers/doctor'             (./doctor.ts)
OMITS '@netscript/plugin-workers/jobs/health-check.ts' (./jobs/health-check.ts)
OMITS '@netscript/plugin-workers/runtime'            (./bin/runtime.ts)
```

### `plugin-auth` — 9 findings (`plugins/auth`, 9 exports). **Different defect class.**
Seven are *path mismatches*, not omissions:
```
mismatching path for '@netscript/plugin-auth'. Expected: './mod.ts', Doc: 'Root plugin manifest.'
...and the same for /public, /plugin, /contracts, /services, /streams, /streams/server
```
Plus two real omissions: `/scaffold` (`./scaffold.ts`) and `/adapter-cli` (`./cli.ts`).

**Cause — this is the #1803 `auth-kv-oauth` defect exactly.** The page's `## Sub-path exports` table
has only two columns (`Export | Purpose`). `parseDocContent()` (~line 543) captures each row's
**second cell** as the path, so it compares the Purpose prose against the real `deno.json` path and
every row mismatches. **The fix is to add a Path column carrying the real `deno.json` path**, then
add rows for the two missing entrypoints. Read `#1803`'s page for the shape that works.

**Two cautions on this page specifically:**
- It is a **Vento template** (`templateEngine: [vento, md]`) and contains `{{ releaseVersion }}`.
  Preserve that expression exactly; do not inline a literal version.
- The row-matching regex **cannot span an internal backtick** in a captured cell. If a Purpose cell
  needs a code span, keep it out of the first two columns.

## The `auth` page is an EXCLUSION, not an adoption — this is the settled IA decision

`docs/site/reference/auth/index.md` is a **multi-package hub**. Its `## Units` table spans **five
different packages**: `@netscript/plugin-auth`, `@netscript/plugin-auth-core`,
`@netscript/auth-kv-oauth`, `@netscript/auth-workos`, `@netscript/auth-better-auth`. It is not the
reference page for any one of them; `plugin-auth/index.md` is `@netscript/plugin-auth`'s page and
links back to this hub as "the auth package map".

Mapping the hub to `@netscript/plugin-auth` would force it to enumerate that one package's nine
entrypoints and would destroy its cross-package purpose. **Do not adopt it.** (An earlier issue note
guessed these were duplicate pages with identical findings. That guess was wrong on both counts —
verify the `## Units` table yourself and you will see why.)

**Record the exclusion durably, not as a loose comment.** Next to `AUTHORITATIVE_MAPPING` in
`.llm/tools/docs/check-exports-drift.ts`, add an exported, typed constant — for example:

```ts
export interface ExcludedReferencePage { docPath: string; reason: string; }
export const EXCLUDED_REFERENCE_PAGES: readonly ExcludedReferencePage[] = [ ... ];
```

with `docs/site/reference/auth/index.md` and a reason stating it is a multi-package hub, naming the
five packages it indexes. A greppable constant satisfies the clause in a way a comment does not.

### Also required: make the clause self-enforcing

Add a check that **every** `docs/site/reference/*/index.md` is in exactly one of
`AUTHORITATIVE_MAPPING` or `EXCLUDED_REFERENCE_PAGES`, failing with a clear message naming any page
in neither (and any page in both). Without it, #1777's acceptance is a point-in-time claim and the
next new reference page is silently unpoliced again — which is precisely how these four arose.

It must pass at 36/36 when you are done. **Put this in its own commit**, separate from the three
adoptions, so it can be reverted independently if the coordinator judges it scope creep.

## Per-package `symbolCoverage` — measure, never default

For each of the three adopted packages: run `deno doc --json` over **every** entrypoint in its
`deno.json`, union the real exported symbol names (excluding `default`), and compare against the
backtick-quoted identifiers the page documents.

- Documents every real export → `mode: 'complete'` is honest.
- Otherwise → `mode: 'entrypoints-only'`, and `reason` must name the **real** omissions, specifically
  or by accurate category when the gap is large.

Report union size, documented count, and gap per package in the PR body. **A zero gap with
`entrypoints-only` is a defect** — it understates coverage and an evaluator will fail it. Equally, a
`complete` claim with a nonzero gap is a false claim. For any entrypoint needing a new row, ground
its Purpose in what `deno doc --json` actually exports: **a plausible-but-wrong Purpose is worse than
a terse accurate one.**

## Critical — cumulative mapping

Take `check-exports-drift.ts` from **current `origin/main`** and insert only your own blocks. Do
**not** restore that file wholesale from any older commit: it silently drops rows merged meanwhile,
and **nothing catches it** — removing a row only *reduces* what is policed, so every gate still
passes. `main` has **32 rows**; you must end at **35** plus the exclusion constant. Afterwards assert
every one of the 32 pre-existing row names is still present, **by name**, and report that check.

## Explicitly out of scope

- Any `plugins/*` or `packages/*` source change. The exports are correct; the pages are wrong.
- The five packages the `auth` hub indexes — all already mapped.
- Rewriting the hub's content or changing site navigation.

## Required gates (run all, report REAL exit codes)

- `deno task docs:exports-drift` — must exit 0 with your three mappings **and** the coverage check active
- `deno task --cwd docs/site check:source-format`, `build`, `check:links`, `check:caveats`
- `deno task docs:links`, `docs:accuracy`, `docs:snippets`
- `deno task check:agent-docs-prose`, `check:assets-barrel`, `check:publish-assets`
- `deno check --unstable-kv packages/cli/src/kernel/assets/agent-docs.generated.ts packages/mcp/src/publish-assets.generated.ts`
- `deno task test` for any test touching `check-exports-drift.ts`
- `git diff --check $(git merge-base origin/main HEAD) HEAD` — **must exit 0**. The bare
  `git diff --check` is a **no-op after committing** (it compares working tree to index) and has
  produced false "clean" claims here before. Always use this base-relative form.
- `git status --porcelain` after all regenerating gates — report exact output
- `deno.lock` unchanged vs `origin/main`
- `provenance.json`'s `sourceCommit` a true ancestor: `git merge-base --is-ancestor <sha> HEAD`

`docs/site/**` is a generator input — after editing, regenerate in this exact order:
`gen:agent-docs-prose` → `gen:assets-barrel` → `gen:publish-assets`.

**Known baseline:** `check:mcp-export-corpus` is red on `main` itself (#1668). Reproduce that
independently in a clean worktree at `origin/main` and do not attribute it to this branch.

## Deliverable

Commits on `docs/adopt-plugin-pages-b`, pushed. **Keep this run's
`.llm/runs/docs-adopt-plugin-pages-b--1857/` artifacts committed** — scoped harness run directories
are intentional cross-agent context and must never be stripped.

PR against `main`, titled
`docs(plugins): adopt triggers, workers and plugin-auth references and record the auth hub exclusion`,
with:
- `Closes #1857` — this slice completes that issue
- a validation table with real exit codes at the pushed head
- per package: measured union size, documented count, gap, and the basis for the `symbolCoverage` mode
- the 32-row survival check, stated explicitly
- the mapped-or-excluded count, stated as `36/36`

Apply labels **in the `gh pr create` call itself**, including ownership:
`orchestrator:docs`, `type:docs`, `area:docs`, `area:plugins`, `ci:skip-e2e`, `ci:skip-scaffold`;
milestone `0.0.7`. Ownership labelling at open (not at finalization) is a standing coordinator
requirement — an unlabelled in-flight PR is invisible to lane audits.

Run `gh pr ready` **before** the first push — a draft push skips `check-test`/`quality`, and marking
ready afterwards does not re-trigger them.

Leave the PR at `status:impl`; the supervisor session owns evaluation and lifecycle labels.
