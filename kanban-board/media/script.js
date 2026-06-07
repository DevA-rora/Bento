// acquire the VSCode API:
const vscode = acquireVsCodeApi();

function renderCards(cards) {
    cards.forEach((card) => {

    // put the card on screen:
    const cardEl = document.createElement('div');

    // put the title text in the card
    cardEl.textContent = card.title;

    // css name so we can style it:
    cardEl.className = 'card';

    // find the column it belongs to:
    const columnEl = document.getElementById('column-' + card.column);

    // plug the card into the column. it now appears on screen:
    columnEl.appendChild(cardEL);
        
    })
}

// listener function
window.addEventListener('message', (event) => {
    const message = event.data;
    if (message.command == 'init') {
        renderCards(message.cards)
        console.log('Got cards:', message.cards);
    }
});

vscode.postMessage({ command: 'ready' });