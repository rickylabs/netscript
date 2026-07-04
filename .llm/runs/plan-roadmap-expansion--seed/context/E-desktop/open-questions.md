# Open questions — Topic E (desktop + unified single-process deployment)

All unresolved questions surfaced during this research pass, for the supervisor/owner to
adjudicate. None are answered here — each links to the evidence file where the ambiguity is
documented in full.

1. **Does topic E's desktop scope mean "`deno desktop` as a full NetScript deployment target"
   (matching #327/#375's framing, currently WATCH/Backlog-Triage), or "dashboard-optionally-runs-
   as-a-desktop-shell" (matching eis-chat's shipped option (b))?** These may warrant different
   scheduling. See `analysis/E-desktop/issue-graph-deployment-epic.md` §Drift and
   `context/E-desktop/sequencing-notes.md` item 5.

2. **Is the topic-E spec's "beta.8/stable — ships FULLY" premise stale relative to #327's
   2026-07-03/04 WATCH verdict**, or is it intentionally a separate initiative not governed by
   #327's tier structure? See `analysis/E-desktop/issue-graph-deployment-epic.md` §Drift.

3. **What did the topic-E spec actually mean by "172a-2 service-base-seam"?** PR #172 (merged) is
   unrelated to sdk link-mode / in-process mounting. Was this a misattribution, a stylistic/pattern
   dependency, or a reference to a different PR/issue not identified in this research pass? See
   `analysis/E-desktop/sdk-link-mode-and-service-seam.md` §4 (options A/B/C offered, no verdict).

4. **Is "RFC 14" (in `@netscript/service`'s shipped seam) and "RFC-14" (issue #349's tier-3-
   serverless tracking issue) the same underlying external RFC concept applied to two different
   consumers, or an unrelated naming coincidence?** No upstream RFC document was found to confirm
   either way. See `analysis/E-desktop/INDEX.md` finding 10 and
   `matrix/E-desktop/prior-art-matrix.md`.

5. **Should NetScript attempt the native-addon-in-VFS spike for option (a)** (bundle+spawn multiple
   services inside one desktop binary), given it remains entirely untested, or should option (a) be
   dropped from consideration in favor of only (b) and (c)? See
   `analysis/E-desktop/eis-chat-desktop-shell-options.md`.

6. **Should NetScript document the Tauri/Electron-style installer/relaunch workaround for
   `Deno.autoUpdate()`'s Windows apply gap as an interim solution**, or wait for/track an upstream
   Deno fix? See `research/E-desktop/rfc14-nitro-packaging-prior-art.md`.

7. **Is the `desktop.backend` config-file field being silently ignored (vs the working `--backend
   cef` CLI flag) a NetScript-reportable Deno bug worth filing upstream**, given it blocks a clean
   config-driven (non-CLI-flag) Aspire generator integration for #375? See
   `analysis/E-desktop/issue-graph-deployment-epic.md` (#375 extraction).

8. **Should "offline-first" be scoped/marketed as strictly gated on architecture option (c)**
   (per `research/E-desktop/turso-sync-offline-first.md`'s conclusion), or is there an intermediate
   offline story achievable under option (b) that this research pass did not surface?

9. **Given #393/#394's evidence of false-closed epic checkboxes elsewhere in the deployment epic**,
   should the topic-E owner independently re-verify any #327 tier-1 "done" claims that topic E's
   plan might depend on, rather than trusting the checkbox state at face value?

10. **Is there appetite to promote issue #375 out of Backlog/Triage / `priority:p3`** given this
    research pass's finding that it's a smaller, well-evidenced, already-POC'd piece of work (the
    eis-chat spike is done; #375 is "generalize it into the generator")? This is squarely a
    prioritization call for the supervisor/owner, not something resolved by this research.
