# Epic draft — DRAFT TEXT ONLY, NO GITHUB MUTATION

> Filing metadata (for the coordinator): title
> `Epic: Aspire 13.5 adoption and orchestration stabilization`; labels `type:umbrella`,
> `epic:aspire-13-5` (new — add to `.github/labels.yml` first), `area:aspire`, `area:cli`,
> `area:tooling`, `priority:p0`, `status:triage`; milestone `0.0.7`. **No closing keyword anywhere
> in this body.** Sub-issues are `[aspire-13-5 S<n>] …` with `Part of #<epic>`.

## Why

NetScript scaffolds a TypeScript Aspire AppHost and pins Aspire CLI/SDK **13.4.6** in fourteen
places (scaffold constants, CI env, three workflows, a policy test, skills, docs, fixtures). Aspire
**13.5.3** (2026-08-25) is current. 13.5 is not a dependency-only bump for us:

- **TypeScript AppHost is GA** with two APIs we have been waiting on: custom health checks
  (`builder.addHealthCheck` + `withHealthCheck`, unblocking #1280) and resource commands with typed
  arguments (`withCommand(..., { commandOptions: { arguments } })`, exposed as
  `aspire resource <r> <cmd> --<arg>`).
- **CLI/agent surface** we already depend on moved: `aspire stop --force`, orphan-AppHost cleanup in
  `ps`/`stop`, `aspire doctor --format Json` with structured checks, npm-installable CLI, faster
  TypeScript startup and `withBrowserLogs()` reliability fixes.
- **Aspire MCP** is now only `aspire agent mcp` (our `netscript agent init` wiring is already
  correct) with two new tools and `excludeFromMcp()`; resource MCP servers (`withMcpServer`,
  `withPostgresMcp`) are projected into TypeScript.
- **Version mixing is a hard failure**: 13.5 SDK + 13.4.6 hosting packages throw at startup, and a
  13.5 SDK under a 13.4.x CLI failed TypeScript codegen until 13.5.1. The bump must be atomic.
- **Our own 13.4.6-specific knowledge is baked into shipped artifacts** (the `aspire` skill's
  "verified against 13.4.6" behaviours, 13.4.6-captured fixtures, generator comments pointing at
  closed upstream issues). Every one is a re-verification obligation.

Research of record: `.llm/runs/research-aspire-13.5-adoption--0.0.7/research.md` (capability matrix,
breaking-change exposure — none at source level — pin inventory, regeneration chain).

## Pillars

1. **Atomic train + parity** — one commit moves every pin to 13.5.3 and a gate keeps them equal
   (S1).
2. **Executed evidence before generated-output changes** — a runtime verification pass with receipts
   closes every static "should still work" claim (S2, S3).
3. **Bridge correctness** — generator diff against the 13.5 TypeScript API; literal ports gone; real
   health checks; typed resource commands (S4–S6, S8).
4. **CI/E2E/teardown determinism** — `stop --force`, doctor receipts, `describe --follow` evidence,
   descendant-aware leak-check (S7, S10).
5. **Agent surface alignment** — skills, corpora, Aspire MCP wiring, upstream skill install policy,
   all regenerated through their generators, no hand-edited mirrors (S9).
6. **Public docs** — every Aspire-mentioning page re-read against 13.5 (S11).
7. **Next-wave spikes** — `addDenoApp` through the CommunityToolkit TS projection,
   `withPostgresMcp`, NetScript MCP as a resource MCP server (S12, 0.0.8).

## Sub-issues

- [ ] S1 — Atomic Aspire 13.5.3 pin bump + `check:aspire-version-parity` gate (p0)
- [ ] S2 — 13.5 runtime verification pass with receipts (p0, runtime lease)
- [ ] S3 — Re-capture 13.5 fixtures: dashboard telemetry, `aspire describe`, `aspire ps` (p1)
- [ ] S4 — Generator re-validation against the 13.5 TypeScript API (closes #1371) (p1)
- [ ] S5 — Remove every literal pre-randomization port from plugin contributions and E2E probes
      (closes #1365, #1370, #979) (p0)
- [ ] S6 — Real health checks for backing services via TS `addHealthCheck`/`withHealthCheck` (closes
      #1280) (p1)
- [ ] S7 — Teardown/leak-check on 13.5: orphan cleanup, `stop --force`, descendant tracking (closes
      #1429) (p1)
- [ ] S8 — Typed resource commands for db-cli-mode resources (closes #863 with S6) (p1)
- [ ] S9 — Skills, corpora, and Aspire MCP alignment (depends on #1675) (p1)
- [ ] S10 — E2E gate upgrades: doctor receipt, `describe --follow` evidence, `stop --force` cleanup,
      resource-command gate class (p1)
- [ ] S11 — Public docs + README refresh for Aspire 13.5 (closes #1642, #1000) (p2)
- [ ] S12 — 0.0.8 spikes: `addDenoApp` projection proof, `withPostgresMcp` opt-in, NetScript MCP as
      resource MCP server (0.0.8, p2)

## Sequencing and canaries

```text
S1 → S2 → { S3, S4 → S5 → S6 → S8, S7, S9 } → S10 → S11 ;  S12 after canary B (0.0.8)
canary A after S1–S4 (pin train)   ·   canary B after S5, S6, S8 (generated-output train)   ·   stable after S9–S11 + IMPL-EVAL
```

Canary B is mandatory: S5/S6/S8 change the resource graph every new project gets.

## Relationships to existing issues

- Closes via children: #1365, #1370, #979, #1371, #1280, #1429, #863, #1642, #1000.
- Unblocks (comment, keep open): #1366 (Aspire half), #1372 (partial via S10).
- Depends on: #1675 (skill install locations) before S9.
- Sequence after this epic: #1507, #413, #411, #825; #1381 consumes the resulting canary.
- Re-anchor (comment): #319/#320/#295 — upstream Deno toolchain/hosting is milestone 13.6
  (aspire#16218, #18627, #18628); the CommunityToolkit Deno package _is_ projected into the TS API
  (S12).
- Full matrix: `existing-issue-map.md`.

## Owner decisions required before filing

OF-1 skill naming (default: keep NetScript `aspire`, install upstream workflow skills beside it);
OF-2 `Aspire.Hosting.Browsers` preview pin (default: pin `13.5.3-preview.1.26425.3` as accepted
debt); OF-3 pull #979 into 0.0.7 (default: yes); OF-4 docs lane (default:
`documentation_authoring`); OF-5 S12 milestone (default: 0.0.8).

## Definition of done

- All S1–S11 merged to `main`; canary A and canary B published and green on `e2e-cli-prod`;
  IMPL-EVAL PASS recorded; `check:aspire-version-parity` green; no `13.4.6` literal remains outside
  version-suffixed fixtures and changelog prose; S12 filed in 0.0.8 with its restore proof attached.
