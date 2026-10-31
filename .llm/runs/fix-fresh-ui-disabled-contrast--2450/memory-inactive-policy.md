# Disabled contrast follow-up

Owner #2450 comment6539499855 names 56 failing disabled rows. There are six disabled pair definitions but58 total measurements: passing inactive rows must also be classified, measured and reported. Do not use56 as a total exemption count. Main baseline d25f65b5e has531 source failures/9132 measurements; expect475 active failures plus58 exemptions after explicit policy. Only known inactive text uses are in scope (SC1.4.3); suffix/background matching alone must never silently exempt active text.

Embeddings require two steps: annotate pair JSON then `deno task --cwd packages/fresh-ui tokens:embed` before invoking reporter, refresh exclusions with reporter, then embed again. Report script consumes the embedded policy. Carrier generator requires committed package sources for the final clean corpus; preview with --allow-dirty is not a final check. Package root check includes scripts and tests and uses its frozen private lock.
