# Installed identity and caller-owned hosts

Runtime registry discovery must distinguish package installation identity from
the service entrypoint. A caller-owned wrapper can live under the app while
InstalledFrom still identifies the installed package. Preserve that source when
composing a host. Directory sources must inspect their own manifest first;
starting at dirname(directory) can mistakenly select the consumer workspace.
Regression coverage includes published pins, module paths, and local/workspace/
file URL directory sources for ordinary and wrapped entrypoints.
