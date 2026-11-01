# Zero-definition production startup

Use fresh maintainer init with --db none and Aspire files present, then install sagas/workers/
triggers with --no-db --no-samples; sagas adds --saga-store-backend kv. Generate and doctor exit 0.
Do not use sync plugin to refresh a no-samples fixture: it copies official plugin jobs into it,
so an apparent zero-local-job fixture can have nonzero plugin-provided jobs. Use a fresh fixture.
The committed empty-startup.specimen.ts exercises all three startup APIs with isolated KV and
normal Deno sanitizers. Workers needs a streams reference even empty; the HTTP dependency here
is a test double. This is not Aspire or full runtime E2E evidence.
