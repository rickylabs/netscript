# @netscript/bench

**The NetScript self-bench instrument: measure how effectively a coding agent builds a working
NetScript service in an isolated sandbox.**

The clean-architecture runner drives an agent through a task, runs a frozen black-box HTTP suite
after every turn, and scores the attempt on four axes. This package is an internal instrument — it
is not published to JSR (`publish: false` in its `deno.json`) and is consumed only from inside the
NetScript repository.

> **Status.** The full instrument architecture ships here, validated end-to-end by unit tests with a
> deterministic **fake driver**. Committed golden references cover `t1-storefront-api` and
> `t2-saga-queue-cron`; the real **conformance** gate boots both and runs their frozen suites green
> over HTTP. Only the live paid agent run (`bench self` without `--fake`) remains gated pending a
> cost/key/cadence decision.

## Why it exists

- **Black-box scoring** — the agent never sees the frozen suite or the golden reference; only the
  agent-facing prompt and guidance are seeded into the sandbox.
- **Turn-resolved signal** — the suite runs after every assistant turn, so the score captures how
  fast an attempt converges, not just whether it finishes.
- **Pinned, comparable runs** — a `RunManifest` pins model id, agent tooling version, and
  NetScript/Deno/lockfile versions; runs are only comparable when the pins match. The framework is
  pre-1.0 and moving fast, so a score is a reading of one pinned corpus state, not an absolute.
- **Honest cost accounting** — cost is priced from a pinned per-model table in `bench.config.ts`;
  the instrument never fabricates pricing.

## Protocol

1. A **task** (`tasks/t1-storefront-api/`, `tasks/t2-saga-queue-cron/`) provides an agent-facing
   `prompt.md`, per-lane guidance, a provisional `rubric.md`, and a **frozen**
   `tests/frozen-suite.ts` the agent never sees.
2. The runner provisions a throwaway **sandbox** in the OS temp area and seeds it with the
   agent-visible files only — the frozen suite and any golden reference are withheld.
3. The **agent driver** yields assistant **turns**. A turn is one assistant message boundary,
   tool-round inclusive.
4. After each turn the **test runner** boots the candidate service and runs the frozen suite once,
   recording the aggregate result.
5. The loop stops at the first fully-green suite, or at the turn/wall caps.
6. The **scorer** normalizes each metric against fixed anchors, weights it by the active preset, and
   emits a composite. **Reporters** persist a light scored summary (committed to `results/`) and a
   heavy raw trace (gitignored).

## Metrics

| Metric           | Direction | Anchor (worst → best) | Default weight |
| ---------------- | --------- | --------------------- | -------------- |
| `test_pass_rate` | higher    | 0 → 1                 | 0.45           |
| `turns_to_green` | lower     | 80 → 5                | 0.15           |
| `cost` (USD)     | lower     | \$2.00 → \$0.05       | 0.10           |
| `wall_seconds`   | lower     | 900 → 60              | 0.10           |
| `lines_of_code`  | —         | report-only           | 0.00           |

`turns_to_green` is the 1-based turn count at which the suite first goes fully green, or `null`
(scores 0) if it never does within the caps. The `default` preset holds a **0.20 rubric reserve**
out of the scored axes until the rubric axis lands, so a composite is **provisional** and sums to
0.80 by design. The `encore-parity` preset drops the reserve and tilts toward efficiency.

Tasks persist via `@netscript/kv` (`getKv()`), **not** the relational DB layer — the bench
deliberately does not touch DB wiring. A summary flagged `fake` is a pipeline proof, not a benchmark
result.

## Quick example

```bash
# From packages/bench:

# Pipeline proof — deterministic fake driver, no API key, no service.
deno task cli self --fake

# Conformance — key-free gate: boots each golden reference, runs both frozen
# suites green over HTTP (with real KV-preserving restarts).
deno task cli conformance

# Type-check and unit tests.
deno task check
deno task test
```

The fake run prints a scored summary table per task (composite, pass rate, turns-to-green, cost)
flagged as a fake-driver pipeline proof. The live self-bench (`deno task cli self`) uses a pinned
model and real agent tooling and stays gated as noted above.

## Architecture

```
src/
  domain/       readonly types + pure helpers (metrics, scoring, manifest, artifacts)
  ports/        interface seams (AgentDriver, SandboxProvider, TestRunner, …)
  adapters/     agent (claude-code, fake), sandbox, test-runner, http, reporting
  application/  runner (turn accounting), scoring (normalizer + scorer), builders
  presentation/ cli
tasks/          task specs + frozen suites (t1 storefront; t2 saga/queue/cron)
results/        committed scored summaries
```

The scored summary schema, the frozen-suite contract, and the port seams are the stable surface; see
`mod.ts` (root export) and `./config` (`bench.config.ts`). The package is self-contained — no
cross-imports from other internal test tooling — so it can be lifted to a standalone repository if
the program calls for it.

## Docs

- **Positioning and scope**: [POSITIONING.md](./POSITIONING.md)
- **Task specs**: [tasks/](./tasks/)
- **Committed scored summaries**: [results/](./results/)

## Compatibility

Internal to the NetScript repository; requires Deno 2+ with `--unstable-kv` (the tasks persist via
`@netscript/kv`). Deferred: the live paid agent path, N-repeat runs, and the composite rubric axis.

## License

Apache-2.0 — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Not published
to JSR.
