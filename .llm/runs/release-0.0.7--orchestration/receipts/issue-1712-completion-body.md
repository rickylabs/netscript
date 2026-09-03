> **Completed — 2026-09-03:** S1–S11 and S13 are merged and verified in the final green canary.10 production pair; #1881 and #863 are complete. S12 #1725 remains NOT_PLANNED in 0.0.8, not claimed shipped. Framework/core/docs parity remains enforced by merged #1982 while retained run/transient records are excluded.

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
  correct) with `refresh_tools` (and `get_integration_docs` documented but unobserved at 13.5.3, D-45) and `excludeFromMcp()`; resource MCP servers (`withMcpServer`,
  `withPostgresMcp`) are projected into TypeScript.
- **Version mixing is a hard failure**: 13.5 SDK + 13.4.6 hosting packages throw at startup, and a
  13.5 SDK under a 13.4.x CLI failed TypeScript codegen until 13.5.1. The bump must be atomic.
- **Our own 13.4.6-specific knowledge is baked into shipped artifacts** (the `aspire` skill's
  "verified against 13.4.6" behaviours, 13.4.6-captured fixtures, generator comments pointing at
  closed upstream issues). Every one is a re-verification obligation.

Research of record (branch `research/aspire-13.5-0.0.7`, head `e4898e6eb`): `.llm/runs/research-aspire-13.5-adoption--0.0.7/research.md` (capability matrix,
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
   smoke receipt (server from the generated `.mcp.json`, the ratified D-45 baseline of 14 required tools incl. `refresh_tools`, `get_integration_docs` as documented-but-unobserved INFO, and
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

## Sub-issues (filed 2026-08-29; GitHub wins on conflict)

- [x] #1713 — S1 — Atomic Aspire 13.5.3 pin bump + `check:aspire-version-parity` gate (p0)
- [x] #1714 — S2 — 13.5 runtime verification pass with receipts (p0, runtime lease)
- [x] #1715 — S3 — Re-capture 13.5 fixtures: dashboard telemetry, `aspire describe`, `aspire ps` (p1)
- [x] #1716 — S4 — Generator re-validation against the 13.5 TypeScript API + deploy-adapter CLI contract
      verification (will close #1371) (p1)
- [x] #1717 — S5 — Remove every literal pre-randomization port from plugin contributions and E2E probes
      (will close #1365, #1370, #979) (p0)
- [x] #1718 — S6 — Real health checks for backing services via TS `addHealthCheck`/`withHealthCheck` (closes
      #1280) (p1)
- [x] #1719 — S7 — Teardown/leak-check on 13.5: orphan cleanup, `stop --force`, descendant tracking (closes
      #1429) (p1)
- [x] #1720 — S8 — Typed resource commands for db-cli-mode resources + sole owner of `excludeFromMcp()`
      (will close #863 with S6) (p1)
- [x] #1721 — S9 — Skills, corpora, and Aspire MCP alignment + exact-13.5 MCP smoke receipt (depends on S1,
      S2, #1675) (p1)
- [x] #1722 — S10 — E2E gate upgrades: doctor receipt, `describe --follow` evidence, `stop --force` cleanup,
      resource-command gate class (p1)
- [x] #1723 — S11 — Public docs + README refresh for Aspire 13.5 (will close #1642, #1000) (p2)
- [x] #1724 — S13 — Stale version-bound surface cleanup + parity gate phase 2 over
      `aspire-surface-manifest.tsv` (depends on S1, S9, S11) (p2)
- [ ] #1725 — S12 — **closed as NOT_PLANNED in 0.0.8, not delivered by this epic** — spikes: `addDenoApp` projection proof, `withPostgresMcp` opt-in, NetScript MCP as
      resource MCP server (0.0.8, p2)

## Sequencing and canaries

```text
S1 → S2 → { S3 | S4 → S5 → S6 → S8 → S10 | S7 | S9(needs S8) } → S11 → S13 ;  S12 + S6b (0.0.8) after canary B
canary A (pin-only)          = S1, S2, S3
canary B (generated output)  = S4, S5, S6, S7, S8
canary C (agent/MCP/docs)    = S9, S10, S11, S13
stable = S13 merged + parity phase 2 green + receipts/aspire-13.5-mcp-smoke.json + canary C green published-E2E pair + IMPL-EVAL PASS
```

The A/B/C labels above describe the original planned checkpoints, not additional versions to mint. The owner-directed consolidated release train carried the pin/resource work through canary.4 and the completed integration through canary.6; final canary.10 supplies the green published proof for the complete current source. Historical failed candidates remain immutable evidence.

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

- S1–S11 and S13 merged to main, with independent slice review/evaluation evidence in their linked PRs.
- Final canary.10 publication and exact production E2E both SUCCESS; complete README and four-part post-cleanup proof linked below.
- Current-main Aspire parity PASS, with the owner-approved shared scan policy excluding retained harness/transient files rather than rewriting historical evidence.
- Exact-13.5 MCP smoke committed by S9: ratified D-45 baseline of 14 required tools, `toolsMissing: []`; `get_integration_docs` remains informational.
- S12 #1725 and deeper protocol readiness #1726 are outside the delivered 0.0.7 scope; no claim that those future spikes shipped.


---
Ratified 2026-08-29 by the primary coordinator on research head `0ba8c2fcf` (PLAN-EVAL cycles 1–2 in the run dir; D-1…D-17, OF-1(a), OF-2(a), OF-3(a), OF-4(b), OF-5=0.0.8, D-17 as locked). Implementation supervisor: the Fable 5 medium research session; implementation lanes: GPT-5.6 Sol per slice; IMPL-EVAL independent per slice.



Follow-up in 0.0.8: #1726 (S6b protocol/credential readiness).



## Final published acceptance — 2026-09-03

Verified against `jsr:@netscript/cli@0.0.7-canary.10`, content `a2d5b8b75083769b946c03ab772e08f2634e2b35`, immutable tag commit `170e33782acf2dfb4bccc3f4e461ae8f5a149f85`.

- [Canary publication and exact production pair](https://github.com/rickylabs/netscript/actions/runs/33762898477): SUCCESS.
- [Pinned production run](https://github.com/rickylabs/netscript/actions/runs/33763460542): all 12 README commands plus cleanup PASS (13/0), full scaffold runtime 104/0, seven-step quickstart plus cleanup/integrity 9/0; no retries.
- [Supplementary same-version README and cleanup proof](https://github.com/rickylabs/netscript/actions/runs/33765493143): 13/0; post-run `appHosts=0, containers=0, volumes=0, networks=0`. Ordinary image/dependency caches retained (six cached images at baseline). This verification-only workflow adds read-only post-run counts; published framework content is unchanged.
- The downloadable production artifacts contain `readme-quickstart-prod-report.json`, command-by-command JSON transcripts, cleanup receipt, and (supplementary run) `readme-post-cleanup-baseline.json`. Dedicated initial baseline had zero resources, so no foreign or unknown resources were present to mutate. There was no manual recovery between README commands. Earlier sequence/product defects were fixed in the linked merged PRs rather than worked around.
