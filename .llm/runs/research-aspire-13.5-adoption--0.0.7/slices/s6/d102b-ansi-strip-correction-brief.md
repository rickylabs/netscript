# S6 D-102b bounded correction: ANSI-decorated stderr breaks the exact-17 matcher

## Problem (Tier-A finding)

`requireHealthyWaitTimeout` in
`packages/cli/e2e/src/application/gates/scaffold/runtime/listener-unreachable-fixture.ts` (landed at
`9852d63ed`) currently does:

```ts
stream.split(/\r?\n/u).some((line) => line.trim().replace(/^❌\s*/u, '') === expectedDiagnostic)
```

This only strips a leading `❌` glyph and surrounding whitespace. The real Aspire 13.5.3 CLI stderr
for this exact exit-17 timeout case is ANSI-decorated: CSI color/style sequences appear before the
`❌` glyph, around/inside the diagnostic run, and at line end (a reset sequence). Against that real
output the exact-match check falsely rejects a genuinely correct exit-17 result, because the ANSI
bytes are still embedded in the line after the `❌` strip.

## Scope of this correction (bounded)

1. Normalize ANSI out of each candidate line before the exact-match comparison. Reuse the existing
   standard helper already imported elsewhere in this package —
   `stripAnsiCode` from `@std/fmt/colors` (see
   `packages/cli/src/public/features/ui/ui-app-root-command_test.ts`, which already does
   `import { stripAnsiCode } from '@std/fmt/colors';`). Do not hand-roll a new CSI regex if
   `stripAnsiCode` covers the observed sequences; only fall back to a narrow CSI stripper
   (`/\x1b\[[0-9;]*m/g`-shape) if `stripAnsiCode` provably does not match the real receipt's byte
   sequences.
2. Apply the ANSI strip before the existing `.trim().replace(/^❌\s*/u, '')` normalization (order:
   strip ANSI, then strip the leading glyph/whitespace, then compare equal to `expectedDiagnostic`).
3. Add a focused regression test for `requireHealthyWaitTimeout` (or the exported line-matching path
   it uses) that feeds it the actual ANSI-decorated stderr shape observed from the live 13.5.3 run —
   CSI sequences before the `❌`, around the diagnostic text, and a trailing reset at line end — and
   asserts it now correctly recognizes exit 17 with that diagnostic as valid, alongside the existing
   plain-text (non-ANSI) case so both keep passing.
4. Do **not** touch exit-code semantics (still exactly 17, per the already-ratified D-102 correction
   at `9852d63ed`), health-check transition logic, the synthetic listener architecture, or the fixed
   reserved ports (18998/18999). This is purely a string-matching fix for CLI output decoration.
5. No PLAN-EVAL. No DeepSeek/OpenRouter rerun — bounded code correction only.

## After this change

Commit, run focused/unit checks for the touched file(s), freeze/push. The coordinator will do
substantive slice review, and only after acceptance will request a fresh sole Postgres runtime lease
from exact zero (prior lease already torn down to zero). SQLite tier proceeds only after Postgres is
green under this corrected matcher.
