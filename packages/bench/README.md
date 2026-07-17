# @netscript/bench

**The NetScript self-bench instrument: measure how effectively a coding agent builds a working
NetScript service in an isolated sandbox.**

The clean-architecture harness drives an agent through a task, runs a frozen black-box HTTP suite
after every turn, and scores the attempt on four axes.

> **Status.** This package ships the full instrument architecture, validated end-to-end by unit
> tests with a deterministic **fake driver**. Committed golden references cover `t1-storefront-api`
> and `t2-saga-queue-cron`; the real **conformance** gate boots both and runs their frozen suites
> green over HTTP. Only the live paid agent run (`bench self` without `--fake`) remains gated
> pending the cost/key/cadence decision (OQ2). `publish: false`.

## Protocol

1. A **task** (`tasks/t1-storefront-api/`, `tasks/t2-saga-queue-cron/`) provides an agent-facing
   `prompt.md`, per-lane `context/AGENTS.md` guidance, a provisional `rubric.md`, and a **frozen**
   `tests/frozen-suite.ts` the agent never sees.
2. The runner provisions a throwaway **sandbox** in the OS temp area (never the in-tree `.llm/tmp`)
   and seeds it with the agent-visible files only — the frozen suite and any golden reference are
   withheld.
3. The **agent driver** yields assistant **turns**. A turn is one assistant message boundary,
   tool-round inclusive.
4. After each turn the **test runner** boots the candidate service and runs the frozen suite once,
   recording the aggregate result.
5. The loop stops at the first fully-green suite, or at the turn/wall caps.
6. The **scorer** normalizes each metric against fixed anchors, weights it by the active preset, and
   emits a composite. **Reporters** persist a light scored summary (committed) and a heavy raw trace
   (gitignored).

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
out of the scored axes until Slice 5, so a Slice-1 composite is **provisional** and sums to 0.80 by
design. The `encore-parity` preset drops the reserve and tilts toward efficiency.

Cost is priced from a pinned per-model table (`bench.config.ts`), grounded in the `claude-api`
reference (Opus 4.8 = \$5/\$25 per 1M in/out; cache reads ~0.1×, writes ~1.25×). The instrument
never fabricates pricing.

## Persistence & confounds

- Tasks persist via `@netscript/kv` (`getKv()`), **not** the relational DB layer — the bench
  deliberately does not touch DB wiring (owned separately, #313).
- **Alpha-corpus confound.** Runs are only comparable when the `RunManifest` pins match: model id,
  Claude Code version, NetScript/Deno/lockfile versions, seed, and weight preset. The framework is
  pre-1.0 and moving fast; a score is a reading of _one pinned corpus state_, not an absolute. Never
  compare across differing manifests.
- A summary flagged `fake` is a pipeline proof, not a benchmark result.

## Run modes

```bash
# Pipeline proof — deterministic fake driver, no API key, no service.
deno task cli self --fake

# Live self-bench — pinned model, real Claude Code (gated pending OQ2).
deno task cli self

# Conformance — key-free gate: boots each golden reference, runs both frozen
# suites green over HTTP (with real KV-preserving restarts).
deno task cli conformance
```

## Reproduce

```bash
# From packages/bench:
deno task check      # type-check mod.ts, cli.ts, bench.config.ts
deno task test       # unit tests (fake-driver validated)
deno task cli self --fake
```

The scored summary schema, the frozen-suite contract, and the port seams are the stable surface; see
`mod.ts`. The whole package is self-contained (no `@netscript/cli-e2e` cross-imports) so it can be
lifted to a standalone public repo if the program calls for it.

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

## Deferred

Live `bench self` agent path (API-key gated pending OQ2), N-repeats, and the composite rubric axis
(Slice 5).
