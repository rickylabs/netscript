# 2026-10-29 — Component style file ownership

A component-source style is a registry:style item with a valid meta.components map. An ordinary registry:style item may just supply component support CSS; it must remain independent and may itself be remapped by the selected source map. Do not skip all style-typed items during source substitution.

When a selected style owns files, keeping its historical lock record creates a false collision as soon as the next style writes the same target. Remove only superseded source-map selections that no surviving item requires, transfer shared destinations in the staged plan, and retire unshared files/imports. Preserve unrelated styles, dependency-required selections, shared copies and managed core token files. Include retired-file edits in the same strict preflight as rewritten copies; --force must not bypass it, and --diff must not write.

Config style is intent; lock appliedStyle records the last completed source transition. Optional per-item componentStyle provenance and root appliedStyle fields retain version-1 compatibility and let a later manually edited config trigger full regeneration. Theme/font-only preset application must not advance that component baseline.

Regression recipe: run the structured test wrapper on kernel/application/ui/v2/tests, then the public protocol-command_test.ts and real-ui-cli-acceptance_test.ts. The unit fixture covers shared/retired CSS, a remapped support stylesheet, retained independent/transitive owners and atomic edited-file refusal. The actual CLI fixture switches between two namespaced styles owning the same CSS target and checks unchanged page usage, retired-file refusal/removal and unnamed update.

Before repair the new ownership controls failed because the old selection still owned the destination. After repair the focused v2 suite passes 18/0/0. Native fixture authors must supply distinct bytes for every alternate source name; a missing variant branch can make a correct resolver look broken.
