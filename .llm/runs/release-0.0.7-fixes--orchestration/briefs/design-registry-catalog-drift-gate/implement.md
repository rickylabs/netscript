use harness

# Wave 1 fixes leaf — `design-registry-catalog-drift-gate` (#1358)

You are the sole implementation agent for this leaf, launched by topic orchestrator
`topic-fixes-0.0.7` under Codex coordinator `codex-root-0.0.7`. One branch → one worktree → one
active agent. Never start a second sender at this worktree; steer this same thread.

## SKILL

Activate and use: `netscript-harness` (9-phase loop, run artifacts, PLAN-EVAL decision, slice
discipline, evaluator separation), `netscript-doctrine` (Archetype **6 — CLI/tooling** with the
**frontend** overlay; layering, public surface, fitness gates), `netscript-cli` (scaffold/template
and generated `(design)` route surfaces), `deno-fresh` (Fresh 2.x routes/islands if the generated
gallery page is touched), `fresh-ui-horizontal` (the `@netscript/fresh-ui` registry/theme authority
chain), `netscript-tools` (structured wrappers are the ONLY verdict source, gate evidence, git
ground truth, lock hygiene), `netscript-deno-toolchain` (`deno doc` before broad reads;
`--unstable-kv` on targeted checks), `jsr-audit` (this leaf's contract marks JSR applicable),
`netscript-pr` (draft PR on first commit, per-slice comments, single `status:` label, closing
keyword), `rtk` (token-cheap read-heavy git/grep).

## Identity

- Issue: **#1358** — "the generated `/design/components` gallery lists 50 of 66 registry items — the
  whole AI collection is invisible and no gate compares them". Milestone `0.0.7`, `priority:p1`,
  `area:cli` + `area:fresh-ui`.
- Worktree: `/home/codex/repos/netscript-007-leaf-design-registry-drift`
- Branch: `fix/design-registry-catalog-drift-gate`, **no upstream by design**. Push by explicit
  refspec only:
  `git push origin HEAD:refs/heads/fix/design-registry-catalog-drift-gate`
- Immutable base: `da574111af05a5cded74250128b196fcab870274` (current `origin/main`).
- Run dir to create: `.llm/runs/fix-design-registry-catalog-drift-gate--0.0.7-wave1/`

## Frozen contract — do not widen it

Authorized file surfaces (exactly these four):

1. `packages/cli/src/kernel/application/ui/registry.ts`
2. `packages/cli/src/kernel/assets/app/routes/(design)/design/(_shared)/registry.ts.template`
3. `packages/fresh-ui/registry.manifest.ts`
4. `packages/fresh-ui/tests/registry-doc-drift.test.ts`

Archetype `6-cli-tooling`, overlay `frontend`. Proving gates: `check`, `test`, `publish-dry-run`,
`fresh-browser`. JSR audit applies — audit public exports and exact `@netscript/*` pins for every
touched publishable member, and reject runtime asset / `import.meta` reads under the
isolated-declaration publish dry run.

If the real fix requires a surface outside that list, **stop and record drift** rather than
inferring authorization. That is exactly how the two Wave 0 leaves were handled, and it is the
behavior this run expects.

## Work

1. **Research red-first.** Reproduce the defect before changing anything: establish the real counts
   on both sides (registry manifest vs. what the generated gallery renders), and identify precisely
   why the AI collection is absent — do not assume it is a simple filter. Record the reproduction in
   `research.md` with commands and numbers.
2. **Decide PLAN-EVAL honestly.** If the fix is mechanical with a complete contract, record a
   justified `PLAN-EVAL: N/A` and proceed. If it is decision-heavy or the contract does not express
   the fix, **stop and report** — a separate PLAN-EVAL is a coordinator-granted gate, not something
   you open yourself.
3. **Open the draft PR on the first commit** (run-dir bootstrap), targeting `main`, with the
   `netscript-pr` body template: Definition of Done, run-dir path, slice checklist, and
   `Closes #1358` in `## Scope` **only if this PR fully resolves it**.
4. **Implement in reviewable slices.** The issue names two deliverables — the gallery must list
   every registry item, **and** a gate must compare them so the drift cannot silently return.
   `registry-doc-drift.test.ts` is the natural home for that comparison. A fix that makes the count
   match without a gate does not satisfy the issue.
5. Per slice: commit, push by explicit refspec, post one structured PR comment with the slice scope,
   commit hash, and each gate's exact command and raw exit code, and update
   `worklog.md` + `context-pack.md` in the same commit.

## Gates

Use the structured wrappers — `.llm/tools/run-deno-check.ts`, `run-deno-test.ts`,
`run-deno-lint.ts`, `run-deno-fmt.ts` (or the `deno task check|test|lint|fmt:check` aliases). Raw
root `deno check .` / `deno fmt --check` / `deno lint` is **not** a verdict source.

Because this touches `packages/**`, a green wrapper is necessary but **not sufficient**: also run
`deno task quality:scan` and `deno task arch:check`. Introducing a `// deno-lint-ignore`,
`// quality-allow`, `as any`, or `as unknown as` to make a gate pass is a **review-blocking** defect
— fix the type properly or stop and record drift.

Add the JSR audit and `deno publish --dry-run` evidence for touched publishable members.

## Expensive-gate stop — read this before running anything heavy

**No expensive-gate lease is held by this leaf.** Do **not** run `deno task e2e:cli`,
`scaffold.runtime`, Aspire, Docker, or any browser/E2E suite — including the contract's
`fresh-browser` gate — without an explicit fresh coordinator lease.

When you reach the point where `fresh-browser` is the remaining gate, **stop, report that you are at
that boundary, and wait.** The topic orchestrator will request the lease from the coordinator. Do
not approximate it, do not substitute a lighter browser run, and do not mark the gate satisfied.
`docker ps -a` must stay empty because of you.

## Boundaries

- Do not touch other lanes, other worktrees, `main`, or coordinator artifacts. Other topic
  orchestrators are working in parallel — stay in this worktree.
- Do not merge, mark ready for review, relabel, change milestone, or close issues.
- Do not delete lock files or caches; `deno.lock` must not change unless a reviewed fix requires it,
  and if it does, report before committing it.
- **Do not self-certify.** After your slices are green, stop for the topic orchestrator's
  substantive Tier-A review; the sign-off commit is the supervisor's. A separate opposite-family
  IMPL-EVAL is mandatory afterwards and is not yours to launch.

## Report each turn

Branch/worktree, current head and push status, per-slice commit → gate → raw exit code, PLAN-EVAL
decision with its justification, `deno.lock` status, confirmation no Aspire/Docker/E2E ran, and the
exact next blocker. Stop at any gate requiring coordinator authority.
