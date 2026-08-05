# Context pack — #1227 reopened restore stability

PR #1297 fixed the 30-minute failure budget but not the intermittent restore cancellation.
Run 30961102523 failed canary.10 quickstart restore after 180.1s, named an Aspire CLI log, and then
discarded it. Current slice captures that log first. Do not implement broad retry/cache guesses;
read the cloud log, then lock the exact predicate, package paths, and consecutive-run count.

Identical retained local logs prove the operation is Aspire's bundled NuGet restore of five exact
integration packages. The v1 cache missed on both cloud runs and could not save from a red job. S2
uses a prerequisite seed/save job under v2, verifies every package, and retries only the exact exit-6
two-marker signature. Completion requires three consecutive green branch runs.
