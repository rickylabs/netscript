# Context Pack — fix-cli-plugin-copy-flag-gate--copy-gate

## Status

Implementation complete through S3 on branch `fix/cli-plugin-copy-flag-gate`.

## Decisions

- D1 was flipped after drift: maintainer/local official source copy remains default-on.
- `--no-copy-source` is the single opt-out flag for thin local-import stubs.
- Public/prod `netscript plugin add` remains JSR-only and does not expose copy-mode flags.

## Landed Slices

- S1: local `--no-copy-source` plumbing and gate.
- S2: public prod no-copy regression lock and import-boundary test.
- S3: e2e confirmation and `PLUGIN-USERLAND-SOURCE-COPY` debt closure.

## Validation Summary

- Scoped package check: pass, 0 findings.
- Plugin-add units: pass, 2 suites / 8 steps.
- `packages/cli` publish dry-run: pass with existing dynamic-import warnings.
- `scaffold.plugins`: pass, 11 passed / 0 failed.
- `scaffold.runtime`: first attempt failed `behavior.workers-executions` after AppHost instability;
  clean rerun passed, 47 passed / 0 failed.

## PR

- PR: https://github.com/rickylabs/netscript/pull/133
- Draft remains appropriate until final evaluator pass.
