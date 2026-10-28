---
layout: layouts/base.vto
title: Run a polyglot task
templateEngine: [vento, md]
order: 102
oldUrl: /how-to/run-a-polyglot-task/
---

# Run a polyglot task

This recipe turns a Python or shell script into a NetScript task, runs it through the workers CLI
with its output captured, and sandboxes a Deno task with explicit permissions.
{{ comp.badge({ status: "alpha" }) }}

For the task model, the input and output contract and the full `TaskResult` shape, see
[Polyglot tasks](/background-processing/polyglot-tasks/).

## Prerequisites

- `@netscript/plugin-workers-core` (alpha), which provides `defineTask` (`./builders`) and
  `createDefaultTaskExecutor` (`./executor`).
- The interpreter the task spawns, installed on the worker **host**: `python3` (or a venv, or `py`
  on Windows), `bash`, `pwsh`/`powershell`, the .NET SDK, or your prebuilt binary.
- An entrypoint script or executable, such as `./scripts/score.py`.
- The `ns-workers` CLI, described below.

`ns-workers` is a name you give the workers plugin's CLI; the scaffold does not create it. Install it
once:

```bash
deno install -gArf -n ns-workers jsr:@netscript/plugin-workers{{ releaseSpecifier }}/cli
```

Without the install, run each command as
`deno x -A jsr:@netscript/plugin-workers{{ releaseSpecifier }}/cli <verb …>`.

## Step 1 — Define the task

`defineTask(id)` returns a builder whose default `runtime` is `'deno'`; call `.runtime(type)` for
another language. Pass input as arguments with `.args(...)` and as environment variables with
`.env({...})`. `.build()` becomes callable once you set `.entrypoint(path)`.

{{ comp.tabbedCode({ tabs: [
  {
    label: "Python task",
    lang: "ts",
    code: "// workers/tasks/score-batch.ts\nimport { defineTask } from '@netscript/plugin-workers-core/builders';\n\n// python runtime, script entrypoint, explicit inputs.\nexport const scoreBatch = defineTask('score-batch')\n  .runtime('python')\n  .entrypoint('./scripts/score.py')\n  .env({ MODEL_PATH: './models/scorer.pkl' })\n  .args('--threshold', '0.8')\n  .timeout(120_000) // ms; defaults to 300_000\n  .build();\n\n// Spawns: python3 -u ./scripts/score.py --threshold 0.8"
  },
  {
    label: "Shell task",
    lang: "ts",
    code: "// workers/tasks/rotate-logs.ts\nimport { defineTask } from '@netscript/plugin-workers-core/builders';\n\n// shell runtime runs the entrypoint under bash (no -c).\nexport const rotateLogs = defineTask('rotate-logs')\n  .runtime('shell')\n  .entrypoint('./scripts/rotate-logs.sh')\n  .args('--keep', '7')\n  .timeout(30_000)\n  .build();\n\n// Spawns: bash ./scripts/rotate-logs.sh --keep 7"
  },
  {
    label: "Pin a Python interpreter",
    lang: "ts",
    code: "// workers/tasks/score-batch.ts — prefer a pinned venv over $PATH discovery\nimport { defineTask } from '@netscript/plugin-workers-core/builders';\n\nexport const scoreBatch = defineTask('score-batch')\n  .runtime('python')\n  .entrypoint('./scripts/score.py')\n  // Resolution order: pythonConfig.pythonPath -> venvPath -> NETSCRIPT_PYTHON_PATH -> python3/py\n  .metadata({ pythonConfig: { venvPath: './.venv' } })\n  .build();"
  }
] }) }}

## Step 2 — Write the script

The script returns structured data by printing **one JSON object as the last line of `stdout`**.
Every other line on `stdout` or `stderr` is captured as a log. Print diagnostics to `stderr` and
emit the JSON result last, with nothing after it.

{{ comp.tabbedCode({ tabs: [
  {
    label: "score.py",
    lang: "python",
    code: "# scripts/score.py\nimport json, os, sys\n\n# Input arrives as argv + env in this example.\nthreshold = float(sys.argv[sys.argv.index('--threshold') + 1])\nmodel_path = os.environ['MODEL_PATH']\n\n# ... do the work ...\nscored = {'kept': 42, 'dropped': 3, 'threshold': threshold}\n\n# Diagnostics go to stderr; the result is the LAST stdout line and must be a\n# single JSON OBJECT (not an array) to populate result.result.\nprint('scoring complete', file=sys.stderr)\nprint(json.dumps(scored))"
  },
  {
    label: "rotate-logs.sh",
    lang: "bash",
    code: "#!/usr/bin/env bash\n# scripts/rotate-logs.sh\nset -euo pipefail\n\nkeep=\"${2:-7}\"\n# ... rotate ...\necho \"rotated logs, keeping ${keep}\" >&2   # diagnostics -> stderr\n\n# Last stdout line = JSON object result. Non-python runtimes are not -u'd, so\n# flush by emitting the JSON as the final write with nothing after it.\nprintf '{\"rotated\": true, \"kept\": %s}\\n' \"$keep\""
  }
] }) }}

> [!TIP]
> To pass private input without putting it in arguments or the environment, use `.stdin(...)` or
> `options.stdin`. [Send private input on stdin](/background-processing/polyglot-tasks/#send-private-input-on-stdin)
> covers the size limit, the errors and the queue-dispatch rules.

## Step 3 — Run the task with the workers CLI

`ns-workers run-task` resolves the generated task metadata and delegates to the
`MultiRuntimeTaskExecutor` that the worker runtime uses. Pass arguments and environment as JSON.
`stdout` and `stderr` stream while the subprocess runs, then the CLI prints the complete
`TaskResult`.

```sh
ns-workers run-task score-batch \
  --args='["--threshold","0.8"]' \
  --env='{"MODEL_PATH":"./models/scorer.pkl"}' \
  --timeout=120000 \
  --json
```

For runtime integrations and custom adapters, call `createDefaultTaskExecutor()` directly.

## Step 4 — Sandbox a Deno task

The `deno` runtime is the only one NetScript sandboxes: `.permissions({...})` becomes `--allow-*`
flags on the `deno run` command line.

```ts
// workers/tasks/parse-feed.ts — a sandboxed deno task (least privilege)
import { defineTask } from '@netscript/plugin-workers-core/builders';

export const parseFeed = defineTask('parse-feed')
  .runtime('deno') // the default; shown here for clarity
  .entrypoint('./scripts/parse-feed.ts')
  .permissions({
    net: ['api.example.com'], // -> --allow-net=api.example.com
    read: ['./feeds'],        // -> --allow-read=./feeds
    write: false,
    env: ['FEED_TOKEN'],      // -> --allow-env=FEED_TOKEN
  })
  .build();

// Spawns: deno run --allow-net=api.example.com --allow-read=./feeds --allow-env=FEED_TOKEN ./scripts/parse-feed.ts
```

> [!CAUTION]
> A `deno` task built without `.permissions(...)` runs with `--allow-all`. Pass an explicit,
> least-privilege set for untrusted or third-party Deno task code. The `permissions` presets
> (`permissions.readOnly`, `.network`, `.none`, …) are ready-made starting points; see
> [Restrict worker task permissions](/background-processing/how-to/restrict-worker-task-permissions/).

## Troubleshooting

- **`result.result` is `null` but the task succeeded:** something followed the JSON object on
  `stdout`, or the last line is not a single JSON object. See Step 2.
- **Exit code `127` or `126`:** the interpreter is missing (*command not found*) or not executable
  (*command not executable*). Both land in `result.error` with the first `stderr` line appended; a
  missing interpreter fails the task rather than throwing.
- **Status `timeout`, exit code `-1`:** the task exceeded its `timeout`.
- **Status `cancelled` before any process starts:** the call received an already-aborted `signal`.
- **A `cmd` task fails outside Windows:** `cmd` is Windows-only. The `powershell` runtime spawns
  `powershell` on Windows and `pwsh` elsewhere.

## Production notes

> [!CAUTION]
> **Non-Deno runtimes are not sandboxed.** Python, shell and custom executables run with the full OS
> privileges of the worker host, and `.permissions(...)` has no effect on them; NetScript leaves
> process sandboxing to the operating system or container platform. Pin entrypoints to verified
> scripts, use isolated virtual environments such as `pythonConfig.venvPath`, and secure the host or
> container runtime.

<!-- caveat: arch-debt:workers-non-deno-task-sandbox-boundary -->

## Next steps

Lock down every Deno task you ship with
[Restrict worker task permissions](/background-processing/how-to/restrict-worker-task-permissions/).

- [Polyglot tasks](/background-processing/polyglot-tasks/): the task model and the input and output
  contract.
- [Add a task runtime adapter](/background-processing/how-to/add-a-task-runtime-adapter/): run a
  runtime NetScript does not ship.
- {{ comp.xref({ key: "ref:workers", text: "workers reference" }) }}

{{ comp.nextPrev({ prev: { label: "Tune the worker runtime", href: "/background-processing/how-to/tune-worker-runtime/" }, next: { label: "Graceful shutdown", href: "/orchestration-runtime/how-to/graceful-shutdown/" } }) }}
