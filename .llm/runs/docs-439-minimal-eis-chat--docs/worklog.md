# Worklog — docs/439-tutorial-minimal-eis-chat (C6, epic #401)

Branch: `docs/439-tutorial-minimal-eis-chat` from `9be23cce2cf65179df6aea39371f25cbddb55bcb`.
Lane: Claude documentation-authoring workflow (CLAUDE.md documentation exception), under the
beta-7 shipping orchestrator (`df71d36c`). Orchestrator owns PR lifecycle; this run commits + pushes
only.

## Plan

Author the NEW minimal-eis-chat on-ramp track (design §3.2 Track 6, Shape 2 architecture-tour
funnel): single-sitting `scaffold → one contract → one worker → one stream → done`, post-scaffold
story only, closing with a map into the 5 deep tracks.

Files:

- `docs/site/tutorials/eis-chat/index.md` — track index (single-sitting promise + arc + funnel).
- `docs/site/tutorials/eis-chat/01-scaffold.md` — `netscript init mini-chat` (no db, no example
  service) + `plugin install worker/stream` + Aspire boot.
- `docs/site/tutorials/eis-chat/02-message-contract.md` — one `messages` contract on
  `baseContract` from `@netscript/contracts`; runtime-parse proof script.
- `docs/site/tutorials/eis-chat/03-deliver-worker.md` — one `deliver-message` job
  (`defineJobHandler`), triggered over the documented workers API (`POST …/jobs/<id>/trigger`),
  proven on the executions feed.
- `docs/site/tutorials/eis-chat/04-live-stream.md` — one durable stream
  (`defineStreamSchema` + `createDurableStream`), consumed over HTTP/SSE (`EventSource`),
  closing map back into eis-chat's full architecture + the 5 deep tracks.
- `docs/site/tutorials/index.md` — add the on-ramp lane to the featureGrid (minimal diff).
- `docs/site/_data.ts` — single nav line for `/tutorials/eis-chat/` (conflict hotspot — one line).
- `docs/site/_data/xref.ts` — `tut:eis-chat` + chapter keys (additive, per "new pages add their
  key here as they land").

## Evidence — API/claim verification (positioning law)

All present-tense API claims traced before authoring:

- `deno doc jsr:@netscript/contracts@0.0.1-beta.7`: `baseContract` ("Common oRPC contract
  primitive with NetScript's standard error map applied"), `COMMON_ERROR_CODES`
  (NOT_FOUND/VALIDATION_ERROR/…), `positiveInt`, `boundedString`, `OffsetPaginationQuerySchema`,
  `paginationLimit`, `paginationOffset`, `nonNegativeInt`.
- `deno doc jsr:@netscript/plugin-workers-core@0.0.1-beta.7`: `defineJobHandler`,
  `createSuccessResult`, `createFailureResult`, `JobDefinition`.
- `deno doc jsr:@netscript/plugin-streams-core@0.0.1-beta.7`: `defineStreamSchema`,
  `createDurableStream({ streamPath, schema, producerId, signal })`, producer
  `upsert`/`flush`/`close`, `getStreamsUrl`.
- `deno doc jsr:@netscript/ai@0.0.1-beta.7`: published (provider-registry runtime:
  `createAiRuntime`, `getModel`, `getModelProvider`, …) — referenced only in the closing map.
- CLI source at base commit (beta.7): public command is `netscript plugin install <kind> --name
  <name>` (`packages/cli/src/public/features/plugins/install/install-plugin-command.ts`); kinds
  `worker`/`stream` exercised in `install-plugin_test.ts`. Plain `netscript init` scaffolds the
  contracts workspace (deno.json + mod.ts + versions/v1/mod.ts empty aggregate —
  `contract-scaffolder.ts` `scaffoldFull`, `v1-empty.ts.template`); contract template imports
  `baseContract` from `@netscript/contracts` (embedded template), NOT a local `shared.ts` (the
  storefront track's `shared.ts` import is playground-repo-specific; the on-ramp uses the
  package import that the beta.7 scaffold actually emits).
- Root import map after `plugin install` includes `@netscript/plugin-streams-core`
  (`workspace-mutator.ts` `PLUGIN_SERVICE_SOURCE_IMPORTS`) — so root-level `scripts/` resolve it.
- Endpoints reused from already-published docs (verified corpus): workers API `:8091`
  (`/health`, `POST /api/v1/workers/jobs/<id>/trigger` with `{ "payload": … }`,
  `GET /api/v1/workers/executions?limit=10`), streams runtime `:4437` (`/health`, HTTP/SSE read
  of the stream path via `EventSource`, `DURABLE_STREAMS_URL` override).

Note: `deno doc jsr:…@0.0.1-beta.7` initially failed under Deno 2.9's default minimum-dependency-age
(beta.7 published < 24h ago); verified from a scratch dir with `"minimumDependencyAge": "0"`.

## Evidence — validation

`deno task verify` in `docs/site` — GREEN:

- build: `🍾 Site built into _site — 515 files generated in 18.77 seconds`
- check:links: `23967 internal links across 167 pages — all resolve`
- check:caveats: `27 caveat markers across 22 pages — all references resolve`

Sanity: `_site/tutorials/eis-chat/` contains all four chapter dirs + index; output shape
matches the existing tracks (per-page `.md` copies are site-wide behavior);
`_site/tutorials/index.html` links the new lane.

## Acceptance mapping (issue #439)

- New `tutorials/eis-chat/` folder, single-sitting scaffold→contract→worker→stream→done: ✔
  (index + 01-scaffold, 02-message-contract, 03-deliver-worker, 04-live-stream).
- Post-scaffold story only: ✔ — the track starts at `netscript init mini-chat`; no
  pre-NetScript build order anywhere.
- Closes with a map into the 5 deep tracks: ✔ — `04-live-stream.md` "The map: from
  mini-chat to eis-chat" apiTable (all 5 tracks) + honest-simplification notes.
- Lane added to `tutorials/index.md` featureGrid: ✔ (top item), plus a one-sentence
  on-ramp pointer in the "New to NetScript entirely?" paragraph (funnel duty).
- `_data.ts` nav: exactly one added line (`/tutorials/eis-chat/`, Tutorials section).
- xref: `tut:eis-chat` + 4 chapter keys added to `_data/xref.ts` (additive; new pages add
  their key as they land).
- Exercise-first: every step closes on a literal observable checkpoint (dry-run totals,
  `curl :8091/health` / `:4437/health`, `deno run scripts/check-message-shape.ts` output,
  executions-feed JSON incl. a deliberate failed execution, live tail printing a published
  message, `deno task check`).
- Positioning law: no throughput/honesty framing, no competitor comparisons, no unshipped
  claims; `@netscript/ai` referenced only as the published model-layer seam.
- Stale-version claims: none introduced; none present in touched pages.
