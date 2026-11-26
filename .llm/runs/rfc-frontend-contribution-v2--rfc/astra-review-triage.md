# GPT-6.2 Astra Pass-1 Review Triage — `rfc-frontend-contribution-v2--rfc`

- **Reviewer:** `openrouter/openai/gpt-6.2-astra#xhigh` via OpenCode CLI `v2.3.2`
- **Pull Request:** [#2684](https://github.com/rickylabs/netscript/pull/2684) (`docs/rfc-frontend-contribution-v2`)
- **Reviewed SHA:** `d05d2346a368a17c3cae44aac3d0098344289681`
- **Review Record:** [`plan-eval.md`](./plan-eval.md) (`CHANGES_REQUESTED`, `2026-11-26`)
- **Disposition Vocabulary:** `ACCEPTED` (Accepted / Amended in RFC & probes) | `DECLINED_WITH_RATIONALE` | `DEFERRED_TO_FORK` (Deferred with rationale to owner fork decision in [`rfcs/0000-frontend-contribution.md#unresolved-questions`](../../../rfcs/0000-frontend-contribution.md#unresolved-questions), lines 836–847)

---

## Summary Table

| ID | Category | Disposition | Summary of Fix / Rationale |
| --- | --- | --- | --- |
| `B1` | Blocker | `ACCEPTED` *(Accepted)* | Restored verbatim RFC 0005 wire schema (`FamilyRef`, `ContributionEnvelope`, host-assigned `ContributionIdentity`) + guide/probe `{ export: './frontend', framework: 'fresh' }` pointer + mixed-family `[app, devtools]` + 2-installation uniqueness |
| `B2` | Blocker | `ACCEPTED` *(Accepted)* | Restored RFC 0005 zone-target matching, `anchors[]` priority before `(order ?? 0, mountId, id)`, out-of-range error, 4 distinct zone diagnosis outcomes, host-owned `devtools` exclude vs `app` fail policy |
| `B3` | Blocker | `ACCEPTED` *(Accepted)* | Removed browser-visible SHA-256 `fingerprint`/`digest`; presence-only `RedactedSecretHandle` (`sentinel` + `isSet`); recursive object/array/record/`z.toJSONSchema` redaction + allowlisted outbound check tested via real Fresh 2.3.3 SSR/island + partial serialization including non-sensitive field `notes` |
| `B4` | Blocker | `ACCEPTED` *(Accepted)* | Specified `(procedure, owning service, (principal, resource))` authorization + typed param binding; added Probe C `2.2b` against real `workersContract` (`getJob`/`triggerJob`) via `@netscript/service/auth` (`job-alpha` allowed, `job-beta` `403` with `0` upstream hits); separated SDK metadata defect attribution |
| `B5` | Blocker | `ACCEPTED` *(Accepted)* | Separated unary HTTP, `eventIterator`, and `RFC 0009` Durable Streams; adopted HTTP-only W2 (`F-4` Option B); relabeled Probe C `2.4` as non-`RFC 0009` prototype and `2.5` as W2 HTTP-only exclusion; kept `#927` open |
| `B6` | Blocker | `ACCEPTED` *(Accepted)* | Anchored `deriveGeneratedArtifactPath` & `.staging` to `trustedRealRoot(projectRoot)` / `packageRoot`; failed closed on unresolved symlinks; tested symlink escape *above* `.netscript/generated/` in Probe C `1.3`; retained RFC 0005 write/argv/permission gates |
| `B7` | Blocker | `ACCEPTED` *(Accepted)* | Split `PortableRouteDataContext -> PortableHandlerResult<TData>` loader (`portable-jobs-loader.ts`) from Fresh 2 adapter (`fresh-jobs-adapter.tsx`); Probe A `P2d` runs & type-checks the shared loader across GPUIX-shaped `RouteModule` (0 Fresh adapter loads) and Fresh 2; demoted Fresh 3 to migration target |
| `B8` | Blocker | `ACCEPTED` *(Accepted)* | Marked Probe B as partial (localhost HTTP mocks + 1 app root, not JSR matrix or `#1470` 2-route-root); added independent `W3a` `#940` fixture + failing-budget control while moving Workers `#940` CI receipt to `W3b`; stated zero issue closures on RFC acceptance |
| `M1` | Material | `ACCEPTED` *(Accepted)* | Kept shared transactional generator core with separate `app` & `devtools` projections (`INV-4` prod absence), staged type-check, rollback, deterministic empty/byte-identical output, `#2582` multi-app targets, and runtime quarantine strictly outside generated files |
| `M2` | Material | `ACCEPTED` *(Accepted)* | Bounded Fresh 2 isolation claims precisely to tested data-phase `Promise.allSettled` + deadline vs `500`/empty sync/nested-async SSR throws; required allowlisted `GuardedPluginApp` facade, scoped `onError`, and W2 post-hydration client `ErrorBoundary` gate |
| `M3` | Material | `ACCEPTED` *(Accepted)* | Added JSON wire projection (`AppZoneContextMap`, `app` kind registry), per-kind host renderer contracts, and server-side enforcement of `fixedByPlugin`, `secret`, `editable: false`, `overridable: false`, and entity authorization |
| `M4` | Material | `ACCEPTED` *(Accepted)* | Aligned verbatim with merged `#2670` `resolveSecretFieldSubmission` (`replace \| keep \| clear \| unset \| invalid`) rejecting raw `null`/string shortcuts in RFC + Probe C `3.2`; split `FrontendPluginCatalog` health/quarantine/version/update/doctor dimensions |
| `M5` | Material | `ACCEPTED` *(Accepted)* | Required package-owned route CSS exports, `basePath`-safe URLs, portal/plugin scoping, partial nav/breadcrumb sync, and `eis-etl#422` `theme-signal.ts` cross-tab/system parity; recorded Probe B fixture's host `static/` caveat + real transition CDP gates |
| `M6` | Material | `ACCEPTED` *(Accepted)* | Preserved `#427` (DevTools `panel`) & `#432` (shared scaffolder dashboard caller), preserved `05-scaffolding-and-cli.md` starter drift / typed route-ref / `install -> render -> hydrate -> remove` gates, and documented `#936`/`#939` exclusion from `rfcs/0002` A7 |
| `N1` | Minor | `ACCEPTED` *(Accepted)* | Fixed Probe B counts to **19 rows (11 PASS, 5 CAVEAT, 3 FAIL)** across RFC/worklog/context-pack, noted `C3` fixed diagnostic after non-zero exit, dynamically detected `preact-render-to-string@6.8.3` vs `deno.lock` `6.8.0` in Probe A `P4e`, and surfaced `probe-a-fresh-mount.ts` `--check exit=1` cleanly in `probe-a.log` |
| `N2` | Minor | `ACCEPTED` *(Accepted)* | Corrected CLI syntax to `netscript plugin install workers --app web`, explained npm-only `catalog:` vs JSR caret specifiers in `scaffold-app-catalog.ts`, and documented Probe B fixture-only `hostFreshSignalsPin` |
| `N3` | Minor | `ACCEPTED` *(Accepted)* | Narrowed SDK defect attribution to `stable-v1-adapter.ts` stripping `access.authorization`/`audience` on client metadata (server still fails closed via `compileProcedures`), moved rate/byte/timeout policy to host gateway config, and corrected `413` req / `502` res overflow codes |
| `F-1` | Owner Fork | `DEFERRED_TO_FORK` *(Amended default)* | Replaced both fork choices with Astra's options: **(A)** preserve `packages/devtools-core` canonical RFC 0005 spine ownership + `@netscript/plugin-frontend-core` re-exports (recommended default), or **(B)** explicit RFC 0005 F-1 amendment + compatibility gate |
| `F-2` | Owner Fork | `DEFERRED_TO_FORK` *(Amended default)* | Updated fork to **(A)** single parse-only `{ export, framework: 'fresh' }` pointer with sibling `ContributionEnvelope[]` (recommended default) vs **(B)** dual keys with mixed-manifest conflict rules |
| `F-3` | Owner Fork | `DEFERRED_TO_FORK` *(Amended default)* | Updated Option (A) to require strict **field-level** host overlay precedence where `x-ns-ui` wins on conflict and overlays **never weaken `secret`, `fixedByPlugin`, `editable: false`, or `overridable: false`** |
| `F-4` | Owner Fork | `ACCEPTED` *(W2 cut updated; fork retained for confirmation)* | Adopted **Option B (HTTP-only in W2)** across RFC §6.3, §10, and Probe C `2.5`; deferred `eventIterator` to follow-on pending first-frame + abort/reconnect proof under real authorization |
| `F-5` | Owner Fork | `DEFERRED_TO_FORK` *(Amended default)* | Retained exact 6 open issues (`#2491`, `#2531`, `#2556`, `#2561`, `#2565`, `#2568`), noted `#2568` unlabeled and `#2531` `area:fresh-ui` without `epic:design-system`, and set **(A)** owner-led theme reassignment |

---

## Detailed Finding-by-Finding Triage

### Blockers (`B1`–`B8`)

#### `B1` — Canonical RFC 0005 Wire Schema, Single Pointer Key, & Host-Assigned Identity
- **Disposition:** `ACCEPTED` *(Accepted)*
- **RFC Changes:** [`rfcs/0000-frontend-contribution.md`](../../../rfcs/0000-frontend-contribution.md) lines 151–189 (Guide manifest + sibling `ContributionEnvelope[]`) and lines 204–347 (§1–§2 canonical `FamilyRef = { family, major }`, `ContributionEnvelope = { contract, pluginKind, base?, contributions, requires?, budgets? }`, host-assigned `ContributionIdentity = { packageName, pluginKind, installationId, mountId }`, unique `(installationId, mountId, id)` keys).
- **Probe Changes:**
  - [`probes/probe-c-manifest-gateway-redaction.ts`](probes/probe-c-manifest-gateway-redaction.ts#L502-L570) (`1.2`): tightened `FrontendPointerSchema` to accept `{ export, framework: 'fresh' }` ONLY and reject extra guide keys (`routes`, `zones`, `gateway`, `redaction`).
  - [`probes/probe-c-manifest-gateway-redaction.ts`](probes/probe-c-manifest-gateway-redaction.ts#L879-L937) (`1.4`): tests exact RFC 0005 `FamilyRef`/`ContributionEnvelope`/`ContributionIdentity`, mixed-family `[app, devtools]` export, and **2 installations of 1 package** (`@netscript/plugin-workers`) receiving distinct `installationId`/`mountId` (`workers-east`, `workers-west`) without collision.
- **Verification:** [`probes/probe-c.log`](./probes/probe-c.log) lines 4 & 6 (`PASS 1.2`, `PASS 1.4`).

#### `B2` — RFC 0005 Ordering, Diagnosis States, & Host-Owned Failure Policy
- **Disposition:** `ACCEPTED` *(Accepted)*
- **RFC Changes:** [`rfcs/0000-frontend-contribution.md`](../../../rfcs/0000-frontend-contribution.md) lines 319–360 (§2): zone is the matching target; host-curated `anchors[]` match exact `<mountId>/<id>/v<apiMajor>` pins first; remaining eligible entries sort by `(order ?? 0, mountId, id)` integer `[-100, 100]` with `ORDER_OUT_OF_RANGE` generation error; distinct zone diagnosis outcomes (`unknown-zone`, `zone-contract-mismatch`, `known-but-unmounted`, `capacity-rejected`, `window-mismatch`, `load-failure`); host-owned policy defaults DevTools failure to isolate/exclude and `app` failure to fail generation/install (no contributor override knob).
- **Probe Changes:** [`probes/probe-c-manifest-gateway-redaction.ts`](probes/probe-c-manifest-gateway-redaction.ts#L939-L1090) (`1.5`): covers pinned capacity winners, out-of-range order rejection, unserved zone version, absent known zone, unsupported family major, and mixed valid `app` + invalid `devtools` items under host-owned policy.
- **Verification:** [`probes/probe-c.log`](./probes/probe-c.log) line 7 (`PASS 1.5`).

#### `B3` — Presence-Only Secret Redaction & Real Fresh Island SSR/Partial Gate
- **Disposition:** `ACCEPTED` *(Accepted)*
- **RFC Changes:** [`rfcs/0000-frontend-contribution.md`](../../../rfcs/0000-frontend-contribution.md) lines 554–586 (§6.1) & lines 709–720 (§9.3): removed browser-visible `digest`/`fingerprint` completely from `RedactedSecretHandle` (`{ __nsRedacted: true, sentinel: '__NS_REDACTED_SECRET__', isSet: boolean }` ONLY, matching [`rickylabs/eis-etl`](https://github.com/rickylabs/eis-etl/blob/04261e186d6331cb8bce618ecb977c37d167270c/contracts/versions/v1/pipeline-config-redaction.ts#L44-L55)); required recursive schema-preserving traversal over objects, arrays, records, wrappers, and JSON Schema (`x-ns-ui` / overlay) plus allowlisted outbound validation at service/gateway/SSR/partial/hydration boundaries.
- **Probe Changes:** [`probes/probe-c-manifest-gateway-redaction.ts`](probes/probe-c-manifest-gateway-redaction.ts#L3012-L3332) & `3.1`–`3.2` ([`#L3486-L3890`](probes/probe-c-manifest-gateway-redaction.ts#L3486-L3890)): dropped `digest` from `RedactedSecretHandle`; preserved secret annotations recursively through nested objects, `z.array(...)`, `z.record(...)`, and `z.toJSONSchema()`; stopped short-circuiting handle-shaped objects without exact 3-key handle validation; exercised real Fresh `2.3.3` `App` + `ProdBuildCache` island SSR & `?fresh-partial=true` serialization including a secret on non-sensitive key `notes`; asserted zero raw secret AND zero SHA-256 hex digest in HTML/partial payloads.
- **Verification:** [`probes/probe-c.log`](./probes/probe-c.log) lines 14–15 (`PASS 3.1`, `PASS 3.2`).

#### `B4` — Host-Approved `(Procedure, Owning Service, (Principal, Resource))` Authorization + Real `workersContract`
- **Disposition:** `ACCEPTED` *(Accepted)*
- **RFC Changes:** [`rfcs/0000-frontend-contribution.md`](../../../rfcs/0000-frontend-contribution.md) lines 587–606 (§6.2): defined P5 authorization over `host-approved procedure × owning service × (principal, resource) policy` + typed path/query binding + resource-scoped service credential lookup (never forwarding wildcard route patterns, unfiltered incoming query strings, or un-scoped service credentials).
- **Probe Changes:** [`probes/probe-c-manifest-gateway-redaction.ts`](probes/probe-c-manifest-gateway-redaction.ts#L1760-L2284) (`2.1`, `2.2`, `2.2b`): clearly labeled `SYNTHETIC_CRONS_CONTRACT` as synthetic; added `2.2b` ([`#L2102`](probes/probe-c-manifest-gateway-redaction.ts#L2102)) testing **real `workersContract`** (`getJob`, `triggerJob` with `meta.access === undefined`) through `@netscript/service/auth` (`createContractAuthorizer` + `createScopeAuthorizer`) + host `(principal, resource)` ownership grant + typed param/query binding (`job-alpha` -> `200`, `job-beta` -> `403` with `0` upstream hits, ungranted `deleteJob` -> `404`, `../admin` -> `400`).
- **Verification:** [`probes/probe-c.log`](./probes/probe-c.log) lines 8–10 (`PASS 2.1`, `PASS 2.2`, `PASS 2.2b`).

#### `B5` — Separate Unary HTTP, `eventIterator`, & `RFC 0009` Durable Streams Acceptance
- **Disposition:** `ACCEPTED` *(Accepted)*
- **RFC Changes:** [`rfcs/0000-frontend-contribution.md`](../../../rfcs/0000-frontend-contribution.md) lines 607–618 (§6.3), 719, 731, 752, and 845: cut `0.0.10` W2 gateway to **HTTP-only** (`F-4` Option B); deferred `eventIterator` until real first-frame-before-EOF + abort/reconnect proof lands; separated `RFC 0009` revocable stream proxy (noting `packages/plugin-streams-core/deno.json` does not yet export the RFC 0009 runtime proxy) and kept `#927` open.
- **Probe Changes:** [`probes/probe-c-manifest-gateway-redaction.ts`](probes/probe-c-manifest-gateway-redaction.ts#L2425-L2999) (`2.4`, `2.5`): renamed prototype to `createProbeLocalSseProxyPrototype` cleanly marked **NOT `RFC 0009` runtime export** and **NOT stale-allow race / idle expiry / pre-drain shutdown proof**; updated `2.5` to prove W2 HTTP-only gateway skips `eventIterator` procedures (`workersContract.subscribe`, `SYNTHETIC_CRONS_CONTRACT.tailEvents`).
- **Verification:** [`probes/probe-c.log`](./probes/probe-c.log) lines 12–13 (`PASS 2.4`, `PASS 2.5`).

#### `B6` — Root-Anchored Physical Containment & Symlink Escape Above `.netscript/generated/`
- **Disposition:** `ACCEPTED` *(Accepted)*
- **RFC Changes:** [`rfcs/0000-frontend-contribution.md`](../../../rfcs/0000-frontend-contribution.md) lines 362–372 (§2.7), 670–683 (§8), and 716 (§9.3): anchors `.netscript/generated/` and `.staging/` to trusted `Deno.realPath(projectRoot)` / `packageRoot`, fails closed on unresolved symlinks, confines contributor paths to host staging, and retains RFC 0005 write/argv/permission gates (`#1473` `G-1`, `G-2`, `G-10`).
- **Probe Changes:** [`probes/probe-c-manifest-gateway-redaction.ts`](probes/probe-c-manifest-gateway-redaction.ts#L338-L745): `physicalPath` fails closed when `Deno.lstat` succeeds and `Deno.realPath` throws; `deriveGeneratedArtifactPath` verifies every output against `trustedRealRoot(projectRoot)`; `1.3` tests symlinked `.netscript/generated/`, symlinked `.netscript/`, broken/dangling symlinks, and `.staging/` containment.
- **Verification:** [`probes/probe-c.log`](./probes/probe-c.log) line 5 (`PASS 1.3`).

#### `B7` — Separately Importable Framework-Free Data Loader ABI (`GPUIX` + Fresh 2)
- **Disposition:** `ACCEPTED` *(Accepted)*
- **RFC Changes:** [`rfcs/0000-frontend-contribution.md`](../../../rfcs/0000-frontend-contribution.md) lines 84–143 (Guide) & lines 524–551 (§5): defines `PortableRouteDataContext -> PortableHandlerResult<TData>` in a framework-free `./loaders/...` module (zero Fresh, Preact, `RouteConfig`, or `isPartial` imports) consumed by separate `./routes/...` Fresh 2 adapters and future GPUIX (`rfcs/0007`) / Fresh 3.x targets (explicitly marking Fresh 3 as an unexercised migration target).
- **Probe Changes:**
  - Created [`probes/probe-a-fixtures/portable-jobs-loader.ts`](probes/probe-a-fixtures/portable-jobs-loader.ts) (49 lines, standalone `deno check --no-lock exit=0`, 0 framework imports) and [`probes/probe-a-fixtures/fresh-jobs-adapter.tsx`](probes/probe-a-fixtures/fresh-jobs-adapter.tsx) (52 lines).
  - Added [`P2d`](probes/probe-a-fresh-mount.ts#L1501) executing `portable-jobs-loader.ts` through **both** a GPUIX-shaped `RouteModule` (asserting `fresh-jobs-adapter` load count === `0`) **and** Fresh 2 `normalizeFreshRouteModule` (`200` full, `?fresh-partial=true`, and `302` redirect).
- **Verification:** [`probes/probe-a.log`](./probes/probe-a.log) lines 11, 41–42, and 68 (`deno check --no-lock exit=0`, `PASS P2d`).

#### `B8` — Honest Partial Wave-0 Proofs, Non-Closure on RFC Acceptance, & `#940` / `#933` Break
- **Disposition:** `ACCEPTED` *(Accepted)*
- **RFC Changes:** [`rfcs/0000-frontend-contribution.md`](../../../rfcs/0000-frontend-contribution.md) lines 698–708 (§9.2) & lines 724–794 (§10–§11):
  - Explicitly qualifies Probe B as partial (localhost HTTP mocks + 1 Fresh app root with `pageModuleRouteBinding: false`); keeps `#925`, `#1469`, `#1470` **OPEN**; marks `#923`–`#927` partial and keeps ALL Wave-0 issues open (`RFC acceptance alone does NOT close any issue`).
  - Separates `W3a` (`#940` independent fixture + intentional failing-budget control) from `W3b` (`#933` Workers dogfood + **completing `#940`'s Workers CI receipt**, keeping `#940` open through W3b).

---

### Material Improvements (`M1`–`M6`)

| ID | Disposition | Changes Made & Verification |
| --- | --- | --- |
| `M1` | `ACCEPTED` *(Accepted)* | [`rfcs/0000-frontend-contribution.md`](../../../rfcs/0000-frontend-contribution.md) lines 204–277 (§1) & lines 666–683 (§8): single shared transactional generator core emitting **separate** `.netscript/generated/app/` and `.netscript/generated/devtools/` trees (`INV-4` production absence), multi-app targeting via `resolvePluginAppReferences`, staged type-check, atomic rollback, deterministic empty & byte-identical outputs, and runtime quarantine strictly out-of-band from generated files. |
| `M2` | `ACCEPTED` *(Accepted)* | [`rfcs/0000-frontend-contribution.md`](../../../rfcs/0000-frontend-contribution.md) lines 470–504 (§4.1–§4.3): specified allowlisted `GuardedPluginApp` facade + post-`fsRoutes` hook (`defineFreshApp`), bounded data-phase `Promise.allSettled` timeout containment, explicit warning that sync JSX throws `500` and nested async children emit empty `<div>` + `unhandledrejection` under Fresh 2.3.3, and W2 post-hydration client `ErrorBoundary` Playwright gate. |
| `M3` | `ACCEPTED` *(Accepted)* | [`rfcs/0000-frontend-contribution.md`](../../../rfcs/0000-frontend-contribution.md) lines 374–467 (§3): defined JSON Schema wire projection + `AppZoneContextMap` + `AppContributionKind` renderer registry modeled on RFC 0005 `DevToolsZoneContextMap`; noted `eis-etl/docs/design/figma-essentials/issue448` inspector is a design requirement while `activity-registry.ts` schema is authoritative; mandated server-side write checks for `fixedByPlugin`, `secret`, `editable: false`, `overridable: false`, and entity authorization. |
| `M4` | `ACCEPTED` *(Accepted)* | [`rfcs/0000-frontend-contribution.md`](../../../rfcs/0000-frontend-contribution.md) lines 450–467 (§3) & lines 619–665 (§7) + [`probes/probe-c-manifest-gateway-redaction.ts#L3334-L3885`](probes/probe-c-manifest-gateway-redaction.ts#L3334-L3885): verbatim integration of merged PR `#2670` (`resolveSecretFieldSubmission` `replace \| keep \| clear \| unset \| invalid`, rejecting implicit raw `null`/string clearing in RFC & Probe C `3.2`); decoupled `FrontendPluginCatalog` keyed cleanly by plugin/installation with independent `installedVersion`, `observedRuntimeVersion`, `healthState`, `quarantine`, `updateState`, and `doctorFreshness` dimensions matching `eis-etl#63`. |
| `M5` | `ACCEPTED` *(Accepted)* | [`rfcs/0000-frontend-contribution.md`](../../../rfcs/0000-frontend-contribution.md) lines 480–491 (§4.2), 505–523 (§4.4), and 705 (§9.2): specified package-owned route CSS exports, `basePath`-safe URLs, portal/plugin scoping, partial active-nav/breadcrumb sync, and `eis-etl#422` cross-tab/system `theme-signal.ts` parity; disclosed Probe B's host-`static/` fixture shortcut; added W2 Playwright CDP gates (`full -> partial -> back`, zero FOUC, active breadcrumb, theme sync). |
| `M6` | `ACCEPTED` *(Accepted)* | [`rfcs/0000-frontend-contribution.md`](../../../rfcs/0000-frontend-contribution.md) lines 670–683 (§8) & lines 731–794 (§10–§11): preserved `#427` (DevTools `panel`) & `#432` (shared scaffolder dashboard caller), carried forward `05-scaffolding-and-cli.md` starter drift reporting, typed route-ref merging, and `install -> render -> hydrate -> remove` gates, and documented `#936`/`#939` exclusion from `rfcs/0002` A7. |

---

### Minor Notes (`N1`–`N3`)

| ID | Disposition | Changes Made & Verification |
| --- | --- | --- |
| `N1` | `ACCEPTED` *(Accepted)* | Updated Probe B accounting everywhere ([`rfcs/0000-frontend-contribution.md`](../../../rfcs/0000-frontend-contribution.md) lines 698–706, [`worklog.md`](./worklog.md), [`context-pack.md`](./context-pack.md)) to **19 matrix rows (11 PASS, 5 CAVEAT, 3 FAIL)** + exit `0` includes expected failures + `C3` fixed summary after non-zero Vite exit; updated Probe A [`P4e`](probes/probe-a-fresh-mount.ts#L2037) to inspect `preact-render-to-string` dynamically (`6.8.3` vs `deno.lock` `6.8.0`); preserved visible `probe-a-fresh-mount.ts deno check --no-lock exit=1` alongside clean loader/adapter `--check exit=0` in [`probes/probe-a.log`](./probes/probe-a.log). |
| `N2` | `ACCEPTED` *(Accepted)* | Fixed CLI command in [`rfcs/0000-frontend-contribution.md`](../../../rfcs/0000-frontend-contribution.md) lines 192 & 670 to `netscript plugin install workers --app web`; corrected npm-only `catalog:` vs JSR caret range semantics (lines 517–520, 674); recorded Probe B's fixture-only `hostFreshSignalsPin` (line 704). |
| `N3` | `ACCEPTED` *(Accepted)* | Scoped SDK finding in [`rfcs/0000-frontend-contribution.md`](../../../rfcs/0000-frontend-contribution.md) lines 596–601 accurately to `stable-v1-adapter.ts` dropping `access.authorization`/`audience` on client metadata (server still fails closed via `compileProcedures`), placed rate/byte/timeout limits on host gateway policy rather than `NetScriptProcedureMeta`, and recorded Probe C `2.3` status codes accurately (`413` request overflow, `502` response overflow, `504` timeout). |

---

### Owner Forks (`F-1`–`F-5`)

| ID | Disposition | Changes Made & Verification |
| --- | --- | --- |
| `F-1` | `DEFERRED_TO_FORK` *(Fork amended)* | [`rfcs/0000-frontend-contribution.md#unresolved-questions`](../../../rfcs/0000-frontend-contribution.md#unresolved-questions) (line 842): replaced earlier options with **(A)** `packages/devtools-core` retains RFC 0005 spine ownership while `@netscript/plugin-frontend-core` re-exports/consumes it alongside `app` contracts (recommended default) vs **(B)** explicit RFC 0005 F-1 amendment + compatibility gate. |
| `F-2` | `DEFERRED_TO_FORK` *(Fork amended)* | [`rfcs/0000-frontend-contribution.md#unresolved-questions`](../../../rfcs/0000-frontend-contribution.md#unresolved-questions) (line 843): updated to **(A)** single parse-only `{ export, framework: 'fresh' }` pointer with sibling `ContributionEnvelope[]` (recommended default) vs **(B)** dual keys requiring explicit conflict/single-declaration rules. |
| `F-3` | `DEFERRED_TO_FORK` *(Fork amended)* | [`rfcs/0000-frontend-contribution.md#unresolved-questions`](../../../rfcs/0000-frontend-contribution.md#unresolved-questions) (line 844): updated Option **(A)** to define **field-level** host overlay (`x-eis-ui`) precedence where canonical `x-ns-ui` wins on conflict and overlays never weaken `secret`, `fixedByPlugin`, `editable: false`, or `overridable: false`. |
| `F-4` | `ACCEPTED` *(W2 cut updated; fork preserved)* | [`rfcs/0000-frontend-contribution.md#unresolved-questions`](../../../rfcs/0000-frontend-contribution.md#unresolved-questions) (lines 607–618, 731, 845): adopted **Option (B) HTTP-only in W2** cleanly; retained fork entry for owner sign-off on promoting `eventIterator` only after real first-frame + abort/reconnect proof. |
| `F-5` | `DEFERRED_TO_FORK` *(Fork amended)* | [`rfcs/0000-frontend-contribution.md#unresolved-questions`](../../../rfcs/0000-frontend-contribution.md#unresolved-questions) (lines 789–793, 846): preserves all 6 open issues (`#2491`, `#2531`, `#2556`, `#2561`, `#2565`, `#2568`), documents unlabeled `#2568` & `#2531` (`area:fresh-ui` without `epic:design-system`), and recommends **(A)** owner-led theme reassignment. |
