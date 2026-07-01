# Research — JSR alpha-1 publish mechanics (PR1)

Run-id: `chore-jsr-alpha1-publish-prep`
Branch: `chore/jsr-alpha1-publish-prep` (off origin/main `1b3c63c2`)
Scope overlay: SCOPE-service is N/A; this is a release-mechanics + scaffold slice touching
`packages/cli` (ARCHETYPE: CLI/tooling) + workspace-wide version fields + docs-site data + CI.

## Goal

Make the workspace publishable to JSR under a single aligned alpha version and fix the broken
scaffold version pins, so `deno task publish:dry-run` stays green AND a scaffolded JSR-mode app can
actually resolve its `@netscript/*` deps once published.

User decisions (locked):
1. Align ALL members to `0.0.1-alpha.1`.
2. Slow types accepted (4 whitelisted pkgs publish with `--allow-slow-types`).
3. Lock regen approved.
4. Publish via GitHub Actions OIDC, **tag-push** trigger.
5. Docs must dynamically read the pinned version; remove stale `1.0.0`/`^1.0.0` mentions.
6. Scaffold JSR pins must equal the latest released version.

## Ground truth (from two read-only sweeps over origin/main `1b3c63c2`)

### Workspace versions
- 31 of 32 members carry `"version": "0.0.1-alpha.0"`.
- ONE outlier: `packages/fresh-ui/deno.json:3` → `"version": "0.1.0"`.
- `deno bump-version` is increment-only (no explicit set). At workspace root it applies the same
  increment to every member AND rewrites `jsr:` refs in the root import map.
  - `deno bump-version prerelease -w --dry-run` confirmed: all `0.0.1-alpha.0` → `0.0.1-alpha.1`,
    EXCEPT fresh-ui `0.1.0` → `0.1.1-0` (wrong — it is off-base).
  - Therefore: normalize fresh-ui `0.1.0` → `0.0.1-alpha.0` FIRST, then `bump-version prerelease -w`
    yields uniform `0.0.1-alpha.1`. Downgrading fresh-ui in-tree is safe (nothing published yet;
    `@netscript` JSR scope confirmed EMPTY).

### Scaffold version pins (the correctness bug)
- `packages/cli/src/kernel/adapters/scaffold/import-resolver.ts:22-69` — `PACKAGE_TO_JSR` maps **48**
  `@netscript/*` imports to hardcoded `jsr:@netscript/...@^1.0.0` strings (incl. SDK subpaths
  `/client`, `/query`, `/query-client`; fresh-ui `/interactive`).
- Consumed by `packages/cli/src/kernel/adapters/templates/app/generate-app-deno-json.ts:46-60` when
  `importMode==='jsr'` (via `resolveNetScriptImports` fallback / `jsrResolver`).
- `^1.0.0` requires `>=1.0.0 <2.0.0`; published `0.0.1-alpha.1` will NOT resolve → scaffolded
  JSR-mode apps break. Caret ranges are useless on a prerelease, so the alpha pin must be EXACT
  (`@0.0.1-alpha.1`).
- Test `packages/cli/src/kernel/adapters/scaffold/tests/import-resolver_test.ts:21-22` asserts the
  `@^1.0.0` strings — must be updated in lockstep.
- `packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts` holds ONLY .NET/Aspire pins
  (`DOTNET_SDK`, `ASPIRE_SDK`, …), NOT `@netscript/*`. Gate E-12 (`check-scaffold-versions.ts`) only
  guards those Aspire pins for prerelease suffixes — it does not see `@netscript` versions.

### Single source of version truth (design)
- No `@netscript/*` entries in the root `catalog` (`deno.json:103-140` is npm-only). Correct.
- The CLI package is itself part of the lockstep version, so the released version == the CLI's own
  `version`. The robust fix: derive the scaffold pin from ONE release-version constant rather than 48
  hardcoded literals, so the next `bump-version` keeps scaffolds correct. Two candidate mechanisms:
  (a) read the version from the CLI package `deno.json` at module load (single source, bump-safe);
  (b) a generated/checked-in `NETSCRIPT_RELEASE_VERSION` constant updated by the bump step.
  PLAN-EVAL to confirm the chosen mechanism; (a) is preferred as it cannot drift.

### Docs version references
- Hardcoded `^1.0.0` / `0.0.1-alpha.0` "forward-looking, not installable today" narrative in
  `docs/site/concepts.vto:81`, `docs/site/capabilities/auth.md:104-109`,
  `docs/site/explanation/auth-model.md:21-22`, `docs/site/how-to/add-authentication.md:32-40`.
- No dynamic version mechanism today (`docs/site/_data.ts` is nav-only). Fix: feed the same release
  version into a docs data constant and reference it; drop the "not installable today" framing once
  the packages are actually published.

### Publish CI
- None. `.github/workflows/ci.yml` runs `deno task publish:dry-run` as a gate only — no
  `id-token: write`, no `deno publish`, no trigger. Need a new tag-push OIDC workflow.

### Authoritative readiness gate
- `deno task publish:dry-run` (`.llm/tools/run-publish-dry-run.ts`) already returns exit 0 over all
  30 publishable members: materializes `catalog:` → concrete `npm:` specifiers, runs
  `deno publish --dry-run --allow-dirty` (+ `--allow-slow-types` for the 4 whitelisted), restores
  configs in finally. CRLF drift is harmless under `--allow-dirty`.

## Open design questions for PLAN-EVAL
1. Single-source version mechanism (read-from-deno.json vs generated constant).
2. Exact-pin vs `^` for the alpha scaffold pin (research says exact during prerelease).
3. Lock-regen command + ordering (after version bump; lock-hygiene rules apply).
4. OIDC workflow shape: tag pattern (`v*` vs `v[0-9]*`), `permissions`, `deno publish` invocation
   (workspace root publishes all members), and the "restrict to members" scope posture.

## Out of scope (separate PRs)
- Package README revamp (PR2 — doc-authoring lane: OpenHands+Gemini deep search → Claude authoring
  workflow → OpenHands per-package IMPL-EVAL; removes in-package `/docs`, adds verified docs xrefs).
- The actual `deno publish` (release tag push) — happens after PR1+PR2 merge.
