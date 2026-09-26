/** Text made safe to put inside HTML, as element content or a quoted attribute. */
export function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
