# 2026-11-01 — native input, browser ports and honest size gates

A native event can run before the animation frame queued by that input. Do not
let an early scroll consume the only intent flag and turn that queued frame into
an end-follow request. A separate input-frame flag preserves the existing pin
threshold and lets observer-only frames retain their established follow behavior.
Prove the race with real one-pixel wheel movement and unchanged native key tests.

Clipboard permission names are automation-port capabilities, not a complete
oracle for native clipboard behavior. Existing trusted editing allowed actual
write, paste, sanitization and form submission in all three engines without the
unnecessary grant. Keep the real behavior assertions; do not mock the API merely
to avoid a setup error.

Use isolated bare native controls before attributing a browser-chrome focus
boundary to a component. Keep ordinary modal behavior, interior Tab/ShiftTab,
inert outside content, Escape, focus return and axe in every tested engine.
Separate only the independently reproduced automation-port boundary, keep its
original assertions in the supported maintained project, and state that scope.
The independent evaluator must approve any such classification explicitly.

Noninteractive parts can affect native pointer ownership. For NavigationMenu,
letting its native summary receive pointer hits restored subsequent native Tab
traversal in WebKit without a key handler or focus controller. Scope that rule to
the component's own label/chevron parts, preserve content links, and verify hover
paint and the unchanged pointer-and-keyboard test in every engine.

When the owner chooses measured size plus headroom, use literal measured caps;
never make the check auto-grow. Preserve every-byte inventory, source/carrier
identity, native gzip, both assertions and the package cap. Highly compressible
authored CSS proves raw rejection; bounded high-entropy CSS proves gzip rejection.
Regenerate the real carrier for each, restore exact files, then prove positive.
Changing a cap by one byte is useful diagnostics but does not replace real bloat.

Keep source, generated carriers and test builds frozen. Wait for generators and
browser jobs to close before a workspace-copy publish dry run. At publication,
record the actual committed source, not a provisional dirty-tree receipt. Preserve
published ancestry with normal merges and plain pushes; repeat the public privacy
audit before every push and publish verdicts/counts rather than leak matches.
