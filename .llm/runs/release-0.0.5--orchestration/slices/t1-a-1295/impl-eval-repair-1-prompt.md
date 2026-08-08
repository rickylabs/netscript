use harness

## SKILL

Read and follow the current worktree root `AGENTS.md`, `netscript-harness`, `netscript-pr`,
`netscript-tools`, `netscript-deno-toolchain`, `jsr-audit`, and `netscript-doctrine` completely.
Read `.llm/harness/evaluator/protocol.md`, `verdict-definitions.md`, the A6/package-quality and
applicable static, fitness, consumer, runtime, and release-gate documents, issue #1295, PR #1315,
the prior formal evaluator artifact, and every tracked artifact in
`.llm/runs/fix-zod-v4-npm-alignment-1295--1295/` before judging the repair.

## Role

You are the fresh formal separate-session IMPL-EVAL for milestone cluster T1-A repair cycle 1. Run
read-only as the canonical `formal_impl_evaluation` route: OpenRouter `qwen/qwen3.8-max`, high
effort. You are neither the implementation supervisor nor the milestone orchestrator. Do not modify
files, GitHub state, branches, issues, PRs, containers, or foreign resources. You may run read-only
inspection and validation commands, including run-owned cleanup performed by the exact one-pass E2E
command. Emit the proposed repair-cycle evaluator artifact on stdout for the orchestrator to record
verbatim.

The inherited generator thread `019fcd0c-9cda-7641-9479-3d1c72358154` was resumed as Sol medium
under recorded C-D9 and terminated cleanly before this launch. Prior formal Qwen session
`f516aada-2a74-4dad-821e-b20963fe2983` returned `FAIL_FIX` at old head `9f5ef7dcb...`; it is
historical input, not this cycle's verdict. Earlier premature sessions
`b329c804-2b7b-47b3-b109-84895f66f01d` and `4b004c60-acae-4373-b7f7-56956b191156` remain permanently
ineligible. Do not resume or cite any partial session as current evidence.

## Exact target

- Worktree: `/home/codex/repos/ns005-streamdb`
- Branch: `fix/zod-v4-npm-alignment-1295`
- Expected head: `18c7a7e791552c6f346ef07a77a741dd70b058d6`
- Product repair: `b29879e9468d4c154bc67beb1cbe430984f8290c`
- Corrected evidence: `91bc68099285b2c322fd895c25bca34ec3c0c99b`
- Terminal train-visibility handoff: `18c7a7e791552c6f346ef07a77a741dd70b058d6`
- Train base: `canary/0.0.5-canary.14@2508eb8c99c9cfc55e0c9f1d7ab72fea745db492`
- PR: #1315, draft, lifecycle must be exactly `status:impl-eval` before launch
- Issue: #1295; full one-instance collapse remains deferred to #1320 because AG-UI and kvdex still
  require the documented Zod 3 boundary
- Prior formal finding: 70 new root-summed `private-type-ref` diagnostics at 55 distinct sites in 14
  files across eight publish roots, plus baseline-green/head-red Fresh `check:streams-types`
- Repair handoff claims: exact 19-root parsed sum 287 baseline to 279 repair with every root at or
  below baseline; detached Fresh consumer and full Fresh check green; exact one-pass runtime smoke
  raw exit 0 and 73/73; serial publish simulation green; clean lock and zero smoke-owned leaks
- Current hosted checks are terminal-skipped because the PR remains draft. They are not a green
  train verdict and must not be represented as one.

Fail closed if the checked-out head/branch differs, the worktree is dirty before your own validation
commands, another AppHost would violate the one-AppHost rule, or issue/PR lifecycle is not exactly
`status:impl-eval`.

## Evaluation mission

Apply the evaluator protocol, not the repair supervisor's claims. Independently inspect the full PR
diff against `origin/canary/0.0.5-canary.14`, the focused repair diff from `d0aa6a22d` through the
expected head, current issue/PR bodies, acceptance evidence, run history, review threads, and
current GitHub checks. Re-run the smallest complete set that proves every decisive claim plus all
package-quality/publish/runtime gates required by the approved plan. At minimum:

1. Reproduce the exact full-export comparison over all 19 affected publish roots against canary.14.
   Parse diagnostic identities/counts rather than trusting the wrapper exit code. Reconcile root
   sums, distinct new sites/files, and prove every repaired root is at or below its baseline. Fail
   any suppression, ignored diagnostic, or private npm Zod identity leaking through a public export.
2. Inspect the structural validator design adversarially. Concrete Zod constructors may remain
   private for composition, while published declarations must use coherent package-owned
   structural/Standard-Schema contracts. Reject per-file papering, unsafe double casts, ungoverned
   parallel authorities, or public contracts that erase useful input/output typing.
3. Independently run `packages/fresh` `check:streams-types` and its full member check. Verify the
   foreign fixture config owns the npm catalog it activates and the root CI dependency actually
   invokes the member gate. Include a negative-control or historical RED inspection proving the
   original missing-catalog failure was real and is not masked by a copied full root catalog.
4. Re-run emitted-sample compilation and focused contract/Fresh/AI/auth/workers/plugin tests. Name
   exact current counts. Verify the negative case and catalog authority rather than accepting log
   summaries.
5. Run scoped check/lint/fmt wrappers over every changed TypeScript path, plus the applicable root
   check, `quality:gate`, dependency/Zod graph guards, docs links/accuracy, JSR/package audits, and
   serial `publish:dry-run`. Confirm publish simulation restores manifests and leaves no `deno.lock`
   diff.
6. Independently inspect `deno info`/`deno why` evidence so Anthropic, MCP, zod-to-json-schema, and
   OpenAI bind their Zod-4 peers to Zod 4.4.3. Require exactly the documented AG-UI/kvdex Zod 3
   residual parents and no unknown split.
7. Run the exact one-pass merge-readiness smoke from repository root:
   `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`. Require raw exit 0, the
   authoritative current suite count, endpoint/background/OTEL proof, and cleanup. Then run the
   read-only leak reporter; never mutate foreign or unknown-owner resources.
8. Scan publishable source diff for new `deno-lint-ignore`, `@ts-ignore`, `as unknown as`, `as any`,
   fixture/package-name coupling, placeholder seams, or generated/source churn. Exclude run
   artifacts from the source scan and independently judge any existing baseline occurrence.
9. Verify every #1295 acceptance row and every PR checklist/body claim is backed by current-head
   evidence. Current hosted contexts may be skipped while draft, but no failure may be hidden as
   pending or skipped, and skipped contexts are not a green train verdict.
10. Verify final lock/manifests are restored, the target tree is clean, no run-owned resource
    survives, no unanswered current review thread remains, and the prior `FAIL_FIX` artifact is
    preserved rather than silently rewritten.

## Adversarial focus

- Look for a structural interface whose methods are technically assignable but too weak to preserve
  schema input/output semantics for consumers.
- Confirm exported types are reachable from the intended public modules and do not introduce new
  private-type, missing-doc, or isolated-declaration regressions elsewhere.
- Confirm `deno.json` root task wiring cannot silently bypass `check:streams-types`, and the
  detached fixture's catalog is local ownership rather than a second repository version authority.
- Treat the doc-lint wrapper exit-zero trap and emitted-sample full-root-catalog limitation as known
  tool limitations. Require parsed counts and independent negative evidence; do not fail merely
  because this bounded product repair did not redesign those tools.
- Treat the repair supervisor's exact smoke and publish results as claims to reproduce, not as
  evaluator evidence by themselves.
- Reconcile stale run metadata or unsupported acceptance wording as a process finding if it would
  mislead the next operator.

## Output contract

Return exactly one verdict from `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`, with numbered
findings and evidence for every PASS row. Empty output or output without a verdict token is a hard
evaluator error. Provide a complete proposed Markdown artifact:

```markdown
# IMPL-EVAL repair cycle 1 — fix-zod-v4-npm-alignment-1295--1295

...

## Verdict

`PASS|FAIL_FIX|FAIL_RESCOPE|FAIL_DEBT`
```

Do not write the file yourself. After the artifact, repeat the verdict token on the final line.
