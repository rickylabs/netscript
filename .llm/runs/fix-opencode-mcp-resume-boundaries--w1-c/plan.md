# Plan: OpenCode MCP attachment and provider-valid resume

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-opencode-mcp-resume-boundaries--w1-c` |
| Branch | `fix/opencode-mcp-resume-boundaries` |
| Phase | `plan-eval` |
| Target | internal agentic OpenCode tooling |
| Archetype | N/A — not a published package/plugin or product CLI |
| Scope overlays | none |

## Archetype and doctrine

Archetype 6 was reviewed because the surface is tooling, but its normative `packages/<cli-pkg>`
shape and JSR/public-binary gates do not apply to checked-in `.llm/tools/agentic` infrastructure.
The applicable authority is the agentic runtime contract: typed identities, centralized volatile
configuration, credential isolation, one-writer ownership, and exact-head evidence. Package
doctrine verdict and package anti-pattern codes are therefore N/A.

## Goal

Attach the current project's generated NetScript/Aspire MCP servers to every OpenCode child,
fail closed with a real pre-code MCP receipt when measurement requires them, and ensure every
provider dispatch receives non-empty, tool-semantics-preserving assistant history.

## Scope

- Typed discovery, validation, translation, and deterministic overlay of root `.mcp.json`.
- A provider-boundary OpenCode plugin for history normalization and privacy-safe telemetry.
- `--session`, receipt, and MCP-required preflight options on the canonical OpenCode launcher.
- Config/history/preflight/telemetry fixture matrices and focused runtime tests.
- Agentic README/task documentation and harness/live acceptance receipts.

## Non-Scope

- No CLI `agent init` generation change: it already emits the authoritative NetScript/Aspire data.
- No model, endpoint, provider, tool-version, or route-policy literal outside existing config files.
- No OpenCode upstream database mutation, fork, patch, or version bump.
- No package/plugin surface, scaffold output, Billing Run, canary, publish, release, merge, or
  ready-for-review transition.

## Hidden Scope

- Hybrid OpenCode workers use `clearEnv`; attachment must reuse the shared preparation contract
  without broadening credential inheritance.
- Web and non-interactive launches must load the same guard so dispatch protection is not limited to
  a single CLI path.
- Available tool count and MCP call count are different telemetry facts.
- Compaction invokes the same experimental transform; normalization must be idempotent.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Discover the nearest `.mcp.json` from the explicit/inherited working directory, stopping at the project/git boundary. | Supports subdirectory launch while preventing unrelated ancestor config attachment. |
| D2 | Strictly translate Claude stdio entries to OpenCode local entries; malformed declarations fail rather than being skipped. | Silent partial attachment invalidates measured runs. |
| D3 | Merge into existing `OPENCODE_CONFIG_CONTENT` and let OpenCode apply that narrow overlay after inherited `OPENCODE_CONFIG`; project MCP names win collisions, unrelated settings survive. | Preserves provider, model, permission, and credentials without copying an external config file. |
| D4 | Install one checked-in local plugin through the overlay and normalize raw `{info,parts}` immediately before OpenCode's provider conversion. Never mutate stored session history. | The exact pinned hook runs before every dispatch and preserves UI/storage recovery evidence. |
| D5 | Drop empty unsigned text/reasoning fragments; retain non-empty text/reasoning and all tool parts/order; drop assistant events that become structurally empty; reject empty fragments adjacent to signed reasoning. | Produces provider-valid history while preserving tool-call/result semantics and provider signatures. |
| D6 | Unsafe normalization errors expose only a bounded local event id and reason code. Telemetry records ids, counts, category, and reason—never prompts, message bodies, tool input/output, secrets, config, or paths. | Meets validation observability without privacy leakage. |
| D7 | MCP-required preflight starts a loopback OpenCode server, checks MCP status and exact tool ids, then executes a harmless NetScript documentation search directly through the debug tool seam before the product prompt. | Proves attachment and use independently of model compliance, with available count separate from call count. |
| D8 | Read current OpenCode route rows from `CANONICAL_ROUTE_POLICY` for acceptance; do not restate route/model values in launcher-local code. | Keeps volatile policy in its single authority. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Exact empty-fragment rule | resolved now | Whitespace-only unsigned text/reasoning is empty; signed-reasoning adjacency is unsafe. |
| MCP collision precedence | resolved now | Current project wins same-name MCP collision; all other external config remains. |
| Preflight transport | resolved now | Loopback server enumeration plus direct debug tool execution. |
| Future OpenCode V2 plugin migration | safe to defer | Pinned 1.17.20 is the owned contract; a version change must update guard fixtures. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Experimental hook shape changes | Pin exact 1.17.20 contract with fixture/type tests and keep tool version centralized. |
| JSONC/custom config is reparsed incorrectly | Never parse external `OPENCODE_CONFIG`; only parse owned JSON `.mcp.json` and optional inline JSON content. |
| Secrets leak through receipts/errors | Central safe receipt schema; no arbitrary values, bodies, paths, args, outputs, or config serialization. |
| Tool semantics are damaged | Preserve every tool part/object and array position; matrix asserts identity/order. |
| Server port/resource leak | Loopback-only child, bounded startup timeout, process-group cleanup in `finally`, no foreign cleanup. |
| Preflight passes on server names but no tools | Require connected status and expected prefixed tool ids; execute one NetScript docs tool. |
| Provider route drifts during implementation | Query canonical policy at exact head immediately before live matrix and record requested/observed identity. |

## Fitness and Validation Gates

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Focused tests | `deno test --no-lock -A .llm/tools/agentic/opencode .llm/tools/agentic/claude/hybrid-opencode-adapter_test.ts` | exit 0; full fixture matrices pass |
| 2 | Agentic exact-head suite | `deno test --no-lock -A .llm/tools/agentic/` | exit 0 |
| 3 | Scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/agentic --ext ts,tsx` | exit 0 |
| 4 | Scoped lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .llm/tools/agentic --ext ts,tsx` | exit 0 |
| 5 | Scoped format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .llm/tools/agentic --ext ts,tsx` | exit 0 |
| 6 | Volatile-config guard | focused `config/no-hardcoded-volatile_test.ts` and routing tests within agentic suite | exit 0 |
| 7 | Docs | README/task examples plus focused doc/link inspection | commands and claims match implementation |
| 8 | Live MCP | real generated project; MCP-required OpenCode preflight + measured turn | connected NetScript/Aspire, non-zero NetScript tools/calls |
| 9 | Live resume route matrix | same OpenCode session resumed over every current OpenCode policy row | no empty assistant reaches OpenRouter; real response succeeds |
| 10 | Exact-head/lock | raw git SHA/status/remote checks and `sha256sum deno.lock` | pushed SHA exact; lock hash unchanged |
| 11 | Independent IMPL-EVAL | checked-in local DeepSeek evaluator route | PASS once; no repeat |
| 12 | Review threads/CI | agentic review-thread and PR-check tools | no unanswered current thread; current-head CI truth reported |

## Commit Slices

1. **S0 Plan/design bootstrap** — proves current live scope and locked boundary choices. Gate:
   PLAN-EVAL. Files: this run directory only.
2. **S1 MCP attachment/preflight/telemetry contracts** — proves deterministic config matrices,
   isolation, expected tools, harmless lookup, and discovery-source receipts. Gates: focused tests,
   scoped wrappers, agentic suite. Files: `.llm/tools/agentic/opencode/**`, hybrid adapter/tests,
   `deno.json`, agentic README, run artifacts.
3. **S2 Provider-valid resume boundary** — proves all history fixtures, provider switch, repeated
   resume, unsafe identity-only failure, and canonical `--session` dispatch. Same focused/static
   gates. Files: OpenCode boundary plugin/run/tests, README, run artifacts.
4. **S3 Exact-head live acceptance and evaluation evidence** — proves real MCP use, real route
   resume, full gates, receipts, and independent verdict. Files: run evidence/artifacts only unless
   a current-head failure requires a reviewed source fix.

## Arch-Debt Implications

- None expected. If the pinned experimental hook cannot safely represent a live fixture, stop with
  `FAIL_RESCOPE`/drift rather than recording hidden debt or mutating OpenCode storage.

## Drift Watch

- Live issue acceptance/comments, OpenCode policy row count, pinned tool version/hook shape,
  provider access, exact `origin/main`, protected lock hash, and any required surface outside the
  owned agentic tooling paths.
