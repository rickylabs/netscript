# Research — package + framework README revamp (PR2/PR3)

Run-id: `docs-readme-revamp`. Branch: `docs/readme-revamp` (off `origin/main` `1b3c63c2`).
Scope overlay: `SCOPE-docs.md` (doc-authoring lane — no `packages/`/`plugins/` SOURCE edits;
README.md + each package's `deno.json` `publish` glob only). This is the CLAUDE.md
documentation-authoring exception: Claude workflow authors prose, OpenHands validates.

## Ground truth

### README inventory (31)
26 packages + 5 plugins, each with a `README.md` (range 24–290 lines; mix of stub and rich):

```
packages: aspire auth-better-auth auth-kv-oauth auth-workos cli config contracts cron database
          fresh fresh-ui kv logger plugin plugin-auth-core plugin-sagas-core plugin-streams-core
          plugin-triggers-core plugin-workers-core prisma-adapter-mysql queue runtime-config sdk
          service telemetry watchers
plugins:  auth sagas streams triggers workers
```

### Published docs site (cross-ref target)
- Canonical base URL: `https://rickylabs.github.io/netscript/` (`docs/site/_config.ts:49`).
  Project Pages → all paths are under `/netscript/`. README links rendered on JSR are NOT
  site-relative, so cross-refs MUST be ABSOLUTE `https://rickylabs.github.io/netscript/<path>/`.
- 28 reference pages exist at `/reference/<name>/`:
  aspire, auth, auth-better-auth, auth-kv-oauth, auth-workos, cli, config, contracts, cron,
  database, fresh, fresh-ui, kv, logger, plugin, plugin-auth, plugin-auth-core,
  prisma-adapter-mysql, queue, runtime-config, sagas, sdk, service, streams, telemetry, triggers,
  watchers, workers. (`index.md` per dir under `docs/site/reference/`.)
- Capability/explanation surface (pillars + Diátaxis):
  `identity-access/`, `background-processing/`, `data-persistence/`, `durable-workflows/`,
  `observability/`, `orchestration-runtime/`, `services-sdk/`, `web-layer/`,
  plus `capabilities/`, `how-to/`, `tutorials/`, `explanation/`.

### Cross-ref map (package → PRIMARY reference page + pillar hub)
Most packages have a same-name reference page. **Four exceptions have NO own reference page** — their
meaningful target is the sibling plugin reference + the capability pillar, NOT a name-match stub:

| package | reference page | pillar hub (meaningful target) |
| --- | --- | --- |
| aspire | /reference/aspire/ | orchestration-runtime |
| auth-better-auth / auth-kv-oauth / auth-workos | /reference/<same>/ | identity-access |
| plugin-auth-core | /reference/plugin-auth-core/ | identity-access |
| plugins/auth | /reference/plugin-auth/ (or /auth/) | identity-access |
| cli | /reference/cli/ | (cli-reference / tutorials) |
| config / runtime-config | /reference/<same>/ | orchestration-runtime |
| contracts / sdk / service | /reference/<same>/ | services-sdk |
| cron / queue / watchers | /reference/<same>/ | background-processing |
| database / kv / prisma-adapter-mysql | /reference/<same>/ | data-persistence |
| fresh / fresh-ui | /reference/<same>/ | web-layer |
| logger / telemetry | /reference/<same>/ | observability |
| plugin | /reference/plugin/ | orchestration-runtime |
| **plugin-workers-core** | ⛔ none — use /reference/workers/ | background-processing |
| **plugin-sagas-core** | ⛔ none — use /reference/sagas/ | durable-workflows |
| **plugin-triggers-core** | ⛔ none — use /reference/triggers/ | durable-workflows |
| **plugin-streams-core** | ⛔ none — use /reference/streams/ | background-processing |
| plugins/sagas, plugins/streams, plugins/triggers, plugins/workers | /reference/<same>/ | matching pillar |

Authoring agents MUST verify each link resolves on the live site AND points at content that
actually discusses the package (not a regex name match). The 4 `-core` rows are the highest risk.

### `/docs` removal reality
No in-package `/docs` FOLDERS exist on disk. "Remove /docs" resolves to two concrete actions:
1. Strip dangling `./docs/*.md` links from the ~6 READMEs that reference non-existent files
   (service, plugin-sagas-core, plugin-workers-core, plugin-auth-core, plugins/workers,
   plugins/sagas). Verify the exact set during authoring (dead-link scan).
2. Remove `docs/**/*.md` entries from those packages' `deno.json` `publish.include` globs so the
   JSR publish surface matches reality.

### Version literals in READMEs
Only `packages/service/README.md` carries a version literal (`@^0.0.1-alpha.0`). PR1 aligns all
members to `0.0.1-alpha.1`; READMEs should use UNVERSIONED install (`deno add jsr:@netscript/<pkg>`)
so they never drift — version pinning belongs to the consumer, not the README sample.

## Voice / doctrine constraints
- No "honest/honesty/honestly" or candor-announcing framing (repo doctrine).
- Alpha maturity stated factually (one clean callout), never apologetically.
- Ground every code sample in real exported API (`deno doc jsr:@netscript/<pkg>` / source) — no
  invented signatures. Samples should be runnable or clearly snippet-marked.

## Dependencies / sequencing
- **C0 dossier** (`sota-readme-dossier.md`) = authoring-convention source; dispatched 2026-06-24
  (OpenHands `openrouter/google/gemini-3.5-flash`, PR#117). Plan locks conventions FROM it.
- PR2 must merge BEFORE the JSR release tag (READMEs are in the publish surface).
- PR3 (root README) authoring waits until PR2 lands so it bases on finished package docs; its
  research is Track 2 of the same dossier.

## Open questions for the plan
- Q1: For the 4 `-core` packages, is the pillar-hub the right primary cross-ref, or should the
  reference index gain `-core` pages? (Plan decision: cross-ref pillar+plugin; do NOT add ref pages
  in this doc PR — that would be a docs-site change, separate scope.)
- Q2: One Claude authoring agent per README (31), or grouped by family? (Lean: one deep agent per
  README for depth, families share a context brief.)
- Q3: Link-verification gate mechanism — build the site and curl, or static map-check? (Lean: static
  resolve against `docs/site/**` tree + a live HEAD check in C2.)
