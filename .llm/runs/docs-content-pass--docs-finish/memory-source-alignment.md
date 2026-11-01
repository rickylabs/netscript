# Source alignment, 2026-10-29

Public CLI help includes tokens and ui:init in addition to agent/config/contract/db/deploy/generate/init/marketplace/plugin/service and ui:add/list/remove/update. Canonical install matches the executable quickstart: deno install --global --allow-all --name netscript --minimum-dependency-age=0 jsr:@netscript/cli with releaseSpecifier.

The current service scaffold already maps missing rows through notFound. It creates a repository, application and createRouter factory, not handlers querying context.db directly. Products CRUD lists return data plus page pagination; the custom dashboard read-model still deliberately returns items with offset pagination.

workers/jobs is the project authoring path. Official descriptors use workers/runtime.ts, sagas/runtime.ts and triggers/runtime.ts; package-level legacy contributions can still name bin/combined.ts. Do not confuse the two.

Exclude *.generated.ts from broad source searches: embedded Scalar and docs carriers contain multi-megabyte single lines. New sibling worktrees lack the Codex-added rg PATH entry; use its existing absolute binary.
