You are an INDEPENDENT IMPL-EVAL evaluator, in a SEPARATE session from the implementation author
(Codex GPT-5.6 Sol). Do not inherit or restate the author's claims. EVALUATE ONLY — no edits.

## Worktree (read-only)

`/home/agent/projects/netscript/worktrees/007-eval-slot2` — detached at `fe87dd2cc`.
Base `main`; evaluate `git diff origin/main..HEAD`.

## Slice

**#1732 / PR #1747** — "fix(aspire): validate background reference names". Base `main`, not stacked.

## CRITICAL CONTEXT — a prior PASS on this PR is VOID

An earlier IMPL-EVAL passed this PR, and an audit later proved the then-current head emitted
**non-parsing JavaScript**. Rendering the generator with processors named `class` / `await` and a
quote-bearing `Workdir` produced:

```
const class = builder.addExecutable("class", 'deno', class_workdir, [...]);   // INVALID JS
const await_workdir = resolveWorkspacePath(appHostDir, 'a'b');                // BROKEN LITERAL
```

Root causes: `safeIdentifier()` only replaced hyphens (no reserved-word guard) once the binding was
derived from the resource name; and `JSON.stringify` was applied to the name argument but **not** to
`Workdir` / `Entrypoint` / `ConcurrencyEnvVar`.

**The prior evaluation missed this because it reasoned about the code instead of rendering it.**
Do not repeat that. **Render the generator and inspect the emitted source.** A string-matching
assertion would also have missed `const class` — parse or type-check what is emitted.

## Required verification (execute, do not infer)

1. Render `generateRegisterBackground` with hostile inputs — reserved words (`class`, `await`,
   `function`, `const`, `return`), names colliding after normalization (`a-b` vs `a_b`), and
   `Workdir`/`Entrypoint`/`ConcurrencyEnvVar` containing single quotes, double quotes, backslashes,
   backticks, `${}` sequences, and newlines. **Confirm the output is valid, parseable JavaScript in
   every case** and that no user string escapes its literal.
2. Confirm the emitted binding identifier is **generated (ordinal)**, never user-derived, so reserved
   words and collisions are structurally impossible rather than filtered.
3. Confirm `JSON.stringify` (or equivalent) is applied to **every** user-supplied string emitted into
   generated source — not just the resource name.
4. Confirm the direct-generator **reserved/collision tests exist and would actually fail** if the
   ordinal binding were reverted to a name-derived one.
5. Confirm the users+sagas fixture union in `prepare-flow-b-fixture.ts` still works with the ordinal
   binding — its discovery must capture the binding generically, not assume a naming style.
6. Confirm the diff contains **no deletions of other slices' `.llm/runs/` artifacts** (an earlier head
   deleted ~74 such files belonging to 8 unrelated slices).

## Runtime

Host runtime is parked by an upstream Aspire constraint (microsoft/aspire#14878). Rendering the
generator in-process is **not** runtime — do that. Do not start Aspire or Docker.

## Output

**[PHASE: IMPL-EVAL] [VERDICT: <PASS|CHANGES_REQUESTED>]**

### Hostile-input render results
the actual emitted lines for the reserved-word and quote cases, and whether they parse

### Findings
numbered; severity + what + `file:line` + why it matters + required action. If none: "None."

### Test adequacy
would the tests catch a regression of either original defect?

### Verdict rationale
3–6 sentences

Under 900 words. Ground every claim in something you executed or read.
