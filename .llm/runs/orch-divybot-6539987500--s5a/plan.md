# Plan & Design — READY FOR REVIEW

Refs #2418, phase 1 only. Archetype 6 CLI/tooling with docs scope; shared token
adapter extends the existing integration boundary. Existing doctrine constraints
remain: presentation parses, injected edges perform effects, named typed exports.

## Locked decisions

1. A tools-side selective TokensBrücke fork preserves LICENSE, source header,
   upstream URL and exact SHA. No publishable plugin package.
2. Snapshot export is lossless and deterministic, reproducing all ten fixture
   JSON files byte-for-byte using explicit exportDate (default fixture date)
   and actual fileKey. Alias IDs are translated to collection/name.
3. A DTCG 2025.10 round-trip document carries each variable/mode as tokens;
   extensions preserve Figma names, scopes, syntax, type, mode order, raw float
   precision and oklch. Import validates everything before mutating; two passes
   create variables then resolve aliases. Preserve existing IDs on reimport.
4. Round-trip conversion lives in the shared Fresh UI token adapter (explicit
   typed functions through tokens.ts), so CLI and plugin consume one converter.
   The existing shared source-composition function then reuses importFigmaTokens and current resolver/documents to build portable
   theme items. Source composition replaces script-only compaction. Registry
   themes carry DTCG variable sources and declared metadata;
   CLI compiles these with the existing token engine before the S2 staged
   installer commits them. No remote code evaluation.
5. Generic registry:theme/base URLs use S2 schema/path/lock validation; preset
   JSON uses UiPresetSchema. Existing ns1 share links retain their semantics.
   Bad network, JSON, schema, names or compile inputs must leave apply unchanged.
6. init --preset selects the generated app and calls the same application flow;
   local maintainer init exposes the same option for clean-scaffold acceptance.
7. GitHub export updates a standalone portable theme JSON in the user's theme
   repository, default `themes/studio-utility.json`, NOT NetScript's pinned
   `packages/fresh-ui/tokens/figma/` inputs. First download seeds that file; PR
   export requires an existing baseline and refuses name/type/metadata changes.
   The portable item carries a DTCG variable document per collection/mode and a
   DTCG resolver in `meta.netscript.figma`. Each variable has a stable collection/
   variable index identity, aliases point to those IDs, and oklch is an extension.
   Raw FLOAT values remain exact DTCG numbers. The CLI imports that bundle using
   a new shared converter and the existing importFigmaTokens composition.
   GitHub uses one tree/commit/branch + PR and writes exactly that item file. Token is input-only
   memory and never written to clientStorage/localStorage or repository files.

## Risks and mitigations

- Figma host unavailable in CI: mock actual Plugin API shape, exact fixture bytes,
  alpha/float/alias/Theme B controls; state manual host validation UNPROVEN.
- Browser build: keep snapshot main independent of Node; bundle UI shared import
  only (not Style Dictionary); exercise bundle task.
- Name drift: check every mapped WEB name against role-manifest with explicit
  migrations; reject unknown variables against approved collection inventory.
- URL trust: published schema, S2 containment, no forwarded credentials, preflight
  before physical writes; negative transport/schema/path tests.
- Values-only identity: exactly one portable theme item changes in the PR;
  only its DTCG `$value` leaves and oklch extension differ. Compare every changed
  file and reject any metadata/name/type/alias-topology changes before push.
- Carriers and locks: regenerate in existing order, inspect lock diffs, revert
  docs-site lock churn only. Root check:* baselines are recorded, never hidden.

## Resolved open decisions (PLAN-EVAL repairs)

- `check:figma-names` checks the pinned snapshot plus every portable theme item
  given to it (default: committed fixture items).
- It fails on any WEB name that isn't in the role manifest after name migrations,
  with a message naming the collection, variable and CSS variable.
- The plugin README documents a ready-to-copy CI step so the theme repository
  runs that same check on export PRs.
- The plugin's pre-push refusal and the CLI's install-time rejection use the
  same checker.
- S4's proof is a negative control: a modified theme item with one unknown name
  fails this check.

- Canonical export PR path: user-selected theme repository `themes/<preset>.json`.
  NetScript's pinned snapshot provenance, generated sources and carriers remain
  unmodified by such exports; their provenance fields continue to mean approved
  upstream handoff PR/commit. No new interpretation or bypass of that policy.
  The plugin generates only the portable item. CLI derives app DTCG sources and
  web artifacts during installation. Values-only proof compares EVERY changed
  PR file: exactly one theme item, whose only changed leaves are DTCG `$value`
  (including color components/alpha/hex) and its oklch value extension. A baseline
  export must be downloaded and committed once; an absent baseline fails clearly.
- Sources install in `tokens/source/`, with tokens.config.json sourceRoot set to
  `tokens/source`, preset selected from the existing 24 defaults. Existing custom
  sourceRoot refuses installation before writes; an existing semantic override is
  retained and compiled with the new sources. The URL's S2 lock entry owns source,
  config, generated assets and docs; subsequent tokens build must retain values.
- URL dispatch: an http(s) URL with a nonempty `preset` query parameter is the
  existing share link, decoded locally. Other HTTP(S) inputs fetch JSON once.
  A strict UiPresetSchema version-1 document's theme is an existing built-in
  preset ID, not another URL; otherwise validate the published registry schema
  and require registry:theme/base. Reject empty share query, bad protocols,
  credentials, fetch failure, malformed JSON, invalid preset fields, unknown
  preset ID, non-theme item, unsafe file target and compiler/name failures.
  Tests serve the modified item with a loopback Deno HTTP server and also inject
  failing transports; all apply failures assert unchanged filesystem snapshots.
- Plugin typing/build: a narrow structural Figma Plugin API port follows the
  official async API; no npm typings dependency or lock change is required.
  Explicit root `figma:check`, `figma:test`, `figma:lint`, `figma:fmt:check` tasks
  invoke structured wrappers with tools/figma-plugin AND changed token adapter
  selections. `check:figma-names` owns independent inventory/name validation.
  `figma:build` bundles main as IIFE and iframe UI as browser ESM. The required
  `ci.yml` quality job executes plugin gates and name validation unconditionally
  (so tools-only diffs cannot policy-skip). Root wrappers are not plugin evidence.
- The tools plugin is a browser integration/tooling surface with a docs overlay,
  not a new doctrine package. Fresh UI is its existing archetype 4 public token
  API (also integration adapters); CLI is archetype 6. Gates map: universal
  F-1…F-19 via arch:check/audit/quality and scoped public surface checks;
  F-CLI-* via existing check-doctrine --all-roots; dynamic external boundaries
  by URL/mock tests, browser packaging by figma:build. Runtime and consumer gates
  add the scaffold proof and full scaffold.runtime, beyond scoped wrappers.
- Public init command is already above F-CLI-1's 150-line cap: split its input
  normalization/execution into a feature helper so the edited presentation file
  falls below the cap. Do not deepen existing size debt.

## Open decisions

None requiring implementation rework. Safe to defer: Figma Community publishing,
manual host acceptance, Code Connect and gap components (phase 2 dependency).
No new architectural debt is accepted. GitHub token scopes (fine-grained Contents/Pull requests write, or classic public_repo/repo) and manifest networkAccess domains are documented in the plugin README.

## Gates

Each slice: structured check/test/lint/fmt wrappers and substantive independent
slice review. Final: quality:gate, release:preflight, docs:accuracy, all root
check:* tasks, regenerated prose/corpus/barrel/publish carriers, jsr audits,
publish-size, fixture roundtrip/name negative controls, URL command acceptance,
one-command clean scaffold + deno task check, full scaffold.runtime command
(Docker unavailable => UNPROVEN), PLAN-EVAL and IMPL-EVAL using owner route.

## Final gate-driven slice refinement

S6a groups five Figma adapter files and three raw Figma domain files under
cohesive figma/ folders, with import/reference updates and one regenerated type
carrier (under30 files); prove with canonical source bytes, figma:ci, and audit
showing no new cardinality finding. S6b groups URL preset operations in CLI to
avoid deepening its existing folder counts, with focused URL/init gates. S6c
regenerates carriers and records final gates/IMPL-EVAL. This is required fitness
repair within the approved surfaces, not new feature scope.
