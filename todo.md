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

# Doing

# Todo 

- [ ] **Toolbar toggle** — flip between the kanban view and the raw markdown via the title-bar buttons (like mermaid buttons)
- [ ] Test the fresh-clone install flow end-to-end
rm -rf node_modules dist, then npm install, npm run package, F5 launch, open a todo.md, verify every feature. If a stranger can't follow your README to a working extension, neither can a reviewer.

# Backlog (Polish — Starfruit Hunt)
- [ ] Markplace search screenshot (once it becomes visible!!!)
- [ ] Stress Testing / Bug fixes (get ready for shipping)
Try: empty todo.md, todo.md with no columns, weird unicode in titles, very long descriptions, 50+ cards in one column, rapid drag-drop spam.
- [ ] Submit the ship on macondo.hackclub.com
URL field = GitHub repo (or marketplace listing if published). Pick level L2 minimum (L3 if you can justify it — multiple subsystems: parser, serialiser, custom editor, webview IPC, file watcher). Honestly describe any AI usage. Hit submit.

# Todo (Innovation — Above & Beyond) --> Try to get that startfuit!!!
- [ ] Deploy a landing page on Nest with a .dino.icu subdomain
Free per Macondo. hackclub.app for the VPS, github.com/hackclub/dns PR for the domain. One static page with logo, GIF, install button, install commands, GitHub link. Takes ~30 minutes, reads as "real product".
- [ ] Record a 60-90s walkthrough video and post it
YouTube unlisted is fine. Show the problem (todo.md is fine but visual kanban is faster), then the solution. Drop the link in the README and your project page. Optional: post to r/vscode or r/programming for some shipping juice.
- [ ] Add a "due date" badge syntax to todo.md
Parse e.g. "- [ ] Buy milk @2026-08-15" into a card with a small date pill. Keeps the markdown human-readable but adds a visible feature. Bidirectional sync still works because you control the parser.
- [ ] Add card colours / labels via emoji or tag syntax
e.g. lines starting with #urgent or :red: render a coloured stripe. Differentiator vs every other todo extension on the marketplace.
- [ ] Write a Macondo journal entry telling the project's story
Optional for software per the FAQ, but it dramatically helps reviewers and is a vibe boost for starfruit. Cover: why you started, the duplication bug saga, the autosave-cancels-edit fix, the sortableJS empty-column fix, what you'd build next.
