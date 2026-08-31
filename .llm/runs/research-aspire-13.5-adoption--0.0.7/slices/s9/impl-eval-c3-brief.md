You are an INDEPENDENT IMPL-EVAL evaluator in a SEPARATE session from the implementation author
(Codex GPT-5.6 Sol). EVALUATE ONLY — no edits. Do not inherit the author's claims.

## Worktree (read-only)

`/home/agent/projects/netscript/worktrees/007-aspire-s9-eval` — detached at **`29eed9ef9`**.
Prior evaluated head was `042ff3ca5` (cycle-2 `PASS`). **Evaluate the delta `042ff3ca5..29eed9ef9`**,
then judge whether the earlier PASS still stands for the whole slice.

## Why this cycle exists

S9's cycle-2 `PASS` at `042ff3ca5` was recorded **before** its runtime tier had ever executed on CI.
When it finally ran (`scaffold-runtime-sqlite`, run `33404325326`), it returned **`passed=37
failed=1`**:

```
> runtime.aspire-start: Start generated Aspire AppHost
  FAILED 59ms — NotFound: readfile '.../cli-e2e/plugin-smoke-20260831-144641/aspire.config.json'
```

A control at a head **without** S9's gate changes (#1747 `2032d4ed7`) passed the same tier, which is
what assigned ownership to S9. The author then landed `29eed9ef9`
("fix(e2e): bind Aspire config to AppHost workspace").

## What you must verify — execute, do not infer

1. **Is the stated root cause true?** The author claims `aspire.config.json` is written **next to
   `aspire/apphost.mts`** (the AppHost workspace), not at the generated project root. **Verify this
   against the generator itself** (`render-ts-apphost.ts` and the scaffold write path) rather than
   accepting the claim. State the actual emitted path.
2. **Is the repair complete?** The fix passes the config path as `Deno.args[2]` from
   `join(dirname(context.project.appHost), 'aspire.config.json')`. Check **every** script that reads
   it — `ASPIRE_START_SCRIPT`, `ASPIRE_RESTART_SCRIPT`,
   `ASPIRE_TYPED_DB_COMMAND_OR_RESTART_SCRIPT` — and confirm the `database` argument index shift
   (`args[2]` → `args[3]`) is correct **at every call site**, with no other positional argument left
   stale. An off-by-one here would fail only at runtime, which is exactly the class of defect this
   cycle exists to catch.
3. **Is it a real fix, not a bypass?** Confirm the repair does **not** create `aspire.config.json`,
   stub or try/catch the read, skip the gate on any tier, or relax the failure. Confirm it still
   **fails closed** when the config is genuinely absent or malformed.
4. **Is the regression coverage real?** Confirm the added/updated assertions **fail without the
   fix** — prove by mutation (revert the path derivation and show the test goes red). A test that
   merely restates the new argument list is not coverage.
5. **Did the repair damage the rest of S9?** The slice's value is the skills/corpora/Aspire-MCP
   alignment that already earned a PASS. Confirm the `agent.aspire-mcp-smoke` gate, its receipt
   schema, the 15-tool expectation, and the skills/corpora work are unchanged and still sound.
6. **State plainly whether the cycle-2 PASS carries to `29eed9ef9`.**

## Runtime

Do **not** start Aspire, Docker, or any AppHost — host runtime leases are serialized and this is not
your lease. Static analysis, unit tests, and mutation are your instruments; the runtime verdict comes
from CI.

## Output

**[PHASE: IMPL-EVAL] [VERDICT: <PASS|CHANGES_REQUESTED>]**

### Root cause — confirmed or refuted
the actual generator-emitted config path, and how you established it

### Repair completeness
per-script and per-call-site argument audit

### Mutation proof
what you reverted and what went red

### Effect on the rest of S9

### Verdict rationale
3–6 sentences

Under 900 words. Ground every claim in something you executed or read.
