// disposables are little objects that keep track of things.
// every app is the data + things you can do to it.

import * as vscode from 'vscode'; // VSCode extensions API
import * as fs from 'fs'; // file system API (lets us read files)
import * as path from 'path'; // path API (lets us build paths)

// build the card object (I can modify this later)
interface Card {
	id: number;
	title: string;
	description?: string;
	column: string;
	completed: boolean;
}

// convert todo.md to card interface
function parseMarkdown(text: string): { cards: Card[], columns: string[] } {
	const lines = text.split('\n');
	const cards: Card[] = [];
	const columns: string[] = [];
	let currentColumn = '';
	let nextId = 0;

	// for all the lines in the markdown file / string.
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		// if a line in the md file starts with a "#"
		if (line.startsWith('# ')) {
			// get rid of the first 2 characters ("# " is 2 chars. the "#", and the " ")
			// .trim strips leading and trailing whitespaces.
			// preserve the user's original casing for the column name
			currentColumn = line.slice(2).trim();
			if (!columns.includes(currentColumn)) {
				columns.push(currentColumn);
			}

			// othersise, if the line starts with a task (-[ ]) or (- [x])
		} else if (line.startsWith('- [ ]') || line.startsWith('- [x]')) {
			// remove first 6 chars.
			const title = line.slice(6).trim();

			// const for next line & define what a description is:
			const nextLine = lines[i + 1];
			let description: string | undefined;
			nextId++; // increment the taskId

			// check if the next line isn't a heading or a task.
			if (nextLine && !nextLine.startsWith('# ') && !nextLine.startsWith('- [')) {
				description = nextLine.trim(); // the description is the next line.
				i++; // skip the next description.
			}

			// const for checking if a task is completed:
			const completed = line.startsWith('- [x]');

			// const for card interface
			const card: Card = {
				id: nextId,
				title: title,
				column: currentColumn,
				completed: completed,
			};
			// if the description exists, then let the card description be the description.
			if (description) {
				card.description = description;
			}

			// append the cards to array
			cards.push(card);
		}
	}
	return { cards, columns }; // return cards array.
}

// serialise cards:
function serialiseCards(cards: Card[], columns: string[]): string {
	// create an emtpy array of strings called "lines"
	const lines: string[] = [];

	// for column in the columns
	for (const column of columns) {
		// column heading
		lines.push("# " + column);

		// cards in this column (filtered from the full list)
		const cardsInColumn = cards.filter(c => c.column === column);
		// for cards in the column:
		for (const card of cardsInColumn) {

			// if card.compelted is true, set marker to - [x], otherwise set it to -[ ]
			const marker = card.completed ? '- [x]' : '- [ ]';

			// push the formatted line into the buffer:
			lines.push(`${marker} ${card.title}`);

			// if the card has a description, then put that in the card too.
			if (card.description) {
				lines.push(card.description);
			}
		}
		// blank line between columns for readability:
		lines.push('');
	}
	// turns array of individual lines into one single string we can write back to todo.md
	return lines.join('\n');
}

// this is like "main" in python.
export function activate(context: vscode.ExtensionContext) {

	// register a VSCode command named "kanban-openAsKanban".
	// a "command" in VSCode is a named action that can be triggered from menus (command palette, keyboard shortcuts, or other code.)
	// we have to do this, this is just how VSCode extensions work...
	const openAsKanban = vscode.commands.registerCommand(
		'bento.openAsKanban',
		(uri: vscode.Uri) => {
			vscode.commands.executeCommand('vscode.openWith', uri, 'bento.editor');
		}
	);

	// register VSCode command "bento.openAsText"
	const openAsText = vscode.commands.registerCommand(
		'bento.openAsText',
		(uri: vscode.Uri) => {
			vscode.commands.executeCommand('vscode.openWith', uri, 'default');
		}
	);
	// "when my extension shuts down, dispose of these two command regristrations for me"
	// we need to do this to avoid stuff like memory leaks, duplicate registrations, and stale handlers (whatever those are)
	// but basically, this is just best practice.
	context.subscriptions.push(openAsKanban, openAsText);


	// custom editor provider for todo.md
	const kanbanProvider: vscode.CustomTextEditorProvider = {
		// this function setups everything the Kanban view needs whenever the user opens todo.md
		resolveCustomTextEditor(document, webviewPanel, token) {
			// flag to skip re-rendering when WE are the source of the change
			// (e.g. our own applyEdit from drag/title update). Otherwise we get a feedback loop:
			// webview drag -> applyEdit -> doc change -> init -> webview re-render -> ...
			let isApplyingEdit = false;

			// listener that watches for changes to text files in the workspace
			// and when todo.md specifically changes, refresh the webview to show the new data.
			// the "document" is always todo.md because of the restriction is package.json (restricted the custom editor to just that filename)
			// so privacy! yay clapping!
			const changeSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
				if (isApplyingEdit) {return;} // our own edit, ignore
				if (e.document.uri.toString() === document.uri.toString()) {
					const { cards, columns } = parseMarkdown(document.getText());
					webviewPanel.webview.postMessage({ command: 'init', cards, columns });
				}
			});

			// configure webview options for security (WebViews are sandboxed environments)
			webviewPanel.webview.options = {
				enableScripts: true, // without this, we wouldn't be able to use any JS scripts!
				localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')] // whitelists folders on disk the webview is allowed to load files from.
			};

			// when user closes the Kanban tab, dispose of the workspace document-change listener (no need for it to run pointlessly forever)
			webviewPanel.onDidDispose(() => {
				changeSubscription.dispose();
			});

			// build URIs (moved from "extra fluff" section)
			// basically we're allowing ourselves to use script.js and style.css.
			const sortableUri = webviewPanel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'Sortable.min.js'));
			const scriptUri = webviewPanel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'script.js'));
			const styleUri = webviewPanel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'style.css'));

			// path to board.html
			const htmlPath = path.join(context.extensionPath, 'media', 'board.html');

			// read the HTML file into a string variable.
			let html = fs.readFileSync(htmlPath, 'utf-8');

			// replace the scriptUri placeholder in board.html to the REAL URI
			html = html.replace('{{sortableUri}}', sortableUri.toString());
			html = html.replace('{{scriptUri}}', scriptUri.toString());

			// do the same thing, but for the styleURI
			html = html.replace('{{styleUri}}', styleUri.toString());

			// assign the final, modified HTML to the webview:
			webviewPanel.webview.html = html;

			// handle messages from the webview:
			webviewPanel.webview.onDidReceiveMessage(async (message) => {

				// when the extension runs, read and parse the file, then send the initial state to the WebView
				if (message.command === 'ready') {
					const { cards, columns } = parseMarkdown(document.getText());
					webviewPanel.webview.postMessage({ command: 'init', cards, columns });

					// when the user edits a card's title in the UI, find the card in todo.md, update it, and write the whole todo.md back to disk
				} else if (message.command === 'updateTitle') {
					// parse current state:
					const { cards, columns } = parseMarkdown(document.getText());

					// find cards by ID and mutate its title:
					const card = cards.find(c => c.id === message.id);
					if (!card) {return;}
					card.title = message.newTitle;

					// serialise back to markdown:
					const newText = serialiseCards(cards, columns);

					// apply as a workspace edit:
					const edit = new vscode.WorkspaceEdit();
					edit.replace(
						document.uri,
						new vscode.Range(0, 0, document.lineCount, 0),
						newText
					);
					isApplyingEdit = true;
					try {
						await vscode.workspace.applyEdit(edit);
					} finally {
						isApplyingEdit = false;
					}

					// same as "updateTitle", but for the card's description.
				} else if (message.command === 'updateDescription') {
					const { cards, columns } = parseMarkdown(document.getText());
					const card = cards.find(c => c.id === message.id);
					if (!card) {return;}
					card.description = message.newDescription;
					const newText = serialiseCards(cards, columns);
					const edit = new vscode.WorkspaceEdit();
					edit.replace(
						document.uri,
						new vscode.Range(0, 0, document.lineCount, 0),
						newText
					);
					isApplyingEdit = true;
					try {
						await vscode.workspace.applyEdit(edit);
					} finally {
						isApplyingEdit = false;
					}

					// if the user reorders the board on the UI, parse -> mutate -> serialise -> apply step
					// but the mutation step here is a little different, becuase we send an entire new layout to the webview, so the extension
					// needs to reconsile that against the cards it already knows about.
				} else if (message.command === 'reorderBoard') {
					console.log('[reorderBoard] message.columns:', JSON.stringify(message.columns));

					// parse current state:
					const { cards: oldCards } = parseMarkdown(document.getText());
					console.log('[reorderBoard] oldCards count:', oldCards.length, 'ids:', oldCards.map(c => c.id));

					// build a lookup by id:
					const cardLookup = new Map<number, Card>();
					for (const card of oldCards) {
						cardLookup.set(card.id, card);
					}

					// rebuild cards in new order:
					const newCards: Card[] = [];
					for (const column of message.columns) {
						for (const cardId of column.cardIds) {
							const card = cardLookup.get(cardId);
							if (!card) {continue;}
							card.column = column.name;
							newCards.push(card);
						}
					}
					// pull column names from the webview's payload, in the order it sent them in:
					const newColumns = message.columns.map((c: { name: string }) => c.name);
					console.log('[reorderBoard] newCards count:', newCards.length, 'ids:', newCards.map(c => c.id));
					// serialise + apply as a workspace edit
					const newText = serialiseCards(newCards, newColumns);
					console.log('[reorderBoard] newText:\n' + newText);
					const edit = new vscode.WorkspaceEdit();
					edit.replace(
						document.uri,
						new vscode.Range(0, 0, document.lineCount, 0),
						newText
					);
					isApplyingEdit = true;
					try {
						await vscode.workspace.applyEdit(edit);
					} finally {
						isApplyingEdit = false;
					}

					// if the user toggles the completion of a card, then update the todo.md accordingly (same as "updateTitle")
				} else if (message.command === 'toggleComplete') {
					const { cards, columns } = parseMarkdown(document.getText());
					const card = cards.find(c => c.id === message.id);
					if (!card) {return;}
					card.completed = !card.completed; // flip
					const newText = serialiseCards(cards, columns);
					const edit = new vscode.WorkspaceEdit();
					edit.replace(
						document.uri,
						new vscode.Range(0, 0, document.lineCount, 0),
						newText
					);
					isApplyingEdit = true;
					try {
						await vscode.workspace.applyEdit(edit);
					} finally {
						isApplyingEdit = false;
					}

					// if the user adds a card, update the todo.md accordingly (again, similar shape/pattern)
				} else if (message.command === 'addCard') {
					const { cards, columns } = parseMarkdown(document.getText());

					const newCard: Card = {
						// ids are derived from parse position. They are stable within a single render cycle, but may change between parses (eg: after a reorder)
						// don't persist or rely on them across operations
						id: -1, // placeholder id, overwritten on the next parse.
						title: "New Task",
						column: message.column,
						completed: false
					};
					cards.push(newCard);

					const newText = serialiseCards(cards, columns);
					const edit = new vscode.WorkspaceEdit();
					edit.replace(
						document.uri,
						new vscode.Range(0, 0, document.lineCount, 0),
						newText
					);
					isApplyingEdit = true;
					try {
						await vscode.workspace.applyEdit(edit);
					} finally {
						isApplyingEdit = false;
					}

					// rerender the webview to have the new card work:
					const { cards: newCards, columns: newColumns } = parseMarkdown(document.getText());
					webviewPanel.webview.postMessage({
						command: 'init',
						cards: newCards,
						columns: newColumns,
						focusNewInColumn: message.column
					});

					// render add column button. / when the user adds a column, render the column.
				} else if (message.command === 'addColumn') {
					// ask the user for a name
					const name = await vscode.window.showInputBox({
						prompt: 'Column name',
						placeHolder: 'e.g. Backlog'
					});
					if (!name) {return;} // the user pressed escape

					const { cards, columns } = parseMarkdown(document.getText());

					// avoid case-insensitive duplicates while preserving the user's casing
					const trimmed = name.trim();
					if (columns.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
						vscode.window.showWarningMessage(`Column "${name}" already exists`);
						return;
					}
					columns.push(trimmed);

					const newText = serialiseCards(cards, columns);
					const edit = new vscode.WorkspaceEdit();
					edit.replace(
						document.uri,
						new vscode.Range(0, 0, document.lineCount, 0),
						newText
					);
					isApplyingEdit = true;
					try {
						await vscode.workspace.applyEdit(edit);
					} finally {
						isApplyingEdit = false;
					}

					// manually trigger re-render so that the new column appears in WebView:
					const { cards: refreshedCards, columns: refreshedColumns } = parseMarkdown(document.getText());
					webviewPanel.webview.postMessage({
						command: 'init',
						cards: refreshedCards,
						columns: refreshedColumns
					});

					// if the user deletes a card, then remove the card from todo.md
				} else if (message.command === 'deleteCard') {
					const { cards, columns } = parseMarkdown(document.getText());
					const filtered = cards.filter(c => c.id !== message.id);
					if (filtered.length === cards.length) {return;} // not found, so we can just ignore.

					const newText = serialiseCards(filtered, columns);
					const edit = new vscode.WorkspaceEdit();
					edit.replace(
						document.uri,
						new vscode.Range(0, 0, document.lineCount, 0),
						newText
					);
					isApplyingEdit = true;
					try {
						await vscode.workspace.applyEdit(edit);
					} finally {
						isApplyingEdit = false;
					}
				} else {
					// something strange going on in the neighbourhood if ts is happening:
					console.warn("[[bento] unknown command coming from webview:", message);
				}
			});
		}
	};
	// register editor:
	const editorRegistration = vscode.window.registerCustomEditorProvider(
		'bento.editor', // must match with the viewType in package.json
		kanbanProvider
	);
	context.subscriptions.push(editorRegistration);

	// entry point the user can invoke from the command palette (zero-context trigger)
	const boardDisposable = vscode.commands.registerCommand('bento.openBoard', () => {
		// find the workspace
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		// ? is optional chaining. doesn't crash if workspace folders is undefined.
		if (!workspaceFolder) {
			vscode.window.showErrorMessage("Please open a folder to use Bento!");
			return;
		}

		// set todo.md file path:
		const todoPath = path.join(workspaceFolder.uri.fsPath, 'todo.md');
		// if todo.md doesn't exist yet, create it with a starter Kanban template
		if (!fs.existsSync(todoPath)) {
			const starterContent =
				'# Todo\n' +
				'- [ ] Add your todos here\n' +
				'\n' +
				'# Doing\n' +
				'- [ ] Add things you\'re working on here\n' +
				'\n' +
				'# Done\n' +
				'- [x] Stuff you\'ve finished!\n';
			fs.writeFileSync(todoPath, starterContent, 'utf-8');
		}
		// open it with the custon editor!
		const todoUri = vscode.Uri.file(todoPath);
		vscode.commands.executeCommand('vscode.openWith', todoUri, 'bento.editor');

	});

	// when extension stops, clean things up (deregister the command from the command pallette, free internal handles, ect)
	context.subscriptions.push(boardDisposable);

}

// run "main"
export function deactivate() { }