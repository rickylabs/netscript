# Theme guidance location and freshness — 2026-11-01

A shared agent skill is normally installed at workspace scope; UI theme items
are installed at Fresh app scope. Do not build sibling Markdown links between
them. State paths relative to the selected app (`apps/<app>/` in a scaffolded
workspace, root in a standalone app) and retain canonical source hyperlinks.
Use the authored registry's preset/source/target mappings rather than copying
theme bodies or hand-maintaining a language-to-preset table.

Legacy bare scaffold omits theme documentation intentionally. Real init --preset
uses v2 application and installs the pair; integration tests should exercise
that path instead of fixture preparation stubs. Assert exact installed bytes
and actual paths, not just strings that happen to resemble a relative link.

Finish native carrier generation before starting tests that import embedded
skills: a concurrently launched Deno module graph can capture the older carrier.
Use standalone scoped lint/fmt configuration for CLI/internal tooling and verify
selected/processed coverage because root excludes those directories.

An inaccessible Docker daemon makes full scaffold.runtime and Docker cleanup
inspection UNPROVEN, even if static, unit and native agent install checks pass.
Preserve that limitation under the operator's explicit permission; leave
foreign/unproven resource ownership alone.
