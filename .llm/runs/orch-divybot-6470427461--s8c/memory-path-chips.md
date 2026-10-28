# Docs path chips

Path chips use nowrap/ellipsis with a full chip title and unmodified textContent for clipboard. The value flex item must have min-width:0 and overflow:hidden; the chip retains max-width:100%. Code path labels need display:block for text-overflow to render an ellipsis.

Lume Markdown inserts p wrappers inside the hero chip stack. A flex gap alone therefore leaves an extra first margin; display:contents + margin:0 on those p wrappers and display:none on empty wrappers gives exactly one 8px stack gap. Test bounding-box gaps, not just the CSS gap property. Text-removal assertions should first require the containing paragraph to exist, avoiding vacuous passes.
