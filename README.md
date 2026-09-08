# Obsidian Page to Browser

[![License: MIT](https://img.shields.io/github/license/theopnv/obsidian-page-to-browser)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/theopnv/obsidian-page-to-browser)](https://github.com/theopnv/obsidian-page-to-browser/stargazers)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
![No build step](https://img.shields.io/badge/build-none-lightgrey)

Turn any note in your Obsidian vault into a live webpage. Bookmark it in your browser toolbar, click it, and get a clean, styled page instead of raw `[text](url)` syntax. Edit the note in Obsidian, reload the tab, and the change is already there. No build step, no static site generator, no regenerate command.

It talks to the [Local REST API (with MCP)](https://github.com/coddingtonbear/obsidian-local-rest-api) plugin, which runs inside Obsidian and serves your vault over HTTPS on your own machine.

## Why

Notion, a static site generator, or this. Here's how they compare:

| | Notion | Static site generator | This |
| --- | --- | --- | --- |
| Updates live, no rebuild | ✅ | ❌ | ✅ |
| Plain markdown files, no lock-in | ❌ Proprietary format | ✅ | ✅ |
| Notes stay off someone else's server | ❌ Stored on Notion's servers, not encrypted end-to-end | ❌ Published output is public once built | ✅ Fetched live from your machine, only the empty viewer is public |

Edit a note in Obsidian, reload the bookmarked tab, see the change. Nothing to regenerate, ever.

The same trick works for any note worth one click away as a webpage:

- **A bookmarks or reading list page.** The original use case: a curated list of links, styled, always current.
- **A map-of-content note.** An index note that fans out through `[[wikilinks]]`, browsable like a small personal wiki, without opening Obsidian.
- **A running dashboard.** A project status or task note you check often, one bookmark away instead of buried in a vault.
- **A cheatsheet.** Commands, shortcuts, snippets you copy from mid-terminal, rendered as a real page instead of a wall of markdown syntax.

## Screenshot

![Screenshot of the rendered viewer next to the raw markdown file](docs/screenshot.png)

## What it does

- Renders standard markdown: headings, lists, tables, task lists, code blocks, links.
- Renders `[[wikilinks]]` and `[[wikilinks|with an alias]]`. Clicking one loads that note in place, no page reload.
- A `[[wikilink]]` to a note that doesn't exist shows as plain, muted text instead of a broken link.

## What it doesn't do (yet)

- Callouts, `![[embeds]]`, `#tags`, and frontmatter don't render.
- No per-link favicons or Notion-style card styling. Plain theme only.
- Desktop only. The Local REST API only listens on `127.0.0.1`, so this won't work from your phone.
- One vault, one browser profile. No account switching.

## Two ways to use this

**Use the hosted copy.** Skip hosting entirely. This repo is published at `https://theopnv.github.io/obsidian-page-to-browser/`. Do the vault setup below, then bookmark your notes against that address. It's a static site with no backend, so your API token stays in your own browser and talks only to your own vault, but you're trusting that the published code matches what's in this repo. It's open source, so you can check.

**Host your own copy.** Fork the repo, publish it to your own GitHub Pages, and bookmark against your own URL instead. Same code, nothing to trust but your own copy of it.

## Install

> [!NOTE]
> Steps 1 and 2 apply either way. Step 3 only applies if you're hosting your own copy.

### 1. Set up the plugin in Obsidian

- Open Obsidian → Settings → Community plugins.
- Turn off restricted mode if it's on.
- Browse, search for "Local REST API", install it, turn it on.
- Open its settings page. Note the HTTPS port (default `27124`) and copy the API key. You'll need both.

### 2. Trust its certificate

The plugin uses a self-signed HTTPS certificate. Your browser will block it until you trust it once.

- Open a new tab and go to `https://127.0.0.1:27124` (use your own port if different).
- Your browser shows a warning. Click through it ("Advanced" → "Accept the Risk and Continue" in Firefox).
- You should see a short JSON reply. That means it worked.

This is a one-time step per browser.

### 3. Host your own copy (skip if using the hosted copy)

Fork it: go to `https://github.com/theopnv/obsidian-page-to-browser` and click "Fork". Or with the `gh` CLI:

```bash
gh repo fork theopnv/obsidian-page-to-browser --clone
```

Then turn on Pages on your fork: repo → Settings → Pages → Source: "Deploy from a branch" → branch `main`, folder `/ (root)` → Save. GitHub gives you a URL like `https://<your-username>.github.io/obsidian-page-to-browser/`. It takes about a minute to go live.

These are plain static files (`index.html`, `src/`, `theme/`), so any static host works the same way if you'd rather not use GitHub Pages: Netlify, Vercel, Cloudflare Pages, or your own server. To test locally, clone the repo and run `npx serve .` or `python3 -m http.server`, then open `http://localhost:<port>/`.

### 4. First-time setup in the browser

Open the viewer URL, either the hosted one or your own. Since there's no saved config yet, it shows a form asking for:

- **API base URL**: `https://127.0.0.1:27124` (or your own port)
- **API token**: the key you copied from the plugin settings

Your browser saves this in `localStorage`, tied to that one site. Bookmarked URLs never carry the token, only a file path.

If you use more than one browser, or host the viewer at more than one URL, repeat this step in each.

## Usage

Open a note by adding `?file=` and its path in the vault to the URL:

```
https://<your-viewer-url>/?file=Resources%2FBookmarks%2FBookmarks.md
```

The path is relative to your vault root, URL-encoded (spaces become `%20`, slashes become `%2F`).

Bookmark that full URL in your browser toolbar. Clicking it opens the rendered note directly.

Inside a rendered note:
- Normal links (`http://`, `https://`) behave like any web link.
- `[[Wikilinks]]` resolve against your vault and load in place, no reload.
- A wikilink to a note that doesn't exist renders as plain, muted, unclickable text.

To bookmark a different note, open it once with its own `?file=` URL and bookmark that.
