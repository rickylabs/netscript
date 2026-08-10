use harness

You are the **PLAN-EVAL evaluator** for NetScript issue #1443 — a P0 consumer blocker. You are a
fresh, separate session from the plan's author (native Claude Opus 5). You evaluate; you do not
implement. **Do not edit any source file, do not commit, do not push.** Your only write is the
verdict artifact named below.

## SKILL

Activate these repo skills before judging anything — they are thin, and under-listing is the failure
mode:

- `netscript-harness` — primary. The harness operating model, run-loop phases, evaluator separation,
  lane policy, and the slice-review invariant you are enforcing.
- `netscript-doctrine` — the archetype and fitness-gate authority for `plugins/**` and `packages/**`.
  The plan claims ARCHETYPE-5 (`plugins/ai`), ARCHETYPE-6 (`packages/cli`), ARCHETYPE-1
  (`packages/plugin`) plus the `SCOPE-frontend` overlay; verify those selections are the smallest
  that fit.
- `jsr-audit` — the publishability rubric. The plan changes a **published** manifest protocol and
  adds emitted artifacts to a published plugin; check the surface and `publish.include` claims.
- `netscript-cli` — the CLI/scaffold/plugin-install/doctor/E2E command surface the plan modifies.
- `netscript-tools` — which command is a trustworthy verdict source, the scoped check/lint/fmt
  wrappers, and gate-evidence rules.
- `netscript-deno-toolchain` — `deno doc` for inspecting public surfaces cheaply; the dependency and
  lock-hygiene rules the plan commits to.
- `netscript-pr` — the PR body, label, milestone, and close-gate conventions the run must satisfy.
- `rtk` — prefix read-heavy `git`/`grep`/`ls` with `rtk` to keep this evaluation token-cheap.
- `codex-wsl-remote` — you are the daemon-attached session this describes; relevant if you need to
  report launch/thread facts.

## Pre-flight

```bash
cd /home/codex/repos/ns-1443-plugin-ai-orchestrator
rtk git status --short --branch
rtk git log --oneline -3
```

Expect branch `orchestrator/1443-plugin-ai-next-canary` at commit `2829aa052`, based on
`2256a67bf612907195ce5e51df1df7326c504f2b`. **Do not** fetch/reset/rebase; do not touch the working
tree.

## What to read

1. `.llm/harness/evaluator/plan-protocol.md` — your operating instructions.
2. `.llm/harness/gates/plan-gate.md` — the eight-box checklist you must check one at a time.
3. `.llm/harness/evaluator/verdict-definitions.md`.
4. The run dir `.llm/runs/orchestrator-1443-plugin-ai-next-canary--supervisor/`:
   `supervisor.md`, `research.md`, `plan.md`, the `## Design` section of `worklog.md`, `drift.md`,
   `phase-registry.md`, and `evidence/published-0.0.5-repro.log`.
5. Issue #1443 and its closed predecessor #260, live (`gh issue view <n> --repo rickylabs/netscript`).
6. Draft PR https://github.com/rickylabs/netscript/pull/1444 and its `[PHASE: PLAN]` comment.

## What the plan claims (verify, do not trust)

The plan locks seven decisions. The four with real blast radius:

- **D1** — make `provider.defaultServiceEntrypoint` and
  `officialSource.{serviceEntrypoint,serviceConfigKey,servicePort}` **optional** in
  `packages/plugin/src/protocol/manifest.ts`, so a manifest can express "this plugin has no
  service". Claimed backward compatible.
- **D2** — delete the unconditional `servicePackageEntrypoint` fallback in
  `packages/cli/src/kernel/adapters/plugin/appsettings-entry-builders.ts`, and write **no**
  `NetScript.Plugins[key]` entry at all for a service-less `category: 'plugin'` provider. Claimed
  safe because `plugin list` / `plugin doctor` source truth from `netscript.config.ts` and the
  installed `scaffold.plugin.json`, not appsettings.
- **D4/D5** — the AI scaffolder emits `ai/mod.ts` (mirroring `workers/mod.ts`) and `ai/deno.json`
  (preact + `jsx: precompile`), and install adds `./ai` to the generated root `workspace` array.
- **D6** — the `Markdown` surface is copied from the first-party fresh-ui registry into
  `ai/components/ui/` via the existing `installUiRegistryItems`, rather than re-implemented in
  `plugins/ai`. Claimed to work for published JSR consumers because the CLI bundles
  `FRESH_UI_REGISTRY_CONTENT` inline when no `--registry-root` is given.

## Your job

Check every box in `gates/plan-gate.md` — research currency, decisions locked with rationale, the
open-decision sweep (**any open decision that would force rework if deferred is an automatic
`FAIL_PLAN`**), commit slices (ordered, <30, each naming what it proves and its gate), risk
register, gate set selected from the archetype matrix, deferred scope explicit, and the jsr-audit
rubric applied to the **planned** public surface.

Be adversarial on these specifically:

1. **Is D2 actually safe?** Read `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-plugins.ts`,
   the plugin-reference reconciler, `plugin list`, and `plugin doctor`. Does anything break, or
   silently change shape, when an installed plugin has no appsettings entry? Name the file and line
   if it does.
2. **Is D1 truly backward compatible?** Widening a `.strict()` Zod field to `.optional()` also
   changes the derived TypeScript type. Does `normalizeManifestProvider` or any consumer of
   `PluginKindProvider.defaultServiceEntrypoint` become unsound (or start silently taking a
   different branch) for existing manifests?
3. **Does D6 hold for a published consumer?** Verify that `installUiRegistryItems` with
   `registryRoot === undefined` really resolves content inline, and that targeting a non-app root
   (`<project>/ai`) does not violate an invariant in `resolve-ui-app-root.ts` / `registry-styles.ts`.
   If it cannot work, say so now — that is exactly the rework the Plan-Gate exists to prevent.
4. **Is the slice order right?** Would any slice leave the tree in a state where an earlier slice's
   gate would now fail?
5. **Is anything in the plan a paper-over?** The owner explicitly forbids docs-only fixes, skips,
   hardcoded plugin names, casts, `any`, lint suppressions, deleted tests, and fixture-only special
   cases. Flag any decision that trends that way.
6. **Coverage.** Does the locked plan actually close **all seven** acceptance boxes in #1443? Map
   each acceptance box to the slice that closes it, and name any box no slice covers.

## Output

Write your verdict to
`.llm/runs/orchestrator-1443-plugin-ai-next-canary--supervisor/plan-eval.md`, using
`.llm/harness/templates/plan-eval.md`. It must contain:

- the eight plan-gate boxes, each `PASS` / `FAIL` / `PENDING_SCRIPT` with the concrete evidence you
  gathered (file + line, or command + output — not impressions);
- a per-acceptance-box coverage table for #1443;
- your findings, numbered, each with what is wrong, where, and the specific required fix;
- a final line `VERDICT: PASS` or `VERDICT: FAIL_PLAN`.

Then post the same verdict as a PR comment on #1444, leading with the token line
`**[PHASE: PLAN-EVAL] [VERDICT: APPROVED]**` or `**[PHASE: PLAN-EVAL] [VERDICT: CHANGES_REQUESTED]**`
(`gh pr comment 1444 --repo rickylabs/netscript --body-file <file>`).

Do not commit; the supervisor commits your artifact after reviewing it. Report your thread id and
the verdict in your final message.

No praise, no adjectives, no summary of how thorough you were. Findings and evidence only. If the
plan is sound, say `PASS` and stop.
