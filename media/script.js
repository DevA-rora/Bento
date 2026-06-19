// acquire the VSCode API:
const vscode = acquireVsCodeApi();

let focusedCardId = null; // which card is the keyboard focused on?
let moveKeyHeld = false; // is V being held down?
const locallyRemovedCardIds = new Set(); // optimistic deletes pending save
let pendingDomSignature = null; // optimistic board state waiting to be saved

function getDomStateSignature() {
    const parts = [];
    document.querySelectorAll('.card-list').forEach((listEl) => {
        parts.push(listEl.dataset.column);
        listEl.querySelectorAll('.card').forEach((cardEl) => {
            parts.push(cardEl.dataset.cardId);
            parts.push(cardEl.classList.contains('completed') ? '1' : '0');
            parts.push(cardEl.querySelector('h3')?.textContent.trim() ?? '');
            parts.push(cardEl.querySelector('p.description')?.textContent.trim() ?? '');
        });
    });
    return parts.join('\0');
}

function getStateSignatureFromMessage(columns, cards) {
    const parts = [];
    for (const col of columns) {
        parts.push(col);
        for (const card of cards) {
            if (card.column === col) {
                parts.push(String(card.id));
                parts.push(card.completed ? '1' : '0');
                parts.push((card.title ?? '').trim());
                parts.push((card.description ?? '').trim());
            }
        }
    }
    return parts.join('\0');
}

function postOptimisticMutation(message) {
    pendingDomSignature = getDomStateSignature();
    vscode.postMessage(message);
}

// after the user finishes a drag & drop:
// walk through the DOM
// read out which cards are in which columns
// "notify" the extension so it can save the new order to todo.md
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
    postOptimisticMutation({ command: 'reorderBoard', columns: columns });
}

// show a right-click context menu on a card
function showCardMenu(x, y, cardId, cardEl) {
    // close any already open menus:
    document.querySelectorAll('.context-menu').forEach(m => m.remove());

    // build the menu:
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';

    // create the delete button 
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'context-menu-item';
    deleteBtn.textContent = 'Delete Card';
    deleteBtn.addEventListener('click', () => {
        removeCardFromBoard(cardEl, cardId);
        menu.remove();
    });

    menu.appendChild(deleteBtn); // put button inside the menu
    document.body.appendChild(menu); // "mount" the menu onto the page

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

// helpers:
function startEditing(cardEl) {
    setFocusedCard(cardEl);
    const titleEl = cardEl.querySelector('h3');
    const descEl = cardEl.querySelector('p.description');
    titleEl.contentEditable = 'true';
    descEl.contentEditable = 'true';
    titleEl.focus();
    scrollCardIntoView(cardEl);
}

function stopEditing(cardEl) {
    if (!cardEl) return;
    const titleEl = cardEl.querySelector('h3');
    const descEl = cardEl.querySelector('p.description');
    titleEl.contentEditable = 'false';
    descEl.contentEditable = 'false';
    titleEl.blur();
    descEl.blur();
    setFocusedCard(cardEl);
}

function scrollCardIntoView(cardEl) {
    // Defer until after layout so scrollIntoView sees final card positions
    // (especially after a full board re-render or Sortable move).
    requestAnimationFrame(() => {
        cardEl.scrollIntoView({
            block: 'center',
            inline: 'center',
            behavior: 'auto',
        });
    });
}

function setFocusedCard(cardEl) {
    document.querySelectorAll('.card.keyboard-focused').forEach(c => {
        c.classList.remove('keyboard-focused');
    });
    if (cardEl) {
        cardEl.classList.add('keyboard-focused');
        focusedCardId = Number(cardEl.dataset.cardId);
        scrollCardIntoView(cardEl);
        document.querySelector('.board')?.focus({ preventScroll: true });
    } else {
        focusedCardId = null;
    }
}

function getFocusedCardEl() {
    if (focusedCardId == null) return null;
    return document.querySelector(`.card[data-card-id="${focusedCardId}"]`);
}

function removeCardFromBoard(cardEl, cardId) {
    if (!cardEl?.isConnected) return;

    locallyRemovedCardIds.add(cardId);

    const allCards = getCardElementsInBoardOrder();
    const focusIndex = allCards.indexOf(cardEl);
    const shouldRefocus = focusedCardId === cardId
        || cardEl.classList.contains('keyboard-focused');

    cardEl.remove();
    postOptimisticMutation({ command: 'deleteCard', id: cardId });

    if (!shouldRefocus) return;

    const remaining = getCardElementsInBoardOrder();
    if (remaining.length === 0) {
        setFocusedCard(null);
    } else {
        setFocusedCard(remaining[Math.min(focusIndex, remaining.length - 1)]);
    }
}

function deleteFocusedCard() {
    if (isEditing()) return;

    const cardEl = getFocusedCardEl();
    if (!cardEl) return;

    removeCardFromBoard(cardEl, focusedCardId);
}

function getFocusedColumnId() {
    const cardEl = getFocusedCardEl();
    return cardEl?.closest('.card-list')?.dataset.column ?? null;
}

function addCardToColumn(columnId) {
    vscode.postMessage({ command: 'addCard', column: columnId });
}

function isEditing() {
    const el = document.activeElement;
    return el && el.getAttribute('contenteditable') === 'true';
}

function getCardElementsInBoardOrder() {
    const result = [];
    document.querySelectorAll('.card-list').forEach(listEl => {
        listEl.querySelectorAll('.card').forEach(cardEl => {
            result.push(cardEl);
        });
    });
    return result;
}

function getColumnCardLists() {
    return [...document.querySelectorAll('.card-list')];
}

function getCardPosition(cardEl) {
    const listEl = cardEl.closest('.card-list');
    const lists = getColumnCardLists();
    const colIdx = lists.indexOf(listEl);
    const rowIdx = [...listEl.querySelectorAll('.card')].indexOf(cardEl);
    return { colIdx, rowIdx };
}

function getCardAtPosition(lists, colIdx, rowIdx) {
    if (colIdx < 0 || colIdx >= lists.length) return null;
    const cards = [...lists[colIdx].querySelectorAll('.card')];
    if (cards.length === 0) return null;
    return cards[Math.min(rowIdx, cards.length - 1)];
}

function findAdjacentColumnCard(lists, startColIdx, rowIdx, direction) {
    const step = direction === 'ArrowRight' ? 1 : -1;
    for (let colIdx = startColIdx + step; colIdx >= 0 && colIdx < lists.length; colIdx += step) {
        const card = getCardAtPosition(lists, colIdx, rowIdx);
        if (card) return card;
    }
    return null;
}

function navigateFocus(cardEl, key) {
    const lists = getColumnCardLists();
    const { colIdx, rowIdx } = getCardPosition(cardEl);

    if (key === 'ArrowUp') {
        const card = getCardAtPosition(lists, colIdx, rowIdx - 1);
        if (card) setFocusedCard(card);
        return;
    }

    if (key === 'ArrowDown') {
        const card = getCardAtPosition(lists, colIdx, rowIdx + 1);
        if (card) setFocusedCard(card);
        return;
    }

    if (key === 'ArrowLeft' || key === 'ArrowRight') {
        const card = findAdjacentColumnCard(lists, colIdx, rowIdx, key);
        if (card) setFocusedCard(card);
    }
}

function moveCardToColumn(cardEl, targetList, targetRowIdx) {
    const targetCards = [...targetList.querySelectorAll('.card')];
    const insertBefore = targetCards[targetRowIdx] ?? null;
    if (insertBefore) {
        targetList.insertBefore(cardEl, insertBefore);
    } else {
        targetList.appendChild(cardEl);
    }
}

function moveCard(cardEl, key) {
    const lists = getColumnCardLists();
    const { colIdx, rowIdx } = getCardPosition(cardEl);
    const listEl = cardEl.closest('.card-list');
    if (!listEl) return;

    if (key === 'ArrowUp') {
        const siblings = [...listEl.querySelectorAll('.card')];
        const i = siblings.indexOf(cardEl);
        if (i > 0) {
            listEl.insertBefore(cardEl, siblings[i - 1]);
        }
    } else if (key === 'ArrowDown') {
        const siblings = [...listEl.querySelectorAll('.card')];
        const i = siblings.indexOf(cardEl);
        if (i < siblings.length - 1) {
            listEl.insertBefore(siblings[i + 1], cardEl);
        }
    } else if (key === 'ArrowLeft') {
        if (colIdx > 0) {
            moveCardToColumn(cardEl, lists[colIdx - 1], rowIdx);
        }
    } else if (key === 'ArrowRight') {
        if (colIdx < lists.length - 1) {
            moveCardToColumn(cardEl, lists[colIdx + 1], rowIdx);
        }
    }

    notifyReorder();
    setFocusedCard(cardEl);
}


// build Kanban board UI from scratch in the WebView.
function renderCards(cards, columns) {
    const boardEl = document.querySelector('.board'); // this

    // destroy any Sortable already attached to boardEl from a previous render
    // (boardEl is the same element across renders; new Sortables stack otherwise)
    const existingBoardSortable = Sortable.get(boardEl);
    if (existingBoardSortable) {
        existingBoardSortable.destroy();
    }

    // destroy old per-column Sortables, otherwise each re-render leaks them
    document.querySelectorAll('.card-list').forEach((listEl) => {
        Sortable.get(listEl)?.destroy();
    })
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
        // display column name as-is (preserving the user's casing from todo.md)
        headingEl.textContent = columnId;
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
            addCardToColumn(columnId);
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
                postOptimisticMutation({
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

        cardEl.addEventListener('click', () => setFocusedCard(cardEl));

        // start editing mode when double clicking a card.
        titleEl.addEventListener('dblclick', () => startEditing(cardEl));

        // right click on each card:
        cardEl.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showCardMenu(e.clientX, e.clientY, card.id, cardEl);
        });

        // blur event for the description.
        descEl.addEventListener('blur', () => {
            const newDescription = descEl.textContent.trim();
            if (newDescription !== (card.description || '')) {
                postOptimisticMutation({
                    command: 'updateDescription',
                    id: card.id,
                    newDescription: newDescription
                });
            }
        });

        checkEl.addEventListener('click', () => {
            // flip visual state instantly, to give the "illusion" that the WebView is actually fast:
            cardEl.classList.toggle('completed');

            postOptimisticMutation({
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
            emptyInsertThreshold: 50, // makes dragging cards into new columns much easier
            onEnd: notifyReorder,
        });
    });

    // sortable on the board (for column dragging)
    new Sortable(boardEl, {
        animation: 150,
        handle: 'h2',
        onEnd: notifyReorder,
    });

    // at end of renderCards(), after Sortable setup:
    if (focusedCardId != null) {
        const el = document.querySelector(`.card[data-card-id="${focusedCardId}"]`);
        if (el) {
            setFocusedCard(el);
        } else {
            focusedCardId = null;
        }
    }
}

document.addEventListener('keydown', (e) => {
    if (isEditing()) {
        if (e.key === 'Tab') {
            e.preventDefault();
            const cardEl = getFocusedCardEl();
            if (!cardEl) return;
            const titleEl = cardEl.querySelector('h3');
            const descEl = cardEl.querySelector('p.description');
            if (e.shiftKey) {
                if (document.activeElement === descEl) titleEl.focus();
                else descEl.focus();
            } else {
                if (document.activeElement === titleEl) descEl.focus();
                else titleEl.focus();
            }
            scrollCardIntoView(cardEl);
        }
        if (e.key === 'Escape' || e.key === 'Enter') {
            e.preventDefault();
            stopEditing(getFocusedCardEl());
        }
        return;
    }

    const cards = getCardElementsInBoardOrder();
    if (cards.length === 0) return;

    if (e.key === 'v') moveKeyHeld = true;

    let index = cards.indexOf(getFocusedCardEl());
    if (index === -1) {
        if (['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(e.key)) {
            setFocusedCard(cards[0]);
            return;
        }
    }

    const cardEl = getFocusedCardEl();

    if (['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(e.key)) {
        e.preventDefault();
        if (moveKeyHeld && cardEl) {
            moveCard(cardEl, e.key);
        } else if (cardEl) {
            navigateFocus(cardEl, e.key);
        }
        return;
    }

    if (e.key === ' ' && cardEl) {
        e.preventDefault();
        cardEl.classList.toggle('completed');
        postOptimisticMutation({ command: 'toggleComplete', id: focusedCardId });
        return;
    }

    if (e.key === 'Enter' && cardEl) {
        e.preventDefault();
        startEditing(cardEl);
        return;
    }

    if (e.key === 'n' && cardEl) {
        e.preventDefault();
        const column = getFocusedColumnId();
        if (column) addCardToColumn(column);
        return;
    }

    if ((e.key === 'Delete' || e.key === 'Backspace') && cardEl) {
        e.preventDefault();
        deleteFocusedCard();
        return;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'v') moveKeyHeld = false;
});

// listener function
window.addEventListener('message', (event) => {
    const message = event.data;
    if (message.command === 'deleteFocusedCard') {
        deleteFocusedCard();
    } else if (message.command == 'init') {

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

        for (const id of [...locallyRemovedCardIds]) {
            if (!message.cards.some(c => c.id === id)) {
                locallyRemovedCardIds.delete(id);
            }
        }

        const filteredCards = message.cards.filter(c => !locallyRemovedCardIds.has(c.id));

        if (pendingDomSignature && !message.focusNewInColumn) {
            const domSig = getDomStateSignature();
            const incomingSig = getStateSignatureFromMessage(message.columns, filteredCards);

            if (domSig === pendingDomSignature && incomingSig !== pendingDomSignature) {
                console.log('[init] skipping stale re-render (DOM ahead of document)');
                return;
            }
            if (incomingSig === pendingDomSignature) {
                pendingDomSignature = null;
            }
        }

        // after an optimistic delete the DOM is already correct — skip stale re-renders
        // (e.g. from Cmd+S or a document change that raced ahead of the save).
        if (locallyRemovedCardIds.size > 0 && !message.focusNewInColumn) {
            const domCount = getCardElementsInBoardOrder().length;
            if (filteredCards.length === domCount) {
                return;
            }
        }

        // render the cards on WebView
        renderCards(filteredCards, message.columns);

        // if the extension told us to auto-edit a new card, then do it now:
        if (message.focusNewInColumn) {
            const listEl = document.getElementById('cardlist-' + message.focusNewInColumn);
            const lastCard = listEl?.querySelector('.card:last-of-type');
            if (lastCard) {
                setFocusedCard(lastCard);
                const titleEl = lastCard.querySelector('h3');
                const descEl = lastCard.querySelector('p.description');
                titleEl.contentEditable = 'true';
                descEl.contentEditable = 'true';
                titleEl.focus();
                document.getSelection().selectAllChildren(titleEl); // preselects the new task.
                scrollCardIntoView(lastCard);
            }
        }
    }
});

// sends payload from the webview to the extension.
vscode.postMessage({ command: 'ready' });