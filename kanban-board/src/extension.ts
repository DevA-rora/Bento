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

// built hardcoded cards array
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
				localResourceRoots: [
					vscode.Uri.joinPath(context.extensionUri, 'media') // lets us reference files in 'media'
				]
			}
		);

		// extra fluff because we're a vscode extension
		// basically we're allowing ourselves to use script.js and style.css.
		const scriptUri = panel.webview.asWebviewUri(
			vscode.Uri.joinPath(context.extensionUri, 'media', 'script.js')
		)

		const styleUri = panel.webview.asWebviewUri(
			vscode.Uri.joinPath(context.extensionUri, 'media', 'style.css')
		)

		// path to board.html
		const htmlPath = path.join(context.extensionPath, 'media', 'board.html'); 

		// read the HTML file into a string variable.
		let html = fs.readFileSync(htmlPath, 'utf-8');

		// replace the scriptUri placeholder in board.html to the REAL URI
		html = html.replace('{{scriptUri}}', scriptUri.toString());

		// do the same thing, but for the styleURI
		html = html.replace('{{styleUri}}', styleUri.toString());

		// assign the final, modified HTML to the webview:
		panel.webview.html = html;

	
		// listener function (so that we can actually make something of the user interaction)
		// checks if the user clicked the button
		panel.webview.onDidReceiveMessage((message) => {
			if (message.command == 'ready') {
				panel.webview.postMessage({command: 'init', cards: cards});
			}
		});

	});

	// when extension stops, clean things up (deregister the command from the command pallette, free internal handles, ect)
	context.subscriptions.push(boardDisposable);

}

// run "main"
export function deactivate() {}