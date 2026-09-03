# Final canary.10 acceptance

- Native publication: run 33762898477, SUCCESS.
- Immutable tag: `170e33782acf2dfb4bccc3f4e461ae8f5a149f85`.
- Exact production E2E: run 33763460542, SUCCESS; README 13/0, scaffold runtime 104/0,
  quickstart walk plus cleanup/integrity 9/0, no retries.
- Supplementary README-only verification: run 33765493143, SUCCESS at verification branch
  `test/readme-canary10-cleanup-proof@e677ac3c8`; same published CLI, no product edits.
- Initial state: AppHosts 0, containers 0, volumes 0, custom networks 0, cached images 6.
- Post-cleanup state: AppHosts 0, containers 0, volumes 0, custom networks 0.
- The supplementary artifact includes `readme-post-cleanup-baseline.json`; it closes the missing
  inventory evidence without pretending that the original cleanup script observed processes.
- #1881, #863 and #1712 closed with verified acceptance at 14:19Z. All milestone issues are now
  complete; stable publication and coordinator tracking PR closeout remain.
- The primary claimed the singleton stable writer only after those closures and a clean
  `harness:milestone:validate` result over the real 21-gate current-main evidence set.

## Release notes

Canary.10 has its canonical generated GitHub prerelease note (21 merged PRs); it is not Latest.
Stable notes explicitly use `--prev-tag v0.0.6`, preserving the whole milestone range.
The native dry-run otherwise returns only the first 100 closed issues; GitHub reports 173 before
the three final closures. Final release-note reconciliation must include every paginated issue,
using the existing native renderer, not silently label the first page as complete.
The native release creation remains mandatory; no ad-hoc `gh release create` or local JSR publish.

Prepared introduction: `../release-0.0.7-intro.md`, including breaking/migration scope and explicitly
undelivered work. Do not mint a new canary for release-note formatting.
