You are an INDEPENDENT IMPL-EVAL evaluator, in a SEPARATE session from the implementation author
(Codex GPT-5.6 Sol). Do not inherit or restate the author's claims. EVALUATE ONLY — no edits.

## Worktree (read-only)

`/home/agent/projects/netscript/worktrees/007-eval-slot` — detached at `01d32c95f`.
Base `main` `71d5fb8e0`; evaluate `git diff 71d5fb8e0..HEAD`.

## Slice

**#1836 / PR #1837** — reserved-word bindings and unescaped literals in the four sibling register
generators. `Closes #1836`.

This is the **same defect class** #1747 fixed for `generate-register-background.ts`. Proven on `main`
before this slice: `generateRegisterApps` with an app named `class` emitted
`const class = builder.addExecutable('class', …)` — **invalid JavaScript**.

Affected: `generate-register-apps.ts`, `generate-register-plugins.ts`, `generate-register-tools.ts`,
`generate-register-infrastructure.ts`.

## Required verification — EXECUTE, do not infer

A prior evaluation of the sibling PR passed a head that emitted non-parsing JavaScript **because it
reasoned about the code instead of rendering it.** Do not repeat that.

1. **Render each of the four generators** with hostile inputs: reserved words (`class`, `await`,
   `function`, `const`, `return`) as resource names *and* reference names; colliding names (`a-b` +
   `a_b`, `workers-api` + `workers_api`); and quotes, backslashes, backticks, `${}` sequences and
   newlines in every user-supplied string field (`Workdir`, `Entrypoint`, paths, env keys/values,
   `addParameter` arguments).
2. **Parse-check the emitted output** (e.g. `deno lint` on the written file, or dynamic import
   against stubs). Confirm it is valid JavaScript in every case and that **no user string escapes its
   literal**.
3. Confirm bindings are **generated ordinals**, never user-derived, in all four generators.
4. Confirm the tests would **fail if either mechanism were reverted** — prove by mutation, don't
   assert.
5. **Scrutinise the consumer-test repair.** Two pre-existing test files
   (`generators-pipeline_test.ts`, `service-environment_test.ts`) initially failed and were then
   updated. The author replaced a user-text-comment block locator with one anchored on
   `plugins.set(JSON.stringify(name), resource)`. **Judge whether that legitimately reflects the
   intended design (generated comments deliberately carry no user text) or whether it weakened a
   contract.** The `#1447` declared-plugin-environment parity contract — declared entries applied,
   ordering before generated values, `PORT` refusal, deprecated `Env` alias — must still be genuinely
   asserted.
6. Confirm `safeIdentifier` remains exported from `_utils.ts` — `generate-register-background.ts` on
   `main` still depends on it (#1747 fixes that generator in a separate PR).

## Runtime

Host runtime is parked (microsoft/aspire#14878). Rendering generators in-process is **not** runtime —
do that. Do not start Aspire or Docker.

## Output

**[PHASE: IMPL-EVAL] [VERDICT: <PASS|CHANGES_REQUESTED>]**

### Hostile-input render results
per generator: the emitted binding lines and whether the module parses

### Findings
numbered; severity + what + `file:line` + why it matters + required action. If none: "None."

### Consumer-test repair assessment
explicitly answer whether the `#1447` contract is still genuinely enforced

### Verdict rationale
3–6 sentences

Under 900 words. Ground every claim in something you executed or read.
