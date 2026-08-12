# Drift — docs-1377-content--leaf (PR-C of #1377)

Append-only. Everything found and **not** fixed in this slice, with why.

## DR-1 — `reference/index.md` claimed pages are generated; nothing generates them

**Severity:** significant. **Status:** fixed in this PR (in scope per the brief).

`docs/site/reference/index.md:6-7` asserted the reference pages "are generated from the source code
with `deno doc`, so they always describe the published surface". No script writes into
`docs/site/reference/`; every tooling reference to that path reads or checks. Evidence in
`worklog.md` § D-1. Corrected.

## DR-2 — The same false generation claim survives inside two existing pages

**Severity:** minor. **Status:** NOT fixed — out of this slice's footprint.

- `docs/site/reference/plugin-ai-core/index.md:10-11` — "This page is generated from the package's
  public surface with `deno doc` (US-2)."
- `docs/site/reference/plugin-auth-core/index.md:9-10` — "This page is generated from the package's
  public surface with `deno doc`."

Both are the per-page form of DR-1 and are equally untrue. The four pages added here deliberately say
"written against the package's published exports and its `deno doc` surface" instead. Left alone
because editing pages this slice does not otherwise touch widens the diff into files a sibling slice
or PR-D may reach; a one-line correction each is enough whenever someone owns them.

## DR-3 — `docs:accuracy` hardcodes a short reference path, and #1377 does not name it

**Severity:** significant for PR-D. **Status:** NOT fixed — PR-D owns the decision.

`.llm/tools/docs/check-accuracy-and-discoverability.ts:126` reads
`'docs/site/reference/sagas/index.md'` and `:29` reads `'docs/site/reference/sdk/index.md'`. #1377
names only `.llm/tools/release/publish-readiness.ts` as the gate hardcoding a path. If the
path-convention decision moves the IA to the gate's name-exact rule, this file breaks too, along with
`publish-readiness.ts:302` and every inbound link. Carried forward from the orchestrator's research
(C-3) and re-confirmed by reading the file in this worktree.

## DR-4 — `deno fmt` does not cover `docs/site/**/*.md` or any `README.md`

**Severity:** minor, process-relevant. **Status:** NOT a defect to fix here.

`docs/site/deno.json` `fmt.exclude` contains `**/*.md`; the root `deno.json` `fmt.include` is
`packages/**` and `plugins/**` TypeScript only. So `deno fmt <markdown file>` exits 1 with
`No target files found`, and the documented "format the touched Markdown" gate cannot be satisfied by
`deno fmt`. `docs/site/_plugins/check-source-format.ts` is the actual formatting authority for
`docs/site`; **no** formatter governs `README.md` files at all. Worth deciding deliberately rather
than discovering again — flagged for the orchestrator, not changed here (config is not this slice's
scope).

## DR-5 — Maintainer CLI reports `version('1.0.0')`

**Severity:** significant. **Status:** NOT fixed — source, not docs.

`.../maintainer-command-tree.ts:32` sets `.version('1.0.0')` while the public tree uses
`CLI_PACKAGE_VERSION`. Carried in from the orchestrator's research (item 9). The brief explicitly
routes this here rather than to a fix: it is framework source, and this run authors documentation
only. Needs a WSL Codex slice.
