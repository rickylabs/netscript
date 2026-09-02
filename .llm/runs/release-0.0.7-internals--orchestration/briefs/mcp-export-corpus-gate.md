use harness

## SKILL

Load `netscript-harness`, `netscript-tools`, `netscript-deno-toolchain`, `netscript-pr`, and `rtk`.

# Implementation brief — #1920 · wire the MCP export-corpus gate into CI

**Role:** implementation author (leaf). **Supervisor:** `topic-internals-0.0.7`.
**Issue:** #1920 (`type:fix`, `area:tooling`, `area:mcp`, `priority:p2`, milestone `0.0.7`).
**Base:** the supervisor pins the exact `origin/main` SHA at dispatch. **Do not** start from a
remembered SHA — this slice regenerates a corpus derived from the published surface, and several
public-surface leaves are landing concurrently.

You implement. You do not merge, relabel to ready, or close the issue.

---

## The issue's premise is correct — verified, with one refinement worth having

I checked it rather than inheriting it. `grep -rn 'mcp-export-corpus' .github/workflows/` genuinely
returns nothing, and the sibling corpus gates genuinely **do** run in CI. The refinement: they are
not wired by task name but by **gate catalog id**, in `ci.yml`'s `quality` job:

```
.llm/tools/gates/run-gate.ts --gate agent-docs-prose  --id quality-agent-docs-prose  --output .llm/tmp/gate-receipts/quality/agent-docs-prose.json
.llm/tools/gates/run-gate.ts --gate assets-barrel     --id quality-assets-barrel     --output .llm/tmp/gate-receipts/quality/assets-barrel.json
.llm/tools/gates/run-gate.ts --gate publish-assets    --id quality-publish-assets    --output .llm/tmp/gate-receipts/quality/publish-assets.json
```

`mcp-export-corpus` is already in `.llm/tools/gates/catalog.ts` — it is only the workflow step that
is missing. So this is an additive step in the same job, in the same shape, producing a receipt at
`.llm/tmp/gate-receipts/quality/mcp-export-corpus.json`. Confirm all of this at your pinned base
before writing anything; if the `quality` job has been restructured, the parsed reality wins.

## Read this before you wire anything: the #1905 lesson applies directly

#1905 — merged from this same lane — was exactly the defect of a gate that **runs but is skipped by
policy**, and its first proposed fix would have produced a workflow that started and then reported
*"skipped by policy"*, which is worse than no gate because it reads as coverage.

So a step inside the `quality` job is only half the job. **Prove the job actually runs for the
changes this gate must catch.** `quality` is gated by `.github/scripts/ci-classify-changes.ts`. A PR
that moves the published export surface changes `packages/**` or `plugins/**`, which should set
`needs_deno`, but *derive that yourself* from the classifier and state the derivation. If there is
any input that can stale the corpus without running `quality`, that is in scope and must be closed —
the same two-layer shape #1905 closed for the Fresh UI lock.

## Determinism is a precondition, not a nice-to-have

The issue is explicit and correct: the generator shells out to `deno doc` and reads dependency
state, so a CI-vs-local divergence turns this into a **flaky gate rather than a useful one** — the
worst possible outcome, because a flaky required gate gets disabled and takes the real signal with
it.

Establish environment stability before wiring, with captured evidence:

- regenerate twice at the same pinned head in the same environment and compare sha256 — byte-equal;
- regenerate in a **pristine `DENO_DIR`** (`DENO_DIR=$(mktemp -d)`) and compare to the warm-cache
  result. A divergence here is the CI-vs-local risk made concrete and is a **stop-and-report**, not
  something to work around;
- record subpath and symbol counts alongside each sha256.

If the generator proves non-deterministic across environments, **stop and report**. Wiring a
non-deterministic generator into a required gate is a worse outcome than the drift #1920 describes,
and that decision is the supervisor's, not yours.

## Scope

1. Regenerate the corpus at the pinned base (`deno task gen:mcp-export-corpus`) and commit it.
2. Add the `run-gate.ts --gate mcp-export-corpus` step to the `quality` job, matching the sibling
   steps' shape exactly, including the receipt path and `--id`.
3. Prove the trigger path per the #1905 lesson above.
4. Prove the gate has **teeth in both directions**, with real captured exits:
   - a deliberately stalened corpus fails the gate;
   - a fresh corpus passes.
   Do the RED half by checking the stale commit out in a **throwaway worktree** — not in the live
   tree, where an uncommitted edit silently rescues it. This run has already produced two false REDs
   that way.

## Non-scope — hard stops

- **#1867's F-3 (generator dirty-tree guard) is NOT yours.** That is a separate issue on milestone
  0.0.8, and the boundary is recorded on #1867. Do not add a clean-tree guard here.
- No dependency or lockfile changes. No changes to any other gate, workflow, or job.
- Do not "fix" corpus drift caused by another lane's in-flight PR by editing their surface.

## A collision hazard specific to this slice

The corpus is derived from the **published surface of every package**, so any public-surface PR that
merges while you work invalidates your regenerated blob. Expect to re-integrate `main` and
regenerate before handoff, and **re-verify the sha256 after every integration** rather than assuming
it carried. Report the final blob's sha256, subpath count, and symbol count against the exact main
SHA you ended on.

## Validation

```
deno task check:mcp-export-corpus
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools --ext ts
```

plus a YAML parse of `ci.yml` reading the new step back from the parsed document, and the two-way
teeth proof. Capture every exit with `out=$(cmd); rc=$?` — never through a pipe, which reports the
last stage and has already produced one false green in this release. Do **not** run
`deno task e2e:cli`.

## Deliverables

Commits on the branch the supervisor names; `.llm/runs/<slice>/{worklog,evidence,drift}.md`; a
draft PR to `main` with `Closes #1920`, labels `type:fix`, `area:tooling`, `area:mcp`,
`priority:p2`, `orchestrator:internals`, `status:impl`, milestone `0.0.7`. **Commit your work — do
not end a turn with a dirty tree.** Report the head SHA, every gate's real exit code, the
determinism evidence, and the trigger-path derivation.
