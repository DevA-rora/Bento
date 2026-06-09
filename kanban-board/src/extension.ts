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
function parseMarkdown(text: string): Card[] {
	const lines = text.split('\n');
	const cards: Card[] = [];
	let currentColumn = '';
	let nextId = 0;

	// for all the lines in the markdown file / string.
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		if (line.startsWith('# ')) {
			// get rid of the first 2 characters ("# " is 2 chars. the "#", and the " ")
			// .trim strips leading and trailing whitespaces.
			currentColumn = line.slice(2).trim().toLowerCase();

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
	return cards; // return cards array.
}

// this is like "main" in python.
export function activate(context: vscode.ExtensionContext) {


// custom editor provider for todo.md
const kanbanProvider: vscode.CustomTextEditorProvider = {
	resolveCustomTextEditor(document, webviewPanel, token) {
		const changeSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
			if (e.document.uri.toString() === document.uri.toString()) {
				const cards = parseMarkdown(document.getText());
				webviewPanel.webview.postMessage({ command: 'init', cards });
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
		const scriptUri = webviewPanel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'script.js'))
		const styleUri = webviewPanel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'style.css'))

		// path to board.html
		const htmlPath = path.join(context.extensionPath, 'media', 'board.html');

		// read the HTML file into a string variable.
		let html = fs.readFileSync(htmlPath, 'utf-8');

		// replace the scriptUri placeholder in board.html to the REAL URI
		html = html.replace('{{scriptUri}}', scriptUri.toString());

		// do the same thing, but for the styleURI
		html = html.replace('{{styleUri}}', styleUri.toString());

		// assign the final, modified HTML to the webview:
		webviewPanel.webview.html = html;

		// handle messages from the webview:
		webviewPanel.webview.onDidReceiveMessage((message) => {
			if (message.command == 'ready') {
				const cards = parseMarkdown(document.getText());
				webviewPanel.webview.postMessage({ command: 'init', cards });
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