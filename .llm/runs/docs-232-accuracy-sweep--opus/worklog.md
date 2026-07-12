# docs-232-accuracy-sweep — worklog

- Run: docs accuracy sweep for issue #232 deferred items B, C, D, F + E decision
- Scope overlay: SCOPE-docs (docs-only; no `packages/`/`plugins/` source touched)
- Branch: `docs/232-accuracy-sweep` · base `eac57c5f`
- Supervisor/generator: Opus 4.8 (docs-authoring lane). Source verification via read-only sub-agents.

## Preflight

- `git rev-parse HEAD` = `eac57c5f…` ✓ · `tutorials/storefront/01-scaffold.md` exists ✓
- Key discovery: base commit `eac57c5f` already lands the bulk of #232. Several "deferred" items
  were already implemented in-tree; this run re-verified each against real source and closed the
  genuine remaining gaps rather than re-authoring completed work.

## Per-item evidence

### B — Sibling sweep

**B1. `tutorials/workspace/01-scaffold.md` — dashboard scheme `:18888` → `https://localhost:18888`.**
Model = the storefront fix (`storefront/01-scaffold.md` already uses `https://localhost:18888` in
intro, bring-up, and checklist). The bring-up code block (line ~150) was already `https`. Fixed the
two scheme-less references to match:
- intro "What you will build" — `open on :18888` → `open on https://localhost:18888`
- checklist — `green in the dashboard on :18888` → `at https://localhost:18888`

**B2. `data-table` → `data-grid` + prompt-input/dropzone copy.**
- The instruction named `how-to/customize-fresh-ui.md`, but that file contains no `data-table`
  string and its prompt-input/dropzone copy is already accurate (CSS auto-grow; drag+paste+multi-file).
  The real `data-table` occurrences live in `web-layer/fresh-ui.md` (L125/L219/L230).
- **DEVIATION (source-grounded).** Renaming `data-table` → `data-grid` as a `ui:add` target would be
  FALSE. Verified against `packages/fresh-ui/registry.manifest.ts`:
  - `data-table` is a live registry block, id `data-table` (manifest L987–1007), and a member of the
    `foundation` collection (L1252) and `dashboard-blocks` collection (L1347) — so the scaffold copies
    it and `netscript ui:add data-table` is valid/current. It is NOT deprecated in the manifest.
  - `DataGrid` is a **runtime package root export** (`packages/fresh-ui/src/presentation/data-grid.tsx`,
    re-exported by `mod.ts` L22–31), the successor to the DataTable block, imported directly — you do
    **not** `ui:add` it. There is no `data-grid` registry id (`ui:add data-grid` would fail).
  - Therefore the existing `data-table` references are accurate and were kept. Instead added a grounded
    clarification callout to `web-layer/fresh-ui.md` positioning `DataGrid` (runtime export, import not
    `ui:add`) as the successor to the copy-source `data-table` block, linking to the reference. This
    honours the intent (surface the data-grid direction) without inventing an API.
  - prompt-input/dropzone copy in `web-layer/fresh-ui.md` L219 already accurate (auto-grow; drag,
    clipboard-paste, multi-file) — no change needed. Verified against source: prompt-input textarea
    auto-grows via CSS `field-sizing: content` (no JS handler); dropzone ingests drop/paste/picker.

### C — fresh-ui/web-layer reference depth (already in base; verified accurate)

- **DataGrid reference** — already present as a full section in `reference/fresh-ui/index.md`
  (props, `DataGridColumn`, `DataGridRow` three-shape typing, cell variants, symbols, worked example).
  Verified line-for-line against `packages/fresh-ui/src/presentation/data-grid.tsx`: `columns`/`rows`
  contracts, `width` default `minmax(0, 1fr)`, cell variants `strong`/`num`, plain/button(`onSelect`)/
  link(`href` + `f-client-nav`) rows, root class `ns-data-grid`, `role="grid"`/`"row"`. Accurate.
- **Dropzone reference** — already present as a full section. Verified against
  `packages/fresh-ui/registry/components/ui/dropzone.tsx`: `DROPZONE_INGEST_SOURCES`
  `["drop","paste","picker"]`, `DROPZONE_REJECTED_REASONS` `["type","too-many"]`, prop defaults
  (`label` "Drop files or click to upload", `icon` `↑`, `multiple` false), `onFile`/`onFiles`/`onReject`,
  `DropzoneIngestDetails`, aria-live status, focus-required paste, picker value reset, root
  `ns-dropzone`. Accurate. Registry id `dropzone` (manifest L719–740). Accurate.
- **useIslandMutation optimistic sample** — NOT prose-only: `web-layer/query.md` L269–349 already
  ships a full worked `TodoIsland.tsx` optimistic-toggle-with-rollback sample (onMutate snapshot →
  setQueryData → return `{ previous }`; onError restore; onSettled invalidate). Matches the shipped
  scaffold template `packages/cli/.../ServiceShowcaseLab.memory.tsx.template` L55–86 and the executable
  lifecycle test `packages/fresh/src/application/query/mutation-lifecycle.test.ts`. `IslandMutationOptions`
  (query-types.ts L145–171) declares `mutationFn`+`onMutate/onSuccess/onError/onSettled`; rollback is the
  manual onMutate-context → onError pattern (no auto `rollback` field). Accurate — no edit.

### D — Aspire/telemetry coverage (already in base; verified accurate)

- Note: `capabilities/telemetry.md` is a redirect stub → real content `observability/telemetry.md`.
- **Browser logs default** — already covered in `observability/telemetry.md` (feature card L144–148 +
  callout L156–162). Verified in CLI source: generated apphost emits `await <id>.withBrowserLogs();`
  for `type === 'app'` resources with a Port
  (`packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-apps.ts:82-84`), and
  `Aspire.Hosting.Browsers` is pinned unconditionally
  (`generate-aspire-config.ts:121-122`; version const `scaffold-aspire.ts:35-38`). Accurate.
- **`aspire start --isolated` randomized ports** — already covered in `observability/telemetry.md`
  L178–180 and `reference/aspire/index.md` L13–18 (ephemeral `localhost:0` dashboard/OTLP/resource-service
  ports; `--isolated` randomizes + isolates secrets). Web-confirmed against upstream: Aspire 13.2 isolated
  mode assigns random ports for dashboard + service endpoints and per-instance user secrets
  (devblogs.microsoft.com/aspire isolated-mode post). Accurate — no edit.

### E — Streams SSE caveat (decision: dir exists → added)

- `docs/site/reference/streams/` exists (`index.md`). Per the item-E rule, added the caveat there.
- Added a concise browser-consumer caveat to `reference/streams/index.md` (after the "Not yet wired"
  note): no in-process `subscribe()`; browsers consume via HTTP/SSE (`EventSource`); HTTP/1.1 allows
  ~6 concurrent connections per origin so several long-lived streams from one page can starve requests;
  use HTTPS/HTTP-2 for many simultaneous consumers. Grounded in the capability page
  `durable-workflows/streams.md` L304–315 (existing caveat) and the EventSource read-side model L131.

### F — background-jobs "Where jobs come from" re-verify

- Real file is `background-processing/workers.md` L405–420 (`capabilities/background-jobs.md` is a redirect).
- Every concrete mechanic the callout states = VERIFIED ACCURATE against source:
  - file scan `workers/jobs` `*.ts` → single generated registry `.netscript/generated/plugin-workers/
    job-registry.ts`, keyed by filename — `plugins/workers/src/cli/registry-compiler.ts:18,20,39,74-77`
  - both `:8091` API service + background runner load it — `services/src/main.ts:48,51`; `bin/combined.ts:19-20`
  - registers before serving — `main.ts:50-51` precede `:53 .serve()`
  - separate runner process `bin/combined.ts` — `combined.ts:11`
  - missing registry tolerated as empty — `runtime/generated-jobs.ts:24-28,47`
- DRIFT (omission) fixed: the callout stated ordering but not the **precedence** rule. Actual rule
  (source): plugin jobs register first (`main.ts:50`), then the generated loader **skips ids already
  present** (`runtime/generated-jobs.ts:50-52` `if (existing) continue;`) — first-registration-wins;
  a user file reusing a built-in id leaves the plugin job in place. `packages/service/` carries only the
  generic `createPluginService` host, no job-source precedence. Added one grounded sentence to the callout.

## Validation

- `deno task docs:links` → `docs=96 broken-links=0 broken-anchors=0 orphans=0` — OK.
- Public-docs grep gate (`eis-chat|eischat|VIF|CSB|PR #|pull/[0-9]|dogfood|issues/[0-9]`) over all four
  touched files → **0 hits each**; whole `docs/site/` (excl. `_plan/` scratch) → no hits.

## Files changed

- `docs/site/tutorials/workspace/01-scaffold.md` — dashboard scheme (B1)
- `docs/site/web-layer/fresh-ui.md` — DataGrid runtime-export clarification (B2)
- `docs/site/background-processing/workers.md` — job-source precedence rule (F)
- `docs/site/reference/streams/index.md` — SSE browser-connection caveat (E)
- `.llm/runs/docs-232-accuracy-sweep--opus/worklog.md` — this file

## Drift

- Task premise vs base reality: items C and D were already implemented in base `eac57c5f`; this run
  verified them accurate rather than re-authoring. Recorded as evidence above.
- Task instruction "data-table → data-grid" not applied verbatim: `data-grid` is not a `ui:add`
  registry id (source: `registry.manifest.ts`). Applied the source-accurate alternative (keep
  `data-table`, add DataGrid runtime-export clarification). Severity: significant (instruction vs source).
