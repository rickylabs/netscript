use harness

## SKILL

Run under `netscript-harness` + `netscript-doctrine` + `netscript-tools` (+ `netscript-cli` for the
CLI surface). Read `AGENTS.md` and the relevant doctrine before changing framework code. If a skill
is not mirrored into `.claude/skills/`, read `.agents/skills/<name>/SKILL.md` directly.

You are a **Tier-D implementation lane**. You do not self-certify: a separate opposite-family session
reviews this slice. Commit and push your branch; do **not** open a PR and do **not** merge.

# Slice brief — #762: `@ts-*` / `as never` / unsafe-cast sweep → flip repo-drift CI to blocking

**Worktree:** `/home/codex/repos/b10-762-tssweep`
**Branch:** `quality/762-ts-ignore-sweep` (base: `feat/beta10-integration` @ `6c0dd587`)
**Issue:** #762 (`type:chore`, `area:tooling`, `priority:p2`, milestone `0.0.1-beta.10`)

## Current, measured baseline (do not re-derive — but do re-run to confirm)

```bash
deno run --allow-read --allow-run .llm/tools/quality/scan-code-quality.ts --root packages --root plugins
```

→ **36 findings, 8 existing allowances**:

| Rule | Count |
| --- | --- |
| `unsafe-cast` (`as never`, `as unknown as`) | 32 |
| `ts-error-suppression` (`@ts-ignore` / `@ts-expect-error`) | 3 |
| `explicit-any-ignore` (`// deno-lint-ignore no-explicit-any`) | 1 |

Concentrated in: `packages/fresh` (TanStack Query generics, Fresh static middleware, AI stream
proxy), `packages/plugin-sagas-core` (builder phase-transition `this` casts, oRPC error contracts,
stream schemas, Redis/list transports), `packages/plugin-streams-core` (`import.meta.env`, stream
schema builders), `packages/plugin-triggers-core` (oRPC error contract, inline processor),
`plugins/streams`, `plugins/triggers`.

Note the default `deno task quality:scan` scans a **narrower** set (`packages/cli/src` + `plugins`)
and reports only 2 findings. The issue's acceptance is the **wider** roots above. Check which scope
`code-quality.yml`'s repo-drift job actually runs before you flip it, and make the scope you make
green be the scope the gate enforces — otherwise the flip is theatre.

## Goal

`--root packages --root plugins` → **0 findings**, with reasoned allowances only. Then flip
`code-quality.yml`'s repo-drift job from `continue-on-error: true` to blocking.

## The bar (this is the whole point of the issue)

**Type them. Do not launder them.** The failure mode this issue exists to prevent is swapping one
suppression for another:

- A new `// quality-allow:` on something that is genuinely typeable is a **review-blocking finding**,
  not a pass.
- Same for a fresh `// deno-lint-ignore`, a widened `any`, or converting `as never` into
  `as unknown as X` to slip the regex. The scanner catches `as unknown as` too.
- An allowance is legitimate **only** when the cast is irreducible because an *upstream* type is
  wrong or missing — e.g. the Deno `duplex` `RequestInit` gap
  (`plugins/streams/services/src/proxy.ts:180`, `packages/fresh/src/runtime/ai/stream-proxy.ts:199`).
  Those are the model: a one-line reason naming *which upstream type* is deficient and why we cannot
  fix it locally.

Prior art to imitate: PR #756 (`quality(workers-core)`) typed ~50 casts down to 0 by fixing the
contracts and builders rather than annotating them. Read that diff before starting — it is the
reference for what "typed, not suppressed" looks like in this codebase, especially for the builder
phase-transition `this` casts, which recur almost identically in `plugin-sagas-core`'s
`define-saga.ts`.

## Sequencing

Commit **per package**, not one monolith — `packages/fresh`, `packages/plugin-sagas-core`,
`packages/plugin-streams-core`, `packages/plugin-triggers-core`, `plugins/*`, then the CI flip as its
own final commit. If a package turns out to need a genuine contract change, say so rather than
forcing it.

The CI flip is **last** and only once the scan is green — do not flip a gate that would immediately
fail.

## Boundaries

- Do **not** touch `plugins/dashboard`, `tools/design-sync/`, or any dashboard/DDX issue.
- Do **not** modify `packages/mcp/tests/fixtures/**` (intentionally malformed; already excluded from
  lint/fmt selections).
- Do **not** change `.llm/tools/run-deno-lint.ts` / `run-deno-fmt.ts` or their task definitions —
  they were just fixed on another branch and will conflict.
- Do not delete or skip tests to make the scan green. If a test must change, justify it in the PR.

## Gates (run before you report)

```bash
deno run --allow-read --allow-run .llm/tools/quality/scan-code-quality.ts --root packages --root plugins
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages --root plugins --ext ts,tsx
deno task lint
deno task fmt:check
deno task test
deno task arch:check
```

`deno task check`/`test` must stay green — a typed cast that breaks a consumer is not a fix.

## Report back

Commit, push the branch, and report: per-package counts before/after, every allowance you added with
its justification, the repo-drift scope you verified, gate verdicts, and anything that contradicts
this brief. Do **not** open a PR and do **not** merge. Do not self-certify — a separate session
reviews this.
