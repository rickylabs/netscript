import type Site from 'lume/core/site.ts';

export type MarkdownRenderer = (source: string) => string;

/** The configured engine surface this adapter consumes (Lume's hook is otherwise untyped). */
export interface ConfiguredMarkdown {
  options: { html?: boolean };
  render(source: string): string;
}

/** Keep the site's plugins and anchors; scope HTML safety to this synchronous render only. */
export function designMarkdown(site: Site): MarkdownRenderer {
  let render: MarkdownRenderer | undefined;
  site.hooks.markdownIt((engine: ConfiguredMarkdown) => {
    render = (source) => {
      const html = engine.options.html;
      engine.options.html = false;
      try {
        // Source provenance comments are not public prose, even with raw HTML disabled.
        return engine.render(source.replace(/<!--[\s\S]*?-->/g, ''));
      } finally {
        engine.options.html = html;
      }
    };
  });
  if (!render) throw new Error('Design system requires the configured Lume Markdown engine');
  return render;
}
