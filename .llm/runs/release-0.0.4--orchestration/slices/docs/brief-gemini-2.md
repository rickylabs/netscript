use harness

# Slice (pass 2): corrections + slices 3–4 for PR #1079

You are the **implementation agent** for PR #1079, branch `docs/1068-task-routing`, worktree
`/home/codex/repos/ns004-docs`. A previous turn landed two commits and left slice 3 uncommitted;
that turn was reviewed adversarially and **found wrong in several concrete places**. Fix those,
finish slice 3, then do slice 4. Commit and push per slice. Do not touch the PR itself.

## SKILL

- `.agents/skills/netscript-harness` — run loop, commit trail.
- `.agents/skills/netscript-deno-toolchain` — `deno doc` is the authority for generated surfaces.
- `.agents/skills/rtk` — prefix read-heavy `git` / `grep` with `rtk`.

## Rules

- Work **only** inside `/home/codex/repos/ns004-docs`. Do not touch other worktrees, containers, or
  processes on this machine.
- No `// deno-lint-ignore` and no `as unknown as` to green a gate.
- **Verify the artefact, never the exit code.** Read the actual output.
- Commit per task below, conventional commits, `Refs #N` in the body (never `Closes`).
- Keep Markdown wrapped at **100 columns** like the rest of `docs/site`. Your last pass emitted
  300-character single-line bullets; that is a diff-hostile regression. Rewrap them.

---

## Task A — fix slice 1 (#1068): four router links point at files that do not exist

`docs/site/_plugins/ai-tooling.ts` names twelve `deno-doc/*.txt` files in the task router. The
bundle build derives each filename from the package's `deno.json` `name` field (`@netscript/X` →
`X.txt`). **Four of yours do not exist.**

Wrong → right:

- `deno-doc/sagas.txt` → `deno-doc/plugin-sagas.txt` (and `plugin-sagas-core.txt`)
- `deno-doc/workers.txt` → `deno-doc/plugin-workers.txt` (and `plugin-workers-core.txt`)
- `deno-doc/auth.txt` → `deno-doc/plugin-auth.txt` (and `plugin-auth-core.txt`)
- `deno-doc/streams.txt` → `deno-doc/plugin-streams.txt` (and `plugin-streams-core.txt`)

These eight are already correct, leave them: `service.txt`, `sdk.txt`, `database.txt`, `queue.txt`,
`telemetry.txt`, `logger.txt`, `fresh.txt`, `fresh-ui.txt`.

The complete set of valid slugs is exactly the `@netscript/*` package names under `packages/*` and
`plugins/*`. Regenerate it yourself and check every filename you emit against it:

```bash
cd /home/codex/repos/ns004-docs
for d in packages/* plugins/*; do [ -f "$d/deno.json" ] || continue; \
  python3 -c "import json;n=json.load(open('$d/deno.json')).get('name','');print(n.replace('@netscript/','')) if n.startswith('@netscript/') else None"; done | sort
```

Paste that list and your per-row check into the commit evidence.

Also rewrap the `docs/site/ai/agent-tooling.md` bullet you collapsed into one long line — restore
~80-column wrapping to match its neighbours.

Commit: `docs(llms): correct the generated deno-doc filenames named by the task router`.

---

## Task B — fix slice 2 (#1069): the sample does not match the real API and misses acceptance

Your sample in `docs/site/web-layer/builders.md` has four defects. Here is the **verified** API — I
read it out of the source, you may rely on it, but re-verify anything you add beyond it.

**Builder methods that exist** (`packages/fresh/src/application/builders/define-page/builder/mod.tsx`):
`withForm withHandler withHeader withLayer withLayout withMeta withParams withPathParams withPolicy
withResource withResources withRoute withRouteContract withSearchParams withStatus withStreaming
withTelemetry` and `build()`. Nothing else.

**Defect 1 — `withLayout` signature is wrong.** It is
`(slots: PageSlots, ctx: PageLayoutContext) => PageRenderable`. `slots` is the **first positional
argument**, not a destructured property, and each slot is a **function you call**:

```tsx
.withLayout((slots) => (
  <OrdersLayout list={slots.list()} create={slots.create()} />
))
```

Your `({ slots }) => … {slots.main}` is wrong twice over.

**Defect 2 — JSX inside a ` ```ts ` fence.** The sample contains `<div>`. Fence it as ` ```tsx `.

**Defect 3 — acceptance is not met.** #1069 requires `withForm`, **partials**, fallbacks,
**`staleTime`**, telemetry and layout slots all **visible above the fold**. Your sample shows none of
`partial`, `partialName`, `staleTime` — they appear only in prose. Put them in the sample.

The verified `withLayer` config keys are: `loader`, `partial`, `partialName`, `fallback`, `policy`,
`params`, `layerDeps`, `staleTime`, `gcTime`, `staleReloadMode`, `shouldReload`, `delivery`.
The verified `withForm` config keys are: `schema`, `mutate`, `initial`, `onIntent`, `redirectTo`,
`onSuccess`, `invalidate`, `csrf`, `method`, `spanName`.

So the shape in the issue is essentially correct and you should follow it rather than invent one —
prefer `withRoute(routes.orders.$route)` for route typing, because the page's own preamble already
sends readers to `@netscript/fresh/route` for `withRoute()`, and `DefinePageRouteContractInput` is
marked `@internal`.

**Defect 4 — the sample was never type-checked.** This is the rule you were given and skipped. Do it
now, for real:

1. Write the exact sample body into a scratch file inside the worktree, e.g.
   `packages/fresh/.sample-check.tsx`, with minimal real stubs for the app-level symbols
   (`OrdersIsland`, `OrdersSkeleton`, `CreateOrderForm`, `OrdersLayout`, `loadAndDehydrateOrders`,
   `ordersClient`, `CreateOrderSchema`, `routes`) — the stubs may be local `const`/`function`
   declarations, but every **framework** symbol and option name must be the real one.
2. Run `deno check --unstable-kv packages/fresh/.sample-check.tsx` and read the full output.
3. Iterate until it is clean, then copy the verified body back into the Markdown and **delete the
   scratch file**. Confirm with `git status` that it is gone.
4. Put the passing `deno check` output in your evidence. If a construct cannot be made to
   type-check, drop it from the sample and say so — do not ship a sample you could not compile.

Keep the minimal example after the envelope, and keep the capability list — but correct the
capability list to describe what the sample actually does.

Commit: `docs(web-layer): type-check the definePage envelope and show partials and staleTime`.

---

## Task C — slice 3 (#1070): implement it, avoiding the two defects the last attempt had

The previous turn's uncommitted edits to `packages/fresh/mod.ts`, `packages/fresh-ui/mod.ts`,
`packages/fresh-ui/registry.ts` and a new `packages/fresh-ui/tests/registry_doc_test.ts` were lost
before they were committed — `git stash` on this machine is contested because several worktrees
share one `.git`. **Never use `git stash` in this worktree.** Commit instead; a WIP commit you amend
later is always safer here.

So implement this slice from scratch. The approach was right — fix the **JSDoc that `deno doc`
renders**, never a `.txt` file, because the `.txt` is regenerated. Two defects from that attempt
that you must not repeat.

Also: do **not** commit `deno.lock` unless a change genuinely requires it. If `deno.lock` shows up
modified, `git checkout HEAD -- deno.lock` before you commit.

What the slice must produce:

- `packages/fresh/mod.ts` — extend the existing `@module` block into a real overview: one line on
  what `@netscript/fresh` is; the subpath export list with a one-clause purpose each; a pointer to
  `@netscript/fresh-ui` stating that visual components are **copied into your app**; and a sentence
  on when to read the **scaffold** instead of package docs (generated route modules and
  `components/ui/mod.ts` show the shape; package docs give symbols).
- `packages/fresh-ui/registry.ts` — a doc block on the exported `freshUiRegistryManifest` listing
  the **actual** collections and their item names, read out of
  `packages/fresh-ui/registry.manifest.ts`, plus the items belonging to no collection, plus the
  sentence: *Runtime behavior ships from `/interactive`, `/primitives` and `DataGrid`. Visual
  components and blocks are **copied into your app** — inspect `components/ui/mod.ts` and
  `/design`, or run `ui:add`.*
- `packages/fresh-ui/mod.ts` — a short pointer in its `@module` block to the same facts.
- `packages/fresh-ui/tests/registry-doc_test.ts` — the drift guard described in C2.

**C1 — do not name symbols that do not exist.** The last attempt invented several. I checked each
subpath:

- `./streams` exports `createNetScriptStreamDB`, `useLiveQuery`, `useLiveSuspenseQuery` — there is
  **no** `createStreamDb`. Fix it.
- `./form` exports `Form`, `FormRegion`, `createStandardSchemaAdapter`, `generateCsrfToken`, … —
  `withForm` is a **`definePage()` builder method**, not a `./form` export. Same for `withPolicy`
  and `withStreaming` under `./defer`: those are builder methods too. Reword so a reader is not sent
  to the wrong module.
- `./route` really does export `defineRouteContract` (also `createRouteReference`,
  `bindRoutePattern`, `paginationSearchSchema`).
- `./query` exports `QueryIsland`, `HydrationBoundary`, `dehydrateQueryClient`, `useInfiniteQuery`,
  `useIslandMutation`, … — check before you name one.

For each subpath, run `deno doc --unstable-kv <the file that deno.json maps that subpath to>` and
name only symbols you saw in that output. Paste the checks into your evidence.

**C2 — a hand-written list drifts, so guard it, and do not write the vacuous guard the last attempt
wrote.** That test did `registrySource.includes(item)`, which passes on any substring: `card`,
`input`, `search`, `message`, `toast` all occur incidentally in that file's prose and type
declarations, so the test would stay green while the doc block rotted. It also never detects a
**removed** or **renamed** collection, nor a stale entry left in the doc after an item is deleted.

Rewrite it so it is a real guard:

- Extract the JSDoc block above `export const freshUiRegistryManifest` from `registry.ts`.
- Parse the `- \`<collection>\`: a, b, c` lines into a map.
- Assert the **set of collection names** in the doc equals the set in
  `freshUiRegistryManifest.collections` — both directions, so an added *or* removed collection
  fails.
- For each collection, assert the doc's item list equals `collection.items` **exactly**, as an
  ordered or sorted comparison of the parsed list — not a substring probe.
- Also assert the "standalone items not listed above" sentence matches the items that belong to no
  collection, again as a set comparison.
- Remove the unused `assertEquals` import, or use it. An unused import is a lint failure.

**Prove the guard fails.** Temporarily rename one collection in
`packages/fresh-ui/registry.manifest.ts`, run the test, capture the failure output, then
`git checkout -- packages/fresh-ui/registry.manifest.ts` and confirm with `git status` that the
manifest is clean. The previous turn was interrupted in the middle of exactly this step — check the
manifest is clean **before** you start and **after** you finish. Put both the failing and the
passing output in your evidence. A guard test nobody has seen fail is not evidence.

Then verify the rendered surfaces, which is what the issue is actually about:

```bash
cd /home/codex/repos/ns004-docs
NO_COLOR=1 deno doc --unstable-kv packages/fresh/mod.ts | head -60
NO_COLOR=1 deno doc --unstable-kv packages/fresh-ui/registry.ts | head -80
```

Both must actually show the new prose. Paste it.

Gates for this task (it touches `packages/**`):

```bash
cd /home/codex/repos/ns004-docs
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh-ui --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/fresh-ui --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/fresh-ui --ext ts,tsx
cd packages/fresh-ui && deno task test
```

Commit: `docs(fresh): cross-route the generated deno doc surfaces`.

---

## Task D — slice 4 (#1020): stream path prefix and the non-durable default

Not started. Three acceptance criteria, all three must land.

**D1 — document the path prefix wherever `streamPath` is configured.** The framework prepends
`STREAMS_URL_PREFIX = '/v1/stream/netscript'`
(`packages/plugin-streams-core/src/domain/constants.ts`) inside `buildStreamUrl`. A caller who uses
the path they configured gets a 404 and reasonably concludes writes are dropped. Document it, with a
concrete resolved URL, at each of:

- the `streamPath` option JSDoc in `packages/fresh/src/runtime/streams/create-stream-db.ts`
- the `streamPath` option JSDoc in `packages/plugin-workers-core/src/streams/producer.ts`
- `packages/sdk/src/streams.ts` (its example already uses `streamPath`)
- the published page `docs/site/capabilities/streams.md`

Confirm the exact resolution against the existing test before you write the example:
`packages/fresh/src/runtime/streams/create-stream-db_test.ts` asserts
`streamPath: '/workers/executions'` resolves to
`https://streams.example.test/v1/stream/netscript/workers/executions`. Use that shape.

**D2 — state the in-memory default explicitly.** `plugins/streams/services/src/main.ts` reads
`STREAMS_DATA_DIR`; unset selects **in-memory**, non-durable storage. Say so prominently in
`docs/site/capabilities/streams.md` — a callout, not a footnote — and name `STREAMS_DATA_DIR=<path>`
as the setting that makes it durable.

**D3 — log it at startup.** In `plugins/streams/services/src/main.ts`, when `dataDir` is undefined,
emit a clear warning at service start that stream data is **not durable** and that setting
`STREAMS_DATA_DIR` makes it durable. Match the logging style already used in that file and its
neighbours; add no dependency. When `dataDir` **is** set, at most one informational line.

Prove D3 fires **without starting containers**: extract the decision into a small exported pure
helper, e.g.

```ts
export function describeStorageDurability(dataDir: string | undefined): {
  readonly durable: boolean;
  readonly message: string;
};
```

have `main.ts` call it, and unit-test both branches under the streams plugin's tests. Capture the
passing test output.

Gates:

```bash
cd /home/codex/repos/ns004-docs
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/streams --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root plugins/streams --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root plugins/streams --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/sdk --ext ts,tsx
```

Commit: `docs(streams): surface the stream path prefix and the non-durable default`.

---

## Final gates — run every one and paste the real output

```bash
cd /home/codex/repos/ns004-docs
deno task docs:links
deno task docs:accuracy
deno task doc:lint
deno task quality:scan
deno task arch:check
cd docs/site && NO_COLOR=1 deno task build && sed -n '1,60p' _site/llms.txt
```

Known-good baselines from before your changes, so you can tell a regression from pre-existing state:

- `docs:links` → `docs=98 broken-links=0 broken-anchors=0 orphans=0`
- `docs:accuracy` → `PASS (4 saga pages, 8 preferred paths, 18 CLI mutation families)`
- `quality:scan` → `{"ok":true, "findings":[], "allowCount":7}`

If a gate is red, **read the error text** and fix the cause. Never silence a gate.

## Reporting

Push after every commit. Your final message must state, per issue (#1068, #1069, #1070, #1020),
what you changed, which acceptance criterion it satisfies, and the exact command plus observed
output that proves it. If a criterion is not met, say so plainly.
