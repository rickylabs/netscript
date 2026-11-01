# Research

#2491 has two unchecked acceptance boxes and no open/merged PR or issue comment claiming it.
It follows completed registry-v2 #2415; other epic cells have active owners. PR2559 touches
preset/config work, not this client/lifecycle; no source overlap expected.

The registry lock stores installed item references, never collection keys. The existing
update guard expands only built-in collections and requires every member installed. The
client already fetches remote namespace catalogs using configured index or registry URL,
validates registry metadata, and caches transport responses per request. Remote item and
dependency resolution already preserve namespace identity and authenticated transport.

Extend existing client collections(namespace?) so names and bare members are qualified at
that boundary. Update expands a remote collection to the intersection with lock items,
without passing its uninstalled member names to the installer. Preserve built-in complete
membership semantics and legacy unlocked behavior. Existing UiRegistryDependencies ports
and atomic plan commit preserve filesystem/drift rules.

Doctrine archetype6: CLI is thin, application consumes existing ports; no new port/export
or architecture debt. Package verdict is retained; no structural change proposed. Public
export/JSR risks are unchanged because these are internal application contracts.
