# eis-chat build sequence → teachable exercise-first arc

Source: Fork A (this session, agent report already delivered and captured — not re-fetched from its
output file), reading `docs/PRODUCT.md`, `ARCHITECTURE.md`, `BUILD-PLAN.md`, `PHASE-1..7-*.md`,
`PHASE-5-NOTES.md`, `HANDOVER.md` in the eis-chat reference export, cross-checked against the real
source tree (`services/eischat`, `contracts/versions/v1/*.contract.ts`, `packages/channel/mod.ts`,
`workers/`, `streams/notifications-stream.ts`, `plugins/channel-sync/`, `database/sqlite`,
`apps/dashboard/`, `aspire/`).

## The critical reconciliation finding

The `PHASE-1..7-*.md` docs read as if the project was originally built **pre-NetScript / directly on
tursodb**, not scaffolded from NetScript. `BUILD-PLAN.md`'s "Foundation decision" section is the
document that explains why: eis-chat was retrofitted onto a NetScript scaffold after an initial
non-framework prototype, and the PHASE docs are a mix of pre- and post-scaffold narrative. **A
tutorial rewrite must tell the post-scaffold story only** — i.e., start from `netscript init`, not
from eis-chat's actual literal git history — or it will silently teach a non-NetScript-idiomatic
build order (e.g. hand-rolled tursodb wiring before contracts exist, which is backwards from the
doctrine's contract-first axiom, A2/A3 in `netscript-doctrine`).

## Real seam inventory (verified against source, not just docs)

| Seam | eis-chat usage | NetScript primitive taught |
|---|---|---|
| Contracts | `contracts/versions/v1/*.contract.ts` | oRPC `defineService`/contract-first API definition |
| Typed client | dashboard + desktop consume the contract | `@netscript/sdk` typed client generation |
| Background jobs | `workers/jobs/*`, `workers/tasks/*`, `enqueueJob` | `workers` plugin: job handlers, single-writer discipline around tursodb |
| Durable live-query | `streams/notifications-stream.ts` | `streams` plugin: durable live-query / SSE-style push |
| App-level plugin (non-first-party) | `plugins/channel-sync/` | Illustrates the "bespoke app plugin" pattern vs first-party `workers`/`sagas`/`triggers`/`streams` — worth calling out explicitly since it is NOT itself a reusable first-party plugin archetype |
| Dual-database pattern | `database/sqlite` (Prisma, org-catalog) + per-channel tursodb | Two distinct persistence needs in one app — a strong, concrete teaching moment for "not everything is one database" |
| Desktop shell | `deno desktop` wrapping (per `DESKTOP-SHELL.md`) | Out of scope for the 4 core tracks per topic-C framing (desktop is Topic E's concern) — flag as excluded, not silently dropped |
| Orchestration | `aspire/` | Aspire start/restore, already a first-class NetScript CLI concern |

## Proposed teachable arc (raw material, not a locked outline)

1. **Foundation**: `netscript init` → first contract (`defineService`) → SDK client wired to a
   minimal handler. Maps to eis-chat's contracts layer. Literal checkpoint: a typed client call
   returns real JSON from a running service.
2. **Persistence**: introduce the primary datastore, choose one engine, land the first real read/write
   path through the contract. Maps to eis-chat's org-catalog/Prisma layer (the dual-database story is
   optional depth, not required for every track — see `candidate-tutorial-mappings.md` Option A vs C
   for whether dual-DB is a core-4 chapter or reserved for the minimal/full eis-chat tutorial only).
3. **Background work**: `workers` plugin, `enqueueJob`, a job handler that does something observable
   (send/process/transform). Maps directly to eis-chat's `workers/jobs`. Literal checkpoint: a log
   line or side effect proving the job ran async.
4. **Live/durable delivery**: `streams` plugin, a durable live-query the reader can watch update in
   real time. Maps to `streams/notifications-stream.ts`. Literal checkpoint: two terminal/browser
   tabs, one mutates state, the other observes the push without a manual refresh.
5. **(Optional, minimal-eis-chat-tutorial only) Desktop wrap** — explicitly out of the core-4 scope
   per topic-C, callable out as "if you want to go further" rather than embedded.

This 4-step spine (Foundation → Persistence → Background work → Live delivery) is a strong candidate
skeleton for **any** of the 4 rewritten tracks regardless of which domain narrative wraps it (see
`candidate-tutorial-mappings.md`) — it is the seam order eis-chat itself actually proves out, and it
matches the doctrine's own dependency order (contracts before adapters before background/state
machinery, per `03-base-and-derived-classes.md`/A2-A3).

## eis-chat docs writing-style assessment (secondary requirement from the task prompt)

- `PRODUCT.md` and `ARCHITECTURE.md` are prose-first, concept-oriented — good models for a tutorial's
  opening framing paragraph, not for chapter body structure.
- `PHASE-*.md` files are worklog-style (what was built, in what order, with what caveats) — useful as
  *raw material* for extracting the real build order, but not directly reusable as reader-facing
  tutorial prose; they read as internal build journal, not didactic material aimed at a third party.
  A direct lift would violate the exercise-first/Medusa-tone bar; this must be re-authored, not
  copied.
- `HANDOVER.md` reads as an operational runbook (deploy/restart/troubleshoot) — good source material
  for a "Deploy" or "Operate" closing chapter (mirrors `storefront/06-deploy` in the existing site),
  not for early chapters.
- Screenshots in `docs/assets/*.png` (9 real screenshots + 1 example-input image) are genuine visual
  evidence of a working app — directly reusable as chapter-closing "what you built" checkpoint images,
  consistent with the Medusa/Rails "literal observable checkpoint" pattern found in
  `research/C-tutorials/`.
