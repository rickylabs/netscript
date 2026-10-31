# Negative controls

Removed only the six-line authored-binding guard from manifest-page-module.ts, retaining all
regression tests. Structured test wrapper with --filter '/preserv|disk pass/' ran 12 cases:
3 pass and 9 intended assertion failures (six expression/form cases, disk rewrite count, Vite dev
source preservation, Vite build source preservation). Exit 1, no compile/process failure.
Restored source bytes in finally and verified SHA-256 equality. Restored full focused gate: 50 pass.

An initial filter omitted the enclosing regex slashes and selected zero tests. That exploratory
attempt is NOT evidence; the corrected control above is the verdict.
