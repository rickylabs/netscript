/** Escape source metadata for both text and quoted HTML attributes. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ??
      character;
  });
}
