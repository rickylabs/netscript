# Owner update — merge-only integration

The latest Cockpit owner instruction supersedes all earlier rebase/force-push
steps in this run. Never rebase or force-push from now on, including after an
Orchid merge-conflict notification; that notification is a known harness #775
bug. Future authorized conflict resolution uses fetch, merge origin/main,
manual conflict resolution, a merge commit and a plain push.

The unpublished rebased candidate remains preserved as reference/backup only.
It must not be force-pushed or treated as a deliverable lineage. An eventual
integration must retain the current remote feature branch's ancestry, preserve
all reviewed feature work and run fresh integrated gates and independent review.
The child likewise must retain its existing published ancestry when combining
an updated parent. No history rewrite is authorized.

The new Git workflow instruction does not choose a CSS budget policy. The
FAIL_PLAN / FAIL_RESCOPE stop and two-failure limit still apply. Fresh reads of
#2416 and both PR conversations show no later budget decision. Remote parent,
child and main remain c5877ff8, a9078d68 and 0af8fd9e. No new product work, merge,
push, evaluation attempt or READY claim ran during this constraint update.
