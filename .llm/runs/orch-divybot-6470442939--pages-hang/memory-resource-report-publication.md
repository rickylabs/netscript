# Inspect generated inspection reports before staging

`deno task maint:leak-check -- --slice-dir <run> --worktree .` writes a `leak-report.md` into
the slice directory as well as reporting on stdout. That file includes raw foreign-resource
identities and runtime paths. When the owner requires public records without runtime details,
retain raw output outside Git and replace the generated report with a summary before staging.
Inspect all new files instead of staging the entire run directory without review.
