use harness

# Slice: documentation sequencing (#1068, #1069, #1070, #1020)

You are the **implementation agent** for PR #1079 on branch `docs/1068-task-routing` in worktree
`/home/codex/repos/ns004-docs`. A supervisor reviews every commit adversarially. Do not open, merge,
or mark the PR ready — commit and push only.

Lane: `google/gemini-3.6-flash`, preset `claude-docs-gemini-3-6-flash`, effort high. You are a
**generator** lane. Do not spawn evaluators, do not spawn subagents.

## SKILL

Load, in order, and follow them:

- `.agents/skills/netscript-harness` — run loop, commit trail.
- `.agents/skills/netscript-deno-toolchain` — `deno doc` is the authority for generated surfaces.
- `.agents/skills/netscript-pr` — commit message conventions.
- `.agents/skills/rtk` — prefix read-heavy `git` / `grep` with `rtk`.

## Non-negotiable rules

1. **Work only inside `/home/codex/repos/ns004-docs`.** Other worktrees on this machine
   (`wave4-*`, `ns004-scaffold`, `ns004-agentic`) belong to other agents. Do not read-modify them,
   do not start containers, do not kill processes.
2. **Do not touch** any generated app-scoped `AGENTS.md` or `WEB-LAYER.md` under scaffold templates
   — a different slice owns those. You own `docs/site/**`, the JSDoc in `packages/fresh` and
   `packages/fresh-ui` that generates the `deno doc` surfaces, and the streams service/doc surface
   named in slice 4.
3. **Never hardcode a model id** outside `.llm/tools/agentic/config/`. You are not editing that
   directory at all.
4. **Every code sample you write must type-check against the current API.** Verify symbol names and
   signatures with `deno doc` (e.g.
   `deno doc --unstable-kv packages/fresh/src/application/builders/mod.ts`) before you write a
   sample. Do not trust a sample copied from an issue body — the issue may be stale.
5. **No `// deno-lint-ignore` and no `as unknown as`** to make a gate green. That is a
   review-blocking finding.
6. Commit **once per slice**, in the order below, and `git push` after each commit. Use conventional
   commits: `docs(...)`, `docs(streams): ...`, etc. Reference the issue number in the body with a
   bare `#N` — **do not** write `Closes #N` in a commit message; the PR body already carries the
   closing keywords.
7. Verify the **artefact**, never the exit code. `deno task check | tail` exits 0 while type
   checking fails. Read the actual output.

## Slice 1 — #1068 · task router above the `llms.txt` catalog

`llms.txt` is **generated**, not checked in. It is produced by `buildLlmsIndex()` in
`docs/site/_plugins/ai-tooling.ts`. Edit the generator, not any output file.

Insert, **after** the "For AI agents" paragraph and **before** the first `## <section heading>`
catalog section, a section titled `## Task router` (or `## Start here` — pick one and be
consistent), containing **at most 8 rows**.

Each row must:

- open with "If you are building …" / "If you are …" — a task, not a topic;
- name a **reading order**, with explicit `1. … 2. … 3. …` steps or arrow-separated steps, not a
  bare list of links;
- end the same way every time: **manual for the model → the scaffold for the shape → the generated
  `deno doc` surface for symbols**. That ordering is the whole point of this issue.
- use absolute canonical URLs built the same way the catalog does
  (`new URL(path, origin).href`), so the router links match the rest of the file.

The frontend row matters most and must exist. A worked shape for it (adapt the wording, keep the
structure):

> **If you are building a service-backed UI:** read the Web Layer overview
> (`/web-layer/`), then Live Dashboard chapters 4–5
> (`/tutorials/live-dashboard/04-definePage-QueryIsland/`,
> `/tutorials/live-dashboard/05-live-stream/`), then **inspect the scaffold you generated** —
> its service route and `components/ui/mod.ts` — before writing a component. Use
> `deno-doc/fresh.txt` and `deno-doc/fresh-ui.txt` last, for symbol lookup. Fresh UI's visual
> components are **copied into your app**; do not hand-write a `Button`, `Card`, `Badge`,
> `Input` or `FormField`.

Other rows should cover, at most, these tasks — do not exceed 8 total: a service + contract, a
durable workflow / saga, background jobs, persistence, auth, streams, observability. Drop rows
rather than exceed 8.

**Every path the router names must resolve.** Verify:

```bash
cd /home/codex/repos/ns004-docs/docs/site && NO_COLOR=1 deno task build
```

then confirm the router is in the built output and every `/…/` path it names has a corresponding
built page:

```bash
cd /home/codex/repos/ns004-docs/docs/site && sed -n '1,80p' _site/llms.txt
```

and for each path `P` the router names, check `_site/P/index.html` (or `_site/P/index.md`) exists.
Report the checked list in your worklog. A 404 in the router is worse than no router.

The offline bundle build (`/home/codex/repos/.briefing/build-docs-bundle.sh`, **outside the repo —
read it, do not edit it**) copies `_site/llms.txt` **verbatim** into the bundle. So the router is
included in the bundle build automatically once it is in the generated `llms.txt`. Confirm that by
reading the script's `cp "$SITE/llms.txt" ... "$OUT/"` line and state that in your worklog. Do not
run the bundle script — it rebuilds shared state.

Also update `docs/site/ai/agent-tooling.md`, which describes the `llms.txt` tiers, so its
description of `/llms.txt` mentions the router tier. Keep it to a sentence or two.

Commit: `docs(llms): sequence agent reading with a task router above the catalog`.

## Slice 2 — #1069 · builders page leads with full power

File: `docs/site/web-layer/builders.md`. **Do not rewrite the page.** The change is surgical.

Currently the first sample (under `## Building a page`) is a minimal chain. Replace the **opening**
sample position with a full-envelope `definePage()` example, then immediately name the capabilities
it demonstrates, then keep the existing minimal sample after it, relabelled as the smallest useful
page.

The issue proposes this sample. **Verify every method and option against the real API before you
use it**:

```bash
cd /home/codex/repos/ns004-docs
NO_COLOR=1 deno doc --unstable-kv packages/fresh/src/application/builders/mod.ts | head -200
```

Confirm `withRoute`, `withPolicy`, `withTelemetry`, `withResource`, `withLayer`, `withForm`,
`withLayout`, `build` exist with the shapes shown, and confirm the `withLayer` option names
(`loader`, `partial`, `partialName`, `fallback`, `staleTime`) and the `withForm` option names
(`schema`, `mutate`). **If any name or shape differs from the issue's sample, use the real API and
say so explicitly in the PR comment** — the sample in the issue is a proposal, not a verified fact.
If a capability in the issue's sample does not exist on the builder at all, drop that line from the
sample and note the omission; do not invent it.

Immediately after the sample, add a short capability list naming what the reader just saw: route
typing, resource resolution, independent layers, partial / fallback / staleness, managed forms,
telemetry, layout slots. Each item one line.

Acceptance requires `withForm`, partials, fallbacks, `staleTime`, telemetry and layout slots to all
be visible **above the fold** — i.e. inside that first sample and its capability list, near the top
of the page, not scattered through the page.

Keep the minimal sample. Introduce it with a line such as "The smallest useful page is much shorter"
so a reader understands the envelope example is not a requirement.

The page must still build: `cd docs/site && NO_COLOR=1 deno task build`.

Commit: `docs(web-layer): lead the builders page with the full definePage envelope`.

## Slice 3 — #1070 · generated `deno doc` surfaces must cross-route

This is **generation, not hand-editing**. `docs/deno-doc/*.txt` files are produced by running
`deno doc` over each package export subpath. There is no such directory checked into this repo —
the bundle script generates it. So the only correct fix is to change the **JSDoc in the source**
that `deno doc` renders. A hand-written `.txt` would be destroyed on the next bundle build.

**3a. `fresh.txt` needs a module overview and cross-routes.** The root export
`packages/fresh/mod.ts` already carries a `@module` doc block. Extend it into a real overview that:

- states what `@netscript/fresh` is in one line;
- lists the subpath exports with a one-clause purpose each (the list is already there — give each
  entry a purpose), so a reader landing mid-file has a map;
- **points at `@netscript/fresh-ui`** for visual components and says those are **copied into your
  app**, not imported from the package;
- says when to read **the scaffold instead of package docs**: generated route modules and
  `components/ui/mod.ts` in your own app show the intended shape; package docs give symbols.

Because the bundle concatenates one block per export subpath and the root export is first,
this overview lands at the top of `fresh.txt`.

**3b. `fresh-ui.txt` must list actual registry collections and items.** `packages/fresh-ui/mod.ts`
and `packages/fresh-ui/registry.ts` currently document `freshUiRegistryManifest` only by its type.
Add a doc block on the exported `freshUiRegistryManifest` in `packages/fresh-ui/registry.ts` (and a
short pointer in the `@module` block of `packages/fresh-ui/mod.ts`) that:

- names the actual **collections** and their item names, read from
  `packages/fresh-ui/registry.manifest.ts` — read the file, do not guess;
- states plainly, in words close to these: *Runtime behavior ships from `/interactive`,
  `/primitives` and `DataGrid`. Visual components and blocks are **copied into your app** — inspect
  `components/ui/mod.ts` and `/design`, or run `ui:add`.*
- If the full item list is very long, list every **collection** with its items, and for items not in
  any collection give the count plus how to enumerate them (`freshUiRegistryManifest.items`). Do not
  truncate silently.

**A hand-written list drifts.** So also add a guard test under `packages/fresh-ui/tests/` that reads
the doc comment text out of `registry.ts` and asserts the collection names and item names it
mentions match `freshUiRegistryManifest.collections` exactly. The test must **fail** if a collection
is added, removed or renamed without updating the doc block. Prove it fails: temporarily rename a
collection in the manifest, run the test, capture the failure output, then revert. Include that
captured output in your worklog — a guard test nobody has seen fail is not evidence.

Verify the rendered result rather than the source:

```bash
cd /home/codex/repos/ns004-docs
NO_COLOR=1 deno doc --unstable-kv packages/fresh/mod.ts | head -60
NO_COLOR=1 deno doc --unstable-kv packages/fresh-ui/registry.ts | head -80
```

Both must actually show the new prose. If `deno doc` does not render it, the fix is wrong — change
where the comment sits, do not declare victory.

Gates for this slice (it touches `packages/**`):

```bash
cd /home/codex/repos/ns004-docs
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh-ui --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/fresh-ui --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/fresh-ui --ext ts,tsx
deno task doc:lint
```

Commit: `docs(fresh): cross-route the generated deno doc surfaces`.

## Slice 4 — #1020 · stream path prefix and the non-durable default

Three acceptance criteria, all three must land.

**4a. Document the path prefix where `streamPath` is configured.** The framework prepends
`STREAMS_URL_PREFIX = '/v1/stream/netscript'` (`packages/plugin-streams-core/src/domain/constants.ts`)
via `buildStreamUrl`. A caller using the path they configured gets a 404 and reasonably concludes
writes are dropped. Document the prefix **at every place `streamPath` is configured**:

- the JSDoc on the `streamPath` option in `packages/fresh/src/runtime/streams/create-stream-db.ts`;
- the JSDoc on `streamPath` in `packages/plugin-workers-core/src/streams/producer.ts`;
- `packages/sdk/src/streams.ts` (its example uses `streamPath`);
- the published page `docs/site/capabilities/streams.md` (grep for `streamPath`; if the page does
  not mention it, add a short "Resolved stream URLs" subsection).

Each must show the resolved URL concretely, e.g. `streamPath: '/workers/executions'` resolves to
`<base>/v1/stream/netscript/workers/executions`. Confirm the resolution against the existing test
`packages/fresh/src/runtime/streams/create-stream-db_test.ts` before you write the example.

**4b. State the in-memory default explicitly in docs.** `plugins/streams/services/src/main.ts`
reads `STREAMS_DATA_DIR`; unset selects **in-memory**, non-durable storage. Say so in
`docs/site/capabilities/streams.md`, and name the setting that makes it durable
(`STREAMS_DATA_DIR=<path>`). Keep it prominent — a callout, not a footnote.

**4c. Log it at startup.** In `plugins/streams/services/src/main.ts`, when `dataDir` is undefined,
emit a clearly-worded warning at service start that stream data is **not durable** and that setting
`STREAMS_DATA_DIR` makes it durable. Use whatever logger that service already uses — grep the file
and its neighbours; if it only uses `console`, match the surrounding style. Do not add a dependency.
Do not log anything when `dataDir` **is** set beyond, at most, one informational line.

Prove 4c actually fires. Do **not** start the whole service if that needs containers. Instead:
extract the message decision into a tiny pure exported helper (e.g.
`describeStorageDurability(dataDir: string | undefined)`) and unit-test both branches under the
streams plugin's tests, then have `main.ts` call it. Capture the passing test output.

Gates:

```bash
cd /home/codex/repos/ns004-docs
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/streams --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root plugins/streams --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root plugins/streams --ext ts,tsx
```

Commit: `docs(streams): surface the stream path prefix and the non-durable default`.

## Final gates — run all of these and paste the real output

```bash
cd /home/codex/repos/ns004-docs
deno task docs:links
deno task docs:accuracy
deno task doc:lint
deno task quality:scan
deno task arch:check
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root docs/site --ext ts
cd docs/site && NO_COLOR=1 deno task build
```

If a gate is red, **read the error text** and fix the cause. Never infer a cause from the shape of
the failure. Never silence a gate.

## Reporting

After each slice: commit, push, and write the commit hash plus the commands and their **observed
output** into `.llm/runs/release-0.0.4--orchestration/slices/docs/worklog.md` in the **orchestrator**
repo path `/home/codex/repos/ns-004/.llm/runs/release-0.0.4--orchestration/slices/docs/worklog.md`
(append; that file is outside your worktree and is the only file outside it you may write).

Your final message must state, per issue: what you changed, which acceptance criterion it satisfies,
and the exact command + output that proves it. If a criterion is not met, say so plainly — a
truthful partial is worth more than a claimed pass.
