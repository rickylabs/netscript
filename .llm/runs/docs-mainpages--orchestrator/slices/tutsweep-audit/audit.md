# PR #1222 tutorial-sweep audit

- **Lane:** `docs_audit`, opposite-family Codex audit of Claude-authored documentation
- **Effort:** medium (canonical route; the 21-file / 356-line changeset did not require the large-changeset escalation)
- **Worktree:** `/home/codex/repos/ns-tutsweep`
- **Branch / HEAD:** `docs/tutorials-sweep` / `b9ff199d170fb5cba94f9b64108197f49bb057a6`
- **Changeset:** `0b11ca47a..HEAD` (5 commits, 21 existing tutorial files; no added page)
- **Method:** evidence only. Commands were run against the checked-out source; generator claims were not used as evidence. No source edits or commits were made.

## Verdict

**FAIL_FIX**

The scaffold-bound `definePage` import correction and `getCachedEntry` nullability correction are accurate, and both requested regression commands pass. The changeset is not merge-ready because its port rewrite leaves `:8094` documented as an Aspire-reachable auth endpoint even though the plugin was not installed with `--port 8094`; it also misstates app-host allocation and promises collision freedom the allocator cannot guarantee. The new live-dashboard chapter-5 page depends on a `sagasQueryUtils` symbol never created by this track and claims chapter 2 publishes `OrderCreated`, which chapter 2 does not implement. The changed root `--help` listings remain incomplete.

## Requested gates

### 1. Import-path claim — PASS

Commands/evidence:

```text
rg -n "appUtilsTemplate|@app/utils\.ts|createDefinePage<State>" packages/cli/src/kernel -g '*.ts' -g '*.template'
sed -n '1,220p' packages/cli/src/kernel/assets/app/utils.ts.template
rg -n "import \{ definePage \}" docs/site/tutorials
```

Findings:

- `packages/cli/src/kernel/assets/app/utils.ts.template` imports the package builder as `createDefinePage`, declares app `State`, and returns `createDefinePage<State>()` from its app-local `definePage()` function.
- Scaffolded route templates (`routes/index.tsx.template`, `dashboard.tsx.template`, `health.tsx.template`, examples/design routes) and the dynamic `web-scaffold.ts` page generator emit the exact line `import { definePage } from '@app/utils.ts';`.
- The four current phase-1 tutorial snippets use that exact import in chat ch.3, live-dashboard ch.4/ch.5, and storefront ch.6. Importing the generic package builder directly would omit the scaffold's explicit `State` binding.
- Minor prose imprecision: live-dashboard ch.4 calls `utils.ts` a “two-line re-export.” It is a typed wrapper/factory, not literally a re-export, although the shown implementation fragment and the import recommendation are correct.

### 2. Port-drift fixes — FAIL

Commands/evidence:

```text
sed -n '1,260p' packages/cli/src/kernel/domain/scaffold/default-port-allocation.ts
rg -n -C 5 'allocateScaffoldDefaultPort' packages/cli/src
sed -n '55,110p' docs/site/tutorials/storefront/01-scaffold.md
sed -n '50,105p' docs/site/tutorials/live-dashboard/01-scaffold.md
sed -n '60,115p' docs/site/tutorials/workspace/01-scaffold.md
sed -n '55,180p' docs/site/tutorials/workspace/02-auth.md
rg -n '(:8091|:8092|:8093|:4437)' docs/site/tutorials -g '*.md'
rg -n '(localhost:[0-9]{4,5}|:[0-9]{4,5})' docs/site/tutorials -g '*.md'
```

Source result:

- The allocator is FNV-1a-shaped (`2166136261`, xor, `Math.imul(..., 16777619)`) and maps a project/resource key into inclusive `49152..65535`, probing only the caller-supplied `usedPorts` set.
- `:3001` (storefront products and workspace service) and `:3002` (live-dashboard orders) are genuinely pinned: their chapter-1 `netscript init` commands pass `--service-port`, and the live CLI describes that flag as an Aspire host-port pin.
- `:8094` is **not** genuinely pinned in the Aspire graph. Workspace ch.2 installs auth without `--port 8094`; `install-plugin.ts` therefore calls `allocateScaffoldDefaultPort(...)` and returns `hostPort: servicePort`. The later shell line `export PORT=8094` is not an `appsettings.json` host-port pin. Consequently the ch.2 and ch.6 `localhost:8094` curls and topology claims are remaining literal unreachable-port instructions under the documented `aspire start` flow. A correct fixed-port install would need the CLI's `--port 8094` option (or the docs must use the dashboard endpoint).
- The old literals `:8091`, `:8092`, `:8093`, and `:4437` are gone from the tutorial corpus, so that part of the sweep succeeded.
- The changeset's app-port wording is wrong. `generateAppsettings()` deliberately emits no app `HostPort` by default, and `generateRegisterApps()` calls `withHttpEndpoint` without a port so **Aspire allocates the host port at runtime**. The FNV-derived `appPort` in `write-app-files.ts` is the standalone process fallback, not the unpinned Aspire host endpoint readers copy from the dashboard. Statements that a scaffolded app's dashboard endpoint is a project-derived high-range port therefore conflate target fallback with host allocation.
- “Two workspaces ... never collide” / “no two workspaces ... collide” is not guaranteed. The finite hash range can collide across projects, and cross-workspace used-port sets are not shared. The source itself warns that explicitly pinned ports weaken `aspire start --isolated`.

Required fixes:

1. Either install auth with `--port 8094` before claiming/curling that host port, or replace every auth `:8094` endpoint with a dashboard-resolved placeholder.
2. Describe app host ports as Aspire runtime allocations; reserve “project-derived FNV port” for the standalone fallback/plugin allocations actually produced by the CLI.
3. Replace absolute collision-free promises with the actual behavior: deterministic distribution plus within-workspace linear probing, with collision still possible across workspaces/pins.

### 3. API accuracy — FAIL

Commands/evidence:

```text
rg -n -C 6 'getCachedEntry' packages/sdk -g '*.ts'
deno doc --filter definePage packages/fresh/src/application/builders/mod.ts
deno doc --filter useLiveQuery packages/fresh/src/application/query/mod.ts
deno doc --filter getStreamsUrl packages/plugin-streams-core/mod.ts
sed -n '1,220p' plugins/sagas/streams/factory.ts
rg -n 'sagasQueryUtils' . --glob '!docs/site/_site/**' --glob '!docs/site/_cache/**'
rg -n 'OrderCreated|saga|publish' docs/site/tutorials/live-dashboard/02-contract-to-service.md
deno run -A packages/cli/bin/netscript.ts --help
deno run -A packages/cli/bin/netscript.ts init --help
deno run -A packages/cli/bin/netscript.ts plugin install --help
```

Findings:

- **PASS — `getCachedEntry`:** both query-factory interfaces return `Promise<CachedEntry<T> | null>`, and `CacheQuery.getCachedEntry()` returns `null` on a miss. The tutorial's `undefined` → `null` correction is accurate.
- **PASS — base APIs:** `definePage`, `useLiveQuery`, `dehydrateQueryClient`, `hydrateFromDehydrated`, `getStreamsUrl`, and `createSagasStreamDB` exist on the shown public surfaces; the lifecycle methods used by the island (`preload(): Promise<void>`, `close(): void`) also match source.
- **FAIL — undefined query helper:** live-dashboard ch.3 creates only `ordersClient`, `baseQueries`, and `ordersQueryUtils`. The entire repository search finds `sagasQueryUtils` only in the new ch.5 snippet. No preceding instruction creates a sagas client/query factory, so `apps/dashboard/routes/.../sagas/index.tsx` cannot compile as written.
- **FAIL — false causal demo:** ch.5 says creating an order publishes an `OrderCreated` saga message and advances a saga. Ch.2 contains no `OrderCreated`, saga, or publish wiring. The prescribed curl therefore does not prove or trigger the claimed live update in the track readers actually built.
- **FAIL — incomplete island claim:** ch.5 says the showcase island runs both `useQuery` and `useLiveQuery`, but its island snippets never show a `useQuery` call consuming `inventoryInput`/the hydrated cache. The page passes props whose documented consumer is absent.
- **FAIL — incomplete changed `--help` listings:** live-dashboard ch.1 and workspace ch.1 now add `agent` and `config`, but live `netscript --help` also lists `ui:list`, `ui:update`, and `ui:remove`, which their purported command-group lists omit. The documented `init` options sampled in the touched pages do match live `init --help`.

Required fixes:

1. Add the missing sagas service client/query-factory setup (with an earlier-track step and compilable import), or rewrite the page seed to use an API that the track already created.
2. Add real `OrderCreated` publication/saga wiring before using the curl as a live proof, or use an existing sagas-plugin sample action that actually creates an instance.
3. Show the promised `useQuery` consumer or stop claiming/passing the unused inventory hydration path.
4. Make the changed root command listings complete, or label them explicitly as selected examples rather than the `--help` list.

### 4. Regression / track consistency — FAIL

Commands/evidence:

```text
cd docs/site && deno task build
deno task docs:links
rg -n 'sagasQueryUtils|OrderCreated|plugin install|--service-port|PORT=8094' docs/site/tutorials/live-dashboard docs/site/tutorials/workspace
```

Results:

- **PASS:** site build exited 0: `595 files generated in 25.74 seconds`.
- **PASS:** `deno task docs:links` exited 0: `docs=102 broken-links=0 broken-anchors=0 orphans=0`.
- **FAIL:** live-dashboard ch.5 contradicts the state produced by chs.2–3 (`sagasQueryUtils` absent; no order→saga publication), so the track is not executable chapter-to-chapter despite rendering and link integrity.
- **FAIL:** workspace ch.6 treats ch.2's ambient `PORT=8094` as an Aspire host-port pin, contradicting the CLI plugin-install/AppHost configuration path.

## Gate log

| Gate | Command(s) | Scope | Result | Findings | Proceeded |
| --- | --- | --- | --- | --- | --- |
| Site build (Lume) clean | `cd docs/site && deno task build` | Entire site at PR HEAD | PASS | Exit 0; 595 files generated. The workspace-membership notices were warnings, not build failures. | Recorded evidence only. |
| `deno task docs:links` | `deno task docs:links` | 102 source docs, links/anchors/orphans | PASS | 0 broken links, 0 broken anchors, 0 orphans. | Recorded evidence only. |
| Internal-wording grep | `git diff --unified=0 0b11ca47a..HEAD -- docs/site/tutorials \| rg --pcre2 '^\\+(?!\\+\\+\\+).*(PR #[0-9]+\|issue #[0-9]+\|Claude\|Codex\|harness\|generator\|changeset)'` | Added lines in all 21 changed files | PASS | No public-doc leakage on added lines. | Recorded evidence only. |
| Versionless-specifier scan | Changed-file `rg -n 'jsr:@netscript/'`; manual verification of every hit | All 21 changed files | PASS | All pinnable `jsr:@netscript/*` examples use `{{ releaseSpecifier }}`. | Recorded evidence only. |
| Command/API accuracy sampling | Live public `--help` for root/init/plugin-install; `deno doc`; focused source `rg`/reads | Every command/API family changed by this sweep | FAIL | Nullability/import APIs pass; ch.5 has missing track symbol and false publication claim; changed root help lists omit three live UI commands. | Flagged for generator. |
| Template ↔ generated drift | `deno task check:assets-barrel`; direct route/utils template comparison | CLI embedded assets and generated barrels; scaffold route imports | PASS | Task exited 0; generated asset barrel is current; route import lines match templates exactly. | Recorded evidence only. |
| Nav / front-matter wiring | `git diff --name-status --diff-filter=A ...`; first-line/front-matter scan; build + links | All 21 changed tutorial files and track indexes | PASS | No new/orphan page; every changed page retains front matter; prev/next/index links resolve. | Recorded evidence only. |
| Prose-quality pass | Manual whole-diff read plus focused claim grep | All changed prose, tables, callouts, commands | FAIL | “Never collide” is an unsupported absolute; scaffold app host allocation is misstated; `utils.ts` is called a re-export though it is a wrapper. | Flagged for generator. |
| Cross-page contradiction check | Focused reads/greps across each changed track and its earlier chapters | Entire changeset, especially live-dashboard and workspace | FAIL | Ch.5 assumes query utilities and order→saga publication not built earlier; workspace deploy misclassifies auth `:8094` as pinned. | Flagged for generator. |
| Import-path claim | CLI assets/templates + all tutorial `definePage` imports | Phase-1 page examples | PASS | Exact `@app/utils.ts` line and `State`-bound wrapper confirmed. | Recorded evidence only. |
| Port-drift claim | Allocator, appsettings/helper generators, plugin install source, corpus literal sweep | All tutorial tracks and CLI port producers | FAIL | Old plugin literals removed, but auth `:8094` remains unreachable under Aspire; app host allocation and collision guarantees are misstated. | Flagged for generator. |

## Fix-cycle acceptance

Re-audit should require all of the following before PASS:

- no `localhost:8094` instruction unless auth is actually installed/configured with host port 8094;
- no claim that an unpinned Aspire app host endpoint is FNV/project-derived;
- no absolute cross-workspace collision-free promise;
- a defined and type-checkable sagas query client/factory in the track, or a ch.5 page that uses only established symbols;
- an actually wired action that produces the saga instance used for the live proof;
- changed `--help` prose either complete or explicitly non-exhaustive;
- fresh exit-0 site build and `docs:links` evidence.

## Re-audit

- **Re-audit target:** `docs/tutorials-sweep` at `547456b3ce4750b78408e130322d52d9940d23ab`
- **Method:** acceptance-list recheck against current tutorial files and CLI/plugin source, plus fresh build and link executions. Generator assertions were not accepted as evidence.

### Per-finding status

| Original acceptance finding | Status | Re-audit evidence |
| --- | --- | --- |
| Ch.5 must use only symbols established by the track (or define a sagas query client). | **FIXED** | `rg -n 'sagasQueryUtils' docs/site/tutorials/live-dashboard` returned no matches. Ch.5 now constructs `createSagasStreamDB`, calls `preload()`, reads `sagasDb.collections.sagaInstance` with `useLiveQuery`, and closes the handle; the dead TanStack dehydration/query seed was removed. |
| The live proof must use an actually wired action that produces the saga instance it claims to show. | **NOT-FIXED** | The replacement commands themselves are real: `plugins/sagas/src/cli/commands.ts` defines `add saga`/`publish`; `LocalSagasRuntimeBackend.writeArtifactsAndGenerate()` writes the saga and regenerates its registry; `publish()` posts the message to the running sagas API; and `publishSagaMessage()` awaits the durable runtime. This can create a saga instance. However, the claimed live result is not wired end-to-end: `plugins/sagas/services/src/main.ts` calls `startSagasStreamMirror()` only once during post-listen startup, and `plugins/sagas/streams/producer.ts` performs a finite paged reconciliation then returns. Repository search finds the only `upsert('sagaInstance', ...)` in that startup reconciliation; no publish or transition path updates the stream after `ns-sagas publish`. Consequently ch.5's claims that a post-restart `publish` causes a row to appear/advance “without a page reload” and that the engine “mirrors that instance” into the subscribed collection are unsupported by current source. The acceptance item requires a wired action producing the instance **used for the live proof**, not merely a DB instance invisible to the already-running stream mirror. |
| `localhost:8094` instructions require auth to be configured with host port 8094. | **FIXED** | Workspace ch.2 now runs `netscript plugin install @netscript/plugin-auth --port 8094`. `install-plugin.ts` assigns `plan.port` to `servicePort`/`hostPort`, and `appsettings-entry-builders.ts` emits that value as `HostPort`; the documented `:8094` curls are therefore Aspire-reachable. The stale ambient `export PORT=8094` instruction was removed and host-vs-process-port wording is explicit. |
| Unpinned Aspire app endpoints must not be described as FNV/project-derived. | **FIXED** | Live-dashboard ch.4/ch.5/ch.6 and the other affected deployment prose now state that Fresh apps pin no host port and Aspire allocates it at runtime. This matches `render-ts-apphost.ts`, which omits `HostPort` by default. Plugin installer-selected ports remain accurately distinguished from app endpoints. |
| Remove absolute cross-workspace collision-free promises. | **FIXED** | Focused corpus searches found no remaining tutorial claim that workspaces “never collide” or that no two workspaces collide. Updated callouts explicitly say the finite range and workspace-local used-port set cannot guarantee cross-workspace uniqueness. |
| Changed root `--help` prose must be complete or explicitly non-exhaustive. | **FIXED** | The exhaustive live-dashboard and workspace lists now contain all 15 public groups registered by `createPublicCommandRegistry()`: `agent`, `config`, `deploy`, `init`, `contract`, `db`, `generate`, `marketplace`, `plugin`, `service`, `ui:add`, `ui:init`, `ui:list`, `ui:update`, and `ui:remove`. Other track wording remains explicitly illustrative (for example, “including”). |
| Fresh site build and link gates must pass. | **FIXED** | `cd docs/site && rtk proxy deno task build` exited 0 and generated 595 files in 18.49 seconds. `rtk proxy deno task docs:links` exited 0 with `docs=102 broken-links=0 broken-anchors=0 orphans=0`. |

### Re-audit gate result

| Gate | Commands | Result | Finding |
| --- | --- | --- | --- |
| Ch.5/API/live-path accuracy | Focused `rg` over ch.5 and `plugins/sagas`; source reads of sagas CLI backend, publish handler, service startup, and stream producer | **FAIL** | Missing query/dehydration symbols are fixed, and the new CLI verbs are valid, but no post-start saga mutation is propagated into the `sagaInstance` stream. The advertised live proof remains non-executable as written. |
| Port accuracy and corpus consistency | Focused `rg` over tutorial port/collision claims; source reads of plugin install/AppHost generation | **PASS** | Auth is genuinely pinned at host `:8094`; app allocation and collision language now match source. |
| Root CLI help accuracy | Tutorial list comparison with `createPublicCommandRegistry()` and live CLI command-tree inspection | **PASS** | All 15 public groups are present in the exhaustive changed lists. |
| Site build | `cd docs/site && rtk proxy deno task build` | **PASS** | Exit 0; 595 files generated. |
| Internal links | `rtk proxy deno task docs:links` | **PASS** | Exit 0; no broken links, anchors, or orphans. |

### Final verdict

**FAIL_FIX**

All original FAIL findings except the live-stream proof are fixed. To reach PASS, wire saga instance mutations into the `sagaInstance` durable stream (and verify the documented post-start `ns-sagas publish` flow), or change ch.5 to demonstrate a source-supported refresh/restart path without claiming immediate push. This is the second audit FAIL cycle and therefore requires supervisor escalation under the `docs_audit` profile rather than another unbounded audit loop.
