# Topic E — analysis (B2)

Exhaustive codebase + issue-graph analysis. Depth corpus for the Opus 4.8 deep-dive (stage D).

## Files

| File | Covers |
| --- | --- |
| `issue-graph-deployment-epic.md` | Live bodies/state of #327, #375, #349, #393, #394, #371; current tier structure of #327; what "folding desktop into a 4th tier" would mean; milestone/label ground truth. |
| `sdk-link-mode-and-service-seam.md` | `@netscript/sdk` `createServiceClient` surface, the link-mode gap, the already-implemented `@netscript/service` "RFC 14 unified-platform" seam, and the 172a-2 naming-collision finding (PR #172 status). |
| `eis-chat-desktop-shell-options.md` | The (a)/(b)/(c) architecture ladder extracted from `docs/DESKTOP-SHELL.md`, with evidence for each rung. |
| `offline-first-surface.md` | tursodb single-writer constraint, Turso Sync fit, the unified-vs-multi-process KV precedent (#371/#372), what "offline-first" concretely means for NetScript. |

## Top findings (see individual files for evidence)

1. **#327 (deployment epic) currently places `deno desktop` in WATCH / reference-only** — not
   scheduled in tier-1 (beta) or tier-2 (stable). This directly conflicts with the topic-E spec's
   premise that desktop ships FULLY at beta.8/stable. See `issue-graph-deployment-epic.md` §Drift.
2. **Issue #375** (the actual "lift eis-chat desktop to NetScript" ask) is `priority:p3`, milestone
   **Backlog / Triage** — unscheduled, not low-priority-but-planned.
3. **The sdk link-mode gap is narrower than assumed.** The hard part — a mountable, non-listening
   service app usable as an in-process fetch handler — already exists (`@netscript/service`
   `build()` → `ServiceApp`/Hono `.fetch`, explicitly built for "the RFC 14 unified-platform seam").
   Only a client-side `ClientLinkPort` adapter is missing from `@netscript/sdk`.
4. **"172a-2" is a naming collision, not a real dependency.** PR #172 (MERGED) is entirely about
   plugin contract/service type-soundness for the CLI scaffolder — unrelated to sdk link-mode or
   desktop single-process hosting.
5. **eis-chat already validated option (b)** (dashboard-only desktop + services over 127.0.0.1) in
   production as the Phase-1 MVP — this is the lowest-risk generalizable pattern.
6. **tursodb's exclusive-file-lock single-writer constraint is real and unavoidant** for any
   architecture where more than one process wants to open the same db file — this rules out option
   (a) without a native-addon-in-VFS spike (still unproven) and shapes what "true single-process"
   (option c) requires: exactly one process holding the db handle.
7. **Turso Sync does not remove the single-writer constraint** — it solves cross-*device*/cloud sync
   for one local writer, not cross-*process*-on-one-machine contention. It is a strong fit for a
   true single-process desktop app (one process = the one local writer) but irrelevant to the
   multi-process eis-chat topology today.
8. **The unified-vs-multi-process question already has a live, shipped precedent** at the KV/queue
   layer (#371/#372): unified mode = local in-process Deno KV (no shared resource); multi-process
   mode = shared Deno KV Connect / Garnet, generator-provisioned, zero SDK change. This is useful
   sequencing evidence, not a direct dependency, for the desktop single-process story.
9. Windows `Deno.autoUpdate()` limitation (stages, does not apply) is **verified accurate**, not
   spec drift.
10. `RFC-14`/`RFC 14` appears in exactly two independent places in the corpus with **no in-repo RFC
    document** backing either: (a) `@netscript/service`'s own "RFC 14 unified-platform" seam
    (shipped), and (b) issue #349's "RFC-14 unified-mode + Nitro" (WATCH, tier-3 serverless). Both
    likely reference the same external RFC concept as different downstream consumers — this is
    plausible, not confirmed; no upstream RFC text was found to cite directly.
