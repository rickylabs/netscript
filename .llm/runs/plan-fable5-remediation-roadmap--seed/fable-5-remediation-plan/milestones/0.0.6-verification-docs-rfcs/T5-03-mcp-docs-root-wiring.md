# fix(agent): emitted .mcp.json carries no --docs-root, so the corpus agent init just installed is invisible and search_docs indexes two documents — DRAFT (no GitHub mutation; owner ratification pending)

**Draft-ID:** T5-03 · **Proposed milestone:** 0.0.6 · **Labels:** `type:fix` `area:agentic`
`area:tooling` `area:docs` `priority:p1` `status:triage` · **Depends on:** none

## Summary

`netscript agent init --with-docs` writes an offline documentation bundle into `.netscript/docs/`,
and `netscript agent mcp` accepts a `--docs-root` flag that switches `search_docs` from the embedded
corpus to a filesystem corpus. The host config that `agent init` emits never passes `--docs-root`,
and the MCP server never probes the project for a docs directory, so the bundle the user just
installed is unreachable and `search_docs` / `list_docs` / `get_doc` see two documents: the MCP
package README and `help.md`. This is the plumbing under the measured result that six consecutive
agent runs made zero MCP calls — an agent that tries `search_docs` once and gets two documents will
not try again.

## Evidence

Corpus: `research/repo-audit/mcp-cli.md` §1.3 and §1.6 M1/M2; `research/github-board-open.md` §6.3;
`research/wave-5-6-plans.md` §6 (three-run table: MCP 0/0/0 against curl 41/35/38);
`SYNTHESIS.md` §1.4, §4 T5.

Verified in the worktree at `fac9e339042c`:

1. `packages/mcp/cli.ts:114-121` — the corpus is `FilesystemDocsCorpus` only when
   `options.docsRoot ?? resolveDocsRoot([], Deno.env.get('NETSCRIPT_DOCS_ROOT'), projectRoot)` is
   truthy; otherwise `EmbeddedDocsCorpus` with `[{ slug: 'mcp', source: MCP_PACKAGE_README },
   ...(options.embeddedDocs ?? [])]`.
2. `packages/mcp/cli.ts:82-92` — `resolveDocsRoot` reads only the `--docs-root` argv flag and the
   `NETSCRIPT_DOCS_ROOT` environment variable. It performs no project probing.
3. `packages/cli/src/public/features/agent/mcp/agent-mcp-command.ts:39` — the flag exists:
   `--docs-root <path:string>`, "Public NetScript documentation root", plumbed through
   `AgentMcpInput.docsRoot` (`agent-mcp-input.ts:5`) into `createAgentMcpOptions`
   (`run-agent-mcp.ts:42`).
4. `packages/cli/src/public/features/agent/init/init-agent.ts:94-104` — `--with-docs`
   (`init-agent-command.ts:29`) writes each bundle file to
   `join(input.projectRoot, ".netscript", "docs", path)`.
5. `packages/cli/src/public/features/agent/init/init-agent.ts:226-262` — `writeHostConfig` emits
   `args: ["run", "--config", <projectRoot>/deno.json, "-A", cliSpecifier, "agent", "mcp",
   "--project-root", projectRoot]`. There is no `--docs-root` argument and no
   `env: { NETSCRIPT_DOCS_ROOT }` block, for either the `mcpServers` (`.mcp.json`) or `servers`
   (`.vscode/mcp.json`) key.
6. `packages/cli/src/public/features/agent/mcp/run-agent-mcp.ts:48` — the CLI-hosted server adds
   exactly one embedded document: `{ slug: "help", source: EMBEDDED_SKILL_FILES["help.md"] }`. Total
   default corpus via `agent mcp`: 2 documents. Standalone (`deno x jsr:@netscript/mcp/cli`): 1.
7. The bundle builder exists and is checked in: `.llm/tools/docs/build-agent-docs-bundle.ts`
   (with `build-agent-docs-bundle_test.ts`), consumed through
   `packages/cli/src/public/adapters/agent/deno-agent-docs-generator.ts` (wired at
   `agent-group.ts:21,41`).

## Current surface

- Flag: present on `agent mcp`, honoured by the server, documented nowhere on the golden path.
- Bundle: installed by `agent init --with-docs` at `.netscript/docs/`.
- Config: emitted by `agent init` without the flag or the environment variable.
- Result: two-document corpus for every agent that starts the server from the generated config, with
  no signal to the agent that the corpus is degraded.

## Target contract

1. **`agent init` wires what it installs.** When the offline bundle is written, the emitted host
   configs carry `--docs-root <projectRoot>/.netscript/docs` (or the equivalent `env`
   `NETSCRIPT_DOCS_ROOT`), for every host config it writes.
2. **Auto-detection as the fallback.** `resolveDocsRoot` gains a project probe: with no flag and no
   environment variable, a `<projectRoot>/.netscript/docs` directory that contains at least one
   indexable document is used. Explicit flag beats environment beats probe.
3. **The default corpus is bounded and release-matched.** When no filesystem root resolves, the
   embedded corpus carries a bounded, versioned subset of the published docs rather than one README:
   the golden-path pages needed to answer "how do I get from a contract to a page" — the corpus set
   is enumerated in the issue's implementation PR, is generated (not hand-copied), and carries the
   same framework-version provenance check that the export-surface corpus already enforces
   (`packages/mcp/src/infrastructure/export-surfaces/embedded-export-surface-corpus.ts:46,58-62`
   throws on a version mismatch). A size budget is asserted so the package does not grow unbounded.
4. **Degraded state is observable.** `list_docs` reports the corpus kind (`filesystem` | `embedded`),
   its document count, and the resolved root, so an agent (and a wave run) can see a two-document
   corpus instead of inferring it from bad answers.

## Acceptance

- [ ] `agent init --with-docs` emits host configs containing a `--docs-root` pointing at the
      installed bundle.
- [ ] Every host config `agent init` writes carries the same docs wiring.
- [ ] With no flag and no environment variable, the server resolves `<projectRoot>/.netscript/docs`
      when it exists.
- [ ] Explicit `--docs-root` overrides the environment variable, which overrides auto-detection.
- [ ] The embedded fallback corpus contains the enumerated golden-path document set, generated at
      build time.
- [ ] The embedded corpus carries framework-version provenance and fails closed on mismatch.
- [ ] A size budget for the embedded corpus is asserted in CI.
- [ ] `list_docs` reports corpus kind, resolved root, and document count.
- [ ] Tests cover: bundle installed → filesystem corpus; no bundle → embedded corpus; flag beats
      env beats probe.
- [ ] Negative test: a `.netscript/docs` directory with no indexable documents does not silently
      produce an empty corpus — it falls back to embedded and says so.
- [ ] Negative test: an embedded corpus whose provenance version differs from the package version
      fails to construct.

## Boundaries

- **#1260** owns *which SDK prose* enters the shipped `search_docs` corpus. This issue is the
  **plumbing** — flag wiring, auto-detection, provenance, and observability. The concrete SDK
  document selection is #1260's call; if #1260 lands first, this issue consumes its set.
- **#1201** owns serving the generated export surfaces through MCP. Do not add export-surface
  content here; the corpus in scope is prose.
- **#1102** owns making capability discovery intent-aware. This issue does not change ranking or
  retrieval strategy — `EmbeddedDocsCorpus` stays lexical.
- **#1197** owns re-measuring agent-surface adoption and **#1090** owns observing whether behaviour
  changed. Do not restate the measurement here; this issue is a precondition for it.
- **#1324** owns OpenCode ignoring the generated MCP config; a client that never reads `.mcp.json`
  is not fixed by writing a better `.mcp.json`.
- Not a goal: new MCP tools (`list_generators`, `plan_generation`), or indexing the full
  `docs/site/**` tree into the published package.

## Docs/consumer proof

A fresh `netscript init` + `netscript agent init --with-docs` followed by `search_docs "typed client
for a service"` returns the golden-path page, not the MCP README. `list_docs` on the same project
reports `filesystem` and a document count in the tens or hundreds. The agent-tooling page documents
`--docs-root` and the auto-detection order.

## Provenance

Seed run `plan-fable5-remediation-roadmap--seed`, PR #1347, 2026-08-08. All line citations
re-verified against the worktree at `fac9e339042c`.
