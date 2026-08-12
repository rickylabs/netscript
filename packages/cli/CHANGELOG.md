# Changelog

## 0.0.6

- `plugin doctor` now treats package-backed plugins as in-process package installations instead of
  requiring conventional local plugin directories.
- Published plugin manifest permissions now contribute to generated service runtime permissions;
  explicit appsettings and contribution-specific permissions retain precedence.
- `plugin list` renders package-backed sources as `package:<configured-specifier>` rather than
  implying or omitting a local workdir.
