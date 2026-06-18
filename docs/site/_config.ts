import lume from "lume/mod.ts";

/**
 * NetScript external user documentation site (Diátaxis IA).
 *
 * US-3: Lume static-site generator, deploy target GitHub Pages.
 * US-7: GitHub project Pages live at a subpath, so `location` MUST be set to
 *       the exact base URL or every asset/link breaks.
 */
const site = lume({
  location: new URL("https://rickylabs.github.io/netscript/"),
  src: ".",
  dest: "_site",
});

export default site;
