# Context Pack

#1207 is a mechanical CI workflow change on `ci/no-matrix-on-drafts`. Draft PR pushes run nothing;
`ready_for_review` and later non-draft events run required core contexts and the capability-scoped
matrix. No package code or lockfile is owned. Focused policy tests (3/3), classifier and close-gate
tests (58/58), targeted fmt, and diff-check pass. Live draft/ready Actions evidence remains to
record.
