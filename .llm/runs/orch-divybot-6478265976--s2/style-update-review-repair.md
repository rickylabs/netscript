# Active style during updates

The same Opus5.5/high alternate-transport conversation started the full source review at b390932, then returned RESOURCE_EXHAUSTED before a verdict. Its partial source read identified an inactive locked style being eligible for selection during unnamed ui:update. This is not a terminal FAIL_FIX or an independent PASS.

The regression installed Utility and a fixture style, then ran unnamed update. Before repair the expected fixture-style became style-utility (3 tests pass, 1 fails, structured exit1). Updates now pass explicit read-configured-style intent to the installer. They retain source/ownership history without interpreting every historical style record as a selection command. Add/apply still allow explicit setup choices. A second case proves a manually configured style works even before that style has its own lock record.

Repair gates: structured full UI/client/command/startup/styles/token suite **68/0/0, exit0**; structured check/lint/fmt **4 source files, no drops, exit0**; root quality:scan:repo and arch:check exit0. The actual fixture style and page compilation proof remain intact.

Final independent review remains unavailable. The exact native Claude command is weekly-quota unavailable; the alternate native provider reports an individual quota with an approximately4h33m reset from its error. Preserve the same alternate evaluator conversation for eventual re-steering; do not substitute another model, call this self-tested fix independently approved, or mark READY yet.
