# Proving the early registry item-type check

A transaction-level apply test can stay green if the resolver type guard is removed, because applyRemoteUiPreset rejects the same type later. The native init safety test must serve a schema-valid registry:ui item and assert the target has zero entries. Removing only the resolver guard makes that assertion fail in both binaries, even though the command still exits 1. Restore production source in a finally block after mutation.
