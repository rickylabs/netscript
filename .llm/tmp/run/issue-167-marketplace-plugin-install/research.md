# Research — Issue #167: Deno-native JSR plugin installer (marketplace foundation)

| Field | Value |
| ----- | ----- |
| Run ID | `issue-167-marketplace-plugin-install` |
| Target branch (impl) | `feat/plugin-install-jsr-dx` (off `origin/main`) |
| Phase | `research` |
| Target | `packages/cli` + the 5 `@netscript/plugin-*` packages |
| Archetype | ARCHETYPE-5 (plugin) + ARCHETYPE-3 (CLI/tooling package) |
| Scope overlays | service (CLI process spawning + JSR network), none-frontend |

## Problem & baseline (re-baselined against origin/main @ alpha.12)

Run-2 fresh-user eye-tests of all four published tutorials on `jsr:@netscript/cli@0.0.1-alpha.12`
found **0 of 4 completable**. Every tutorial walls at its first official-plugin step:

> `Unsupported plugin kind … Supported kinds: api` (exit 246)

Grounding (agent a5303665fdb3cd878, re-confirmed by ac1ed46e6eb2f9b57) proved the published
`netscript plugin add <official-kind>` path **does not exist** for a real userland install. Official
kinds (`auth`/`workers`/`sagas`/`triggers`/`streams`) are registered **only when the CLI discovers a
NetScript monorepo checkout above the project** (`add-plugin.ts:88-92` →
`resolveOfficialPluginSourceRoot` → `official-plugin-source.ts:hasOfficialPluginSources` requires
`packages/cli/bin/netscript.ts` + `plugins/*/scaffold.plugin.json`). A `jsr:@netscript/cli` userland
install has no such checkout, so `DEFAULT_PLUGIN_KIND_PROVIDERS` ships only `['api']` and every
official kind is rejected. The `scaffold.runtime` e2e "passes" only because it scaffolds **inside the
monorepo**, so the walk-up finds the real checkout — the true userland-JSR install path is
**untested and unbuilt**. This is the central blocker walling all four tutorials (#135) and the work
#67 anticipated.

The user's resolution (2026-06-28) is an **architectural redesign**: make `plugin add` a Deno-native,
JSR-URL-scheme installer that is identical for first-party and third-party plugins and becomes the
**foundation of the NetScript marketplace**. Bar: "extremely robust, Enterprise grade, AND Deno
native." Captured as **issue #167**.

## The design under evaluation (#167)

`plugin add <kind-or-spec>` →
1. Resolve: bare name → NetScript-scoped JSR pkg; scoped name (`@acme/x`) → that pkg as-is.
2. Validate the URL is a real JSR package.
3. Validate it is a real NetScript plugin (published protocol/manifest contract).
4. External pkgs: extract JSR metadata + confirm (skippable `--skip-confirmation`/`--ci`).
5. Run the plugin's OWN scaffolder via `deno x`/`deno run jsr:…` — plugin emits its scaffold artifacts
   (prisma/service/routes/Aspire); CLI does not embed templates.
6. Integrity-verify output + run declared post-install scripts.
Symmetry: maintainer defaults `--local-path` (accepts `--jsr-url`); prod defaults JSR (accepts
`--local-path`). Runtime = thin JSR import (no source copy); scaffolding = the installer run.

## Stream A — Deno-native technical grounding (COMPLETE)

Full artifact: `./grounding-deno-native.md`. Verdict: **IMPLEMENTABLE on Deno 2.9 + JSR**. Headlines:

- **`deno x` / `dx jsr:…` exists in 2.9** ("Execute a binary from npm or jsr, like npx"); passes
  through all permission flags (`-A`, `--allow-read[=PATH]`, `--allow-write[=PATH]`, `--allow-net`,
  `--allow-env`, `--allow-run`, `--deny-*`, `--allow-scripts[=PKG]`, `--minimum-dependency-age`).
- The repo **already has the dx-runner primitive**: `dispatchPluginVerb`
  (`public/features/plugins/dispatch/dispatch-plugin-verb.ts:42`) runs `deno x -A jsr:<pkg>/cli <verb>`
  via a `ProcessPort` with `resolvePluginCliSpecifier()`. The new installer extends this to a
  `scaffold` verb — **not a new mechanism, an extension**.
- **The real gap (core new work)**: plugin `./cli` exports only operational verbs; **no plugin ships a
  dx-runnable scaffolder** that emits project artifacts. Artifact emission lives only in CLI-embedded
  `generatePlugin*` generators (`scaffolder.ts`). `./scaffolding` today is a static descriptor that
  emits nothing. So each plugin must gain a dx-runnable scaffold entrypoint. `auth` is the outlier
  (no `./cli`, no `./scaffolding`).
- **JSR validation APIs verified** (Accept: application/json): `meta.json` (existence/latest/yank),
  `<version>_meta.json` (`exports` map for protocol check + per-file sha256 for integrity),
  `api.jsr.io/scopes/<scope>/packages/<pkg>` (description/githubRepository/score/runtimeCompat for the
  confirmation prompt).
- **`deno add jsr:@scope/pkg`** is the correct thin runtime-wiring primitive (writes `imports` map,
  no source copy).
- **Manifest seed exists and already ships**: `scaffold.plugin.json` (`provider` =
  `PluginKindProvider` + `officialSource`) — today typed only by local TS interfaces, parsed untyped;
  needs promotion to a versioned, published, zod-validated contract.
- **e2e blind spot identified**: `create-default-runner.ts:49-54` roots the project inside the
  monorepo and runs `netscript-dev.ts`; a true userland e2e must root in `Deno.makeTempDir()` outside
  any checkout, install the published CLI, real-JSR install `@netscript/plugin-*` with
  `--minimum-dependency-age=0`, and assert no source copied.
- **Three open decisions** surfaced (naming convention, trust tier for `-A`, separate protocol pkg).

## Stream B — Marketplace competitive deep-search (COMPLETE)

Engine: OpenHands + `openrouter/google/gemini-3.5-flash`. Full dossier: issue #167 comment
(`#issuecomment` on 2026-06-28; saved locally for synthesis). Exemplars: Angular `ng add`/schematics,
Astro `astro add`, Nuxt `nuxi module add`, Nx generators, Expo config plugins, Gatsby Recipes, Medusa,
Directus (sandbox), Strapi, Convex components, VS Code marketplace. Headlines:

- **Closest analogs validate the design.** `ng add` (npm pkg → schematic that mutates project),
  `astro add` (resolve integration → edit config with a confirmation **diff** → install deps),
  `nuxi module add` (registry resolution + config wiring), Nx generators (in-memory `Tree` +
  `--dry-run`). NetScript's "plugin owns its scaffolding via dx" is a **clean orchestrator/plugin
  separation** that these ecosystems approximate but none achieve as cleanly.
- **#1 ranked pattern = Deno permission-scoped scaffolder execution.** Every npm-ecosystem installer
  (Angular, Astro, Nx, Storybook, npm install-scripts) runs **unsandboxed** with full local
  privileges — the industry's biggest install-time security hole. NetScript can be best-in-class by
  spawning third-party scaffolders under confined Deno flags
  (`--allow-read=<root>`, `--allow-write="<root-subdirs>"`, `--deny-net` by default, `--deny-run`),
  prompting only for declared extra capabilities. **This is the highest-value differentiator.**
- **Declarative-over-imperative scaffolding** (Gatsby Recipes MDX, Convex components,
  VS Code `contributes`). Imperative AST mutation of user files (Angular/Astro/Nx) is powerful but
  **fragile**. NetScript should favor writing **deterministic, self-contained plugin modules/config**
  the runtime imports at boot, and avoid AST-rewriting user-authored controllers/routes (anti-pattern
  AP-4). Where config wiring is unavoidable, keep it append-once and idempotent.
- **Static manifest read BEFORE executing code** (VS Code reads `contributes` without running the
  extension). NetScript's step-3 protocol validation must be **static** (read the published manifest /
  `_meta.json` exports) — never "run it to see if it's a plugin."
- **Astro-style diff preview + Nx-style `--dry-run`** are the DX features #167 is currently MISSING.
  Add `--dry-run` (in-memory, log created/modified files, no writes) and a pre-write change summary.
- **Idempotency mandate** — scaffolders must be safely re-runnable (Gatsby keeps a state log; Angular
  reverts the virtual tree on conflict).
- **Typosquatting/scope-hijacking guard** (AP-3) — bare-name resolution must default to the verified
  `@netscript` scope only; warn before resolving to unverified third-party scopes.
- **Local/published symmetry** — Nx workspace generators ≈ NetScript's `--local-path`; the design's
  maintainer/prod symmetry is well-precedented.
- **Marketplace roadmap** — JSR-native resolution (now) → verified scopes + signature/provenance
  curation → `market.netscript.dev` discovery portal harvesting JSR search. Build the foundation so
  these layer on without rework.
- **Uninstall integrity** — write artifacts to dedicated deterministic paths so removal is clean
  (Angular's orphaned-code problem is the anti-pattern).

## Convergence — what the two streams agree on

1. The design is **sound and implementable**; the dx-runner already exists; the core build is the
   per-plugin scaffolder + the published protocol + the static validator + the confined-permission
   runner + the true-userland e2e.
2. **Security model is the crown jewel**: confined Deno permissions for third-party scaffolders, with
   `@netscript/*` first-party trusted. Both streams independently rank this #1 and converge on the
   same flag matrix.
3. **Protocol must be static + versioned + zod-validated**, validated without executing plugin code.
4. **Add `--dry-run` + change preview + idempotency** — best-in-class DX the design omitted.
5. **Naming**: keep verified-scope resolution (`@netscript/plugin-<kind>`) to defeat typosquatting.

## Open decisions (resolved for the plan)

- **D1 Naming convention.** **LOCK Option A**: keep published names `@netscript/plugin-<kind>` and add
  a bare-kind→package **alias map** in the resolver (`workers`→`@netscript/plugin-workers`,
  `auth`→`@netscript/plugin-auth`, handling singular-kind→plural-pkg). Zero republish, does not break
  alpha.12 consumers, and the alias map is exactly the verified-scope guard the deep-search recommends
  (AP-3). Option B (rename to `@netscript/<kind>`) is a cleaner long-term marketplace identity but
  breaks every current consumer + orphans names + forces a re-publish — defer to a future
  marketplace-identity decision, not this foundation. **Safe-to-defer? No — must lock now** (it drives
  the resolver), and it is locked.
- **D2 Trust tier for `-A`.** **LOCK**: first-party `@netscript/*` scaffolders run trusted (may use
  broad permissions, matching today's `dispatchPluginVerb -A`); third-party run under the confined
  matrix + confirmation gate. Both streams agree.
- **D3 Separate `@netscript/plugin-protocol` package?** **Defer (safe).** Start by formalizing the
  manifest inline in each plugin (`scaffold.plugin.json` promoted to a versioned, zod-validated,
  published contract) + a shared types export from an existing kernel surface. Extracting a standalone
  `@netscript/plugin-protocol` package is an additive future step that does not force rework. Recorded
  as backlog.

## Sources

- Stream A grounding: `./grounding-deno-native.md` (Deno 2.9 CLI + JSR APIs verified live).
- Stream B dossier: issue #167 comment (Gemini 3.5 Flash via OpenHands), exemplar URLs inline.
- Repo ground truth: file:line citations in grounding + `cli-plugin-copy-two-path-verdict` memory.
