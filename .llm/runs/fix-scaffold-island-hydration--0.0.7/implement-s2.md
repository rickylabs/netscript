use harness

# Slice brief S2 — #1845 · the generated showcase island never hydrates

- Worktree: `/home/agent/projects/netscript/worktrees/007-leaf-1845`
- Branch: `fix/scaffold-island-hydration` @ **`f48d0b86c`** (`origin/main` `82a2527e2` integrated,
  clean, `deno.lock` byte-identical)
- Run dir: `.llm/runs/fix-scaffold-island-hydration--0.0.7/`
- Closes exactly **#1845**. Priority **p1**.
- **Why this is urgent:** it is the sole hosted-browser blocker for **#1664**, and it closes
  **#1355** and **#1360**.

## SKILL

Harness workflow per `.agents/skills/netscript-harness` + `.llm/harness/`. Also
`.agents/skills/deno-fresh` (Fresh 2.x islands, `createDefine`, route/island structure —
**mandatory** here), `.agents/skills/netscript-cli` (scaffold asset tree),
`.agents/skills/netscript-tools`, `.agents/skills/netscript-pr`.

## State — you already have two RED commits

`d3388b005 test(fresh): reproduce showcase island hydration boundary`
`f022ccbe7 test(fresh): expose query island hydration boundary`

Continue from there. Do not restart the investigation.

## Three diagnoses have already failed. Do not add a fourth by assertion.

Measured and **refuted** — do not re-derive, do not re-adopt:

1. **`islandSpecifiers` is NOT the cause.** `@fresh/core@2.3.3` `crawlFsItem`
   (`src/dev/fs_crawl.ts:124-147`) walks **two** roots and unions them: the `islands` dir **and**
   `routes`, where `crawlRouteDir:20-30` matches `/[/\\]\((_[^/\\]+)\)[/\\]/` and treats a captured
   `_islands` group as an island. **`(_islands)` collocation is a first-class, sufficient discovery
   path needing no registered specifier.** `islandSpecifiers` is a *third, additive* mechanism for
   islands shipped from remote `jsr:`/`npm:` packages the filesystem crawl cannot reach; it registers
   the specifier module itself and does **not** mark importers. None of `ServiceShowcaseLab`,
   `FloatingSurfaceDemo` or `TokenClipboard` imports `@netscript/fresh/defer/island`; all three are
   discovered purely by collocation.
2. **`freshIslandElement: null` in the #1845 receipt is a meaningless signal.** Fresh 2.3.3 emits
   **no island DOM element**: `wrapWithMarker` emits Preact `UNSTABLE_comment` fragments producing
   HTML *comment nodes* — `<!--frsh:island:<name>:<idx>-->` … `<!--/frsh:island-->` — and the client
   runtime hydrates by scanning comment nodes for the `frsh:` prefix. `freshIslandElement: null` is
   equally true of a **fully working** app. Any diagnosis resting on it is unsupported.
3. **Do NOT add `@netscript/fresh/query` to `islandSpecifiers`** (`vite.config.ts.template:40`).
   Verified harmful-shaped: it would register that module's own exports as islands, not
   `ServiceShowcaseLab`.

## The discriminating measurement to run first

Serve the generated app and read the **HTML**, then branch on what you find:

```
curl -s http://<app>/examples/<serviceName>
```

- **`frsh:island` present** → the island is registered and SSR'd; the defect is purely **client-side**
  (client entry not loaded, island chunk 404, or a hydration throw). Chase the browser console and
  the network for the island chunk.
- **`Typed query lab` present, `frsh:island` absent** → the module was registered but the rendered
  component reference did not match `islandRegistry` — a **module-identity** problem.
- **both absent** → the `lab` layer rendered `null`; a **data/loader** defect, not an island defect.

Report which of the three you observed **before** proposing a fix. That single fact eliminates two
thirds of the search space, and it is why three prior diagnoses failed — none of them established it.

## Candidate to test, not to assume

`define-page/runtime/mod.tsx:177` — `const component = data ? renderLayerComponent(...) : null;`. A
layer whose loader resolves falsy renders nothing, silently; the fallback is consulted only on the
`shouldDefer` branch. The `lab` layer uses the loader form; the design layers use a props factory
returning `{}`, always truthy. Counter-evidence: `service-showcase.ts.template:79-95` always returns
an object or throws, and resources are awaited eagerly. **Outcome (c) above would prove it; nothing
else does.**

Known upstream, **not** the cause: `isIslandPath` in `@fresh/plugin-vite` has a dead second branch, so
files added/removed under `(_islands)` mid dev-session need a restart. Cold-start discovery is
unaffected.

Asset-tree fact you will need: templates under `assets/app/routes/examples/(_islands)/` are written to
`routes/examples/<serviceName>/(_islands)/` (`write-app-files.ts:113`,
`write-example-service-app-files.ts:113`), which is what makes the island's `../(_lib)/` imports
resolve.

## Related gate-coverage hole — record, do not fix here

`probe-app-reference.ts:26-61` asserts only SSR-visible markers, so **a fully non-hydrating app passes
`behavior.app-reference`**. That is why this defect stayed invisible. It is a separate issue; note it
in `drift.md` and report it, but do not widen this slice to fix it.

## Rules

- Ceiling: `packages/fresh/**` and/or the scaffold island/query assets under `packages/cli/src/kernel/assets/app/**`, plus tests and the run dir. Report before exceeding it.
- `packages/**` change ⇒ `deno task quality:gate` is **required**.
- **Do not** modify `deno.lock`; if it moves, stop and report.
- **Do not** run `deno task e2e:cli` — no runtime lease. A local `deno task dev` on a generated app to run the curl measurement is fine and needs no lease; it starts no containers.
- Keep a real RED→GREEN pair. You already have RED; the GREEN must be the *proven* cause, not a plausible one.

## PR

Open a **draft** PR as soon as you have the discriminating measurement recorded, even before the fix:
labels `type:fix, area:fresh, area:cli, priority:p1, orchestrator:fixes, ci:full`, milestone `0.0.7`,
body with **`Closes #1845`** verbatim and the measurement outcome stated plainly. Leave acceptance
boxes unticked.

Report the measurement outcome first, then the GREEN SHA and gate exit codes. Do not self-certify, do
not mark ready, do not merge.
