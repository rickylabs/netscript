# Research — issue #804

- Live issue #804 confirms `--dry-run` must perform zero writes, preserve an accurate printed plan, and cover every plugin `add` verb.
- Add surfaces: workers (`job`, `task`, `workflow`), sagas (`saga`), triggers (`webhook`, `file-watch`, `scheduled`), streams (`schema`, `producer`, `consumer`).
- Each family already funnels add verbs through one local backend seam, but all seams ignore the parsed `dry-run` flag. Workers, sagas, and triggers additionally generate `.netscript` registries after artifact writes.
- Shared contract: scaffolders already return deterministic `ScaffoldArtifact[]`; planning can therefore be separated from persistence before any filesystem adapter is invoked.
- Archetype: 5 (first-party plugins), with CLI behavior folded in. Doctrine verdict: sagas/streams Keep; triggers/workers Refactor, with no structural expansion in this fix.
- JSR surface: no export or dependency changes are planned; slow-type and publish-shape risk is N/A beyond existing package gates.

No material rescope discovered.
