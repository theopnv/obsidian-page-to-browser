import { getConfig, fetchFile, AuthError } from "./api.js";
import { renderMarkdown } from "./render.js";
import { resolveWikilinks } from "./resolve-links.js";
import { renderSettingsForm } from "./settings.js";

const app = document.getElementById("app");

function getFileFromUrl() {
  return new URLSearchParams(window.location.search).get("file");
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

async function ensureConfig(message) {
  if (getConfig() && !message) return;
  await renderSettingsForm(app, { message });
}

async function loadAndRender(path) {
  if (!path) {
    app.innerHTML = '<p class="app-message">No file specified. Add ?file=path/to/note.md to the URL.</p>';
    return;
  }

  app.innerHTML = '<p class="app-message">Loading…</p>';

  try {
    const source = await fetchFile(path);
    const html = renderMarkdown(source);
    app.innerHTML = `<article class="note">${html}</article>`;
    await resolveWikilinks(app.querySelector(".note"));
  } catch (error) {
    if (error instanceof AuthError) {
      await ensureConfig("Could not authenticate. Check your API base URL and token.");
      await loadAndRender(path);
      return;
    }
    app.innerHTML = `<p class="app-message app-error">Failed to load "${escapeHtml(path)}": ${escapeHtml(error.message)}</p>`;
  }
}

function navigateTo(path) {
  const url = new URL(window.location.href);
  url.searchParams.set("file", path);
  window.history.pushState({ file: path }, "", url);
  loadAndRender(path);
}

function onAppClick(event) {
  const anchor = event.target.closest("a");
  if (!anchor || !app.contains(anchor)) return;
  if (anchor.dataset.resolved !== "true") return;

  event.preventDefault();
  const path = new URL(anchor.href, window.location.href).searchParams.get("file");
  navigateTo(path);
}

app.addEventListener("click", onAppClick);
window.addEventListener("popstate", () => loadAndRender(getFileFromUrl()));

async function init() {
  await ensureConfig();
  await loadAndRender(getFileFromUrl());
}

init();
