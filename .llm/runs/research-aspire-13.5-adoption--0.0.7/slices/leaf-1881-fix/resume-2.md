use harness

Coordinator addendum to the brief (slices/leaf-1881-fix/brief.md, "Addendum" section) — apply now in
this turn, bounded: initializeState at index 0 must remove any pre-existing <runRoot>/.deno-install
(recursive, NotFound tolerated) before recreating it; extend the RED/GREEN test to seed a fake
<runRoot>/.deno-install/bin/netscript beforehand and prove it is removed, argv still verbatim, index>=1
inheriting the persisted root/PATH from state. Re-run the scoped gates, commit, push, and make sure the
non-draft PR (Part of #1881 / Part of #863, no closing keyword) is open with the RED/GREEN outputs in
its body. Do not stop before the PR exists.
