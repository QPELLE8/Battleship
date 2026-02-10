(() => {
  let playerBoard, playerShips, enemyBoard, enemyShips;
  let phase = 'placement';
  let selectedShipIndex = 0;
  let horizontal = true;
  let placedFlags = [];
  let playerTurn = true;

  function init() {
    playerBoard = createBoard();
    playerShips = createShipTracker();
    enemyBoard = createBoard();
    enemyShips = createShipTracker();
    phase = 'placement';
    selectedShipIndex = 0;
    horizontal = true;
    placedFlags = new Array(SHIPS.length).fill(false);
    playerTurn = true;
    AI.reset();

    randomPlacement(enemyBoard, enemyShips);

    UI.hideGameOver();
    UI.buildLabels();
    UI.buildBoard('player-board', onPlayerBoardClick, onPlayerBoardEnter, onPlayerBoardLeave);
    UI.buildBoard('enemy-board', onEnemyBoardClick, null, null);
    UI.buildShipDock(SHIPS, onDockSelect);
    UI.showDock();
    UI.renderBoard('player-board', playerBoard, true);
    UI.renderBoard('enemy-board', enemyBoard, false);
    UI.setCellClickable('player-board', true);
    UI.setCellClickable('enemy-board', false);
    UI.setMessage('PLACE YOUR FLEET, COMMANDER. SELECT A SHIP AND CLICK THE GRID.');
    UI.updateScores(playerShips, enemyShips);
    updateDockDisplay();
    updateStartButton();
  }

  function onDockSelect(index) {
    if (phase !== 'placement') return;
    Sound.click();
    if (placedFlags[index]) {
      removeShip(playerBoard, playerShips, index);
      placedFlags[index] = false;
      UI.renderBoard('player-board', playerBoard, true);
    }
    selectedShipIndex = index;
    updateDockDisplay();
  }

  function updateDockDisplay() {
    SHIPS.forEach((_, i) => {
      UI.updateDockShip(i, placedFlags[i], i === selectedShipIndex);
    });
  }

  function updateStartButton() {
    const allPlaced = placedFlags.every(f => f);
    document.getElementById('start-btn').disabled = !allPlaced;
  }

  function onPlayerBoardEnter(r, c) {
    if (phase !== 'placement') return;
    if (placedFlags[selectedShipIndex]) return;
    const ship = SHIPS[selectedShipIndex];
    const cells = getShipCells(r, c, ship.size, horizontal);
    const valid = canPlaceShip(playerBoard, r, c, ship.size, horizontal);
    UI.showPreview('player-board', cells, valid);
  }

  function onPlayerBoardLeave() {
    if (phase !== 'placement') return;
    UI.clearPreview('player-board');
  }

  function onPlayerBoardClick(r, c) {
    if (phase !== 'placement') return;
    if (placedFlags[selectedShipIndex]) return;

    const success = placeShip(playerBoard, playerShips, selectedShipIndex, r, c, horizontal);
    if (!success) return;

    Sound.place();
    placedFlags[selectedShipIndex] = true;
    UI.clearPreview('player-board');
    UI.renderBoard('player-board', playerBoard, true);
    updateDockDisplay();
    updateStartButton();

    const nextUnplaced = placedFlags.findIndex(f => !f);
    if (nextUnplaced !== -1) {
      selectedShipIndex = nextUnplaced;
      updateDockDisplay();
      UI.setMessage(`PLACE YOUR ${SHIPS[nextUnplaced].name.toUpperCase()}.`);
    } else {
      UI.setMessage('ALL SHIPS PLACED. PRESS START BATTLE!');
    }
  }

  function startBattle() {
    if (!placedFlags.every(f => f)) return;
    phase = 'battle';
    UI.hideDock();
    UI.setCellClickable('player-board', false);
    UI.setCellClickable('enemy-board', true);
    UI.setMessage('BATTLE STATIONS! SELECT A TARGET ON THE ENEMY GRID.');
    Sound.click();
  }

  function onEnemyBoardClick(r, c) {
    if (phase !== 'battle' || !playerTurn) return;

    const result = fireAt(enemyBoard, enemyShips, r, c);
    if (!result.valid) return;

    playerTurn = false;
    UI.renderBoard('enemy-board', enemyBoard, false);
    UI.animateCell('enemy-board', r, c, result.result === 'miss' ? 'miss' : 'hit');
    UI.updateScores(playerShips, enemyShips);

    if (result.result === 'hit') {
      Sound.hit();
      UI.setMessage('DIRECT HIT!');
    } else if (result.result === 'sunk') {
      Sound.sunk();
      UI.setMessage(`YOU SUNK THEIR ${result.shipName.toUpperCase()}!`);
    } else {
      Sound.miss();
      UI.setMessage('MISS...');
    }

    if (allShipsSunk(enemyShips)) {
      phase = 'over';
      UI.setCellClickable('enemy-board', false);
      Sound.victory();
      setTimeout(() => {
        UI.showGameOver('VICTORY!', 'ALL ENEMY SHIPS DESTROYED. YOU WIN, COMMANDER!');
      }, 600);
      return;
    }

    setTimeout(aiTurn, 800);
  }

  function aiTurn() {
    const result = AI.takeTurn(playerBoard, playerShips);
    if (!result) return;

    UI.renderBoard('player-board', playerBoard, true);
    UI.animateCell('player-board', result.row, result.col, result.result === 'miss' ? 'miss' : 'hit');
    UI.updateScores(playerShips, enemyShips);

    if (result.result === 'hit') {
      Sound.hit();
      UI.setMessage('ENEMY HIT YOUR SHIP!');
    } else if (result.result === 'sunk') {
      Sound.sunk();
      UI.setMessage(`ENEMY SUNK YOUR ${result.shipName.toUpperCase()}!`);
    } else {
      Sound.miss();
      UI.setMessage('ENEMY MISSED. YOUR TURN, COMMANDER.');
    }

    if (allShipsSunk(playerShips)) {
      phase = 'over';
      UI.setCellClickable('enemy-board', false);
      Sound.defeat();
      setTimeout(() => {
        UI.showGameOver('DEFEAT', 'YOUR FLEET HAS BEEN DESTROYED. GAME OVER.');
      }, 600);
      return;
    }

    playerTurn = true;
  }

  function handleRotate() {
    if (phase !== 'placement') return;
    horizontal = !horizontal;
    Sound.click();
    UI.setMessage(horizontal ? 'ORIENTATION: HORIZONTAL' : 'ORIENTATION: VERTICAL');
  }

  function handleRandom() {
    if (phase !== 'placement') return;
    playerShips.forEach((_, i) => {
      if (placedFlags[i]) {
        removeShip(playerBoard, playerShips, i);
        placedFlags[i] = false;
      }
    });
    playerBoard = createBoard();
    playerShips = createShipTracker();
    randomPlacement(playerBoard, playerShips);
    placedFlags = new Array(SHIPS.length).fill(true);
    Sound.place();
    UI.renderBoard('player-board', playerBoard, true);
    updateDockDisplay();
    updateStartButton();
    UI.setMessage('RANDOM DEPLOYMENT COMPLETE. PRESS START BATTLE!');
  }

  function handleClear() {
    if (phase !== 'placement') return;
    playerShips.forEach((_, i) => {
      if (placedFlags[i]) {
        removeShip(playerBoard, playerShips, i);
        placedFlags[i] = false;
      }
    });
    selectedShipIndex = 0;
    UI.renderBoard('player-board', playerBoard, true);
    updateDockDisplay();
    updateStartButton();
    UI.setMessage('BOARD CLEARED. PLACE YOUR FLEET, COMMANDER.');
    Sound.click();
  }

  document.getElementById('rotate-btn').addEventListener('click', handleRotate);
  document.getElementById('random-btn').addEventListener('click', handleRandom);
  document.getElementById('clear-btn').addEventListener('click', handleClear);
  document.getElementById('start-btn').addEventListener('click', startBattle);
  document.getElementById('play-again-btn').addEventListener('click', init);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
      handleRotate();
    }
  });

  init();
})();
