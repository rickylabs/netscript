# eis-chat DESKTOP-SHELL architecture ladder (options a/b/c)

Source: `C:\Dev\repos\netscript-framework\.llm\tmp\eis-chat-ref\docs\DESKTOP-SHELL.md` (read in
full, ~308 lines; #118, PR #125/#136 — "the spike is already done"), plus
`aspire/PROPOSED-desktop-resource.md` (read in full) and issue #375 (live, current state — see
`issue-graph-deployment-epic.md`).

## The hard constraint that shapes all three options

> "The native tursodb driver holds an exclusive OS file lock per DB (os error 33 on double-open).
> eis-chat is therefore a single-writer architecture; only eischat opens `data/channels/<id>.db`
> and the SQLite catalog; everything else... reaches the data plane through eischat over HTTP."

This is not a design choice eis-chat made for other reasons — it's a hard driver-level constraint.
Any architecture where more than one OS process wants to touch the same tursodb file will hit this.

## Option (a) — bundle + spawn all services inside the VFS

Package every backend service (including the data-owning `eischat` service) inside the desktop
binary's embedded VFS and spawn them as child processes/in-process modules at launch.

- **Status: unproven, high risk.** Whether tursodb's native driver (and Prisma, which sits on top)
  works correctly when loaded from Deno's self-extracting VFS embedding (rather than a normal
  filesystem path) has **not been tested**. This is flagged in DESKTOP-SHELL.md as a spike
  candidate, not a validated path.
- Even if the native-addon-in-VFS question resolves favorably, this option does not remove the
  single-writer constraint — it just relocates where the one writer process runs (inside the
  desktop binary instead of externally). Multiple *spawned* services under one binary are still
  multiple OS processes unless they're collapsed into one (which is option (c), not (a)).

## Option (b) — dashboard-only desktop + separately-run services (ADOPTED for Phase-1 MVP)

The desktop binary hosts **only** the dashboard/UI process. All backend services (including
`eischat`, the single tursodb writer) continue running as ordinary separately-launched processes,
reached over `127.0.0.1` HTTP — exactly the same topology the dashboard uses when run as a normal
web app, just with a native window wrapped around it.

- **Status: shipped, adopted, in production for Phase-1 MVP.** This is the direct, validated
  precedent.
- **Matches `deno desktop`'s documented model exactly**: `deno desktop` expects one `Deno.serve()`
  process per binary, serving a UI that a webview navigates to; it is not designed to orchestrate
  multiple independent backend processes from inside one binary. Option (b) sidesteps that mismatch
  entirely by keeping the multi-service topology external to the desktop binary.
- Concretely realized via Aspire: the desktop window is registered as a task-backed `addExecutable`
  resource (`aspire/.helpers/register-apps.mts`, the `PROPOSED-desktop-resource.md` block), getting
  the same `services__<name>__http__0` service-discovery injection as any other app, but with no
  bound HTTP endpoint of its own — mirroring the private `netscript-start` .NET AppHost's
  `AddTauriApp` pattern.
- **This is the option issue #375 is asking NetScript to generalize into a first-class generator
  primitive.** No architecture change to `@netscript/sdk` or tursodb is required for (b).

## Option (c) — in-process/embedded subset

Collapse (at least) the data-owning service into the **same process** as the desktop
window/dashboard: export the oRPC router as an in-process fetch handler (using the
`@netscript/service` `build()` → `ServiceApp` seam — see `sdk-link-mode-and-service-seam.md`), and
move the tursodb single-writer handle in-process alongside it.

- **Status: genuine architecture change, out of scope for Phase 1.** This is the option that
  requires the `@netscript/sdk` link-mode adapter (client-side gap, described in
  `sdk-link-mode-and-service-seam.md`) plus moving tursodb ownership into the desktop process.
- **This is the option that actually delivers "true single-process desktop."** Options (a) and (b)
  both still involve multiple OS processes; only (c) collapses to one process, one tursodb writer,
  one address space — which is also the shape that lines up cleanly with Turso Sync's "one local
  writer per device, synced to cloud" model (see `offline-first-surface.md`).
- No implementation of (c) exists yet anywhere in the codebase or issue graph found in this
  research pass. It is a plan-stage concept in DESKTOP-SHELL.md, not a tracked GitHub issue.

## Ladder summary (evidence, not a sequencing verdict — delegated to supervisor)

| Option | Processes | tursodb fit | `@netscript/sdk` change needed | Status |
| --- | --- | --- | --- | --- |
| (a) bundle+spawn in VFS | multiple, collapsed into one binary | unproven (native-addon-in-VFS spike needed) | none | not attempted |
| (b) dashboard-only + external services | multiple, external | works today (unchanged topology) | none | **shipped, adopted** |
| (c) in-process/embedded | one | clean (one process = one writer) | **yes — the link-mode adapter** | not started, plan-stage only |

The prototype-vs-full sequencing *within* this ladder (e.g., ship (b) generalized as the NetScript
generator primitive first, treat (c) as a separate later epic) is explicitly delegated to the
supervisor per this task's boundaries — this file gives evidence for each rung, not a
recommendation on order.
