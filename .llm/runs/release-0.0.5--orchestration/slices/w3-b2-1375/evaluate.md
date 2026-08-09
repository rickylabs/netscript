# IMPL-EVAL — release-0.0.5--orchestration/slices/w3-b2-1375

- Evaluator session: Claude · Fable 5 · medium, fresh native session, 2026-08-09 — canonical
  opposite-family route (`formal_impl_evaluation`, evaluates=openai); separate from the
  Codex · GPT-5.6 Sol generator session.
- Run: `release-0.0.5--orchestration/slices/w3-b2-1375` (issue #1375, PR #1401,
  branch `fix/agent-mcp-docs-root`, baseline `origin/main@aa8e151e6`, head `5f59b6a7c`).
- Surface / archetype: `@netscript/cli` agent init/mcp + `@netscript/mcp` docs corpus —
  Archetype 6 CLI/Tooling; scope overlay: docs.
- Method: read-only against `origin/fix/agent-mcp-docs-root`; independent re-execution in an
  isolated scratchpad clone (`--shared`) at head `5f59b6a7c`, at the S1 test-only commit
  `0c4f910e3`, at pre-repair `66e27713a`, and at baseline `aa8e151e6`. The live worktrees
  (`ns005-w3a/w3b2/w3b3`) were not entered.

## Verdict

`PASS`

## Independently executed evidence

| Check | Command (scratchpad clone) | Result |
| --- | --- | --- |
| Head focused MCP/generator | `deno test -A --no-lock packages/mcp/tests/{docs,registry,release-embedded-docs-corpus}_test.ts .llm/tools/generate-publish-assets_test.ts` | exit 0, **29 passed, 0 failed** — matches claim |
| Head focused CLI init | `deno test -A --no-lock packages/cli/src/public/features/agent/init/init-agent_test.ts` | exit 0, **19 passed** (48 combined) — matches claim |
| S1 RED, CLI init at `0c4f910e3` | same command | exit 1, **16 passed / 3 FAILED** — decisive stdio test fails with `installed corpus result missing: {"count":2,"matches":[{"slug":"mcp",…},{"slug":"help",…}]}` — the exact pre-fix two-document corpus |
| S1 RED, MCP docs/registry at `0c4f910e3` | same commands | exit 1: docs 14/3 FAILED, registry 4/1 FAILED — matches the S1 comment numbers exactly; all failures are assertion failures, none setup errors |
| S1 is test-only | `git diff --stat base 0c4f910e3 -- packages` | only 3 `_test.ts` files changed; product source identical to baseline |
| Publish-asset freshness | `deno task check:publish-assets` at head | exit 0 |
| MCP quality scan | `scan-code-quality.ts --root packages/mcp/src` at head | exit 0, `findings:[]`, `allowCount:0` — matches claim |
| Doctrine base vs head | `check-doctrine.ts --root packages/mcp` at `base` and `impl` | both exit 1; reports **byte-identical** (F-16 ×2, A9, A14) — the #1403-assigned findings are genuinely pre-existing, none introduced here |
| A8 regression real and repaired | doctrine at `66e27713a`: `WARN A8/AP-1/F-1: file is 305 lines (cap 300) (src/domain/tool-contracts.ts)`; line counts 298 (base) → 304/305 (`66e27713a`) → 299 (head) | the owned regression was genuinely in this slice's changed lines and is genuinely gone at head |
| Scoped lint MCP | lint wrapper `--config packages/mcp/deno.json` | 105 files, 0 occurrences — matches |
| Scoped fmt MCP | fmt wrapper `--config packages/mcp/deno.json` | 105 files, 0 findings — matches (without `--config` the wrapper fails on workspace config, mirroring the lane's disclosed non-verdict setup failure) |
| Lock hygiene | `git diff origin/main origin/fix/agent-mcp-docs-root -- deno.lock \| wc -c` | **0** — empty as claimed |
| Gate integrity | diff-wide grep for `deno-lint-ignore`, `as unknown as`, `@ts-ignore`, `@ts-expect-error`, `any` | zero new occurrences outside `.llm/runs/**`; the only `any` matches are English prose inside the regenerated README string asset |
| Budget consistency | grep `256_000|256000` across packages/tools/docs | no residue; single constant `MCP_EMBEDDED_DOCS_MAX_BYTES = 262_144` (= 256 KiB), shipped provenance `sourceBytes: 79292`, generator throws over budget, CI runs `check:publish-assets` (`.github/workflows/ci.yml:295`) which executes `buildMcpEmbeddedDocs` in `--check` mode — PLAN-EVAL F3 is resolved in the 262,144 direction everywhere |
| Review threads | `gh api repos/rickylabs/netscript/pulls/1401/comments` | 0 review comments; all 9 issue comments read |

## The decisive proof (question 1)

`generated project search_docs reaches its installed corpus after host restart`
(`packages/cli/src/public/features/agent/init/init-agent_test.ts`) is a **real process**: it runs
`initAgent` against a temp project, reads the emitted `.mcp.json`, and spawns
`Deno.Command(Deno.execPath(), { args, cwd: projectRoot, stdin/stdout piped })` with the generated
args verbatim except two documented substitutions (`args[2]` → workspace `deno.json`, `args[4]` →
local `bin/netscript.ts`, so local source runs instead of the published JSR CLI); `--project-root`
and `--docs-root` are the generated values. It speaks JSON-RPC `tools/call` over stdio and asserts
`pages/services-sdk/services` in `structuredContent.matches`, then asserts the full `list_docs`
result including `corpus: {kind: "filesystem", root: <project>/.netscript/docs, documentCount: 2}`.
It can fail and did: at `0c4f910e3` (product = baseline) I reproduced the failure with the corpus
containing exactly `mcp` + `help` — the defect #1375 describes.

## Precedence (question 2)

The PLAN-EVAL trap is genuinely exercised. `runMcpStdioServer` (head `packages/mcp/cli.ts:103-104`)
now passes `Deno.env.get('NETSCRIPT_DOCS_ROOT')` into `resolveDocsRoot` before pre-resolving, so
env is consulted at the same stage as the probe. The test
`stdio composition preserves environment precedence over an indexable probe` spawns the real
`cli.ts` as a subprocess with `cwd` = a project whose `.netscript/docs/probe.md` **is** indexable
and `NETSCRIPT_DOCS_ROOT` set to a different root, and asserts the filesystem root resolved is the
env root (`documentCount: 1`) — env-over-probe through the actual composition edge, not an isolated
resolver assertion. Flag-over-env and probe-when-nothing are covered by the resolver matrix in
`docs_test.ts` (temp dir with a real indexable probe candidate). Flag-over-env is unit-level only;
the flag path through the real composition is separately proven by the decisive test.

## Embedded fallback, provenance, budget, observability (question 3)

- Fallback is generated, not hand-copied: `MCP_EMBEDDED_DOC_PATHS` (5 golden-path pages) in
  `.llm/tools/generate-publish-assets.ts`, materialized into
  `packages/mcp/src/publish-assets.generated.ts` as `MCP_EMBEDDED_DOCS` +
  `MCP_EMBEDDED_DOCS_PROVENANCE` `{schemaVersion:1, frameworkVersion:'0.0.4',
  sourceCommit:'d6265fa52', paths, sourceBytes:79292, documentCount:5, sha256}`.
- `ReleaseEmbeddedDocsCorpus` validates provenance synchronously at construction (schema version,
  framework version, path/cardinality, byte count) and verifies the SHA-256 lazily before first
  list/search/get; both negatives executed green at head and are real discriminators (fixture with
  wrong version → constructor throw with the exact message; wrong hash → rejected before listing).
- Budget: `79_292 <= 262_144` asserted in `generate-publish-assets_test.ts` and enforced by a throw
  inside `buildMcpEmbeddedDocs`, which CI executes via `check:publish-assets`. No `256_000`
  anywhere.
- Observability: `corpus: {kind, root, documentCount}` is in the live `list_docs`
  `structuredContent` (asserted for filesystem with resolved root and for embedded with
  `root: null`) and required in `TOOL_OUTPUT_SCHEMAS.list_docs` (registry test asserts the exact
  schema and `assertThrows` on a malformed root). `documentCount` is total-indexed, distinct from
  the preserved post-limit `count` (asserted: `count: 1` with `documentCount: 3`).

## Negatives fail for their own reasons (question 4)

- Empty probe: `.netscript/docs` containing only `README.txt` (non-Markdown) and a
  redirect-front-matter `redirect.md` → `isIndexableDocsRoot` walks only `.md`, and
  `processDocsSources` canonicalizes the redirect away to zero documents → probe returns false →
  embedded corpus with `corpus.kind: 'embedded'` asserted. If a naive exists-only probe shipped,
  `FilesystemDocsCorpus` throws `DocsCorpusUnavailableError` → structured error, no `corpus` field →
  the assertion fails. Real discriminator.
- Version mismatch: synchronous constructor throw, message asserted against
  `MCP_PACKAGE_VERSION`.
- Integrity mismatch: async fail-closed before listing, message asserted.
All three executed green at head in my clone; the S1 ancestors of the metadata assertions failed at
`0c4f910e3` as assertion failures.

## Gate-coverage separation (the #1403 disclosure) — honest in both directions

- Findings pushed to #1403 are pre-existing: doctrine reports at `base` and `impl` are
  byte-identical (diff empty), both exit 1, containing exactly the disclosed F-16 (src/domain 14
  children, src/application/flows 16), A9 informational, and A14 in
  `tests/service-endpoint-sources_test.ts` (empty diff vs `origin/main`). Nothing introduced here
  was reassigned to #1403.
- The owned A8 regression was genuinely this slice's: `tool-contracts.ts` 298 lines at base, the
  A8 warning fires at `66e27713a` (tool: 305 lines, cap 300), gone at head (299). Repair re-proved:
  registry 5/5 and fmt 1 file/0 findings both re-executed by me indirectly via the head suite runs.
- #1403 is filed, OPEN, p0. Neither aggregate is claimed as MCP proof anywhere in the PR body,
  ledger, or comments.

## Separability from #1376 (question 6)

PR #1400 (`fix/mcp-execute-command-host-cli`) is still OPEN — not merged. This diff contains no
change to `execute_command`, `SpawnCommandExecutor`, `DEFAULT_CLI_COMMAND`, `list_commands`
identity, receipt wrapping, or `run-agent-mcp.ts` (grep over the full diff: the only matches are
run-artifact prose naming the boundary and unmodified prose inside the regenerated README string).
The `packages/mcp/cli.ts` diff is confined to docs imports, `resolveDocsRoot`, corpus selection,
and the `createDocsFlows(docsCorpus, docsSelection)` hunk; `packages/mcp/README.md` hunks are
docs-corpus-only. The second-to-merge rebase/regenerate rule is recorded in the live PR body.

## Other checks

- **#1197 correctly unclaimed** — PR body closes only #1375; comments state #1197's post-publish
  measured run is outside this PR.
- **Close-gate** — `Closes #1375` present in the PR body; all eleven rows have linked evidence;
  no `gate:` checkbox on #1375; exactly one `status:` label (`status:impl-eval`) on both PR and
  issue; milestone 0.0.5.
- **Process** — PLAN-EVAL `PASS` recorded before implementation; F1–F4 verifiably incorporated
  (F1: overlap named in PR body; F2: S1 REDs use only existing imports and all failed as
  assertions; F3: 262,144 everywhere; F4: 166 in drift.md). Design checkpoint present in
  `worklog.md`; per-slice commit trail with PR comments complete; drift.md carries both drift
  entries. Debt not deepened: no export-map key change (`packages/mcp/deno.json`/`mod.ts` diff
  empty), `ReleaseEmbeddedDocsCorpus` internal-only.
- **Serialized runtime** — not independently re-runnable (single granted token, expensive gate);
  accepted on recorded evidence: raw exit 0, `passed=78 failed=0 skipped=2` with only the two
  #1398 deferrals, bracketed by pre/post leak-checks (exit 0, foreign `redis-jfgcbtaf` correctly
  left untouched), token released after exactly one run.

## Findings (by severity — none verdict-flipping)

**FI-1 — Low. `createDocsFlows` selection is optional while the published schema requires
`corpus`.** Evidence: `packages/mcp/src/application/flows/docs-flows.ts:21-23` (`selection?`)
spreads `corpus` only when `selection` is passed, but `tool-contracts.ts:209-226` marks `corpus`
required in `TOOL_OUTPUT_SCHEMAS.list_docs`. The only composition (`cli.ts:143`) always passes it
and `createDocsFlows` is not exported from `mod.ts`, so no consumer emits a schema-violating result
today — but the seam permits one. Tighten (make `selection` required or default it) on the next
touch of the flows map, e.g. when the #1376 second-to-merge rebase passes through it.

**FI-2 — Info. Line-count numeric slip in the A8 narrative.** PR comment `9fa37c9a7` and
`s4-gates.md` say the file was "raised to 304"; the doctrine tool's own report at `66e27713a` says
305 (cap 300) — `wc -l` vs the tool's counting. The regression, ownership, and repair are all real;
only the cited number differs from the tool's report. Correct on next artifact touch.

**FI-3 — Info. The decisive stdio test alone no longer isolates host-arg wiring post-fix.** With
the probe now shipping, deleting `--docs-root` from the generated args would leave that test green
(probe resolves the same directory). Row 1 remains independently proven by the exact
`args.slice(-2)` assertions in three host tests, which failed at S1 — keep those assertions if the
stdio test is ever refactored.

## Row-by-row: the eleven #1375 acceptance rows

| # | Live row | Verdict | Evidence |
| --- | --- | --- | --- |
| 1 | `--with-docs` emits `--docs-root` at the installed bundle | **PROVEN** | `init-agent.ts` wiring; `.mcp.json` args assertion; RED at `0c4f910e3` reproduced by me |
| 2 | Every host config carries the same wiring | **PROVEN** | Claude/VS Code/Zed same-root test executed green; all three emitters take `installedDocsRoot` |
| 3 | No flag/env → `<projectRoot>/.netscript/docs` resolves | **PROVEN** | resolver probe (`cli.ts:94-96` + `isIndexableDocsRoot`); precedence-matrix third assertion; composed probe path exercised by the empty-probe negative |
| 4 | Flag > env > probe | **PROVEN** | resolver matrix + real-subprocess env-over-probe test (the PLAN-EVAL trap, exercised not asserted) |
| 5 | Enumerated golden-path fallback, generated at build time | **PROVEN** | `MCP_EMBEDDED_DOC_PATHS` → generated `MCP_EMBEDDED_DOCS`; slug-list test executed green |
| 6 | Provenance fails closed on mismatch | **PROVEN** | synchronous constructor validation + executed negative |
| 7 | Size budget asserted in CI | **PROVEN** | `79_292 <= 262_144` test + generator throw reached by `check:publish-assets` in `ci.yml:295`; number consistent everywhere |
| 8 | `list_docs` reports kind/root/count | **PROVEN** | live results (filesystem + embedded `root: null`) + required output schema; executed green |
| 9 | fs/embedded/precedence test matrix | **PROVEN** | bundle→filesystem (decisive stdio), no-bundle→embedded, flag/env/probe rows all executed |
| 10 | Empty docs dir → observable embedded fallback | **PROVEN** | redirect + non-Markdown negative executed; discriminates against a naive exists-probe |
| 11 | Provenance-version mismatch fails construction | **PROVEN** | executed synchronous negative with exact message |

None deferred; the all-eleven claim survives adversarial re-execution.
