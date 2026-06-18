# 🍱 Bento: A Kanban Board for VS Code

[![VS Code Marketplace](https://img.shields.io/badge/VS%20Marketplace-Install-007ACC?logo=visualstudiocode)](https://marketplace.visualstudio.com/items?itemName=DevArora.bento)
[![Version](https://img.shields.io/badge/version-0.0.1-blue)](https://github.com/DevA-rora/kanban-board-vscode/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Last commit](https://img.shields.io/github/last-commit/DevA-rora/kanban-board-vscode)
[![Roadmap](https://img.shields.io/badge/roadmap-7%2F20%20%C2%B7%20%E2%96%88%E2%96%88%E2%96%88%E2%96%88%E2%96%88%E2%96%88%E2%96%88%E2%96%91%E2%96%91%E2%96%91%E2%96%91%E2%96%91%E2%96%91%E2%96%91%E2%96%91%E2%96%91%E2%96%91%E2%96%91%E2%96%91%E2%96%91-22c55e)](#roadmap)

> A Kanban Board built into VS Code. Edit your `todo.md` like a Trello board, save it like a markdown file. No accounts, servers, or syncing. Just a file in your repo!

![Bento kanban board in VS Code showing drag-and-drop, task editing, completion toggles, and theme compatibility](assets/bento_demo_v1.gif)

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

## Install

### From the VS Code Marketplace

Bento is now published on the VS Code Marketplace!

[Install Bento From Marketplace](https://marketplace.visualstudio.com/items?itemName=DevArora.bento)
> New extensions can take a little while to appear in search. If "Bento" doesn't show up yet, use the direct link above.

### From a `.vsix` file

1. Download `bento-0.0.1.vsix` from [Releases](https://github.com/DevA-rora/kanban-board-vscode/releases/latest).
2. In VS Code: `Cmd/Ctrl+Shift+P` → **Extensions: Install from VSIX…** → select the file.
3. Reload VS Code if prompted.

### From source

```bash
git clone https://github.com/DevA-rora/kanban-board-vscode
cd kanban-board-vscode
npm install
npm run package
```

Then press `F5` in VS Code to launch a dev host with the extension loaded.

## Usage

1. Open a folder in VS Code.
2. Run **Open Bento Board** from the command palette (`Cmd/Ctrl+Shift+P`). The extension creates a starter `todo.md` in the workspace root if one doesn't exist yet.
3. Or open any existing `todo.md` and click the kanban icon in the editor title bar to switch from the text view.

To go back to plain markdown editing, click the 3 dots at the top right to open the overflow menu, then select "Open as Text"

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
- [x] **VS Code Marketplace**: [published and installable](https://marketplace.visualstudio.com/items?itemName=DevArora.bento).

### Next up
- [ ] **Toolbar toggle**: flip between kanban and markdown from the editor title bar (like Mermaid).
- [ ] **Extension icon**: 128×128 PNG for the Marketplace listing.
- [ ] **Keyboard shortcuts**: e.g. toggle complete and delete focused cards.
- [ ] **README polish**: requirements section, commands table, CHANGELOG link.
- [ ] **Demo assets**: better GIF and 2–3 static screenshots.
- [ ] **Marketplace search screenshot**: once Bento shows up in search.

### Polish
- [ ] **Stress testing**: empty `todo.md`, no columns, unicode, long text, 50+ cards, rapid drag-drop.
- [ ] **Light-theme fix**: replace hardcoded colours with VS Code CSS variables.
- [ ] **Empty-state UI**: hint when `todo.md` has no columns yet.

### Ideas (starfruit: only if I keep scope minimal)
- [ ] **Landing page**: static site on a `.dino.icu` subdomain.
- [ ] **Walkthrough video**: short demo on YouTube, linked from the README.
- [ ] **Due date syntax**: optional `@2026-08-15` pills on cards.
- [ ] **Card colours / labels**: optional tag syntax (e.g. `#urgent`, `:red:`).