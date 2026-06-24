# IMPL-EVAL Summary: PR #117 (docs/readme-revamp)

## Verdict: FAIL_FIX

## Summary

Evaluated all 31 in-package README files (26 packages + 5 plugins) against 10 harness gates for the "road to JSR publish" PR that replaces READMEs with from-scratch, industry-standard documentation cross-referencing the published docs site.

**Core objective achieved**: All 31 READMEs now have verified cross-ref links, professional 9-section structure, voice-compliant content, and zero dead `./docs/*` references. The 26 per-package `/docs` folders have been cleanly removed from the repo.

## Passing Gates (8/10)

| Gate | Check | Result |
|------|-------|--------|
| 1 | Cross-ref link resolution | ✓ PASS (31/31 READMEs, 52 unique URLs all resolve) |
| 2 | Cross-ref meaningfulness | ✓ PASS (spot-checked 6 packages, no topically wrong links) |
| 3 | No dead `./docs/*` links | ✓ PASS (31/31 clean) |
| 4 | API ground-truth | ✓ PASS (spot-checked 5 packages via `deno doc`, all documented symbols exist) |
| 5 | Voice check | ✓ PASS (31/31, zero "honest/honesty/honestly" instances) |
| 6 | Industry structure | ✓ PASS (30/31 full 9-section; `fresh-ui` marginal but acceptable — code block vs bold intro) |
| 8 | `/docs` folders gone | ✓ PASS (all 26 removed, zero remain) |
| 9 | Skill repoint integrity | ✓ PASS (both `netscript-cli` and `fresh-ui-horizontal` skills repointed, Claude sync valid, no orphaned load-bearing refs) |
| 10 | Publish dry-run | ✓ PASS (`deno task publish:dry-run` exit 0, all 31 packages pack successfully) |

## Blocking Issues (Gate 7: publish-glob correctness)

Two minor config-hygiene failures require fixes:

### Issue A: `packages/cli/deno.json` line 45 — invalid strict-JSON comment
```json
// DEBT_ACCEPTED: temporary Wave 6 CLI carve-out for Deno 2.8 isolatedDeclarations annotations.
```
`json.load()` → `JSONDecodeError: Expected double-quoted property name in JSON at position 1863 (line 45 column 5)`. Deno parses as JSONC fine, `deno check` and `deno task publish:dry-run` both pass, but the strict JSON gate per protocol is failed.

**Fix**: Either remove line 45 entirely, or convert comment to a non-published key (e.g., `"//debt": "accepted..."`) — note this comment is not in `publish.include` so it does not ship, but the file itself fails strict JSON.

### Issue B: `packages/fresh-ui/deno.json` orphaned exclude glob
```json
"!docs/**/*.md",
```
The `packages/fresh-ui/docs/` directory no longer exists (deleted per drift D1 / commit f92cee1b). This glob is dead weight in `publish.exclude`.

**Fix**: Remove the `"!docs/**/*.md"` line from the exclude array.

## Non-blocking Notes

- `packages/fresh-ui/README.md` uses a code block for the intro (`**...**`) instead of the bold-line format used by the other 30 READMEs. Marked MARGINAL on structure gate, not blocking.
- No lock churn detected (per instructions: re-resolution churn is acceptable but must not be committed — nothing flagged here).
- All `deno.json` publish.include values verified: none of the 24 target packages still carry `docs/**/*.md` include glob. ✓

## Re-evaluation Path

After fixing the 2 publish-glob issues above, the verdict should upgrade directly to **PASS** with no further gate changes required.

## Files Written

- `.llm/tmp/run/docs-readme-revamp/evaluate.md` — full verdict table and gate-by-gate breakdown
- `.llm/tmp/run/docs-readme-revamp/gate-checks.py` — reproducible gate verification script
- `.llm/tmp/run/docs-readme-revamp/per-package-check.py` — per-package structure/voice/link script
