use harness

# #1694 / PR #1696 — IMPL-EVAL at the exact head (fresh separate session)

You are the formal **IMPL-EVAL** evaluator for the `ai-request-context` product leaf of the 0.0.7
features lane, dispatched by topic orchestrator `topic-features-0.0.7` under coordinator
`codex-root-0.0.7`. You are a fresh native Claude session, **opposite-family** to the implementation
thread and to the prior OpenHands/DeepSeek evaluator. You did not write this work, you did not write
the earlier verdict, and you must defer to neither.

There is already **one terminal `FAIL_FIX` on this PR**, and it was issued at an **older head**. Your
verdict is the required fresh exact-head verdict. Producing it is the only thing standing between
this leaf and a merge decision, so it must be earned at `414a52ba8`, not inherited.

## Identity to record first

Enable `/remote-control` immediately and record in `evaluate.md`: session ID, non-empty bridge
session ID, Remote Control URL, PID, exact cwd, requested route, observed route. Read the observed
route from your job's `respawnFlags` (`/home/codex/.claude/jobs/<jobId>/state.json`), **not** process
argv — a bg session that claims a spare process carries neither `--model` nor `--effort` on its
command line. Report requested and observed distinctly; claim a match only if they match.

Requested route: **native Claude Fable 5 · medium · Remote Control** (`lane-policy.md`, local
IMPL-EVAL, opposite-family).

## SKILL

Read `AGENTS.md`, then the task-relevant parts of:

- `.agents/skills/netscript-harness/SKILL.md` — the IMPL-EVAL protocol;
  `.llm/harness/evaluator/protocol.md`, `.llm/harness/evaluator/verdict-definitions.md`.
- `.agents/skills/netscript-doctrine/SKILL.md` — **Archetype 2 (core/engine)**, axioms,
  anti-patterns, the ports/adapters layering this change explicitly invokes.
- `.agents/skills/netscript-tools/SKILL.md` — gate evidence, what is a trustworthy verdict source,
  lock hygiene, raw git verification.
- `.agents/skills/netscript-deno-toolchain/SKILL.md` + `.agents/skills/jsr-audit/SKILL.md` — the
  publish bar for `packages/ai`.
- `.agents/skills/netscript-pr/SKILL.md` — closing-keyword law, close-gate, `acceptance-evidence`
  semantics, the single-`status:` law.

## Immutable identity — refuse on mismatch

| Field | Value |
| --- | --- |
| Worktree | `/home/codex/repos/netscript-007-features-1694` |
| Branch | `feat/ai-request-context` |
| Merge base | `c73d361eea14a7f40702638638e492f2ca961a59` |
| **Evaluated head** | **`414a52ba807683cbe87aa25ca07e344f16731b6d`** |
| PR | **#1696**, open, **non-draft**, milestone `0.0.7`, labels `status:impl` / `area:ai-core` / `type:feat` |
| Issue | `Closes #1694` |
| Live `origin/main` | `5bb112dd35f94fc8435672e2cabff1f9a447aa0b` |
| Run dir to create | `.llm/runs/feat-ai-request-context--1694/` |

Resolve local `HEAD`, the explicit remote ref, and the live PR head independently and confirm they
are equal; confirm a clean tree. A head mismatch is a hard refusal, not permission to evaluate a
nearby commit.

Note the branch is **behind** live `main` (merge base `c73d361ee`), yet GitHub reports
`MERGEABLE` / `CLEAN`. Judge whether anything that landed on `main` since the merge base interacts
with this change — a clean textual merge is not the same as a semantically compatible one. If you
find a real interaction, that is a finding; if you find none, say what you checked.

## The true diff — measure it yourself

`git diff c73d361ee 414a52ba8` is **18 files, +709/−30**. Do not use `git diff main..head`; the
branch is behind main and that command reports unrelated reversals. The surface is:

- `packages/ai/src/**` — `contracts/context.ts` (new), `ports/agent-loop.ts`,
  `ports/chat-client.ts`, `ports/tool-registry.ts`, `agent/loop.ts`,
  `adapters/tanstack-chat-client.ts`, `tools/adapters/in-memory-registry.ts`, plus `agent.ts`,
  `tools.ts`, `contracts/mod.ts`
- `packages/ai/tests/request_context_test.ts` — new, 429 lines
- `packages/ai/README.md`, `packages/ai/docs/architecture.md`, `docs/site/reference/ai/index.md`
- `.llm/assets/agent-docs/{prose.json.gz,provenance.json}`,
  `packages/cli/src/kernel/assets/agent-docs.generated.ts`,
  `packages/mcp/src/publish-assets.generated.ts`

## The prior verdict — verify the repair, then evaluate the whole thing

The OpenHands/DeepSeek IMPL-EVAL returned `FAIL_FIX` at head `265dd8760` on **one HIGH finding**: the
`quality` gate step "Agent docs corpus freshness" (`deno task check:agent-docs-prose`) was green at
base and **red at head**, because the PR edited `docs/site/reference/ai/index.md` without
regenerating the committed corpus. Its other two findings were LOW/INFO and non-blocking.

Three commits followed — `8c7c67a05` (regenerate corpus), `c34fe15ec` (re-embed the corpus into the
generated barrel), `414a52ba8` (re-stamp publish-assets provenance).

**Do not accept the repair from the commit messages.** Run `deno task check:agent-docs-prose`
yourself at this head and record its raw output and exit code. Then ask the question the three-commit
shape invites: the corpus regeneration alone was not sufficient — two further generated artifacts had
to be re-stamped. Is the set now **complete and mutually consistent**, or is there a fourth generated
artifact derived from the same source that nobody re-stamped? `packages/cli`'s embedded barrel is
what actually ships to a scaffolded user, so a corpus that is fresh on disk but stale in the barrel
would be a live defect that a green `check:agent-docs-prose` might not catch. Determine which
artifact each gate actually reads.

Then evaluate the substance below on its own merits. A leaf that fixed its one finding is not
thereby correct.

## What to evaluate

### 1. The central claim — "never reaches a provider"

The whole contract is a negative: `RequestContext` is threaded to TanStack `chat({ context,
metadata })` and to tool handlers, and to **nothing that reaches a provider**. A negative invariant is
only as good as the test that tries to violate it.

Read `tests/request_context_test.ts` and determine whether the wire-level tests **can actually
fail** — construct the failure mentally: if someone later added `context` to the provider request
payload, which named test goes red, and how? If the answer is "none directly", say so. Check whether
the invariant holds on **every** path out of `agent/loop.ts`, including retry/continuation turns and
the error path, not only the happy first turn.

The prior evaluator noted the negative wire tests depend on `--allow-env` and suggested hermeticity as
a non-blocking follow-up. Decide for yourself whether that is cosmetic or whether it weakens the
guarantee.

### 2. Layering and the widened `ToolHandler`

`ToolInvocationOptions` was placed in `src/ports/` rather than the tools layer, on the stated
reasoning that the tools slice imports ports and never the reverse. Check that against doctrine and
against the actual import graph rather than the PR body's claim.

`ToolHandler` gained an **optional second parameter**. Verify that every existing `(call) => result`
handler stays assignable, that no `ToolRegistryPort` implementation needs a change, and that the
disclosed incompatibility (assigning a resolved handler to an explicitly narrower one-arg function
type) is both **disclosed** in drift/debt and **pinned by a test**. Judge whether a widened public
function type is the right call versus a new port method, and state what the choice costs.

### 3. The `signal` propagation — in scope or creep?

The PR also propagates the loop's combined abort signal to `AiToolInvocationContext.signal`, arguing
it is the other half of the same never-populated struct. Rule on whether that belongs in this leaf or
should have been separated. If it belongs, is it tested to the same standard as `context`?

### 4. Publish surface — `packages/ai` is publishable

Audit the public export delta per member: `RequestContext`, `ToolInvocationOptions`, and the changed
signatures. Run the raw commands — `deno doc --lint packages/ai/mod.ts` and
`deno publish --dry-run` for `packages/ai` — and record raw output and exit codes, not summaries.
Confirm exact `@netscript/*` pins, isolated declarations, no runtime asset or `import.meta` reads.
`packages/mcp` and `packages/cli` are also touched via generated assets; state whether their publish
surface changed.

### 5. Gate evidence and the close-gate

All exact-head CI is green at `414a52ba8` — I verified `check-test`, `quality`, `code-quality`,
`build`, `close-gate` and `core CI lane visibility` all pass, and that the runs' `headSha` equals the
PR head. Do not re-run CI. **Do** determine whether that set is *sufficient*: is any gate this change
needs simply not in the set, and is `close-gate` passing because the acceptance evidence is real or
because the box arrangement lets it pass? A box ticked without evidence is the **#260** failure this
gate exists to stop. Check #1694's acceptance criteria one by one against what actually shipped, and
say which are discharged, which are not, and whether the PR body claims more than it proved.

Confirm lock hygiene: `deno.lock` is **not** in the diff — verify that rather than trust it.

### 6. Scope

Across `c73d361ee..414a52ba8`: nothing outside the 18 files above, no central cluster state or
`#1348` mutation, no expensive gate run, no issue filed or closed by the author.

## Verdict — and you must commit and push it yourself

Write `evaluate.md` in `.llm/runs/feat-ai-request-context--1694/` containing exactly one of `PASS`,
`FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`. Ground every finding in something checkable — file and
line, raw command output, or a receipt field. Do not pad with praise; a finding a reader cannot
verify is not a finding. Distinguish substantive findings from editorial notes explicitly.

**Your verdict is not terminal until it is an immutable pushed commit.** When `evaluate.md` is
written, you must yourself:

```
git add .llm/runs/feat-ai-request-context--1694/evaluate.md
git commit    # message naming this as the #1696 IMPL-EVAL verdict and your model identity
git push origin HEAD:refs/heads/feat/ai-request-context
```

Then post **one** structured `[PHASE: IMPL-EVAL] [VERDICT: …]` comment on PR #1696 recording the
verdict, the evaluated head, your evaluator commit SHA, and your Remote Control identity. Do not
leave the verdict uncommitted for the supervisor to sign — the supervisor will not sign it, and an
uncommitted verdict is not evidence.

Note that your verdict commit moves the branch head past `414a52ba8`. That is expected and correct;
say so explicitly in your comment so the next reader does not mistake it for a content change, and
confirm the delta is your artifact only.

## Authority — narrow

You may change **only** `.llm/runs/feat-ai-request-context--1694/evaluate.md`, commit it, push it
with the explicit refspec above, and post the one PR comment.

You must **not**: edit `packages/**`, `plugins/**`, `docs/**`, or any generated asset; touch
`deno.lock`; repair any finding you discover; merge; publish; relabel; change milestone; flip
readiness; close or file issues; mutate central cluster state or `#1348`; take an expensive-gate
lease; or run `scaffold.runtime`, `fresh-browser`, Aspire, or Docker. Do not launch another agent.
If you find a defect, report it — do not fix it.

Report the terminal verdict, your evaluator commit SHA, the PR comment URL, and your recorded
attachment identity.
