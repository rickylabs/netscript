import { Page } from "lume/core/file.ts";
import { releaseVersion } from "../_data.ts";

/**
 * AI-affordance tooling for the NetScript docs site (SOTA study rec #1).
 *
 * At build time this plugin emits, for every rendered content page:
 *   1. a per-page Markdown twin (`<page>/index.md`) — clean Markdown distilled
 *      from the page's rendered `.ns-prose` body (component tags already
 *      resolved to HTML), so agents can fetch source-quality Markdown instead
 *      of parsing chrome-wrapped HTML;
 *   2. a tiered `/llms.txt` index (llms.txt convention) generated from the live
 *      page graph — an H1 + blurb + an "For AI agents" note + IA-shaped H2
 *      sections listing `[Title](absolute-url): summary` for every real page;
 *   3. an optional `/llms-full.txt` concatenation of every twin (nice-to-have).
 *
 * Mechanism: a single `afterRender` listener. At that point `site.pages` holds
 * the rendered HTML with all Vento components expanded, and the `base_path`
 * processor (which only matches `.html`) has NOT run yet — so body hrefs are
 * still root-relative and are absolutised here against `site.location`. The new
 * `.md`/`.txt` pages are pushed onto `site.pages`; `base_path` skips them (wrong
 * extension), so their output is never mangled.
 *
 * Docs-only: this file lives entirely under `docs/site/`. It adds no runtime or
 * client dependency — the "Copy as Markdown" affordance in `base.vto` is a plain
 * link to the twin.
 */

/** Block-level HTML tags (used to decide inline-vs-block flattening). */
const BLOCK_TAGS = new Set([
  "address",
  "article",
  "aside",
  "blockquote",
  "dd",
  "div",
  "dl",
  "dt",
  "figcaption",
  "figure",
  "footer",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hr",
  "li",
  "main",
  "nav",
  "ol",
  "p",
  "pre",
  "section",
  "table",
  "ul",
]);

const NODE_TEXT = 3;
const NODE_ELEMENT = 1;

export interface AiToolingOptions {
  /** Emit the concatenated `/llms-full.txt` corpus. Default: true. */
  full?: boolean;
}

interface PageInfo {
  url: string;
  title: string;
  summary: string;
  markdown: string;
}

/** Lume plugin: `site.use(aiTooling())`. Register LAST in `_config.ts`. */
export function aiTooling(options: AiToolingOptions = {}) {
  const emitFull = options.full ?? true;

  return (site: Lume.Site) => {
    const origin = site.options.location;

    site.addEventListener("afterRender", () => {
      const infos: PageInfo[] = [];
      const newPages: Page[] = [];

      for (const page of site.pages) {
        const outputPath = page.outputPath;
        if (!outputPath.endsWith(".html")) continue;

        const doc = page.document;
        if (!doc) continue;
        const article = doc.querySelector("article.ns-prose");
        if (!article) continue;

        const url = page.data.url as string;
        const title = String(page.data.title ?? deriveTitle(article) ?? url);

        let body = articleToMarkdown(article, origin);
        if (!/^#\s/.test(body)) {
          body = `# ${title}\n\n${body}`;
        }

        const twinUrl = markdownTwinUrl(url);
        newPages.push(Page.create({ url: twinUrl, content: body }));

        infos.push({
          url,
          title,
          summary: firstParagraph(article),
          markdown: body,
        });
      }

      newPages.push(
        Page.create({ url: "/llms.txt", content: buildLlmsIndex(infos, origin, emitFull) }),
      );
      if (emitFull) {
        newPages.push(
          Page.create({ url: "/llms-full.txt", content: buildLlmsFull(infos, origin) }),
        );
      }

      for (const page of newPages) {
        site.pages.push(page);
      }
    });
  };
}

export default aiTooling;

/* ------------------------------------------------------------------ */
/* URL helpers                                                         */
/* ------------------------------------------------------------------ */

/** The `.md` twin URL for a page URL (mirrors the link in `base.vto`). */
function markdownTwinUrl(url: string): string {
  if (url.endsWith("/")) return `${url}index.md`;
  if (url.endsWith(".html")) return `${url.slice(0, -5)}.md`;
  return `${url}.md`;
}

/** Resolve a root-relative or bare href to an absolute canonical URL. */
function absoluteUrl(href: string, origin: URL): string {
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith("#")) return trimmed;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed; // has a scheme
  try {
    const path = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
    return new URL(path, origin).href;
  } catch {
    return trimmed;
  }
}

/* ------------------------------------------------------------------ */
/* HTML -> Markdown (rendered `.ns-prose` body)                        */
/* ------------------------------------------------------------------ */

function articleToMarkdown(article: Element, origin: URL): string {
  return childBlocks(article, origin)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim() + "\n";
}

/** Serialize an element's children as a sequence of Markdown blocks. */
function childBlocks(el: Element | ParentNode, origin: URL): string {
  const parts: string[] = [];
  for (const child of Array.from(el.childNodes)) {
    const block = blockMd(child, origin);
    if (block && block.trim()) parts.push(block.trim());
  }
  return parts.join("\n\n");
}

function hasBlockChild(el: Element): boolean {
  for (const child of Array.from(el.childNodes)) {
    if (
      child.nodeType === NODE_ELEMENT &&
      BLOCK_TAGS.has((child as Element).tagName.toLowerCase())
    ) {
      return true;
    }
  }
  return false;
}

function isDecorative(el: Element): boolean {
  return el.getAttribute("aria-hidden") === "true";
}

/** Serialize a single node as a block-level Markdown string. */
function blockMd(node: ChildNode, origin: URL): string {
  if (node.nodeType === NODE_TEXT) {
    return collapse(node.textContent ?? "").trim();
  }
  if (node.nodeType !== NODE_ELEMENT) return ""; // drops comments

  const el = node as Element;
  if (isDecorative(el)) return "";
  const tag = el.tagName.toLowerCase();

  switch (tag) {
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6": {
      const text = inlineChildren(el, origin).trim();
      return text ? `${"#".repeat(Number(tag[1]))} ${text}` : "";
    }
    case "p":
      return inlineChildren(el, origin).trim();
    case "ul":
      return listMd(el, origin, false);
    case "ol":
      return listMd(el, origin, true);
    case "pre":
      return codeBlockMd(el);
    case "blockquote":
    case "aside":
      return quoteMd(childBlocks(el, origin));
    case "hr":
      return "---";
    case "table":
      return tableMd(el, origin);
    case "figure":
      return figureMd(el, origin);
    case "img":
      return imageMd(el, origin);
    case "figcaption": {
      const text = inlineChildren(el, origin).trim();
      return text ? `*${text}*` : "";
    }
    case "button":
    case "script":
    case "style":
    case "template":
      return "";
    default: {
      if (hasBlockChild(el)) return childBlocks(el, origin);
      return inlineChildren(el, origin).trim();
    }
  }
}

/** Serialize an element's children as inline Markdown (no block breaks). */
function inlineChildren(el: Element, origin: URL): string {
  let out = "";
  for (const child of Array.from(el.childNodes)) {
    out += inlineMd(child, origin);
  }
  return out;
}

function inlineMd(node: ChildNode, origin: URL): string {
  if (node.nodeType === NODE_TEXT) return collapse(node.textContent ?? "");
  if (node.nodeType !== NODE_ELEMENT) return "";

  const el = node as Element;
  if (isDecorative(el)) return "";
  const tag = el.tagName.toLowerCase();

  switch (tag) {
    case "code": {
      const code = (el.textContent ?? "").replace(/`/g, "");
      return code ? `\`${code}\`` : "";
    }
    case "strong":
    case "b": {
      const text = inlineChildren(el, origin).trim();
      return text ? `**${text}**` : "";
    }
    case "em":
    case "i": {
      const text = inlineChildren(el, origin).trim();
      return text ? `*${text}*` : "";
    }
    case "a": {
      const href = absoluteUrl(el.getAttribute("href") ?? "", origin);
      const text = inlineChildren(el, origin).trim() || href;
      return href ? `[${text}](${href})` : text;
    }
    case "br":
      return "  \n";
    case "img":
      return imageMd(el, origin);
    case "button":
    case "script":
    case "style":
      return "";
    default:
      return inlineChildren(el, origin);
  }
}

function listMd(el: Element, origin: URL, ordered: boolean): string {
  const items: string[] = [];
  let index = 1;
  for (const li of Array.from(el.children)) {
    if (li.tagName.toLowerCase() !== "li") continue;
    const marker = ordered ? `${index}. ` : "- ";
    const pad = " ".repeat(marker.length);
    const content = hasBlockChild(li as Element)
      ? childBlocks(li as Element, origin)
      : inlineChildren(li as Element, origin).trim();
    const lines = content.split("\n");
    const rendered = lines
      .map((line, i) => (i === 0 ? marker + line : pad + line))
      .join("\n");
    items.push(rendered);
    index++;
  }
  return items.join("\n");
}

function codeBlockMd(pre: Element): string {
  const code = pre.querySelector("code") ?? pre;
  const cls = `${code.getAttribute("class") ?? ""} ${pre.getAttribute("class") ?? ""}`;
  const langMatch = cls.match(/language-([\w-]+)/);
  const lang = langMatch ? langMatch[1] : "";
  const text = (code.textContent ?? "").replace(/\n+$/, "");
  return `\`\`\`${lang}\n${text}\n\`\`\``;
}

function quoteMd(inner: string): string {
  return inner
    .split("\n")
    .map((line) => (line ? `> ${line}` : ">"))
    .join("\n");
}

function figureMd(fig: Element, origin: URL): string {
  const img = fig.querySelector("img");
  const caption = fig.querySelector("figcaption");
  const parts: string[] = [];
  if (img) parts.push(imageMd(img, origin));
  if (caption) {
    const text = inlineChildren(caption, origin).trim();
    if (text) parts.push(`*${text}*`);
  }
  return parts.join("\n\n");
}

function imageMd(img: Element, origin: URL): string {
  const alt = collapse(img.getAttribute("alt") ?? "").trim();
  const src = absoluteUrl(img.getAttribute("src") ?? "", origin);
  return `![${alt}](${src})`;
}

function tableMd(table: Element, origin: URL): string {
  const caption = table.querySelector("caption");
  const rows = Array.from(table.querySelectorAll("tr"));
  let header: string[] | null = null;
  const body: string[][] = [];

  for (const row of rows) {
    const cells = Array.from(row.querySelectorAll("th, td")).map((cell) =>
      inlineChildren(cell as Element, origin).trim().replace(/\|/g, "\\|").replace(/\s*\n\s*/g, " ")
    );
    if (!cells.length) continue;
    if (header === null && row.querySelector("th")) header = cells;
    else body.push(cells);
  }

  if (!header) {
    if (!body.length) return "";
    header = body.shift() as string[];
  }

  const width = header.length;
  const lines: string[] = [];
  if (caption) {
    const text = inlineChildren(caption, origin).trim();
    if (text) lines.push(`**${text}**`, "");
  }
  lines.push(`| ${header.join(" | ")} |`);
  lines.push(`| ${header.map(() => "---").join(" | ")} |`);
  for (const row of body) {
    const padded = [...row];
    while (padded.length < width) padded.push("");
    lines.push(`| ${padded.slice(0, width).join(" | ")} |`);
  }
  return lines.join("\n");
}

/* ------------------------------------------------------------------ */
/* Summaries + titles                                                  */
/* ------------------------------------------------------------------ */

function collapse(text: string): string {
  return text.replace(/\s+/g, " ");
}

function deriveTitle(article: Element): string | undefined {
  const h1 = article.querySelector("h1");
  return h1 ? collapse(h1.textContent ?? "").trim() || undefined : undefined;
}

function firstParagraph(article: Element): string {
  const p = article.querySelector("p");
  if (!p) return "";
  const text = collapse(p.textContent ?? "").trim();
  if (text.length <= 200) return text;
  const cut = text.slice(0, 200);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:\s]+$/, "")}…`;
}

/* ------------------------------------------------------------------ */
/* llms.txt                                                            */
/* ------------------------------------------------------------------ */

interface Section {
  id: string;
  heading: string;
}

const SECTIONS: Section[] = [
  { id: "start", heading: "Getting started" },
  { id: "tutorials", heading: "Tutorials" },
  { id: "howto", heading: "How-to guides" },
  { id: "capabilities", heading: "Capabilities & hubs" },
  { id: "reference", heading: "Reference" },
  { id: "explanation", heading: "Explanation" },
];

const HUB_PREFIXES = [
  "/web-layer/",
  "/services-sdk/",
  "/background-processing/",
  "/durable-workflows/",
  "/data-persistence/",
  "/identity-access/",
  "/orchestration-runtime/",
  "/observability/",
  "/capabilities/",
];

function sectionOf(url: string): string {
  if (url.startsWith("/tutorials/")) return "tutorials";
  if (url.startsWith("/how-to/")) return "howto";
  if (url.startsWith("/reference/")) return "reference";
  if (url.startsWith("/explanation/")) return "explanation";
  if (HUB_PREFIXES.some((prefix) => url.startsWith(prefix))) return "capabilities";
  return "start";
}

function buildLlmsIndex(infos: PageInfo[], origin: URL, hasFull: boolean): string {
  const sorted = [...infos].sort((a, b) => a.url.localeCompare(b.url));
  const twinExample = new URL("reference/telemetry/index.md", origin).href;
  const fullNote = hasFull
    ? ` A single concatenated corpus of every page is available at ${new URL("llms-full.txt", origin).href}.`
    : "";

  const out: string[] = [
    "# NetScript",
    "",
    "> Deno-native, polyglot backend framework: type-safe services and durable workflows in one workspace — observable by default and orchestrated with Aspire, from `netscript init` to a running, type-checked backend.",
    "",
    `**For AI agents:** NetScript is Deno-native and pre-1.0 (${releaseVersion}) — treat every API as unstable. Every documentation page has a clean Markdown twin: append \`index.md\` to any page URL (for example ${twinExample}) to read source-quality Markdown instead of rendered HTML. Prefer the \`.md\` twins when reasoning about the docs. All links below are absolute and canonical.${fullNote}`,
    "",
  ];

  for (const section of SECTIONS) {
    const entries = sorted.filter((info) => sectionOf(info.url) === section.id);
    if (!entries.length) continue;
    out.push(`## ${section.heading}`, "");
    for (const info of entries) {
      const href = new URL(info.url.replace(/^\//, ""), origin).href;
      const summary = info.summary ? `: ${info.summary}` : "";
      out.push(`- [${info.title}](${href})${summary}`);
    }
    out.push("");
  }

  return `${out.join("\n").trimEnd()}\n`;
}

function buildLlmsFull(infos: PageInfo[], origin: URL): string {
  const order = new Map(SECTIONS.map((section, i) => [section.id, i]));
  const sorted = [...infos].sort((a, b) => {
    const sa = order.get(sectionOf(a.url)) ?? 99;
    const sb = order.get(sectionOf(b.url)) ?? 99;
    return sa !== sb ? sa - sb : a.url.localeCompare(b.url);
  });

  const header = [
    "# NetScript documentation — full corpus",
    "",
    `> Deno-native, polyglot backend framework, pre-1.0 (${releaseVersion}). This file concatenates the Markdown twin of every documentation page for AI ingestion.`,
    "",
  ].join("\n");

  const blocks = sorted.map((info) => {
    const canonical = new URL(info.url.replace(/^\//, ""), origin).href;
    return `${info.markdown.trim()}\n\n_Canonical: ${canonical}_`;
  });

  return `${header}\n${blocks.join("\n\n---\n\n")}\n`;
}
