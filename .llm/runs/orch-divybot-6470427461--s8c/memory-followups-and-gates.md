# #2451 integration and final gates

Reviewed #2452 source fixes can be reconciled without reverting S8c: use lightningcss, move final ID assignment before Pagefind, replace diagram/tab/comparison randomness with page URL + DOM-order indexes, keep human labels and richer dotenv grammar. The lock delta is seven additions for lightningcss-wasm 1.29.2 and pinned Lume modules, no version changes/deletions.

check-reproducible.ts defaults to strict all-output comparison. The opt-in --allow-pagefind-metadata reports only known Pagefind entry/filter/meta serialization variation (#2453), while HTML, twins, fragments and all other assets remain exact. Local S8c compares 253 HTML pages and 202 twins. Real Pagefind search still must pass.

The built-in Vento escape filter preserves raw API generics for names/types/kinds; raw interpolation previously parsed generic parameters as HTML. Keep description HTML on its existing ic path. A real SagaState and SagaDefinition regression verifies this.

Full docs browser command runs 100 tests, with 32 axe audits and zero serious/critical findings. Screenshot PNG files are copied into attachments too; count capture names rather than filesystem duplicates (52 captures: 24 full-page + 28 viewport/search). CLI runtime preflight cannot pass in this worker without Docker; use the unchanged e2e-cli workflow_dispatch for hosted proof, without adding labels. Record local preflight/cleanup as unproven rather than a pass.
