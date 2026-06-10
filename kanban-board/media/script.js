// acquire the VSCode API:
const vscode = acquireVsCodeApi();

function renderCards(cards) {
    const boardEl = document.querySelector('.board'); // this

    // clear board:
    boardEl.innerHTML = '';

    // find unique column names --> Create a column div for each:
    const seenColumns = [];
    // for each card
    cards.forEach((card) => {
        // if the array DOES NOT include the card:
        if (!seenColumns.includes(card.column)) {
            seenColumns.push(card.column); // append to array.
        }
    });

    // create column div + headings for each:
    seenColumns.forEach((columnId) =>  {
        const colEl = document.createElement('div');
        const listEl = document.createElement('div');

        colEl.className = 'column';
        colEl.id = 'column-' + columnId;

        listEl.className = 'card-list';
        listEl.id = 'cardlist-' + columnId;
        listEl.dataset.column = columnId;
        
        const headingEl = document.createElement('h2');
        // captialise columns:
        headingEl.textContent = columnId.charAt(0).toUpperCase() + columnId.slice(1);
        // append heading & list.
        colEl.appendChild(headingEl);
        colEl.appendChild(listEl);

        boardEl.appendChild(colEl);
    });

    // card-creating code. Renders cards into the columns we just made.
    cards.forEach((card) => {
        // card container
        const cardEl = document.createElement('div');

        // data card id is being set on cardEl.
        cardEl.dataset.cardId = card.id;

        // differentiate between completed and uncompleted tasks.
        cardEl.className = 'card';
        if (card.completed) {
            cardEl.classList.add('completed');
        }

        // build title element and put it inside the card:
        const titleEl = document.createElement('h3');
        titleEl.textContent = card.title;

        // make it editable:
        titleEl.contentEditable = 'true';
        titleEl.addEventListener('blur', () => {
            const newTitle = titleEl.textContent.trim();
            if (newTitle !== card.title) {
                vscode.postMessage({
                    command: 'updateTitle',
                    id: card.id,
                    newTitle: newTitle
                });
            }
        });

        
        cardEl.appendChild(titleEl);
        
        // build description element only if it exists
        // put it inside the card:
        if (card.description) {
            const descEl = document.createElement('p');
            descEl.textContent = card.description;
            cardEl.appendChild(descEl);
        }
        
        // find the right column and put the entire card in it:
        const listEl = document.getElementById('cardlist-' + card.column);
        listEl.appendChild(cardEl)
    });

    document.querySelectorAll('.card-list').forEach((listEl) => {
        new Sortable(listEl, {
            group: 'cards',
            animation: 150,
            onEnd: () => {
                // walk the DOM and build the new ordering
                const columns = [];
                document.querySelectorAll('.card-list').forEach((listEl) => {
                    const name = listEl.dataset.column;
                    const cardIds = [];
                    listEl.querySelectorAll('.card').forEach((cardEl) => {
                        cardIds.push(Number(cardEl.dataset.cardId));
                    });
                    columns.push({ name: name, cardIds: cardIds });
                });
                vscode.postMessage({ command: 'reorderBoard', columns: columns });
                // send it to the extension
            }
        });
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