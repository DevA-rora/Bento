# 🍱 Bento: A Kanban Board for VS Code

[![VS Code Marketplace](https://img.shields.io/badge/VS%20Marketplace-Install-007ACC?logo=visualstudiocode)](https://marketplace.visualstudio.com/items?itemName=DevArora.bento)
[![Version](https://img.shields.io/badge/version-0.0.2-blue)](https://github.com/DevA-rora/Bento/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Last commit](https://img.shields.io/github/last-commit/DevA-rora/Bento)
[![Roadmap](https://img.shields.io/badge/roadmap-13%2F18%20%C2%B7%20%E2%96%88%E2%96%88%E2%96%88%E2%96%88%E2%96%88%E2%96%88%E2%96%88%E2%96%88%E2%96%88%E2%96%88%E2%96%88%E2%96%88%E2%96%88%E2%96%91%E2%96%91%E2%96%91%E2%96%91%E2%96%91-22c55e)](#roadmap)

> A Kanban Board built into VS Code. Edit your `todo.md` like a Trello board, save it like a markdown file. No accounts, servers, or syncing. Just a file in your repo!

![Bento kanban board in VS Code showing drag-and-drop, task editing, completion toggles, and theme compatibility](https://github.com/DevA-rora/Bento/raw/main/assets/bento_demo_v1.gif)
![Example of todo.md rendered as a Bento kanban board](https://github.com/DevA-rora/Bento/raw/main/assets/screenshot_1.png)
![Changing themes updates Bento board](https://github.com/DevA-rora/Bento/raw/main/assets/screenshot_2.png)

## Why I built this

I found myself always switching between different productivity apps, Notion, Trello, Todoist, and I couldn't bring myself to stay organised! Everything was too bloated, had too many features, and led me in so many different directions that I would spend more time organising and optimising what to do rather than actually doing it!

So I built this really minimal Kanban board extension for VS Code. This is also especially good because any AI agents I use in my workspace will have access to my tasks without having to use any sort of MCP server. Now, for most of my hobby projects, I don't have to worry about tracking my todos or progress!

## Features

- **Drag-and-drop cards** between columns, or reorder cards inside a column.
- **Drag entire columns** to reorder the board itself.
- **Double-click to edit** a card's title or description in place.
- **Toggle complete** by clicking the circle (the card dims and strikes through).
- **Right-click a card** to delete it from a context menu.
- **One-click add** for cards (per column) and columns (at the end of the board).
- **Two-way sync with** `todo.md`: edits in the kanban save to the markdown, and external edits to the markdown re-render the board.
- **Theme-aware**: pulls colours from your active VS Code theme, so it looks at home in light, dark, and high-contrast themes.
- **Keyboard shortcuts**: navigate, edit, complete, move, and delete cards without touching the mouse (click a card first to focus it).

## Requirements
- [VS Code](https://code.visualstudio.com) 1.90 or newer.
- A workspace with a `todo.md` file (or run **Open Bento Board** to create one)

## Install

### From the VS Code Marketplace

![Bento Marketplace](assets/bento_marketplace.png)

Bento is now published on the VS Code Marketplace!

To instally, simply search for the "Bento" extension in your VS Code extensions mangager.

You can alternatively use the direct link here: [Install Bento From Marketplace](https://marketplace.visualstudio.com/items?itemName=DevArora.bento)
> Note that this extension will NOT show up on open-source VS Code forks like VSCodium or Cursor. They will show up once I publish the package on the "Open VSC Registery" (coming soon!)

### From a `.vsix` file

1. Download `bento-0.0.2.vsix` from [Releases](https://github.com/DevA-rora/Bento/releases/latest).
2. In VS Code: `Cmd/Ctrl+Shift+P` → **Extensions: Install from VSIX…** → select the file.
3. Reload VS Code if prompted.

### From source

```bash
git clone https://github.com/DevA-rora/Bento
cd Bento
npm install
npm run package
```

Then open the "extension.ts" file and press `F5` in VS Code to launch a dev host with the extension loaded.

## Usage

1. Open a folder in VS Code.
2. Run **Open Bento Board** from the command palette (`Cmd/Ctrl+Shift+P`). The extension creates a starter `todo.md` in the workspace root if one doesn't exist yet.
3. Or open any existing `todo.md` and click the **Bento icon** in the editor title bar to switch from the text view to the kanban board.

To go back to plain markdown editing, click the **file-text icon** in the same title bar.

## Commands

| Command | What it does | How to run |
| --- | --- | --- |
| **Open Bento Board** | Creates or opens `todo.md` in the kanban view | Command Palette (`Cmd/Ctrl+Shift+P`) |
| **Open as Bento** | Switches from markdown text to the kanban board | Title bar Bento icon on `todo.md` |
| **Open as Text** | Switches from the kanban board back to markdown | Title bar file-text icon on `todo.md` |
| **Delete Focused Card** | Removes the card that currently has keyboard focus | **Delete** key in kanban view (click a card first), or Command Palette |

## Keyboard shortcuts

Click a card to focus it first. Shortcuts work in the kanban webview (not VS Code's global keybindings).

| Key | Action |
| --- | --- |
| **↑** / **↓** / **←** / **→** | Move focus between cards (left-to-right, top-to-bottom) |
| **Space** | Toggle complete on the focused card |
| **Enter** | Start editing title & description |
| **Tab** / **Shift+Tab** | Switch between title and description while editing |
| **Escape** | Stop editing |
| **V** + arrow | Move the focused card (within column or into adjacent column) |
| **Delete** / **Backspace** | Delete the focused card |

## The `todo.md` format

The board is plain markdown. You can hand-edit it in any text editor and the kanban will catch up the next time it's open:

```markdown
# Todo
- [ ] Buy milk
remember oat milk too

- [ ] Read a book

# Doing
- [ ] Build a kanban extension

# Done
- [x] Drink coffee
```

Rules:

- `# Heading` becomes a column.
- `- [ ] task` is an open card. `- [x] task` is a completed card.
- The line **directly after** a card (when it isn't another card or a column heading) becomes that card's description.
- Blank lines are ignored.

## How it works

The extension registers a [custom text editor](https://code.visualstudio.com/api/extension-guides/custom-editors) for any file matching `**/todo.md`. The editor is a sandboxed webview that:

- Parses the markdown into `Card` and column objects on first load.
- Renders cards into draggable lists with [SortableJS](https://github.com/SortableJS/Sortable).
- Posts messages to the extension host whenever you edit, drag, complete, add, or delete anything.
- The extension host applies a `WorkspaceEdit` that replaces the whole file with a re-serialised version, so your changes hit disk and Git sees normal markdown diffs.
- A `workspace.onDidChangeTextDocument` listener keeps the webview in sync if you (or another tool) edit `todo.md` directly.

## Development

```bash
npm install
npm run watch    # esbuild + tsc in watch mode
```

Press `F5` to launch the extension dev host. Source lives in [src/extension.ts](src/extension.ts) (extension host) and [media/](media/) (webview).

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history.

## License

[MIT](LICENSE). Do whatever you want with this! (just don't blame me 😮)

## Roadmap

### Shipped
- [x] **Kanban custom editor** for `todo.md` in VS Code.
- [x] **Drag-and-drop** cards between columns and reorder columns on the board.
- [x] **Inline editing** for card titles and descriptions.
- [x] **Completion toggle** with strike-through styling.
- [x] **Card & column controls**: add cards, add columns, right-click delete.
- [x] **Two-way markdown sync**: board edits save to `todo.md`; file edits re-render the board.
- [x] **Theme-aware styling** via VS Code CSS variables (light, dark, high-contrast).
- [x] **Keyboard shortcuts**: navigate, edit, complete, move, and delete focused cards.
- [x] **Empty-state UI** when `todo.md` has no columns yet.
- [x] **Extension icon** (128×128) for the Marketplace listing.
- [x] **Demo assets**: GIF and screenshots in the README.
- [x] **Docs**: README, CHANGELOG, and MIT license.
- [x] **VS Code Marketplace**: [published and installable](https://marketplace.visualstudio.com/items?itemName=DevArora.bento).
- [x] **Marketplace search screenshot**: once Bento shows up in search.

### Next up
- [x] **Toolbar toggle**: flip between kanban and markdown from the editor title bar (like Mermaid).
- [ ] **Fresh-clone test**: verify someone can clone, build, and run from the README alone.
- [ ] **Stress testing**: empty files, no columns, unicode, long text, 50+ cards, rapid drag-drop.
- [ ] Publish to the "Open VSX Registery" [here](https://open-vsx.org/) to view the extension on open-source forks of VS Code.
- [ ] **Macondo ship**: submit for review on [macondo.hackclub.com](https://macondo.hackclub.com).

### Out of scope (by design)
Bento stays minimal. Plain `todo.md`, no extra syntax in the file. Not planning due dates, labels, card colours, or a separate landing page; the README and Marketplace listing are the product page.