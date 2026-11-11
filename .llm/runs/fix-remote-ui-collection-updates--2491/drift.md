# Drift

No drift at intake. Continuing newer user request across tracker units.
- Root formatting config excludes CLI, so use source-quality.json with equivalent root
  rules/style and explicit files for meaningful nonempty coverage.
- Round1 review and larger suite caught empty-lock builtin read behavior. Preserve that
  existing guard inside remote-capable preflight. Never run a supposedly frozen proof while
  still modifying its source; final gates are rerun after source freeze.
