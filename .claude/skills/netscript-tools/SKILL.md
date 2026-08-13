---
name: netscript-tools
description: NetScript repository tooling and validation guide. Use whenever a task involves repo-native Deno wrappers, rtk, raw git verification, gate evidence, PR comments, OpenHands automation, lock hygiene, root check/lint/fmt wrappers, doc-lint, publish dry-run, JSR audits, worktree synchronization, or deciding which command is a trustworthy verdict source.
---

# NetScript Tools

Use this skill when choosing commands or recording validation evidence in the NetScript repo. The
goal is to avoid false green gates, stale git reads, and stale automation comments.

## Tool Locations

Use `.llm/tools/` for harness, evaluator, agent, and package-quality helper scripts. Fitness gates
live under `.llm/tools/fitness/`; keep new doctrine, standards, JSR, and release-readiness helpers
there unless they are product-facing CLI features.

Use `tools/` only for reusable product/repository tooling that should ship as part of the public
developer surface. Do not create a parallel fitness tree outside `.llm/tools/`.

## Git And Status

RTK can cache read-heavy git output. For ground-truth branch state, spawn git directly:

```powershell
deno eval 'const p = new Deno.Command("git", { args: ["status", "--short"] }).outputSync(); await Deno.stdout.write(p.stdout); await Deno.stderr.write(p.stderr); Deno.exit(p.code);'
deno eval 'const p = new Deno.Command("git", { args: ["ls-remote", "origin", "refs/heads/<branch>"] }).outputSync(); await Deno.stdout.write(p.stdout); await Deno.stderr.write(p.stderr); Deno.exit(p.code);'
```

Use `rtk` for exploratory read-heavy commands when token reduction matters. Do not use filtered RTK
output as the sole PASS/FAIL source for gates.

## Validation Wrappers

### Durable gate receipts

For CI or long-lived harness workers, invoke allowlisted gates through
`.llm/tools/gates/run-gate.ts`; do not redirect an ad-hoc command and call the log a receipt. The
runner records the exact argv/cwd, immutable Git head, request hash, attempt, timing, real
exit/signal, and bounded hashed output, then atomically replaces one JSON receipt. Same
invocation-ID/same-hash calls share one lifecycle-local promise; ID reuse with another hash and
capacity exhaustion fail closed. This is at-most-once only within the live broker lifecycle, not a
distributed or crash-safe execution lock.

The runner resolves the repository's actual `HEAD` itself. A caller-supplied `--git-head` must
match; `--allow-git-head-mismatch <reason>` exists only for explicit diagnostic fixtures and records
both values. Such a receipt cannot satisfy an evidence set. Receipts attest that one process ran in
one working tree at the recorded commit; they do not attest remote branch currency, source-tree
cleanliness, semantic gate sufficiency, or publication. Those remain separate gates.

`PASS` certifies only the named command. Sufficiency is recomputed from exact receipts; never trust
or hand-edit a `sufficiency` string. Duplicate gate IDs, duplicate receipt IDs, contradictory
receipts, `SKIPPED`, `NOT_RUN`, missing/nonterminal receipts, or an immutable-head mismatch are
insufficient. Package/plugin evidence also needs `quality-gate`, dependency evidence, and the
applicable JSR audit. E2E tools keep their domain JSON reports; reference them with `--child-report`
instead of double-wrapping or replacing them. A declared child report is part of the verdict: it
must be freshly written, parse as JSON, and is hashed into the receipt. Missing, malformed, or stale
child reports fail closed.

**MANDATE (harness runs).** TS type-check / test / lint / format gate **evidence MUST come from the
structured wrappers** — `.llm/tools/run-deno-check.ts`, `.llm/tools/run-deno-test.ts`,
`.llm/tools/run-deno-lint.ts`, and `.llm/tools/run-deno-fmt.ts` (invoked directly, or through the
`deno task check|test|lint|fmt:check` aliases that already wrap them). Raw root `deno check .` /
`deno fmt --check` / `deno lint` over the repo is **not a verdict source**: it walks Markdown,
generated output, scratch workspaces, and future-wave packages, producing false reds/greens. Use
these wrappers for package/plugin quality checks:

```powershell
deno task check
deno task test
deno task lint
deno task fmt:check
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root <path> --ext ts,tsx
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all <test-path>
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root <path> --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root <path> --ext ts,tsx
```

The source wrappers accept roots, extensions, include/exclude filters, and batching; the test
wrapper accepts native test arguments after `--`. All emit structured compact output.
Package-quality formatting gates target source TypeScript only (`--ext ts,tsx`) and exclude
generated output, scratch workspaces, and future-wave packages. All scoped wrappers fail closed when
their own selection is empty. Check/test/lint/fmt child crashes must appear structurally in JSON,
test failures are grouped without losing affected test locations, and doc-lint preserves its child
exit code; an empty findings array is not a PASS when a child failed.

**Code-quality gate (required for `packages/**`/`plugins/**` waves).** The scoped check/lint/fmt
wrappers above are necessary but NOT sufficient: they pass code containing `any`, honor an inline
`// deno-lint-ignore no-explicit-any`, and do not flag host-side hardcoded plugin-name coupling —
the two doctrine violations that reached `main` in the beta.9 CLI wave (#745). Run
`deno task
quality:gate` (which chains `deno task quality:scan` + `deno task arch:check`) on any
framework-wave slice; `deno task quality:scan:repo` audits the whole `packages/cli/src`+`plugins`
surface. The scanner (`.llm/tools/quality/scan-code-quality.ts`) fails on
`any`/`as unknown as`/`as any`, blanket `no-explicit-any` ignores, and host-side plugin-name checks;
the only suppression is an inline `// quality-allow: <reason>` on the offending line (reason
required, count reported, `--max-allow <n>` bounds it). CI mirrors this in `code-quality.yml`. A
green scoped wrapper is never a substitute for `quality:gate` on framework source.

## Dependency Evidence

**MANDATE (harness runs).** Any "is this the latest / is this outdated / is this import dead / does
the published surface install / any advisories" question MUST be answered through the
`.llm/tools/deps/*` wrappers, exposed as `deno task deps:latest|outdated|why|audit|prod-install` —
never a hand-rolled registry `curl`, and never `deno outdated --latest` for "latest" (it ignores
semver and surfaces pre-release tags as latest). The canonical command map, the
`deno outdated
--latest` trap rationale, and the `catalog:` npm-only law live once in the
**netscript-deno-toolchain** skill — read it there; this skill does not restate those gotchas.

For targeted `deno check` commands that touch workspace code, include `--unstable-kv`:

```powershell
deno check --unstable-kv packages/<pkg>/mod.ts
```

Do not run mutating root `deno task fmt` unless the user explicitly asks for repo-wide formatting
changes. Use scoped formatting for owned files only.

## Publish And Docs

Release automation keeps volatile JSR management endpoints in
`.llm/tools/release/config/endpoints.ts`; the non-agentic suite maintenance map is in
`.llm/tools/README.md`. Change the config value, not individual release feature modules.

Package publishability gates commonly use:

```powershell
deno doc --lint packages/<pkg>/mod.ts
deno task doc:lint --root packages/<pkg> --pretty
deno publish --dry-run --allow-dirty
deno run --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/<pkg> --text
```

`deno task doc:lint` wraps `.llm/tools/run-deno-doc-lint.ts` — the structured runner for the
`deno doc --lint` publish bar. Prefer it when the raw `deno doc --lint` output is too noisy to
attribute per-entrypoint/per-file: it auto-discovers entrypoints from `deno.json` exports (lint the
**full export map**, not `mod.ts` alone, or sibling re-exports false-flag) and emits grouped JSON
with per-file attribution.

Run `deno publish --dry-run --allow-dirty` from the package directory unless the checked-in task or
plan says otherwise. Treat raw dry-run output as authoritative for slow types; helper scripts may
overcount banner text.

## OpenHands And PR Comments

The `gh` CLI is not reliably available. Use GitHub MCP tools for PR comments. For OpenHands, comment
on the PR with the exact trigger text needed for the run. The persistent
`<!-- openhands-agent-summary -->` comment can be stale; trust committed artifacts like
`plan-eval.md`, `evaluate.md`, and run logs over the summary comment.

When posting automation requests, specify:

- exact one-pass command
- repository root as working directory
- raw exit code requirement
- lock hygiene: do not commit `deno.lock` or source churn unless a reviewed fix requires it

## Supervisor Automation (agentic tools)

### Resource-hygiene symptoms

If a run failed and you do not know what is still running, `behavior.service-health` timed out,
ports are already in use, or a `postgres-*` container exists that you did not start, begin with the
read-only `deno task agentic:leak-check -- --slice-dir <run-dir> --worktree <worktree>`. It reports
owned, foreign, and unknown-owner resources. `deno task agentic:teardown -- ...` is dry-run by
default; `--apply` is explicit and can act only on positively proven run-owned resources.

Use `deno task agentic:dogfood-skills` to install the local CLI's current consumer bundle into
`.agents/generated/consumer-skills/`; never fork that bundle by hand.

The supervisor drives Tier-D Codex and Tier-E OpenHands through `.llm/tools/agentic/*`, each exposed
as an `agentic:*` `deno task` (see `deno.json` and the index in `.llm/harness/workflow/tooling.md`).
Two are durable GitHub infra utilities worth calling out:

- **`gh-watch.ts`** (`deno task agentic:gh-watch --pr <n>`) — token-free CI/verdict watch. Run it as
  a **background** process: it polls a PR's OpenHands IMPL/PLAN-EVAL summary comment (and, with
  `--run-id`, the triggered Actions run) until the state is terminal, then exits — re-waking the
  supervisor turn without a polling loop kept in context. Exit codes: `0` PASS · `10` FAIL · `12`
  final-no-verdict · `13` action-run-failed · `2` timeout · `4` no-token. Use it whenever you have
  dispatched an evaluator and must wait for the verdict.
- **`gh-token.ts`** (`deno task agentic:gh-token check|store`) — durable GitHub-token
  resolver/store. `check` resolves a token from any healthy source (env candidates → `gh auth token`
  Windows/WSL → bounded GCM `git credential fill`), validates it against `GET /user`, and reports
  only the source + login (never the token). `store` reads ONE PAT from stdin and persists it to
  every durable place (Windows GCM + WSL `gh`) so later sessions auto-resolve. Use `check` at the
  start of any GitHub session; use `store` once when the supervisor's token is missing/rotated.

The desired-state runtime controller is the default health/repair entry point:
`deno task agentic:runtime doctor|status` for inspect-only environment/session snapshots, and
`deno task agentic:runtime repair codex-remote --worktree <path> [--dry-run]` for planned,
session-safe Codex daemon repair. `deno task agentic:routing-state` reads the persisted
quota-fallback routing state.

The rest of the family (`launch-codex-slice`, `codex-resume`, `codex-status`, `codex-watch`,
`dispatch-openhands`, `openhands-status`, `gh-pr`) is indexed in `.llm/harness/workflow/tooling.md`.
`.llm/tools/agentic/` is the **only** interface for driving Codex — never ad-hoc `wsl.exe`. The
suite is concern-grouped (`codex/`, `openhands/`, `github/`, `wsl/`, `claude/`, `runtime/` +
`runtime/cli/`, `lib/`); its `README.md` is the canonical map.

**Monthly maintenance (single source):** everything volatile lives in `.llm/tools/agentic/config/` —
model ids in `config/models.ts`, tool versions in `config/versions.ts`, endpoints in
`config/endpoints.ts`; routing lane→model bindings stay in `runtime/routing-policy.ts` (referencing
the config ids). The "Maintenance map" table in the suite README says exactly where to change a
model, version, policy, agent, or dep. A guard test (`config/no-hardcoded-volatile_test.ts`) fails
the suite if any of these values is hardcoded outside `config/`.

## Lock Hygiene

Do not delete lock files or caches. Do not run `deno cache --reload` without approval. If automation
or validation mutates `deno.lock`, inspect the diff against the true branch base before accepting
it. PLAN-EVAL should not commit lock churn.

## Worktree Sync

If push rejects due to a remote-only evaluator/bot commit, inspect the remote commit before
integrating:

```powershell
deno eval 'const p = new Deno.Command("git", { args: ["show", "--stat", "--oneline", "--name-status", "origin/<branch>"] }).outputSync(); await Deno.stdout.write(p.stdout); await Deno.stderr.write(p.stderr); Deno.exit(p.code);'
```

If the remote commit is unrelated and the local commit should sit on top, use a normal rebase onto
`origin/<branch>` and push. Do not discard user or bot commits.

## Common Gotchas

- `deno task check:packages` and `deno task check:plugins` may not exist; inspect root `deno.json`
  and use the available wrapper plus focused checks.
- Raw root `deno fmt --check` can include generated/scratch/future-wave files. Prefer scoped wrapper
  verdicts.
- `deno check .` can walk generated caches and deferred package surfaces. Prefer explicit roots and
  entrypoints.
- OpenHands may commit `deno.lock` churn; inspect before merging.
- The final full scaffold/plugins E2E command lives in the `netscript-cli` skill.
