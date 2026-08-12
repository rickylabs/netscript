use harness

# Slice W2-G — agent-init MCP lock neutrality (#1460)

| Field | Value |
| --- | --- |
| Worktree | `/home/codex/repos/ns006-w2-1460` |
| Branch | `fix/1460-agent-init-mcp-lock-neutrality` |
| Base | `origin/main@3c9dc1f39` |
| Route | Codex · OpenAI · GPT-5.6 Sol · **low** (`light_implementation`) |
| Slice dir | `/home/codex/repos/netscript-006-fixes/.llm/runs/release-0.0.6-fixes--orchestration/slices/w2-g-1460/` |
| PLAN-EVAL | **N/A — fully deterministic.** Expected behaviour and a consumer-proven fix are both stated in the issue. |
| IMPL-EVAL | **Normal automatic**, triggered by draft → ready. Do not request a waiver. |

**Read `/home/codex/repos/netscript-006-fixes/.llm/runs/release-0.0.6-fixes--orchestration/context-pack.md` first** — the lane's hard constraints and its failure class.

## SKILL

- `netscript-harness` · `netscript-cli` (canonical on `netscript agent init` and the generated
  agent surface) · `netscript-deno-toolchain` (lock semantics, `--no-lock`,
  `--minimum-dependency-age`) · `netscript-tools` · `netscript-pr` · `rtk`

## The defect

Merely **starting** the generated MCP server mutates the consumer's `deno.lock`. Observed in a real
consumer migration (EIS-Chat, Deno 2.9.5, Windows): a `+87/−5` delta adding the CLI/MCP/Cliffy
closure and rewriting dependency references, with the lock mtime matching MCP startup and no project
file edited by the client.

`netscript agent init` generates:

```json
{ "command": "deno",
  "args": ["run", "-A", "jsr:@netscript/cli@0.0.5", "agent", "mcp", "--project-root", "."] }
```

**Why it matters:** a read-only documentation or evaluation session dirties the application
worktree and can silently contaminate a migration PR. The governing principle, stated in the issue:
**the CLI is tooling, not a workspace dependency.** This is the same family as #1417 and #1540 — a
read-only-sounding operation mutating a tree — now on the consumer side.

**Consumer-proven workaround**, which is the shape of the fix:

```json
"args": ["run", "--no-lock", "--minimum-dependency-age=0", "-A",
         "jsr:@netscript/cli@0.0.5", "agent", "mcp", "--project-root", "."]
```

The application lock was restored to the exact pre-session blob with those flags.

## What to do

Make the **generated** configuration lock-neutral by construction, so no consumer has to discover
the workaround. Find every place `agent init` emits an MCP server invocation and make the emitted
args carry the neutrality flags.

Think about scope before editing: if `agent init` emits more than one server entry, or if other
generated agent surfaces (skills, docs, other client configs) embed the same invocation, they need
the same treatment. A fix that makes `.mcp.json` neutral while another generated file still emits
the mutating form is a half-fix that will read as complete.

`--minimum-dependency-age=0` is not cosmetic here: a freshly published CLI hits Deno 2.9's ~24h
minimum-dependency-age wall on every `jsr:@netscript/*` resolution for its first day. Note the
related hazard recorded in `netscript-release`: `deno x` re-execs in a **child process that does not
inherit the parent's `--minimum-dependency-age`** (#817). If any generated invocation goes through
`deno x`, the flag will not reach the resolving process — check for that rather than assuming.

## Acceptance (all five verbatim from #1460)

- [ ] Starting the generated MCP server leaves the consumer `deno.lock` byte-identical
- [ ] Proven by execution on a workspace with a committed `deno.lock`: capture the lock's sha256
      before, start the server, stop it, assert the sha256 is unchanged
- [ ] The generated configuration carries the neutrality flags by construction — no consumer-applied
      workaround required
- [ ] Every generated surface that emits the MCP invocation is covered, not only `.mcp.json`
- [ ] A regression check exists so a future change cannot silently reintroduce lock mutation

Box 2 is an **execution** requirement. Box 5's check must be demonstrated **red** before green —
temporarily revert the flags, watch it fail, restore.

## Gates

```
rtk proxy deno task check
rtk proxy deno task test
rtk proxy deno task lint
rtk proxy deno task fmt:check
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx
rtk proxy deno task quality:gate
```

`quality:gate` is **required** — you are touching `packages/**`. Be aware it does **not** cover
`.llm/tools/**` and its PR-gate path has a known stale-base defect (#1564, #1403); it is necessary,
not sufficient. Your own diff scan for `deno-lint-ignore` / `as unknown as` / `@ts-ignore` is what
actually protects this PR — the orchestrator will run one too.

`scaffold.runtime` is **not** part of this slice. Do not start it.

## Hazards

- **`deno fmt` rewraps and can silently undo a scripted edit.** Verify every edit afterwards.
- **Do not commit `deno.lock`**; never `deno cache --reload`.
- Push via explicit refspec — the branch deliberately has no upstream.
- **Do not convert the PR back to draft after marking it ready** — that suppressed every CI job on
  #1539 and cost a full cycle.
- Before flipping draft → ready, **re-sync against `main`** (`git merge origin/main`). A stale base
  breaks automatic evaluator prompt resolution and poisons the quality scan's changed-file range.

## Deliverables

1. The fix on `fix/1460-agent-init-mcp-lock-neutrality`.
2. `slices/w2-g-1460/evidence.md` — every gate command with **real, untruncated** output, the
   before/after lock sha256 proof, and the regression check demonstrated red → green.
3. A **draft PR against `main`** via `netscript-pr`: `Closes #1460` in the **body**; labels
   `type:fix`, `area:cli`, `area:agentic`, `priority:p1`, exactly one `status:`; milestone `0.0.6`;
   the five acceptance boxes reproduced and ticked **only** where truthfully done; and structured
   `acceptance-evidence` using **`box-index:`** keys (exact text matching is brittle against how the
   issue happens to be line-wrapped).
4. Report the PR number. **Do not merge.**

If a gate goes red and you cannot turn it green, write the blocker into `evidence.md` and say so
rather than going quiet.
