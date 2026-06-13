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

# Doingk
- [ ] Fix styling so that regardless of users vscode theme, the board looks beautiful.
- [ ] Rewrite README.md from scratch (replace the VSCode scaffold)
This is the #1 rejection cause per the Macondo docs. Sections: one-line tagline, why-I-built-it paragraph, animated GIF demo, install steps (vsix or marketplace), usage, todo.md format reference, tech stack, license. Personal voice — reviewers can smell AI-written READMEs.

# Todo 
- [ ] Add a LICENSE file (MIT)
GitHub UI: Add file -> Create new file -> name it LICENSE -> "Choose a license template" -> MIT. 30 seconds, blocks rejections.
- [ ] Capture a demo GIF and 2-3 screenshots
Record: drag a card across columns, double-click edit, toggle complete, add card, add column, right-click delete. Save to assets/ and embed in README. Use ScreenToGif (Win) or Kap (Mac). Keep under 5MB.
- [ ] Fill out package.json metadata
Add: publisher (your marketplace ID), repository {type:"git", url:"https://github.com/DevA-rora/kanban-board-vscode"}, bugs.url, homepage, keywords ["kanban","todo","markdown","productivity","board"], author, icon "media/icon.png", and a punchier description.
- [ ] Strip debug console.log statements
Remove [reorderBoard], [init], [notifyReorder] logs from extension.ts and script.js. Or gate them behind a const DEBUG = false flag. Production polish reviewers notice.
- [ ] Test the fresh-clone install flow end-to-end
rm -rf node_modules dist, then npm install, npm run package, F5 launch, open a todo.md, verify every feature. If a stranger can't follow your README to a working extension, neither can a reviewer.
- [ ] Verify Hackatime is logging this exact folder name
Open hackatime.hackclub.com dashboard. Confirm "kanban_vscode" appears with non-trivial hours. On macondo.hackclub.com when you create the project, link that exact Hackatime project name.
- [ ] Submit the ship on macondo.hackclub.com
URL field = GitHub repo (or marketplace listing if published). Pick level L2 minimum (L3 if you can justify it — multiple subsystems: parser, serialiser, custom editor, webview IPC, file watcher). Honestly describe any AI usage. Hit submit.

# Backlog (Polish — Starfruit Hunt)
- [ ] Stress Testing / Bug fixes (get ready for shipping)
Try: empty todo.md, todo.md with no columns, weird unicode in titles, very long descriptions, 50+ cards in one column, rapid drag-drop spam.
- [ ] Make styles theme-aware with VSCode CSS variables
Replace hardcoded #2d2d2d, #444, #888, #007acc with var(--vscode-editor-background), var(--vscode-foreground), var(--vscode-focusBorder), var(--vscode-list-hoverBackground), etc. Test with a light theme — currently your board is unreadable on light mode. Reviewers see this instantly.
- [ ] Design a 128x128 extension icon (PNG)
Save as media/icon.png and reference via "icon": "media/icon.png" in package.json. Required for marketplace and a huge polish signal. Even a clean monochrome glyph works — log the design hours via a journal entry (not Hackatime, since it's not editor work).
- [ ] Write a real CHANGELOG.md
Drop "Initial release" placeholder. Add ## [0.1.0] - YYYY-MM-DD with sections: Added (the features), Fixed (duplication bug, drag-into-empty-column, autosave-cancels-edit), Tweaked. Follow keepachangelog.com format.
- [ ] Add empty-state UI when todo.md has no columns
Right now the board renders blank with no hint. Add a "Click + Add Column to get started" message. Small UX win, big polish signal.
- [ ] Add keyboard shortcuts via package.json contributes.keybindings
e.g. Cmd+Enter to toggle complete on focused card, Delete to delete focused card. Power-user feature, low effort.
- [ ] Publish to the VSCode Marketplace
Sign up for a publisher ID at marketplace.visualstudio.com/manage. npm i -g @vscode/vsce. vsce package, then vsce publish. Marketplace URL becomes the cleanest possible Playable URL — almost no other Macondo software project does this.
- [ ] Add GitHub repo topics + pin it to your profile
Repo settings -> About -> Topics: vscode-extension, kanban, productivity, todo, markdown, custom-editor. Pin from your GitHub profile (Customize your pins button). Per the shipping docs, this is one of the explicit checklist items.
- [ ] Build a 7-14 day project streak before submitting
+1% gold per consecutive day, snapshotted at ship time. 14 consecutive days of >=1hr Hackatime time on this project = 1.14x multiplier on EVERY hour you've ever logged. Buy streak freezes from the shop later to protect long streaks.

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
