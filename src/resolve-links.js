import { fetchFile, search } from "./api.js";

// Session-scoped: avoids re-resolving the same wikilink target across notes
// viewed in this tab.
const resolutionCache = new Map();

export async function resolveWikilinks(container) {
  const anchors = Array.from(container.querySelectorAll("a[data-wikilink]"));
  if (anchors.length === 0) return;

  const targets = [...new Set(anchors.map((a) => a.dataset.wikilink))];

  await Promise.all(
    targets.map((target) => {
      if (!resolutionCache.has(target)) {
        resolutionCache.set(target, resolveTarget(target));
      }
      return resolutionCache.get(target);
    })
  );

  for (const anchor of anchors) {
    const path = await resolutionCache.get(anchor.dataset.wikilink);
    if (path) {
      anchor.href = `?file=${encodeURIComponent(path)}`;
      anchor.dataset.resolved = "true";
    } else {
      anchor.classList.add("wikilink-unresolved");
    }
  }
}

// Mirrors Obsidian's own resolution order: try the target as an exact vault
// path first (a wikilink is often already folder-qualified), then fall back to a vault-wide filename
// search on the basename. Full-text search alone is unreliable here: a note
// that merely contains the literal text "[[Target]]" outscores the actual
// target note, so only matches against the filename itself are trusted.
async function resolveTarget(target) {
  const direct = await tryDirectPath(target);
  if (direct) return direct;

  const basename = target.includes("/") ? target.slice(target.lastIndexOf("/") + 1) : target;
  return resolveViaSearch(basename);
}

async function tryDirectPath(target) {
  const path = target.toLowerCase().endsWith(".md") ? target : `${target}.md`;
  try {
    await fetchFile(path);
    return path;
  } catch {
    return null;
  }
}

async function resolveViaSearch(name) {
  try {
    const results = await search(name);
    if (!Array.isArray(results) || results.length === 0) return null;

    const filenameMatches = results.filter((r) =>
      r.matches?.some((m) => m.match?.source === "filename")
    );
    if (filenameMatches.length === 0) return null;

    const best = filenameMatches.reduce((a, b) => (b.score > a.score ? b : a));
    return best.filename || null;
  } catch (error) {
    console.error(`Wikilink resolution failed for "${name}":`, error);
    return null;
  }
}
