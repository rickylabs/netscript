**FAIL_PLAN**

I found four blocking problems. Each would cause rework or a failing slice if left until implementation.

1. **The plan leaves the registry embed refresh unresolved, but it must be settled now.**
   - **Where:** `research.md:9`, `plan.md:30` and `drift.md:6` hand "embed refresh" to S2 and the PR.
   - **Why it blocks:** `packages/fresh-ui/registry.generated.ts` holds an exact copy of every registry source file (`.llm/tools/generate-cli-assets-barrel.ts:180-206`). Three things depend on that copy:
     - the `check:assets-barrel` CI gate (`.github/workflows/generated-carriers.yml:34`);
     - the test that checks the copy matches the source byte for byte (`packages/fresh-ui/tests/registry/render-ui-generated.test.ts:8-10`);
     - the browser CI job, which installs components through `ui:add` from that copy (`fresh-ui-quality.yml:270-280`).
   - **Effect:** if slice 3 edits component TSX/CSS without regenerating the copy, CI fails. Consumers and the slice-5 browser proof would also still get the old BEM markup.
   - **Fix:** in slice 3, and in any later slice that touches registry sources, run `deno task gen:assets-barrel` and commit the result. Gate it with `check:assets-barrel`. The plan should say explicitly that this only re-runs the existing generator, so it does not touch registry schema or the `ui:build`/`ui:add`/`ui:apply` commands.

2. **"Syntax-aware" rewriting needs a parser, but the plan also rules out new dependencies.**
   - **The conflict:**
     - `plan.md:27` relies on "the existing TypeScript syntax tree API".
     - There is none: nothing in `packages/`, `plugins/`, `tools/` or `.llm/tools/` imports `typescript`, `ts-morph`, `@swc/*` or `deno_ast`, or calls `createSourceFile`.
     - There is no CSS parser either.
     - At the same time, `research.md:13` says "No dependencies or lock changes", and `supervisor.md:5` forbids lockfile changes.
   - **Effect:** slice 3 (converting the class expressions) and slice 4 (`ui:migrate variants`) both depend on choosing a parser.
   - **Fix:** decide now how TSX and CSS will be parsed. Either write a small tokenizer by hand that reports anything it doesn't recognise instead of guessing, or name a specific dependency and get the owner to approve the lock change.

3. **The gate set isn't taken from `gates/archetype-gate-matrix.md`.**
   - **The gap:** the plan's gates are ad hoc and are not mapped to the Arch 1 (contracts) and Arch 6 (CLI) columns. It leaves out:
     - the Arch 6 F-CLI-* gates for the new `ui:migrate` command;
     - the consumer import validation that Arch 6 requires;
     - Fresh UI CI gates this change will trigger, notably `fresh-ui-browser-contract` (the exact axe baseline will move when the markup changes) and `check:assets-barrel`.
   - **Fix:** list the required gates for each slice with the matrix row each one comes from. Where no script exists yet, mark it with the matrix's "Phase A reporting" statuses (`PASS` with manual evidence, or `PENDING_SCRIPT`).

4. **Publishing the full 104-entry inventory goes beyond the stated scope.**
   - **The problem:** `plan.md:8` and `:36` put contracts for every planned gap component (about 50 that don't exist yet) into the published `@netscript/fresh-ui/contracts` subpath. That is specifying gap components inside a public JSR surface, which this phase excludes. It also fixes their props and parts before they are designed, so later phases would have to make breaking changes.
   - **Fix:** limit the published contract data to components that ship today. Planned axes on those components can stay, marked as planned. Otherwise, record explicit owner approval to publish the gap entries.

I didn't flag anything else as blocking: the research baseline, the risk register, the deferred scope and the JSR audit of the planned surface are adequate. I didn't query the GitHub issue (#2416) directly; the phase-1 scope comes from the run artifacts, the retained spec and the code.
