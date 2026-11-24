# Plan for #2652

S1 applies a client-environment override in the app Vite asset, regenerates the embedded and publish carriers through their tasks, and adds a focused CLI scaffold browser regression. The regression compares served bytes and immutable cache headers for a changed client entry and lazy island dependency, observes the manifest-resolved browser modules and checks the stable server entry and launcher.

S2 records the final source checkout's runtime and ownership gate results in `worklog.md` and updates `context-pack.md`.

Run the regression once against the baseline scaffold and again against the corrected carrier. Run the scoped CLI test, type, format and lint checks, generator consistency checks, code-quality and architecture scans, preflight, docs accuracy and the one-pass scaffold runtime command.

The regression uses a database-free local-source scaffold, keeps one Chromium profile and origin, and shuts down the two owned production servers in sequence. The carrier can overlap #2577 and is regenerated after any main integration. Existing scaffold Vite files and public Fresh configuration are outside this slice. The coordinator's bootstrap records PLAN-EVAL as N/A and owns the independent IMPL-EVAL.
