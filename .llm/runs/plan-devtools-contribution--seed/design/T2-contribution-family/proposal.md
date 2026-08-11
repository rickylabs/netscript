# T2 — The DevTools contribution family: envelope, identity, lifecycle

> **HISTORICAL EVIDENCE — frozen at authoring time.** Where this pack disagrees with
> `docs/architecture/rfc/rfc-0002-devtools-contribution.md`, **the RFC wins**. Notably the package
> boundary was later corrected from `A2 plugin-devtools-core` to **A1 `packages/devtools-core` +
> A6 CLI emission + A5 plugin**, and identity/ordering were unified on `(mountId, id, apiMajor)`
> and anchors-then-`(order, mountId, id)`. See `RFC-AUTHORITY.md` and `drift.md`.


> Stage-D deep-dive pack, run `plan-devtools-contribution--seed`, charter Q2. **Planning only.**
> Baseline `main` @ `2256a67bf`. Every load-bearing claim cites `path:line`, a corpus file, or is
> marked `inference`. TS blocks are **normative sketches**, not shipped code — nothing below exists
> at baseline (`research.md` F1, F2).

## Recommendation

Ship DevTools as a **sibling `{ family: 'devtools', major: 1 }` payload family on a family-neutral
envelope spine that this RFC specifies and the DevTools lane builds first** — option (b′) below.
The envelope, identity quartet, host-descriptor negotiation, transactional replace-set, and
five-state diagnosis taxonomy are adopted from #890's design **as a spec** (they are
payload-agnostic by construction — `p1` F8, F14), but their first implementation is a DevTools
slice, not a wait on epic #922. The spine's home is a new neutral contract package
(working name `@netscript/contribution-core`, A1 small-contract archetype — owner fork, since
#890's fork F3 on the envelope home was never arbitrated, `p1` F9).

Of the three competing seams, **#890's pointer axis wins**; #427's thinness law is *preserved* by
it (the plugin manifest never learns a dashboard/devtools-specific field); **#734 is closed as
superseded** (it proposes exactly the manifest axis #427 forbids and the pointer makes
unnecessary — `b1` F4 #734 row, D2).

The genuinely net-new design in this pack is the **deterministic ordering rule** (host anchors +
clamped `(order, mountId, id)` triple) — no surveyed system solved ordering (`m2` F21, F3;
`m3` M-8; research.md R5) — and the **advisory-install policy**: a broken DevTools contribution is
excluded and diagnosed, never a `plugin install` failure.

## The #890 dependency decision

**Facts to decide against** (established at stage C, not re-derived): #890 merged design text only
— 32 files, zero source; all 24 children + epic #922 OPEN at `status:plan`, milestone `0.0.9`; not
even the disposable Wave-0 proofs have run (`p1` F1, F4, F5). "Reuse #890's envelope" therefore
means co-depending on unbuilt, unproven work (`SYNTHESIS-NOTES.md` S-2).

Three options, priced:

| Option | Shape | Cost |
| --- | --- | --- |
| **(a) Depend on #890's spine landing first** | DevTools waits for #928–#931 (contracts pkg, emitter, host runtime) | Serialized behind 24 unstarted issues four milestones out (`p1` F4, F13). DevTools becomes the first consumer of a spine whose Wave-0 proofs never ran (`p1` F5) — it debugs someone else's design as a side effect. Inherits the unarbitrated `plugin-frontend-core` home, a poor name for a non-frontend family (`p1` OQ2; owner fork #3). |
| **(b) Fully self-contained DevTools family** | Own envelope, own emitter, no shared package | Creates the **fourth** competing seam on one axis (after #427/#890/#734 — `b1` D2). Two envelope implementations and two transactional emitters that must later converge or stay duplicated forever. |
| **(b′) Shared spec, DevTools-built spine** ← recommended | This RFC pins the family-neutral envelope/identity/descriptor/replace-set contracts in a neutral package; the DevTools lane implements them scoped to the `devtools` family; #890's `app` family re-bases onto the neutral package when its waves run | DevTools absorbs the Wave-0-class proving risk (staged-check-swap emitter, envelope validation) that #922 scheduled for itself. Epic #922's spine children (#928–#931) must be re-baselined to *consume* the neutral package — a board mutation only the owner can ratify (fork O-3 below). |

(b′) is licensed by #890's own ratified decision D3: a second family "*extends nothing at the
schema level*; it shares the envelope, discovery pipeline, identity model, and host-surface
negotiation" (`plan-frontend-contrib--seed/design/canonical/01-contracts.md:84-87`) — sibling
payload, not widened union. The widened-union model in `design/examples/dashboard.md` is recorded
drift inside #890's own record and must not be copied (`p1` F11, D-4).

**Reversibility.** The devtools family payload schema, host descriptor, ordering rule, and
diagnosis taxonomy in this pack are byte-identical under (a), (b), and (b′). Only two things move
with the choice: the envelope package's home/name, and which lane builds the emitter first. The
decision is therefore reversible up until the first emitter slice merges; the RFC records it as a
single named fork with a default, not as load-bearing structure.

## Normative contracts

### 1. The neutral envelope (spine — shared with #890's `app` family)

Adopted verbatim in shape from `01-contracts.md:68-107` with one generalization: `contract` is
`FamilyRef` (no `'app'`-literal privileging). Kept intentionally identical so #890 re-bases with a
type-alias, not a migration.

```ts
// @netscript/contribution-core/contracts/v1  (home/name = owner fork O-2)
export interface FamilyRef {
  readonly family: string; // 'app' | 'devtools' | future siblings
  readonly major: number;
}

export interface ContributionEnvelope {
  /** Family + major — the handshake. Hosts register the family schemas they support. */
  readonly contract: FamilyRef;
  readonly pluginKind: string;
  /** Preferred mount base. The devtools family IGNORES it (info diagnostic; see §Lifecycle). */
  readonly base?: string;
  /** Family payload — validated ONLY by the family's registered schema, never by the envelope. */
  readonly contributions: readonly unknown[];
  readonly requires?: ContributionRequires;   // ports/procedures; consumed by T5's data plane
  readonly budgets?: ContributionBudgets;     // §Budgets
}

/** Identity quartet — one string cannot serve provenance, URLs, scoping, and authorization
 *  (01-contracts.md:36-55). Host-assigned mountId is THE key for every generated artifact. */
export interface ContributionIdentity {
  readonly packageName: string;    // '@netscript/plugin-workers' — provenance + version drift
  readonly pluginKind: string;     // 'workers' — installer canonicalName idiom
  readonly installationId: string; // host-assigned at install; = pluginKind unless multi-instance
  readonly mountId: string;        // host-assigned; derives registry keys, routes, CSS scope
}
```

**Anti-god-interface guarantee (AP-3).** The envelope carries no kind knowledge: `contributions`
is `readonly unknown[]` and payload validation lives in the registered family schema
(`01-contracts.md:76-81`). A single `DevToolsContribution` union covering pages + panels +
inspectors + actions + data sources is exactly the AP-3 shape doctrine forbids
(`docs/architecture/doctrine/09-anti-patterns-and-fitness-functions.md:46-52`); kinds are separate
interfaces owned by the family package and enumerated by T3 against real first-party consumers.

**Anti-switch guarantee (AP-24).** Hosts consume contributions through a typed kind registry
populated at composition (`DevtoolsKindRegistry.register(kind, renderer)`), never
`switch (contribution.kind)` in the renderer
(`09-anti-patterns-and-fitness-functions.md:165-183`). Because the neutral package then owns ≥2
extension axes (family-schema registration + kind registration), it exports a single
`extension-points.ts` per `R-COMP-EXT-MANIFEST`
(`docs/architecture/doctrine/07-composition-and-extension.md:254-266`).

### 2. The devtools family binding

```ts
// @netscript/plugin-devtools-core/contracts/v1  (A2 core package; kinds are T3's deliverable)
export const DEVTOOLS_FAMILY = { family: 'devtools', major: 1 } as const;

/** Base fields every devtools kind extends. Kinds themselves: T3. */
export interface DevtoolsContributionBase {
  /** Unique within (plugin, family). Pattern ^[a-z][a-z0-9-]*$ . Fully-qualified form is
   *  `<mountId>/<id>` — collision-free because mountId is unique by construction (§Collision). */
  readonly id: string;
  readonly title: string;                 // plain string; devtools pins English (p1 F10 i18n row)
  readonly icon?: string;                 // fresh-ui IconName
  /** Ordering hint, clamped to [-100, 100]; full rule in §Ordering. */
  readonly order?: number;
}

/** Targeting law (normative prose): every kind that occupies a host surface names a target id
 *  drawn from the HOST's descriptor vocabulary (zone id, nav group). Plugins cannot mint targets
 *  — the vocabulary is closed and host-owned (Medusa model, m3 M-2/X-1). */
```

### 3. Host capabilities — the descriptor

```ts
export interface DevtoolsHostDescriptor {
  readonly host: 'devtools';
  /** Supported (family, major) windows. v1: [DEVTOOLS_FAMILY]. */
  readonly families: readonly FamilyRef[];
  readonly zones: readonly DevtoolsZoneDescriptor[];
  readonly navGroups: readonly string[];
  /** '/_fresh', the devtools base itself, gateway prefix — collision inputs for T1's mount. */
  readonly reservedPaths: readonly string[];
  /** Volume cap per plugin across the whole host (Grafana limitPerPlugin adopt, m2 F15). */
  readonly limitPerPlugin?: number;       // default 16
}

export interface DevtoolsZoneDescriptor {
  /** Version-suffixed, host-owned id: 'devtools.capability.panel/v1'. The suffix versions the
   *  ZONE's props/context contract independently of the family major (m2 F13/F16 adopt). */
  readonly id: string;
  readonly capacity?: number;
  /** Host-curated order pins: fully-qualified '<pluginKind>/<contributionId>' entries.
   *  The ordering rule's tier 1 (§Ordering). Adding/reordering anchors is a data change. */
  readonly anchors?: readonly string[];
}
```

Adding a zone is a data change, not a contract change (`01-contracts.md:243-246`) — that, not
schema openness, is what makes surface growth additive.

### 4. The negotiation rule (one paragraph, normative)

A host accepts an envelope **iff `envelope.contract` matches a declared `(family, major)` window
in its descriptor**. Evolution: a new optional field on an existing kind is a **minor** (family
payload schemas are `.passthrough()` at the boundary — validators must ignore unknown fields); a
new kind or a new discriminant value is a **new major** of the family; an envelope outside the
window is **window-mismatch quarantined**, never a crash and never silently dropped
(`01-contracts.md:88-92`). The devtools host serves at most **two consecutive majors** through a
one-major deprecation window — deliberately narrower than Grafana's open-ended concurrent serving
(`m2` F16 adapt row). Old-host/new-plugin and new-host/old-plugin each get a contract test.

### 5. The pointer — how the manifest learns about the family

Reuse #890's pointer mechanics exactly (`01-contracts.md:336-344`): `@netscript/plugin` learns one
parse-only block `{ export, framework: 'fresh' }`; the plugin's pointed-to module default-exports
`ContributionEnvelope | ContributionEnvelope[]` (multi-family array pinned by #890 K-16,
`01-contracts.md:109-114`); the family/major handshake lives once, in the envelope, derived at
generate time. A DevTools envelope is simply **another array member behind the same export** —
zero new manifest fields, which is how #427's thinness law survives (`b1` Contracts table, #427
row) and why #734's in-manifest axis is unnecessary.

**Verified defect the RFC must carry:** #890 C8 claims "older CLIs ignore the block", but the
shipped installer schema is zod `.strict()` — any unknown top-level field is a **hard reject**
(`packages/plugin/src/protocol/manifest.ts:283`; `r3` F5). At baseline an older CLI does *not*
ignore a new pointer block; it fails the whole manifest parse. Before any pointer lands, either
`PLUGIN_MANIFEST_SCHEMA_VERSION` bumps with a structured old-CLI error, or the schema relaxes to
tolerate declared optional extension blocks. This is a named precondition slice, not a footnote.

### 6. Budgets

```ts
export interface ContributionBudgets {           // envelope-level, family-interpreted
  readonly initialJsKb?: number;
  readonly islands?: number;
  readonly panelRenderMs?: number;
}
```

Three dials, three enforcement points: (1) envelope `budgets` asserted by the family test kit and
surfaced by doctor (#890 K-9, `01-contracts.md:96-107`); (2) per-zone `capacity` in the descriptor
with deterministic overflow (§Quarantine state 3); (3) host-level `limitPerPlugin` (default 16) —
the ~8-line Grafana volume cap (`m2` F15). Numbers are owner-tunable defaults, not contract.

## Lifecycle

### Discovery and generation (which generator, and why)

The devtools family uses the **manifest-driven, host-emitted** pipeline — the generator imports
the plugin's pointed-to export in-process and the **host** writes all artifacts. It must not use:

- the **SDK walker** (`plugin update`/`item-add` path): its `AstExtractor` is a regex over
  stripped text recognizing three hardcoded builders, and its emitted registries **leak on
  `plugin remove`** (`r4` F3, D4, F10; `SYNTHESIS-NOTES.md` S-16);
- the **plugin-owned generator subprocess** model: it is spawned with flat
  `--allow-read --allow-write` over the whole project root, ignoring declared permissions
  (`r3` F10), and writes non-transactionally per target (`r3` F8).

Host emission closes both holes at once and adds the containment invariant the shipped code lacks:
**every emitted path is host-derived from `mountId` under `.netscript/generated/devtools/`; a
plugin never names a filesystem target.** A test asserts path containment — the `resolveTarget`
class of arbitrary-write defect (`r2` D3; `SYNTHESIS-NOTES.md` security section) is thereby
impossible for this family by construction, not by convention.

Discovery source is the same resolved plugin set as `generate plugins` (config-declared specs,
`r3` F7a); the `appsettings.json` JSR-scan path is never an authority for this family because the
two discovery sets can disagree (`r3` F7b).

### The transactional replace-set

Adopted from `03-discovery-and-registry.md:6-53` — this is a **fix for a shipped defect class**
(non-transactional writes, existence-only assertions — `r3` F8), not gold-plating:

```
pointer block (parse-only)
  → import './contributions' export        (validated envelope data)
  → STAGE .netscript/generated/devtools/*  (full replace-set, out-of-place)
  → deno check staged set incl. devtools.check.ts   (static-imports EVERY referenced module)
  → atomic swap, or rollback               (never a half-updated host)
```

Emitted deterministically, **even when empty** (so removal can never dangle an import):

| File | Contents |
| --- | --- |
| `devtools.registry.ts` | identities, contributions in final order, literal lazy loaders, **quarantine entries as data** |
| `devtools.islands.ts` | island specifiers for the vite feed |
| `devtools.routes.ts` | typed route refs for contributed pages |
| `devtools.check.ts` | static-import module — the type gate's teeth |
| `devtools.diagnosis.json` | machine-readable five-state record consumed by the doctor check (§Quarantine) |

Generation is idempotent (byte-identical skip) and the emitter **sorts explicitly** — output never
depends on filesystem enumeration or map-insertion order. Gate: shuffle envelope input order ⇒
byte-identical registry.

### Install / update / remove

- **`plugin install`** — regenerate replace-set → staged check → swap. **Advisory-install policy
  (devtools-specific, diverges from #890):** a devtools-family validation failure — bad zone,
  window mismatch, broken module — **never fails the install**. The offending contribution (or
  envelope) is excluded and recorded in `devtools.diagnosis.json`; the swap still happens with the
  valid remainder. Rationale: the family is auxiliary diagnostics; failing a plugin install over
  an optional panel is disproportionate, and the market's host-degrades-never-crashes posture
  (`m2` F18) applies doubly to a tool whose job is diagnosing failures. (#890's `app` family
  fails install — correct there, because a broken user-facing page is a real breakage. Whether
  this becomes a per-family `onInvalid` policy knob on the neutral spine is stage-E's call.)
  An emitter/transaction failure still rolls back wholesale — transactionality is not advisory.
- **`plugin update`** — same regeneration; contract drift surfaces as window-mismatch quarantine
  with the remediation CLI printed.
- **`plugin remove`** — regeneration emits the deterministic empty set for departed plugins.
  **Family law: the devtools family scaffolds no starter files.** Every artifact is either
  generated (removed by regeneration) or lives in the plugin package (removed with it). Removal
  is total, with zero orphans by construction — a deliberate simplification over #890 C7's
  app-owned-starter provenance machinery, and the direct fix for the walker-leak defect
  (`r4` F10).
- **Duplicate identity**: registry keys derive from host-assigned `mountId`, assigned uniquely at
  install; a duplicate is a generate-time error. The family must never key on
  `resolvePluginLocalName`, whose lossy last-segment collapse silently merges `@a/plugin-ai` and
  `@b/plugin-ai` (`r3` F9; `packages/cli/src/kernel/adapters/config/plugin-registry.ts:150-159`).

## Ordering, collision, quarantine

### Ordering — the net-new rule

Nobody solved this: Grafana concats in plugin load order with no priority API
(`m2` F21), TanStack's identity is positional-index-based (`m2` F3), Medusa documents nothing and
*deprecated* ordering-in-the-id (`.before`/`.after` suffixes walked back in v2.17.2 — `m3` M-3,
M-8). #890's `(order, mountId, id)` triple (`03-discovery-and-registry.md:58`) is already ahead of
the market but leaves the host's own product surface hostage to plugin-chosen integers. The
devtools rule is **host-anchored, two-tier, fully deterministic**:

1. **Tier 1 — host anchors.** Each zone descriptor may pin fully-qualified contribution ids in a
   host-curated sequence (`anchors`). Anchored contributions render first, in anchor order. This
   makes the shell's tab strip a **host product decision expressed as descriptor data** — pinning
   a new first-party panel's canonical position is a data change, consistent with the
   zone-growth-is-data principle (`01-contracts.md:243-246`).
2. **Tier 2 — the clamped triple.** Unanchored contributions follow, sorted by
   `(order ?? 0, mountId, id)`: `order` clamped to `[-100, 100]` (values outside are a
   generate-time validation error, killing priority-inflation wars before they start), ties broken
   by `mountId` then `id` in **code-unit lexicographic order** (never locale-sensitive collation).
3. **Determinism law.** Sort keys derive only from envelope data and the host descriptor — never
   from discovery order, filesystem enumeration, or map insertion. Regeneration from a shuffled
   input is byte-identical (gated, §Lifecycle).
4. **Host policy overlay.** The registry order is the *initial* order; a devtools shell may
   persist per-user reordering client-side, but a fresh profile must always reproduce the registry
   order exactly.

Why this shape: (a) determinism is a hard requirement of the idempotent transactional emitter;
(b) the tab strip is host IA — #400's ratified ownership thesis makes the shell a curated product,
not a bulletin board (`b1` F3); (c) both implicit ordering (Grafana) and ordering-encoded-in-ids
(Medusa, deprecated) are demonstrated dead ends, and anchors + a bounded hint is the smallest
mechanism that avoids both.

### Collision — mostly a non-problem, by construction

Under a **host-owned closed zone vocabulary** (Medusa's actual model — plugins cannot mint zones;
the plugin-minted model is Strapi's and requires the two-phase register/bootstrap lifecycle plus
caller-side guards this family deliberately avoids — `m3` M-2, S-1/S-3, X-1; research.md F22, R5),
zone-name collision is impossible. What remains, each with a specified outcome:

| Collision | Outcome |
| --- | --- |
| Duplicate contribution `id` within (plugin, family) | generate-time error naming both (`03:70`) |
| Duplicate fully-qualified id across plugins | impossible — namespaced by unique `mountId` |
| Duplicate `mountId` | generate-time error (never the silent local-name collapse, `r3` F9) |
| Route collisions between plugins | impossible — the devtools host **forces namespacing** under `<devtoolsBase>/p/<mountId>/…`; `base` is ignored with an info diagnostic. Deliberate inversion of #890's unarbitrated plugin-preferred-base F2, which is userland-UX-motivated (`p1` F9, F14 item 3). Exact base string is T1's mount decision. |
| Zone capacity exceeded | deterministic overflow: winners = first `capacity` in final order; losers named in the report (`03:69`) |

### Quarantine — the five-state taxonomy, on the existing doctor mechanism

The taxonomy is adopted verbatim as **product surface, not internal vocabulary** (#890 K-17,
`03-discovery-and-registry.md:89-95`):

| # | State | Class | Meaning |
| - | --- | --- | --- |
| 1 | `unknown-zone` | excluded + error diagnosis | target id not in the host descriptor (typo) |
| 2 | `known-but-unmounted` | info only — **not** quarantine | zone valid for the family, absent from this host; skipped |
| 3 | `capacity-rejected` | excluded + deterministic overflow report | volume/capacity loser, named |
| 4 | `window-mismatch` | **quarantine** | `(family, major)` outside the host window |
| 5 | `load-failure` | **quarantine** | staged check / import failed |

Quarantine entries are emitted into `devtools.registry.ts` as data, so the shell renders each as a
card deep-linking `netscript plugin doctor` — plus a per-contribution error boundary at render
time whose polarity inverts Grafana's (`m2` F23: log + `null` in prod): here the developer *is*
the audience, so a render-throw flips the contribution to a loud diagnostic card, never taking the
shell down (TanStack's absent boundary is its documented gap, `m2` F11).

**Doctor reuse — genuine, verified.** `plugin doctor` already dynamically imports a plugin's
`doctor` entrypoint and runs `adapter.doctor.extraChecks[].run(ctx)` under a read-only
`dryRun: true` context whose `writeText` rejects with "Doctor checks are read-only."
(`packages/cli/src/public/features/plugins/doctor/doctor-plugin-use-case.ts:281-328`, context at
`:299-309`; `r4` F2 item 8). The DevTools host plugin ships exactly one contributed check: it
reads `devtools.diagnosis.json` + the generated registry, replays the five states as doctor rows,
and flags staleness (registry entries with no installed plugin). Zero framework edits required.
One honest limitation: the contributed-check result is `{ name, ok, message }` mapped to
healthy/error only (`:314-318`) — no warning tier. Mapping: states 1, 3, 4, 5 → `ok: false`;
state 2 → `ok: true` with an info message. Widening `ok` to a tri-state is a candidate one-line
framework improvement, explicitly **not** required by this design.

## Rejected, with reasons

| Rejected | Reason |
| --- | --- |
| **Extending `PluginContributions` with a `devtools` axis** (the #734 shape) | The shipped axis model is provably closed and rotting: `cli.doctorChecks` is `readonly 'auth-backend'[]`, 10 enum names vs 12 interface keys, `mergeContributions` silently drops `cli`, lifecycle hooks invoked by nothing, unknown keys silently dropped (`r3` F2, F3, F4, F9). Adding a 13th key to that record inherits every defect and costs six framework file edits per kind (`r4` F11). The pointer axis costs one parse-only block, once. |
| **Widened union with the `app` family** (`DevtoolsContribution = FrontendContribution \| …`) | Disproved inside #890's own record: a union member added to a strict schema breaks old validators and exhaustive consumers (`01-contracts.md:62-67`); the examples file that suggests it is recorded drift (`p1` F11, D-4). |
| **Plugin-minted zones** (Strapi model) | Requires the two-phase register/bootstrap lifecycle and caller-side `if (plugin)` guards (`m3` S-1, S-3), and reopens name collision the closed vocabulary eliminates. First-party contributors in one workspace do not need an open namespace. |
| **Per-contribution version-suffixed ids as the compatibility mechanism** | Redundant here: the envelope's `(family, major)` handshake already carries the payload version, with quarantine semantics Grafana lacks. The suffix idea is kept where it uniquely earns its place — on **zone ids**, versioning each host slot's props/context contract independently of the family major (`m2` F13, F16). |
| **Ordering encoded in the target id** (`.before`/`.after`) | Tried and deprecated by Medusa v2.17.2 (`m3` M-3). |
| **Sandboxing, per-contribution RBAC, manifest host semver ranges, runtime module federation** | Costs of *untrusted third-party code in a long-lived RBAC-governed production surface* — antecedents a first-party, dev-process-lifetime diagnostics family does not satisfy (`m3` separation verdict, D-5/D-6, S-6, B-4/B-6; research.md F23). Declined on cited antecedent-failure grounds; owner ratifies the declines (stage-C fork #23). Trust posture beyond this is T6's topic. |
| **The plugin-owned generator subprocess model for this family** | Flat `--allow-read --allow-write` spawn ignoring declared permissions (`r3` F10) + non-transactional per-target writes (`r3` F8). Host emission with path containment supersedes it. |
| **The SDK walker as this family's generator** | Regex-not-AST extraction, three hardcoded builders, leaks on remove (`r4` F3, D4, F10). |
| **Waiting for #890's spine (option (a)) as a hard dependency** | Serializes DevTools behind 24 unstarted `status:plan` issues at `0.0.9` and makes it the first consumer of an unproven emitter (`p1` F4, F5). |

## Open questions for the owner

1. **O-1 — Seam arbitration.** Ratify: pointer axis wins; #427 folds into this family's kind/host
   slices (as #890 already re-baselined it — `b1` F10); **#734 closes as superseded**. Without
   this, a fourth seam appears (`b1` D2, open question 7).
2. **O-2 — Envelope home and name.** `@netscript/contribution-core` (proposed) vs
   `@netscript/plugin-frontend-core` (#890's unarbitrated fork F3). Also the pointer block's
   manifest name: reuse #890's `frontend` block verbatim (default — zero re-litigation; a devtools
   panel *is* UI) vs a family-neutral rename while nothing is built.
3. **O-3 — Spine ownership transfer.** Under (b′), #922's spine children (#928–#931) re-baseline
   to consume the DevTools-built neutral package. This inverts the epic's build order and needs
   owner ratification as a board mutation.
4. **O-4 — Advisory-install policy.** Confirm exclude-and-diagnose for devtools-family failures
   (vs #890's fail-install for the app family), and whether it becomes a per-family `onInvalid`
   knob on the neutral spine.
5. **O-5 — Manifest strictness precondition.** Approve the schema-evolution slice (schemaVersion
   bump or tolerated extension blocks) that the `.strict()` installer schema forces before any
   pointer block can land (`r3` F5 vs `p1` C8).
6. **O-6 — Anchor governance.** Host anchors give the descriptor owner (the devtools host
   package) final say over first positions. Confirm that is the intended power balance vs a
   pure-triple ordering with no host curation.

## Sources

- `.llm/runs/plan-devtools-contribution--seed/research.md` (F1, F2, F10, F17–F19, F22–F24; R5)
- `.llm/runs/plan-devtools-contribution--seed/research/SYNTHESIS-NOTES.md` (S-2, S-16, S-17, S-20,
  S-21, S-22; security section)
- `.llm/runs/plan-devtools-contribution--seed/research/p1-rfc-890-frontend-contrib.md` (F1, F4,
  F5, F8, F9, F11, F14; C1–C9; D-4)
- `.llm/runs/plan-devtools-contribution--seed/research/r3-plugin-contribution-axes.md` (F2, F3,
  F4, F5, F7, F8, F9, F10)
- `.llm/runs/plan-devtools-contribution--seed/research/r4-cli-plugin-flows.md` (F2, F3, F10, F11,
  D4)
- `.llm/runs/plan-devtools-contribution--seed/research/m2-tanstack-grafana.md` (F3, F11, F13, F15,
  F16, F18, F21, F23)
- `.llm/runs/plan-devtools-contribution--seed/research/m3-admin-consoles.md` (M-2, M-3, M-8,
  S-1–S-4, X-1, separation verdict)
- `.llm/runs/plan-devtools-contribution--seed/research/b1-dashboard-board.md` (F3, F4, F10, D2,
  Contracts table)
- `.llm/runs/plan-frontend-contrib--seed/design/canonical/01-contracts.md:36-55, 62-114, 230-246,
  336-344`
- `.llm/runs/plan-frontend-contrib--seed/design/canonical/03-discovery-and-registry.md:6-53,
  58-73, 76-97`
- `packages/cli/src/public/features/plugins/doctor/doctor-plugin-use-case.ts:281-328` (read at
  baseline; `dryRun: true` context at `:299-309`, binary `ok` mapping at `:314-318`)
- `packages/plugin/src/protocol/manifest.ts:283` (`.strict()`, via `r3` F5)
- `docs/architecture/doctrine/09-anti-patterns-and-fitness-functions.md:46-52` (AP-3),
  `:165-183` (AP-24)
- `docs/architecture/doctrine/07-composition-and-extension.md:254-266` (R-COMP-EXT-MANIFEST)
