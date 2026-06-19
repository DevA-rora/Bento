# Done
- [x] Fix linter errors
- [x] Write journal entry w/dragging + editing.
- [x] Fix duplication bug where dragging to a new column causes duplication.
- [x] Move files out of folder (for git repo)
- [x] Add ability to edit the description too!
- [x] Render columns even when there are no tasks in them. 
- [x] Add checkcircle to mark todos as completed/not completed.
- [x] Optimise animation so it marks cards as completed faster.
- [x] Fix alignment of circle to be inline with the text
- [x] Add a small, grey card at the end of every column as a "make new card" button to make new cards (instead of going to markdown)
- [x] Fix bug where card stops editing when user creates it (proaly cause of vscode autosave)
- [x] Add event listener on enter down to stop editing description (same pattern as editing title)
- [x] Add ability to make new colums (from the rightmost column)
- [x] Add ability to delete cards (onRightClick)
- [x] Make dragging cards much easier (especially when dragging to new columns, sortableJS fix)
- [x] Format all files to look nice.
- [x] Add comments + documentation where required.
- [x] Fix styling so that regardless of users vscode theme, the board looks beautiful.
- [x] Add a LICENSE file (MIT)
- [x] Strip debug console.log statements (edit: not needed)
- [x] Fill out package.json metadata
- [x] Rewrite README.md from scratch (replace the VSCode scaffold) (v1 is done)
- [x] Verify Hackatime is logging this exact folder name
- [x] Publish to the VSCode Marketplace
- [x] Write up README.md
- [x] ROADMAP
- [x] Add badges
- [x] Requirements
- [x] Commands table
- [x] CHANGELOG link
- [x] Static screenshots (2-3 PNGS alongside GIF)
- [x] Capture a demo GIF and 2-3 screenshots
- [x] Add keyboard shortcuts in script.js webview (arrows, space, enter, tab, escape, v+arrow move, delete)
- [x] Write a real CHANGELOG.md
- [x] Make styles theme-aware with VSCode CSS variables
- [x] Add empty-state UI when todo.md has no columns
- [x] Add GitHub repo topics + pin it to your profile
- [x] Build a 7-14 day project streak before submitting
- [x] Design a 128x128 extension icon (PNG)
- [x] Markplace search screenshot (once it becomes visible!!!)
- [x] **Toolbar toggle** — flip between the kanban view and the raw markdown via the title-bar buttons (like mermaid buttons)

# Todo
- [ ] Test the fresh-clone install flow end-to-end
rm -rf node_modules dist, then npm install, npm run package, F5 launch, open a todo.md, verify every feature. If a stranger can't follow your README to a working extension, neither can a reviewer.
- [ ] Stress Testing / Bug fixes (get ready for shipping)
Try: empty todo.md, todo.md with no columns, weird unicode in titles, very long descriptions, 50+ cards in one column, rapid drag-drop spam.
- [ ] Submit the ship on macondo.hackclub.com
URL field = GitHub repo (or marketplace listing if published). Pick level L2 minimum (L3 if you can justify it — multiple subsystems: parser, serialiser, custom editor, webview IPC, file watcher). Honestly describe any AI usage. Hit submit.