// acquire the VSCode API:
const vscode = acquireVsCodeApi();

window.addEventListener('message', (event) => {
    const message = event.data;
    if (message.command == 'init') {
        console.log('Got cards:', message.cards);
    }
});

vscode.postMessage({ command: 'ready' });