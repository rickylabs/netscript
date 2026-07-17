<!-- seed:plan-unified-runtime slot:UR-1 -->

# UR-1 — Single logical composition root with no application-created loopback

- **Slot:** UR-1
- **Owning pack:** D1 composition-host (draft D1-1)
- **Labels:** `type:feat`, `area:service`, `area:deploy`, `epic:unified-runtime`, `epic:deployment`, `priority:p1`, `wave:v1`, `status:plan`
- **Milestone:** `0.0.1-beta.13`
- **Depends on:** UR-11 (architecture contracts — package/export boundary the root lives in)
- **Blocks:** UR-2, UR-4, UR-5, UR-10

## Body

> Part of #823
>
> <!-- seed:plan-unified-runtime slot:UR-1 -->
>
> Establish the composition root as the single module that wires the NetScript service, oRPC handler,
> and Fresh UI into one logical application graph. The universal invariant is **logical graph
> identity — one composition root**; physical single-OS-process execution is a per-preset capability
> (declared by the capability matrix UR-5/UR-6, not here). The invariant that holds on every preset is
> **no application-created loopback**: the graph is wired by in-process Fetch delegation, never by
> opening a socket back to the host's own listener. See design pack
> `design/D1-composition-host/proposal.md` §1.

## Acceptance / gates

- [ ] gate: build exposes exactly one composition root (a single mount/prefix/lifecycle registry)
- [ ] gate: no adapter or bridge opens a loopback HTTP client to the host listener
- [ ] gate: physical single-process asserted only for presets whose capability cell declares `process: in-process`
- [ ] gate:e2e composed entry point boots and serves the graph through one root

## Fork deltas

None.
