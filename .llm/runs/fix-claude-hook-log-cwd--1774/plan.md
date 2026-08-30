# Plan: make Claude hook logging independent of turn cwd

## Run Metadata

| Field          | Value                                                               |
| -------------- | ------------------------------------------------------------------- |
| Run ID         | `fix-claude-hook-log-cwd--1774`                                     |
| Branch         | `fix/claude-hook-log-cwd-independent`                               |
| Phase          | `plan-eval`                                                         |
| Target         | Checked-in Claude hook configuration and repository agentic tooling |
| Archetype      | N/A — not a published package/plugin or shipped CLI                 |
| Scope overlays | none                                                                |

## Archetype

N/A. The owned surface is `.claude/settings.json` plus `.llm/tools/agentic/claude/**`, not a
`packages/**` or `plugins/**` publish unit. Archetype-6's package/public-CLI gate matrix would add
irrelevant JSR and consumer gates. The repository-tooling implementation still applies doctrine
A6/A7/A8/A14, AP-2/AP-9/AP-19, layering-by-concern, and the explicit no-`any`/no-cast rule.

## Current Doctrine Verdict

N/A for repository tooling. Doctrine file 10 measures the 36 published package/plugin roots and does
not assign `.llm/tools/agentic/**` a package verdict. This change creates no published surface or
doctrine debt.

## Axioms in Play

| Axiom | Why it matters                                                                                               |
| ----- | ------------------------------------------------------------------------------------------------------------ |
| A6    | A wrapper that only changes cwd/path would be unjustified indirection.                                       |
| A7    | Use Claude's documented `${CLAUDE_PROJECT_DIR}` contract and Deno's native granular permissions.             |
| A8    | Keep configuration, logging behavior, focused tests, and surface validation in their existing concern files. |
| A14   | The unchanged RED→GREEN fixture and structured gates are the durable contract.                               |

## Goal

Both checked-in Claude log handlers execute this active worktree's logger and append to this
worktree's hook log from the worktree root, a nested `.llm/runs/<run>` cwd, or a cwd inside a
sibling-shaped decoy. The repair must remain host-neutral and grant only the permissions the logger
actually needs.

## Scope

- Convert both configured command handlers to exec form: executable `deno`, explicit `args`, and a
  logger path rooted at `${CLAUDE_PROJECT_DIR}`.
- Anchor logger output at `CLAUDE_PROJECT_DIR` when Claude supplies it, with `Deno.cwd()` retained
  only as the compatibility fallback for direct non-Claude invocation.
- Narrow configured hook permissions to the three read environment keys and the active worktree's
  `.llm/tmp/claude/hooks` write subtree; remove runtime `--allow-read`.
- Add a focused fixture that parses the live settings and exercises `PreToolUse` and `Stop` from
  root, nested run cwd, and a sibling-decoy cwd.
- Align the direct hook task, Claude surface validator lock check, and agentic README/help text with
  the resolved root and permission contract where they would otherwise become stale.
- Maintain harness worklog/context and per-slice PR comments.

## Non-Scope

- Do not change hook event schemas, matchers, stdout/stderr behavior, blocking semantics, or JSONL
  record shape.
- Do not repair `wslHome()` or the retired `/home/codex` default. That is a sibling Codex-launcher
  configuration defect with separate contracts/tests.
- Do not change Remote Control, evaluator routing, OpenRouter, OpenHands, or other lane sessions.
- Do not edit `.github/workflows/**`; no CI wiring is required, so the repo-scope PAT is sufficient.
- Do not run Aspire, Docker, browser, `e2e:cli`, or `scaffold.runtime`; none proves this surface and
  this leaf has no serialized expensive-gate lease.

## Hidden Scope

- An absolute executable path alone is not enough: the logger's current output path is also
  cwd-relative.
- The checked-in direct task and mandatory validator currently carry broader or root-relative
  invocation arguments and must not document a contradictory permission contract after GREEN.
- Harness identity/evidence artifacts necessarily record the actual worktree and the confirmed
  retired-host fact. The host-path acceptance assertion applies to product/config/runtime docs
  changed by the repair, not the run artifacts whose purpose is exact host provenance.

## Locked Decisions

| ID  | Decision                                                                                                                                                                    | Rationale                                                                                                                                    |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Use `${CLAUDE_PROJECT_DIR}` in `.claude/settings.json`.                                                                                                                     | Claude exports/substitutes it as the active project root; it is host-neutral and follows each worktree.                                      |
| D2  | Use exec form (`"command": "deno"`, explicit `args`) for both events.                                                                                                       | Official guidance for placeholder paths; avoids shell tokenization and handles spaces safely.                                                |
| D3  | Use the same project-root env value for logger output, falling back to `Deno.cwd()` only when the variable is absent.                                                       | Anchors real hooks correctly while preserving direct task/script behavior outside Claude.                                                    |
| D4  | Do not add a wrapper or root-discovery helper.                                                                                                                              | Settings-only and script-only are incomplete, while a wrapper merely renames existing platform/tool contracts and adds a seam.               |
| D5  | Configure exactly `--allow-env=CLAUDE_PROJECT_DIR,NETSCRIPT_RUN_ID,CLAUDE_SESSION_ID` and `--allow-write=${CLAUDE_PROJECT_DIR}/.llm/tmp/claude/hooks`; omit `--allow-read`. | These are the only environment reads and write subtree observed; the permission probe passes without runtime read access.                    |
| D6  | Preserve empty stdout/stderr on success, exit 0, append-only JSONL shape, and non-blocking hook configuration.                                                              | #1774 fixes false-positive module resolution only.                                                                                           |
| D7  | The test parses live settings and supports the current shell form plus planned exec form; it is not edited between RED and GREEN.                                           | Proves the repair rather than a duplicated command and leaves a visible historical RED.                                                      |
| D8  | Distinguish worktrees with a temporary sibling-shaped decoy logger that returns a unique failure/marker while the active project root remains this worktree.                | A success plus active-root event record and absent decoy marker proves the configured command did not resolve from cwd/global/sibling state. |
| D9  | Keep the `wslHome()` defect out of scope and name it in research/plan/handoff.                                                                                              | Repairing it changes unrelated Codex launcher behavior and its historical-default unit test.                                                 |
| D10 | PLAN-EVAL is selected and mandatory.                                                                                                                                        | The owner explicitly requires a plan stop and the combined path/output/permission fixture design benefits from adversarial review.           |

## Exact Planned Handler Contract

Each `PreToolUse` and `Stop` command handler will retain its current matcher and type, with this
execution shape:

```json
{
  "type": "command",
  "command": "deno",
  "args": [
    "run",
    "--no-lock",
    "--allow-env=CLAUDE_PROJECT_DIR,NETSCRIPT_RUN_ID,CLAUDE_SESSION_ID",
    "--allow-write=${CLAUDE_PROJECT_DIR}/.llm/tmp/claude/hooks",
    "${CLAUDE_PROJECT_DIR}/.llm/tools/agentic/claude/claude-hook-log.ts"
  ]
}
```

"Required" permissions means: read only those three environment names; create/append only inside the
active worktree hook-log subtree; no runtime filesystem read, network, run, sys, FFI, or broad
environment/write grant. Hook process output remains empty on success; the durable JSONL event stays
within the active worktree.

## Open-Decision Sweep

| Decision                             | Status        | Notes                                                                           |
| ------------------------------------ | ------------- | ------------------------------------------------------------------------------- |
| Project root source                  | resolved now  | D1: documented Claude placeholder/env contract.                                 |
| Settings, script, or wrapper         | resolved now  | D2–D4: combined settings/script, no wrapper.                                    |
| Output root and missing-env behavior | resolved now  | D3: project root with cwd compatibility fallback.                               |
| Permissions                          | resolved now  | D5 and exact handler contract above.                                            |
| Both event cases                     | resolved now  | D7: live-settings enumeration asserts exactly `PreToolUse` and `Stop`.          |
| Worktree discrimination              | resolved now  | D8: sibling decoy plus active log assertion.                                    |
| Validator/task/docs alignment        | resolved now  | Included in GREEN if made stale by the new contract.                            |
| `wslHome()` retired default          | safe to defer | Confirmed sibling defect; unrelated launcher surface.                           |
| CI workflow wiring                   | safe to defer | No workflow edit is needed; existing tasks and CI discovery cover the test.     |
| Expensive runtime/scaffold gates     | safe to defer | They do not exercise Claude hook execution and require a lease this leaf lacks. |

No unresolved decision would force implementation rework after PLAN-EVAL.

## Commit Slices

| #  | Slice and proof                                                                                                                                   | Files                                                                                                                                                                                       | Proving gate                                                                  |
| -- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| S0 | Bootstrap establishes run identity and draft PR. Complete.                                                                                        | Run artifacts                                                                                                                                                                               | Branch/remote/PR inspection                                                   |
| S1 | Research re-derives both event failures and closes root/scope/permission decisions. Complete.                                                     | `research.md`, `worklog.md`, `context-pack.md`                                                                                                                                              | Raw exact-command reproduction                                                |
| S2 | Plan locks implementation and executable gates; hard-stop for PLAN-EVAL.                                                                          | `plan.md`, `worklog.md`, `context-pack.md`, `drift.md` if needed                                                                                                                            | Separate-session PLAN-EVAL checklist                                          |
| S3 | RED fixture proves current nested-cwd failure for both configured events and contains the sibling-decoy assertion. Commit and push while failing. | `.llm/tools/agentic/claude/claude-hook-log_test.ts`, `worklog.md`, `context-pack.md`                                                                                                        | Structured focused test exits nonzero with nested `Module not found` failures |
| S4 | GREEN repair makes the unchanged fixture pass and aligns permission/documentation surfaces.                                                       | `.claude/settings.json`, `deno.json`, `.llm/tools/agentic/claude/claude-hook-log.ts`, `.llm/tools/agentic/claude/validate-claude-surface.ts`, `.llm/tools/agentic/README.md`, run artifacts | Unchanged focused fixture + `agentic:check-claude`                            |
| S5 | Gate/handoff records structured focused/root evidence and prepares separate IMPL-EVAL without implementation churn.                               | `worklog.md`, `context-pack.md`, PR body/comments                                                                                                                                           | Full selected gate table green; raw git diff/status                           |

All implementation slices are below 30 and ordered. S3 must remain its own visible commit before S4.
Each slice is pushed with the exact owner-provided refspec and receives one PR phase/slice comment.

## Fixture Contract

- Read and validate `.claude/settings.json`; find command handlers under exactly the event constants
  `PreToolUse` and `Stop`.
- Send a distinct valid JSON payload for each event and assert exit/output plus the resulting event
  record.
- Cases per event:
  1. cwd = active worktree root → exit 0;
  2. cwd = active worktree nested `.llm/runs/<fixture>` → exit 0 after repair;
  3. cwd = nested path inside a temporary sibling-shaped project containing a decoy logger → active
     worktree handler still exits 0, active log gets the payload, decoy marker remains absent.
- Before repair, case 2 must fail for both events with the current nested module URL. The RED commit
  records the structured wrapper output and is pushed before any config/script change.
- The same test file, byte-for-byte unchanged, runs GREEN after S4.
- The fixture asserts configured env/write permissions, absence of `--allow-read`/broad grants, and
  absence of either host-specific home path in the owned product/config/doc files.

## Risk Register

| Risk                                                                         | Mitigation                                                                                                              |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| A test duplicates the intended command and false-greens stale settings.      | Parse and execute live `.claude/settings.json`.                                                                         |
| Absolute paths break spaces or platform tokenization.                        | Use official exec form and one argument per element.                                                                    |
| Correct script loads but output lands under nested cwd.                      | Assert unique payloads in active-root JSONL and no nested/decoy marker.                                                 |
| A sibling/global logger satisfies a weak exit-only assertion.                | Decoy returns a distinctive failure and marker; assert active-root event plus absent marker.                            |
| Permission narrowing accidentally blocks ordinary hooks.                     | Root/nested/sibling cases execute actual Deno process with exact settings args; mandatory validator repeats lock check. |
| Permission claims drift across task/validator/docs.                          | Align all direct invocations in S4 and assert handler args.                                                             |
| RED commit is mistaken for finished work.                                    | Keep PR draft/status lifecycle and comment explicit failing evidence; GREEN is the next slice only after PLAN-EVAL.     |
| Host-path check flags required harness provenance or misses product leakage. | Scan/assert the owned product/config/runtime-doc set explicitly; explain run-artifact provenance exclusion.             |
| Scope silently expands into broken `/home/codex` launcher default.           | D9 plus file list prohibits `agentic-lib.ts`/launcher test edits.                                                       |
| Validation mutates `deno.lock`.                                              | Use `--no-lock` hook executions and inspect `deno.lock`/git status after every gate.                                    |

## Anti-Patterns to Resolve or Avoid

| AP / rule                                                            | Status   | Plan                                                                                                       |
| -------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| AP-2 helper that renames a platform primitive                        | risk     | No wrapper/root helper; use Claude placeholder and Deno APIs directly.                                     |
| AP-9 premature abstraction                                           | risk     | Keep the focused command-execution logic test-local; no production abstraction for two identical handlers. |
| AP-19 permissions assumed silently                                   | existing | Replace broad configured permissions with executable exact grants and update text/validator.               |
| No explicit `any`, `as any`, `as unknown as`, or blanket lint ignore | required | Typed JSON narrowing in the fixture; focused lint plus source-pattern review before sign-off.              |
| Layering by concern                                                  | required | Config selects command, logger owns event persistence, validator owns surface gate, test owns fixtures.    |

## Fitness Gates

| Gate                                                   | Required | Expected evidence                                                                                      |
| ------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------ |
| Focused RED history                                    | yes      | S3 commit and structured failing test output for both nested events                                    |
| Focused GREEN fixture                                  | yes      | Same S3 test file passes all root/nested/sibling cases after S4                                        |
| Claude surface                                         | yes      | `deno task agentic:check-claude` JSON result `ok: true`; `deno.lock` unchanged                         |
| Focused Claude launcher regression                     | yes      | Structured wrapper passes hook test plus `remote-model-launcher_test.ts` and `hybrid-launcher_test.ts` |
| Scoped type check                                      | yes      | Structured check wrapper over `.llm/tools/agentic/claude`, exit 0                                      |
| Scoped lint                                            | yes      | Structured lint wrapper over `.llm/tools/agentic/claude`, zero findings                                |
| Scoped format                                          | yes      | Structured fmt wrapper over changed TS/JSON/Markdown files, zero findings                              |
| No-host-path assertion                                 | yes      | Fixture/product-file assertion passes for both forbidden home paths                                    |
| No-`any`/cast review                                   | yes      | Lint plus explicit changed-TypeScript pattern check, no finding/ignore                                 |
| Root test                                              | yes      | `deno task test` structured wrapper exits 0 (usable at this host/base)                                 |
| Raw git/lock hygiene                                   | yes      | Clean owned diff, `deno.lock` unchanged, exact commits copied from `git log`                           |
| PLAN-EVAL / IMPL-EVAL                                  | yes      | Separate native opposite-family verdict artifacts; this session performs neither                       |
| JSR / publish / consumer / Aspire / browser / scaffold | N/A      | No package/plugin/public runtime/scaffold surface; no expensive-gate lease                             |

## Validation Plan

| Order | Gate                   | Command or check                                                                                                                                                                                                                                                                                                                           | Expected result                                                                |
| ----- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| 1     | RED                    | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all .llm/tools/agentic/claude/claude-hook-log_test.ts`                                                                                                                                                                                             | Nonzero in S3; failures name nested `PreToolUse` and `Stop` module resolution. |
| 2     | GREEN focused          | Same command, unchanged test file                                                                                                                                                                                                                                                                                                          | Exit 0 after S4; root/nested/sibling cases for both events pass.               |
| 3     | Claude surface         | `deno task agentic:check-claude`                                                                                                                                                                                                                                                                                                           | Structured JSON `ok: true`; lock unchanged.                                    |
| 4     | Focused hook/launchers | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all .llm/tools/agentic/claude/claude-hook-log_test.ts .llm/tools/agentic/claude/remote-model-launcher_test.ts .llm/tools/agentic/claude/hybrid-launcher_test.ts`                                                                                   | Structured test report passes.                                                 |
| 5     | Check                  | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/agentic/claude --ext ts`                                                                                                                                                                                                                                 | Structured report passes.                                                      |
| 6     | Lint                   | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .llm/tools/agentic/claude --ext ts`                                                                                                                                                                                                                                  | Structured report has zero findings.                                           |
| 7     | Format                 | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --file .claude/settings.json --file deno.json --file .llm/tools/agentic/claude/claude-hook-log.ts --file .llm/tools/agentic/claude/claude-hook-log_test.ts --file .llm/tools/agentic/claude/validate-claude-surface.ts --file .llm/tools/agentic/README.md --ext ts,json,md` | Structured report has zero findings.                                           |
| 8     | Root regression        | `deno task test`                                                                                                                                                                                                                                                                                                                           | Structured root report passes; no zombie caveat on this host.                  |
| 9     | Raw integrity          | direct `git diff --check`, `git status --short`, `git diff <base> -- deno.lock`, and changed-file review                                                                                                                                                                                                                                   | No whitespace/lock/unowned churn; product diff matches plan.                   |

The validator command in gate 3 is the mandatory `CLAUDE.md` gate for this configuration/hook
change. Gate outputs are recorded in `worklog.md`; durable CI may wrap allowlisted commands in the
gate-receipt runner, but no receipt substitutes for semantic fixture coverage.

## Arch-Debt Implications

| Entry                       | Action                 | Notes                                                          |
| --------------------------- | ---------------------- | -------------------------------------------------------------- |
| Existing architecture debt  | none                   | No matching Claude-hook debt.                                  |
| New debt                    | none expected          | The complete repair and fixture land together.                 |
| `wslHome()` retired default | defer outside this run | Confirmed sibling defect, not silently accepted as #1774 debt. |

## Dependencies

- Installed Claude Code's documented `CLAUDE_PROJECT_DIR` placeholder/env behavior.
- Deno exec-form permission flags and existing structured wrapper scripts.
- Separate supervisor-dispatched native Claude/Fable PLAN-EVAL and later IMPL-EVAL sessions.

## Deferred Scope

- Repair and migration policy for `wslUser()`/`wslHome()` defaults.
- Any generalized hook-command framework or wrapper.
- CI workflow edits and expensive runtime/scaffold validation.
- Hook schema, matchers, blocking behavior, log rotation, redaction, and retention.

## Drift Watch

- Claude placeholder/exec semantics differ from current official docs or installed `2.1.251`.
- The fixture cannot execute both live handler forms without production helper code.
- Minimum permissions require read/network/run/sys or a broader write subtree.
- Product changes touch any file outside the locked S3/S4 lists, especially launcher/home code or
  `.github/workflows/**`.
- `deno.lock` changes, sibling/global state is required, or an expensive gate becomes necessary.

Any such fact is appended to `drift.md`; material scope change returns to the owner/PLAN-EVAL.

## Plan-Gate Handoff

This plan is ready for a separate-session PLAN-EVAL. Implementation remains prohibited until
`plan-eval.md` records `PASS`. The evaluator should spot-check the raw nested failure, the combined
settings-plus-output necessity, the exact permission args, the unchanged RED→GREEN fixture's sibling
discrimination, and the explicit `wslHome()` deferral.
