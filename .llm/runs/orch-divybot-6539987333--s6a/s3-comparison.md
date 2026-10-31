# S3 comparison

Actual Preact markup, Utility tokens and component CSS are captured with the scaffold's Tailwind preflight. Both schemes, mobile/desktop, pointer/keyboard where interactive, RTL and reduced motion. Status surfaces/headers are checked against resolved tone roles; cards must have only a top rule. Matching images are under the Figma handoff review directory. Private HTML places reference and actual images side by side.

| Component | Figma reference | Result / explained gap |
| --- | --- | --- |
| card | data-display/review-card.png | Transparent, top card hairline, no shadow; heading/small text and token padding. Existing default/md contract only; rule/sm/selected variants deferred. Interactive caller with tabIndex captured. |
| panel | layout/review-panel.png | Card/muted/raised surfaces; quiet border, token padding, strong/small text, no elevation. |
| filter-form | layout/review-filter-form.png | Inherits transparent top-rule Card anatomy. Added-filter chips/clear controls are unshipped. |
| badge | data-display/review-badge.png | Mono, sentence case, radius 2, subtle semantic tones. Info is now shipped. Outline/solid/plain, dot/icon/remove remain outside this implementation. |
| avatar | data-display/review-avatar.png | Square 24/32/40 shapes; initials muted, agent ink, presence at logical end. Images and glyphs vary with fixture content. |
| alert | feedback/review-alert.png | Tinted status surface, one medium title, matching status icon/text, body aligned below label. Existing text glyphs differ from Figma icons. Neutral/important/strong variants unshipped. |
| inline-notice | feedback/review-inline-notice.png | Same semantic tones, compact small text and spacing. Trailing action part unshipped. |
| toast | feedback/review-toast.png | Single title (legacy eyebrow hidden in Utility), tinted surface, text-tone timer at bottom, no slab shadow. Existing four types; default/loading/actions/stacked toaster unshipped. Runtime wrapper uses bottom-end placement, mirrored in RTL; stacking remains unshipped. |
| spinner | feedback/review-spinner.png | Marker arc is visible in dark; loading button inherits its text color. Existing sm/md/lg sizes. Tone axis unshipped. Reduced motion retains the existing slow essential indicator. |
| progress | feedback/review-progress.png | Sharp material track, primary marker and secondary text role, existing semantic fills. RTL mirrors fill direction; reduced motion stops sweep. Circular/value-label anatomy unshipped. |
| skeleton | feedback/review-skeleton.png | Flat muted bones, sharp shapes, quiet card/table grouping. Existing composite presets retained; no new avatar/block API. Reduced motion freezes animation. |
| empty-state | feedback/review-empty-state.png | Sharp dashed frame, centered heading/body with role typography. Existing heading/content contract lacks media/actions/type variants. |
| separator | layout/review-separator.png | Hairline in both orientations. Existing default-only variant. |
| section-divider | layout/review-section-divider.png | Mono eyebrow voice and subtle hairline. Label sizing uses existing roles; no separate eyebrow size/line/tracking role exists. |

No numerical raster-diff threshold. Content, glyph shape, slot size and rasterization differences are explicit. Added info tone has legacy secondary fallbacks; all pre-existing NS One fixtures retain their prior computed styling.
