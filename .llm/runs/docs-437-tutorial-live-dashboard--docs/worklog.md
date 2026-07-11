# Worklog — docs/437-tutorial-live-dashboard (C4, epic #401)

Branch: `docs/437-tutorial-live-dashboard` from `9be23cce2cf65179df6aea39371f25cbddb55bcb`.
Lane: Claude docs-authoring workflow under the beta-7 shipping orchestrator (documentation-authoring
exception). Scope: `docs/site/tutorials/live-dashboard/` only.

## Plan

Design sources read: `design/CD-docs/proposal.md` §3.0–§3.6 (esp. §3.2 Track 4: "rewrite is mostly
narrative re-grounding, not structural; keep slugs"), `epic-and-issues.md` §3 C4 row + C-common bar,
`research/C-tutorials/medusa-inspired-writing-style-contract.md`,
`analysis/C-tutorials/02-eis-chat-build-arc.md`, `analysis/B-telemetry/eis-chat-real-pipeline-map.md`.

Slice contents (slugs preserved — no `_data.ts` edit needed):

1. **Premise re-grounding (all 7 pages).** Replace the stakes-free "my-dashboard" framing with a
   real live-orders operations narrative: a stale ops screen ships cancelled orders and lets failed
   payments sit unseen; polling is the band-aid the track removes. Thread the premise through every
   chapter intro/close.
2. **eis-chat grounding, mapped to shipped surface.** The C4 acceptance grounds the track in
   eis-chat's `notifications-stream` + channel live-query. Pipeline-map evidence
   (`eis-chat-real-pipeline-map.md` §3) shows eis-chat's `streams/notifications-stream.ts` is the
   *verbatim scaffold* that `@netscript/plugin-streams`' scaffolder emits — so the public-docs form
   of that grounding is the reader's own scaffolded `streams/notifications-stream.ts`
   (`defineStreamSchema` + `createDurableStream`, producer `upsert`/`flush`), and the live-query
   grounding is the shipped `useLiveQuery` StreamDB pattern (`createSagasStreamDB` is the typed
   StreamDB collection that ships today; user-defined streams consume over HTTP/SSE — per
   `durable-workflows/streams.md` and local `deno doc`). Chapter 5 keeps its no-polling
   self-updating table (acceptance) and gains the notifications-stream seam framing.
3. **IA link fixes (post-#433).** Retarget every `/capabilities/*` link to its pillar page
   (`fresh-framework`→`/web-layer/`, `services`→`/services-sdk/services/`,
   `database`→`/data-persistence/database/`, `streams`→`/durable-workflows/streams/`); use
   `comp.xref` for prose cross-links where the surrounding markup allows it.
4. **Exercise-first bar.** Remove the one comprehension checkpoint (ch3 "you can name the four
   helpers") and replace with an observable check; add cheap literal closers to ch5 steps that ended
   on prose. Fix the ch6 "We is precise" grammar defect.

API-claims verification (positioning law): all chapter-5 symbols traced via local `deno doc` of the
beta.7 workspace (registry fetch is min-dependency-date-gated in this environment; local packages
are version `0.0.1-beta.7`):

- `@netscript/plugin-streams-core`: `defineStreamSchema`, `createDurableStream`,
  `createServiceStreamProducer`, `DurableStreamProducer` (`upsert`/`delete`/`flush`),
  `getStreamsUrl`, `getStreamsAuth` — confirmed.
- `@netscript/fresh/query`: `useLiveQuery`, `useQuery`, `useMutation`, `useQueryClient`,
  `QueryIsland`, `dehydrateQueryClient`, `getIslandQueryClient`, `hydrateFromDehydrated` — confirmed.
- `@netscript/plugin-sagas` `./streams`: `createSagasStreamDB({ baseUrl? })`, `SagaInstance`,
  `sagasStreamSchema` — confirmed.
- No-in-process-`subscribe()` limitation for user streams: confirmed against
  `docs/site/durable-workflows/streams.md` (canonical pillar page) — chapter 5 does not claim one.

## Evidence

Files changed (all `docs/site/tutorials/live-dashboard/`, slugs unchanged; zero `_data.ts` diff):

- `index.md` — stakes-bearing live-orders premise (stale ops screen ships cancelled orders / hides
  failed payments; polling trades staleness for load); durable-stream seam framing tied to the
  streams-plugin scaffold; premise closure in "What you built".
- `01-scaffold.md` — premise threading; 2× `/capabilities/fresh-framework/` → `/web-layer/`.
- `02-contract-to-service.md` — `status` filter grounded as the ops-queue lens;
  `/capabilities/database/` → `/data-persistence/database/`, `/capabilities/services/` →
  `/services-sdk/services/`.
- `03-sdk-cache-first-query.md` — cache-first posture grounded in the ops premise; removed the
  comprehension checkpoint ("you can name the four helpers") for an observable focused
  `deno check` of the module.
- `04-definePage-QueryIsland.md` — optimistic-mutation stakes (double-advanced orders);
  `/capabilities/fresh-framework/` → `/web-layer/`.
- `05-live-stream.md` — intro re-grounded in the cancelled-order gap; sagas-stream callout now
  explains the typed-StreamDB rationale and points at the scaffolded producer seam; new
  "Point it at your own stream" section grounding `streams/notifications-stream.ts`
  (`netscript plugin install streams` scaffold — verified against
  `plugins/streams/src/adapter/resources/stream/stream.stub.ts` and
  `packages/cli/.../install-plugin_test.ts:748-759`); new literal Step-4 closer
  (`deno check` of the completed island); 2× `/capabilities/streams/` → `comp.xref cap:streams`
  (nested-in-callout pattern precedent: `observability/telemetry.md`, `identity-access/auth.md`);
  no-polling self-updating table deliverable intact (acceptance).
- `06-deploy.md` — fixed "We is precise" grammar defect; `/capabilities/streams|fresh-framework/` →
  `comp.xref`; premise closure.

Grounding note (C4 acceptance mapping): eis-chat's `streams/notifications-stream.ts` is verbatim
the streams-plugin scaffold (pipeline map §3), so the public-docs grounding is the reader's own
scaffolded stream; the channel live-query grounding maps to the shipped `useLiveQuery` StreamDB
live-table pattern that chapter 5 teaches. No eis-chat product-name claims added to public pages.

## Validation

`deno task verify` in `docs/site` — GREEN:

- build: `🍾 Site built into _site — 500 files generated in 8.44 seconds`
- check:links: `23018 internal links across 162 pages — all resolve`
- check:caveats: `27 caveat markers across 22 pages — all references resolve`

Rendered-output sanity: `ns-xref` present 3×/2× in built ch5/ch6 HTML, no literal `comp.xref`
leakage, xref resolves to `/durable-workflows/streams/`, new ch5 section renders.
