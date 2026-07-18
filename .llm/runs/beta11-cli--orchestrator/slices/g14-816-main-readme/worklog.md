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

## Lane 4 — 2026-07-18 fix cycle 1 (post-adversarial FAIL)

All 7 required fixes from `adversarial.md` applied to README.md:

1. **BLOCKER — desktop/auto-update unreleased in beta.10.** Native-desktop material moved out of
   the shipped deploy table into a clearly labeled `### New in 0.0.1-beta.11: native desktop lane`
   subsection, explicitly stated as "not yet available in the published 0.0.1-beta.10 packages this
   README pins" and attributed to the main branch. No `netscript deploy desktop` command appears in
   any beta.10-pinned context. `@netscript/sdk` map row annotated "(desktop auto-update seam
   arrives in 0.0.1-beta.11)". Windows-update limitation bullet re-scoped to "in the upcoming
   0.0.1-beta.11 desktop lane". Shipped deploy table rebuilt from executed beta.10
   `netscript deploy list` (10 targets: docker, compose, linux-service, windows-service,
   deno-deploy, kubernetes, azure-aca, azure-app-service, azure-aks, cloud-run).
2. **Quickstart determinism/timing.** Reproduced the stall: the scaffolded `users` executable
   `waitFor(primaryDatabase)` (generated `register-services.mts:77`) gates on Aspire's Postgres
   health probe, whose first-boot latency is nondeterministic in this environment and on lane 5's
   clean machine. Printed sequence could NOT be made deterministic within a fixed envelope →
   per instruction, the "<5 minutes" promise is REMOVED (heading now plain "Quickstart"), a
   readiness step is printed ("wait until the postgres resource reports healthy… services
   deliberately wait on the database"), the payoff is conditioned on that state, and a recovery
   line is printed (aspire stop/start once the db exists). Clean re-run true timings (2026-07-18,
   fresh temp dir + isolated install root): install 1 s · init 4 s · restore 7 s · start→dashboard
   ~15 s · db init 13 s · db generate 20 s · db seed 13 s · after `aspire stop` + `aspire start`
   with the initialized db, `curl :3000/health` → 200 healthy JSON in 21 s. First-boot health-probe
   wait remains environment-dependent (lane 5 observed >5 min); this is now stated, not promised
   away.
3. **Plugin install syntax.** Prose example is now the concrete
   `netscript plugin install worker --name workers`; EXECUTED in the fresh scaffold → exit 0,
   "Installed worker plugin \"workers\" on port 8091. Created 4 plugin files. Regenerated 12
   Aspire helper files."
4. **`emit` dropped.** Canonical lifecycle now reads `plan`, `up`, `down`, with `status`/`logs` on
   the targets that honour them, and defers to executed `netscript deploy list` output. The
   "never advertises an operation it cannot honour" sentence removed (falsified for beta.10 by
   lane 5's `deploy kubernetes emit` → exit 2).
5. **Prerequisite = Deno 2.9+** in the quickstart (was 2.x), consistent with the status section.
6. **Count corrected.** "The monorepo publishes 29 packages and 6 first-party plugins to JSR",
   `@netscript/bench` explicitly named as an internal, unpublished benchmarking instrument; map
   heading now "Published package map".
7. **Dry-run claim** now "reports the file and directory counts it would create and writes
   nothing" (matches count-only output).

Gate re-run: deno fmt --check clean · tagline ≤250 B OK · docs:links OK (98 docs, 0 broken) ·
internal-wording grep zero hits · mermaid unchanged (parse-verified previously, `flowchart-v2`).
Claim→citation deltas: beta.10 deploy target set + lifecycle → executed `netscript deploy list` /
`deploy kubernetes --help` (2026-07-18); plugin install → executed command above; beta.11 marker
statements → adversarial.md shipped-truth findings (deploy desktop absent from beta.10 CLI; no
`./auto-update` export in jsr @netscript/sdk@0.0.1-beta.10); all other citations unchanged.

## Homepage — 2026-07-18 (Lane 4, owner scope extension)

Revamped `docs/site/index.vto` into a meta-framework landing page per
`homepage-research.md` (lessons applied: #1 lead-with-command+code, #3 agent-operability
first-class à la Encore, #4 contract-first visual story à la tRPC, #8 pain-point positioning;
outline §§1-7 adapted to the existing Lume machinery — hero, callout, tabbedCode, featureGrid,
diagram, learningPath components only; no visual redesign). One-entry-point rule held: message,
readiness-step quickstart posture, beta.11 desktop labeling, and limitation lines all mirror the
root README (fix-cycle-1 state).

### Structure shipped
hero (new message) → beta callout (unchanged, renders releaseVersion) → "The contract is the
product" 4-tab lead example (contract → service → scaffold → bring-up incl. readiness wait) →
"Built for humans and coding agents" (agent init tab + eyes/playbook/hands grid) → "One contract,
four moves" (existing architecture-overview.svg via comp.diagram + telemetry line) → "Durable
capabilities install as plugins" (plugin install tab + 6-plugin grid) → "Run it anywhere" (shipped
deploy lanes + "New in 0.0.1-beta.11 — native desktop lane" callout) → pillars grid now NINE cards
(added AI & Agents → fixes the _data.ts:5-6 drift noted in facts-docs-status §1.2) → Who it is for
(+ Coding agents card) → learning path + closing grid (unchanged).

### Executed examples (all on 2026-07-18)
- Tab "1 · The contract": abridged from scaffolded
  `contracts/versions/v1/users.contract.ts`; the abridged form written into the scaffold and
  `deno check --unstable-kv` → clean against published beta.10 packages.
- Tab "2 · The service": the defineService snippet covered by
  `packages/service/tests/_fixtures/readme-examples_test.ts` → `deno test` 2 passed / 0 failed.
- Tabs "3 · Scaffold" / "4 · Bring it up": identical commands executed in the fix-cycle-1 clean
  run (install/init/restore/start/db trio; timings recorded above). Hardcoded dashboard URL
  `:18888` from the old homepage REMOVED — the dashboard port is dynamic; text now says "prints
  the dashboard URL" (matches observed 42809/41997/42787).
- "Equip your agent" tab: `netscript agent init` executed (fix-cycle scaffold; .mcp.json + 3
  skills).
- "Install a plugin" tab: `netscript plugin install worker --name workers` executed → the three
  output lines shown are the verbatim command output.

### Claim → citation deltas (homepage-specific; the README map covers shared claims)
- Hero subhead composition → same citations as README hero (contracts/service/sdk READMEs,
  mcp README:57).
- "instead of ~40 lines of Hono setup" comment → carried unchanged from the previous homepage tab
  (covered by readme-examples fixture test).
- Eyes/playbook/hands grid numbers (13 tools, 50/2000 caps, 17 allow/6 deny) →
  facts-cli-agentic (tool-types.ts:4-19, truncation.ts:10, command-policy.ts:24-49).
- Deploy lanes prose → executed beta.10 `netscript deploy list`; desktop callout → adversarial.md
  shipped-truth findings + facts-aspire-deploy honest-maturity lines; how-to link
  `/how-to/build-a-desktop-frontend/` → facts-docs-status §1.5.
- Plugin grid rows → same per-plugin README citations as the README plugin table.
- AI & Agents pillar card → facts-docs-status §1.2 (nav pillar `_data.ts:141-157`).

### Gates
- `cd docs/site && deno task build` → 531 files generated in 6.67 s, green.
- `deno task docs:links` → 98 docs, 0 broken links/anchors.
- Internal-wording grep on index.vto → zero hits.
- No `_data.ts` change needed (nav untouched; drift fixed on the page side).

## Homepage fix cycle 1 + owner repositioning — 2026-07-18 (Lane 4)

### Homepage adversarial fixes (all 4)
1. Deploy-list sentence replaced with the README's passed disposition verbatim-adjacent
   ("inventories the installed targets; check `netscript deploy <target> --help` for the exact
   operations each one ships"); site-wide grep for "installed version supports" → only index.vto
   had it, now zero.
2. Scaffold tab now `netscript init my-app --db postgres --service` (and `--service` on the
   --no-aspire alternative). Full four-tab flow RE-EXECUTED end-to-end in a fresh dir (qs3):
   init → "Example service users (oRPC handler on port 3000)", 183 files/44 dirs, 5.5 s;
   aspire restore/start (dashboard printed); `cd ..`; db init/generate/seed all exit 0;
   contract snippet `deno check --unstable-kv` clean post-generate; users.contract.ts +
   services/users/src/main.ts exist as the tabs claim.
3. Generation prerequisite explicit: tab 1 comment "(@database/zod is emitted by `netscript db
   generate` in tab 4)", tab 2 comment "Runnable once the database types exist", tab 4 annotates
   `db generate # emits @database/zod, used by tabs 1-2`.
4. Tab 4 now prints `cd ..` and carries the README's aspire stop/start recovery note verbatim-
   adjacent.

### Owner repositioning (both artifacts, one brief: directive + advantage-inventory method +
compact-prose style rule)
- `competitive-advantages.md` written in this slice dir: 14 advantages each with fact-sheet proof
  point, ranked by enterprise appeal; ranking drives both artifacts' section order.
- README: new tagline (enterprise-grade meta-framework; 250B gate OK) + compact hero
  ("What Laravel is to PHP, NetScript aims to be for the TypeScript backend" + derive-cannot-
  drift + ships-anywhere line + not-a-hosted-service line). Section order now: Quickstart →
  One contract, four moves (architecture) → Batteries no frontend framework ships (differentiation
  + plugin table; names Next.js/Nuxt/SvelteKit/Angular as scope contrast per owner) → Packages →
  Ship anywhere (spectrum line: "single compiled binary … multi-cloud distributed infrastructure
  — and, from 0.0.1-beta.11, a native desktop app on a consumer machine"; cloud-agnostic adapter
  framing; no specific unshipped target named) → Operable by coding agents (DEMOTED chapter,
  substance intact) → Documentation → Status → Contributing → License.
- Homepage: hero re-led ("One contract. A whole production backend." + enterprise subhead with
  the spectrum line); agent section moved BELOW Ship anywhere with substance intact; plugin
  section retitled "Batteries no frontend framework ships"; "Ship anywhere" gains the compact
  spectrum paragraph (desktop half version-marked beta.11); prose tightened per style rule.
- Version truth: spectrum's desktop clause is beta.11-marked in both artifacts; shipped deploy
  table/prose unchanged from the corrected beta.10 truth; owner's Cloudflare mention rendered as
  the cloud-agnostic/adapter direction without asserting an unshipped target (owner directive is
  the source for the direction framing; no shipped-claim added).
- Claim→citation deltas: "What Laravel is to PHP… aims to be" + "THE default…"-derived framing →
  owner repositioning directive (2026-07-18, in-run), phrased as aim, not fact; spectrum line →
  owner directive + FAD D2 (OS-service single binary shipped; desktop = beta.11); frontend-
  framework contrast → scope statement grounded in FRP D2 (first-party plugin batteries); all
  other claims retain their existing citations. Accuracy fixes from all prior cycles verified
  intact (deploy-list wording, --service tabs, prerequisites, recovery posture, counts, Deno 2.9+).

### Gates (re-run after repositioning)
- README: `deno fmt --check` clean; tagline gate OK (checked=1 over=0); mermaid re-parse
  MERMAID_PARSE_OK flowchart-v2; internal-wording grep zero hits.
- Site: `deno task build` → 531 files, 6.75 s; `docs:links` → 98 docs, 0 broken;
  index.vto wording grep zero hits.
