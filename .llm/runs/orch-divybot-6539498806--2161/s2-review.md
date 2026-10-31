S2 needs one change before commit: the startup specimen is named like a real test file, so the repo's default test run would pick it up and it would fail outside a generated project. Everything else in S2 is fine.

## Blocking finding

**C1. The startup specimen is named `installed-startup-smoke_test.ts` but only works inside a generated project.**

- **Why the repo's tests would find it:** the root `deno.json` excludes only `.llm/tmp/` at the top level and has no `test` section, so a plain `deno test` discovers every `*_test.ts` file, including ones in `.llm/runs/`. `deno task test` with no paths does exactly that. Lint and format exclude `.llm/`, but tests do not. No `*_test.ts` file is committed under `.llm/runs/` today, so this would be the first.
- **Failure scenario:** a contributor runs `deno task test` from the repository root, as AGENTS.md lists. The specimen sets the project root to the repository root and tries to start the trigger and worker runtimes against generated registries that don't exist there. It also opens a server and an in-memory store. It either throws or fails its readiness assertion after about 3 seconds, which is a new red result unrelated to the code under test. Any later test sweep over the repository hits the same thing.
- **Required fix:** give the committed file a name that test discovery ignores, for example `installed-startup-smoke.specimen.ts`. Update `installed-proof.md` step 4 to copy it into the generated project as `installed-startup-smoke_test.ts`. No code or test logic needs to change.

## Everything else: no blockers

- **README sections:**
  - **First-line marker:** the wording matches the selector exactly. It accepts a BOM, indentation and CRLF, and rejects a later line, a string, or extra text on the line.
  - **Sagas:** the section correctly says modules without a definition call were never candidates, so they aren't reported as excluded.
  - **AI:** the section correctly says tool shape selection still runs after exclusion, and that tools skipped by that check are not reported as excluded.
  - **Workers:** the new note on config pointing at an excluded job matches the code and the new test.
  - **Version coupling:** the advice to keep matching release versions is stated as advice, not a guarantee.
  - The remaining README changes are formatter reflow only.
  - "Shared by all plugin runtime registries" is accurate for the first-party plugins, since streams and auth declare no registries. Saying "first-party" would be more precise, but it doesn't block.
- **Worker-policy negative control:** both writers reject config that points at an excluded job, with the same unmatched-path error. This closes the gap I flagged on S1.
- **Proof claims:** `installed-proof.md` stays within what was shown. Generation and doctor succeed with marked factories, doctor names both paths, and both startup APIs report ready with `registryReady` and `dependencyReady`. It states plainly that the store is in memory, the streams endpoint is a test double, durable-stream behaviour is not verified, and the full scaffold.runtime result still has to come from the coordinator's CI. The specimen cleans up after itself: it aborts both runtimes, waits for them, and closes the store and the server. Its endpoint is a dynamically allocated local test port, not an operator address.
- **Generated MCP export file:** the one-row update for `@netscript/plugin/cli` follows from the new exports, is recorded in the drift notes, and changes no MCP runtime code.
- **#2162 scope:** empty-registry behaviour is untouched.
- **Run files:** none of the new run files contain private operational details.

Once C1 is fixed and the final checks you listed pass (61 focused tests, scoped check/lint/fmt, `quality:gate`, generated-file freshness), I sign off S2 for commit without another review round.

VERDICT: CHANGES