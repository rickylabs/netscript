use harness

# PR-D follow-up — the consumer bundle ships an unresolvable import

You are continuing the **same leaf** (`fix/1549-quality-scan-provable-half`, PR #1596) in the **same worktree**.
This is a correction to work you already landed, dispatched after the automatic IMPL-EVAL on head `7264ce6aa`
went terminal. Everything already merged in this PR stands — the defect is one missing capability in the
consumer-bundle generator, plus the guard that makes the class non-recurring.

Do **not** revert the extractor consumption. Consuming `.llm/tools/docs/snippet-extractor.ts` instead of forking
a second fence parser is rail decision **R-10** and stays.

## Identity

| Field | Value |
| --- | --- |
| Worktree | `/home/codex/repos/ns006-scanrail` (unchanged) |
| Branch | `fix/1549-quality-scan-provable-half` (unchanged) |
| PR | **#1596** — already open, currently non-draft |
| Base | current `origin/main` — **re-sync before you start**; it has moved |
| Slice dir | `.llm/runs/release-0.0.6-internals--orchestration/slices/pr-d-1549/` |
| Route | Codex · gpt-5.6-sol · **medium** (a manifest schema decision, not a mechanical edit) |

## The defect, already reproduced — do not re-investigate

`packages/cli/src/public/features/agent/init/init-agent_test.ts:580`
("installed consumer tools resolve from the project when process CWD differs") fails: the installed
`quality/scan-code-quality.ts --help` exits 1.

```text
error: Module not found "file:///tmp/…/docs/snippet-extractor.ts".
    at file:///tmp/…/quality/scan-code-quality.ts:2:37

bundled paths: ["consumer-tools.json","README.md","release.json","run-deno-check.ts","run-deno-lint.ts",
  "run-deno-doc-lint.ts","validation/check-aspire-host-ports.ts","quality/scan-code-quality.ts",
  "deps/outdated.ts","deps/why.ts","e2e/scaffold-e2e-test.ts"]
```

`renderAgentToolEmbeddedContent()` in `.llm/tools/generate-cli-assets-barrel.ts` bundles **exactly** what
`.llm/tools/consumer-tools.json` enumerates, with **no transitive import resolution**:

```ts
for (const tool of manifest.tools) {
  files[tool.path] = await Deno.readTextFile(new URL(`../../${tool.source}`, import.meta.url));
}
```

Your scanner's line 2 import is therefore embedded but unsatisfiable in the installed tree.

## Why the obvious fix is wrong

Adding `.llm/tools/docs/snippet-extractor.ts` to `tools` would work and is **rejected**: every `tools` entry is
a runnable diagnostic carrying a `symptom` and a `permissions` list, and is surfaced to consumers as a command.
The extractor is a **library module**. Misfiling it means inventing a `symptom` for something a consumer can
never usefully run, and polluting the tool listing.

`supportFiles` is also wrong — that is bundle metadata (`consumer-tools.json`, `README.md`, `release.json`).

## Contract

### C1 — a third manifest category for bundled module dependencies

Add one, named for what it is (e.g. `modules`), holding `{ source, path }` pairs. Requirements:

- included in the embedded file set, so the relative import resolves in the installed tree;
- included in the canonical **ordered-path hash** — a bundle whose content changes must change its hash, or
  the hash stops being a bundle identity;
- **excluded** from the runnable tool surface: not listed as a consumer command, no `symptom`, no
  `permissions`;
- `schemaVersion` handled deliberately. Decide whether this is a compatible addition or a version bump, state
  which and why in your slice `worklog.md`, and make any reader of the manifest agree with your decision.

Then register the extractor as `{ source: '.llm/tools/docs/snippet-extractor.ts', path: 'docs/snippet-extractor.ts' }`
so `../docs/snippet-extractor.ts` resolves from `quality/`.

### C2 — the guard that makes this class non-recurring (the real deliverable)

A test asserting that **every relative import of every bundled file resolves to a bundled path**. Derive it
from the bundle itself — scan each embedded file's import specifiers, resolve each relative one against its own
bundled path, and assert the target is present in the bundle.

It must have a **negative control**: with a required module omitted, the test fails. Prove that before you make
it pass. A closure test that cannot fail is worth nothing, and this lane has already shipped one test whose
expectation was computed by calling the function under test (PLAN-EVAL cycle 3 caught it) — do not repeat that.

Do **not** implement this by hardcoding "the scanner needs the extractor". The next tool to grow an import must
be caught without anyone remembering to update a list.

### C3 — the end-to-end proof is executing the installed bundle

The property that matters is what a consumer does: install the bundle and run the tool. Prove it by installing
`EMBEDDED_AGENT_TOOL_FILES` to a temp dir and executing each runnable tool's `--help`, asserting exit 0.

This is the gate my brief got wrong and is worth stating plainly: `gen:assets-barrel` + an empty
`git status` proves the barrel is **current with respect to the manifest**; it does **not** prove the bundle is
**complete with respect to its own imports**. It passed twice here while the bundle was broken. If
`init-agent_test.ts:580` already provides adequate end-to-end coverage, say so and do not duplicate it — extend
it if it only covers one tool.

### C4 — nothing else changes

No revert of the extractor consumption; no second fence parser; no change to the scanner's rules, `--max-allow`
wiring, the docs-fence behaviour, or the budget-link workflow step. `allowCount` stays at **8** and the repo
scan stays green.

## Gates — paste real output with exit codes

| # | Gate | Command |
| --- | --- | --- |
| 1 | the failing test now passes | `deno test --allow-all packages/cli/src/public/features/agent/init/init-agent_test.ts` |
| 2 | closure guard + negative control | your new test, **plus** pasted proof of the control failing before the fix |
| 3 | generator tests | `deno test --allow-read --allow-env --allow-write --allow-run .llm/tools/` for the generator's own suite |
| 4 | quality + docs tool tests | `deno test --allow-read --allow-env --allow-write --allow-run .llm/tools/quality/ .llm/tools/docs/` |
| 5 | barrel **currency** | `deno task gen:assets-barrel`, then `git status --porcelain` empty |
| 6 | barrel **closure** | install the bundle to a temp dir; every runnable tool's `--help` exits 0 |
| 7 | repo scan unchanged | `deno task quality:scan:repo` exit 0, `allowCount` still **8** |
| 8 | doctrine gates | `deno task arch:check` and `deno task arch:check:repo` — both exit 0 |
| 9 | scoped check/lint/fmt | wrappers over the roots you actually touched |

Gates 5 and 6 are **different gates**. Running only 5 is what let this defect through.

## Boundaries

- Touch `.llm/tools/consumer-tools.json`, `.llm/tools/generate-cli-assets-barrel.ts`, its test surface, the
  regenerated `packages/cli/src/kernel/assets/agent-tools.generated.ts`, and your slice dir.
- `packages/cli/src/public/features/agent/init/**` only if the end-to-end coverage in C3 genuinely belongs
  there; prefer extending the existing test over adding a parallel one.
- Do **not** modify `.llm/tools/docs/snippet-extractor.ts` — still a consumer of it.
- Do **not** add `deno-lint-ignore`, `@ts-ignore`, `as any`, `as unknown as`, or a new `quality-allow:`.
- Do **not** flip to ready, relabel, or merge. The orchestrator owns the ready-flip that re-triggers IMPL-EVAL
  exactly once.

## Escalate instead of going idle

If a contract here is wrong, say so and stop — on this lane escalation has found the orchestrator's brief or
plan wrong **six** times, most recently the self-contradictory boundary list in your own previous brief. The
gate error that produced this very defect was mine too: I wrote the currency half of the barrel gate and
omitted the closure half. Raising a contradiction is the expected behaviour.
