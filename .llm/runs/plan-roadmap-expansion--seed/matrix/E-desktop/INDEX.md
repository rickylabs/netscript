# Topic E — Desktop + unified single-process deployment: resource matrix (B1)

Stage-B deep-search output. Read alongside `analysis/E-desktop/` (B2, codebase/issue-graph depth)
and `research/E-desktop/` (B3, external distilled research). `context/E-desktop/` (B4) has
diagrams, sequencing notes, and `open-questions.md`.

## Files in this folder

| File | What it is |
| --- | --- |
| `deno-desktop-docs-matrix.md` | Matrix of all 18 local `deno desktop` doc pages (Deno 2.9), what each covers, and which topic-E research task it feeds. |
| `prior-art-matrix.md` | Matrix of packaging/updater/unified-platform prior art: Tauri/Electron updaters, Nitro `deno_server`, the in-repo RFC-14 "unified-platform" seam, Turso Sync. |

## How to use this matrix

Each row below points at a B2 (analysis) or B3 (research) file for depth. This file is breadth-only
— do not treat it as a verdict.

## Top-level resource map

| Resource | Kind | Status | Depth file |
| --- | --- | --- | --- |
| `deno desktop` official docs (18 pages, mirrored in eis-chat-ref) | Primary doc | Stable (Deno 2.9+) | `research/E-desktop/deno-desktop-full-surface.md` |
| eis-chat `docs/DESKTOP-SHELL.md` (#118, PR #125/#136) | In-repo spike write-up | Done, adopted (option b) | `analysis/E-desktop/eis-chat-desktop-shell-options.md` |
| eis-chat `aspire/PROPOSED-desktop-resource.md` | Concrete Aspire wiring proposal | Proposed, partially prototyped | `analysis/E-desktop/eis-chat-desktop-shell-options.md` |
| NetScript issue #327 (deployment epic) | GitHub epic, OPEN | Actively evolving (updated 2026-07-03/04) | `analysis/E-desktop/issue-graph-deployment-epic.md` |
| NetScript issue #375 (lift `deno desktop` to generator) | GitHub feat request, OPEN | `priority:p3`, milestone Backlog/Triage | `analysis/E-desktop/issue-graph-deployment-epic.md` |
| NetScript issue #349 ([Deploy-S13] RFC-14 unified-mode + Nitro) | GitHub tracking issue, OPEN | `wave:defer`, WATCH, milestone Backlog/Triage | `analysis/E-desktop/issue-graph-deployment-epic.md` |
| NetScript issue #393 (Aspire compose target dead) | GitHub bug, OPEN | `priority:p1`, milestone beta.3 | `analysis/E-desktop/issue-graph-deployment-epic.md` |
| NetScript issue #394 (no deploy e2e coverage) | GitHub test gap, OPEN | `priority:p1`, milestone beta.3, owner-ratified bare-metal-first | `analysis/E-desktop/issue-graph-deployment-epic.md` |
| NetScript issue #371 (shared Deno KV Connect resource) | GitHub feat, CLOSED | Landed; clarifies unified-vs-multi-process KV topology | `analysis/E-desktop/offline-first-surface.md` |
| `packages/service/mod.ts` + `docs/site/reference/service/index.md` ("RFC 14 unified-platform seam") | In-repo doc/code | **Already implemented**: `build()` → non-listening `ServiceApp` (Hono `.fetch`) | `analysis/E-desktop/sdk-link-mode-and-service-seam.md` |
| `@netscript/sdk` `createServiceClient` / `ClientLinkPort` | In-repo code | HTTP-only today; in-process link adapter missing | `analysis/E-desktop/sdk-link-mode-and-service-seam.md` |
| GitHub PR #172 ("172a-2" plugin contract/service base seam) | GitHub PR, MERGED | Unrelated to sdk link-mode (naming collision) | `analysis/E-desktop/sdk-link-mode-and-service-seam.md` |
| Nitro `deno_server` preset (nitro.build) | External framework preset | Requires `--unstable`; Node-emulation-on-Deno, not native `Deno.serve` | `research/E-desktop/rfc14-nitro-packaging-prior-art.md` |
| Tauri v2 updater (`latest.json` + Ed25519/Minisign) | External prior art | Mature, production pattern | `research/E-desktop/rfc14-nitro-packaging-prior-art.md` |
| Turso Sync (successor to libSQL embedded replicas) | External product | GA-track, offline-first, does not remove single-writer-per-file constraint | `research/E-desktop/turso-sync-offline-first.md` |
