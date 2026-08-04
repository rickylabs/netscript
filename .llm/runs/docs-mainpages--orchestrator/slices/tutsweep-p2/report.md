# tutsweep-p2 — completion report (#1208 phase 2)

Worktree: `/home/codex/repos/ns-tutsweep` · branch `docs/tutorials-sweep`
Full finding list: `findings.md` (same directory). No PR opened, per brief.

## Fixed

| # | Finding | Files |
| --- | --- | --- |
| F1 | `definePage` imported from `@netscript/fresh/builders` instead of the scaffold's `State`-bound `@app/utils.ts` re-export, in all three phase-1 chapters | storefront/06, chat/03, live-dashboard/04 (+ the new ch.5 page) |
| F2 | `getCachedEntry` documented as returning `undefined` on a cold cache; it returns `null`. `.key(input)` marked optional; it is required | live-dashboard/03 |
| F3 | Port ranges and "conventional assignment" claims invalidated by #1211 (project-name hash over 49152–65535) | live-dashboard/04,05,06 · storefront/04,05,07,index · workspace/04,06,index · erp-sync/01,02,04,05,index |
| F4 | tutorials index said storefront has 6 chapters; it has 7 | tutorials/index.md |
| F5 | ch.5 hand-rolled a `sagasStreamSeedLoader()` free function and never showed the page mounting the island, one chapter after ch.4 taught `.withResource`/`.withLayer` | live-dashboard/05 |
| F6 | `netscript --help` group list missing `agent` and `config` | live-dashboard/01, workspace/01 |

F3 is the largest change and the reason most files moved. #1211 landed ~90 minutes after the
phase-1 rewrite and replaced fixed PLUGIN_API/APP assignments with
`allocateScaffoldDefaultPort(projectName, …)` — an FNV-1a hash over the IANA dynamic range. Every
`:8091` / `:8092` / `:8093` / `:8010` / `:4437` in the corpus was therefore unreachable. Pinned
ports were kept and labelled as pinned: `:3001` / `:3002` (`--service-port`) and workspace `:8094`
(`export PORT=8094` in ch.2). Unpinned ones now route the reader to the Aspire resource list, and
erp-sync ch.1 establishes `<workers-endpoint>` / `<triggers-endpoint>` once for its whole track.

## Deferred

| # | Item | Route | Reason |
| --- | --- | --- | --- |
| D1 | Full narrative re-authoring around allocated ports (a resolve-the-endpoint one-liner instead of `<placeholder>`) | new #1211-driven docs slice | Several chapters are structured around a fixed port as a teaching device; this slice fixed the false claims, the structural rewrite is its own scope |
| D2 | storefront pins `--service-port 3001` against the CLI's own recommendation, without surfacing the tradeoff | left as-is | Self-consistent, deliberate, track-wide narrative decision — not a defect |
| D3 | erp-sync and workspace demonstrate no page builder at all | #1210 | New content, not a consistency fix. workspace/05 was checked specifically: its `createService(…).route()` + `.withAuthn()`/`.withAuthz()` is a service route, and `definePage` has no equivalent for it |
| D4 | `ns-workers trigger` / `ns-workers executions` verbs, and the missing `TriggerCommand`/`ExecutionsCommand` entries in `reference/workers/index.md` | #1210 or a source-side check | The published `@netscript/plugin-workers` wrapper is not vendored in this worktree — unverifiable here |

Also checked and found correct (no action): no dangling `(_shared)/query-loaders.ts` reference (the
one hit describes live `ui:add page --island` scaffolder output); no hand-rolled Fresh page routes
remain (the surviving `handler = { POST }` blocks in chat ch.2/4 are API endpoints); `eis-chat/*` are
intentional redirect shims; every builder/route/query/SDK symbol and every `netscript` flag used
across the corpus verified against `packages/` source.

## Commits (5, per track)

```
b9ff199d1 docs(tutorials): erp-sync consistency sweep (Refs #1208)
a17a6d077 docs(tutorials): workspace consistency sweep (Refs #1208)
2e10274ac docs(tutorials): chat ch.3 imports definePage from the scaffold's utils (Refs #1208)
3a4c7fef6 docs(tutorials): storefront consistency sweep (Refs #1208)
8949cedd6 docs(tutorials): live-dashboard consistency sweep (Refs #1208)
```

Pushed with `git push origin HEAD:refs/heads/docs/tutorials-sweep` — new branch created.

## Gate evidence

| Gate | Baseline | Final |
| --- | --- | --- |
| `cd docs/site && deno task build` | exit 0, 595 files | **exit 0** |
| `docs/site` `deno task check:links` | 30576 links / 214 pages, all resolve | **30580 links / 214 pages, all resolve** |
| `docs/site` `deno task check:caveats` | 27 markers / 22 pages, all resolve | **27 markers / 22 pages, all resolve** |
| root `deno task docs:links` | docs=102, 0 broken links/anchors/orphans | **docs=102, 0 broken — OK** |
| root `deno task docs:accuracy` | PASS | **PASS** |

Changed-file audit: 21 files, all under `docs/site/tutorials/`. No `packages/`, no `plugins/`.
Lock hygiene: `deno.lock` reverted with `git checkout HEAD -- deno.lock` before each commit;
`git log --name-only 8949cedd6^..HEAD` confirms no commit touches it.
