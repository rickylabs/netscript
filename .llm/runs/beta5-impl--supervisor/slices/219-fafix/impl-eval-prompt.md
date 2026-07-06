use harness

## SKILL

Read these repo skills first (under `.agents/skills/<name>/SKILL.md`):
- `netscript-harness` — IMPL-EVAL protocol (`.llm/harness/evaluator/protocol.md`, verdict definitions)
- `netscript-doctrine` — public-surface law for `@netscript/fresh`
- `deno-fresh` — the `@netscript/fresh` surface under evaluation
- `netscript-tools` — scoped validation wrappers, gate-evidence rules, lock hygiene
- `rtk` — prefix read-heavy git/grep with `rtk`

## Role

You are the **IMPL-EVAL evaluator** (single loop) for draft PR #488
(`fix/219-fresh-ai-proxy`, head `a46e75cc`) in rickylabs/netscript. You are a separate
session from the generator; do not trust its claims — re-verify.

## What the PR must prove

Issue context: `Refs #219` (NOT closing). The `@netscript/fresh/ai` seams (FA1
`createNetScriptChatConnection`, FA2 chat-stream proxy) were unadoptable by the real
consumer (eis-chat): hardcoded `/ai/chat` subpath and a decode-time crash on durable-stream
responses whose plain-JSON bodies are mislabeled `content-encoding: gzip`.

Evaluate these criteria:

1. **streamPath override** — FA1 + FA2 accept a static prefix string OR a per-request
   full-path resolver function; default stays `/ai/chat` and default behavior is
   backward-compatible. Probe: double session-id append, trailing slash, URL-encoding,
   query preservation.
2. **Gzip-mislabel defense is complete** — `Accept-Encoding: identity` is forced on ALL
   upstream reads: FA2 proxy AND FA1 SSR seed materialization AND FA1 live
   subscribe/resume (`resolveChatHeaders` must override caller-supplied gzip/br). Regression
   tests exist for proxy, SSR-seed, and live-read mislabel scenarios and genuinely fail
   without the fix (verify at least one by reverting the relevant lines locally — do NOT
   commit the revert).
3. **NetScriptVitePlugin assignability** — the package-owned structural type keeps
   `packages/fresh` doc-lint at exit 0 AND `createNetScriptVitePlugin()` type-checks in
   `defineConfig({ plugins: [...] })` against real Vite `Plugin`/`PluginOption`; a
   compile-level contract test covers this.
4. **Adversarial caveats closed** — the two CAVEATS in the `[PHASE: ADVERSARIAL-REVIEW]`
   comment are each mapped to fix commit `a46e75cc` and actually fixed.
5. **Consumer acceptance** — trace concretely that eis-chat's per-session subpath
   (`/eischat/sessions/{id}/messages`) + mislabeled-gzip upstream can be handled by these
   APIs without app-level workarounds.

## Validation to run yourself

```
deno test --allow-all packages/fresh/src/runtime/ai/create-chat-connection_test.ts packages/fresh/src/runtime/ai/stream-proxy_test.ts packages/fresh/src/application/vite/vite.test.ts
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/fresh --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/fresh --ext ts,tsx
deno task --cwd packages/fresh test
deno task --cwd packages/fresh doc-lint
```

## Constraints

- Lock hygiene: do NOT commit `deno.lock` churn or source changes. Evaluation is
  read+run only; your deliverable is the verdict comment (and summary file if the runner
  produces one).
- Single eval loop: one verdict, no re-dispatch.
- PR body must use `Refs #219`, not a closing keyword — flag if wrong.

## Verdict

Post the formal verdict PR comment EARLY with `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or
`FAIL_DEBT` per `.llm/harness/evaluator/verdict-definitions.md`, criterion-by-criterion
evidence, and the exact commands you ran with results.
