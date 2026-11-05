# Research

S0 before manifest captured2026-10-28 at source28b0050d9832ec00386b9f9d0f1adc4ca37e7230 with Chromium153.0.8010.12, Playwright1.63.0, axe4.11.4. Eight PNGs total5812417bytes. Capture policy explicitly says original before evidence, not current UI comparisons. Never regenerate these screenshots.

Current accessibility.ts already filters serious/critical and preserves exact per-node counts/stale allowance rejection. design.spec.ts writes and attaches the complete axe scan before calling verifyAccessibility, so moderate/minor can remain in the artifact without blocking. Add explicit tests and durable policy prose, keeping existing controls and baseline engine unchanged.

Private research: Pillow PNG optimize=True increased largest capture1089096→1095716bytes while preserving RGBA; original-filter deflate9 gives only~1.5% smaller. Do not ship either insufficient approach. Official oxipng/oxipng GitHub release metadata resolved v10.2.1 for Linux x86_64; evaluate its lossless PNG optimization on private outputs, no source mutation or dependency additions.
