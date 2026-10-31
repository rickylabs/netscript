# Empty generated surface regression

The full core shard includes plugin-check-command_test.ts, outside the initial focused registry
generator tests. Its historical last-workers-output test expected deletion; #2162 requires an
importable empty registry that stays in both output and producer inventories. Retain the AI
inactive-output deletion and foreign-ownership controls. The updated full file passes 29/29
with a new missing-empty-output negative control.
