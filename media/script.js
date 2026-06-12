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

function showCardMenu(x, y, cardId, cardEl) {
    // close any already open menus:
    document.querySelectorAll('.context-menu').forEach(m => m.remove());

    // build the menu:
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'context-menu-item';
    deleteBtn.textContent = 'Delete Card';
    deleteBtn.addEventListener('click', () => {
        cardEl.remove();
        vscode.postMessage({ command: 'deleteCard', id: cardId });
        menu.remove();
    });

    menu.appendChild(deleteBtn);
    document.body.appendChild(menu);

    // close menu when user clicks enywhere else or presses escape
    // setTimeout(0) so that THIS right click doesn't immediately trigger the close.
    setTimeout(() => {
        const close = () => {
            menu.remove();
            document.removeEventListener('click', close);
            document.removeEventListener('keydown', escClose);
        };
        const escClose = (e) => { if (e.key === 'Escape') close() };
        document.addEventListener('click', close); // remove parentheses, this should fix the bug.
        document.addEventListener('keydown', escClose);
    }, 0);
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

        // create button for making new cards in the WebView:
        const addBtn = document.createElement('button');
        addBtn.className = 'add-card';
        addBtn.type = 'button';
        addBtn.textContent = "+ Add Card";
        addBtn.addEventListener('click', () => {
            vscode.postMessage({
                command: 'addCard',
                column: columnId
            });
        });
        colEl.appendChild(addBtn);


    });

    // create button for making new columns at the end of the board:
    const addColBtn = document.createElement('button');
    addColBtn.className = 'add-column';
    addColBtn.type = 'button';
    addColBtn.textContent = '+ Add Column';
    addColBtn.addEventListener('click', () => {
        vscode.postMessage({ command: 'addColumn' });
    });
    boardEl.appendChild(addColBtn);


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

        // circle button
        const checkEl = document.createElement('button');
        checkEl.className = 'check-circle';
        checkEl.type = 'button'; // prevents form submission weirdness

        // build title element and put it inside the card:
        const titleEl = document.createElement('h3');
        titleEl.textContent = card.title;

        // default to view mode (edit requires dlbclick)
        titleEl.contentEditable = 'false';

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

        // description element always created & always shown,
        // so there's something to double click, even on empty cards:
        const descEl = document.createElement('p');
        descEl.className = 'description';
        descEl.textContent = card.description || ''; // empty string when none
        descEl.contentEditable = 'false'; // view mode by default

        // title row: circle + title are side by side:
        const titleRow = document.createElement('div');
        titleRow.className = 'title-row';
        titleRow.appendChild(checkEl);
        titleRow.append(titleEl);

        // assemble the card: titleRow on top, description below:
        cardEl.appendChild(titleRow);
        cardEl.appendChild(descEl);

        // when the user clicks a card twice, activate edit mode.
        titleEl.addEventListener('dblclick', () => {
            titleEl.contentEditable = 'true'; // lets you edit text for the todo title
            // lets you edit text for the task description
            descEl.contentEditable = 'true';
            titleEl.focus(); // means the element is now recieving keyboard input.
        });

        // right click on each card:
        cardEl.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showCardMenu(e.clientX, e.clientY, card.id, cardEl);
        });

        // blur event for the description.
        descEl.addEventListener('blur', () => {
            const newDescription = descEl.textContent.trim();
            if (newDescription !== (card.description || '')) {
                vscode.postMessage({
                    command: 'updateDescription',
                    id: card.id,
                    newDescription: newDescription
                });
            }
        });

        // when enter is clicked, "unfocus" the card.
        titleEl.addEventListener('keydown', (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                titleEl.blur();
            }
        });

        // when enter is clicked, "unfocus" the card.
        descEl.addEventListener('keydown', (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                descEl.blur();
            }
        });

        checkEl.addEventListener('click', () => {
            // flip visual state instantly, to give the "illusion" that the WebView is actually fast:
            cardEl.classList.toggle('completed');

            vscode.postMessage({
                command: 'toggleComplete',
                id: card.id
            })
        })

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

        // skip re-render while user is editing their card (otherwise autosave event wipes typing)
        const activeEl = document.activeElement;
        const isCurrentlyEditing = activeEl && activeEl.getAttribute('contenteditable') === 'true';
        if (isCurrentlyEditing && !message.focusNewInColumn) {
            console.log('[init] skipping re-render (the user is editing!)')
            return;
        }

        // print basic info about columns & cards:
        console.log('[init] columns:', JSON.stringify(message.columns), 'cardCount:', message.cards.length);
        console.log('[init] cards:', JSON.stringify(message.cards));

        // render the cards on WebView
        renderCards(message.cards, message.columns);

        // if the extension told us to auto-edit a new card, then do it now:
        if (message.focusNewInColumn) {
            const listEl = document.getElementById('cardlist-' + message.focusNewInColumn);
            const lastCard = listEl.lastElementChild;
            if (lastCard) {
                const titleEl = lastCard.querySelector('h3');
                const descEl = lastCard.querySelector('p.description');
                titleEl.contentEditable = 'true';
                titleEl.focus();
                document.getSelection().selectAllChildren(titleEl); // preselects the new task.
            }
        }
    }
});

vscode.postMessage({ command: 'ready' });