<!-- seed:plan-unified-runtime slot:UR-6 -->

# UR-6 — Runtime-cell columns: three v1 cells + four-cell conformance suite

- **Slot:** UR-6
- **Owning pack:** D2 capability-matrix (drafts D2-S3, D2-S5, D2-S6)
- **Labels:** `type:test`, `area:cli`, `area:tooling`, `area:deploy`, `gate:e2e`, `epic:unified-runtime`, `epic:deployment`, `priority:p1`, `wave:v1`, `status:plan`
- **Milestone:** `0.0.1-beta.13`
- **Depends on:** UR-5 (capability framework)
- **Blocks:** UR-12 (epic acceptance)
- **Successor (separately milestoned):** **DD-RESEARCH** — new-platform Deno Deploy probe (see slot-map); at `0.0.1-stable`, NOT part of the v1 beta.13 acceptance.

## Body

> Part of #823
>
> <!-- seed:plan-unified-runtime slot:UR-6 -->
>
> One matrix issue with **per-cell acceptance** (per **F-12**), not one card per cell, so the "one
> deploy output across cells" story has a single acceptance surface.
>
> **v1 runtime cell set (three cells):**
> - **C1 `deno_server`** — bare-metal/container, long-lived; Node-built output launched
>   `deno run --unstable …`; broad perms audited (`research/nitro-v3.md` Deno-preset table row 2).
> - **C3 `node_server`** — Nitro default production output, long-lived Node process; no `--unstable`;
>   Redis/AMQP/PostgreSQL backings (`research/nitro-v3.md` row 4; `research/adapter-mapping.md` Queue
>   row).
> - **C4 `cloudflare_module`** — isolate/serverless representative, bounded window; platform adds
>   scheduled/email/queue/tail hooks (`research/nitro-v3.md` Cloudflare row). Representative choice is
>   **F-1**.
>
> **`deno_deploy` (formerly C2) is WITHDRAWN from the v1 cell set.** The corpus evidence targeted Deno
> Deploy **Classic** and its `deployctl` flow (`research/nitro-v3.md`), which — with the new
> platform's `deno deploy` build/runtime model — is a shutdown target: Classic and `deployctl` sunset
> **2026-07-20**, and the new platform does **not** support Deno queues. No corpus artifact validates a
> Nitro v3 output, queue binding, or database binding on the surviving platform. `deno_deploy` is
> therefore **not** a validated v1 cell; it is deferred to the **DD-RESEARCH** successor card (a real
> new-platform Nitro build/deploy/conformance probe, including any external queue/database bindings),
> which must complete before `deno_deploy` may re-enter the matrix. This is **F-2**.
>
> Author the conformance suite proving each **v1** cell's manifest against real behavior; include the
> Nitro version + compatibility-date pin and an upgrade-drift gate (beta maturity). The long-lived vs
> bounded-window axis is load-bearing (sagas, durable queue consumers, exclusive-lock writer
> ownership).
>
> Evidence: `research/nitro-v3.md` Board inputs 1–2 + Deno-preset table; `proposal.md` §1, §3, §4;
> **C2/`deno_deploy` withdrawal**: Deno Deploy Classic/`deployctl` sunset (Stage-F finding F1).

## Acceptance / gates

- [ ] gate: each of the **three** v1 cells (`deno_server`, `node_server`, `cloudflare_module`) ships a manifest and an executed conformance case asserting its declared L/P/U/saga mapping
- [ ] gate: an exact Nitro v3 version + compatibility-date is pinned and an upgrade drift check runs
- [ ] gate: `deno_deploy` produces **no** v1 capability claim; its column is marked withdrawn-pending-research and gated behind DD-RESEARCH
- [ ] gate:e2e the three-cell suite is green on the pinned Nitro version

## Fork deltas

**F-1 (isolate representative cell).**
- **A (default):** `cloudflare_module` (provider page names it; richest hook surface).
- **B:** substitute `vercel` / `netlify_edge` / `aws_lambda`; changes the C4 mappings in UR-9 and the
  conformance case here.

**F-2 (v1 cell set — 3-cell vs re-proven `deno_deploy`).**
- **A (default) — 3-cell v1:** ship `deno_server` + `node_server` + `cloudflare_module`; `deno_deploy`
  deferred to DD-RESEARCH at `0.0.1-stable`. Acceptance as written (three cells).
- **B — re-prove and include `deno_deploy` in v1:** requires DD-RESEARCH to complete and pass on the
  new platform first; the suite then becomes four cells and the withdrawn-column gate is replaced by a
  fourth executed conformance case. Milestone impact: pulls DD-RESEARCH into the beta.13 train.
