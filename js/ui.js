const UI = (() => {
  const COL_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  function buildLabels() {
    const pCols = document.getElementById('player-col-labels');
    const eCols = document.getElementById('enemy-col-labels');
    const pRows = document.getElementById('player-row-labels');
    const eRows = document.getElementById('enemy-row-labels');

    COL_LETTERS.forEach(letter => {
      const s1 = document.createElement('span');
      s1.textContent = letter;
      pCols.appendChild(s1);
      const s2 = document.createElement('span');
      s2.textContent = letter;
      eCols.appendChild(s2);
    });

    for (let i = 1; i <= BOARD_SIZE; i++) {
      const s1 = document.createElement('span');
      s1.textContent = i;
      pRows.appendChild(s1);
      const s2 = document.createElement('span');
      s2.textContent = i;
      eRows.appendChild(s2);
    }
  }

  function buildBoard(containerId, onCellClick, onCellEnter, onCellLeave) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = r;
        cell.dataset.col = c;
        if (onCellClick) {
          cell.addEventListener('click', () => onCellClick(r, c));
        }
        if (onCellEnter) {
          cell.addEventListener('mouseenter', () => onCellEnter(r, c));
        }
        if (onCellLeave) {
          cell.addEventListener('mouseleave', () => onCellLeave(r, c));
        }
        container.appendChild(cell);
      }
    }
  }

  function getCell(containerId, r, c) {
    const container = document.getElementById(containerId);
    return container.children[r * BOARD_SIZE + c];
  }

  function renderBoard(containerId, board, showShips) {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const cell = getCell(containerId, r, c);
        cell.className = 'cell';
        switch (board[r][c]) {
          case CELL_SHIP:
            if (showShips) cell.classList.add('ship');
            break;
          case CELL_HIT:
            cell.classList.add('hit');
            break;
          case CELL_MISS:
            cell.classList.add('miss');
            break;
          case CELL_SUNK:
            cell.classList.add('sunk');
            break;
        }
      }
    }
  }

  function setMessage(text) {
    document.getElementById('message').textContent = text;
  }

  function updateScores(playerShips, enemyShips) {
    const playerLeft = playerShips.filter(s => !s.sunk).length;
    const enemyLeft = enemyShips.filter(s => !s.sunk).length;
    document.getElementById('player-ships-left').textContent = playerLeft;
    document.getElementById('enemy-ships-left').textContent = enemyLeft;
  }

  function buildShipDock(ships, onSelect) {
    const list = document.getElementById('ship-list');
    list.innerHTML = '';
    ships.forEach((ship, index) => {
      const div = document.createElement('div');
      div.className = 'dock-ship';
      div.dataset.index = index;
      div.innerHTML = `
        <span class="dock-ship-name">${ship.name}</span>
        <div class="dock-ship-blocks">
          ${'<div class="dock-ship-block"></div>'.repeat(ship.size)}
        </div>
      `;
      div.addEventListener('click', () => onSelect(index));
      list.appendChild(div);
    });
  }

  function updateDockShip(index, placed, selected) {
    const list = document.getElementById('ship-list');
    const div = list.children[index];
    if (!div) return;
    div.classList.toggle('placed', placed);
    div.classList.toggle('selected', selected);
  }

  function showPreview(containerId, cells, valid) {
    cells.forEach(({ r, c }) => {
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
        const cell = getCell(containerId, r, c);
        cell.classList.add(valid ? 'preview' : 'preview-invalid');
      }
    });
  }

  function clearPreview(containerId) {
    const container = document.getElementById(containerId);
    Array.from(container.children).forEach(cell => {
      cell.classList.remove('preview', 'preview-invalid');
    });
  }

  function setCellClickable(containerId, clickable) {
    const container = document.getElementById(containerId);
    Array.from(container.children).forEach(cell => {
      cell.classList.toggle('clickable', clickable);
    });
  }

  function animateCell(containerId, r, c, type) {
    const cell = getCell(containerId, r, c);
    cell.classList.add(type + '-anim');
    setTimeout(() => cell.classList.remove(type + '-anim'), 400);
  }

  function showGameOver(title, msg) {
    document.getElementById('game-over-title').textContent = title;
    document.getElementById('game-over-msg').textContent = msg;
    document.getElementById('game-over-modal').classList.remove('hidden');
  }

  function hideGameOver() {
    document.getElementById('game-over-modal').classList.add('hidden');
  }

  function showDock() {
    document.getElementById('ship-dock').style.display = 'flex';
  }

  function hideDock() {
    document.getElementById('ship-dock').style.display = 'none';
  }

  return {
    buildLabels,
    buildBoard,
    getCell,
    renderBoard,
    setMessage,
    updateScores,
    buildShipDock,
    updateDockShip,
    showPreview,
    clearPreview,
    setCellClickable,
    animateCell,
    showGameOver,
    hideGameOver,
    showDock,
    hideDock,
  };
})();
