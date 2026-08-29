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
5. **Agent surface alignment, proven** — skills, corpora, Aspire MCP wiring, upstream skill install
   policy, all regenerated through their generators, no hand-edited mirrors, plus an exact-13.5 MCP
   smoke receipt (server from the generated `.mcp.json`, 15 tools incl. `get_integration_docs` and
   `refresh_tools`, doctor pass, resource visibility) diffed against the committed 13.4.6 baseline
   (S9).
6. **Public docs** — every Aspire-mentioning page re-read against 13.5 (S11).
7. **Whole-ecosystem stale-surface cleanup** — every Aspire-bound surface (MCP server/client,
   bundled and static resources, generated references/snapshots/schemas, project-local and
   distributed skills/corpora/prompts, CI workflows and fixtures, examples/templates,
   dashboard/telemetry bridge, every public/internal document) has one authoritative current-version
   source and one repo-path disposition in `stale-surface-inventory.md`; the parity gate carries an
   explicit archival exemption list so historical design evidence is never rewritten (S13).
8. **Next-wave spikes** — `addDenoApp` through the CommunityToolkit TS projection,
   `withPostgresMcp`, NetScript MCP as a resource MCP server (S12, 0.0.8).

## Sub-issues

- [ ] S1 — Atomic Aspire 13.5.3 pin bump + `check:aspire-version-parity` gate (p0)
- [ ] S2 — 13.5 runtime verification pass with receipts (p0, runtime lease)
- [ ] S3 — Re-capture 13.5 fixtures: dashboard telemetry, `aspire describe`, `aspire ps` (p1)
- [ ] S4 — Generator re-validation against the 13.5 TypeScript API + deploy-adapter CLI contract
      verification (closes #1371) (p1)
- [ ] S5 — Remove every literal pre-randomization port from plugin contributions and E2E probes
      (closes #1365, #1370, #979) (p0)
- [ ] S6 — Real health checks for backing services via TS `addHealthCheck`/`withHealthCheck` (closes
      #1280) (p1)
- [ ] S7 — Teardown/leak-check on 13.5: orphan cleanup, `stop --force`, descendant tracking (closes
      #1429) (p1)
- [ ] S8 — Typed resource commands for db-cli-mode resources + sole owner of `excludeFromMcp()`
      (closes #863 with S6) (p1)
- [ ] S9 — Skills, corpora, and Aspire MCP alignment + exact-13.5 MCP smoke receipt (depends on S1,
      S2, #1675) (p1)
- [ ] S10 — E2E gate upgrades: doctor receipt, `describe --follow` evidence, `stop --force` cleanup,
      resource-command gate class (p1)
- [ ] S11 — Public docs + README refresh for Aspire 13.5 (closes #1642, #1000) (p2)
- [ ] S13 — Stale version-bound surface cleanup + parity gate phase 2 over
      `aspire-surface-manifest.tsv` (depends on S1, S9, S11) (p2)
- [ ] S12 — 0.0.8 spikes: `addDenoApp` projection proof, `withPostgresMcp` opt-in, NetScript MCP as
      resource MCP server (0.0.8, p2)

## Sequencing and canaries

```text
S1 → S2 → { S3 | S4 → S5 → S6 → S8 → S10 | S7 | S9(needs S8) } → S11 → S13 ;  S12 + S6b (0.0.8) after canary B
canary A (pin-only)          = S1, S2, S3
canary B (generated output)  = S4, S5, S6, S7, S8
canary C (agent/MCP/docs)    = S9, S10, S11, S13
stable = S13 merged + parity phase 2 green + receipts/aspire-13.5-mcp-smoke.json + canary C green published-E2E pair + IMPL-EVAL PASS
```

All three canaries are mandatory: A isolates the pin, B covers every resource-graph change, C covers
shipped agent output, templates, and the final parity enforcement.

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
`documentation_authoring`); OF-5 S12 milestone (default: 0.0.8); D-17 dashboard-port assumption
(resolve before S13).

## Definition of done

- All S1–S11 and S13 merged to `main`; canaries A, B, C published and green on `e2e-cli-prod`;
  `check:aspire-version-parity --phase 2` green; `receipts/aspire-13.5-mcp-smoke.json` committed and
  green; canary A and canary B published and green on `e2e-cli-prod`; IMPL-EVAL PASS recorded;
  `check:aspire-version-parity` green; no `13.4.6` literal remains outside version-suffixed fixtures
  and changelog prose; S12 filed in 0.0.8 with its restore proof attached.
