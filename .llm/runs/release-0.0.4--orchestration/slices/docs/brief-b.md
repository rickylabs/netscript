use harness

# Slice: #1070 and #1020 only

Worktree `/home/codex/repos/ns004-docs`, branch `docs/1068-task-routing`, PR #1079. Parts A and B of
an earlier brief are already committed — #1068 and #1069 are DONE. Do **not** touch
`docs/site/_plugins/ai-tooling.ts`, `docs/site/ai/agent-tooling.md`, or
`docs/site/web-layer/builders.md`. Only the two slices below.

## SKILL

- `.agents/skills/netscript-harness`
- `.agents/skills/netscript-deno-toolchain` — `deno doc` is the authority for generated surfaces.

## Rules

- Work only inside `/home/codex/repos/ns004-docs`.
- Delete the stray untracked file `packages/fresh/tests/sample-check.tsx` before your first commit.
- If you make a temporary edit to prove a test fails, revert it in the same command sequence and
  confirm with `git status --short`.
- No `// deno-lint-ignore`, no `as unknown as`.
- Commit per slice and `git push` after each. Bare `#N` in the commit body, never `Closes #N`.
- Verify the artefact, not the exit code.

## Slice 1 — #1070 · generated `deno doc` surfaces must cross-route

`docs/deno-doc/*.txt` are produced by running `deno doc` over each package export at bundle time.
Hand-patching a `.txt` is overwritten. Fix the **JSDoc in the source** that `deno doc` renders.

**1a.** `packages/fresh/mod.ts` has a `@module` block listing subpath exports. Extend it so it:

- says in one line what `@netscript/fresh` is;
- gives each subpath export a one-clause purpose;
- points at `@netscript/fresh-ui` and states its visual components are **copied into your app**, not
  imported from the package;
- says when to read the **scaffold** instead of package docs: your generated app's route modules and
  `components/ui/mod.ts` show the intended shape, package docs give symbols.

**1b.** Add a doc block on the exported `freshUiRegistryManifest` in `packages/fresh-ui/registry.ts`
(plus a one-line pointer in the `@module` block of `packages/fresh-ui/mod.ts`) that:

- names the actual **collections** and their item names, read out of
  `packages/fresh-ui/registry.manifest.ts` — read the file, do not guess;
- states plainly: runtime behaviour ships from `/interactive`, `/primitives` and `DataGrid`; visual
  components and blocks are **copied into your app** — inspect `components/ui/mod.ts` and `/design`,
  or run `ui:add`;
- gives the total item count and how to enumerate the rest (`freshUiRegistryManifest.items`).

**1c.** Add a drift-guard test under `packages/fresh-ui/tests/` that reads the doc comment out of
`registry.ts` and asserts the collection names it mentions match
`freshUiRegistryManifest.collections` exactly, so a renamed or added collection fails the suite.
Prove it fails by temporarily renaming a collection, capture the failure text, revert, and confirm
`git status --short` shows the manifest clean.

Verify the rendered surface, not the source:

```bash
cd /home/codex/repos/ns004-docs
NO_COLOR=1 deno doc --unstable-kv packages/fresh/mod.ts | head -60
NO_COLOR=1 deno doc --unstable-kv packages/fresh-ui/registry.ts | head -80
```

Both must show the new prose. Gates:

```bash
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh-ui --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/fresh-ui --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/fresh-ui --ext ts,tsx
```

Commit: `docs(fresh): cross-route the generated deno doc surfaces`.

## Slice 2 — #1020 · stream path prefix and the non-durable default

**2a.** The framework prepends `STREAMS_URL_PREFIX = '/v1/stream/netscript'`
(`packages/plugin-streams-core/src/domain/constants.ts`) inside `buildStreamUrl`. Document that at
every place `streamPath` is configured:

- `packages/fresh/src/runtime/streams/create-stream-db.ts` (`streamPath` JSDoc);
- `packages/plugin-workers-core/src/streams/producer.ts` (`streamPath` JSDoc);
- `packages/sdk/src/streams.ts` (its example uses `streamPath`);
- `docs/site/capabilities/streams.md` — add a short "Resolved stream URLs" subsection.

Show it concretely: `streamPath: '/workers/executions'` resolves to
`<base>/v1/stream/netscript/workers/executions`. Confirm against
`packages/fresh/src/runtime/streams/create-stream-db_test.ts` first.

**2b.** `plugins/streams/services/src/main.ts` reads `STREAMS_DATA_DIR`; unset selects **in-memory**,
non-durable storage. State that prominently in `docs/site/capabilities/streams.md` as a callout and
name `STREAMS_DATA_DIR=<path>` as the setting that makes it durable.

**2c.** In `plugins/streams/services/src/main.ts`, when `dataDir` is undefined, log a clear warning
at startup that stream data is not durable and that `STREAMS_DATA_DIR` makes it durable. Match the
existing logging style in that file; add no dependency. Extract the decision into a small exported
pure helper (e.g. `describeStorageDurability(dataDir: string | undefined)`), unit-test both branches
under the streams plugin tests, and call it from `main.ts`. Capture the passing test output.

Gates:

```bash
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/streams --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root plugins/streams --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root plugins/streams --ext ts,tsx
```

Commit: `docs(streams): surface the stream path prefix and the non-durable default`.

## Final gates

```bash
cd /home/codex/repos/ns004-docs
deno task docs:links
deno task docs:accuracy
deno task quality:scan
```

Baselines on clean main: `docs:links` 0 broken, `docs:accuracy` PASS, `quality:scan` `"ok":true`
with exactly 7 allowances. An 8th allowance means you introduced it.

Report per issue: what changed, which acceptance criterion it satisfies, and the exact command and
output that proves it. State plainly anything you could not do.
