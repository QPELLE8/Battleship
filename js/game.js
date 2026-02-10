const BOARD_SIZE = 10;

const SHIPS = [
  { name: 'Carrier', size: 5 },
  { name: 'Battleship', size: 4 },
  { name: 'Cruiser', size: 3 },
  { name: 'Submarine', size: 3 },
  { name: 'Destroyer', size: 2 },
];

const CELL_EMPTY = 0;
const CELL_SHIP = 1;
const CELL_HIT = 2;
const CELL_MISS = 3;
const CELL_SUNK = 4;

function createBoard() {
  const grid = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    grid.push(new Array(BOARD_SIZE).fill(CELL_EMPTY));
  }
  return grid;
}

function createShipTracker() {
  return SHIPS.map(s => ({
    name: s.name,
    size: s.size,
    cells: [],
    hits: 0,
    sunk: false,
  }));
}

function getNeighbors(r, c) {
  const neighbors = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
        neighbors.push({ r: nr, c: nc });
      }
    }
  }
  return neighbors;
}

function canPlaceShip(board, row, col, size, horizontal) {
  const shipCells = [];
  for (let i = 0; i < size; i++) {
    const r = horizontal ? row : row + i;
    const c = horizontal ? col + i : col;
    if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return false;
    if (board[r][c] !== CELL_EMPTY) return false;
    shipCells.push({ r, c });
  }

  for (const cell of shipCells) {
    const neighbors = getNeighbors(cell.r, cell.c);
    for (const n of neighbors) {
      if (board[n.r][n.c] === CELL_SHIP) {
        const isPartOfSameShip = shipCells.some(sc => sc.r === n.r && sc.c === n.c);
        if (!isPartOfSameShip) return false;
      }
    }
  }

  return true;
}

function placeShip(board, shipTracker, shipIndex, row, col, horizontal) {
  const ship = shipTracker[shipIndex];
  if (!canPlaceShip(board, row, col, ship.size, horizontal)) return false;

  ship.cells = [];
  for (let i = 0; i < ship.size; i++) {
    const r = horizontal ? row : row + i;
    const c = horizontal ? col + i : col;
    board[r][c] = CELL_SHIP;
    ship.cells.push({ r, c });
  }
  return true;
}

function removeShip(board, shipTracker, shipIndex) {
  const ship = shipTracker[shipIndex];
  ship.cells.forEach(({ r, c }) => {
    board[r][c] = CELL_EMPTY;
  });
  ship.cells = [];
}

function markSurroundingCells(board, ship) {
  const marked = [];
  for (const cell of ship.cells) {
    const neighbors = getNeighbors(cell.r, cell.c);
    for (const n of neighbors) {
      if (board[n.r][n.c] === CELL_EMPTY || board[n.r][n.c] === CELL_SHIP) {
        board[n.r][n.c] = CELL_MISS;
        marked.push({ r: n.r, c: n.c });
      }
    }
  }
  return marked;
}

function fireAt(board, shipTracker, row, col) {
  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
    return { valid: false };
  }
  if (board[row][col] === CELL_HIT || board[row][col] === CELL_MISS || board[row][col] === CELL_SUNK) {
    return { valid: false };
  }

  if (board[row][col] === CELL_SHIP) {
    board[row][col] = CELL_HIT;
    const ship = shipTracker.find(s =>
      s.cells.some(c => c.r === row && c.c === col)
    );
    if (ship) {
      ship.hits++;
      if (ship.hits >= ship.size) {
        ship.sunk = true;
        ship.cells.forEach(({ r, c }) => {
          board[r][c] = CELL_SUNK;
        });
        const markedCells = markSurroundingCells(board, ship);
        return { valid: true, result: 'sunk', shipName: ship.name, sunkCells: ship.cells.slice(), markedCells };
      }
    }
    return { valid: true, result: 'hit' };
  }

  board[row][col] = CELL_MISS;
  return { valid: true, result: 'miss' };
}

function allShipsSunk(shipTracker) {
  return shipTracker.every(s => s.sunk);
}

function randomPlacement(board, shipTracker) {
  for (let i = 0; i < shipTracker.length; i++) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 1000) {
      const horizontal = Math.random() < 0.5;
      const row = Math.floor(Math.random() * BOARD_SIZE);
      const col = Math.floor(Math.random() * BOARD_SIZE);
      placed = placeShip(board, shipTracker, i, row, col, horizontal);
      attempts++;
    }
  }
}

function getShipCells(row, col, size, horizontal) {
  const cells = [];
  for (let i = 0; i < size; i++) {
    cells.push({
      r: horizontal ? row : row + i,
      c: horizontal ? col + i : col,
    });
  }
  return cells;
}
