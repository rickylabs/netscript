# Browser execution in minimal worker

If Chromium lacks system shared libraries and sudo is unavailable, apt-get download plus dpkg-deb extraction into the project run directory provides an isolated LD_LIBRARY_PATH. Check indirect dependencies with ldd under that path. Required here: nspr/nss, atk/atspi, cups, xkbcommon, asound, gbm/drm, Xcomposite/Xdamage/Xfixes/Xrandr/Xi, wayland-server. No system packages or browser cache contents were removed or changed.

The structured check wrapper already includes --unstable-kv; it rejects that as a wrapper argument. Lint tools/docs-site with --config docs/site/deno.json because root lint include/exclude does not cover tools.
