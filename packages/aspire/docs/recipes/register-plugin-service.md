# Register a Plugin Service

Extend `AspireNSPluginContribution`, implement `contribute`, and return every resource added to the
supplied builder. Keep SDK-specific calls in the host adapter, not inside the plugin package.
