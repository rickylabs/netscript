# Independent Astra visual evaluation

Separate read-only `gpt-6-astra` session, owner override. The same reviewer
inspected the 10 Figma Utility references and live seeded-run captures. Initial
mobile and reference-page findings were repaired and reviewed in that session.
No shell bypass or reviewer writes were used.

**Final visual subgate: PASS — all 60 combinations meet the 8/10 bar.**

I inspected all 60 current screenshots and all 12 viewport proofs using native `view_image`. For the supplied captures attributed to candidate `04149cb48ee54101f87773c5d4cab5229bc01103`, all previously approved scores remain unchanged.

Scores are out of 10.

| View | Light 1440 | Dark 1440 | Light 390 | Dark 390 | Pixel assessment |
|---|---:|---:|---:|---:|---|
| Overview | 8.5 | 8.5 | 8.0 | 8.0 | Clear hierarchy; charts, activity and background work remain contained. |
| Orders | 8.5 | 8.5 | 8.0 | 8.0 | Readable columns and mobile rows; pagination follows the final row. |
| Order detail | 8.0 | 8.0 | 8.0 | 8.0 | Full-width product/SKU, labelled quantities and prices, adequate shipping separation. |
| Customers | 8.5 | 8.5 | 8.0 | 8.0 | Names, emails, company, location and order counts remain fully visible. |
| Products | 8.5 | 8.5 | 8.0 | 8.0 | Complete names/SKUs, prices, categories and stock badges in both layouts. |
| Health | 8.5 | 8.5 | 8.0 | 8.0 | Resource names fit; degraded and unavailable states remain distinct and readable. |
| Settings | 8.5 | 8.5 | 8.0 | 8.0 | Fields and connection cards fit; corrected “Orders” copy reads cleanly. |
| Sign-in | 8.0 | 8.0 | 8.0 | 8.0 | Clear provider continuation and configuration summary; new application name fits. |
| Assistant | 8.5 | 8.5 | 8.0 | 8.0 | Connect-provider state retains clear hierarchy and readable instruction wrapping. |
| Examples | 8.5 | 8.5 | 8.0 | 8.0 | Route descriptions, metadata and Open actions remain separated and legible. |
| Service example | 8.0 | 8.0 | 8.0 | 8.0 | Records, disclosures, note form and summary remain readable without collisions. |
| CRUD / Directory pattern | 8.0 | 8.0 | 8.0 | 8.0 | All desktop headings and empty-state borders complete; detail panel remains below. |
| Telemetry reference | 8.0 | 8.0 | 8.0 | 8.0 | Unavailable alert retains clear icon, heading, diagnostic detail and theme contrast. |
| Typed route reference | 8.0 | 8.0 | 8.0 | 8.0 | Title, route parameter, explanation and navigation fit cleanly. |
| Command | 8.0 | 8.0 | 8.0 | 8.0 | Dialog, close control and footer fit; viewport backdrop covers the visible page. |

The approved commerce, Directory and telemetry presentation repairs are retained. **No required visual repairs remain.**

The viewport proofs show unobscured final order rows and pagination. The desktop Orders “middle” and “bottom” files are identical within each theme, so they establish one scroll position per theme; the mobile proofs show distinct positions. Command viewport captures resolve the backdrop cutoff seen in full-page captures.

This is screenshot-based visual acceptance only. It does not certify authentication, model access, telemetry integration or the reported runtime gates. Formal Sol leaf IMPL-EVAL remains separate and pending.
