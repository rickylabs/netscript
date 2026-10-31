# NS One output compatibility

The S0 baseline is `057397d3e3881a690492f518088140111711240e`.

- `tokens.css`: legacy fixture is byte-identical to S0; SHA-256 `8d613d26931870758414054c7c52efd369de13d3cdb0ef7edfe07c5e66752395`.
- `theme-bridge.css`: legacy fixture is byte-identical to S0; SHA-256 `7e7a3a3eb6cfd6f3a9ccfd07d3afe10012fb340bc9cc6ebcb8f532e29e8e4e05`.
- light: all 155 existing custom-property names retain their exact CSS values; zero changed or missing.
- dark: all 155 existing custom-property names retain their exact CSS values; zero changed or missing.

The output tests compare each effective legacy declaration in both schemes,
and preserve the complete old CSS and Tailwind bridge before the new blocks.
Modern NS One blocks and the final legacy `[data-theme='dark']` block use the
same declarations. Browser rendering comparison remains a required migration
slice gate; this property diff alone does not certify screenshots.
