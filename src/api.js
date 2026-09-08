// Talks directly to the Obsidian Local REST API plugin (https://127.0.0.1:27124 by default).
const CONFIG_KEY = "obsidian-viewer-config";

export class AuthError extends Error {}

export function getConfig() {
  const raw = localStorage.getItem(CONFIG_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setConfig(config) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

function requireConfig() {
  const config = getConfig();
  if (!config) throw new AuthError("No configuration found");
  return config;
}

function encodePath(path) {
  return path
    .split("/")
    .map(encodeURIComponent)
    .join("/");
}

export async function fetchFile(path) {
  const config = requireConfig();
  const url = `${config.apiBaseUrl}/vault/${encodePath(path)}`;
  const response = await fetch(url, {
    headers: {
      ...authHeaders(config.token),
      Accept: "text/markdown",
    },
  });

  if (response.status === 401 || response.status === 403) {
    throw new AuthError(`Authentication failed (${response.status})`);
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch "${path}": ${response.status} ${response.statusText}`);
  }
  return response.text();
}

// Session-scoped: cleared on full page reload, shared across renders in the same tab.
const searchCache = new Map();

export async function search(query) {
  if (searchCache.has(query)) return searchCache.get(query);

  const config = requireConfig();
  const url = `${config.apiBaseUrl}/search/simple/?query=${encodeURIComponent(query)}`;
  const promise = fetch(url, {
    method: "POST",
    headers: {
      ...authHeaders(config.token),
      Accept: "application/json",
    },
  }).then(async (response) => {
    if (response.status === 401 || response.status === 403) {
      throw new AuthError(`Authentication failed (${response.status})`);
    }
    if (!response.ok) {
      throw new Error(`Search failed for "${query}": ${response.status} ${response.statusText}`);
    }
    return response.json();
  });

  searchCache.set(query, promise);
  return promise;
}
