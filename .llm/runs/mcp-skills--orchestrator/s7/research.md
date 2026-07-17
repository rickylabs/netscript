# Research — S7 CLI integration

## Baseline

The mandatory preflight passed: `cac53d66` is an ancestor of HEAD, `skills/manifest.json` exists,
and the worktree is on `feat/netscript-mcp-skills-s7-cli`. The carried design and S5/S6 drift were
re-baselined against this tree.

## Findings

1. `@netscript/mcp` owns all required injection ports and exports them from `mod.ts`. `cli.ts`
   deliberately supplies `StaticCommandCatalog`, `SpawnCommandExecutor`, and `UnwiredProjectDoctor`;
   S7 must compose real CLI-owned implementations without reversing the dependency.
2. `createPublicCommandRegistry()` is the authoritative live top-level catalog. It currently
   contains `db`, `plugin`, and the other public verbs; `CliCommandRegistry.entries()` and
   `program()` provide bounded enumeration/materialization seams. Cliffy descendants can be walked
   only where its public command collection is enumerable; top-level registry entries remain the
   guaranteed catalog.
3. `doctorPlugin()` already returns typed `PluginDoctorReport[]` and is composed through
   `PublicCommandDependencies`. The MCP adapter can map those reports/checks into MCP
   `DoctorCheck[]`; no doctor logic needs duplication.
4. Existing MCP execution defaults to `['deno','run','-A','jsr:@netscript/cli']`. Generated and
   published usage elsewhere uses the same public JSR CLI edge. `.mcp.json` therefore invokes
   `deno run -A jsr:@netscript/cli agent mcp --project-root .`; the project root is resolved to an
   absolute path by the command.
5. The existing asset generator in `.llm/tools/generate-cli-assets-barrel.ts` reads checked-in
   assets at generation time and emits formatted TypeScript string literals. This avoids runtime
   filesystem/import-meta failures for JSR modules. The skill bundle must extend this mechanism,
   producing an embedded map plus a manifest content hash from `skills/**`.
6. `skills/manifest.json` lists three skill files plus itself but contains no hashes. S7 will treat
   the embedded manifest bytes as the authoritative bundle manifest, derive a SHA-256 bundle hash
   from canonical listed path/content pairs, verify it immediately before installation, and expose
   an injectable bundle for the mismatch test.
7. Public docs exist at `docs/site` in source projects. The batteries-included composition uses
   `--docs-root` when supplied, otherwise `<project-root>/docs/site`. It does not assume the
   published CLI package can discover repository-relative docs over a JSR URL; missing corpus is
   reported through existing docs behavior. Installed NetScript docs may be supplied explicitly.
8. Sibling work risk is confined to additive registration in `public-command-tree.ts` and the
   `@netscript/mcp` import-map entry in `packages/cli/deno.json`.

## JSR surface scan

- `@netscript/cli`: metadata/exports already exist; new dependency is workspace/JSR only. Generated
  embedded skill strings must be included under `src/**/*.ts`; no runtime filesystem read may be
  used to find the source bundle. Exported additions require explicit return types and JSDoc.
- `@netscript/mcp`: no public export change is planned. Its generic `cli.ts` remains
  CLI-independent.
- Slow-type risk: CLI has `isolatedDeclarations: false`, so every new exported symbol must carry an
  explicit annotation; both package dry-runs and full-export doc lint are required.
- Permission risk: `agent init` writes project files and `agent mcp` uses env/net/read/run; the
  published binary already runs with `-A`, while command descriptions/tests must make the behavior
  explicit.

## Relevant debt

The CLI has existing Archetype-6 deviations and pending-script gates; this slice must not deepen
them. No new debt is planned. The S5/S6 unwired adapters are intentional cross-slice drift closed by
this work.

## Open questions

None that force implementation rework. Whether future releases embed the full public docs corpus is
safe to defer to S9; S7 accepts an explicit installed docs root and uses project docs by default.
