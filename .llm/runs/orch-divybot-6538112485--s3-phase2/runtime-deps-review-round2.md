PASS (slice 7c0 corrective round: runtime dependency metadata only)

The `render-ui` blocker is fixed, and I found no new blockers in the correction.

- **`render-ui` is back to its frozen dependencies** (`jsr:@netscript/ai@0.0.8` and `npm:preact@^10.29.2`, `registry.json:3909-3912`).
  - `LEGACY_RUNTIME_DEPENDENCY_REPAIRS` now holds only `command-palette`, which genuinely imports the runtime.
  - Its negative test now removes only the AI dependency and must fail.
  - `registry.json` declares the Fresh UI root dependency exactly seven times, matching the seven real users.
- **The scanner now uses the compiler's module graph.** `importsRuntime` runs `deno info --json --frozen` with the repo config and reads only the entry module's direct dependency specifiers, so comments and quoted examples can't count as imports.
  - Each source is resolved once and cached.
  - A test module containing JSDoc, block comments with `import`/`export`/dynamic `import()` lines, a line comment and a quoted import string must come out as a non-user.
- **The check works both ways.** Each item's Fresh UI package declarations must equal exactly the current root dependency if any of its copied sources imports the runtime, or nothing otherwise. Negative tests cover a user with no declaration and a non-user with one.
- **Unchanged:** the frozen legacy fixture, the other negative tests and the gaps-install proof (start with no aliases, check the installer adds the root mapping, then add local prerelease aliases).

Non-blocking: the scan now starts one `deno info` process per distinct copied TS/TSX source. That's fine at today's registry size. If test time ever becomes a problem, you could batch them through a single entry module.
