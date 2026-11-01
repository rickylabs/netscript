**[PHASE: IMPL] — zero-definition Aspire acceptance proven**

At reviewed head `f13b14c70e013871c6417d5860f035a645f59bb0`, the existing no-DB/no-samples installed project passed actual Aspire acceptance for **sagas, workers and triggers**.

The host lacks Docker, so focused verification used the generated project's supported native Garnet configuration, selected the installed .NET SDK within the disposable fixture, installed the real streams plugin for workers' dependency, and disabled the unrelated frontend. Aspire helpers were regenerated through the CLI. No framework source or AppHost helper was hand-edited; no test-double streams server was used in this proof. No local full `scaffold.runtime` suite was run.

| Resource | Registry entries | Aspire state / health | HTTP `/health` |
| --- | --- | --- | --- |
| sagas | 0 | Running / Healthy; actual HTTP check Healthy | 200; state=ready, registryReady=true, dependencyReady=true, restartCount=0 |
| workers | 0 handlers / 0 definitions | Running / Healthy; actual HTTP check Healthy | 200; state=ready, registryReady=true, dependencyReady=true, restartCount=0; dead-letter depth=0 |
| triggers | 0 | Running / Healthy; actual HTTP check Healthy | 200; state=ready, registryReady=true, dependencyReady=true, restartCount=0; fileWatches=[] |

Registry counts were checked by importing the generated modules used by the running resources. `plugin doctor` exited 0 with three empty-registry warnings and zero error rows. The real streams resource and native cache also had healthy probes.

Cleanup: stopped only this isolated AppHost by its exact project path. Post-stop inspection contains the same pre-existing unrelated AppHost identity as before the test; it was left untouched. No resources were killed by pattern or cleaned without ownership.

The full coordinator-armed CI runtime verdict is still pending at this head, so its checkbox remains unchecked. This closes the separate zero-definition-under-Aspire proof gap without substituting for that required CI verdict.
