# Changelog

All notable changes to Bento are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned

- Title-bar toggle between kanban and markdown views.
- Extension icon for the Marketplace listing.
- Empty-state UI when `todo.md` has no columns.
- Light-theme styling via VS Code CSS variables.

## [0.0.2] - 2026-06-18

### Added

- Keyboard shortcuts in the kanban webview: arrow navigation, Space to complete, Enter to edit, Tab between fields, Escape to stop editing, V + arrow to move cards, Delete/Backspace to remove a card.
- README keyboard shortcuts table, demo GIF, and static screenshots.
- README requirements section, commands table, and changelog link.

### Changed

- Marketplace listing assets aligned with the GitHub README.

## [0.0.1] - 2026-06-18

First public release on the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=DevArora.bento).

### Added

- Custom kanban editor for any `todo.md` file in the workspace.
- Drag-and-drop cards between columns and reorder cards within a column.
- Drag columns to reorder the board.
- Double-click to edit card titles and descriptions in place.
- Completion toggle on each card (dim + strikethrough).
- Right-click context menu to delete cards.
- One-click add for new cards (per column) and new columns (end of board).
- Two-way sync with `todo.md` — board edits save to markdown; external file edits re-render the board.
- Theme-aware board styling using the active VS Code theme.
- **Open Bento Board** command to create or open a starter `todo.md`.

### Fixed

- Duplication when dragging a card into an empty column.
- New card exiting edit mode immediately (VS Code auto-save race).
- Drag-and-drop into empty columns (SortableJS configuration).

[Unreleased]: https://github.com/DevA-rora/kanban-board-vscode/compare/v0.0.2...HEAD
[0.0.2]: https://github.com/DevA-rora/kanban-board-vscode/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/DevA-rora/kanban-board-vscode/releases/tag/v0.0.1
