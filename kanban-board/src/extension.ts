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
}

let cards: Card[] = [
	{ id: 1, title: "Fix Bug", description: "something lol", column: "todo"},
	{ id: 2, title: "Fix Bug", description: "another something lol", column: "doing"},
	{ id: 3, title: "Fix Bug", column: "doing"} // don't need a description because of the "?"
]


// this is like "main" in python.
export function activate(context: vscode.ExtensionContext) {

	// print congrats to the console.
	console.log('Congratulations, your extension "kanban-board" is now active!');

	// register the webview command:
	const boardDisposable = vscode.commands.registerCommand('kanban-board.openBoard', () => {
		// create a webview:
		const panel = vscode.window.createWebviewPanel(
			'kanbanBoard.view', // 1. viewType: unique string ID
			'Kanban Board', // 2. title: what shows on the tag when open in the editor
			vscode.ViewColumn.One, // means that the webview opens in the MAIN editor area.
			{
				enableScripts: true, // enables javascript in the webview. (the JSX code)
			}
		);

		const htmlPath = path.join(context.extensionPath, 'media', 'board.html'); // path to board.html
		panel.webview.html = fs.readFileSync(htmlPath, 'utf8'); // read the file and convert it to a string to pass as the webview.
		
		// listener function:		
		panel.webview.onDidReceiveMessage((message) => {
			console.log('Message from webview:', message);
			if (message.command === 'buttonClicked') {
				vscode.window.showInformationMessage('Button clicked!');
			}
		});

	});


	context.subscriptions.push(boardDisposable);

}

// run "main"
export function deactivate() {}