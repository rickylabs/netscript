# Producer identities and record topology

`createServiceStreamProducer` starts epoch/sequence state afresh. A fixed producer ID
across process restarts can deduplicate new payloads against retained stream history.
Give each producer lifetime a UUID suffix, retain it during transport retries, and allocate
another when replacing a closed producer. Test service-only restart while streams stays up.

Activity is linked only when both the app and selected record service reference the same
stream resource. An app-only reference can expose stale history after unlinking the service;
return installed-unwired before probing and render actual record changes with explicit owners.
