# Research

The issue comments contain no orchid-triage report. GitHub PR search for 2516 returns no existing PR. Baseline public init scaffolds before applying the preset; maintainer init also syncs packages first. Both must pre-resolve the preset. The shared resolver fetches JSON but defers registry schema validation until apply. Cached source bytes already flow through the remote resolution's transport, so the validated resolution can be retained rather than fetched again. Dry-run is documented to skip preset fetching/application and will retain that contract.

Existing URL-theme command test uses loopback HTTP; retain that working local-development path. Public agent integration tests inject preset application and need a preparation stub. Prior environment memory confirms RTK is unavailable, wrappers accept repeated --file, docs carriers use gen:agent-docs-prose then gen:publish-assets, and check:assets-barrel compares against committed generated output.

Archetype 6 CLI/tooling. No new public package export or dependency; internal typed preparation contract only. JSR rubric: preserve explicit types/docs, package metadata/export map unchanged. No new architecture debt planned.

## Repair findings

PR #2518 is the authorized existing repair target, open at 69951eb22, rather than a duplicate to replace. There is no orchid-triage comment. Its previous BLOCKED report concerned a policy-skipped required context; the new owner directive explicitly permits that skip. The resolver validates JSON themes but returned decoded code/share themes without registration checks. Registry-client's direct and dependency reads already normalize through uiRegistryUrl, so moving policy there covers all callers without new adapters. The existing apply-stage type check masks removal of the early resolver guard in transaction-only tests; native init zero-file assertions expose it.
