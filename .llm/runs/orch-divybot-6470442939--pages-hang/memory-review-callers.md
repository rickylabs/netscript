# Review regressions in shared snippet tooling

The compiler is shared by docs:snippets and docs:readme-fences. Node spawn requires allow-env on
the README task and executable shebang too; keep the existing readme-fence-workflow test aligned.
README's shrink-only ratchet tolerates known errors, so ordinary errors cannot stop later fences,
and timeouts/interruption must explicitly mark the result incomplete. Deno coalesces repeated
missing targets in a combined graph; per-entrypoint checking must preserve this accounting without
deduplicating different targets or separate ordinary type errors. Root README ceilings stay fixed.

External SIGTERM on the outer launcher differs from its own timer firing. The launcher must give
its worker a longer graceful cleanup window than the worker gives a compiler group. Test direct
signals to the launcher with a TERM-resistant compiler, not only the launcher timeout path.

Every consumer must also treat `interrupted` as fatal: git check-ignore ordinarily uses nonzero
to mean "not ignored", but cancellation must abort traversal, not be converted to false. The
extractor regression pauses a real probe, signals the worker, and proves the walk cannot resume.
