use harness

# Wave 3 fixes leaf — `ai-mcp-pool-isolation` (#1448)

You are the sole implementation agent for this leaf, launched by topic orchestrator
`topic-fixes-0.0.7` under Codex coordinator `codex-root-0.0.7`. One branch → one worktree → one
active agent. Never start a second sender at this worktree; steer this same thread.

## SKILL

Activate and use: `netscript-harness` (9-phase loop, run artifacts, PLAN-EVAL decision, slice
discipline, evaluator separation, drift recording), `netscript-doctrine` (**Archetype 2 —
integration**; layering, public surface, fitness gates, anti-patterns), `netscript-tools`
(structured wrappers are the ONLY verdict source, gate evidence, git ground truth, lock hygiene),
`netscript-deno-toolchain` (`deno doc` before broad reads; `--unstable-kv` on targeted checks),
`jsr-audit` (this contract marks JSR applicable), `netscript-pr` (draft PR on first commit,
per-slice comments, single `status:` label, closing keyword), `rtk` (token-cheap read-heavy
git/grep).

## Identity

- Issue: **#1448** — `fix(ai/mcp): make pool startup failure-isolated and propagate…`. Milestone
  `0.0.7`, `priority:p1`. **Read the live issue body first** — it is the acceptance authority.
- Worktree: `/home/codex/repos/netscript-007-leaf-ai-mcp-pool`
- Branch: `fix/ai-mcp-pool-isolation`, **no upstream by design**. Push by explicit refspec only:
  `git push origin HEAD:refs/heads/fix/ai-mcp-pool-isolation`
- Immutable base: `284dda90a17a13a7e5e8e9834e5411b58887131b` (current `origin/main`).
- Run dir to create: `.llm/runs/fix-ai-mcp-pool-isolation--0.0.7-wave3/`

## Frozen contract — do not widen it

Authorized file surfaces (exactly these three):

1. `packages/ai/src/mcp/adapters/tanstack-connector.ts`
2. `packages/ai/src/mcp/application/pool.ts`
3. `packages/ai/src/mcp/application/register-tools.ts`

Archetype `2-integration`, no scope overlays. Proving gates: `check`, `test`, `publish-dry-run`,
`arch-check`. JSR audit applies — audit public exports and exact `@netscript/*` pins for every
touched publishable member, and reject runtime asset / `import.meta` reads under the
isolated-declaration publish dry run.

**If the real fix requires a surface outside that list, stop and record drift** rather than
inferring authorization. Three leaves in this lane have already hit that boundary; every one of them
stopped and got an explicit coordinator amendment. Do the same.

## Work

1. **Research red-first.** Reproduce the defect before changing anything: demonstrate that a pool
   startup failure is *not* isolated today and that the failure does not propagate as the issue
   describes. Record the reproduction in `research.md` with commands and observed output. If a
   sub-symptom is already fixed on current `main`, say so and keep it as regression coverage rather
   than claiming a fix you did not make.
2. **Decide PLAN-EVAL honestly.** Mechanical with a complete contract → record a justified
   `PLAN-EVAL: N/A` and proceed. Decision-heavy, or the contract cannot express the fix → **stop and
   report**; a separate PLAN-EVAL is a coordinator-granted gate, not something you open yourself.
3. **Open the draft PR on the first commit** (run-dir bootstrap), targeting `main`, using the
   `netscript-pr` body template: Definition of Done, run-dir path, slice checklist, and
   `Closes #1448` in `## Scope` **only if this PR fully resolves it**.
4. **Implement in reviewable slices**, smallest coherent unit first. Failure isolation and error
   propagation are separable — treat them as separate slices if that keeps each reviewable.
5. Per slice: commit, push by explicit refspec, post one structured PR comment with slice scope,
   commit hash, and each gate's exact command and **raw exit code**, and update `worklog.md` +
   `context-pack.md` in the same commit.

## Gates

Use the structured wrappers — `.llm/tools/run-deno-check.ts`, `run-deno-test.ts`,
`run-deno-lint.ts`, `run-deno-fmt.ts` (or the `deno task check|test|lint|fmt:check` aliases). Raw
root `deno check .` / `deno fmt --check` / `deno lint` is **not** a verdict source.

Because this touches `packages/**`, a green wrapper is necessary but **not sufficient**: also run
`deno task quality:scan` and `deno task arch:check` (the contract names `arch-check` explicitly).
Introducing a `// deno-lint-ignore`, `// quality-allow`, `as any`, or `as unknown as` to make a gate
pass is a **review-blocking** defect — fix the type properly or stop and record drift.

Add the JSR audit and `deno publish --dry-run` evidence for touched publishable members.

**If you edit any file under `packages/*/src/kernel/assets/` or any template that is embedded into a
generated barrel, run `deno task check:assets-barrel` and commit the regenerated barrel.** A
template-only edit leaves the shipped artifact stale — that exact defect cost this lane a full
IMPL-EVAL cycle on #1657. This contract's three files are not asset templates, so it should not
apply; verify rather than assume.

## Expensive-gate stop

**No expensive-gate lease is held.** Do **not** run `deno task e2e:cli`, `scaffold.runtime`, Aspire,
Docker, or any browser/E2E suite without an explicit fresh coordinator lease. If you reach a point
where one is the remaining gate, **stop, report that boundary, and wait** — the topic orchestrator
requests the lease. Do not approximate it or mark the gate satisfied. `docker ps -a` must stay empty
because of you.

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

Branch/worktree, current head and push status, per-slice commit → gate → raw exit code, the
PLAN-EVAL decision with its justification, `deno.lock` status, confirmation no Aspire/Docker/E2E
ran, and the exact next blocker. Stop at any gate requiring coordinator authority.
