**Verdict: PASS** (S4 source slice review; S5's CLI and the S6 final gates are not covered)

The CI name check now covers both NetScript's own repository and the user's theme repository, using the same `assertFigmaTokenNames` checker as the plugin. Required CI runs it even when the classifier skips everything else. I reviewed the code without running anything, so file counts and gate results are as you reported them.

## What I verified

- **`tools/figma-plugin/check-names.ts`**
  - It reads the pinned `packages/fresh-ui/tokens/figma/` snapshot through its `index.json`, with a regex restricting the listed filenames. It then runs `validateFigmaSnapshot` and `assertFigmaTokenNames` on it.
  - Each `--theme` file is parsed as a strict `registry:theme` item with `meta.netscript`. It then goes through `importFigmaTokenBundle`, which re-checks the bundle shape, aliases, snapshot validity, names and modes with the same checker.
  - With no `--theme` argument, it checks a portable item built from the pinned snapshot.
  - `--negative-control` appends an item with an unknown Scheme WEB name. A malformed argument gets a usage error, and any failure prints the message and exits 1.
- **`tests/name-command_test.ts`** runs the real script as a subprocess with the same narrow permissions. It covers:
  - a valid file: exit 0, `pinned variables=2186 portable items=1`;
  - a real file with an unknown WEB name: exit 1, the message names `Scheme/accent/border` and `var(--ns-rejected-by-ci)`;
  - the built-in negative control: exit 1 with its exact message.
- **Root tasks.**
  - `figma:check`, `figma:lint` and `figma:fmt:check` use the structured wrappers with `--root tools/figma-plugin`, and lint/fmt use the plugin's own config. This avoids the `tools/` exclusion in the root config.
  - `figma:test`, `check:figma-names` (only `NODE_ENV` env access) and `figma:build` are explicit.
  - `figma:ci` chains all six.
- **CI.**
  - In the `quality` job, the "Figma plugin and exported token names" step has no `if:` condition. It runs after checkout, setup-deno and release preflight, so PRs that only touch `tools/` and are skipped by path policy still run it.
  - It goes through `run-gate.ts --gate figma-ci`, which maps to `deno task figma:ci` in `.llm/tools/gates/catalog.ts`, and writes a receipt into the uploaded quality artifacts.
  - It runs before `deno install`. That's fine: the workspace doesn't set `nodeModulesDir`, so npm packages resolve on demand against the lock.
- **Theme-repository workflow in the README.**
  - It checks out the theme repo, sets up Deno 2.9.7 (the same as `DENO_VERSION` in ci.yml), and checks NetScript out into `.netscript`.
  - It runs `deno task --cwd .netscript check:figma-names --theme ../themes/studio-utility.json`. The relative path resolves correctly from the task's working directory, and extra arguments are passed through to the script.
  - An unknown or added name fails that PR's check with a message naming the variable's collection and name and its CSS name. This meets the brief's "A PR that adds an unknown name fails with a clear message" for export PRs, which go to the theme repository.
- **The inline zod pin.** Accepting `npm:zod@^4.6.5` in standalone `tools/` scripts is reasonable: the range is identical to the root catalog and the dependency gates pass.

## Non-blocking notes

- The README snippet checks out NetScript `main`. When NetScript's vocabulary changes, theme-repo checks can start failing. The README already says to pin to the plugin's release commit; making the pinned ref the snippet's default would be safer.
- The snippet checks a single hard-coded theme path. A short note on repeating `--theme` for each exported item, or a glob step, would help repositories with several presets.

OPENHANDS_VERDICT: PASS
