# Executed generated-project restart acceptance

A fresh local-source CLI project was generated with no database, then the streams plugin was
installed and its current local service source copied using the maintainer sync command. For this
focused acceptance only, unrelated app/cache resources were removed before generation; no container
or full scaffold.runtime suite was launched.

The committed `prepare-streams-storage-fixture.ts` generated AppHost helpers from the project
config. The fixture retained the pristine ephemeral streams configuration as a control and opted
the original streams resource into DataDirectories.STREAMS_DATA_DIR. It did not create the data
directory. The generated registration created the directory before process startup.

Aspire restore and isolated start succeeded. The committed `verify-streams-storage-restart.ts`
executed against the generated AppHost and exited 0:

- Ephemeral control detailed health: mode memory, durable false, probe not-applicable.
- Original streams detailed health: mode file, durable true, probe passed; no local data path leaked.
- Public DurableStreamProducer enqueued two document upserts and a delete and flushed successfully.
- HTTP replay contained all three expected nonempty events before restart (dynamic trace headers
  stripped only for the expected business-envelope assertion).
- Subscriber established before `aspire resource streams restart`; gate required departure from
  Running and arrival of the new Running/Healthy process.
- Full raw JSON event history, including dynamic headers, matched exactly after restart.
- The same proof failed with emitted storage binding removed, then passed after restoration.

Result: the historical silent producer-write loss did not reproduce on current main's existing
file-backed service test or on this generated-project current implementation.

The exact focused AppHost was stopped after testing; no foreign resources were touched. Retained
fixture data is only under ignored scratch. Full `e2e-cli scaffold.runtime` remains CI-only and
requires coordinator arming of e2e-cli-gate; this focused execution does not substitute for it.
