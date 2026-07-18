# Worklog — g14-816-main-readme

## 2026-07-18 — Lane 1 (research-criteria author, Claude · Fable 5 · high)

- Read live issue #816 in full (four-lane pipeline + acceptance) and current root `README.md` on
  `docs/816-main-readme` (fbb32119, incl. all 36 reworked package READMEs).
- Authored `criteria.md`:
  - Corpus finalized at 14: the 11 issue-named candidates + .NET Aspire, Hono, Encore (added with
    rationale); Next.js/SvelteKit/Django dropped with justification.
  - Ten extraction dimensions D1–D10 (structure, hook, visuals, quickstart friction incl.
    steps-to-running, ecosystem, social proof, length budget, badges, status honesty, audience
    routing incl. AI/agent addressing).
  - 0–4 anchored rubric + first-impression scalar; lesson/note obligations at score extremes.
  - Eight NetScript entry-point needs derived from the repo (agentic combo flagship, contract-first
    pipeline, CLI story, Aspire runtime model, ecosystem scale, desktop deploy lane, docs map,
    honest beta status) as the synthesis fitness function.
  - Mandatory `findings.md` output schema (per-candidate template + 6-part comparative synthesis)
    for mechanical Lane 3 consumption.
- Stop-lines embedded verbatim in criteria.md per run policy.
- Committed + pushed to `docs/816-main-readme`. No PR (supervisor opens at redaction).

## Lane 4 — 2026-07-18 (redactor, Claude · Fable 5 · high)

Rewrote root `README.md` from lane-1 criteria + lane-2 findings + lane-3 fact sheets.
Structure follows the findings' top-5 structural consensus (hero+badges → quickstart →
agentic flagship → one mermaid → plugins → package map → deploy → docs → status/limitations),
with the agentic combo placed per findings §2.5 Q2 middle path: second beat of the hero + a
dedicated section directly after the quickstart (Encore/Laravel D10 lessons). Encore D9
"Limitations" lesson drives the Status section; Astro/Supabase D5 drive the collapsible
package tables; Rails D4 drives the numbered quickstart with URL payoff.

### Command execution evidence (fresh temp scaffold, scratchpad/quickstart)
All README commands executed on 2026-07-18, Deno 2.9.3, aspire CLI 13.4.6, Docker present:
- `deno install --global --allow-all --name netscript jsr:@netscript/cli@0.0.1-beta.10` → OK,
  `netscript --version` = 0.0.1-beta.10. **Min-dep-age wall did NOT bite** (beta.10 older than
  24 h); sanctioned fallback if it had: append `--minimum-dependency-age=0` (the flag the
  scaffold itself uses, e.g. `packages/cli/src/kernel/templates/database/generate-db-deno-json.ts:10`).
  Only the user-runnable form is printed in the README.
- `netscript init my-app --db postgres --service --yes` → "183 files, 44 directories" in 3.4 s.
- `cd my-app/aspire && aspire restore` → OK; `aspire start` → dashboard HTTPS URL printed,
  curl → 200; postgres:18.3 + redis:7 containers up.
- `netscript db init --name init` / `db generate` / `db seed` → all "completed successfully".
- `curl http://localhost:3000/health` → `{"status":"healthy",…"checks":[{"name":"database","healthy":true,…}]}`.
- `netscript init preview-app … --dry-run` → "Would create 183 files, 44 directories. No files were written."
- `netscript agent init --host claude` → wrote `.mcp.json` pinned to `jsr:@netscript/cli@0.0.1-beta.10`
  + `.claude/skills/{netscript,netscript-operate,netscript-build}`.
- Wall-clock envelope: install ~40 s, init 3.4 s, restore ~50 s, start ~90 s, db trio ~60 s → under 5 min.

### Claim → citation map (README claim → fact-sheet source)
- Tagline/hero: contract-first, one contract → typed router/clients/UI in sync →
  facts-runtime-plugins Domain 1 "What it IS" (`packages/contracts/README.md:12-16`,
  `packages/service/README.md:7-8`).
- "backend framework and workspace generator, not a hosted service — you run it on Deno and own
  all the generated code" → facts-docs-status §2.5 verbatim (`index.vto:17-18`).
- `defineService` one call (health/OpenAPI/Scalar/tracing/graceful shutdown) →
  facts-runtime-plugins (`packages/service/README.md:22-24`, `:27-33`).
- "every later command regenerates the derived wiring" / scaffold-and-grow →
  facts-cli-agentic Domain 1 (`packages/cli/README.md:22`, `:104`).
- "the CLI is the hands, the skills are the playbook, MCP is the eyes" →
  facts-cli-agentic Domain 2 (`packages/mcp/README.md:57`).
- Beta note: lockstep versions / pin your versions → facts-docs-status §2.1-2.2
  (`index.vto:17-22`, `why.vto:17`).
- Quickstart prerequisites + `--no-aspire` → facts-docs-status §1.3 (`quickstart.vto:8-27`);
  commands executed (above). 183 files/44 dirs → facts-cli-agentic (`packages/cli/README.md:26,91`)
  + executed. Health-probe payoff → executed; 3 probes → facts-runtime-plugins
  (`packages/service/README.md:27`).
- `--dry-run` blast-radius preview → facts-cli-agentic (`packages/cli/README.md:24-26`) + executed.
- 11 command groups + names → facts-cli-agentic (executed `netscript --help`).
- `netscript agent init` host detect / `.mcp.json` / `.vscode/mcp.json` / version-locked triple →
  facts-cli-agentic Domain 2 (`packages/cli/README.md:113-127`, `packages/mcp/README.md:38-40`) + executed.
- 13 token-bounded tools; 50 items/2,000 chars caps; domain classification/correlation →
  facts-cli-agentic (`tool-types.ts:4-19`, `truncation.ts:10`, `packages/mcp/README.md:27-32`).
- 3 skills content-hashed → facts-cli-agentic (`skills.generated.ts`) + executed (3 dirs on disk).
- 17 allow / 6 deny, deny-beats-allow, default-deny + the 6 deny names →
  facts-cli-agentic (`command-policy.ts:24-49`).
- No npm MCP SDK; Deno 2.9+ server; complements Aspire MCP ("Aspire speaks resources and
  containers; this server speaks your app") → facts-cli-agentic
  (`packages/mcp/README.md:41-42`, `:22-23`, `196-198`).
- Mermaid content: contract→service→plugins→platform moves → facts-runtime-plugins Domain 1;
  Aspire SDK-neutral ("no Aspire SDK type in any public signature") → facts-aspire-deploy
  (`packages/aspire/README.md:6-24`); discovery via orchestrator-injected env vars →
  facts-runtime-plugins (`packages/sdk/README.md:17-19,28-29`); one distributed trace + zero
  OTel SDK default → facts-aspire-deploy (`packages/telemetry/README.md:7-33,52-58`).
- Plugin = manifest, inspected without executing; one install wires service/storage/AppHost →
  facts-runtime-plugins Domain 2 (`packages/plugin/README.md:12-34`, `plugins/workers/README.md:11-14`).
- Plugin table rows: workers 4 runtimes + idempotencyKey (`plugins/workers/README.md:25-32`);
  sagas compensation/resume (`plugins/sagas/README.md:24-32`); triggers ack-then-process +
  retry/dead-letter (`plugins/triggers/README.md:28-38`); streams no-database replayable topics
  (`plugins/streams/README.md:8,23-34,56-57`); auth swappable backends
  (`plugins/auth/README.md:24-36`); ai in-process no-gateway (`plugins/ai/README.md:7-8,24-36`).
- "30 packages and 6 first-party plugins" → facts-runtime-plugins quotable numbers
  (`ls` verified); package-table capability lines carry over from the audited #815 READMEs
  (each row links its README); `@netscript/bench` intentionally omitted (not published:
  jsr.io/@netscript/bench → 404, verified 2026-07-18).
- Deploy: canonical op set + no credentials/manifests → facts-aspire-deploy Domain 2
  (`packages/cli/README.md:131-145`, `deploy-target-port.ts:2-32`); 6 target rows →
  (`packages/cli/README.md:137-141`); Ed25519 release server (`:189-219`); unsigned installers
  (`:177-187`); Windows manual apply (`:221-223` + `build-a-desktop-frontend.md:133-135`).
- Docs: four-lane Diátaxis phrasing → facts-docs-status §1.1 (`tutorials/index.md:20-27`,
  `reference/index.md:6-10`); Start links → §1.2-1.3 (`_data.ts:74-78`); five tutorial tracks +
  "each builds one complete application… under .NET Aspire" → §1.4 (`tutorials/index.md:32-33`;
  eis-chat NOT surfaced); 28 how-to guides → §1.5 (verified count); reference generated with
  `deno doc` → §1.6 (`reference/index.md:6-8`).
- Status: `0.0.1-beta.10` version constant → facts-docs-status §2.1 (root `deno.json`; rendered
  as "current release train", no bump asserted); "no big-bang jump" / incremental → §2.2
  (`ROADMAP.md:3-17`); 0.0.1-stable = terminal milestone w/ positioning verdict → §2.3
  (`ROADMAP.md:20-38`, internal bench vocabulary excluded); bare specifiers don't resolve →
  facts-runtime-plugins + facts-cli-agentic (`packages/service/README.md:54-55`,
  `packages/cli/README.md:64-65`); kv-oauth-only interactive auth → facts-docs-status §2.4
  (`why.vto:105-106`); no SIGTERM on Windows → §2.4 (`graceful-shutdown.md:197`); Deno 2.9+ +
  interpreter requirement → facts-runtime-plugins (`plugins/workers/README.md:138-142`).

### Gate log
- `deno task docs:links` → OK (docs=98, 0 broken links/anchors).
- `check-jsr-tagline-length.ts README.md` → OK (tagline ≤250 B after one trim).
- `check-readme-standard.ts` → root README is OUT OF SCOPE for this checker (its contract is the
  `# @netscript/<pkg>` unit-README shape over `packages/*`/`plugins/*` globs). Run anyway:
  1 pre-existing failure `packages/bench/README.md` (missing `## Install`), untouched by this slice.
- Mermaid parse → verified locally with mermaid@11 `mermaid.parse()` under jsdom:
  `MERMAID_PARSE_OK {"diagramType":"flowchart-v2"}`.
- Internal-wording grep (eis-chat|VIF|CSB|harness|lane|evaluator|agent-model names|PR #|internal)
  → zero hits in README.md.
- `deno fmt README.md` applied; `deno fmt --check README.md` clean.
- deno.lock drifted locally during quickstart tooling — NOT committed (lock hygiene).

### Stop-lines (verbatim, per run policy)
1. Merge requires CI green + opposite-family eval PASS on the PR. Owner granted standing beta-11
   merge authorization (2026-07-17 in-turn) once that bar is met.
2. HARD STOP before any release publish (`release:cut`, JSR publish, tag push, canary or stable) —
   owner sign-off in-turn only; a stale or relayed approval does not count.
3. HARD STOP before closing milestone 13 — owner sign-off only.
4. These stop-lines are repeated verbatim in EVERY sub-agent brief. A sub-brief without the
   stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification; its board filing needs the owner
   in-turn.
