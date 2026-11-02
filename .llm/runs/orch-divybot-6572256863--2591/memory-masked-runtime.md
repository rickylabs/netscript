# Why runtime CI masked the reported path

`packages/cli/e2e/suites/scaffold/capability-suites.ts` restarts background resources after DB seed.
`prepare-streams-storage-fixture.ts` explicitly adds users->streams, while pristine install links only apps.
`plugins/workers/bin/runtime.ts` reads the durable seed request just once at combined-process startup.
A running worker misses a later seed. A new gate must assert documented setup before either repair fixture.
