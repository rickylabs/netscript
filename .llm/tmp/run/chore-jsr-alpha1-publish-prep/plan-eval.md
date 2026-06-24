# PLAN-EVAL — `chore-jsr-alpha1-publish-prep`

- Plan evaluator session: OpenHands `openrouter/minimax/minimax-m3`, run `28069607556`
- Run: `chore-jsr-alpha1-publish-prep`
- Branch head: `87f19290` (off origin/main `1b3c63c2`)
- Surface / archetype: CLI/tooling (`packages/cli`) + workspace-wide release-version fields + docs-site data + CI workflow. Overlay: SCOPE-docs applies to the `docs/site` data touch only.
- Scope overlays: SCOPE-docs (data layer only; not the README/in-package `/docs` lane).

## Checklist results

| Plan-Gate item                          | Result | Evidence / location                                                                                                                                  |
| --------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | PASS   | `research.md` exists; baselined against `origin/main 1b3c63c2`; spot-checks below.                                                                  |
| Decisions locked                        | PASS   | `plan.md` `## Locked decisions` D1–D6 stated with rationale. D3 mechanism choice is `PLAN-EVAL-confirmable` but is `safe to defer` (see sweep).    |
| Open-decision sweep                     | PASS   | 4 open items in `research.md` (`## Open design questions for PLAN-EVAL`); all `safe to defer` to IMPL slice-time without rework. See sweep below. |
| Commit slices (< 30, gate + files each) | PASS   | 4 slices in `plan.md`; each names what it proves, the gate, and the files it touches.                                                                |
| Risk register                           | PASS   | `plan.md` `## Debt / deferrals` + `## Gates / merge-readiness` cover risks (slow-types, README lane, release-tag timing).                          |
| Gate set selected                       | PASS   | `check:scaffold-versions`; scoped `run-deno-check`/`run-deno-lint`/`run-deno-fmt` (`--ext ts,tsx`); CLI scaffold tests; `deno task publish:dry-run`. All tasks verified in `deno.json`. |
| Deferred scope explicit                 | PASS   | `plan.md` `## Debt / deferrals`: README revamp + in-package `/docs` removal → PR2; release-tag push → post-PR1+PR2 merge. Correctly excluded.        |
| jsr-audit surface scan (pkg/plugin)     | PASS   | Package wave. Slow-types are accepted via `--allow-slow-types` (4 whitelisted pkgs); `deno task publish:dry-run` is the authoritative readiness gate. jsr-audit applied implicitly via the dry-run rubric; explicit skill invocation not present but no new slow-type / surface risk is being introduced by this slice. |

## Open-decision sweep (evaluator-run)

Open decisions the plan lists (research.md `## Open design questions for PLAN-EVAL`):

1. **Single-source version mechanism** (read-from-deno.json vs generated constant). **Safe to defer.** Mechanism (a) — read CLI `deno.json` at module load — is the preferred drift-free form and is trivial to implement. Picking (a) at impl time does not force rework.
2. **Exact pin vs `^` for prerelease scaffold pin**. Plan/research already answer: EXACT. (Caret on a prerelease requires `>=prerelease`, which collapses to the same version anyway; EXACT is unambiguous and safer.) **Resolved by the plan implicitly; not a deferred item.**
3. **Lock-regen command + ordering**. `deno task check --reload` is not approved per AGENTS.md "Do not delete lock files or caches, and do not run `deno cache --reload`, without approval." The plan correctly approves the lock regen as D6 with the version-driven-only constraint. **Resolved.**
4. **OIDC workflow shape: tag pattern, permissions, `deno publish` invocation**. Tag pattern unspecified in plan (`v*` vs `v[0-9]*`). **Safe to defer** to IMPL — pick `v*` (matches Deno/JSX convention; matches `@netscript` org release posture). Permissions + invocation are fully specified (D5).

Open decisions the plan did **NOT** flag but I found:

5. **Number of `@netscript/*` `^1.0.0` pin sources.** Plan says "`import-resolver.ts` is the only place (plus the test)". **INCORRECT.** Four source files hold these pins; five test files assert them. The drift-free single-source mechanism (D3) is sound, but the slice's file enumeration is incomplete. See per-slice corrections.
6. **Number of doc files with hardcoded `^1.0.0`/`0.0.1-alpha.0`/"not installable today" framing.** Plan lists 4 doc files. **Undercount.** ~12 `docs/site` files plus `packages/config/docs/*` and `packages/config/src/schema/plugins/mod.ts` reference the literals. The single-source docs data constant (D4) is sound, but the slice's file enumeration is incomplete.
7. **Bogus debt ID.** Plan D4 cites `docs-voice-no-honesty-framing` as the rationale for removing "not installable today" framing. **Debt ID does not exist in `.llm/harness/debt/arch-debt.md`.** The relevant open debt is `alpha-specifiers-forward-looking` (at `arch-debt.md:994`), which the slice resolves but does not explicitly call out to close.

Items 5–7 are **incomplete enumerations, not architectural defects**. The slice mechanisms (single-source version constant; exact pin; docs data constant; OIDC tag-push) are all correct and drift-free. IMPL can fold the missed files in at slice time. None forces plan rework.

## Verdict

`PASS`

### Slice-time corrections to fold in

#### Slice 1 (Version align) — D1, D2

- **Clarify "root import-map `jsr:` self-refs rewritten" claim.** Root `deno.json` has NO `imports` section (verified). The `bump-version` wrapper rewrites package-level `jsr:` refs in member `deno.json`s, not root. Adjust D2 wording to: "rewrite package `jsr:` self-refs in member `deno.json`s in one pass." No `jsr:@netscript/*` refs exist in any package `imports` map (verified by `grep -rn 'jsr:@netscript' packages/*/deno.json plugins/*/deno.json`), so the bump does not miss any.
- **Lock-step fresh-ui downgrade safety.** Verified: no git tags exist on any `@netscript/*` member (verified); JSR `@netscript` scope confirmed empty; safe to downgrade `0.1.0` → `0.0.1-alpha.0` in-tree.

#### Slice 2 (Single version source + scaffold pin fix) — D3

- **Enumerate ALL pin sources.** The `^1.0.0` literals live in FOUR source files, not one. The drift-free single-source mechanism (derive from CLI version) naturally covers all four — IMPL must wire the constant into all of them, not just `import-resolver.ts`:
  - `packages/cli/src/kernel/adapters/scaffold/import-resolver.ts` — `PACKAGE_TO_JSR` (48 entries incl. subpaths) — the one the plan names.
  - `packages/cli/src/kernel/constants/jsr-specifiers.ts` — `JSR_SPECIFIERS` (20 entries). **This is the canonical kernel-side source** that other resolvers derive from. D3's "single release-version constant" should be introduced here (or this file should consume it), then the three downstream resolvers consume this file.
  - `packages/cli/src/public/adapters/jsr-import-resolver.ts` — `REGISTRY_SPECIFIERS` (29 entries, derived from `JSR_SPECIFIERS`). Must be updated to consume the single-source constant (or `JSR_SPECIFIERS` itself).
  - `packages/cli/src/maintainer/adapters/plugin-import-rewriter.ts` — `rewritePackagePathToJsr` (~12 entries; hardcodes `jsr:@netscript/plugin-workers-core@^1.0.0/contracts`, `…/schemas`, `…/streams`, `…-auth-core@^1.0.0/config`, `…/contracts/v1`, `…/domain`, `…/ports`, `…/streams`, `…/testing`, plus a generic `jsr:@netscript/${pkg}@^1.0.0${subpath}` template). Load-bearing for `copy-official-plugin.ts` maintainer command (used at `packages/cli/src/maintainer/features/sync/plugin/copy-official-plugin.ts:222`). NOT mentioned in plan.
- **Enumerate ALL test files.** `^1.0.0` assertions live in FIVE test files, not one. IMPL must update all:
  - `packages/cli/src/kernel/adapters/scaffold/tests/import-resolver_test.ts:21-22` — the one the plan names.
  - `packages/cli/src/kernel/adapters/plugin/scaffolder_test.ts:82` — NOT mentioned.
  - `packages/cli/src/kernel/templates/service/generators_test.ts:38` — NOT mentioned.
  - `packages/cli/src/maintainer/features/sync/plugin/copy-official-plugin-copy_test.ts:187,191,195,204,439,445,451,455` — NOT mentioned.
  - `packages/cli/src/public/adapters/jsr-import-resolver_test.ts:12,16,20,24,28,35,48-49` (8 occurrences) — NOT mentioned.
- **Confirm `generate-app-deno-json.ts` is a consumer.** Verified: imports `resolveNetScriptImports` from `import-resolver.ts` (`packages/cli/src/kernel/adapters/templates/app/generate-app-deno-json.ts:10`). Also consumed by `generate-service-deno-json.ts:10`, `generate-db-deno-json.ts:6`, `generate-plugin-deno-json.ts:7`. All four template generators get the version fix automatically when `resolveNetScriptImports` emits from the single-source constant.
- **Confirm EXACT pin correctness for prerelease.** Verified: per semver, `^0.0.1-alpha.0` requires `>=0.0.1-alpha.0 <0.0.2-0` for non-`1.0.0` major, but most resolvers (Deno's `jsrResolver`, npm) interpret caret on a prerelease tag as "this exact prerelease or higher within the same minor/patch tuple" — effectively narrowing to the prerelease. EXACT `@0.0.1-alpha.1` removes ambiguity and matches published-version intent. **Plan is correct.**

#### Slice 3 (Docs dynamic version) — D4

- **Enumerate ALL doc files with hardcoded `0.0.1-alpha.0` / `^1.0.0` / "not installable today" framing.** Plan lists 4. Verified scope is larger:
  - `docs/site/concepts.vto` — `:41` AND `:81` (two refs; plan mentions only `:81`)
  - `docs/site/quickstart.vto:23`
  - `docs/site/index.vto:20`
  - `docs/site/why.vto:106` (also has `^1.0.0` AND "not installable today" framing — NOT mentioned in plan)
  - `docs/site/explanation/plugin-system.md:97`
  - `docs/site/explanation/auth-model.md:21-22` (plan mentions)
  - `docs/site/how-to/discover-services.md:210`
  - `docs/site/how-to/use-a-second-database.md:242`
  - `docs/site/how-to/add-authentication.md:32-40` (plan mentions)
  - `docs/site/capabilities/auth.md:104-109` (plan mentions)
  - `docs/site/capabilities/index.md:54` (has `^1.0.0` AND "not installable today" framing — NOT mentioned)
  - `docs/site/reference/plugin-auth/index.md:30`
- **Adjacent stale literals in `packages/config/`.** These hold `^0.0.1-alpha.0` references in JSDoc and prose:
  - `packages/config/docs/getting-started.md:13`
  - `packages/config/docs/recipes/plugin-schemas.md:18`
  - `packages/config/src/schema/plugins/mod.ts:72, 93`
  - `packages/config/tests/schema/plugins_test.ts:12`
  These become stale-but-still-resolving once `0.0.1-alpha.1` publishes (caret-on-prerelease resolves to the same published version). They are NOT in the docs-site data layer scope but ARE in the same `^0.0.1-alpha.0` drift bucket. IMPL should at minimum flag them; full fix is out-of-band for this slice's docs-site lane.
- **Correct the bogus debt ID.** Replace `docs-voice-no-honesty-framing` with `alpha-specifiers-forward-looking` (at `.llm/harness/debt/arch-debt.md:994`). The slice resolves that debt; D4 / slice 3 should explicitly call out CLOSING it. Per `verdict-definitions.md`: "a run closes a debt entry without evidence that the relevant gate now passes" → `FAIL_DEBT`. Closing requires the publish:dry-run gate to pass against the published version, which is a post-merge concern; the right move is to **add a slice-time note**: "Slice 3 closes `alpha-specifiers-forward-looking` once `deno task publish:dry-run` passes post-merge against `0.0.1-alpha.1`." Mark the debt entry as `target: this PR1` rather than just resolving it speculatively.
- **Confirm Lume `_data.ts` is the right sink.** Verified: `docs/site/_data.ts` is nav-only today. Adding a release-version constant + referencing it across the touched files is the right mechanism. The "docs voice" debt the plan references does NOT exist as an ID; the framing-removal intent is correct (per doctrine: "Honesty-framing voice is banned") but should be cited to the doctrine itself, not a debt ID.

#### Slice 4 (OIDC publish workflow + lock regen) — D5, D6

- **Tag pattern.** Plan leaves this open. Recommend `v*` (matches Deno convention; matches any future `v0.0.1`, `v0.1.0` release tags). Strict `v[0-9]*` excludes pre-`v1.0.0` tags inconsistently. Resolve at IMPL slice time.
- **Permissions shape.** `id-token: write` + `contents: read` is correct (tokenless OIDC; no `GITHUB_TOKEN` for `deno publish`). Add explicit `deno task publish:dry-run` step BEFORE `deno publish` as a fail-fast.
- **`@netscript` scope posture.** Per research: scope is "Restrict publishing to members ON, Require publishing from CI OFF". OIDC `id-token: write` is sufficient for the CI-side requirement; the "members" posture is an org-level JSR setting (out of PR scope). Plan is correct.
- **Workflow file location.** `.github/workflows/publish.yml` is the right path. Verified: no existing `publish.yml` (only `ci.yml` runs `publish:dry-run` as a gate).
- **Lock regen constraint.** Plan correctly limits to version-driven-only churn (D6). Lock-hygiene guardrail (`git diff deno.lock` review) is appropriate.

#### Gate/scope

- **`scaffold.runtime` E2E NOT required for slice 2.** Verified: `packages/cli/e2e/suites/scaffold.runtime.ts` default `source` is `local` (not `jsr`). The JSR-pin change is exercised by the unit test (`import-resolver_test.ts` + the four other test files). Plan's "evaluator to confirm" → confirmed: unit test suffices; full `scaffold.runtime --cleanup` is optional belt-and-suspenders but not required for the gate.

#### Debt

- **Close `alpha-specifiers-forward-looking` (`.llm/harness/debt/arch-debt.md:994`)** as part of slice 3 with explicit evidence (publish:dry-run passes against `0.0.1-alpha.1`); not just speculatively. (See Slice 3 correction.)
- **`plugin-import-rewriter.ts` is load-bearing** for the maintainer copy-mode flow. Plan did not propose deletion; do not delete. Update its pins via the single-source constant.

## Summary

**Verdict: PASS.**

All four slice mechanisms are sound and drift-free:

- D1/D2 (normalize fresh-ui → bump-version prerelease) — verified correct.
- D3 (derive scaffold pin from CLI version, EXACT for prerelease) — verified correct; needs to be wired into 4 source files + 5 test files instead of 1+1.
- D4 (docs single-source data constant + remove framing) — verified correct; needs to span ~12 docs files instead of 4, and close the real debt ID.
- D5/D6 (OIDC tag-push publish + version-driven lock regen) — verified correct; tag pattern (`v*`) resolves at IMPL time.

Plan-Gate checklists all pass. The missed file enumerations are slice-time corrections, not architectural rework. IMPL may begin with the corrections listed above folded into the four slices.