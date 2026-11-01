# Destructive text includes shipped CLI CSS templates

The regression in `packages/fresh-ui/tests/tokens/component-colors.test.ts` scans immediate registry component CSS and recursively scans `packages/cli/src/kernel/assets/**/*.css.template`. Both roots must contribute files; findings use repository-relative paths. Keep solid destructive roles for borders/fills, but text `color` uses `--ns-destructive-text`.

The design-page rules-dont span was missed by the old registry-only scope. Negative control: restore its `color: var(--ns-destructive)` declaration, run the structured test wrapper, and require exit 1 with that template in the failure. Always restore the fixed file in finally. Then the same command must pass. The CLI embedded asset carrier needs regeneration after changing the template.
