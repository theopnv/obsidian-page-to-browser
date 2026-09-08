import markdownit from "https://cdn.jsdelivr.net/npm/markdown-it@14.1.0/+esm";
import taskLists from "https://cdn.jsdelivr.net/npm/markdown-it-task-lists@2.1.1/+esm";

// [[Page Name]] or [[Page Name|Alias]]. Left unresolved (no href) until
// resolve-links.js matches the target against the vault via Obsidian's search.
const WIKILINK_RE = /^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/;

function wikilinkPlugin(md) {
  function wikilink(state, silent) {
    const pos = state.pos;
    if (state.src.charCodeAt(pos) !== 0x5b || state.src.charCodeAt(pos + 1) !== 0x5b) {
      return false;
    }

    const match = WIKILINK_RE.exec(state.src.slice(pos));
    if (!match) return false;

    if (!silent) {
      const target = match[1].trim();
      const alias = match[2] ? match[2].trim() : null;

      const open = state.push("link_open", "a", 1);
      open.attrs = [
        ["class", "wikilink"],
        ["data-wikilink", target],
      ];

      const text = state.push("text", "", 0);
      text.content = alias || target;

      state.push("link_close", "a", -1);
    }

    state.pos += match[0].length;
    return true;
  }

  md.inline.ruler.before("link", "wikilink", wikilink);
}

const md = markdownit({
  html: false,
  linkify: true,
  // Obsidian renders a single line break as a real break by default
  // ("strict line breaks" is off), unlike bare CommonMark. Match that.
  breaks: true,
})
  .use(taskLists, { enabled: true, label: true })
  .use(wikilinkPlugin);

export function renderMarkdown(source) {
  return md.render(source);
}
