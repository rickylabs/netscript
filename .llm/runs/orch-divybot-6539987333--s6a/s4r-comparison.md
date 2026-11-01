# Locked Utility reconciliation

Authority: PR #2508 locked/studio--neutral-ink and studio--states--neutral-ink, both schemes. These supersede conflicting S2/S3 library rows.

| Component | Locked result |
| --- | --- |
| Badge | Transparent outline and leading decorative dot in the status text colour; sans 11px label; 20px token height. Legacy dots hidden. All seven shipped tones captured. |
| Avatar | Initials in square muted tiles, including callers supplying src; legacy still displays photos. Sizes and agent/presence retained. |
| Switch | Input-border grey off track, ink checked track, dark/light thumb roles; native checked, invalid, disabled, focus and RTL travel tested. |
| Field | 14px/500 strong labels remain above controls and neutral in invalid state; error text and border carry red. |
| Button | Existing solid ink primary and 2px/2px ring confirmed against locked state sheet; no source adjustment needed. |
| Eyebrows | Existing mono uppercase section/stat/nav roles match locked hierarchy. |

102 real fixtures and 416 measurements, both schemes plus RTL/reduced/mobile, zero browser findings. 262 legacy fixtures × two schemes preserve existing visible computed paint/geometry, including new actual avatar/badge markup. Comparison ignores hidden decorative parts, and never substitutes a basic fixture into a similarly named variant fixture. Nav selection retains transparent nav-active from the locked composed screen; state-sheet selected tint differs. Caller-supplied sidebar icons remain supported.
