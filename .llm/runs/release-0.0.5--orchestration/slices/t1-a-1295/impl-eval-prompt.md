use harness

## SKILL

Read and follow the current worktree root `AGENTS.md`, `netscript-harness`, `netscript-pr`,
`netscript-tools`, `netscript-deno-toolchain`, `jsr-audit`, and `netscript-doctrine` completely.
Read `.llm/harness/evaluator/protocol.md`, `verdict-definitions.md`, the A6/package-quality and
applicable gate documents, issue #1295, PR #1315, and every tracked artifact in
`.llm/runs/fix-zod-v4-npm-alignment-1295--1295/` before judging the change.

## Role

You are the formal separate-session IMPL-EVAL for milestone cluster T1-A. Run read-only as the
canonical `formal_impl_evaluation` route: OpenRouter `qwen/qwen3.8-max`, high effort. The generator
was Codex Sol low in thread `019fcd0c-9cda-7641-9479-3d1c72358154`; you are neither that generator
nor the milestone orchestrator. Do not modify files, GitHub state, branches, issues, or PRs. You may
run read-only and validation commands. Emit the proposed `evaluate.md` artifact on stdout for the
orchestrator to record verbatim.

## Exact target

- Worktree: `/home/codex/repos/ns005-streamdb`
- Branch: `fix/zod-v4-npm-alignment-1295`
- Expected head: `9f5ef7dcb55668a6649c5451266908ad8e29b15c`
- Product repair commit: `ecd224243ea373e803c5165ba607f235d438f9c8`
- Train merge: `c1fb3bb6e5a421fb0db6393ac1b350e38441bd91`, integrating
  `canary/0.0.5-canary.14@2508eb8c99c9cfc55e0c9f1d7ab72fea745db492`
- PR: #1315, draft, current lifecycle `status:impl-eval`
- Issue: #1295; full one-instance collapse remains honestly deferred to #1320 because AG-UI and
  kvdex still require Zod 3
- The milestone wave plan received separate Minimax M3 PLAN-EVAL PASS before this repair.

Fail closed if the checked-out head/branch differs or the worktree is dirty before your own
validation commands.

## Evaluation mission

Apply the evaluator protocol, not the generator's claims. Independently inspect the full PR diff
against `origin/canary/0.0.5-canary.14`, current issue/PR bodies, acceptance evidence, run history,
and current GitHub checks. Re-run the smallest complete set that proves the decisive claim, plus
every package-quality/publish gate required by the approved plan. At minimum independently verify:

1. `deno task check:emitted-samples` genuinely compiles every emitted sample and its negative case
   was the missing child-root catalog, not a truncated/log-only inference.
2. Focused generator/catalog/config/runtime-registry tests cover both generated standalone roots and
   temporary consumer roots. Name the exact test counts.
3. Scoped check/lint/fmt wrappers cover every changed TypeScript path with zero findings.
4. Zod guard predicate tests and the live guard preserve exactly the documented residual v3 parents;
   independently inspect `deno info`/`deno why` evidence so Anthropic, MCP, zod-to-json-schema, and
   OpenAI do not bind a Zod-4 peer to Zod 3.
5. `quality:gate`, docs accuracy, full affected export-map `deno doc --lint`, and `publish:dry-run`
   are real passes. Run catalog-sensitive/publish simulation serially and confirm it restores
   manifests and leaves no `deno.lock` diff.
6. The PR diff introduces no publishable-source `deno-lint-ignore`, `@ts-ignore`, or
   `as unknown as`; run artifacts are excluded from that scan.
7. Every #1295 acceptance row and every PR checklist claim is backed by current evidence. Required
   hosted contexts may remain pending while the PR is draft, but no failure may be hidden as
   pending.

## Adversarial focus

- Decide whether `SCAFFOLD_WORKSPACE_CATALOG` is the honest generation seam or a second ungoverned
  Zod version authority. The sync test must actually bind it to the repository authority.
- Inspect `.llm/tools/validation/check-emitted-samples.ts`: copying catalog state into a test root
  must not mask a product generator that omits required entries or falsely prove arbitrary catalog
  dependencies.
- Confirm standalone resource/member manifests remain portable and do not consume `catalog:` where
  no generated root owns it.
- Confirm no fixture-specific exception was added where a generic emitted-workspace seam owns the
  behavior.
- Judge whether the full `scaffold.runtime` smoke is genuinely non-applicable to this dependency/
  generated-compile repair; if a changed path affects runnable scaffold output beyond manifest
  compilation, require it rather than accepting a narrow substitute.
- Reconcile any stale/inconsistent run metadata (including old D6 language or outdated next steps)
  as a process finding if it would mislead the next operator.

## Output contract

Return exactly one verdict from `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`, with numbered
findings and evidence for every PASS row. Empty output or output without a verdict token is a hard
evaluator error. Provide a complete proposed Markdown artifact:

```markdown
# IMPL-EVAL — fix-zod-v4-npm-alignment-1295--1295

...

## Verdict

`PASS|FAIL_FIX|FAIL_RESCOPE|FAIL_DEBT`
```

Do not write the file yourself. After the artifact, repeat the verdict token on the final line.
