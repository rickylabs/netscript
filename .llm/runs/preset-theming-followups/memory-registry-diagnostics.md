# Registry diagnostics across both paths

Changing uiRegistryUrl alone is insufficient: UiConfigSchema's registryUrl refine used to swallow its exception and issue generic HTTPS/credentials prose. Use superRefine to carry the safe policy message through configured string/object/index sources; keep native URL parser TypeErrors redacted, since malformed input may include secrets. Regression tests cover all three source shapes, query, fragment, credentials and malformed input.
