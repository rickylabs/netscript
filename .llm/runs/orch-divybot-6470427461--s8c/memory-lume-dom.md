# Lume document API

Lume 2.5.4 uses a server DOM with a smaller API than the browser DOM. Its table cells do not implement replaceChildren; clear textContent then appendChild. The real docs build catches this even when root tooling checks do not import _config.ts. Check _config.ts under the standalone docs/site import map, not the root workspace map.
