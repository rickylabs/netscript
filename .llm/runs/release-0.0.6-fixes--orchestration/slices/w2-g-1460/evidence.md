# W2-G #1460 evidence

Date: 2026-08-12

## Scope

`agent init` has three generated MCP host surfaces: Claude `.mcp.json`, VS Code
`.vscode/mcp.json`, and Zed `.zed/settings.json`. All three now consume the same direct `deno run`
argument builder. No generated invocation uses `deno x`.

The builder emits, in order, `run`, `--no-lock`, `--minimum-dependency-age=0`, `--config`, the
consumer config, permissions, the exact CLI specifier, and `agent mcp` arguments.

The live issue acceptance also exercises MCP `doctor`. That flow uses the project-config loader's
bounded Deno child, so the child now carries `--no-lock` as well; otherwise the parent server could
be neutral while a diagnostic call dirtied the lock.

## Regression check: RED → GREEN

The focused semantic regression covers the exact Claude and VS Code argument arrays and the Zed
argument prefix. For the negative control, only the two neutrality arguments were temporarily
removed from the shared builder.

| State | Command | Exit | Untruncated output |
| --- | --- | ---: | --- |
| RED | `deno test --allow-all packages/cli/src/public/features/agent/init/init-agent_test.ts` | 1 | [`logs/regression-red.log`](logs/regression-red.log) |
| GREEN | `deno test --allow-all packages/cli/src/public/features/agent/init/init-agent_test.ts` | 0 | [`logs/regression-green.log`](logs/regression-green.log) |

The RED run failed on all three generated surfaces because `--no-lock` and
`--minimum-dependency-age=0` were absent. The flags were restored before the GREEN run; 19 tests
passed and zero failed.

## Committed consumer lock execution proof

Fixture workspace:
`/home/codex/repos/ns006-w2-1460/.llm/tmp/w2-g-lock-proof`

The workspace was initialized as a standalone Git repository and `deno.json`, `probe.ts`, and its
generated `deno.lock` were committed before `agent init`. The test then read the generated
`.mcp.json` argv, substituted the checkout's CLI entrypoint for the not-yet-published fixed build,
started the server, sent JSON-RPC initialize plus `search_docs`, `get_doc`, and `doctor` calls over
stdio, closed stdin to shut the server down, waited for exit, and compared the lock before and
after.

```text
fixture_commit=2f82763497e763a48689f63b05898e46c12a0546
before=2535d5eae5abb105055327c35e8964e662cbe24f9a1d2a8fbaa1245cb87b3d75
after=2535d5eae5abb105055327c35e8964e662cbe24f9a1d2a8fbaa1245cb87b3d75
command_exit=0
lock_diff_exit=0
response_ids=[1,2,3,4]
response_errors=0
```

Untruncated output: [`logs/lock-neutrality-proof.log`](logs/lock-neutrality-proof.log).

## Required gates

Each output link is the complete raw stdout/stderr captured from the exact command. Exit codes are
recorded separately beside each log under `logs/*.exit`.

| Command | Exit | Untruncated output |
| --- | ---: | --- |
| `rtk proxy deno task check` | 0 | [`logs/check.log`](logs/check.log) |
| `rtk proxy deno task test` | 0 | [`logs/test.log`](logs/test.log) |
| `rtk proxy deno task lint` | 0 | [`logs/lint.log`](logs/lint.log) |
| `rtk proxy deno task fmt:check` | 0 | [`logs/fmt-check.log`](logs/fmt-check.log) |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` | 0 | [`logs/scoped-cli-check.log`](logs/scoped-cli-check.log) |
| `rtk proxy deno task quality:gate` | 0 | [`logs/quality-gate.log`](logs/quality-gate.log) |

`quality:gate` completed with its pre-existing doctrine warnings and no failures. No warning is in
any changed file. The full test gate reports 3,233 passed (617 steps), zero failed, and 17 ignored.

## Changed-diff safety scan

`git diff --check` exited 0. A focused scan of both changed files found no `deno-lint-ignore`,
`as unknown as`, or `@ts-ignore`. The repository root `deno.lock` is unchanged and is not in the
diff.
