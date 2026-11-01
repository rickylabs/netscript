# PLAN-EVAL

Separate Anthropic Claude Opus 5.5 session; requested and observed model claude-opus-5-5, effort high. Read/Glob/Grep only, MCP disabled, closed stdin through repository agentic print launcher. Same evaluator resumed for round 2. No source edits before PASS.

## Round 1

**PLAN-EVAL for #2374: FAIL_PLAN (2 blockers)**

I read the five run files, the context pack, the saga inspector, the registry generator, the generator entrypoint and the saga scaffolder. I also read `defineSagaConfig`, the plugin's runtime manifest and package config, the host's protocol-2 renderer and generator, the doctor's drift check, and the CLI integration test.

**The approach itself holds up against current code:**
- **Protocol-2 generation:** the host runs the plugin's own `--inspect --inspection-protocol 2` renderer read-only (`--deny-write/run/net/env`). It checks that every reported source file is a project path that exists. A text-only lexer fits inside that sandbox.
- **Doctor parity:** in dry-run, protocol-2 results are tagged as generator-selected with the selected source files (`installed-runtime-registry-generator.ts:128-140`). `checkRuntimeRegistryDrift` compares those paths with the ones the registry actually imports and binds. So a declared entrypoint missing from a stale empty registry shows up as an error. If the renderer fails, the doctor's registry check reports an inspection error (`doctor-plugin-use-case.ts:251-273`), so it fails closed. No host change or new filesystem access in the plugin adapter is needed.
- **Scaffolded projects:** the scaffolder writes `sagas/<stem>.config.ts` with entrypoint `sagas/<stem>-saga.ts`. That is inside the `sagas` scan root, so the union-and-dedupe design keeps the default sample's output unchanged.
- **Test location:** the CLI integration test file already drives protocol-2 generation and dry-run for plugin-sagas, so the planned doctor-parity tests can live there.

**Blockers**

1. **The declaration location contradicts the published docs, so documented declarations would still be silently ignored.**
   - `docs/site/durable-workflows/sagas.md` ("Config-time companion") says to declare sagas in the root `netscript.config.ts`, with entrypoint `./plugins/sagas/order-saga.ts`.
   - The `defineSagaConfig` docstring also says it is for `netscript.config.ts`.
   - Under the plan, a declaration in that file is never scanned, and that entrypoint is outside the `sagas` scan root. Doctor would then pass on a registry that doesn't contain the saga, which is the exact failure #2374 is about.
   - **Fix:** record this in drift.md, then either:
     - add that docs page to the write surface and correct it to the scanned `<root>/<stem>.config.ts` contract, or
     - make generation explicitly report root-config declarations.

     Also file a follow-up for the plugin-sagas-core docstring, which belongs to another package and is deferred.

2. **The worklog says to use `@std/path`, but the plan forbids new dependencies.**
   - `plugins/sagas/deno.json` doesn't declare `@std/path`, and no published sagas source imports it. Only tests do, and they resolve it through the workspace.
   - Importing it in `src/cli/**` would fail publish dry-run and the JSR audit, or quietly add a dependency.
   - **Fix:** either do the path handling with local posix helpers (the generator already has its own `basename`), or record an explicit `@std/path` import addition as drift and run the dependency, lock and JSR-audit gates for it.

**Advisories (not blocking)**
- An aliased `defineSagaConfig` import would be skipped silently. It's cheaper to detect the alias and fail with a message than to defer it without any signal.
- The static export check should handle `export { x as default|saga|definition }`, including the `... from` re-export form. Otherwise it should fail with a clear message rather than a generic rejection.
- Reject duplicate declared ids that point at different entrypoints. The generated `Map` would otherwise silently overwrite one of them.
- The local `ns-sagas` generate/remove/update path calls `generateSagaRegistry` without the manifest's suffix and exclude lists. Conflict checks for excluded declared targets will therefore behave differently from the root path, so cover both in tests or document the difference.

VERDICT: FAIL_PLAN

## Round 2

Round 1's two fixes hold up against the code, and nothing left blocks implementation.

**Blocker 1 (documented root-config form): fixed.**
- Decisions 1–2 now include static `defineSagaConfig` declarations in the root `netscript.config.ts`. They allow runtime paths inside the project but outside the scan roots, which matches the documented `./plugins/sagas/...` form.
- Conventional discovery stays limited by the manifest's scan roots and filename suffixes. So no docs or core-package change is needed.
- Paths outside the scan roots are still checked by the host. For every reported source file, the protocol-2 renderer rejects bad project paths, `.netscript/generated/` paths, symlinks, missing files and duplicates.

**Blocker 2 (`@std/path`): fixed.**
- The shared project-files interface already provides `resolve` (join with the project root) and `relative` (forward slashes), and the plugin's CLI package exports it.
- So no import-map entry or lock change is needed.
- `resolve` won't catch absolute or drive-letter paths, because it is a plain join. The plan rejects those before resolving, so this holds as long as that ordering is kept. Escaping paths show up as a leading `../` after `relative`.

**New test location: acceptable.** A sagas plugin test already imports CLI kernel code by relative path, so there is precedent. Test files are left out of the published package.

**Non-blocking notes for implementation:**
- Duplicate-id rejection and export-list aliases/re-exports are written down only in worklog.md. Add them to plan.md decision 3 so the implementation evaluation has a fixed contract to check against.
- drift.md line 5 still points the tests at the CLI integration test file, and line 7 replaces that. Mark line 5 as replaced so the drift log doesn't contradict itself.
- The root `netscript.config.ts` holds much more than saga declarations. The lexer should handle it without false matches, and a test should cover a realistic root config.
- Reject targets under `.netscript/generated/` in the plugin itself. Otherwise the user only sees the host's generic "invalid source" error.
- The local `ns-sagas` generate/remove/update path and the root protocol-2 path both need tests for root-config and outside-scan-root declarations.

The full `scaffold.runtime` run is deferred to the coordinator, as the owner allowed. It stays unproven until the coordinator reports a verdict for the exact head commit.

VERDICT: PASS