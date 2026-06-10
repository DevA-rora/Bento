// acquire the VSCode API:
const vscode = acquireVsCodeApi();

function notifyReorder() {
    const columns = [];
    document.querySelectorAll('.card-list').forEach((listEl) => {
        const name = listEl.dataset.column;
        const cardIds = [];
        listEl.querySelectorAll('.card').forEach((cardEl) => {
            cardIds.push(Number(cardEl.dataset.cardId));
        });
        columns.push({ name: name, cardIds: cardIds });
    });
    console.log('[notifyReorder] posting:', JSON.stringify(columns));
    vscode.postMessage({ command: 'reorderBoard', columns: columns });
}

function renderCards(cards, columns) {
    const boardEl = document.querySelector('.board'); // this

    // destroy any Sortable already attached to boardEl from a previous render
    // (boardEl is the same element across renders; new Sortables stack otherwise)
    const existingBoardSortable = Sortable.get(boardEl);
    if (existingBoardSortable) {
        existingBoardSortable.destroy();
    }

    // clear board:
    boardEl.innerHTML = '';

    // create column div + headings for each:
    columns.forEach((columnId) => {
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

        // default to view mode (edit requires dlbclick)
        titleEl.contentEditable = 'false';

        // when the user clicks a card twice, activate edit mode.
        titleEl.addEventListener('dblclick', () => {
            titleEl.contentEditable = 'true'; // lets you edit text
            titleEl.focus(); // means the element is now recieving keyboard input.
        });

        titleEl.addEventListener('keydown', (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                titleEl.blur();
            }
        });

        // opposite of focus, when the user clicks away.
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
            onEnd: notifyReorder, 
        });
    });

    // sortable on the board (for column dragging)
    new Sortable(boardEl, {
        animation: 150,
        handle: 'h2',
        onEnd: notifyReorder,
    });
}

// listener function
window.addEventListener('message', (event) => {
    const message = event.data;
    if (message.command == 'init') {
        console.log('[init] columns:', JSON.stringify(message.columns), 'cardCount:', message.cards.length);
        console.log('[init] cards:', JSON.stringify(message.cards));
        renderCards(message.cards, message.columns);
    }
});

vscode.postMessage({ command: 'ready' });