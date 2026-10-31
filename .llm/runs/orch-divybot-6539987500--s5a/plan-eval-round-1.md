**Verdict: FAIL_PLAN** (PLAN-EVAL, S5a, feature tier, cycle 1 of 2)

Three Plan-Gate boxes fail. The open-decision sweep fails automatically, because the plan says "None requiring implementation rework" while three unflagged decisions would force rework. The commit-slice and gate-set boxes also fail.

## Boxes that pass

- **Research present and current.** It is re-baselined at the current main commit. I checked these claims against the tree and all hold:
  - `importFigmaTokens` resolves values through `figmaModes` and `resolveFigmaValue` (`packages/fresh-ui/src/tokens/adapters/figma-token-source.ts:36`).
  - The script-only shared-context step lives in `packages/fresh-ui/scripts/import-figma-tokens.ts:30-42`.
  - The handoff has ten fixture JSON files: nine collections plus `index.json`.
  - `TokenEnginePort.build` accepts `sources` (`packages/cli/src/kernel/ports/token-engine-port.ts:4`).
  - `init` has `--from` but no `--preset`.
- **Decisions locked.** Seven decisions, each with a rationale.
- **Risk register.** Six risks, each with a mitigation.
- **Deferred scope explicit.** Code Connect, Community publishing and manual testing inside Figma are deferred.
- **jsr-audit.** The planned widening of the tokens entrypoint is named, along with slow-type and payload risks.

## Boxes that fail, with required amendments

### 1. Open-decision sweep: three unflagged decisions

**a. A PR that changes only snapshot values will fail CI.** Decision 7 says the GitHub export commits "only changed snapshot value files". The repo checks those files in four places:
- `packages/fresh-ui/tokens/figma/provenance.json` pins a SHA-256 hash for every collection file. `scripts/figma-provenance.ts:23` throws `Figma snapshot provenance changed` on any edit.
- `import-figma-tokens.ts --check` throws `Stale generated DTCG source` when the `tokens/v2/*` files are out of date.
- `embed-token-assets.ts` embeds both the snapshot and the v2 sources into generated files that are checked for freshness. `tokens:sources:check` covers all three of these checks.
- A further snapshot copy lives under `packages/fresh-ui/registry/theme/figma/`.

**Required:**
- Name the canonical file paths the PR writes.
- Define how provenance gets updated, including what its `pullRequest` and `commit` fields mean for an export from the plugin.
- Decide who regenerates the derived files: the plugin, using the shared composition function, or a named CI job.
- Restate the "values-only" proof so it covers every changed file, derived ones included.

**b. Where an installed URL theme's sources live is undecided.** `buildAppTokens` compiles the bundled sources unless `tokens.config.json` sets `sourceRoot`. `stageUiPresetTokens` only saves `preset` and `override`. As planned, the next `tokens build` would silently overwrite the Figma values with the bundled ones.

**Required:**
- Where the theme's DTCG files are installed (for example `tokens/source` with `sourceRoot` set).
- Which preset id is selected (it must appear in `defaults.presets`).
- What happens when the app already has its own `sourceRoot` or `override`.
- Which lock entry owns the files.

**c. The rule for telling URL kinds apart is undecided.** `decodeUiPreset` (`packages/cli/src/kernel/domain/ui/ui-preset.ts:21`) currently treats every http(s) input as a share link and reads its `?preset=` value.

**Required:**
- The rule that separates a share link, a registry item URL and a preset-JSON URL.
- What a fetched preset JSON's `theme` field refers to.
- A negative test for each case.

### 2. Commit slices

Slice 2 combines the shared composition function, the licensed fork, snapshot export, DTCG conversion, import, GitHub export, UI, build, the name check and CI. That is very likely 30 files or more, and it names no gate that proves it. The protocol also asks for one slice per named risk.

**Required:** split slice 2 at least into these four, each with its files and gate:
1. Shared composition function plus script refactor, proved by `tokens:sources:check` producing byte-identical v2 sources.
2. Fork, licence and snapshot/DTCG conversion, proved by byte-for-byte fixture equality and the alpha, float, alias and Theme B controls.
3. Import, GitHub export and UI build, proved by mock Figma API tests and the bundle task.
4. The name check in CI, proved by an unknown-name negative control.

### 3. Gate set

- **Archetype and gate mapping.** The plan lists commands but never maps them to the gate matrix (F-1…F-19, F-CLI-*, `arch:check`). Archetype 6 is the only archetype named. There is no profile or overlay for the browser plugin under `tools/` or for the token package changes.
- **Plugin code is outside every wrapper.** `tools/` is not a workspace member and is excluded from root lint (`deno.json:212`). The fmt wrapper only covers `packages` and `plugins`. The "structured check/test/lint/fmt wrappers" therefore never reach the plugin, yet the brief requires it to be type-checked and unit-tested.
  - **Required:** name the tasks, the Figma typings dependency and lock handling, and the CI job that covers it.
- **CLI file-size cap.** `packages/cli/src/public/features/init/init-command.ts` is already 185 lines, over the 150-line presentation cap (F-CLI-1). No debt entry covers it. Adding `--preset` there deepens the breach, which conflicts with "No new architectural debt is accepted."
  - **Required:** move the option handling into a helper, or record the debt.

## Smaller items to fold into the amendment

- Say how the URL command acceptance serves the modified theme. The transport only fetches http(s), so the test needs something serving it, such as a local HTTP server.
- Document the GitHub token scopes and the Figma manifest `networkAccess` domains in the plugin README.

OPENHANDS_VERDICT: FAIL_PLAN
