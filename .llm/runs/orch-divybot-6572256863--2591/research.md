# Research

Read issue 2591 and all comments, issue 2587 and comments, and merged PR 2589's body.
No triage comment or existing PR for 2591 was found. Consulted prior run memory first.
Called the in-repo MCP `find_guidance` for scaffolding, lifecycle, linking and doctor.

At baseline, combined workers dispatch seed intent only once at startup. The documented
start/init/generate/seed order publishes intent after that read. The runtime suite restarts
workers after seed, hiding this ordering failure. Its streams storage fixture also adds the
users service's stream reference; normal install links only apps. Both mask acceptance gaps.

Reproduced clean local init, worker install, stream install and isolated Aspire start under
Deno 2.9.7 in `.llm/tmp/2591-repro/documented-2591`. Settings confirm app->streams but no
orders->streams edge. Plugin doctor verifies the generated registry but reports worker runtime
unhealthy. All three DB commands fail because this environment has no Docker daemon. Full
baseline runtime reproduction is unproven locally and must run on the CI runtime runner.

CLI is Archetype 6; workers is Archetype 5 with runtime behavior. No new package entrypoint
or third-party dependency is needed. Existing seed identity and worker idempotency remain.
