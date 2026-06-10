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

		if (line.startsWith('# ')) {
			// get rid of the first 2 characters ("# " is 2 chars. the "#", and the " ")
			// .trim strips leading and trailing whitespaces.
			currentColumn = line.slice(2).trim().toLowerCase();
			if (!columns.includes(currentColumn)) {
				columns.push(currentColumn);
			}

		} else if (line.startsWith('- [ ]') || line.startsWith('- [x]')) {
			// remove first 6 chars.
			const title = line.slice(6).trim();

			// const for next line & define what a description is:
			const nextLine = lines[i + 1];
			let description: string | undefined;
			nextId++; // increment the taskId

			// check if the next line isn't a heading or a task.
			if (nextLine && !nextLine.startsWith('# ') && !nextLine.startsWith('- [')) {
				description = nextLine.trim() // the description is the next line.
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
	const lines: string[] = [];

	for (const column of columns) {
		// column heading
		lines.push('# ' + column.charAt(0).toUpperCase() + column.slice(1));

		// cards in this column (filtered from the full list)
		const cardsInColumn = cards.filter(c => c.column === column);
		for (const card of cardsInColumn) {
			const marker = card.completed ? '- [x]' : '- [ ]';
			lines.push(`${marker} ${card.title}`);
			if (card.description) {
				lines.push(card.description);
			}
		}
		// blank line between columns for readability:
		lines.push('');
	}
	return lines.join('\n');
}

// this is like "main" in python.
export function activate(context: vscode.ExtensionContext) {

	// 
	const openAsKanban = vscode.commands.registerCommand(
		'kanban-board.openAsKanban',
		(uri: vscode.Uri) => {
			vscode.commands.executeCommand('vscode.openWith', uri, 'kanbanBoard.editor');
		}
	);

	// 
	const openAsText = vscode.commands.registerCommand(
		'kanban-board.openAsText',
		(uri: vscode.Uri) => {
			vscode.commands.executeCommand('vscode.openWith', uri, 'default');
		}
	);
	context.subscriptions.push(openAsKanban, openAsText);


	// custom editor provider for todo.md
	const kanbanProvider: vscode.CustomTextEditorProvider = {
		resolveCustomTextEditor(document, webviewPanel, token) {
			// flag to skip re-rendering when WE are the source of the change
			// (e.g. our own applyEdit from drag/title update). Otherwise we get a feedback loop:
			// webview drag -> applyEdit -> doc change -> init -> webview re-render -> ...
			let isApplyingEdit = false;

			const changeSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
				if (isApplyingEdit) return; // our own edit, ignore
				if (e.document.uri.toString() === document.uri.toString()) {
					const { cards, columns } = parseMarkdown(document.getText());
					webviewPanel.webview.postMessage({ command: 'init', cards, columns });
				}
			})

			// configure webview options:
			webviewPanel.webview.options = {
				enableScripts: true,
				localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')]
			};

			webviewPanel.onDidDispose(() => {
				changeSubscription.dispose();
			});

			// build URIs (moved from "extra fluff" section)
			// basically we're allowing ourselves to use script.js and style.css.
			const sortableUri = webviewPanel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'Sortable.min.js'))
			const scriptUri = webviewPanel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'script.js'))
			const styleUri = webviewPanel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'style.css'))

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

				if (message.command == 'ready') {
					const { cards, columns } = parseMarkdown(document.getText());
					webviewPanel.webview.postMessage({ command: 'init', cards, columns });

				} else if (message.command === 'updateTitle') {
					// parse current state:
					const { cards, columns } = parseMarkdown(document.getText());

					// find cards by ID and mutate its title:
					const card = cards.find(c => c.id === message.id);
					if (!card) return;
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

				} else if (message.command === 'updateDescription') {
					const { cards, columns } = parseMarkdown(document.getText());
					const card = cards.find(c => c.id === message.id);
					if (!card) return;
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
				} else if(message.command === 'reorderBoard') {
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
			if (!card) continue;
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
}
			});
		}
	};
// register editor:
const editorRegistration = vscode.window.registerCustomEditorProvider(
	'kanbanBoard.editor', // must match with the viewType in package.json
	kanbanProvider
);
context.subscriptions.push(editorRegistration);

const boardDisposable = vscode.commands.registerCommand('kanban-board.openBoard', () => {
	// find the workspace
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
	// ? is optional chaining. doesn't crash if workspace folders is undefined.
	if (!workspaceFolder) {
		vscode.window.showErrorMessage("Please open a folder to use the Kanban Board!");
		return;
	}

	// set todo.md file path:
	const todoPath = path.join(workspaceFolder.uri.fsPath, 'todo.md');
	const todoExists = fs.existsSync(todoPath)
	// check if todo.md exists:
	if (todoExists) {
		// then continue
	} else if (!todoExists) {
		// First time! Create an empty todo file w/kanban template:
		const starterContent = `# Todo
- [ ] Add your todos here
			
# Doing
- [ ] Add things you're working on here
			
# Done
- [x] Stuff you've finished!
			`;
		fs.writeFileSync(todoPath, starterContent, 'utf-8');
	}
	// open it with the custon editor!
	const todoUri = vscode.Uri.file(todoPath);
	vscode.commands.executeCommand('vscode.openWith', todoUri, 'kanbanBoard.editor');

});

// when extension stops, clean things up (deregister the command from the command pallette, free internal handles, ect)
context.subscriptions.push(boardDisposable);

}

// run "main"
export function deactivate() { }