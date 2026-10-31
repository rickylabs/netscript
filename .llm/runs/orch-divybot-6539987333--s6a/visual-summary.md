# Final baseline visual coverage

The c6bce8f baseline contains41 registry components and11 blocks. This table covers that inventory only. Locked Studio Utility screen/state renders outrank the category sheets below, especially for badges, initials, field labels, navigation markers and table density. Other themes and PR2488 additions are excluded.

Actual source fixtures load scaffold Tailwind preflight and preset fonts. Main comparison is light/dark at1280px, native rest/hover/focus/active where interactive, every available contract state/size, plus390px, RTL and reduced motion. Private paired HTML contains each matching Figma PNG beside actual captures. No numerical pixel threshold is asserted; content, glyph and rasterization differences are expected.

| Registry item | Actual scope | Reference | Compared result / visible gap |
| --- | --- | --- | --- |
| button | button | actions/review-button.png | Sharp, flat controls; semantic variant fills; shipped sm/md/lg/icon sizes. Figma xs and link variant are unshipped. Fixture text in icon-size Button is intentionally wider than the icon square; IconButton has the actual hidden label. |
| icon-button | icon-button | actions/review-icon-button.png | Square control; no depth or movement. Only md is shipped. |
| input | input | forms/review-input.png | 32px control, input border, ink focus, red invalid; disabled muted. Only md and native input anatomy shipped; Figma sm and leading/trailing wrapper icons deferred. |
| textarea | textarea | forms/review-textarea.png | Sharp input surface, resizable, same state palette. Content/line count differs from reference. |
| checkbox | checkbox | forms/review-checkbox.png | 16px indicator, token radius; invalid persists when checked; ink focus. Native checked state is authoritative. |
| switch | switch | forms/review-switch.png | Locked authority: distinct input-border grey off and primary ink checked, native invalid/focus/disabled and reversed RTL travel; existing md only. |
| label | label | forms/review-label.png | Locked authority: labels above controls, strong14px/500 and neutral invalid label; srOnly remains invisible. |
| select | select | forms/review-select.png | Sharp native select, same input/focus/invalid palette. Native popup uses platform UI; Figma custom list anatomy is not this contract. |
| form-field | field | forms/review-field.png | Locked authority: strong14px/500 label above control, small helper/error; invalid red belongs to error copy/control border. |
| card | card | data-display/review-card.png | Transparent, top card hairline, no shadow; heading/small text and token padding. Existing default/md contract only; rule/sm/selected variants deferred. Interactive caller with tabIndex captured. |
| panel | panel | layout/review-panel.png | Card/muted/raised surfaces; quiet border, token padding, strong/small text, no elevation. |
| badge | badge | data-display/review-badge.png | Owner follow-up: variant subtle fills and semantic borders now win; leading6px dot and sans11px label retained across seven tones. Earlier transparent-outline captures are historical; the current 52-case gallery and computed-style matrix verify the correction. No separate emphasis axis added. |
| avatar | avatar | data-display/review-avatar.png | Locked authority: square initials tiles even when src is supplied; native lazy images make no photo request while hidden in Utility, while visible NS One photos still load. Sizes24/32/40 and agent/presence states retained. |
| citation-chip | citation-chip | ai/review-citation-chip.png | Mono caption, neutral rest and ink active chip, focus and hover. Existing switch-height role supplies 18px; no dedicated citation height exists. |
| code-block | code-block | data-display-2/review-code-block.png | Sharp quiet chrome, mono code and real escaped syntax spans; original clipboard payload. Unknown languages stay plain. No new line-number/size API. |
| model-selector | model-selector | ai/review-model-selector.png | Sharp trigger, mono provider, strong-small label, raised menu and ink focus. Native open/align states captured; gallery puts menu in flow. |
| tool-call-card | tool-call-card | ai/review-tool-call-card.png | Sharp panel, semantic status badges, mono name/IO and inset keyboard focus. Existing string arguments/results remain plain code; no language prop or new pending state added. |
| chart-block | chart-block | chart-palettes/review-chart-block.png | Default automatic categories use chart1–5; explicit semantic intent retained. Tracks, axes and text use tokens. |
| donut | donut | chart-palettes/review-donut.png | Chart palette for automatic rings/swatches, explicit error stays red, light center numeral. Shipped 96px SVG retained because no diameter role exists; reference is larger. |
| prompt-input | prompt-input | ai/review-prompt-input.png | Ink send/stop, square active tool marker, strong focus-within ring. Existing one-row auto-grow height and stacked compact capability slots remain; Figma compact is inline and default specimen taller. Missing height role recorded. |
| message | message | ai/review-message.png | Strong-small author, mono time/model, role-bound body, sharp user bubble and inherited initials avatar. Existing streaming/pending semantics retained. |
| markdown | prose | docs-kit/review-prose.png | Body and heading roles, ink links, sharp code surfaces, hairline tables and fenced-code syntax. |
| command-palette | command-palette | overlays/review-command-palette.png | Sharp raised panel, no blur/elevation, mono groups and neutral kind badge; keyboard behavior unchanged. |
| search | search | forms/review-search.png | Input hairline and mono keycap. Existing search is a launcher button; editable search anatomy belongs to another contract. |
| dropzone | dropzone | forms/review-dropzone.png | Sharp dashed card, ink focus/drag selection. Contract test fixture includes a second native file input as children to test its slot, visible in the gallery; the component's own picker stays hidden. |
| separator | separator | layout/review-separator.png | Hairline in both orientations. Existing default-only variant. |
| alert | alert | feedback/review-alert.png | Tinted status surface, one medium title, matching status icon/text, body aligned below label. Existing text glyphs differ from Figma icons. Neutral/important/strong variants unshipped. |
| inline-notice | inline-notice | feedback/review-inline-notice.png | Same semantic tones, compact small text and spacing. Trailing action part unshipped. |
| spinner | spinner | feedback/review-spinner.png | Marker arc is visible in dark; loading button inherits its text color. Existing sm/md/lg sizes. Tone axis unshipped. Reduced motion retains the existing slow essential indicator. |
| progress | progress | feedback/review-progress.png | Sharp material track, primary marker and secondary text role, existing semantic fills. RTL mirrors fill direction; reduced motion stops sweep. Circular/value-label anatomy unshipped. |
| skeleton | skeleton | feedback/review-skeleton.png | Flat muted bones, sharp shapes, quiet card/table grouping. Existing composite presets retained; no new avatar/block API. Reduced motion freezes animation. |
| breadcrumb | breadcrumb | navigation/review-breadcrumb.png | Body role, current emphasis, focus and mirrored RTL separator. |
| sidebar-shell | app-shell | layout/review-app-shell.png | Page spacing, logical sidebar edge, overlay scrim; existing responsive shell maintained. |
| page-header | page-header | layout/review-page-header.png | Locked page-title and body roles, section spacing; caller supplies actions. |
| filter-form | filter-form | layout/review-filter-form.png | Inherits transparent top-rule Card anatomy. Added-filter chips/clear controls are unshipped. |
| stats-grid | stats-grid | layout/review-stats-grid.png | Locked top hairline, mono uppercase eyebrow and 40px/400 KPI. Fixture content differs. |
| detail-layout | detail-layout | layout/review-detail-layout.png | Quiet section spacing; existing responsive columns retained. No new width role invented. |
| data-table | data-table | data-display/review-data-table.png | Locked hairline compact rows, uppercase mono headers, ink native selection and leading selection rule. DataGrid and block share scope. |
| responsive-table | table | data-display/review-table.png | Responsive table preserves mobile stacked-label fallback; sharp quiet edge, hairline rows, logical alignment. |
| pagination | pagination | navigation/review-pagination.png | Small metadata and inherited Utility controls; existing compact API does not add page-number anatomy. |
| empty-state | empty-state | feedback/review-empty-state.png | Sharp dashed frame, centered heading/body with role typography. Existing heading/content contract lacks media/actions/type variants. |
| section-divider | section-divider | layout/review-section-divider.png | Mono eyebrow voice and subtle hairline. Label sizing uses existing roles; no separate eyebrow size/line/tracking role exists. |
| theme-toggle | theme-toggle | actions/review-theme-toggle.png | Sharp 32px control, ink focus and reduced motion. |
| sidebar-toggle | sidebar-toggle | navigation/review-sidebar-toggle.png | Sharp 32px control, ink focus, quiet hover. |
| toast | toast | feedback/review-toast.png | Single title (legacy eyebrow hidden in Utility), tinted surface, text-tone timer at bottom, no slab shadow. Existing four types; default/loading/actions/stacked toaster unshipped. Runtime wrapper uses bottom-end placement, mirrored in RTL; stacking remains unshipped. |
| desktop-tray-menu | tray-menu | desktop/review-tray-menu.png | Raised sharp panel, mono group/keycap metadata, neutral hover and ink focus. Native role/disabled variants retained. |
| desktop-dialog | desktop-dialog | desktop/review-desktop-dialog.png | Sharp token surface, strong heading, small copy and ink action controls. Existing native-request API retained rather than simulated dialog variants. |
| desktop-notification | desktop-notification | desktop/review-desktop-notification.png | Sharp raised surface, role-bound icon tile and strong-small heading, body copy and focus. Existing disabled state captured. |
| desktop-window-chrome | window-chrome | desktop/review-window-chrome.png | Quiet bar, flat controls and destructive close hover only. Disabled controls and both schemes captured. |
| desktop-update-prompt | update-prompt | desktop/review-update-prompt.png | Sharp quiet panel, ink actions and info-toned manual update notice. Automatic/manual modes captured. |
| desktop-only | desktop-only | desktop/annotation-desktop-only.png | No visual chrome: hydration-safe capability gate renders caller fallback in browser/SSR. Actual fallback captured; native bridge mounting is a runtime concern, not a themed surface. |
| mcp-ui-widget | mcp-ui-widget | ai/review-mcp-ui-widget.png | Raised sharp frame; existing 16rem frame minimum retained because no named replacement height role. Existing error/loading/iframe lifecycle unchanged. |

Additional baseline contract surfaces (tabs, dialogs, sheets, drawers, menus, tooltips, sidebar/top-bar and DataGrid) are captured as well; see s4-comparison.md. S5 accepted gaps include larger composer toggles, equal native-launcher emphasis, muted user typing dots and no inner tool-error rule. Native dialog/menu positioning and iframe lifecycle are not proven by the gallery flow overrides.

Indeterminate progress is frozen at the actual animation midpoint only for screenshots; the override is removed before real reduced-motion assertions. Registry/code metadata and public APIs stay as reviewed. Final gate results are recorded separately; this table does not imply runtime or CI completion.

The extra accordion fixture is an unstyled headless primitive, outside the baseline registry inventory; native browser focus is captured but the Utility2px ring assertion does not apply. Registry Accordion styling belongs to the parallel gap-component work. Overlay trigger/close parts do consume the locked2px ink ring.

Card footer carry resolved: component-spec D3 explicitly requires a subtle top rule and card/footer fill; ledger-base-fixes only removes body-slot minimum heights, so it does not override that footer rule. The implemented quiet footer rule is retained. Indeterminate progress midpoint was visually inspected and is visible in dark mode.
