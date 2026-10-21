# IMPL-EVAL brief — PR rickylabs/netscript#2408 (`orch/divybot-752`)

You are the **independent implementation evaluator**: a separate session from a different vendor family
than the generator (Claude Opus 5.5). Do not implement or edit product files. Your only write is
`.llm/runs/orch-divybot-752--fresh-ui-design-guide/evaluate.md`.

## What to evaluate

The upstream issue is rickylabs/netscript#2406. This PR covers **items 2 and 3**: the theme chain and the
app-wide theme recipe, the MCP corpus, and the app `AGENTS.md`. It also covers the owner goal from
harness#752: "agents should be able to produce stunning design on NetScript easily with built-in helpers,
a documented guide, and good primitives".

Items 1 and 4 belong to sibling PR #2407 by agreement and are **out of scope here**: chrome on every page,
`ui:add page` nav, `navigation.ts`, and the `netscript-build` skill. Do not fail this PR for them. The
neutral wording about which routes get chrome is intentional. Whichever PR merges second adds the
`navigation.ts` / `--nav` specifics.

- Baseline: `a833dfa` (`main`, 0.0.8 cut). Head: the branch tip you check out (`git log -1`).
- Diff: `git diff a833dfa..HEAD`. Generated `*.generated.ts` carriers and `registry/theme/*` are generated
  output. Verify their freshness with the check tasks, not by reading them.

## Read first

1. `.llm/harness/evaluator/protocol.md`, `.llm/harness/evaluator/verdict-definitions.md`,
   `.llm/harness/workflow/run-loop.md` §5 (Concept of Done), `.llm/harness/archetypes/ARCHETYPE-4-dsl-builder.md`,
   `.llm/harness/archetypes/SCOPE-frontend.md`, `.llm/harness/archetypes/SCOPE-docs.md`.
2. Run dir: `supervisor.md`, `plan.md` (design checkpoint), `worklog.md` (slices + gate tables), `drift.md`,
   `context-pack.md`, `browser-probe.json`, `caveats.md`.

## The change, by slice

| Slice | Commit | What |
| --- | --- | --- |
| S1 | `0d28fe8` | fresh-ui DTCG sources: `*-subtle`/`*-border` → `color-mix(in oklab, var(--ns-<intent>) N%, transparent)`; hovers → `color-mix(… 86%, black)`; accent/accent-fg/ring follow primary. Generated `tokens.css` header maps the theme chain. Test `packages/fresh-ui/tests/registry/theme-tokens.test.ts`. |
| S2 | `dec6450` | New `docs/site/web-layer/how-to/design-with-fresh-ui.md`; `customize-fresh-ui.md` theme chain / app-wide recipe / "no per-page theme"; xref, catalog, card; regenerated prose carriers. |
| S3 | `0dcf39a` | MCP: both pages embedded (budget 288 → 328 KiB, rationale at constant); `guidance-concepts.ts` adds `app-theming`, `page-design`, `app-chrome`; `## App chrome and navigation` section; test `packages/mcp/tests/theming-guidance_test.ts`. |
| S4a | `54166ef` | MCP `ReleaseEmbeddedDocsCorpus.get`: unprefixed docs-site slug falls back to `pages/<slug>` (`redirectedFrom`). |
| S4b | `bd0e54d` | CLI `agent-conventions.ts`: `## Design and theming` in generated `AGENTS.md`, `## Look and feel` in `WEB-LAYER.md`; declared references; tests. |

## Gates to re-run yourself

```bash
cd packages/fresh-ui && deno task check && deno task lint && deno task test && cd ../..
cd packages/mcp && deno task check && deno task test && cd ../..
deno test --no-lock -A .llm/tools/generate-publish-assets_test.ts
cd packages/cli && deno test --allow-all --unstable-kv src/kernel/templates/app/agent-conventions_test.ts \
  src/public/features/root/public-command-tree_test.ts && deno task check && cd ../..
deno task check:assets-barrel && deno task check:publish-assets && deno task check:agent-docs-prose
deno task docs:links && deno task docs:accuracy && deno task docs:snippets
deno task --cwd docs/site build && deno task --cwd docs/site check:links
deno task arch:check
# Token generator reproducibility. The frozen-lock form is broken on main (see drift.md), so:
cd packages/fresh-ui && deno run --no-lock --allow-read=. --allow-write=registry/theme --allow-env \
  --allow-net=registry.npmjs.org scripts/build-tokens.ts && git diff --exit-code registry/theme && cd ../..
```

`packages/cli` is excluded from root fmt/lint. Check its changed files with a temporary config holding only
the root `fmt`/`lint` options (no include/exclude). Do not commit `deno.lock` churn; restore it if a run
touches it.

## Questions to answer explicitly

1. **Primitive.** Is the token derivation correct per theme, including CSS custom-property inheritance (both
   blocks sit on `<html>`)? Does the default NS One theme keep its look? Does a `:root`-only edit of
   `--ns-primary` / `--ns-primary-fg` rebrand both themes? Is it safe that no component CSS changed?
2. **Truth.** Is every factual claim in `design-with-fresh-ui.md` and the changed parts of
   `customize-fresh-ui.md` true against the code: component names and props, layout classes and widths, the
   theme chain, the "these do not exist" list, the `--theme` flag, the preset contrast claims, the
   0.0.8 upgrade note?
3. **Reachability.** Do the embedded MCP corpus, `find_guidance`, `search_docs`, and `get_doc` (bare
   slug, standalone corpus) now reach the guides? Could the new concepts or aliases hijack unrelated
   intents? For example: Scalar `theme:`, `withLayout`, route layouts.
4. **Generated guidance.** Is the `AGENTS.md` / `WEB-LAYER.md` text accurate, concise, and safe under the
   backtick-path rule in `public-command-tree_test.ts`?
5. **Concept of Done per slice.** Check reachability, constants vs literals, one-line doc comments, and the
   one-file contributor path. Is the budget raise justified?
6. Is anything recorded as unproven blocking, in your judgment? `scaffold.runtime` cannot run here: no
   Docker daemon.

## Output

Write `evaluate.md` with:
- the route identity (model, provider, and variant as you observe them);
- the evaluated head SHA;
- the gate table with your own results;
- findings (severity, file:line, why, fix);
- one verdict line: `VERDICT: PASS | FAIL_FIX | FAIL_RESCOPE | FAIL_DEBT`.

Then print the same verdict line as your final message.
