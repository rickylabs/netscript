# Contrast mappings and baseline

Approved #2506 plus #2500 inactive annotations reproduces exactly 44 active failures (20 accent mapping, 5 invalid Liquid combinations, 19 legacy) and 58 exempt measurements. The owner counted 56 formerly failing disabled uses; the other two exempt uses already passed. Both counts belong in the final report.

The semantic accent-fg/accent-hover pair already exists. Remove the duplicate invalid pair against Base accent-solid-hover; no component consumes that source-only name. Liquid uses existing white liquid-primary-fg on tinted-primary, not the generated text/material Cartesian product. ink/d-fg has no WEB syntax and resolves through aliases; no new exported name registration is needed.

NS One legacy.json owns both the token values and exact CSS prefix. Adjust semantic primary-hover, secondary-hover, destructive, input-border and ring in that file and its matching CSS declarations, retaining primitive ramps and geometry. Re-import DTCG then embed before measuring.

Independent review found component error labels used destructive (solid fill) as a text color. A fill cannot satisfy white on-color text and dark-mode label text at once. Use destructive-text for text/icon color in form-field, label, toast, alert, Markdown and tinted badge styles; source-policy test scans every component CSS. NS One dark destructive-text must retain red-5 when the owned destructive fill is darkened. Regenerate registry embedding after stylesheet edits.
