# Evaluation: PR #1696 — per-request application context (#1694)

**VERDICT: PASS**

Formal IMPL-EVAL, fresh native opposite-family session, dispatched by `topic-features-0.0.7` via
`slices/impl-eval-1696.md`. This is the required exact-head verdict; it supersedes nothing and
inherits nothing from the prior OpenHands/DeepSeek `FAIL_FIX` at `265dd8760`.

## Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-ai-request-context--1694` (run dir created by this evaluation) |
| Target | PR #1696 `feat/ai-request-context`, Closes #1694 |
| Archetype | 2 — core/engine (`packages/ai`, `area:ai-core`) |
| Scope overlays | docs (README, `docs/architecture.md`, `docs/site/reference/ai/index.md`) |
| Evaluator | Claude Fable 5 · medium · 2026-08-29 |

## Attachment identity

| Field | Value |
| --- | --- |
| Session ID | `321b426c-f617-477e-88c0-1f9b9cdb7c50` |
| Bridge session ID | `cse_01UgH3wjzJmy8qB7rBdFHoLm` (`bridgeOutboundOnly: false`) |
| Remote Control URL | `https://claude.ai/code/session_01UgH3wjzJmy8qB7rBdFHoLm` |
| PID | `833541` (`claude bg-spare --bg-spare /tmp/cc-daemon-1000/59093fbc/spare/4cce125f.claim.sock`) |
| cwd | `/home/codex/repos/netscript-007-features-1694` |
| Requested route | native Claude Fable 5 · medium · Remote Control |
| Observed route | `jobs/321b426c/state.json` `respawnFlags`: `--effort medium --permission-mode bypassPermissions --model fable`; process argv carries neither `--model` nor `--effort` (spare-claimed bg session, as the brief predicts) |
| Route verdict | **matched** on model and effort. The Remote Control bridge was established by the launcher (non-empty `bridgeSessionId`); this session has no tool that issues the `/remote-control` slash command itself, so the attachment is the launcher's, not one I re-armed. |

## Immutable identity — verified, not inherited

| Check | Result | Evidence |
| --- | --- | --- |
| local `HEAD` | `414a52ba807683cbe87aa25ca07e344f16731b6d` | `git rev-parse HEAD` |
| `origin/feat/ai-request-context` | `414a52ba80…` (equal) | `git fetch` + `git rev-parse` |
| PR #1696 `headRefOid` | `414a52ba80…` (equal) | `gh pr view 1696 --json headRefOid` |
| Tree | clean (`git status --porcelain` → 0 lines) before and after every gate below | |
| Merge base vs `origin/main` (`5bb112dd3`) | `c73d361eea14a7f40702638638e492f2ca961a59` | `git merge-base` |
| PR state | OPEN, non-draft, `MERGEABLE`/`CLEAN`, milestone `0.0.7`, labels `status:impl` `area:ai-core` `type:feat` (exactly one `status:`) | `gh pr view` |
| True diff `c73d361ee..414a52ba8` | **18 files, +709/−30** — exactly the surface named in the brief, nothing outside it | `git diff --stat` |
| `deno.lock` in diff | **no** | `git diff --name-only … \| grep -c deno.lock` → 0 |

## The prior FAIL_FIX — repair verified at this head, then judged for completeness

| Gate | Command (raw) | Exit | Evidence |
| --- | --- | --- | --- |
| Agent docs corpus freshness | `deno task check:agent-docs-prose` | **0** | `{"fresh":true,"stalePaths":[],"provenance":{…"sourceCommit":"265dd8760"…"sha256":"ed5f72d8…"}}` |
| Embedded barrel (what `packages/cli` ships) | `deno task check:assets-barrel` (regenerates `agent-docs.generated.ts` and 6 siblings, then `git diff --exit-code`) | **0** | tree clean after regeneration |
| Publish assets (`packages/mcp`) | `deno task check:publish-assets` | **0** | `gen:publish-assets --check` clean |

What each gate reads: `check:agent-docs-prose` compares the docs/site corpus against
`.llm/assets/agent-docs/{prose.json.gz,provenance.json}`; `check:assets-barrel` *regenerates*
`packages/cli/src/kernel/assets/agent-docs.generated.ts` from that corpus and fails on any diff — so a
corpus fresh on disk but stale in the barrel *would* be caught, by the second gate not the first;
`check:publish-assets` re-stamps `packages/mcp/src/publish-assets.generated.ts`. Consistency across
the three: the same content hash `ed5f72d8677919e373038fdc14ba97de068ccd0c87e97e6dd65780e78af3f533`,
`uncompressedBytes 4791263`, `compressedBytes 1375904`, `sourceCommit 265dd8760` appear in
`provenance.json` and in `EMBEDDED_AGENT_DOCS_PROVENANCE`; `MCP_EMBEDDED_DOCS_PROVENANCE.sourceCommit`
is `265dd8760`. There is no fourth derived artifact: the `check:assets-barrel` regeneration covers all
seven generated files and left the tree clean. The three-commit repair set is complete and mutually
consistent. `sourceCommit` is `265dd8760` rather than `414a52ba8` because the docs source did not
change in the three repair commits — `fresh:true` is computed from content, so this is correct.

## Substance

### 1. "Never reaches a provider" — can the tests fail?

Verified by mutation in a throwaway worktree at `414a52ba8` (`$CLAUDE_JOB_DIR/tmp/mut`, removed
afterwards; this worktree and the branch were never touched):

| Mutation | Which tests go red |
| --- | --- |
| A — bridge folds `request.context` into `modelOptions` (`tanstack-chat-client.ts:180`) | `never reaches the OpenAI-compatible provider wire request` **FAILED**; `reaches TanStack metadata and none of the provider-bound keys` **FAILED**; `never reaches the Anthropic provider wire request` stays **ok** — the Anthropic adapter drops unknown `modelOptions` keys itself, so that test cannot detect this vector |
| B — **loop** appends `JSON.stringify(input.context)` to `system` (`loop.ts:158`) | **none — 9/9 ok** |
| C — loop stops passing `context` to tool dispatch (`loop.ts:250`) | `hands the run context to a plain tool handler` **FAILED**; `lands the run context on AiToolInvocationContext.metadata` **FAILED** |

Reading of the result:

- The negative invariant is real and non-vacuous **at the adapter boundary**: the `hello` guard
  (`request_context_test.ts:124-127`) proves the captured payload is the chat request, and mutation A
  reds two named tests.
- **Finding S-1 (substantive, non-blocking).** The invariant is *not* guarded above the adapter. A
  future change that serializes the context into `messages`/`system`/`tools`/`options` inside
  `agent/loop.ts` fails no test (mutation B). The loop test `threads the run context into every
  ChatClientRequest` (`:302-321`) asserts `request.context === CONTEXT` but never asserts the
  sentinel is absent from the other four fields of `provider.requests[*]`. At this head the loop
  code is correct by inspection — `loop.ts` has exactly two consumers of `input.context` (`:162`
  the `context:` field, `:250` tool options) and touches no message/system text — so the shipped
  behaviour satisfies the acceptance criterion; the gap is in the regression net, not the product.
  Recommended follow-up: one assertion on `providerBoundPayload`-style JSON of every
  `provider.requests[i]` minus `context`.
- **Every path out of the loop.** There is one `client.stream(...)` call (`loop.ts:156`) inside the
  per-turn loop, so first turn, continuation turns after tool results, and retry turns all pass
  through the same request literal; the test asserts both requests of a two-turn run carry it. The
  error path (`executeToolCall` catch, `:346-353`) returns a tool error result and never touches the
  context. Max-steps and abort exits return before another request. No path bypasses the field.
- **`--allow-env`.** Without it the two wire tests **fail loudly**
  (`AssertionError: … expected at least one outbound request to inspect`, 7 passed / 2 failed) —
  the provider SDKs read env on construction and the guard trips. The dependency is cosmetic: it
  cannot produce a vacuous pass. CI `check-test` runs with `--allow-env`.
- **Client-visible path checked and clear.** In `@tanstack/ai@0.39.0`
  (`dist/esm/activities/chat/index.js`) `metadata` reaches `adapter.chatStream({…, metadata, …})`
  (`:401-410`) and `middlewareCtx.options` (`:347-352`); `context` reaches only the middleware
  context and server-tool execution (`:157`, `:633`, `:765`). No emitted stream chunk carries
  either, so a tenant/auth subject in the context does not reach the browser through the event
  stream. The Anthropic and OpenAI-compatible wire tests confirm the two shipped upstream adapters
  honour the "never forwarded" docstring; `ollama.ts` and `openrouter.ts` are built on the
  OpenAI-compatible provider, so they are covered by the same wire test.

### 2. Layering and the widened `ToolHandler`

- `packages/ai/docs/architecture.md:9` assigns `src/contracts/` the `domain/` role; doctrine
  (`netscript-doctrine` SKILL, layering table) allows `ports/` to import `domain/` only.
  `src/ports/{agent-loop,chat-client,tool-registry}.ts` import only `../contracts/*` —
  `grep -rn "tools/" packages/ai/src/ports/` → no match. `src/tools/{application,adapters}` import
  `../../ports/tool-registry.ts` (`registry.ts:13`, `in-memory-registry.ts:15`). The PR body's
  claim ("tools imports ports, never the reverse") matches the import graph and doctrine.
- Assignability: `tool registry: single-parameter handlers remain assignable` (`:411-429`) pins the
  `(call) => result` case at runtime and at type level (a one-arg lambda registered against the
  widened type). No `ToolRegistryPort` implementation changed; the only external `resolveHandler`
  use is the scaffold E2E string at `packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts:638`,
  which calls the handler with one argument and stays valid. Root `deno task check` in CI
  (`code-quality`, 2927 files) type-checks `packages/fresh`, `packages/plugin-ai-core`, `plugins/ai`
  against the widened ports.
- **Editorial E-1.** The disclosed incompatibility (assigning a resolved handler to an explicitly
  one-parameter function type) is disclosed in the PR body's Drift/Debt section but is **not**
  test-pinned — there is no `@ts-expect-error` in the new test file. The prior evaluator's INFO-3
  ("pinned by a test") was inaccurate. It is not a doctrine violation, so no `arch-debt.md` entry
  is owed; a `// @ts-expect-error` line would make the caveat checkable.
- Judgement on the design: widening the function type is the right call versus a new port method.
  A new method (`resolveHandlerWithContext`) would have forced every registry implementation to
  grow, and left two handler shapes to keep coherent. The cost is the narrowing case above, which
  no first-party call site exercises.

### 3. `signal` propagation — in scope

`AiToolInvocationContext.signal` was the other declared-but-never-populated field of the same
struct the issue is about; populating it is 1 line in `loop.ts:249` and 1 in
`in-memory-registry.ts:49`, additive, and the same defect class. Separating it would have been
ceremony, not clarity. **Editorial E-2:** it is tested to a lower standard than `context` — both
tests assert only `seen.signal instanceof AbortSignal` (`:343`, `:385`), not that it is the run's
combined signal nor that aborting the run aborts the handler. Non-blocking; a follow-up abort test
would close it.

### 4. Publish surface — `packages/ai`

| Check | Command (raw) | Exit | Evidence |
| --- | --- | --- | --- |
| Package publish bar | `cd packages/ai && deno publish --dry-run --allow-dirty` | **0** | `Success Dry run complete` |
| `deno doc --lint packages/ai/mod.ts` | | **1** | `Found 26 documentation lint errors` (`private-type-ref`, e.g. `ModelHandle["descriptor"]` → `ModelDescriptor` at `src/contracts/model.ts:72`) |
| Same command at merge base `c73d361ee` (throwaway worktree) | | **1** | 26 errors; the `error[…]`/`-->` line set is **byte-identical** (`diff` → `IDENTICAL doc-lint error set`) |
| `deno test --allow-all packages/ai/tests/` | | **0** | `ok \| 147 passed \| 0 failed` |
| `deno task arch:check` | | **0** | warnings only, none in `packages/ai` |

Export delta per member: `RequestContext` (type, new; `./contracts`, `./agent`, `./tools`),
`ToolInvocationOptions` (interface, new; `./agent`, `./tools`, `./ports` via `tool-registry.ts`),
`AgentLoopInput.context?`, `ChatClientRequest.context?`, `ToolHandler` second optional parameter.
All additive and optional; `isolatedDeclarations` satisfied (dry-run is the 0-slow-types bar). No
runtime asset or `import.meta` reads added. `@netscript/*` pins unchanged (no `deno.json` in the
diff). **The 26 doc-lint errors are pre-existing and not introduced or deepened by this PR**; the
package's declared publish bar is `publish:dry-run`, which passes. Recorded here so no later reader
mistakes them for this leaf's.

`packages/cli` and `packages/mcp`: only the string constants inside `agent-docs.generated.ts`
(base64 corpus + provenance fields) and `publish-assets.generated.ts` (`sourceCommit`) changed. No
export names or types changed; their publish surface is unchanged in shape, changed in embedded
content only.

### 5. Gate evidence, sufficiency, close-gate

- Exact-head CI at `414a52ba8`: `build`, `check-test`, `close-gate`, `code-quality`, `core CI lane
  visibility` all `pass` (`gh pr checks 1696`); the `quality` job's three corpus gates are the ones
  I re-ran locally above (all exit 0). Not re-run in CI, per the brief.
- **Sufficiency.** The gates this change needs are: type-check + lint + fmt of the workspace
  (`code-quality`), the package test suite including the new file (`check-test`), the generated
  asset chain (`quality`), the package publish bar (`publish:dry-run`, verified locally) and the
  close-gate. All present. `scaffold.runtime` / `e2e:cli` are **not** required: no scaffold
  template, plugin scaffolding, DB wiring, or Aspire helper changed; the CLI barrel delta is the
  runtime docs corpus, not scaffold output.
- **Close-gate is real, not arranged.** #1694 acceptance, checked one by one against the diff:
  (1) `AgentLoopInput.context` / `ChatClientRequest.context` — `ports/agent-loop.ts:50`,
  `ports/chat-client.ts:67` ✔; (2) bridge forwards to `chat({ context, metadata })` —
  `tanstack-chat-client.ts:188-189` ✔; (3) tool handler can read it — `loop.ts:248-251` →
  `in-memory-registry.ts:49-53` → `AiToolInvocationContext.metadata` ✔, mutation C proves the
  tests guard it; (4) never reaches a provider wire request, proven by test — ✔ at the adapter
  boundary (mutation A), with the loop-layer caveat S-1; the PR's "mutation-checked" claim holds
  for the OpenAI-compatible wire test and the seam test, **not** for the Anthropic wire test
  (see mutation A); (5) existing handlers stay assignable — ✔ test at `:411`. All five `gate:`
  boxes correspond to gates that are green at this head. The PR DoD is fully ticked and every box
  has evidence I could reproduce. No #260-shaped box.
- **Lock hygiene:** `deno.lock` not in the diff (verified above).

### 6. Behind `main` — interaction check

`c73d361ee..origin/main` is 4 commits: `cf648f1ff` (package quality gates honest, #1663),
`3b32d1628` (lint/fmt fail-closed exclusions, #1710), `211e82579` (harness docs), `5bb112dd3`
(RFC-5 doc). None touches `packages/ai`, `packages/plugin-ai-core`, `plugins/ai`, or
`packages/fresh` (`git diff --name-only` filtered → only root `deno.json`). The two gate commits
change exclusion handling in `.llm/tools/run-deno-{lint,fmt}.ts` and root `deno.json`. I ran
**`main`'s** versions of both wrappers (extracted via `git archive origin/main .llm/tools`) against
this head's `packages/ai`: lint `exitCode 0`, 100 files, 0 findings; fmt check 100 files, 0
findings. No semantic interaction found; the textual `CLEAN` merge is also a semantic one.

### 7. Scope

Diff is exactly the 18 files in the brief. No `.llm/runs/release-*`, no
`milestone-cluster-state.json`, no `#1348` artefact, no issue filed or closed by the author, no
expensive-gate receipt in the diff. `deno.lock` untouched.

## Process verification

| Check | Result | Evidence |
| --- | --- | --- |
| Plan-Gate / `PLAN-EVAL: N/A` recorded before implementation | **FINDING P-1** | No `.llm/runs/feat-ai-request-context--1694/` existed before this evaluation; no `plan.md`, `worklog.md`, `drift.md`, `supervisor.md` for this leaf. The orchestration run records PLAN-EVAL decisions only for #1502. |
| Design section in worklog | see P-1 | The design content lives in PR #1696's body (Scope / three design notes / Drift-Debt) and #1694's "Suggested shape". |
| Each slice has a passing gate | PASS | 5 commits; CI green at head; corpus repair commits each verified by a gate above |
| No speculative seams | PASS | every new export is consumed (`RequestContext` by 3 ports, `ToolInvocationOptions` by loop + registry) |
| Debt registry | PASS | no doctrine violation introduced; nothing to record. The 26 pre-existing doc-lint errors have no `arch-debt.md` entry, but they predate this leaf. |

**P-1 is a process finding owned by the topic orchestrator, not the author, and does not change the
verdict**: the brief itself designates this run dir as created at IMPL-EVAL, the leaf's plan and
drift content is checkable in the PR body, and there is no author commit that would add evidence
beyond copying it. The orchestrator should record `PLAN-EVAL: N/A` with rationale for this leaf in
the orchestration run's `supervisor.md` so the next reader does not have to reconstruct it.

## Anti-pattern check (scope-limited)

| AP | Status | Evidence |
| --- | --- | --- |
| Layering (ports → tools) | CLEAR | import graph above |
| Reinvented helper | CLEAR | wraps TanStack's own `context`/`metadata` seams; no local carrier |
| Upstream type leak | CLEAR | `RequestContext` is an owned `Readonly<Record<string, unknown>>`; no `@tanstack/ai` type in the public delta |
| Documented-but-dead field | CLEAR | the PR closes one (`AiToolInvocationContext.metadata`/`signal`) |

## Findings summary

Substantive (non-blocking, follow-up):

- **S-1** — no test guards the loop layer against serializing `context` into provider-bound request
  fields (mutation B survives 9/9). Product is correct at this head by inspection.

Editorial:

- **E-1** — narrower-annotation incompatibility disclosed but not `@ts-expect-error`-pinned; prior
  INFO-3 over-stated this.
- **E-2** — `signal` propagation tested for type only, not identity/abort.
- **E-3** — PR body is stale in two places: "the working tree is the 14 files listed above" (now
  18), and the mutation-check claim does not hold for the Anthropic wire test.
- **E-4** — `deno doc --lint packages/ai/mod.ts` has 26 pre-existing errors, identical at base;
  outside this leaf.

Process:

- **P-1** — no leaf run artifacts / PLAN-EVAL record before implementation; orchestrator-owned.

## Verdict

**PASS.** Scope complete against #1694's five acceptance criteria; every required static, fitness,
runtime and consumer gate is green with raw exit codes recorded above; the prior HIGH finding is
repaired and the generated-asset set is complete and mutually consistent; no doctrine violation
introduced; no `deno.lock` churn; no interaction with what landed on `main`. The findings above are
follow-ups, none is a false-done state.

This verdict commit moves `feat/ai-request-context` past `414a52ba8`; the delta is this one file.
