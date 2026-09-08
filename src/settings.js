import { getConfig, setConfig } from "./api.js";

// One-time (or re-invoked on auth failure) form that captures the Local REST
// API base URL and bearer token, persisted to this origin's localStorage.
// Bookmarked ?file= URLs never carry the token.
export function renderSettingsForm(container, { message } = {}) {
  const defaults = getConfig() || { apiBaseUrl: "https://127.0.0.1:27124", token: "" };

  container.innerHTML = "";

  const form = document.createElement("form");
  form.className = "settings-form";

  if (message) {
    const messageEl = document.createElement("p");
    messageEl.className = "settings-message";
    messageEl.textContent = message;
    form.appendChild(messageEl);
  }

  const urlLabel = document.createElement("label");
  urlLabel.textContent = "API base URL";
  const urlInput = document.createElement("input");
  urlInput.type = "text";
  urlInput.name = "apiBaseUrl";
  urlInput.placeholder = "https://127.0.0.1:27124";
  urlInput.value = defaults.apiBaseUrl;
  urlInput.required = true;
  urlLabel.appendChild(urlInput);

  const tokenLabel = document.createElement("label");
  tokenLabel.textContent = "API token";
  const tokenInput = document.createElement("input");
  tokenInput.type = "password";
  tokenInput.name = "token";
  tokenInput.value = defaults.token;
  tokenInput.required = true;
  tokenLabel.appendChild(tokenInput);

  const submit = document.createElement("button");
  submit.type = "submit";
  submit.textContent = "Save";

  form.append(urlLabel, tokenLabel, submit);
  container.appendChild(form);

  return new Promise((resolve) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const config = {
        apiBaseUrl: urlInput.value.trim().replace(/\/+$/, ""),
        token: tokenInput.value.trim(),
      };
      setConfig(config);
      resolve(config);
    });
  });
}
