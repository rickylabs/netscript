# D-165 urgent generated-source recovery

Date: 2026-08-31

## Process status

`PLAN-EVAL: N/A`: the owner supplied a complete bounded defect diagnosis, repair contract, and gate
set. No evaluator was dispatched by this implementation session. The old IMPL-EVAL artifact predates
this semantic repair and is void for the new head; a fresh supervisor-dispatched GLM IMPL-EVAL remains
pending. These gate results are implementation evidence, not self-certification.

## Baseline and RED

- Unsafe branch head: `68c80e7434c151f26f471c232484595fa525fde2`.
- Owner-supplied `main`: `052f86595b06b33cf0e205405873cd979cf535d1`.
- Live `origin/main` advanced during the repair to unrelated AI commit
  `f59874abd2bc39446b21f5126323e0d2dcbce547`; the branch was cleanly rebased again so that live
  commit is the final base.
- Opening diff deleted 74 files under eight foreign `.llm/runs/` slices. Rebasing restored all 74;
  the final foreign-deletion count is zero.
- Both rebases were conflict-free. No file required a non-trivial conflict resolution.

The real generator rendered the proven unsafe lines at `68c80e743`:

```text
const class_workdir = resolveWorkspacePath(appHostDir, 'a'b');
const class = builder.addExecutable("class", 'deno', class_workdir, ...);
const await = builder.addExecutable("await", 'deno', await_workdir, ...);
parse_exit=1
SyntaxError: Expected ',', got 'b'
59 | const class_workdir = resolveWorkspacePath(appHostDir, 'a'b');
```

The committed semantic tests were then run against the unsafe implementation before the production
edit: exit 1, 9 passed and 5 failed. Failures covered the reserved-word identifier, entry literals,
and both service/plugin reference-derived identifiers.

## Repair

- Background processor identifiers are now `bg_<processorIndex>`; processor names never occupy an
  identifier or comment position.
- Service/plugin endpoint bindings are now ordinal
  `ref_service_<processorIndex>_<index>` / `ref_plugin_<processorIndex>_<index>` identifiers.
- `name`, `Workdir`, `Entrypoint`, `ConcurrencyEnvVar`, reference lookup names, and generated
  discovery environment keys are emitted through `JSON.stringify`.
- Direct generated-module imports parse and execute `class`, `await`, `function`, `const`, and the
  collision pair `workers-api` / `workers_api`. Separate parse cases cover quote, backslash, and
  backtick input in `Workdir`, `Entrypoint`, and `ConcurrencyEnvVar` and source-sensitive service
  and plugin references.
- The Flow-B fixture keeps its generic, quote-agnostic binding discovery, exact captured set anchor,
  users+sagas `missingBackgroundReferences` union, and post-replacement two-key guard. Block slicing
  now locates the ordinal comment block from the workers-specific executable match instead of
  assuming a user-derived `// --- workers ---` comment.

## Static fixture evidence

The generated helper was formatted with the production `--line-width 100 --single-quote` settings,
then the fixture discovery/replace path was executed without Aspire, Docker, AppHost, or E2E runtime:

```json
{
  "workersBinding": "bg_0",
  "workersConfigAnchor": "  if (config.BackgroundProcessors['workers']?.Enabled !== false) {",
  "workersSetAnchor": "    backgroundProcessors.set('workers', bg_0);",
  "configuredContainsUsersReference": true,
  "configuredContainsSagasReference": true
}
```

## Gate evidence

| Gate | Exit | Summary |
| --- | ---: | --- |
| Focused tests | 0 | 143 passed, 0 failed across Aspire config/name and both background-generator files |
| Scoped check | 0 | 7/7 changed TypeScript files; 1 batch; zero occurrences |
| Scoped lint | 0 | Aspire 3/3 + CLI 4/4 processed; zero drops/findings |
| Scoped format | 0 | Aspire 3/3 + CLI 4/4 processed; zero drops/findings |
| `deno task check` | 0 | 2,976 files; 25 batches; `failedBatches: 0`; `totalOccurrences: 0` |
| `deno task quality:scan` | 0 | `ok: true`; zero findings; allowance count remains 7 |
| `deno task arch:check` | 0 | dependency checks complete; every doctrine root `FAIL=0`; existing warnings only |
| `deno task check:aspire-version-parity` | 0 | 812 checked; `fail: 0` |
| Static fixture proof | 0 | binding `bg_0`; exact set anchor captured; users and sagas-api keys both present |

Runtime status: **not run by owner instruction**. Hosted CI and the fresh supervisor-dispatched
IMPL-EVAL are separate pending evidence.
