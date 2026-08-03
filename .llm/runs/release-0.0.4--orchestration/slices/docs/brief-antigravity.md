use harness

# Slice: documentation sequencing — corrections + remaining work (#1068, #1069, #1070, #1020)

You are the implementation agent for PR #1079, branch `docs/1068-task-routing`, worktree
`/home/codex/repos/ns004-docs`. Two commits are already on the branch and **both contain verified
defects listed below**. Fix them, then do the two remaining slices. A supervisor reviews every
commit adversarially and has already found everything in part A by reading the source — do not
argue with these findings, they are checked.

## SKILL

- `.agents/skills/netscript-harness` — run loop, commit trail.
- `.agents/skills/netscript-deno-toolchain` — `deno doc` is the authority for generated surfaces.
- `.agents/skills/netscript-pr` — commit conventions.

## Absolute rules

1. Work **only** inside `/home/codex/repos/ns004-docs`. Never touch `wave4-*`, `ns004-scaffold`,
   `ns004-agentic`, or any container/process you did not start.
2. **Never leave the tree dirty after a temporary experiment.** The previous agent renamed a
   collection in `packages/fresh-ui/registry.manifest.ts` to prove a guard test failed and left the
   rename uncommitted. If you make a temporary edit, revert it in the *same* command sequence and
   verify with `git status --short` before you commit.
3. **Every code sample must be verified against the real API before you write it.** Not "looks
   right" — verified. The mechanism is in part A2. Inventing a method name is the single failure
   this whole PR exists to stop; doing it inside this PR is unacceptable.
4. No `// deno-lint-ignore`, no `as unknown as`.
5. Commit per slice, push after each. Conventional commits. Bare `#N` in the commit body; **never**
   `Closes #N` in a commit message.
6. Verify the artefact, not the exit code. Read actual output.

---

# PART A — fix what is already committed

## A1 · commit `ec63c2c60` (#1068 router) — four dead file references

The router rows name generated `deno doc` filenames. The bundle derives each filename from the
package's **`name` field** in `deno.json`: `@netscript/<slug>` → `deno-doc/<slug>.txt`. Four of the
names you used do not exist:

| written | actual |
| --- | --- |
| `deno-doc/sagas.txt` | `deno-doc/plugin-sagas.txt` (and `plugin-sagas-core.txt`) |
| `deno-doc/workers.txt` | `deno-doc/plugin-workers.txt` (and `plugin-workers-core.txt`) |
| `deno-doc/streams.txt` | `deno-doc/plugin-streams.txt` (and `plugin-streams-core.txt`) |
| `deno-doc/auth.txt` | `deno-doc/plugin-auth.txt` (and `auth-workos.txt` / `auth-better-auth.txt` / `auth-kv-oauth.txt`) |

`service.txt`, `sdk.txt`, `database.txt`, `queue.txt`, `telemetry.txt`, `logger.txt`, `fresh.txt`
and `fresh-ui.txt` are correct — leave them.

Regenerate the authoritative slug list yourself and check **every** name in the router against it:

```bash
cd /home/codex/repos/ns004-docs
for d in packages/* plugins/*; do [ -f "$d/deno.json" ] || continue; \
  python3 -c "import json;n=json.load(open('$d/deno.json')).get('name','');print(n.replace('@netscript/','')) if n.startswith('@netscript/') else None"; \
done | sort
```

Paste that list and the corrected router rows into your final report.

The page URLs in the router are all correct — I checked every one against `docs/site/`. Do not
change them.

## A2 · commit `efd6d7644` (#1069 builders sample) — the sample does not compile and misses required capabilities

This is the serious one. The sample you wrote uses methods and option names that do not exist, and
would throw at `build()`.

**There is a verified, working full-envelope example already in this repo.** Read it:

`docs/site/tutorials/live-dashboard/04-definePage-QueryIsland.md`, the `ordersListPage` chain
(around line 142). That is ground truth. Base the builders-page sample on **that shape**.

Concretely, what is wrong:

- **`withRouteContract({ pathSchema, searchSchema })` with no `$route`.** `withRouteContract`
  exists, but `build()` **throws** when `$route` is missing — see the test
  `definePage withRouteContract({}) throws a clear error when $route is missing` in
  `packages/fresh/src/application/builders/define-page/tests/builder.test.tsx`. Prefer
  `.withRoute(routes.<...>.$route)` as the tutorial does; if you keep `withRouteContract`, it must
  carry `$route`.
- **`withLayer(..., { delivery: "stream" })`** — `delivery` is not a documented layer option.
  Verify the real option set before using any of them. The verified options in the tutorial are
  `loader`, `partial`, `partialName`, `fallback`, `staleTime`, `staleReloadMode`.
- **`fallback: () => <div>…</div>`** — `fallback` takes a JSX **element**, not a function:
  `fallback: <OrdersSkeleton />`.
- **`.withLayout(({ slots }) => …)`** — wrong signature. It is `(slots, ctx) => …` (positional,
  not destructured), and each slot is **called**: `{slots.list()}`, not `{slots.list}`.
- **Fence language.** The block contains JSX but is fenced ` ```ts `. Use ` ```tsx `.
- **Acceptance not met.** Issue #1069 requires `withForm`, **partials**, fallbacks, **`staleTime`**,
  telemetry and layout slots to be *visible above the fold*. `partial` / `partialName` and
  `staleTime` appear nowhere in your sample — only as prose claims underneath it. Put them in the
  sample.
- **Markdown wrapping.** You replaced wrapped prose with single 200–400 character lines in both
  `builders.md` and `docs/site/ai/agent-tooling.md`. Re-wrap to match the surrounding files
  (~90 columns), and put a blank line before the bullet list.

**Mandatory verification before you commit this slice.** Extract the sample into a scratch file and
type-check it:

```bash
cd /home/codex/repos/ns004-docs
mkdir -p .llm/tmp/prc
# write the sample body to .llm/tmp/prc/sample-check.tsx with real imports and stub helpers
deno check --unstable-kv .llm/tmp/prc/sample-check.tsx
```

Paste the **actual** `deno check` output into your report. If it does not pass, the sample is wrong
— fix the sample, not the check. Delete the scratch file before committing (it is under
`.llm/tmp/` which is scratch, but leave the tree clean anyway).

Where a capability genuinely does not exist on the builder, **drop it and say so** rather than
inventing it.

Commit A1+A2 as one fix commit: `docs: correct the task router file names and the builders sample`.

---

# PART B — remaining slices

## B1 · #1070 · generated `deno doc` surfaces must cross-route

This is **generation, not hand-editing**. `docs/deno-doc/*.txt` are produced by running `deno doc`
over each package export subpath at bundle time; hand-patching a `.txt` is overwritten. The only
correct fix is the **JSDoc in the source that `deno doc` renders**.

**B1a — `fresh.txt` needs a real module overview.** `packages/fresh/mod.ts` already has a `@module`
block listing subpaths. Extend it so it:

- says in one line what `@netscript/fresh` is;
- gives each subpath export a one-clause purpose (the bare list is already there);
- **points at `@netscript/fresh-ui`** and states that its visual components are **copied into your
  app**, not imported from the package;
- says when to read **the scaffold instead of package docs**: your generated app's route modules and
  `components/ui/mod.ts` show the intended shape; package docs give symbols.

**B1b — `fresh-ui.txt` must list actual registry collections and items.** Add a doc block on the
exported `freshUiRegistryManifest` in `packages/fresh-ui/registry.ts` (plus a short pointer in the
`@module` block of `packages/fresh-ui/mod.ts`) that:

- names the actual **collections** and their item names, read out of
  `packages/fresh-ui/registry.manifest.ts` — read the file, do not guess;
- states plainly: runtime behaviour ships from `/interactive`, `/primitives` and `DataGrid`; visual
  components and blocks are **copied into your app** — inspect `components/ui/mod.ts` and `/design`,
  or run `ui:add`;
- if the item list is long, enumerate every **collection** with its items and give the total item
  count plus how to enumerate the rest (`freshUiRegistryManifest.items`). Do not truncate silently.

**Add a drift-guard test** under `packages/fresh-ui/tests/` that reads the doc-comment text out of
`registry.ts` and asserts the collection names it mentions match `freshUiRegistryManifest.collections`
exactly — so a renamed or added collection fails the suite. Prove it fails: temporarily rename a
collection, run the test, capture the failure, **then revert and confirm with `git status --short`
that the manifest is clean**. (The previous agent failed exactly this step.)

Verify the rendered surface, not the source:

```bash
cd /home/codex/repos/ns004-docs
NO_COLOR=1 deno doc --unstable-kv packages/fresh/mod.ts | head -60
NO_COLOR=1 deno doc --unstable-kv packages/fresh-ui/registry.ts | head -80
```

Both must actually show the new prose. If `deno doc` does not render it, move the comment; do not
declare victory.

Gates (this touches `packages/**`):

```bash
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh-ui --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/fresh-ui --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/fresh-ui --ext ts,tsx
cd packages/fresh-ui && deno task test
```

Commit: `docs(fresh): cross-route the generated deno doc surfaces`.

## B2 · #1020 · stream path prefix and the non-durable default

Three acceptance criteria; all three must land.

**B2a — document the path prefix wherever `streamPath` is configured.** The framework prepends
`STREAMS_URL_PREFIX = '/v1/stream/netscript'`
(`packages/plugin-streams-core/src/domain/constants.ts`) inside `buildStreamUrl`. A caller using the
path they configured gets a 404 and reasonably concludes writes are dropped. Document it at:

- the `streamPath` JSDoc in `packages/fresh/src/runtime/streams/create-stream-db.ts`;
- the `streamPath` JSDoc in `packages/plugin-workers-core/src/streams/producer.ts`;
- `packages/sdk/src/streams.ts` (its example uses `streamPath`);
- the published page `docs/site/capabilities/streams.md` — add a short "Resolved stream URLs"
  subsection if it does not already cover this.

Show the resolution concretely: `streamPath: '/workers/executions'` resolves to
`<base>/v1/stream/netscript/workers/executions`. Confirm that against the existing expectation in
`packages/fresh/src/runtime/streams/create-stream-db_test.ts` before you write it.

**B2b — state the in-memory default explicitly.** `plugins/streams/services/src/main.ts` reads
`STREAMS_DATA_DIR`; unset selects **in-memory**, non-durable storage. Say so prominently in
`docs/site/capabilities/streams.md` (a callout, not a footnote) and name the setting that makes it
durable (`STREAMS_DATA_DIR=<path>`).

**B2c — log it at startup.** In `plugins/streams/services/src/main.ts`, when `dataDir` is undefined,
emit a clear warning at service start that stream data is **not durable** and that setting
`STREAMS_DATA_DIR` makes it durable. Match the logging style already used in that file / its
neighbours; add no dependency.

Prove B2c without starting containers: extract the decision into a small exported pure helper (e.g.
`describeStorageDurability(dataDir: string | undefined)`), unit-test both branches under the streams
plugin tests, and have `main.ts` call it. Capture the passing test output.

Gates:

```bash
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/streams --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root plugins/streams --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root plugins/streams --ext ts,tsx
```

Commit: `docs(streams): surface the stream path prefix and the non-durable default`.

---

# Final gates — run all, paste the real output

```bash
cd /home/codex/repos/ns004-docs
deno task docs:links
deno task docs:accuracy
deno task doc:lint
deno task quality:scan
deno task arch:check
cd docs/site && NO_COLOR=1 deno task build && sed -n '1,60p' _site/llms.txt
```

Baselines on clean `main`, so you know what "unchanged" looks like: `docs:links` = 0 broken,
`docs:accuracy` = PASS, `quality:scan` = `"ok":true` with exactly 7 pre-existing allowances. If
`quality:scan` reports an 8th allowance or any finding, you introduced it — fix the cause.

If a gate is red, read the error text. Never infer a cause from the shape of a failure. Never
silence a gate.

# Reporting

Your final message must state, per issue: what you changed, which acceptance criterion it satisfies,
and the exact command + output that proves it. State plainly anything you could not do. A truthful
partial beats a claimed pass.
