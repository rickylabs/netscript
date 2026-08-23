use harness

# Slice W5-A — plugin doctor service entrypoints 404 during bump→publish (release blocker)

| Field | Value |
| --- | --- |
| Worktree | `/home/codex/repos/ns006-w5a` |
| Branch | `fix/doctor-service-entrypoint-unpublished` |
| Base | `origin/main@9a7cadcaa` |
| Route | Codex · OpenAI · GPT-5.6 Sol · **medium** |
| Priority | **P0 — blocks the 0.0.6 stable cut. Release PR #1624 is red on this.** |
| IMPL-EVAL | Normal automatic evaluator on draft → ready |

## SKILL

- `netscript-harness` · `netscript-cli` (**authority on the plugin doctor, scaffold suites, and what each gate proves**)
- `netscript-release` (why the bump→publish window exists) · `netscript-tools` · `netscript-pr` · `rtk`

## The defect

Release PR #1624 (`chore(release): cut 0.0.6`) fails three E2E jobs. `scaffold.plugins` reports:

```
Error: Plugin doctor failed: workers, sagas, triggers, streams, auth.
  plugins: workers, sagas, triggers, streams, auth
```

Cause: the CLI's own plugin doctor verifies each plugin's **service entrypoint** by resolving
`jsr:@netscript/plugin-<name>@<tree-version>/services`. During a release cut the tree version is
`0.0.6`, which is **not published yet** — JSR returns 404 — so a check unrelated to the payload
fails the release PR.

The code is `packages/cli/src/public/features/plugins/doctor/doctor-plugin-use-case.ts`:
`SERVICE_ENTRYPOINT_RESOLVES_CHECK` / `checkServiceEntrypoints(...)`.

**This is a different code path from #1597.** That issue fixed the E2E gate
`behavior.package-backed-plugin-doctor` (`packages/cli/e2e/.../behavior-plugins-health-gate.ts`),
which now probes exact versions and degrades. The doctor's own service-entrypoint check was never
covered. Do not re-fix #1597's path; do not regress it.

## Required property

Same contract #1597 established, applied to this path:

- An **unpublished** pinned version must **not** produce a failure that reads as a payload defect.
  It degrades to a **named, reported exclusion** — a human must see which check was skipped and why.
- Only a **confirmed 404 for that exact version** may degrade. Any other registry or network
  failure stays a hard failure. Study `packages/cli/e2e/src/application/gates/scaffold/package-backed-plugin-version.ts`
  for the exact-404-only predicate shape and reuse that discipline.
- A **published** version must still execute the check fully. The fix must not disable it in the
  normal case — that is the "fixed by making it never run" failure this milestone exists to remove.
- Do not mark the check non-critical and do not delete it.

## Discriminating tests — required

Add tests that **fail against the current code** and pass after your fix:

1. Unpublished exact version → the doctor reports a named exclusion, and the suite does not fail.
2. Published version → the check runs fully and can still fail for a genuine reason.
3. Non-404 registry failure (e.g. 503) → still a hard failure, not a skip.

A test that only asserts the happy path proves nothing here. State plainly in `evidence.md` which
assertion fails on the pre-fix code.

## Gates

```
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx
rtk proxy deno task test
rtk proxy deno task lint
rtk proxy deno task fmt:check
rtk proxy deno task quality:gate      # required — packages/**
deno task e2e:cli run scaffold.plugins --format pretty
```

`scaffold.plugins` is the suite that is currently red — you must show it green. It is narrower than
`scaffold.runtime`; run that one, not the full runtime tier.

## Hazards

- Never wrap an attached session in a shell `timeout` — it kills the turn ~25s later.
- `deno fmt` rewraps; re-read after formatting and confirm your edit survived.
- Explicit-path `git add`; assert `git diff --stat -- deno.lock packages/fresh-ui/deno.lock` empty.
- **No publication, no `release:cut`, no tag.** I own the release train.
- This must land on `main` as a leaf PR. The release branch is re-cut afterwards — do not touch
  `release/cut-0.0.6` or PR #1624.

## Deliverables

1. The fix on `fix/doctor-service-entrypoint-unpublished`.
2. `slices/w5-a-doctor/evidence.md` — untruncated gate output, the three discriminating tests, and
   the pre-fix red for each.
3. A **draft PR against `main`**: labels `type:fix`, `area:cli`, `priority:p0`, exactly one
   `status:`; milestone `0.0.6`. Reference the release blocker in the body; **check whether any
   referenced issue has acceptance checkboxes before adding a structured evidence block** — if it
   has none, do not add one. If it does, match each entry's text to the checkbox line **verbatim**
   or use `box-index`; one character of drift makes the mirror throw.
4. Report the PR number and stop. Do not merge.
