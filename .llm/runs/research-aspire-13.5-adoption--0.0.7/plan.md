# Aspire 13.5 adoption plan

Status: DRAFT FOR COORDINATOR RATIFICATION — derived from `research.md` (2026-08-29); repaired
2026-08-29 against `plan-eval.md` (FAIL_PLAN F1–F7, mapping in `worklog.md`). No product code,
issues, labels, or milestones were created. PLAN-EVAL: **required** (multi-PR wave, three owner
forks); route per `lane-policy.md` = native opposite-family **Codex · GPT-5.6 Sol · high** (the plan
is Claude-authored), fallback Minimax M3 high only on quota block.

## Archetype, overlays, doctrine verdict

- Subject surfaces: `packages/cli` (ARCHETYPE for CLI/scaffold generators), `packages/aspire` (ports
  only — verdict "Keep, SDK-independent"), `plugins/{sagas,streams,triggers,workers}` (ARCHETYPE-5
  contribution seams), `packages/mcp` + `packages/telemetry` (fixtures/adapters),
  `.github/workflows`, `.llm/tools/agentic/teardown`, `skills/`, `docs/site`.
- Overlays: `SCOPE-docs.md` (S-09, S-11); `SCOPE-service.md` not needed (no service runtime code).
- Gate set (archetype matrix): scoped check/lint/fmt wrappers + `deno task quality:scan` +
  `deno task arch:check` for every `packages/**`/`plugins/**` slice; `jsr-audit` for
  `packages/aspire` if its surface changes (it should not); `check:assets-barrel`,
  `check:agent-docs-prose`, `check:mcp-export-corpus`, `check:publish-assets`,
  `check:scaffold-versions`, `check:aspire-host-ports`; runtime verdict =
  `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` (both CI tiers) and
  `e2e-cli-prod` on each canary.

## Architecture decisions — LOCKED (subject to PLAN-EVAL)

| ID   | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                         | Rationale (research ref)                                                                           |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| D-1  | Target **13.5.3** for CLI, SDK, and every `Aspire.Hosting.*` pin in **one commit** (S-01). No mixed trains, ever.                                                                                                                                                                                                                                                                                                                                | §1 known issue; 13.5.1 codegen-compat fix; 13.5.3 port-allocation narrowing.                       |
| D-2  | Scaffold constants stay the product truth for the Aspire version; a new fitness gate `check:aspire-version-parity` asserts CI env/workflows/policy test/skill markers/docs snippets agree with `SCAFFOLD_VERSIONS.ASPIRE_SDK`.                                                                                                                                                                                                                   | §4 pin inventory (13+ literals across 5 owners); Q2.                                               |
| D-3  | `Aspire.Hosting.Browsers` moves to `13.5.3-preview.1.26425.3` (no stable exists); recorded as accepted debt with a stable-drop gate. `withBrowserLogs()` default behaviour unchanged (#1577).                                                                                                                                                                                                                                                    | Q5 → OF-2.                                                                                         |
| D-4  | `_aspire-compat.mts` and `addExecutable('deno', …)` **stay** in 0.0.7; comments re-anchored to aspire#18627/#16218 (13.6). `addDenoApp` is a 0.0.8 spike (S-12) gated on an `aspire restore` projection proof.                                                                                                                                                                                                                                   | C24, C25, Q6.                                                                                      |
| D-5  | Custom health checks (TS `addHealthCheck`/`withHealthCheck`) are adopted in 0.0.7 for backing services only.                                                                                                                                                                                                                                                                                                                                     | C2, Q7; unblocks #1280.                                                                            |
| D-6  | Resource-command arguments are adopted in 0.0.7 for db-cli-mode resources only (typed `aspire resource <db> …`), replacing ad-hoc AppHost spawns where the E2E already restarts after DB prep.                                                                                                                                                                                                                                                   | C6, Q8.                                                                                            |
| D-7  | NetScript's shipped `skills/aspire` remains the single `aspire` skill; `netscript agent init` installs the upstream **workflow** skills by explicit name and never lets `aspire agent init` overwrite `aspire/SKILL.md`; `.agents/skills/aspire` is derived from `skills/aspire` (one source).                                                                                                                                                   | C18, Q3 → OF-1.                                                                                    |
| D-8  | CI keeps `dotnet tool install Aspire.Cli --version 13.5.3`; `e2e-cli-prod` moves off `install.sh`+preview to the same route; NuGet cache key becomes `nuget-aspire-<os>-13.5.3-v1`; policy test updated in the same commit.                                                                                                                                                                                                                      | Q1, Q4.                                                                                            |
| D-9  | Every RUNTIME-VERIFY item in research (§2 C9/C14/C20/C25, §3 BC-5, §5 skill assertions, §6 teardown, §7 fixtures) is closed by S-02 receipts **before** generator-changing slices merge.                                                                                                                                                                                                                                                         | Research is static; gates must be executed evidence.                                               |
| D-11 | **Whole-ecosystem scope.** Every Aspire-bound surface has exactly one authoritative current-version source and one repo-path disposition, recorded in `stale-surface-inventory.md`; the parity gate (D-2) carries the inventory's **archival exemption list** so historical/design evidence (`.llm/runs/**`, `resources/design/**`, `docs/site/_plan/**`, `rfcs/*.md`, version-suffixed fixtures, `prior-release.mcp.json`) is never rewritten.  | Coordinator scope expansion 2026-08-29.                                                            |
| D-13 | **Parity gate lifecycle**: phase 1 (S-01) fails on the enforce set (scaffold constants, `toolchain.env`, workflows, cache keys, policy test, `.openhands/setup.sh`) and reports `deferred` rows by owning slice; phase 2 (S-13) fails on every non-archival manifest row. Row source and exclusion set = `aspire-surface-manifest.tsv` (generator `tools/aspire-surface-manifest.ts`, 809 rows at the plan head, classes `archival:*` excluded). | PLAN-EVAL F4/F5.                                                                                   |
| D-14 | Pre-slice jsr-audit for planned public-surface changes is **recorded now** (`research.md` §15): S-05's sagas publisher change is behavioural on an existing discriminated union; gates named in `sub-issues/05`. `packages/aspire` is N/A (no public-surface change planned).                                                                                                                                                                    | PLAN-EVAL F6.                                                                                      |
| D-12 | S-09 must **prove** the MCP upgrade with a structured receipt tied to S-01's pin and S-02's runtime evidence (`receipts/aspire-13.5-mcp-smoke.json` vs the committed 13.4.6 baseline); prose/config rewrites alone do not close it.                                                                                                                                                                                                              | Coordinator acceptance correction 2026-08-29; baseline `receipts/aspire-13.4.6-mcp-baseline.json`. |
| D-10 | Two 0.0.7 canaries minimum: canary A after the pin train (S-01–S-04), canary B after the generated-output train (S-05, S-06, S-08). Stable only after canary B's green pair + IMPL-EVAL PASS.                                                                                                                                                                                                                                                    | §canary.                                                                                           |

## Owner-fork sweep (numbered; none silently taken)

| Fork | Options                                                                                                                                                                     | Default if not answered                                                                                                            |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| OF-1 | (a) keep NetScript `aspire` skill name and install upstream workflow skills beside it; (b) rename NetScript's to `netscript-aspire` and let upstream `aspire` be the router | **(a)** — the shipped skill is diagnostic-grade, cited by the consumer AGENTS.md text, and renaming breaks the corpus hash + docs. |
| OF-2 | (a) pin Browsers 13.5.3-preview with accepted debt; (b) make `withBrowserLogs()` opt-in and drop the preview package from the default scaffold                              | **(a)** — #1577 restored the default deliberately in 0.0.6.                                                                        |
| OF-3 | (a) pull #979 into S-05 (0.0.7); (b) leave #979 in 0.0.8                                                                                                                    | **(a)** — same defect class as #1365 (p0) and #1370; the E2E gate rewrite is shared.                                               |
| OF-4 | (a) S-11 docs authoring on the Claude-workflow documentation exception; (b) AGY Gemini `documentation_authoring` lane                                                       | **(b)** per lane-policy default; (a) only if the owner invokes the 2026-06-18 exception.                                           |
| OF-5 | Milestone for S-12 spikes: 0.0.8 vs Backlog                                                                                                                                 | **0.0.8** (research already proves the TS projection exists).                                                                      |

## Slices (independently shippable; one PR each; sub-issue drafts in `sub-issues/`)

| Slice | Title                                                                                                                                | Milestone | Priority | Closes                      | Lane (Sol effort → review pairing)                                       |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------ | --------- | -------- | --------------------------- | ------------------------------------------------------------------------ |
| S-01  | Atomic Aspire 13.5.3 pin bump + `check:aspire-version-parity` gate                                                                   | 0.0.7     | p0       | —                           | normal_implementation (Sol medium → Fable low)                           |
| S-02  | 13.5 runtime verification pass with receipts (RUNTIME-VERIFY list + regression-check list)                                           | 0.0.7     | p0       | — (records outcomes)        | complex_implementation (Sol high → Fable medium); runtime lease required |
| S-03  | Re-capture 13.5 fixtures: dashboard telemetry, `aspire describe`, `aspire ps` (version-suffixed)                                     | 0.0.7     | p1       | —                           | light_implementation (Sol low → Opus high)                               |
| S-04  | Generator re-validation against the 13.5 TypeScript API (+ #1371, stale comments, config default)                                    | 0.0.7     | p1       | #1371                       | normal_implementation                                                    |
| S-05  | Remove every literal pre-randomization port from plugin contributions and E2E probes                                                 | 0.0.7     | p0       | #1365, #1370, #979          | complex_implementation                                                   |
| S-06  | Real health checks for backing services via TS `addHealthCheck`/`withHealthCheck`                                                    | 0.0.7     | p1       | #1280 (+ #863 with S-08)    | normal_implementation                                                    |
| S-07  | Teardown/leak-check on 13.5: orphan cleanup, `stop --force`, descendant tracking                                                     | 0.0.7     | p1       | #1429                       | normal_implementation                                                    |
| S-08  | Typed resource commands for db-cli-mode resources (`CommandOptions.Arguments`)                                                       | 0.0.7     | p1       | #863 (with S-06)            | complex_implementation                                                   |
| S-09  | Skills, corpora, and Aspire MCP alignment (skill refresh, upstream-skill install policy, regen chain, dogfood bundle)                | 0.0.7     | p1       | — (depends #1675)           | normal_implementation; docs_audit pass on skill prose                    |
| S-10  | E2E gate upgrades: `doctor --format Json` receipt, `describe --follow` evidence, `stop --force` cleanup, resource-command gate class | 0.0.7     | p1       | — (partial #1372, no close) | normal_implementation                                                    |
| S-11  | Public docs + README refresh for Aspire 13.5                                                                                         | 0.0.7     | p2       | #1642, #1000                | documentation_authoring (OF-4) + docs_audit + docs_polish                |
| S-12  | 0.0.8 spikes: `addDenoApp` via CommunityToolkit TS projection; `withPostgresMcp` opt-in; NetScript MCP as resource MCP server        | 0.0.8     | p2       | — (re-anchors #320)         | deep_analysis (Fable medium) research, then Sol                          |

## Dependency DAG

```text
S-01 ──► S-02 ──┬──► S-03 ──────────────────────────────────────────┐   canary A (pin-only): S-01, S-02, S-03
                ├──► S-04 ──► S-05 ──► S-06 ──► S-08 ──┬──► S-10 ─┐  │   canary B (generated output): S-04, S-05, S-06, S-07, S-08
                ├──► S-07 ─────────────────────────────┘          │  │
                └──► S-09 (needs S-08, #1675) ────────────────────┴──┼──► S-11 ──► S-13   canary C (agent/MCP/docs/parity): S-09, S-10, S-11, S-13
                                                                     │
stable = S-13 merged + parity phase 2 green + receipts/aspire-13.5-mcp-smoke.json green
         + canary C green published-E2E pair + IMPL-EVAL PASS
S-12 (0.0.8) after canary B
```

- S-01 is the only slice every other slice depends on; it is also the sole rollback pivot (single
  revert restores 13.4.6 wholesale).
- S-02 gates all generator-changing slices (D-9). It produces no product code; its output is a
  receipts table in the run dir + fixture/test fixes.
- S-03, S-04, S-07, S-09 are mutually independent after S-02.
- S-05 → S-06 → S-08 is a strict chain: health checks attach to resources whose ports S-05 makes
  dynamic; typed commands (S-08) call into resources whose readiness S-06 proves.
- S-09 depends on S-08 (hidden-set proof). S-10 consumes S-07 (cleanup) and S-08 (commands). S-11
  follows so prose matches shipped behaviour; S-13 is last because phase-2 parity can only fail on
  rows S-09/S-11 have already made current.

## Canary strategy

| Canary                                     | After                        | What it proves                                                                                                                                                                                                                                                                                                  | Why it is mandatory                                                                                                                   |
| ------------------------------------------ | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **0.0.7 canary A** (pin-only)              | S-01, S-02, S-03             | A consumer `netscript init` on the published CLI restores and starts on 13.5.3 (`e2e-cli-prod`, both tiers) with **no emitted-output change** — S-01 changes versions only, S-02 is receipts, S-03 is fixtures. Re-runs the #1597 hazard (doctor pin vs unpublished version): publish → propagation → prod E2E. | Highest-blast-radius, lowest-diff change; isolating it makes any regression attributable.                                             |
| **0.0.7 canary B** (generated output)      | S-04, S-05, S-06, S-07, S-08 | Generated AppHost **shape** changed: #1371 env injection + config default (S-04), dynamic plugin ports (S-05), listener health checks (S-06), typed commands + `excludeFromMcp()` (S-08); teardown tooling (S-07). `scaffold.runtime` on both tiers + `quickstart` walk on the published artifact.              | Every new project's resource graph changes; a consumer-visible regression must not be found at stable.                                |
| **0.0.7 canary C** (agent/MCP/docs/parity) | S-09, S-10, S-11, S-13       | Published `netscript agent init` output (skills, `.mcp.json`, AGENTS block), embedded corpora, the `agent.aspire-mcp-smoke` receipt on the **published** CLI, E2E gate classes, docs corpora, consumer CI template install line, parity phase 2.                                                                | S-09/S-13 change shipped agent output and scaffold templates; the evaluator (F2) requires a published canary over them before stable. |
| **0.0.7 stable**                           | canary C green               | Admission: S-13 merged; `check:aspire-version-parity --phase 2` green; `receipts/aspire-13.5-mcp-smoke.json` committed from canary C's run; canary C's green published-E2E pair (`e2e-cli-prod`, postgres+docker and sqlite+garnet); IMPL-EVAL PASS.                                                            | `netscript-release` green-pair rule + D-10.                                                                                           |

## Rollback boundaries

| Boundary            | Mechanism                                                                           | Blast radius                                                                                                                                                                                                                                                                                                  |
| ------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S-01                | `git revert` of one commit (pins + policy test + cache key + parity gate)           | Whole train back to 13.4.6; nothing downstream can be kept.                                                                                                                                                                                                                                                   |
| S-03/S-04           | revert; fixtures are version-suffixed so 13.4.6 fixtures remain                     | tests only                                                                                                                                                                                                                                                                                                    |
| S-04/S-05/S-06/S-08 | revert PR + `deno task gen:assets-barrel` (snapshot templates + barrel are derived) | generated output for new projects only; existing projects untouched until `netscript generate aspire`. S-06 revert restores process-state health (its unreachable-listener fixture leaves with it); S-08 revert makes `<db>-cli` helpers MCP-visible again, so S-09's hidden-set expectation reverts with it. |
| S-07/S-10           | revert; gates are additive                                                          | tooling only                                                                                                                                                                                                                                                                                                  |
| S-09                | revert + `gen:assets-barrel` + `agentic:sync-claude` + `agentic:dogfood-skills`     | skill bundle hash changes → consumer `agent init` re-install                                                                                                                                                                                                                                                  |
| S-11                | revert + `gen:agent-docs-prose` + `gen:publish-assets`                              | docs corpora                                                                                                                                                                                                                                                                                                  |

## Risk register

| Risk                                                                                                          | Likelihood        | Mitigation                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 13.5 codegen rejects the options-object `withHttpHealthCheck({path,endpointName})` form (research §4)         | low               | S-02 restore+tsc proof before S-04; fallback: emit positional form via a single helper.                                                            |
| Proxyless port allocation change (BC-5) shifts `urls[].url`/`environment.PORT` semantics the E2E gates encode | medium            | S-02 re-runs `generated-app-endpoint`, `capture-db-endpoint-allocation`, `verify-live-db-endpoint`; S-05 removes the remaining fixed ports anyway. |
| `aspire restore` cold-cache time on the new train reproduces #1227                                            | medium            | S-01 bumps the NuGet cache key; S-02 records restore timings; keep the 180 s × 2 retry.                                                            |
| Exit-12 detached telemetry bug persists (#1025)                                                               | unknown           | Wrapper stays (Q10); S-02 records the observed behaviour; S-09 updates the skill text either way.                                                  |
| Upstream `aspire` skill overwrites NetScript's during `aspire agent init`                                     | high if unmanaged | D-7: explicit `--skills` list; S-09 adds a test that `aspire/SKILL.md` hash is unchanged after `netscript agent init`.                             |
| Browsers preview pin breaks E-12 expectations or a future stable renames the API                              | low               | D-3 debt entry with gate; `SCAFFOLD_ASPIRE_INTEGRATIONS` is outside E-12 scan today (document, do not widen silently).                             |
| Two canaries stretch the 0.0.7 window                                                                         | medium            | Canary A is cut as soon as S-04 lands; S-05–S-08 proceed in parallel on their own branches.                                                        |
| `CommunityToolkit` Deno projection proof fails (C25)                                                          | medium            | Only S-12 (0.0.8) depends on it; 0.0.7 unaffected.                                                                                                 |

## Open-decision sweep

| Decision               | Status                                                 |
| ---------------------- | ------------------------------------------------------ |
| OF-1 skill naming      | must resolve before S-09 (safe to defer past canary A) |
| OF-2 Browsers preview  | must resolve before S-01 (blocks the pin commit)       |
| OF-3 #979 pull-forward | must resolve before S-05                               |
| OF-4 docs lane         | safe to defer until S-11                               |
| OF-5 S-12 milestone    | safe to defer until filing                             |
| Q10 exit-12 behaviour  | resolved by S-02 evidence, not by decision             |

## Parity gate phases and archival manifest

- **Row source**: `aspire-surface-manifest.tsv`, generated by `tools/aspire-surface-manifest.ts`
  (two `git grep -il --extended-regexp 'aspire'` invocations with documented pathspecs; ordered
  first-match rules; sorted; one owner/disposition per row; 809 rows, 0 unmatched at the plan head).
- **Phase 1 (S-01)** — fail: `scaffold-constants`, `ci:*`, `root-config`; report `deferred`:
  everything else non-archival, tagged with its owner slice.
- **Phase 2 (S-13)** — fail: every row whose owner ≠ `archival`.
- **Exclusion set** = manifest classes `archival:*` (design corpus, docs plan, RFCs,
  version-suffixed fixtures, migration fixture, this run's sources/receipts, root notes) plus the
  git-ignored `.llm/runs/**` and `.llm/tmp/**` trees. Human-readable list in
  `stale-surface-inventory.md` §"Archival exemption list": `.llm/runs/**`, `.llm/tmp/**`, this run's
  `sources/**` + `receipts/**`, `resources/design/dashboard/**`, `docs/site/_plan/**`, `rfcs/*.md`,
  version-suffixed fixtures (`*-13.4.6-*`), `prior-release.mcp.json`, branch-name examples in
  `netscript-pr`, changelog/closed-issue prose. Hits inside these paths are `info`, never `fail`;
  S-11/S-13 authors must not edit them.

## Debt implications

- New accepted debt: Browsers preview pin (D-3). Existing debt to update: "CommunityToolkit
  Deno/SQLite TypeScript AppHost re-enable deferred" (evidence changed — TS projection exists; gate
  stays until S-12 proves restore); `aspire-otel-cli-discovery` (S-02 either closes it or re-anchors
  it to 13.5 evidence).
- Deferred scope: Interaction Service prompts (C5), `withTerminal` (C7), Redis modules (C22), Deno
  KV managed resource (existing debt), background-child health (#1366 framework half),
  `withMcpServer` for NetScript MCP (S-12).

## Ratification recommendation (concise)

Ratify D-1…D-10 with OF-1(a), OF-2(a), OF-3(a), OF-4(b), OF-5(0.0.8); file the epic + S-01…S-11 into
0.0.7 and S-12 into 0.0.8; run PLAN-EVAL on Sol high; start S-01 immediately (it is mechanical and
unblocks everything) and S-02 on the serialized runtime lease.
