**FAIL_FIX — PR #2586 does not meet the independent visual acceptance gate.** Six page groups fall short. Scores below are the minimum across light/dark and 1440/390; stronger variants do not offset weaker ones. Density means useful, readable information per visible area—not record count or total page length.

| Page | Minimum /10 | Limiting variants | Density ≥ Figma | Craft ≥ Figma |
|---|---:|---|:---:|:---:|
| [Overview](screens/viewports/overview-light-390.png) | **7.0** | 390, both themes | No | No |
| [Records](screens/viewports/records-light-390.png) | **7.5** | 390, both themes | No | No |
| [Detail](screens/detail-light-1440.png) | **8.0** | 1440, both themes | Yes | Yes |
| [Examples index](screens/viewports/examples-light-390.png) | **6.5** | 390, both themes | No | No |
| [Live service Example](screens/viewports/example-light-390.png) | **6.0** | 390, both themes | No | No |
| [Settings](screens/viewports/settings-dark-390.png) | **8.0** | 390, both themes | Yes | Yes |
| [Health](screens/health-light-390.png) | **7.5** | 390, both themes | No | No |
| [Sign-in](screens/sign-in-dark-1440.png) | **8.0** | 1440, both themes | Yes | Yes |
| [Command](screens/command-light-390.png) | **7.0** | 390, both themes | Yes | No |

Required visual changes:

- **Overview:** At 390, `$8,927.37` breaks into `$8,927.` and `37`. The oversized metric block consumes excessive vertical space, and the chart’s final date labels overlap. Reduce responsive metric type and keep monetary values intact; simplify count-axis ticks and reduce date-label frequency. Align chart status colors with table badges—the current chart and record list assign different colors to the same statuses.

- **Records:** Mobile records occupy approximately 160 px each, while desktop rows are approximately 67 px versus the reference’s roughly 44 px. The resulting page is long without equivalent information density. Compress row padding and group mobile identity, status, and amount more tightly. Align the desktop **Apply filters** button with its inputs, and give mobile filters a consistent grid. Keep pagination readily accessible instead of only after 25 tall records.

- **Examples index:** The mobile “Scaffold example routes” caption is confined to a narrow left column and wraps across three lines. Each route then expands into four widely spaced label/value rows. Make the caption span the container, remove redundant heading layers, and use compact route entries with a clear title, status, metadata, and action.

- **Live service Example:** At 390, the table cuts through owner names and emails; status, amount, date, and details are outside the visible area without an evident horizontal-scroll cue. Use responsive records that retain essential fields, or a deliberately signposted scrolling table with pinned identity. Replace the exposed **Has Next / Yes; Has Prev / No** metadata with a designed pagination treatment. Unify status badges with Records and reduce the large blank interval before summary values.

- **Health:** The mobile three-metric block becomes an unbalanced two-by-two arrangement, leaving an empty quadrant and pushing the first resource below roughly 800 px. Compact the summary and bring resource rows forward. Given the supplied fixture facts, the dominant **Degraded** banner also communicates the wrong condition: use **“4 operational · 1 not linked”** with **“Discovery incomplete”**, reserving degradation styling for observed failures.

- **Command:** Desktop presents both **Esc** and **esc** controls and ends the visible results with an orphan **Actions** heading. Mobile cuts through the fifth result at the footer without a clear overflow cue. Use one close affordance, a clear selected-result treatment, deliberate scroll boundaries, and group headings that remain visually attached to their results.

The passing pages extend the reference language through visual organization. **Detail** has a clear amount/status hierarchy, aligned information rows, and an owner/timeline rail that stacks coherently. **Settings** maintains consistent controls and adds orderly capability cards across widths. **Sign-in** uses restrained dividers, a slim progress indicator, and aligned capability rows to present the absent-provider setup honestly; fake credential fields are unnecessary.

**Coverage:** Inspected all **78 supplied PNGs using `view_image`**: all 10 Figma references—dashboard, orders, settings, sign-in, and command in both themes—and all 68 actual captures: 32 full-page images, 32 viewport companions, and four command viewport images. This covers every page group in both themes at both widths.

References were inspected under `.llm/runs/design-system-s4--language-review/figma-library/review/screens/utility/`; actual captures under `.llm/runs/orch-divybot-6562102567--2570-phase2/screens/`.

**Limitations:** This is static visual acceptance, independent of the completed source IMPL-EVAL. Runtime facts were accepted as supplied; interaction behavior was not tested. No mobile Figma references were supplied, so mobile judgments apply the references’ density, hierarchy, and component craft to the narrower layout.
