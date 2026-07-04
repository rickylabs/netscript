# Topic E — open questions (owner + cross-topic)

Resolved-in-design items are NOT listed here (172a-2 misattribution → struck; precursor = own issue;
b→c "no split" reconciliation; #349 push-back). These are the items that need owner confirmation or
cross-topic coordination before/at ratification.

## Owner-facing (carry to ratification)

- **O-OWNER-1 — `0.0.1-beta.8` milestone does not exist.** Like the beta.6/beta.7 gap (Stage-C
  forks), the beta.8 GitHub milestone must be created before any E issue can be filed (AGENTS.md
  obligation). Owner creates it at ratification.
- **O-OWNER-2 — #375 promotion.** Confirm promoting #375 from **Backlog/Triage `priority:p3`** →
  **`0.0.1-beta.8` `priority:p2`**, folded into #E2 (`Closes #375`). Evidence: the eis-chat spike is
  done; #375 is "generalize the POC into the generator" — small and well-scoped.
- **O-OWNER-3 — #349 scope (PUSH-BACK).** Spec §2 says "fold in #349." Evidence
  (`offline-first-surface.md`, `rfc14-nitro-packaging-prior-art.md`) shows #349 is **tier-3 serverless
  (Nitro `deno_server`)** — a different "unified" sense than desktop single-process. Recommendation:
  **co-locate #349 as a WATCH sibling under the rescoped #327, do NOT merge its serverless scope into
  the desktop Tier-4.** Confirm this interpretation of "fold in."
- **O-OWNER-4 — #327 WATCH→Tier-4 reclassification (drift E2).** Confirm adding the new Tier-4 to
  #327 and moving `deno desktop` out of the WATCH bucket. This is real work, not a note — #327's live
  body (updated 2026-07-03/04) currently contradicts the "ships fully" mandate.
- **O-OWNER-5 — "ships fully at beta.8" vs low priority.** The design shows the capability is
  credibly complete at beta.8 (server seam ships; adapter ~1 file; tursodb avoids the VFS spike). But
  it is low priority and the last-mile risks (O-2) are real. Confirm beta.8 as the capability
  milestone with stable holding only the deploy-e2e gate + signing automation — vs pushing the whole
  tier to stable if beta.8 capacity is tight.

## Cross-topic (coordinate with Topic-A dashboard / Topic-B telemetry)

- **O-4 (Topic-B telemetry) — single-process telemetry export.** In the shipped single-process
  binary there is **no Aspire collector at runtime**. The in-process link preserves W3C trace
  propagation (spans are produced), but where do they go? Needs a local exporter / bundled trace view
  or a configurable OTLP endpoint. Coordinate with the telemetry-revamp epic's `OTEL_DENO`-thin
  fork + the dashboard query/export surface — the dashboard-as-desktop case may want to consume its
  own in-process telemetry. Does not block the beta.8 SDK/tursodb slices; it shapes #E4/#E5 UX.
- **O-A (Topic-A dashboard) — the dashboard IS the desktop shell.** The dev-dashboard PLUGIN (beta.6)
  is the natural payload of the desktop binary. Confirm the desktop tier packages the dashboard
  plugin (option (b) dev resource + option (c) ship), and that fresh-ui L3-blocks promotion (D-NSONE)
  is not on E's critical path (it is Topic-A's, earlier at beta.6 — desktop consumes the result).

## Technical (resolve during implementation, not owner-facing)

- **O-1 — sdk↔service `ServiceApp` type dependency.** Either `@netscript/sdk` imports `type
  {ServiceApp}` from `@netscript/service`, or mirrors its 2-method structural shape locally. Decide in
  #E1 by the doctrine dependency-direction rule; record rationale. (Structural mirror keeps sdk free
  of a service dependency, consistent with how service mirrors Hono/oRPC — likely the doctrine-clean
  choice, but verify the existing sdk→service edge first.)
- **O-2 — Prisma engine in a packaged desktop binary.** Bounded validation in #E3: does the Prisma
  query engine + tursodb native driver run correctly inside a `deno desktop`-packaged binary against
  a real-FS per-user data dir? Expected yes (normal Deno process, non-VFS path), but unproven. If it
  fails, it becomes a scoped spike, not a silent blocker.
- **O-3 — `desktop.backend` config field ignored (suspected Deno bug).** `--backend cef` CLI flag
  works; the config field is silently ignored on Windows 2.9.0. Worth an upstream Deno issue; #E2
  must emit the CLI flag regardless.
- **O-6 — native-addon-in-VFS spike (option (a) only).** Parked, NOT on the beta.8 critical path.
  Only relevant if NetScript later pursues option (a) (bundle+spawn all services in one binary).
  Option (c) (this design) does not need it. Keep as a WATCH research item.
