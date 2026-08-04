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

---

## Fix round 1 — response to `docs_audit` FAIL_FIX

Audit: `.llm/runs/docs-mainpages--orchestrator/slices/tutsweep-audit/audit.md`
(opposite-family Codex audit of PR #1222 at `b9ff199d1`). Every FAIL fixed; three commits.

### Disposition per finding

| Audit finding | Disposition | What changed |
| --- | --- | --- |
| **Gate 2 / port-drift FAIL — `:8094` unreachable** — workspace ch.2 installed auth without a host-port pin, so `install-plugin.ts` allocated one; `export PORT=8094` is the in-graph target port Aspire injects, not an appsettings `HostPort` | **FIXED** (pin, not placeholder) | `plugin install --help` confirms a real `--port` option, and `appsettings-entry-builders.ts:105` writes `HostPort` from it — so ch.2 now installs with `--port 8094`, making all ten `:8094` curls genuinely reachable. The chapter explains PORT-vs-host-port, and states the cost the source itself documents: a pinned host port is a machine-global reservation that `aspire start --isolated` cannot randomise away. `export PORT=8094` removed. ch.6 re-attributes the pin from `PORT` to `--port` |
| **Gate 2 FAIL — app host allocation misstated** | **FIXED** | `render-http-endpoint.ts` emits `withHttpEndpoint({ env: 'PORT' })` with no `port` unless a config entry pins `HostPort`, and `generate-register-apps.ts` never pins for `type: 'app'`. Every place I had called a scaffolded app's endpoint "project-derived" now says Aspire allocates the app host port at runtime. FNV attribution is kept only where it is true — plugin host ports (`scaffolder.ts:211` sets `hostPort: servicePort`) and the standalone target fallback |
| **Gate 2 FAIL — absolute collision promise** | **FIXED** | "never collide" / "no two workspaces collide" removed from all four occurrences. Replaced with the actual behaviour: deterministic FNV distribution plus linear probing over *this workspace's* used-port set, explicitly not a guarantee — finite range, no cross-workspace visibility, and pins can land on top |
| **Gate 3 FAIL — `sagasQueryUtils` undefined in the track** | **FIXED** (rewrote to established symbols) | ch.3 creates only `ordersClient` / `baseQueries` / `ordersQueryUtils`; the symbol exists nowhere in the repo. Rather than invent a sagas service client the track has no reason to build, the ch.5 page drops the dehydrated seed entirely — `useLiveQuery` reads a StreamDB collection, not a query key, and `preload()` is its warm-up, so the seed was populating a cache nothing on the page reads. `.withResource` now resolves `getStreamsUrl()`, keeping the builder demonstration honest. A new callout explains why chapter 4 seeds and chapter 5 does not |
| **Gate 3 FAIL — false `OrderCreated` causal claim** | **FIXED** | ch.2 has no saga, publish, or `OrderCreated` wiring. The order-create curl is replaced by `ns-sagas add saga demo --message-type=DemoStarted …` + `ns-sagas publish DemoStarted …` — verbs verified in `plugins/sagas/src/cli/command-types.ts:4-13` and `commands.ts:80-84`, and already used by storefront ch.4. Added the registry-reload restart note, and the troubleshooting callout now says an empty table means no instance exists yet |
| **Gate 3 FAIL — island claimed a `useQuery` never shown** | **FIXED** | The "live vs fetched" callout no longer asserts the island runs both. It states that this chapter builds only the live half, that the cache-first half would need a `createServiceClient` + `createQueryFactories` pair this track never creates, and points at ch.4 as the worked example. The Step 4 boundary snippet drops the unused `getIslandQueryClient`/`hydrateFromDehydrated` imports and types its props |
| **Gate 3 FAIL — incomplete `--help` listings** | **FIXED** | Verified against live `deno run -A packages/cli/bin/netscript.ts --help`. Both lists now carry all fifteen groups in CLI print order, including the `ui:list` / `ui:update` / `ui:remove` I had missed |
| **Gate 4 FAIL — track not executable chapter-to-chapter** | **RESOLVED** | Consequence of the two ch.5 findings above; ch.5 now depends only on what chs.1–4 build |
| Gate 1 minor — `utils.ts` called a "two-line re-export" | **FIXED** | It is a typed wrapper/factory. ch.4 now says "a thin wrapper that calls the package builder with the app's `State` type applied" |

Nothing was declined.

### Commits (fix round)

```
547456b3c docs(tutorials): ch.5 builds only from symbols the track creates (Refs #1208)
716581854 docs(tutorials): make the port narrative match the allocator (Refs #1208)
1bf5345f6 docs(tutorials): complete the --help command-group lists (Refs #1208)
```

Pushed: `b9ff199d1..547456b3c` → `docs/tutorials-sweep`.

### Gate evidence (fix round)

| Gate | Result |
| --- | --- |
| `cd docs/site && deno task build` | **exit 0** |
| `docs/site` `deno task check:links` | **30580 links / 214 pages, all resolve** |
| `docs/site` `deno task check:caveats` | **27 markers / 22 pages, all resolve** |
| root `deno task docs:links` | **docs=102, 0 broken links/anchors/orphans — OK** |
| root `deno task docs:accuracy` | **PASS** |

Acceptance-criteria checks from the audit's fix-cycle list:

| Criterion | Evidence |
| --- | --- |
| no `localhost:8094` unless auth is installed on host port 8094 | ten `:8094` references, all downstream of `netscript plugin install @netscript/plugin-auth --port 8094` (02-auth.md:63) |
| no unpinned Aspire app endpoint claimed FNV/project-derived | both surviving allocation callouts state the app pins no host port and Aspire allocates at runtime |
| no absolute cross-workspace collision-free promise | `grep -rni "never collide\|no two workspaces\|cannot collide"` over the tutorials returns only an unrelated MCP tool-name line in chat/05 |
| ch.5 uses only established symbols | `grep -rn sagasQueryUtils docs/site --include=*.md` → no hits |
| a real action produces the saga instance used as proof | `ns-sagas add saga` + `ns-sagas publish`, verbs verified in the sagas plugin CLI source |
| `--help` prose complete | both lists match live `--help` output, fifteen groups |
| fresh build + `docs:links` evidence | above, both exit 0 |

Changed-file audit (fix round): 12 files, all under `docs/site/tutorials/`. No `packages/`, no
`plugins/`, and `git log --name-only 1bf5345f6^..HEAD` shows zero `deno.lock` occurrences.
