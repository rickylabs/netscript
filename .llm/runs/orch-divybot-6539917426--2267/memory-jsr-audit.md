# Audit banner false positive

For `packages/kv`, repository `audit-jsr-package.ts --root packages/kv --text`
returns zero but counts the native dry-run progress banner “Checking for slow
types in the public API...” as one slow-types warning. The native package
`deno task publish:dry-run` succeeds without actual slow-type diagnostics.
Report both facts; do not treat the audit banner count as a real publish error.
