/** Redacts the project-scoped canvas URL from diagnostic text. */
export function redactServeUrl(value: string, serveUrl: string): string {
  const variants = [serveUrl, serveUrl.replace(/\/$/, '')].filter((item, index, all) =>
    item.length > 0 && all.indexOf(item) === index
  );
  return variants.reduce((text, secret) => text.replaceAll(secret, '<serve-url>'), value);
}
