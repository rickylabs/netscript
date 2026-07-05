# Topic E — Deno-desktop + unified single-process deployment

**Kind:** rescope · **Milestone:** beta.8 / stable · **Epic:** `#327` (existing deployment epic) · **Status:** rescope `#375` + `#349`

## §1 Owner's original brief (verbatim intent — PRESERVE, DO NOT DILUTE)

- **Deno desktop** support + **unified deployment / single-process** mode.
- **Ship NetScript apps on end-user devices as a 1-click package.**
- **Offline-first.**
- Path: **prototype → multi-process** (start from a working prototype, evolve toward the full
  multi-process story).

## §2 Ratified decisions for this topic

- **Extend `#327`** (deployment epic) with this as a **4th tier**; **fold in `#375`** (deno-desktop
  generator support) and **`#349`** (RFC-14 unified-mode + Nitro deno_server).
- Milestone **beta.8 or stable**, **low priority** — but **ships FULLY**: single-process + desktop +
  offline-first bundle as ONE complete tier. **Do NOT split** single-process-early / desktop-later
  (this overrides earlier research that proposed a split). "When it ships it ships FULLY."

## §3 eis-chat reference (see `specs/02`) — the spike is ALREADY DONE

`docs/DESKTOP-SHELL.md` (#118, PR #125) is the working reference:
- Verified ~88MB `deno desktop` Windows binary; tray + gated auto-update
  (`apps/dashboard/lib/desktop-chrome.ts`, lint-clean via local structural type — no `any`/ambient
  aug); per-user data dir; Aspire dev-stack resource POC (`aspire/PROPOSED-desktop-resource.md`,
  `register-apps.mts`, `AddTaskBackedApp`).
- `.agents/skills/aspire-deployment/` references (aws/azure/k8s/docker-compose/cicd/preflight).

## §4 Delegated to Fable

- The prototype→full sequencing within the single "ships fully" tier, and whether the
  `@netscript/sdk` link-mode work (below) is its own precursor epic/slice or a sub-slice of `#327`.

## §5 Dependencies / constraints — **load-bearing**

- **True single-process ⇦ `@netscript/sdk` link-mode + tursodb single-writer relocation (= the
  172a-2 service-base-seam).** eis-chat's DESKTOP-SHELL S1 proves it: option (c) requires exporting
  the oRPC router as an **in-process fetch handler the dashboard mounts** (no HTTP port) + moving the
  DB single-writer in-process. Hard constraint: tursodb native driver holds an **exclusive OS file
  lock per DB** (os error 33 on double-open). **This must land before beta.8.** **Confirm current
  172a-2 status.**
- **Foundation: `#393`** (Aspire compose target not registered — compose lane dead) + **`#394`**
  (no deploy-target e2e coverage; **bare-metal-first** per R4) — both beta.3, p1.
- **Windows `Deno.autoUpdate()` STAGES but does not APPLY** (macOS/Linux only) → ship a manual-update
  fallback + release server (`latest.json` + bsdiff + signing).
- Native-addon-in-VFS is unproven for tursodb + Prisma engines (the (a) "bundle+spawn all services"
  path) — treat as a spike, not a slice.

## §6 What B (Sonnet 5 workflow) must research for this topic

- `deno desktop` full surface (2.9): detection, VFS embedding, cross-compile `--target`, auto-update
  per-OS, tray/chrome. `research/E-desktop/`.
- `#327`/`#375`/`#349`/`#393`/`#394` live bodies + the deployment epic's existing tiers. `analysis/E-desktop/`.
- `@netscript/sdk` current client model (HTTP-only `createServiceClient`) + what link-mode requires;
  172a-2 service-base-seam status. `analysis/`.
- RFC-14 unified-mode + Nitro deno_server prior art. `matrix/` + `research/`.

## §7 What Fable must produce for this topic

- `#327` rescope: the 4th tier as sub-issues (desktop shell, single-process/link-mode, offline-first,
  1-click packaging + release server), folding `#375`/`#349`, with the `@netscript/sdk` link-mode
  precursor sequenced before beta.8, and `#393`/`#394` as foundation. Milestone beta.8/stable.
- A concrete single-process design proposal (Opus 4.8 deep-dive) grounded in eis-chat's DESKTOP-SHELL
  option (b)→(c) path.
