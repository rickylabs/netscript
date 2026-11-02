# Service consumers and generated output

`plugin install --service <name>` writes `linking.consumers.services` in the installed manifest;
`reconcilePluginReferences` then writes the service's PluginReferences and helper regeneration
wires discovery. `--service-refs` is the opposite direction: services the plugin depends on.
Do not confuse the two. Reinstall without --service preserves the recorded selection.

The root formatter excludes CLI sources. For owned CLI files, copy only root fmt/lint settings
to an ignored config without selection exclusions, then pass explicit owned files to the wrappers.
Existing unrelated install test files have legacy format drift; do not include them in this slice.
