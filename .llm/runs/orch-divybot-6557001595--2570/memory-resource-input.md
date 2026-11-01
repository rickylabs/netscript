# Canonical memory resource needs initial pagination input

The memory service contract's list input requires limit and offset. Init previously
selected that typed procedure but emitted `{}` in the canonical shared loader,
causing four type errors in a generated memory-service app. The resource-slice
procedure selection now supports primitive initialInput data; init selects
`{ limit: 25, offset: 0 }` for the memory variant. The generic resource default stays
`{}` and database CRUD keeps its existing optional-input defaults.

Keep the Cache-first query, Managed form and Deferred summary leaves and markers.
Do not solve a page-generator input mismatch by changing service contracts.
