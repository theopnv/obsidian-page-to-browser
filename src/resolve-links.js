import { fetchFile, search } from "./api.js";

// Session-scoped: avoids re-resolving the same wikilink target across notes
// viewed in this tab.
const resolutionCache = new Map();

// Firing every wikilink's resolution requests at once can overwhelm the
// Local REST API: at higher concurrency, requests started failing outright
// with NetworkError in testing, not just responding slowly. Capping how
// many resolve at once trades a bit of parallelism for not breaking links.
const RESOLUTION_CONCURRENCY = 3;

export async function resolveWikilinks(container) {
  const anchors = Array.from(container.querySelectorAll("a[data-wikilink]"));
  if (anchors.length === 0) return;

  const targets = [...new Set(anchors.map((a) => a.dataset.wikilink))];
  const pending = targets.filter((target) => !resolutionCache.has(target));

  await runWithConcurrency(pending, RESOLUTION_CONCURRENCY, (target) => {
    const promise = resolveTarget(target);
    resolutionCache.set(target, promise);
    return promise;
  });

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

async function runWithConcurrency(items, limit, fn) {
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const item = items[index++];
      await fn(item);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

// A request that fails outright (NetworkError) under concurrent load is
// worth one retry rather than immediately giving up and marking a real link
// as unresolved.
async function withRetry(fn) {
  try {
    return await fn();
  } catch (error) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return fn();
  }
}

// Mirrors Obsidian's own resolution order: an exact vault path first, then a
// vault-wide filename search on the basename. Full-text search alone is
// unreliable here: a note that merely contains the literal text
// "[[Target]]" outscores the actual target note, so only matches against
// the filename itself are trusted.
async function resolveTarget(target) {
  if (!target.includes("/")) {
    return resolveViaSearch(target);
  }

  const direct = await tryDirectPath(target);
  if (direct) return direct;
  return resolveViaSearch(target.slice(target.lastIndexOf("/") + 1));
}

async function tryDirectPath(target) {
  const path = target.toLowerCase().endsWith(".md") ? target : `${target}.md`;
  try {
    await withRetry(() => fetchFile(path));
    return path;
  } catch {
    return null;
  }
}

async function resolveViaSearch(name) {
  try {
    const results = await withRetry(() => search(name));
    if (!Array.isArray(results) || results.length === 0) return null;

    const filenameMatches = results.filter((r) =>
      r.matches?.some((m) => m.match?.source === "filename")
    );
    if (filenameMatches.length === 0) return null;

    // A fuzzy score alone isn't enough to pick the right file: a name that
    // merely contains "name" as a substring (e.g. "Not Foo" for
    // "Foo") can outscore the note whose basename matches exactly.
    const exact = filenameMatches.find((r) => basename(r.filename) === name.toLowerCase());
    if (exact) return exact.filename;

    const best = filenameMatches.reduce((a, b) => (b.score > a.score ? b : a));
    return best.filename || null;
  } catch (error) {
    console.error(`Wikilink resolution failed for "${name}":`, error);
    return null;
  }
}

function basename(path) {
  const file = path.slice(path.lastIndexOf("/") + 1).toLowerCase();
  return file.endsWith(".md") ? file.slice(0, -3) : file;
}
