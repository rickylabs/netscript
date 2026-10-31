# Two distinct start contracts

KvStore.list uses exclusive start; WatchableKvBridge.list emulates native Deno selectors with
INCLUSIVE start for kvdex. The Redis kvdex provider uses this bridge; Deno uses raw native KV
and memory uses kvdex MapKv. Correcting Redis start must include explicit bridge translation,
or start-id queries silently lose their first document. Read an eligible start entry before the
forward stream or after the reverse stream, count it toward limit/cursor, and avoid fetching it
in reverse if the preceding stream already filled the page. bridge-list_test.ts compares against
native Deno in both directions across all adapters. Native prefix+start equal to prefix is an
invalid selector and is excluded from valid-selector oracle cases.
