# Utility selector compression

The current Utility root has nonzero specificity required by Card borders, invalid/focus
controls and Badge paints. Native nesting of an identical root with one selector preserves
that specificity; replacing it with :where(root) does not. Keep unscoped legacy rules outside
nested groups, including .ns-badge__dot. Current QueryResult is already single-source through
resource template placeholders after #2503's hydration repair.
