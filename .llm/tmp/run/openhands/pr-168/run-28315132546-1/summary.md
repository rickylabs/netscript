# PLAN-EVAL — issue-167-marketplace-plugin-install (PR #168)

**Verdict: PASS**

## Summary

PLAN-EVAL session for the Deno-native JSR plugin installer / marketplace foundation plan
(PR #168, branch `feat/plugin-install-jsr-dx`). The plan (`.llm/tmp/run/issue-167-marketplace-plugin-install/plan.md`)
describes a 12-slice implementation: a new userland install pipeline in `packages/cli`
(Archetype-6) plus per-plugin `./scaffold` entrypoints and a versioned
`scaffold.plugin.json` manifest on the five `@netscript/plugin-*` packages (Archetype-5).

All eight Plan-Gate boxes checked. Decisions D1–D8 locked with rationale; 12 commit slices
ordered (S1→S2→S3→S4→S5 ordered CLI core; S6–S10 parallelizable plugin ports; S11 depends on
S5+≥1 plugin; S12 closeout); risk register with concrete owners (S5/S11 owns the
readers-vs-copier question with two resolutions + evidence mandate; pre/post-publish split
is explicit); gate set selected from `archetype-gate-matrix.md` plus the service scope
overlay; six deferred scope items explicit; `jsr-audit` + `publish:dry-run` wired into
per-slice validation.

No unsound assumptions; no decision deferred that would force rework.
Implementation may begin on S1 → S12.

## Changes

- **Added** `.llm/tmp/run/issue-167-marketplace-plugin-install/plan-eval.md` (90 lines)
  - Per-checkbox findings table
  - Read-only repo verification (every cited file:line anchor spot-checked)
  - Fitness gate coverage check against `archetype-gate-matrix.md`
  - Doctrine / archetype drift check (no violations introduced or deepened)
  - Open-decision sweep (evaluator-run)
  - Five non-blocking notes for IMPL-EVAL
  - Verdict: PASS

## Read-only verification (anchors confirmed)

- `findOfficialPluginSourceRoot` at `packages/cli/src/kernel/application/registries/plugin-kind-registry.ts:157` (also `hasOfficialPluginSources` at :267)
- `PluginKindProvider` interface at line 53 of plugin-kind-providers
- `createOfficialPluginCopier` at `packages/cli/src/maintainer/infra/official-plugin-copier.ts:12`
- `add-plugin.ts` imports `PluginWorkspaceMutator`, `copyPluginSchemasToRootDb`, `PluginKindRegistry`
- `ScaffoldPluginManifest` / `OfficialSourceManifest` at `packages/cli/src/maintainer/adapters/official-plugin-source.ts:88-94`
- Official plugins at v0.0.1-alpha.12 (workers, auth, streams, sagas, triggers)
- `auth` is the outlier: no `./cli`, no `./scaffolding` today (confirmed)
- `workers` has scaffolding templates at `plugins/workers/src/scaffolding/templates` and `bin/combined.ts`
- e2e gate readers exist (database-gates, runtime-gates)
- `create-default-runner.ts` has no plugin-install path (true-userland install gate is a real gap, confirms S11's value)

## Notes for IMPL-EVAL (non-blocking)

1. **S4 dispatch extension shape** — state in S4's worklog whether `scaffold` becomes a new
   verb member on the existing dispatch discriminated union or a sibling function.
   Affects whether `dispatchPluginVerb` is the single point of plugin subprocess control.
2. **F-CLI-* enumeration** — name each F-CLI-* gate the slice touches in its worklog
   (Phase A reporting permits PENDING_SCRIPT; naming the gates now cuts IMPL-EVAL drift).
3. **Alias-map evaluation point (S2)** — clarify that the bare-kind alias map is consulted
   *before* `PluginKindRegistry.get` throws, OR that the registry is pre-seeded at the top
   of `add-plugin`. Without this, "Unsupported plugin kind" can still fire for bare names.
4. **jsr-audit: new `./scaffold` export** — must be self-contained for `deno x` invocation
   (no implicit cross-imports to non-exported plugin internals). Per-slice check.
5. **S11 `--local-path` invocation shape** — when building the userland-install suite, the
   runner must point at a `deno task` that uses `--local-path <plugin dir>`. Resolvable in S11.

## Validation

- Verdict computed by applying `.llm/harness/gates/plan-gate.md` checklist verbatim to
  `.llm/tmp/run/issue-167-marketplace-plugin-install/plan.md`, `research.md`, and
  `grounding-deno-native.md`.
- Cross-referenced against `.llm/harness/gates/archetype-gate-matrix.md` for fitness-gate
  coverage (Archetype-5 universal F-* + F-13 subtype for runtime; Archetype-6 universal F-*
  + F-CLI-* via proxies per Phase A reporting rule).
- Read-only file:line anchors verified against current `main` (no source edits).
- `deno.lock` not touched (lock hygiene preserved per operational contract).

## Remaining risks

None blocking. The five notes above are for the implementation lane (WSL Codex daemon-attached
slices) to act on; none require re-evaluation by PLAN-EVAL.

## PR comment

Per the operational contract, "the workflow owns GitHub comments" — no `gh pr comment` issued
from this session. The verdict and notes are captured in `plan-eval.md` and this summary;
the workflow will surface the PR comment for PR #168.
