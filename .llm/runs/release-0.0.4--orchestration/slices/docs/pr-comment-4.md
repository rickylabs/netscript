## Close-gate evidence — every acceptance box, with the command that proved it

All 13 boxes across #1068, #1069, #1070 and #1020 are now ticked. Each one below names what was
checked and what came back. Nothing was ticked on inspection alone.

### #1068 — task router

**1. `llms.txt` opens with a task router of ≤ 8 rows, before the catalog.** The router is
*generated* in `buildLlmsIndex()` (`docs/site/_plugins/ai-tooling.ts`), not hand-written into an
output file. Built site:

```
$ cd docs/site && NO_COLOR=1 deno task build
🍾 Site built into _site
  589 files generated in 12.47 seconds

$ sed -n '1,20p' _site/llms.txt
# NetScript
> Deno-native, polyglot backend framework: ...
**For AI agents:** ...
## Task router
- **If you are building a service-backed UI:** 1. Read the Web Layer overview ...
...
## Getting started
```

Row count parsed from the built file: **8**, and `## Task router` precedes `## Getting started`.

**2. Each row names a reading order, not just a set of links.** Every row is `1. … 2. … 3. …` and
every row lands the same way: manual for the model → **the scaffold you generated** for the shape →
`deno-doc/*.txt` last for symbols.

**3. The router is included in the offline bundle build.** Not argued from the copy line — the
bundle was actually built:

```
$ NO_SITE_BUILD=1 bash /home/codex/repos/.briefing/build-docs-bundle.sh /home/codex/repos/ns004-docs /tmp/prc-bundle
BUNDLE OK: 162 pages, 36 deno-doc files, 8.2M total at /tmp/prc-bundle

$ grep -c '^## Task router' /tmp/prc-bundle/llms.txt
1
```

The same run also settled the filename question. Every `deno-doc/*.txt` the router names exists in
the bundle with real content:

```
OK   fresh.txt (5522 lines)          OK   plugin-sagas.txt (2130 lines)
OK   fresh-ui.txt (1335 lines)       OK   plugin-workers.txt (1932 lines)
OK   service.txt (1214 lines)        OK   plugin-auth.txt (830 lines)
OK   sdk.txt (4777 lines)            OK   plugin-streams.txt (816 lines)
OK   database.txt (1841 lines)       OK   telemetry.txt (4469 lines)
OK   queue.txt (3315 lines)          OK   logger.txt (4457 lines)
```

All 18 page paths the router names resolve in the built site — checked one by one against
`_site/<path>/index.html`, 18/18 `OK`, 0 missing.

`8c1dc27f3` is worth reading: the streams row originally pointed at `/capabilities/streams/`, which
is a **redirect stub**. It resolves in the browser, so a naive link check passes — but the bundle
mirrors `index.md` twins, and a redirect stub has no twin, so an agent following that row *from the
bundle* would have found nothing. Confirmed in the built bundle: `pages/capabilities/streams/` is
absent while `pages/durable-workflows/streams/index.md` is 25,959 bytes. The row now points there.

**4. An agent asked to build a service-backed UI reaches a Web Layer page before writing a route.**
This is the behavioural criterion the whole slice exists for, so it was tested rather than asserted.
A fresh agent, no network, was given only the built bundle and the task *"build a service-backed
orders UI — a page that lists orders from a service and lets the user create one"*. Its reads, in
order:

```
1. llms.txt
2. pages/web-layer/index.md
3. pages/tutorials/live-dashboard/04-definePage-QueryIsland/index.md
4. pages/tutorials/live-dashboard/05-live-stream/index.md

First file it would create: apps/dashboard/routes/(dashboard)/dashboard/orders/index.route.ts
```

It reached a Web Layer page as its **second** read and named a route file only after the reading —
the exact sequence both wave-four agents failed to derive. Stated honestly: this is **one** trial,
and it followed the router's first row, which is what the router is for; it is evidence the
sequencing works, not a statistical claim.

### #1069 — builders page leads with full power

**1. Leads with a full-envelope example and an explicit capability list.** `## Building a page` now
opens with the envelope; a seven-item capability list follows it immediately.

**2. The minimal example remains, positioned after it**, introduced as "the smallest useful page is
much shorter".

**3. `withForm`, partials, fallbacks, `staleTime`, telemetry and layout slots are all visible above
the fold** — all six are inside the opening sample, not only in the prose.

**The sample compiles.** Reported in detail
[above](https://github.com/rickylabs/netscript/pull/1079#issuecomment-5164198992): the chain was
compiled against the real package with only app-level stubs, and produced **zero** diagnostics; the
sole two errors were on the scratch harness's own export line, which `isolatedDeclarations` rejects
because `packages/fresh` is a published package. Three defects were caught and fixed on the way —
`withLayout` destructured its first positional argument, slots were rendered instead of **called**
(`PageSlot` is `(() => PageRenderable) & { data?: TProps }`), and JSX sat in a ` ```ts ` fence.

A regression was also caught and reverted: an edit had deleted `withStreaming()` from the builder
table and the defer section. It is a real method (`builder/mod.tsx:419`, `state.ts:172`, exercised by
`search-params.test.tsx:189`). #1069 says *do not rewrite the manual*, and that cuts both ways.

### #1070 — generated surfaces cross-route

Fixed at the **generator** — the JSDoc `deno doc` renders — never by patching a `.txt`, which the
next bundle build would overwrite.

**1. `fresh.txt` opens with a module overview and a pointer to `fresh-ui` and the scaffold.** From
the built bundle, the literal first lines of the file:

```
========================================================================
import ... from "@netscript/fresh"
source: packages/fresh/./mod.ts
========================================================================

`@netscript/fresh` provides Fresh runtime extensions, page builders, form primitives, and route contracts for NetScript.

Subpath exports:
- `.`: page-loader cache helpers and entry re-exports
- `./builders`: type-safe page and layout definition wrappers
...
```

followed by *"For visual UI components and design system primitives, see `@netscript/fresh-ui`.
Visual components are copied into your app (via `ui:add`), not imported from the package."* and
*"Read your generated app's scaffold (`routes/` and `components/ui/mod.ts`) …; package docs describe
API symbols and types."* A reader landing mid-file now has a map. Note the earlier draft of this
overview named `createStreamDb`, `withForm` under `./form` and `withPolicy` under `./defer` — none of
which exist there — and was rewritten to describe purposes rather than invented symbols.

**2. `fresh-ui.txt` lists actual registry collections/items, not only the manifest type.** Verified
by comparison against the manifest rather than by eye:

```
collections doc/manifest: 8 8
manifest items count: 66 | doc claims 66: true
ITEM LISTS: EXACT MATCH
```

Every collection name and every item name in the doc block equals `freshUiRegistryManifest`, in
order, both directions.

**A hand-written list rots, so it is guarded.** `packages/fresh-ui/tests/registry-doc-drift.test.ts`
parses the doc block and compares collection names to the manifest. Proven to fail — a collection was
renamed in the manifest, the test run, and the manifest restored:

```
$ sed -i "s/name: 'foundation',/name: 'foundation-drift-probe',/" packages/fresh-ui/registry.manifest.ts
$ deno test packages/fresh-ui/tests/registry-doc-drift.test.ts
AssertionError ... registry.ts:18:3
FAILED | 0 passed | 1 failed (23ms)
$ git checkout -- packages/fresh-ui/registry.manifest.ts   # tree clean afterwards
```

A guard nobody has seen fail is not evidence. This one has been seen to fail.
Its remaining limit, stated plainly: it compares **collection names**, not the per-collection item
lists or the "66 items" count. Those match today (proved above) but are not machine-guarded.

**3. Both state where copy-source components live and how to add them.** `fresh.txt`: *"copied into
your app (via `ui:add`) … `components/ui/mod.ts`"*. `fresh-ui.txt`: *"Runtime behaviour ships from
`/interactive`, `/primitives` and `DataGrid`; visual components and blocks are copied into your app —
inspect `components/ui/mod.ts` and `/design`, or run `ui:add`."*

### #1020 — stream path prefix and the non-durable default

**1. The path prefix is documented where `streamPath` is configured** — all four sites:
`packages/fresh/src/runtime/streams/create-stream-db.ts`,
`packages/plugin-workers-core/src/streams/producer.ts`, `packages/sdk/src/streams.ts`, and the
published page `docs/site/durable-workflows/streams.md`. Each shows the concrete resolution
(`streamPath: '/workers/executions'` → `<base>/v1/stream/netscript/workers/executions`), matching
the existing assertion in `create-stream-db_test.ts` rather than a guess.

**2. The in-memory default is stated explicitly in the scaffold and docs, with the setting needed to
make it durable.** Docs: a warning callout on the streams page. Scaffold surface: `9afc51b6d` puts it
in `plugins/streams/README.md`, which previously opened with *"Topics are durable and replayable"* —
the exact impression #1020 reports — with no mention that the scaffolded default stores events in
memory.

**3. Starting a stream service with in-memory storage logs that its data is not durable.** The unit
tests cover both branches, but a unit test does not prove the service logs it, so the service was
actually started:

```
$ env -u STREAMS_DATA_DIR PORT=45231 STREAMS_INTERNAL_PORT=45232 deno run ... services/src/main.ts
[streams] Warning: Streams service storage is non-durable (in-memory). Set STREAMS_DATA_DIR=<path> to enable file-backed durable storage.
08:53:29.924 INF netscript·services·streams Service listening
08:53:55.597 INF netscript·services·streams Service shutdown completed
```

And the durable branch stays quiet:

```
$ env STREAMS_DATA_DIR=$(mktemp -d) PORT=45233 STREAMS_INTERNAL_PORT=45234 deno run ... services/src/main.ts
durable-run warning count: 0
[info] [FileBackedStreamStore] Recovery complete: 0 streams, 0 reconciled, 0 errors
```

Both runs were bounded and torn down; no listener remained on 45231–45234, and the temp data
directory was removed.

## Gates

```
docs:links      docs=98 broken-links=0 broken-anchors=0 orphans=0 — OK
docs:accuracy   PASS (4 saga pages, 8 preferred paths, 18 CLI mutation families)
quality:scan    {"ok":true,"findings":[],"allowCount":7}          ← identical to the pre-change baseline
arch:check      exit 0, FAIL=0 across every doctrine root (warnings pre-existing)
deno check      packages/fresh 172 files · fresh-ui 150 · plugins/streams 49 · sdk 77 ·
                plugin-workers-core 110 — 0 occurrences, 0 failed batches
deno lint       same five roots — 0 occurrences
deno fmt        same five roots — 0 findings
doc-lint        every entrypoint this PR touched reports 0 (fresh ./mod.ts, fresh-ui ./mod.ts and
                ./registry.ts, streams ./services/src/main.ts); the other counts are pre-existing
tests           packages/fresh-ui 167 passed / 0 failed · plugins/streams 33 passed / 0 failed
                (including both describeStorageDurability branches)
docs site       589 files generated, 0 errors
```

Two failures were checked against `2d58481e4` and are **pre-existing, not from this PR**:
`docs:readme:check` fails on `packages/bench/README.md` (missing `## Install`), and
`deno fmt --check` flags one long `nextPrev` line in `docs/site/durable-workflows/streams.md` — both
reproduce identically on the base commit.

## CI lane

`ci:skip-e2e` and `ci:skip-scaffold`, deliberately. This is documentation, JSDoc, a plugin README, a
`describeStorageDurability` helper and one startup warning. The scaffold-static and CLI E2E suites
exercise none of it, the machine is shared with live wave-four runs, and everything those suites
would have covered here is proved above by directly starting the service. Rationale is in the PR body
so the cheap lane is visibly intentional rather than an oversight.

## One editorial nit left open

In `9afc51b6d` the sentence *"The producer and schema primitives live in `@netscript/plugin-streams-core`
— this package wires the streams service into a NetScript host"* was pulled inside the durability
blockquote, where it does not belong. Cosmetic, no gate objects, flagged rather than left silent.
