# Context pack

## Current state

The focused docs source-format repair is implemented on `fix/docs-source-format-consistency` from
`origin/main@3ce91f2c2`. The initial site build and approved external bundle build failed on invalid
Vento strings; all repaired site, source, rendered-DOM, mobile, link, diagram, and full external
corpus gates pass locally. Both lockfiles remain byte-equal to the baseline.

## Remaining

1. Commit/push, open the draft PR, apply docs-only CI labels, and post evidence.
2. Parent supervisor launches fresh opposite-family IMPL-EVAL; do not merge here.

## Issue recommendation

#1277 is related but too broad. No existing focused issue was found; recommend a dedicated docs
source/build correctness issue before final merge so the PR can carry `Closes #N`.
