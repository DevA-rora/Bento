// acquire the VSCode API:
const vscode = acquireVsCodeApi();

function renderCards(cards) {
    cards.forEach((card) => {
        // card countainer
        const cardEl = document.createElement('div');
        cardEl.className = 'card';

        // build title element and put it inside the card:
        const titleEl = document.createElement('h3');
        titleEl.textContent = card.title;
        cardEl.appendChild(titleEl);

        // build description element only if it exists
        // put it inside the card:
        if (card.description) {
            const descEl = document.createElement('p');
            descEl.textContent = card.description;
            cardEl.appendChild(descEl);
        }

        // find the right column and put the entire card in it:
        const columnEl = document.getElementById('column-' + card.column);
        columnEl.appendChild(cardEl)
    });
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