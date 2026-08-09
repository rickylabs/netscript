# PLAN-EVAL — release-0.0.5--orchestration/slices/w3-b2-1375

- Plan evaluator session: Claude · Fable 5 · medium, fresh native session, 2026-08-09 (separate from the Codex · GPT-5.6 Sol generator session)
- Run: `release-0.0.5--orchestration/slices/w3-b2-1375` (issue #1375, draft PR #1401, branch `fix/agent-mcp-docs-root`, baseline `origin/main@aa8e151e6`)
- Surface / archetype: `@netscript/cli` agent init/mcp + `@netscript/mcp` docs corpus — Archetype 6 CLI/Tooling
- Scope overlays: docs

## Verdict

`PASS`

## Question-by-question results

### 1. All eleven acceptance rows vs the narrow framing — COVERED

Fetched the live body (`gh issue view 1375 --repo rickylabs/netscript`, 2026-08-09). The plan has
not inherited the narrow "`writeHostConfig` plus a probe plus tests" framing; `research.md` names
that summary incomplete and `plan.md` quotes all eleven rows verbatim (checked word-for-word against
the live body). Row-by-row ownership:

| Live row | Owning slice |
| --- | --- |
| 1. `--with-docs` emits `--docs-root` in host configs | S1 RED + S3 |
| 2. Every host config carries the same wiring | S1 + S3 (Claude `.mcp.json`, VS Code `.vscode/mcp.json`, Zed `.zed/settings.json` — LD-1 explicitly widens beyond the issue's two JSON shapes to the third existing emitter, verified real at `init-agent.ts` `writeZedConfig`) |
| 3. No flag/env → `<projectRoot>/.netscript/docs` resolves | S1 + S2 |
| 4. Flag > env > auto-detection | S1 + S2 (LD-2) |
| 5. Generated enumerated golden-path fallback | S1 + S2 (LD-5) |
| 6. Version provenance fails closed | S1 + S2 (LD-6/LD-7) |
| 7. Size budget asserted in CI | S1 + S2 (LD-6, `check:publish-assets` + focused test) |
| 8. `list_docs` kind/root/count | S1 + S2 (LD-4) |
| 9. fs/embedded/precedence test matrix | S1 + S2/S3 |
| 10. Negative: empty docs dir → embedded, observably | S1 + S2 |
| 11. Negative: provenance mismatch fails to construct | S1 + S2 (see finding F2) |

No row is dropped or weakened; the plan states all eleven fit one PR and withholds the closing
keyword until evidenced (pr-body.md).

### 2. Can the proposed tests fail? — YES, behaviorally, with one staging caveat (F2)

Pre-fix states verified against `origin/main@aa8e151e6`:

- **Host wiring RED**: `writeHostConfig` (`packages/cli/src/public/features/agent/init/init-agent.ts`,
  `netscript` server args block) emits `["run","--config",…,"agent","mcp","--project-root",root]`
  with no `--docs-root` and no `env`; `writeZedConfig` likewise. An assertion on emitted JSON args
  fails behaviorally, exit non-zero.
- **Real stdio RED**: `packages/mcp/cli.ts` `createMcpCliServer` selects `EmbeddedDocsCorpus` with
  `[{slug:'mcp',…}]` + `help.md` when `options.docsRoot ?? resolveDocsRoot(...)` is falsy, and
  `resolveDocsRoot` (cli.ts, flag/env only, no probe) never probes. A `search_docs` for a unique
  installed-only phrase over the real spawned CLI (the existing JSON-RPC spawn helper at
  `init-agent_test.ts` `listToolsAfterHostRestart`, verified at lines ~695-734) fails behaviorally.
- **`list_docs` metadata RED**: current flow returns only `{count, docs}`
  (`packages/mcp/src/application/flows/docs-flows.ts`); asserting `value.corpus` fails behaviorally.
  LD-4's claim that `count` means post-`limit` rows is true (`.slice(0, limit)` then
  `count: docs.length`), so the backward-compat framing is sound.
- **Empty-probe negative can fail post-fix**: `FilesystemDocsCorpus.#refresh` throws
  `DocsCorpusUnavailableError` when zero sources index (verified,
  `filesystem-docs-corpus.ts`), so a naive exists-only probe would surface a structured error
  instead of embedded fallback and the test would fail — the negative is a real discriminator, not
  decoration.
- **Provenance-mismatch negative can fail post-fix**: mirrors the verified
  `EmbeddedExportSurfaceCorpus.#decode` throw on `frameworkVersion !== MCP_PACKAGE_VERSION`
  (`embedded-export-surface-corpus.ts`); feeding a mismatched provenance and expecting a synchronous
  throw fails if the check is omitted. This is a check that exists as a proven pattern in the tree —
  unlike the sibling slice's failed version-equality gate, nothing here asserts a gate that does not
  exist.

Caveat is finding F2 below: the *S1* RED for rows 5/6/11 references modules and exports that do not
yet exist, and a static import of a nonexistent module fails at resolution/type-check — a "setup
error" by the plan's own S1 standard.

### 3. Load-bearing research claims — TRUE (one numeric slip, F4)

Every spot-checked claim opened and confirmed at baseline:

- Three host emitters, none passing `--docs-root` — TRUE (`init-agent.ts`).
- `resolveDocsRoot` synchronous, flag > env only, no probe — TRUE (`packages/mcp/cli.ts`).
- `FilesystemDocsCorpus` throws `DocsCorpusUnavailableError` on missing root and on zero indexed
  documents — TRUE.
- `list_docs` has no corpus identity — TRUE (`docs-flows.ts`, `tool-contracts.ts:211`).
- Default corpus = 2 docs via `agent mcp` (README + `help.md` from `run-agent-mcp.ts:48`), 1
  standalone — TRUE.
- `.llm/assets/agent-docs/prose.json.gz` exists, ~1.15 MiB compressed; **all five LD-5 paths
  present** (`pages/quickstart/index.md`, `pages/explanation/contracts/index.md`,
  `pages/services-sdk/services/index.md`, `pages/web-layer/builders/index.md`,
  `pages/web-layer/route/index.md` — verified by decompressing the archive). Five-page source total
  is 79,292 bytes, comfortably inside the budget with the README added.
- Export-surface corpus validates schema/version/bytes/hash and throws on framework-version drift —
  TRUE (`embedded-export-surface-corpus.ts`).
- `MCP_PACKAGE_VERSION` exists in `publish-assets.generated.ts`; `check:publish-assets`,
  `quality:gate`, `arch:check`, `doc:lint` (accepts `--root`/`--pretty`), `publish:dry-run`,
  `e2e:cli` tasks all exist in root `deno.json`.
- `docs/site/ai/agent-tooling.md` currently documents flag/env only and says "one document under
  the `mcp` slug" — TRUE (lines ~100, 135-141), so the planned doc updates are genuinely stale-fixing.
- #1260 is OPEN at milestone 0.0.6 — TRUE (`gh issue view 1260`).

### 4. Precedence — DEFINED AND TESTABLE

LD-2 locks flag > `NETSCRIPT_DOCS_ROOT` > indexable probe > embedded, with invalid explicit/env
roots remaining structured errors (matching current `docs_corpus_not_found` behavior) and only
absent/empty probes degrading. The S1/S2 matrix tests each ordering behaviorally. One implementation
trap worth carrying into S2: `runMcpStdioServer` currently pre-resolves
`options.docsRoot ?? resolveDocsRoot(Deno.args, undefined, projectRoot)` and passes the result down
as `docsRoot`, where it beats env inside `createMcpCliServer` — a probe naively placed there would
invert env > probe. The planned "flag beats env beats probe" behavioral test is exactly the guard
that catches this; it must include the env-set-plus-probe-present row.

### 5. Observability — REAL

`corpus: {kind, root, documentCount}` lands in the live `list_docs` tool result and in
`TOOL_OUTPUT_SCHEMAS.list_docs`, agent-inspectable per call, with `root: null` explicit for
embedded and `documentCount` meaning total indexed (distinct from the preserved post-limit
`count`). Not log-only. Satisfies the issue's degraded-state requirement.

### 6. Separability from #1376 — HONORED AT SYMBOL LEVEL; shared-file overlap understated (F1)

The plan touches neither `run-agent-mcp.ts` nor `execute_command`, `SpawnCommandExecutor`,
`DEFAULT_CLI_COMMAND`, `list_commands` identity, nor receipt wrapping; the no-touch claim is
feasible because `runAgentMcp` already passes `projectRoot`/`docsRoot` into
`runMcpStdioServer`/`createMcpCliServer`, so probe and fallback land entirely in `packages/mcp`.
But the declared conflict boundary is narrower than reality: I fetched
`fix/mcp-execute-command-host-cli`, and the w3-b3 plan's S2 and S4 both edit `packages/mcp/cli.ts`
(standalone policy selection; receipt wrapping in the flows map) and S4 edits
`packages/mcp/README.md` — the same two files this plan edits in its S2/S3, with the
`createDocsFlows(docsCorpus)` hunk sitting inside the flows map w3-b3's receipt work touches. See F1.

### 7. Gates and scope — CORRECT

Named: focused tests with raw exit codes; scoped wrappers `--ext ts,tsx` with `--no-lock` /
`--unstable-kv`; `quality:gate` (which includes `arch:check`) plus an explicit `arch:check`;
`doc:lint` for both packages; JSR audits; `publish:dry-run`; lock-hygiene raw diff;
review-threads reporter; `scaffold.runtime` strictly behind an `EXPENSIVE-GATE-REQUEST` token with
leak-check bracketing. #1197's observational row is explicitly unclaimed (Deferred scope). The three
accepted debts (`cli/maintainer-mode-mixing`, `cli/no-permissions-doc`, `MCP-A6-V2-SHAPE`) are named
and preserved: no export-map change, no permission change, new MCP code stays in the accepted
horizontal shape, no maintainer imports.

## Findings (by severity; none verdict-flipping)

**F1 — Low/Medium. #1376 concurrent-edit surface understated in the risk register.**
Evidence: `git diff --stat origin/main origin/fix/mcp-execute-command-host-cli` +
`w3-b3-1376/plan.md` slice table — w3-b3 S2/S4 list `packages/mcp/cli.ts` and S4 lists
`packages/mcp/README.md`; this plan's S2 lists `packages/mcp/cli.ts` and S3 lists
`packages/mcp/README.md` and regenerates the README-embedding `publish-assets.generated.ts`. The
risk-register mitigation "Do not touch `run-agent-mcp.ts` or its named symbols" avoids the symbol
conflict but not the textual one.
Required change: before S2, record (drift note or risk-register amendment) the shared-file overlap
on `packages/mcp/cli.ts` and `packages/mcp/README.md`; confine `cli.ts` edits to the docs-corpus
selection and `createDocsFlows` hunks; whichever PR merges second rebases and re-runs
`deno task check:publish-assets` so the regenerated README asset stays fresh.

**F2 — Low. S1 RED staging for rows 5/6/11 cannot fail behaviorally via static imports.**
Evidence: `release-embedded-docs-corpus.ts` and the docs-provenance exports of
`publish-assets.generated.ts` do not exist at baseline; a RED test that statically imports them
fails at module resolution/type-check — a "setup error" under the plan's own S1 gate wording
("must fail for the intended missing fields/results—not setup errors").
Required change: in S1, express those REDs as runtime feature-detection against existing modules
(e.g. dynamic import + assertion that the provenance exports/corpus metadata are present, and a
`list_docs` call asserting `value.corpus`), and let the mismatched-provenance constructor test be
introduced in S2 with its fail-capability proven by mutation (mismatched version → expects throw).
No design change required; this is test mechanics the plan's own standard already forces.

**F3 — Low. Budget figure inconsistency.**
Evidence: `plan.md` LD-6 says "256 KiB" (262,144 bytes); `worklog.md` Design says
`MCP_EMBEDDED_DOCS_MAX_BYTES = 256_000`.
Required change: pick one number and use it in the constant, the generator ceiling, and the test.
Either passes comfortably: the five selected pages total 79,292 source bytes (measured from the
decompressed archive).

**F4 — Info. Research finding 7 says the release docs artifact "contains 171 files"; both
`provenance.json` and the decompressed `prose.json.gz` carry 166.**
Not load-bearing — the LD-5 selection and budget were verified directly — but correct it on the
next research touch.

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | `research.md` re-baselined at `aa8e151e6`, 2026-08-09; findings 1-11 spot-checked true against the tree (F4 numeric slip noted) |
| Decisions locked                        | PASS   | LD-1…LD-8 with rationale, `plan.md` |
| Open-decision sweep                     | PASS   | Five entries, all resolved/rejected; evaluator sweep found no additional rework-forcing decision (probe placement is resolved by LD-2/LD-3 + the composition-edge note; F1/F2 are coordination/test mechanics, not design rework) |
| Commit slices (< 30, gate + files each) | PASS   | Four ordered slices, each with claim, proving gate, files |
| Risk register                           | PASS   | Nine risks with mitigations; #1376 mitigation must be amended per F1 |
| Gate set selected                       | PASS   | Focused/scoped/quality/arch/doc-lint/JSR/publish-dry-run/review-threads + serialized `scaffold.runtime` by token only; all named tasks verified to exist in root `deno.json` |
| Deferred scope explicit                 | PASS   | #1260 (0.0.6, verified), #1197 unclaimed, orchestrator retains merge/canary authority |
| jsr-audit surface scan (pkg/plugin)     | PASS   | `research.md` "JSR-audit planned-surface scan": no export-map change, no import attributes/runtime asset reads, explicit-annotation and freshness risks named |

## Verdict

`PASS`

Implementation may begin. Apply F1 (declare the `packages/mcp/cli.ts` / `README.md` co-edit with
#1376 and the rebase/regenerate rule) and F2 (S1 RED via dynamic feature-detection, constructor
negative in S2) before or in S1; F3 before the constant lands; F4 on next research touch.
