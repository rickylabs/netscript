# T7 — Build & dev integration (charter Q8 + frontend contribution surface #3: Vite)

> **HISTORICAL EVIDENCE — frozen at authoring time.** Where this pack disagrees with
> `docs/architecture/rfc/rfc-0002-devtools-contribution.md`, **the RFC wins**. Notably the package
> boundary was later corrected from `A2 plugin-devtools-core` to **A1 `packages/devtools-core` +
> A6 CLI emission + A5 plugin**, and identity/ordering were unified on `(mountId, id, apiMajor)`
> and anchors-then-`(order, mountId, id)`. See `RFC-AUTHORITY.md` and `drift.md`.


Stage-D deep-dive pack, run `plan-devtools-contribution--seed`, baseline `main` @ `2256a67bf`.
Planning only; no source or GitHub mutation. Citation convention: `rN`/`mN`/`pN` are corpus files
under `research/`, each of which carries `path:line` evidence; where a claim is load-bearing the
underlying repo path is repeated inline. Judgements are marked `inference`; unclosed facts are
marked `unverified` with the probe that closes them.

## Recommendation

1. **DevTools contributions enter the build as generated source modules, not as Vite plugins.**
   The app's existing single-Vite-process pipeline (`fresh()` + `createNetScriptVitePlugin`,
   r1 F6/F7) consumes a transactionally generated replace-set of literal-specifier registry files;
   Vite never learns that DevTools exists. This sidesteps the three facts that kill a Vite-shaped
   seam at this baseline: there is no Vite-contribution seam at all (r1 F6, D-row 3 —
   `vite.config.ts` is static template text; zero references to `createNetScriptVitePlugin` from any
   plugin), `transformIndexHtml` injection silently no-ops for apps that render their own HTML,
   which Fresh 2 does (m1 F9, S-18), and the entire Vite DevTools ecosystem floors at Vite 8 while
   NetScript pins 7.2.2 (m1 F28/D2; `deno.json:248`, `packages/fresh/deno.json:56`).
2. **Adopt #890's transactional replace-set as the registry write law** — stage out-of-place →
   `deno check` a generated `devtools.check.ts` that statically imports every referenced module →
   atomic swap or rollback, deterministic empty emissions — argued from the shipped defect class it
   fixes (non-transactional per-target writes, existence-only verification, walker leak on remove:
   r3 F8, r4 D4/F10), not from deference to #890 (which is merged design text with zero
   implementation, p1 F1/D-1).
3. **No new watch loop for v1; `plugin dev` is deferred with contracts and entry criteria** (§Dev
   loop verdict). Panel *content* edits ride Vite's own watcher/HMR because panels compile from
   source in the app graph; only *contribution-set* changes need regeneration, and every set-change
   event is already an explicit CLI command.
4. **A generic Vite-contribution RFC is not a prerequisite — it is explicitly deferred** with
   consumed contracts, three entry criteria, and a named owning dependency (the Vite-8 migration
   epic). DevTools v1 must be buildable without it, and is (§Vite-contribution verdict).
5. **Production posture: two independent exclusion mechanisms, both polarity `!== 'development'`**
   (fail-safe, not fail-open), per the TanStack precedent of distrusting a single signal (m2 F6/F7)
   and stricter than upstream, which ships devtools into production builds with client auth disabled
   (m1 D4, F11). The shipped `/design` route group has **no** dev gating (r1 F13) — DevTools must
   not repeat that omission.

## Mount & build integration

### The contribution path into the build

The unit of build integration is the **generated DevTools replace-set** under
`.netscript/generated/devtools/` (exact family name and envelope are T2's; the file mechanics are
T7's). Fixed file inventory, mirroring #890's C5 shape (p1 C5) minus the gateway file (whose
ownership is T5/T6):

| File | Contents |
| --- | --- |
| `devtools.registry.ts` | identities, resolved mounts, contribution descriptors, **literal lazy loaders** (`load: () => import('<pinned specifier>')`) — never computed specifiers |
| `devtools.routes.ts` | `createRouteReference` entries for panel routes, spread into the app-owned `router.ts` exactly as the `(design)` route refs are today (r1 F5, F13; `router.ts.template:33-46`) |
| `devtools.islands.ts` | island specifier list for the islands feed (see the P-1 probe below) |
| `devtools.css` | layer-ordered CSS imports |
| `devtools.check.ts` | static-import module referencing every module named above — the type gate's teeth |

All five are emitted **deterministically, even when empty** — this is what makes removal unable to
dangle (§Install / update / remove).

Vite sees these files only because they sit inside the app root and are (transitively) imported
from the app's mount point. No alias changes: the hardcoded three-alias template trap ("adding a
plugin adds no alias", r1 F11) is avoided by emitting **full package specifiers** resolved through
the app's import map, pinned to the installed version (§Install / update / remove, resolution).

### Mounting (constraints handed to T1, not decided here)

Whatever host shape T1 picks, T7 imposes:

- **Not an HTML-transform hook.** Mounting is a NetScript-owned route tree / `configure(app)`
  registration on `defineFreshApp` (r1 F2) — the only injection mechanism the market offers
  (`transformIndexHtml`) is in a documented silent-failure bucket for Fresh (m1 F9). The `m1` OQ6
  probe (does Vite serve the app HTML in a NetScript Fresh 2 app?) should still be run before the
  RFC asserts this as fact, but both outcomes land on the same design: NetScript-owned mounting.
- **Route files must not be loose under `routes/` if generated.** The route-manifest generator
  rewrites app page modules by default (`pageModuleRouteBinding`, r1 F8) at init/build/watch, and
  `_devtools/` / `(_devtools)/` trees are invisible to the walker (r1 F4). Import-mode registration
  therefore mounts via `devtools.routes.ts` → `router.ts` spread + `configure`/`fsRoutes` adapter
  (no files under `routes/`), while copy-mode (fallback below) uses a visible
  `routes/(devtools)/devtools/…` tree mirroring the shipped `(design)/design` precedent (r1 F4,
  F13).
- **Single Vite process, single Preact.** Panels must resolve `preact`/`@preact/signals` through
  the app's dedupe + canonicalizing `resolveId` (r1 F16; `vite.ts:322,380-393`). A prebuilt panel
  bundle from a different resolution root risks a second Preact copy and dead signals. **Therefore
  contributed panels ship as source and compile in the app's Vite graph — prebuilt browser bundles
  are rejected as a contribution form.** `inference` from r1 F16.
- **Source maps come free from this decision.** Same-graph compilation means dev source maps are
  Vite's own, pointing at the contributor's actual source (workspace path in local mode, cache path
  for JSR). No devtools-specific source-map machinery is needed; rejecting prebuilt bundles is what
  preserves this.

### Island registration — the one unverified integration point

Whether `@fresh/plugin-vite` accepts additional island specifiers / a second island root in one
Vite process is **unverified** (r1 OQ1, research.md open Q2). #890 designed a
`frontend.islands.ts` feed (p1 C5) but shipped nothing (p1 F1). This is the single hardest unknown
in T7 and must be closed by **probe P-1** (read `jsr:@fresh/plugin-vite` source / `deno doc`, then
a two-island-root spike) before stage-E plan lock.

- **P-1 passes → import-mode** (primary): `devtools.islands.ts` feeds the discovered island set;
  panels are imported from packages.
- **P-1 fails → copy-mode fallback** (fully buildable on shipped mechanisms today): the
  transactional generator **materializes** contributed panel files into the app tree —
  `routes/(devtools)/devtools/<mountId>/…` and `islands/devtools/<mountId>/…` — where the
  filesystem walker and Fresh's default island discovery pick them up with zero framework change
  (r1 F4; the `ui:add` copy model, r2 F5, is the precedent). Files carry a provenance header;
  cleanup is by regeneration (§Install / update / remove). Costs (owned drift, upgrade churn) are
  the known costs of the copy model (r2 F5, F11).

Both modes write through the same transaction (§Registry transactions); the fork changes what the
transaction's target set *is*, not how it is written. `inference`: this two-mode framing is the
cheapest way to keep the RFC assertable while P-1 is open.

### Production exclusion — two independent mechanisms

Adopted from the TanStack two-mechanism precedent, with the polarity rule made normative: **check
`!== 'development'`; anything not literally development is off** (m2 F6/F7 — "Some providers …
might not use 'build' command but will always set mode to 'production'"). Upstream Vite DevTools is
the cautionary opposite: build mode is a supported target *with client auth disabled by
construction* (m1 D4, F10/F11 — `DTK0008`). NetScript is stricter than every system surveyed:

1. **Mechanism A — build-graph absence (bundle level).** The app-side mount import of
   `devtools.registry.ts` sits behind a constant the NetScript Vite plugin already owns via its
   `define` entries (`import.meta.env.*`, r1 F7): `import.meta.env.MODE !== 'development'` folds to
   a dead branch and the entire devtools graph is DCE'd from `vite build` output. Zero devtools
   bytes in a production client bundle.
2. **Mechanism B — server-side runtime refusal (independent of the build).** The host middleware
   that serves the DevTools mount evaluates the *runtime* environment on every request and returns
   404 when not development. If artifacts leak into a production bundle anyway (mechanism A
   defeated by a provider's env variance), the surface still refuses to serve. This is stronger
   than TanStack's second mechanism (a source transform) for a server-rendered surface, and it is
   the gate `/design` never got (r1 F13).

Belt-and-braces third option (cheap, recommended, owner-confirmable): the app `build` task re-runs
the generator in production mode, which emits the **deterministic empty replace-set** — nothing to
fold, nothing to refuse. §Open questions #5.

## Registry transactions

### The defect class being fixed (evidence, not deference)

At this baseline, registry writes are non-transactional everywhere on the plugin path:

- Plugin-owned generators `Deno.mkdir` + `Deno.writeTextFile` per target with **no temp file, no
  rename**; a crash between targets leaves a partially updated set (r3 F8;
  `plugins/workers/src/cli/runtime-registry-generator.ts:88-95`).
- The host then asserts only that each declared `registryPath` **exists** — content is never
  verified (r4 F3; `installed-runtime-registry-generator.ts:100-109`).
- Two divergent generators write to **different paths** (manifest-driven vs SDK walker), and the
  walker's `AstExtractor` is a **regex over comment/string-stripped text**, not an AST parse,
  recognizing exactly three hardcoded builders (r4 F3, D4, D5).
- Walker-emitted `<axis>.registry.ts` files are **not cleaned on `plugin remove`** — removal only
  deletes `.netscript/generated/<name>` and `plugin-<name>` (r4 F10, OQ2).

#890's transactional replace-set (p1 C5/C7) is therefore **a fix for a shipped defect class, not
gold-plating** — and T7 adopts it as the write law for the DevTools family regardless of whether
the #890 spine itself lands first (owner fork #1, S-2).

### The transaction rule (normative)

> Every DevTools registry write is a **replace-set transaction**: (1) enumerate the full,
> deterministic target set — fixed filenames, emitted even when empty; (2) stage the entire set
> out-of-place under `.netscript/generated/.staging/devtools-<txid>/`; (3) validate the staged set
> with `deno check` (with `--unstable-kv` per repo validation policy) of the staged
> `devtools.check.ts`, which statically imports **every** module the set references; (4) on
> success, atomically swap the staged set into place (dir swap / per-file rename); on any failure,
> roll back and leave the previous set byte-identical; (5) byte-identical regeneration is a skip
> (idempotent). Existence is never the verification; content-compilability is.

Two amendments to today's manifest-driven pipeline:

- **The host owns the transaction; the plugin generator writes only into the staging root** handed
  to it (an `--out-dir` contract), never into `.netscript/generated/` directly. This inverts
  today's "plugin writes final paths, host checks existence" (r4 F3) and creates the seam where the
  declared-but-unenforced scaffolder permissions (r3 F10 — spawn currently gets flat
  `--allow-read --allow-write` over the project root) can later be narrowed to
  `--allow-write=<staging>`. The enforcement decision itself is T6's; T7 delivers the seam.
- **The DevTools family binds to the manifest-driven generator path only** — the one the CLI
  already labels "authoritative" (r4 F3; `generate-plugin-registries-command.ts` description). The
  regex walker is **not** extended with devtools kinds; its extraction model (three hardcoded
  builders, r4 D5) and its remove-leak (r4 F10) disqualify it, and `plugin update`/`item-add` must
  route the devtools family through the transactional generator, not the walker (§Install / update
  / remove).

Doctor detects the two failure residues the transaction can leave: a stale `.staging/` directory
(crash before swap) and registry/manifest drift (§Doctor diagnostics).

## Dev loop verdict

**`plugin dev` does not exist** — no watch loop anywhere in the CLI; the only "watch" is a flag
string emitted into Aspire registration; regeneration is always explicit and command-triggered
(r4 F6, S-15). The question is whether DevTools must invent one. **Verdict: not for v1.**

Split the change classes:

| Change | Frequency in a panel-authoring loop | Who handles it |
| --- | --- | --- |
| Panel **content** edit (TSX/CSS body of an already-registered contribution) | Dominant | **Vite's own watcher/HMR** — panels compile from source in the app graph (§Mount), so content edits are ordinary module updates. No NetScript code runs. |
| **Contribution-set** change (add/remove/rename a contribution, manifest edit) | Rare; already command-shaped | The triggering CLI command (`plugin install/remove/item-add`, `generate …`) re-runs the transactional generator. Idempotence makes re-running free. |
| App **route** edit while a panel is open | Incidental | Known limitation: the dev watcher answers any route change with a **full page reload, not an HMR patch** (r1 F7; `vite.ts:429`) — a panel holding client state is reset. v1 ships this as documented behavior plus authoring guidance (persist inspection state in the URL/`sessionStorage`); fixing the reload granularity is an upstream-facing Fresh/Vite concern, out of RFC scope. |

So v1 watches **nothing new**. A watch loop over today's substrate would also be actively unsafe:
it would multiply the partial-write window of the non-transactional generator (§Registry
transactions) — the transaction is a *prerequisite* of any watcher, not a nicety.

### `plugin dev` — deferred, with contracts (not a vague deferral)

- **Consumed contracts:** the deferred watcher consumes exactly the transactional
  `generateDevtoolsRegistry()` entry point and the replace-set idempotence guarantee defined above;
  it adds only a *trigger*, never a second write path. It also consumes the existing
  `configureServer` seam of `createNetScriptVitePlugin` (`watchPaths` + debounced regeneration +
  `full-reload`, r1 F7) — the preferred home is an in-process watch on plugin manifest files inside
  the Vite plugin, **not** a standalone CLI daemon (`inference`: a daemon would duplicate the
  watcher that already exists in the dev server and add a second process to supervise).
- **Entry criteria:** (1) the transactional generator has landed and is the only devtools write
  path; (2) at least two first-party panel kinds have shipped and their authoring retros evidence
  that contribution-*set* changes (not content edits) are frequent enough that command-triggered
  regeneration is a measured friction — the content-edit loop is already hot via Vite, so demand
  must be shown, not presumed; (3) the watch-home decision (configureServer vs CLI) is taken
  jointly with the Vite-8 question, because Vite 8's `devtools.setup(ctx)` seam (m1 F2) is the
  shape a NetScript watcher would want to converge on.
- **Owning implementation dependency:** the DevTools implementation epic's dev-experience wave
  (stage-E DAG names the epic; T7 hands it this contract). It is not a prerequisite of any v1
  deliverable.

## Install / update / remove

All three verbs converge on one invariant: **the generated state after any verb equals a fresh
transactional regeneration from the surviving manifest set.** No verb hand-edits registry files.

- **Install.** Resolution reuses the single existing branch point
  (`resolvePluginDescriptorBeforePlanning`, r4 F7): `--local-path` → local descriptor,
  `source = {kind:'local-path'}`; otherwise JSR spec → validated, pinned
  `source = {kind:'jsr', specifier: jsr:<pkg>@<version>}`. The final install step runs the
  transactional regeneration; **a type-broken contribution fails install with the real `deno
  check` diagnostic and rolls the swap back** — no half-installed registry state, extending the
  existing snapshot/reversal discipline (`netscriptInstall` block, r4 F8) to the devtools family.
- **Build determinism / local-vs-JSR in the emitted set.** The registry emits **literal, pinned
  specifiers** derived from `source.kind`: workspace/file specifiers for `local-path`,
  `jsr:@scope/pkg@<exact-installed-version>/…` for JSR (the lockfile pins transitives). Loaders are
  literal, never computed (p1 C5). Regeneration from the same installed set is byte-identical —
  that is the determinism claim, and it is testable (regenerate twice, diff).
- **Update.** `plugin update` today is a forced reinstall keyed on the installed *local name* that
  then runs the **walker** (r4 F9) — for the devtools family it must instead re-run the
  transactional manifest-driven generator. The known defect that a custom-named plugin resolves
  nothing through the alias/scoped-name resolver (r4 F9, D6) is inherited, not fixed here; it is
  flagged to T9/owner as an existing CLI defect the RFC should reference, not silently absorb.
- **Remove — fixing the leak.** Removal **never deletes registry files; it regenerates them**
  without the departed plugin, and because the replace-set emits **deterministic empty files**, a
  DevTools registry with zero contributors is an empty-but-valid module set — imports can never
  dangle (p1 C7). This is added as a step in the existing removal plan alongside its current
  snapshot-restore semantics (r4 F10). In copy-mode, materialized panel files are part of the
  transaction's target set and are removed by the same regeneration; app-*authored* files under the
  devtools tree are never touched — doctor reports orphans by provenance header instead of deleting
  (p1 C7).
- **The pre-existing walker leak** (`.netscript/generated/<axis>.registry.ts` surviving
  `plugin remove`, r4 F10/OQ2) is **named as a defect the RFC's design must not inherit**, and
  recommended for filing as a separate debt/bug issue rather than smuggled into DevTools scope
  (§Open questions #2).

## Doctor diagnostics

`plugin doctor` is a genuine reuse target, not an aspiration: it already runs plugin-contributed
checks by dynamically importing the plugin's `doctor` entrypoint and executing
`extraChecks[].run(ctx)` under a read-only `dryRun: true` context, mapping results to
`plugin:<i>:<name>` (r4 F2 #8; `doctor-plugin-use-case.ts:278-330`), and it already writes a
diagnostic receipt and exits 1 on any error.

Additions land in **two places, neither of which is the closed literal**:

1. **Host-side built-in checks** (join the existing inventory of config/apphost/manifest/workdir
   checks, r4 F2):
   - `devtools:registry-drift` — regenerate the replace-set in memory, byte-compare against disk;
     mismatch ⇒ error with remediation `Run: netscript generate …` (mirrors the existing
     `manifest` check's remediation pattern, r4 F2 #4).
   - `devtools:staging-residue` — a leftover `.staging/devtools-*` directory ⇒ warning naming the
     interrupted transaction.
   - `devtools:contribution:<state>` — the five-state contribution taxonomy printed verbatim
     (p1 F14 #7, C6): **unknown zone** (error) / **known-but-unmounted** (info, *not* quarantine) /
     **capacity-rejected** (deterministic overflow report) / **window-mismatch quarantine** /
     **load-failure quarantine**. Zone/window vocabulary is T2's; doctor is its reporting surface.
   - `devtools:prod-gate` — asserts both exclusion mechanisms are present in the app (the folded
     mount guard and the server refusal middleware), so the `/design` omission (r1 F13) cannot
     recur silently.
2. **Plugin-contributed checks** ride the existing open `doctor` entrypoint mechanism unchanged.
   The RFC must **not** extend `cli.doctorChecks: readonly 'auth-backend'[]` — that closed literal
   union is the sharpest proof the current axis set is closed (r3 F2, D6: adding a name requires
   editing `@netscript/plugin`), and it is also dropped by `mergeContributions` on one of the two
   host paths (r3 F3). The devtools family routes diagnostics through the module-entrypoint
   mechanism that is already open and already exercised.

Motivation prose the RFC can cite: adding a contribution kind today costs **six framework file
edits** (r4 F11 — kind provider, providers barrel, kind registry, package resolver alias,
ast-extractor, list display); a family whose diagnostics, generation, and cleanup are data-driven
off the manifest is the alternative being purchased.

## The Vite-contribution verdict

**Verdict: avoidable for DevTools v1; a generic Vite-contribution seam is explicitly deferred to
its own RFC, owned by the Vite-8 migration epic.** It is not a prerequisite, and DevTools v1 is
designed so that it never becomes one retroactively.

Why v1 does not need it — each charter concern answered without the seam:

| Concern | How v1 answers it with no Vite seam |
| --- | --- |
| **Ordering** | No plugin code enters the Vite plugin chain, so build-time ordering cannot exist as a problem. Contribution ordering lives in the registry as deterministic `(order, mountId, id)` sort (p1 C6) — the one place the market left unsolved (m2 F21, F3; S-20) and where #890's design is ahead of it. |
| **Trust** | No third-party code executes at Vite-config or transform time. Plugin code runs at exactly two moments: generation (subprocess writing into a host-owned staging dir, inside the transaction, permission-narrowable — §Registry transactions) and runtime (T6's territory). A contribution cannot reconfigure the bundler, break the preact dedupe singleton (r1 F16), or transform app code. |
| **Build determinism** | One first-party Vite plugin (r1 F7), a static plugin chain, literal pinned specifiers in generated files, idempotent byte-identical regeneration. |
| **Local-vs-JSR resolution** | Handled entirely at registry-generation time via `source.kind` specifier emission (§Install), a layer above Vite. |
| **Failure containment** | A broken contribution fails its own staged `deno check` and rolls back — it cannot break the app build, because it never joins the app build until it compiles. |

When the seam *would* be needed: a contribution kind that requires a **transform or virtual
module** — code instrumentation, custom file types, build-graph introspection à la
`vite-plugin-inspect` — i.e. something that cannot be expressed as "additional modules referenced
from generated files". No kind retained by T3 requires that (`inference` from the corpus kind
discussions; T3 confirms). And the market's trajectory says do not invent this shape early on Vite
7: Nuxt built a bespoke devtools shell + RPC + subprocess system and deleted all of it in favor of
Vite 8's `devtools.setup(ctx)` (m1 F1, D1, S-18); a NetScript-only Vite-7 plugin-contribution API
would be obsolete on arrival relative to the ecosystem it must eventually meet.

**Deferral contract (per the charter, no vague deferrals):**

- **Consumed contracts** the future RFC inherits from this one: the contribution-family envelope
  and `(family, major)` handshake from T2 (a `vite` family is a *new family*, not new kinds in the
  devtools family); the `NetScriptVitePluginOptions` surface as the host it composes onto (r1
  Contracts); the transactional replace-set write law if it generates anything; and the normative
  production-polarity rule (`!== 'development'`, two independent mechanisms).
- **Entry criteria:** (1) a concrete contribution kind with a **named first-party consumer** that
  demonstrably cannot be expressed as generated modules — the "why can't this be a generated
  module?" question answered in the issue, mirroring #400's per-panel discipline (research.md F8);
  (2) the **Vite 8 migration has landed**, so the seam can align with the upstream
  `Plugin.devtools.setup(ctx)` contract shape (m1 F2, C1) instead of minting a NetScript-only
  shape below the ecosystem floor (m1 F28); (3) a T6 trust ruling for build-time third-party code
  execution, which is strictly more privileged than any runtime contribution (build/config code
  runs with the dev server's full permissions; TanStack's panel-triggered `install-devtools`
  precedent shows how fast a dev channel becomes privileged, m2 F10/D-row 7).
- **Owning implementation dependency:** the Vite-8 migration epic (to be filed at stage E as a
  named roadmap item; owner fork #17 in `SYNTHESIS-NOTES.md` already tracks the Vite-8 question).
  Ordering: **DevTools v1 ships before Vite 8**; the generic seam RFC follows Vite 8, and nothing
  in v1's generated-module design has to be unwound to adopt it — generated modules and a future
  `devtools.setup` seam are additive, not exclusive.

## Open questions for the owner

1. **Probe P-1 gate (island registration).** Who executes the `@fresh/plugin-vite`
   two-island-root probe, and is stage-E plan lock blocked on its result? T7's primary
   (import-mode) vs fallback (copy-mode) fork flips on it; both are designed above, but the RFC
   should assert one as primary with evidence, not hedge.
2. **Walker leak disposition.** File `.netscript/generated/<axis>.registry.ts` surviving
   `plugin remove` (r4 F10) as a standalone debt/bug issue referenced by the RFC (recommended), or
   pull its fix into DevTools scope?
3. **`plugin dev` deferral.** Confirm the deferral and its watch-home preference
   (configureServer-embedded watch over a CLI daemon) as recorded, or overrule toward a v1 watcher
   — noting the transaction prerequisite either way.
4. **Vite-8 epic ordering.** Ratify: DevTools v1 precedes Vite 8; the generic Vite-contribution
   RFC follows Vite 8 and is owned by that epic. (Pairs with owner forks #17/#15/#16 in
   `SYNTHESIS-NOTES.md`.)
5. **Third production belt.** Should the app `build` task force-regenerate the registry in
   production mode (deterministic empty set) in addition to mechanisms A and B? Cheap; recommended
   yes.
6. **Generator write authority.** Accept the inversion that plugin generators write only into a
   host-owned staging dir (`--out-dir` contract) — with actual permission narrowing deferred to
   T6 — as a v1 requirement for the devtools family?

## Sources

Corpus (all under `.llm/runs/plan-devtools-contribution--seed/research/`, each carrying
`path:line` citations at baseline `main` @ `2256a67bf`):

- `r4-cli-plugin-flows.md` — F2 (doctor inventory + contributed checks), F3/D4/D5 (two
  generators, regex extractor), F6 (no `plugin dev`), F7 (local/JSR branch), F8 (install
  snapshot), F9/D6 (update = forced reinstall via walker), F10/OQ2 (remove leak), F11 (six-edit
  cost).
- `r1-fresh-host.md` — F2 (`defineFreshApp` seams), F4 (route walk, helper-dir invisibility),
  F5/F13 (`router.ts` spread, `(design)` precedent, no dev gating), F6 (no Vite seam), F7 (Vite
  plugin hooks, full-reload watcher, `define`), F8 (page-module rewriting), F11 (hardcoded
  aliases), F16 (preact/signals dedupe).
- `r2-fresh-ui-pipeline.md` — F5 (copy model), F11 (three-layer silent last-wins), D3
  (`resolveTarget` containment gap — context for host-owned staging).
- `r3-plugin-contribution-axes.md` — F2/D6 (`cli.doctorChecks` closed literal), F3 (merge drops
  `cli`), F8 (non-transactional writes, existence-only check), F10 (unenforced spawn permissions).
- `m1-nuxt-vite.md` — F1/D1 (Nuxt deleted its shell), F2/C1 (`devtools.setup`), F9
  (`transformIndexHtml` silent no-op; Fresh bucket), F10/F11/D4 (build-mode ships with auth
  disabled), F28/D2 (Vite 8 floor vs 7.2.2 pin).
- `m2-tanstack-grafana.md` — F6/F7 (two exclusion mechanisms, `!== 'development'` polarity),
  F10/D-row 7 (`install-devtools` privileged-channel precedent), F21/F3 (ordering unsolved
  upstream).
- `p1-rfc-890-frontend-contrib.md` — F1/D-1 (zero implementation), F14 (reusable pattern split),
  C5 (transactional replace-set + emitted file inventory), C6 (ordering/collision table), C7
  (removal empty-set + doctor five-state).
- `research.md` — F8 (#400 acceptance discipline), F16–F19, F20/F21, F24/F25; open questions 1–2.
- `research/SYNTHESIS-NOTES.md` — S-2, S-15…S-18, S-22; owner forks #15–#17.

Key repo paths repeated inline above: `packages/fresh/src/application/vite/vite.ts`,
`packages/fresh/src/application/route/manifest.ts`,
`packages/cli/src/kernel/assets/app/{vite.config,router,main}.ts.template`,
`packages/cli/src/public/features/plugins/{doctor,remove,update,install}/…`,
`packages/cli/src/public/features/generate/plugins/installed-runtime-registry-generator.ts`,
`packages/plugin/src/sdk/discovery/ast-extractor.ts`,
`plugins/workers/src/cli/runtime-registry-generator.ts`, `deno.json:248`,
`packages/fresh/deno.json:56`.
