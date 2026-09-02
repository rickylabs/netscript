use harness

## SKILL

Read `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/aspire/SKILL.md` (the
*"Observing resource state: use Aspire's event system, never hand-rolled polling"* section is the
governing doctrine for this slice) and `.agents/skills/netscript-pr/SKILL.md`.

You are the implementation lane (Codex · OpenAI · GPT-5.6 Sol · high, `complex_implementation`) for
slice 1 of #1906. Read the issue in full first:
`gh issue view 1906 --repo rickylabs/netscript` — it carries the corrected API facts and the full
triaged inventory.

Worktree `/home/agent/projects/netscript/worktrees/007-leaf-1906`, branch
`fix/aspire-event-observation`, based on `7a3fcecb3`.

**Stacked on PR #1858** (`fix/garnet-readiness-timeout`), which is green but unmerged. Rebase onto
`main` once #1858 lands. Do not merge anything.

Scope: `packages/cli/e2e/src/application/gates/scaffold/runtime/**` plus its tests, and the run-dir
worklog. Nothing else. Do not touch `packages/` or `plugins/` product source.

## The problem

`packages/cli/e2e/` observes Aspire resources by polling: 15 arbitrary timing constants and 24 files
with sleep/poll loops. These are simultaneously a flake source and a CI-time cost, and they produce
false negatives on slow runners. Issue #1906 carries the full triaged inventory.

The D-101 listener fixture is the worst offender and the proven flake. It currently observes the
healthy → unhealthy **departure** with a 90s bounded poll at 1s granularity. On the last green run
the postgres lane consumed 49.7s of a 90s budget that was chosen arbitrarily.

## The capability that makes this fixable

`aspire describe <resource> --follow --format Json` **continuously streams resource state changes as
NDJSON — one JSON object per line**, carrying name, state and health. Verified from
`aspire docs get aspire-describe-command` on Aspire 13.5.3.

This is a real push stream of *transitions*. It is the correct replacement for both directions, and
it fixes the `aspire wait` defect: `wait` answers from the last completed evaluation, so a transition
you just caused can be missed entirely (it returned exit 0 in 1409 ms right after the listener was
closed). A stream emits that transition as an event.

**No AppHost injection is required.** An earlier design in #1906 proposed injecting a notification
subscriber into the generated AppHost; `--follow` supersedes it. Do not build the injection.

## Scope of THIS slice — bounded, do not exceed

1. A reusable subscription primitive in
   `packages/cli/e2e/src/application/gates/scaffold/runtime/resource-state-stream.ts`.
2. Unit tests for it that feed **synthetic NDJSON** through the parser — no runtime required.
3. Rewire **only** the D-101 fixture (`listener-unreachable-fixture.ts`) to use it, in **both**
   directions (departure and arrival).

**Out of scope:** the other 12 Bucket A sites in #1906. They are a follow-up slice that adopts this
primitive. Do not touch them. Do not touch `packages/` or `plugins/` product source.

## Mandatory design constraints

**1. Subscribe before inducing, and buffer.** The stream must be started *before* the fault is
induced or the race simply moves. `waitFor` must scan already-buffered lines first, then await new
ones. A `waitFor` that only listens for future lines is wrong and will flake exactly like the code it
replaces.

```ts
const sub = await watchResourceUpdates(appHost, 'garnet');   // spawned and reading
try {
  await commandController(closedState);                       // induce
  const report = await sub.waitFor(predicate, ceilingMs);
} finally {
  await sub.close();                                          // must kill the child process
}
```

**2. Do not guess the per-line schema.** The docs pin NDJSON but not the object shape. The snapshot
shape is already parsed by `readListenerHealthReports` in `verify-listener-readiness.ts`:

```
{ resources: [ { <name>, healthReports: { <key>: { status, description, data, exception } } } ] }
```

Accept **either** a `{resources:[...]}` envelope **or** a single resource object per line. On
anything else, **throw and include the raw line**. Never silently skip an unrecognised line — that
converts a clear failure into a hang.

**3. Ceilings change meaning, they do not disappear.** Every surviving timeout must be a
*test-failure ceiling* ("this hung, fail the run"), never a *correctness parameter* ("how long Aspire
is assumed to take"). Say which, in a comment, at every remaining constant.

**4. Process hygiene.** `--follow` spawns a long-lived child. It must be killed on every path
including failure and throw; a leaked follower will trip `agentic:leak-check`.

**5. Keep the structured-code assertion.** `7a3fcecb3` changed the fixture to assert on the health
report's structured failure code with a wording-tolerant description fallback. Preserve that; do not
regress to matching description prose.

## Verification required

- Unit tests covering: both accepted line shapes; the unknown-shape throw carrying the raw line;
  buffered lines observed before `waitFor` is called; ceiling expiry producing a clear failure;
  child process terminated on the throw path.
- Non-vacuity: prove a test fails if the predicate never matches, rather than passing silently.
- `deno run --allow-read --allow-run --allow-write .llm/tools/run-deno-check.ts --root packages/cli/e2e/src --ext ts`
- `deno test --allow-all --no-lock` on the affected test files.
- `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli/e2e --ext ts`
- Do **not** run the full `e2e:cli` gate locally; it is expensive and the local runtime lease is held
  by the Aspire supervisor. CI is the proof surface for the live stream.

**The per-line schema is unproven until CI runs.** State that plainly in the PR. If CI shows the
shape differs, fix the parser — do not widen it into silently accepting anything.

## PR rules

Open a **draft PR on the first commit**. Body must carry `Refs #1906` — **no closing keyword**, this
slice does not complete the sweep. Labels: `type:test`, `area:cli`, `area:aspire`, `gate:e2e`,
`priority:p1`, `status:impl`, milestone `0.0.7`. Note in the body that it is stacked on #1858.

Record progress in `.llm/runs/fix-aspire-event-observation--impl/worklog.md` as you go; the
supervisor watches that file.
