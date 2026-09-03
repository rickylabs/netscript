use harness

# Implementation evaluation: leaf-1881 README minimum dependency age

## SKILL

Load and follow `.agents/skills/netscript-harness`, `.agents/skills/netscript-doctrine`,
`.agents/skills/netscript-tools`, and `.agents/skills/netscript-pr` before evaluating.

You are the independent implementation evaluator for a bounded Harness v3 Archetype 6 CLI/tooling
and docs-overlay slice. Work read-only except for your required verdict artifact. Write only:

`.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/leaf-1881-min-dep-age/evaluate.md`

Evaluate commit `957cff9ff4e682e60a67e6e902f720f54e7e494a` against baseline
`3149d18e18fdd7cfbd0fac5a06f48f781d3a391a`. Do not edit implementation, tests, docs,
generated carriers, workflows, or lockfiles. Do not start Aspire, Docker, or any runtime suite.

## Required contract

The production red is `e2e-cli-prod` run 33708533076 on main `3149d18e1`, using
`published-version=0.0.7-canary.9`. `readme.quickstart.01-install-cli` exited 1 even though the
run-owned `DENO_INSTALL_ROOT` isolation worked. Stderr reported:

`error: Could not find version of '@netscript/cli' that matches specified version constraint '0.0.7-canary.9'`

and that a newer matching version was rejected by Deno's minimum dependency date. The approved
public command is exactly:

`deno install --global --allow-all --name netscript --minimum-dependency-age=0 jsr:@netscript/cli@<version>`

The flag must be printed immediately before the specifier in the root README, CLI package README,
docs quickstart template, root README expected-command contract, and quickstart-walk displayed
contract. It must be parsed from README text and passed verbatim; the E2E harness must not inject
the flag. Root README must retain `# 1.` and add a single-line explanation. The docs callout must
say the displayed command already handles same-day publication while retaining `-f` guidance for
replacing an existing executable. No workflow changes, publication, republish, shim, fallback,
environment workaround, or runtime behavior change is allowed.

## Commit/evidence sequence

- `33083a6f0`: Harness plan and run artifacts. PLAN-EVAL is N/A because the owner supplied a locked
  command, exact files, validation, branch, and PR contract.
- `a3f929c23`: RED expectation/test-only commit. The focused command exited 1 with 7 passed and 3
  failed. Root README drift and site quickstart drift both showed the old command as actual and the
  approved flagged command as expected. The application test failed because parsed README command
  1 lacked `--minimum-dependency-age=0`.
- `86c71bc97`: GREEN user-facing docs commit. The identical focused command exited 0 with 10 passed.
- `e6dbee80d`: regenerated README-derived carrier artifacts.
- `957cff9ff`: gate evidence and refreshed Aspire surface manifest.

The application test explicitly requires the spawned argv to contain the flag exactly once and
requires the parsed `sourceCommand` to contain it exactly once.

## Recorded verification

- focused RED: exit 1, 7 passed, 3 failed (expected red)
- focused GREEN: exit 0, 10 passed, 0 failed
- `check:agent-docs-prose`: final exit 0
- `check:assets-barrel`: final exit 0
- `check:publish-assets`: final exit 0
- `check:mcp-export-corpus`: exit 0
- scoped E2E TypeScript check: exit 0 (236 files, 2 batches)
- full `packages/cli/e2e/tests`: exit 0 (334 passed, 0 failed)
- scoped E2E TypeScript fmt check: exit 0 (236 files)
- lint of three handwritten changed TypeScript files: exit 0
- `deno task e2e:cli gates readme.quickstart`: exit 0 and command 1 includes the exact flag
- `deno task docs:accuracy`: exit 0 (200 pages; 91/91 root/direct commands)
- `deno task docs:links`: exit 0 (105 docs; zero broken)
- `deno task quality:gate`: exit 0
- `deno task check:aspire-version-parity`: exit 0 after manifest regeneration, with
  `ok:true`, `manifestFresh:true`, and `fail:0`

`deno task docs:readme:check` exits 1 solely because the baseline, untouched
`packages/bench/README.md` lacks an Install section. Treat that as a documented pre-existing
baseline unless this branch worsens it. A first lint invocation included a generated file that the
wrapper deliberately dropped due its partial-exclusion policy; the authoritative lint rerun over
the three handwritten TypeScript files exited 0, while generated outputs are covered by their
generator freshness checks.

## Evaluation procedure

Independently inspect the baseline-to-head diff, commit boundaries, exact command spelling/order,
README parser provenance assertion, derived carrier changes, run artifacts, and absence of forbidden
changes. Re-run the smallest useful non-runtime tests/checks if needed. Confirm no lockfile or
workflow change. The PR is intentionally not open yet because the owner required all gates before
push; PR metadata is therefore out of scope for this pre-push implementation evaluation.

Write `evaluate.md` with evidence, findings by severity, explicit requirement coverage, and exactly
one Harness verdict token from the evaluator protocol (`PASS`, `FAIL_TESTS`, `FAIL_IMPL`,
`FAIL_SCOPE`, `BLOCKED_ENV`, or another protocol-defined token if applicable). A PASS requires no
unresolved blocking findings.

## Focused re-evaluation after `FAIL_FIX`

The implementation session accepted F-1 without changing product, gate, README, or workflow code.
Evaluate repaired head `a074ba2a9f7da3c92432788a40631b3a9f7ba186`. The evaluator prompt,
initial verdict, worklog, context pack, and supervisor record were staged before the manifest was
regenerated. The generator then reported `rows=946 unmatched=0`; the subsequent parity command
exited 0 with `ok:true`, `manifestFresh:true`, and counts
`checked:945, fail:0, deferred:16, info:5, skipped:1, missing:0`. Confirm that result independently,
confirm the repair commit is evidence-only, and update the existing `evaluate.md` to preserve the
initial finding and add a focused re-evaluation section with the final protocol verdict. Do not
modify any other file or run runtime/Aspire/Docker commands.
