// disposables are little objects that keep track of things.

import * as vscode from 'vscode';

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
			{} // 4. options: leave as {} for now.
		);

		panel.webview.html = `
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Kanban Board</title>
		</head>
		<body>
			<h1>Kanban Board</h1>
		</body>
		</html>
		`
		
		// lets see if this works!

	});

	context.subscriptions.push(boardDisposable);
}

// run "main"
export function deactivate() {}