# Full runtime quality prerequisites

The runtime suite's generated.quality-negative gate first demands a clean generated baseline. Under Deno 2.9.7, literal true/false ternaries in examples/crud and examples/index trigger no-constant-condition. Bind the existing scaffold choice to a named constant; do not suppress lint or weaken the negative control. Generated-project lint verifies the actual emitted code.

Forty seed rows expose generic CRUD's default ID-descending ten-row page. Insert samples oldest first so its first page is recent and includes Seed Model. Keep upsert update empty and preserve existing IDs/edits. A fresh SQLite proof confirms id 40 is the latest REC-10482; existing databases intentionally keep original IDs.
