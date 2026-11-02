# Independent implementation review

Requested native Opus5/xhigh through the repository launcher. Observed model Opus5; independent
Anthropic session from the OpenAI implementer and separate from the plan reviewer. Primary Muse
routes failed availability preflight; the declared feature fallback was used.

## IMPL-EVAL verdict: **PASS** — commit `f4b03a9` (issue #2581 / PR #2590)

No blocking findings. Zero introduced regressions found. Review-only; I mutated no repository files (the single untracked path, `.llm/runs/feat-ai-mcp-service-discovery--2581/validation.md`, is the implementation session's). Note: `623d911 docs(ai): refresh shipped MCP discovery documentation` (the derived carriers) landed mid-review; I verified carrier freshness at that head.

### Independently reproduced proof

| Gate | Result |
|---|---|
| `plugins/ai/` full suite | 43 passed / 0 failed (incl. 5 new tests + installed-consumer fixture, 3 s) |
| `packages/ai/tests/mcp_test.ts` | 20 passed |
| `packages/cli/.../workspace-mutator_test.ts` | 23 passed → **43+20+23 = 86**, matching the claim |
| `run-deno-check.ts --root plugins/ai` | 42 files, 0 occurrences |
| `deno lint` / `deno fmt --check` on changed TS | clean |
| `docs:accuracy` | PASS (215 published source pages, 286 corpus files) |
| `check:emitted-samples`, `check:publish-assets`, `check:mcp-export-corpus`, `arch:check` | all exit 0, no repo mutation |
| `deno publish --dry-run` (plugins/ai) | Success; no `*.test.ts` in the published file list |

### The specific items you asked me to review

1. **Generated discovery import** — `getServiceUrl(serviceName, protocol='http', index=0): string` at `packages/sdk/src/discovery/service-url.ts:125`, exported as `"./discovery"` in `packages/sdk/deno.json:13`. Missing value throws the SDK diagnostic naming service + `services__<name>__<protocol>__0`. No fallback port, probe, or registration anywhere in the emitted source.
2. **URL/stdio compatibility** — I diffed the baseline (`6766130`) and new emitters directly: output is **byte-identical** for all four URL/stdio × auth combinations. The only other change is the registry guard `if (!MCP_SERVER_IDS.length)`, which is *required*, not cosmetic — I reproduced TS2367 on `("docs" as const tuple).length === 0`, so this also repairs an existing defect in every generated registry that had ≥1 server.
3. **Strict options / no-write** — `addMcpServer` calls `emitMcpServer` before `writeTextFile` (`plugins/ai/src/cli/ai-project.ts:95-99`), so every rejection precedes I/O; the new test proves 21 invalid flag shapes leave both an empty and a pre-populated workspace untouched.
4. **Path/URL safety** — my own battery of 21 paths: every accepted path preserves the discovered origin (`/..;/x`, `/%252f`, `/a%2e%2e/b`, `/İ` accepted, origin intact); `//evil.test`, `/\evil`, `/./x`, `/x/..`, `/%2fhost`, `%00`, raw control/whitespace, `\u2028`, query and fragment all rejected. All interpolation goes through `JSON.stringify`, and `id`/`service` are regex-constrained, so the generated source is injection-safe.
5. **Auth semantics** — `headersForAuth` (`packages/ai/src/mcp/application/auth.ts:10-14`) sends the raw token as `Authorization` when no `scheme`, so the docs' "include `Bearer `" instruction is correct; the fixture asserts the exact header on *every* request.
6. **Both install modes** — `@netscript/sdk` was genuinely absent from the base scaffold's `jsrImports`, `PLUGIN_SERVICE_BOOTSTRAP_IMPORTS`, `PLUGIN_SERVICE_SOURCE_IMPORTS` and `PLUGIN_KIND_ROOT_IMPORTS.ai`, so the one-line seam is necessary and minimal. JSR mode resolves the emitted subpath via the bare alias; local-source gets no pin and resolves the copied `sdk` member (`SCAFFOLD_WORKSPACE_PACKAGES`). I also empirically confirmed that a nested `ai/deno.json` (preact-only imports) does **not** shadow root import-map inheritance for files under `ai/` — the mechanism the root-alias strategy depends on.
7. **Real HTTP MCP** — ran it: one `initialize`, `notifications/initialized`, `tools/list`, one `tools/call`; all requests hit `/api/mcp` (explicit path correctly replaces the discovered base's `/discovery-base/`) with the auth header; call params exactly `{name:'lookup-order', arguments:{id:42}}`. HTTPS variant proves `__https__0` selection and the no-fallback failure. Clean under default op/resource sanitizers.
8. **Scope** — plugin CLI/generator, the one established import-map seam + its guard, docs, tests, run artifacts. No app MCP server/framework, no init/scaffold assets, no Northwind. The `--mcp` doc correction is factually right: `install-plugin.ts:150,570` → `plugins/ai/scaffold.ts` → `mcpToolScaffolder` emits `ai/tools/skill-loader.ts`; the old "Not implemented" row was stale.

### Non-blocking findings (existing vs introduced)

- **A — existing, now reachable in service mode.** Generator rejections escape as a thrown `TypeError` instead of `{code:1,message}`: `mcp add orders --service=orders-mcp --path=/..` exits non-zero with a Deno stack trace rather than a clean usage line. Nothing is written. Same pattern as `addProvider`/`assertId`. One-line fix: wrap the two `addMcpServer` calls in `plugins/ai/src/cli/ai-commands.ts:74-96`.
- **B — existing.** `mcp add registry --url=…` silently overwrites `ai/mcp/registry.ts`, returns code 0, then regenerates the registry without that server (reproduced: `list` → `["docs"]` only). `validateInput` (`mcp-server.ts:52`) is now the natural home for rejecting the reserved id.
- **C — existing.** `--dryRun` is ignored by `mcp`/`model`/`provider`; `addMcpServer` writes regardless of `context.dryRun` (`ai-project.ts:95`).
- **D — existing, newly documented surface.** A missing `--auth` variable yields `Authorization: ''` → an opaque 401 instead of a diagnostic; the new docs explain the missing-discovery failure but not this one (`mcp-server.ts:25-29`).
- **E — proof caveat, not a defect.** The installed-consumer type-check runs with `--config <repoRoot>/deno.json` and `useLocalWorkspaceImports` maps every `@netscript/*` export by file URL, so that fixture does not exercise consumer-side resolution. JSR-mode resolution of the emitted `@netscript/sdk/discovery` rests on the completeness guard plus established bare-alias subpath behavior — same risk class as the already-shipped `@netscript/ai/mcp`, with real proof owned by the post-publish smoke. Correctly framed as fixture proof, not provider proof.
- **F — test strength, minor.** `mcp-commands.test.ts` collapses thrown `TypeError`s and clean code-1 results into one assertion, so a regression turning a clean validation into an exception would pass.

### Merge-readiness preconditions (outside this commit)

Root/CI and one full `scaffold.runtime --cleanup` at final head; the 16 export doc-lint findings are baseline-matched per the run log (I did not re-run that lint). Carriers are committed and fresh at `623d911`.

## Disposition

No blocking findings. A-D predate this change and remain follow-up scope; this leaf preserves
URL/stdio/auth behavior. E is explicitly bounded fixture evidence, with the existing both-mode
import guard and post-publish production smoke owning published resolution. F is intentional
acceptance of both existing error surfaces while asserting failure and no writes; no weakening
of the negative controls. No current review thread is unanswered.
