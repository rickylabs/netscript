# test(docs): docs:accuracy is a fixed-string needle checker — no docs/site code block is ever compiled, and a CLI change never revalidates the site — DRAFT (no GitHub mutation; owner ratification pending)

**Draft-ID:** T5-02 · **Proposed milestone:** 0.0.6 · **Labels:** `type:test` `area:docs`
`area:tooling` `priority:p1` `status:triage` · **Depends on:** T5-01 (the gate codifies the ratified
dialect)

## Summary

`deno task docs:accuracy` passes today while the front door points readers at a CSS file and teaches
two incompatible query APIs, because it only asserts that certain literal strings are present or
absent in certain files. No code block anywhere in `docs/site/**` is ever type-checked or executed,
and the Pages workflow only fires on `docs/site/**` pushes, so a change to the CLI or the SDK never
revalidates the prose that documents it. Every defect in T5-01 and T5-05 is invisible to CI by
construction. Until a snippet compiles against the published entrypoints, docs accuracy is an
unenforced convention.

## Evidence

Corpus: `research/repo-audit/docs-quickstart.md` §2.8 and §4 Tier 3; `SYNTHESIS.md` §2
(harness/evaluation row), §4 T5.

Verified in the worktree at `fac9e339042c`:

1. `.llm/tools/docs/check-accuracy-and-discoverability.ts:9-19` defines `requireText` / `forbidText`
   as `text.includes(needle)`; `:152-174` iterates a hardcoded `requiredMutationFamilies` list and
   asserts only that the string `` `netscript <family> `` appears in `cli-reference.md`. Nothing it
   asserts is derived from the CLI, the scaffold writers, or the SDK exports.
2. `.llm/tools/docs/check-exports-drift.ts:13-80` is real code-derived verification but its
   `AUTHORITATIVE_MAPPING` covers 8 packages (`fresh-ui`, `plugin`, `config`, `contracts`, `queue`,
   `sdk`, `service`, `telemetry`), and most entries set `checkSymbols: false`. The remaining
   reference pages and all guide pages are unverified. It is invoked from
   `check-accuracy-and-discoverability.ts:176-184`.
3. `.github/workflows/pages.yml:3-11` triggers on `push` to `main` with
   `paths: [docs/site/**, .github/workflows/pages.yml]`, plus `release: published` and
   `workflow_dispatch`. A `packages/**` change never rebuilds or re-link-checks the site.
4. The only precedent cited for executed doc examples,
   `packages/service/tests/_fixtures/readme-examples_test.ts`, is itself a needle checker: it calls
   `assertStringIncludes(readme, 'const service = await defineService')` and asserts the absence of
   `addHealthCheck` / `addReadinessCheck`. It never compiles the README block. So there is currently
   **no** compile-the-docs precedent in the repo at all.
5. `deno task docs:links` (`.llm/tools/validation/check-internal-doc-links.ts`) is clean and real —
   `docs=102 broken-links=0 broken-anchors=0 orphans=0` per the Stage-B audit — but it validates
   links, not code.
6. `deno.json:81-83` wires `docs:links` and `docs:accuracy` into `docs:maintenance`; no docs task
   invokes `deno check`.

## Current surface

Three docs gates, none of which can observe a wrong API: `docs:links` (link/anchor graph),
`docs:accuracy` (literal needles over `cli-reference.md` and a fixed preferred-path list, plus
`check-freshRootImports` over `docs/`), and `check-exports-drift` (8 of 32 reference pages, symbol
checking mostly disabled). Pages CI is path-gated to `docs/site/**`.

## Target contract

1. **A docs-snippet compile gate.** A checked-in tool extracts fenced `ts`/`tsx` blocks from
   `docs/site/**` and type-checks them against the **published entrypoints** (`@netscript/*` import
   specifiers, not relative source paths), so a snippet that imports a symbol the package does not
   export fails.
2. **Explicit opt-out, not opt-in.** Blocks that are deliberately non-compiling (counter-examples,
   partial fragments, shell, config) carry an inline marker (e.g. an info string
   ```` ```ts no-check:<reason> ````). The gate fails on an *unmarked* block that does not compile
   and on a marked block that has no reason. The marker census is reported so the number of exempt
   blocks is visible and can only shrink.
3. **Compilation harness, not execution.** Blocks are assembled into synthetic modules with a shared
   preamble/import map; the gate is `deno check --unstable-kv` over the generated set. No network,
   no service start.
4. **Coverage floor.** The gate starts at the T5-01 Tier-1 pages (`quickstart.vto`, `index.vto`,
   `services-sdk/sdk.md`, `services-sdk/how-to/add-a-service.md`, `web-layer/query.md`,
   `web-layer/examples.md`, `web-layer/interactive.md`, `web-layer/form.md`,
   `web-layer/query-bridge.md`) and records a written expansion plan for the rest.
5. **Trigger fix.** `pages.yml` adds `packages/**` and `plugins/**` to its `paths`, or the same
   validation runs as a `ci.yml` job on those paths, so a framework change revalidates the site.
6. **Needle checker demoted.** `docs:accuracy` keeps only the assertions that are genuinely
   string-shaped (forbidden stale claims, mutation-map columns) and hands API truth to the compile
   gate and to `check-exports-drift`.

## Acceptance

- [ ] A checked-in tool extracts fenced TS/TSX blocks from `docs/site/**` and type-checks them.
- [ ] Snippets resolve `@netscript/*` specifiers, not relative source paths.
- [ ] The gate runs in CI on changes to `docs/site/**`, `packages/**`, and `plugins/**`.
- [ ] `pages.yml` (or an equivalent CI job) revalidates the site when `packages/**` changes.
- [ ] Non-compiling blocks require an explicit marker with a stated reason.
- [ ] The gate reports the count of marked-exempt blocks on every run.
- [ ] All T5-01 Tier-1 pages compile with zero unmarked failures.
- [ ] Negative test: a fixture page importing a non-exported symbol makes the gate exit non-zero.
- [ ] Negative test: a fixture block marked exempt with no reason makes the gate exit non-zero.
- [ ] Negative test: reintroducing the `queryOptions({ input })` call shape into a dialect-A snippet
      makes the gate exit non-zero.
- [ ] `deno task docs:accuracy` no longer asserts API truth by literal needle.

## Boundaries

- **#1278** owns type-soundness ratification across the public surface and the docs, including the
  `as unknown as` / `any` inventory and its guard-rail. This issue does **not** add a cast guard;
  where a docs snippet needs a cast to compile, that is #1278's finding, and this gate must not
  silently legalise it.
- **#1108** owns verifying generated package references against live export maps; the expansion of
  `check-exports-drift` from 8 to all reference pages belongs there, not here. This gate covers
  *prose* code blocks.
- **#1210** owns per-API deep-dive pages; **#1208** owns tutorial rewrites. This issue does not
  author prose — it only makes the prose falsifiable.
- **#767** owns `docs:readme:check` being a dead gate; package READMEs are T5-05.
- **#1343** owns the installed-consumer canary smoke. This gate compiles against workspace-resolved
  `@netscript/*`; it is not a published-artifact install proof.
- Not a goal: executing snippets, starting services, or screenshotting the site.

## Docs/consumer proof

After this lands, the proof that T5-01's rewrite is real is mechanical rather than editorial: a PR
that reintroduces `lib/api-clients.ts` or dialect-B call shapes on a golden-path page fails CI. The
exempt-block census, published in the run log, is the honest measure of how much of the site is still
prose-only.

## Provenance

Seed run `plan-fable5-remediation-roadmap--seed`, PR #1347, 2026-08-08. Corpus claim that
`packages/service/tests/_fixtures/readme-examples_test.ts` executes README examples was checked and
corrected in this pass: it is a string-inclusion test, so there is no existing compile precedent.
