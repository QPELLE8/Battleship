const AI = (() => {
  let mode = 'hunt';
  let targetQueue = [];
  let hitStack = [];
  let triedCells = new Set();

  function reset() {
    mode = 'hunt';
    targetQueue = [];
    hitStack = [];
    triedCells = new Set();
  }

  function key(r, c) {
    return r * BOARD_SIZE + c;
  }

  function inBounds(r, c) {
    return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
  }

  function getAdjacentCells(r, c) {
    return [
      { r: r - 1, c },
      { r: r + 1, c },
      { r, c: c - 1 },
      { r, c: c + 1 },
    ].filter(cell => inBounds(cell.r, cell.c));
  }

  function detectDirection(hits) {
    if (hits.length < 2) return null;
    const allSameRow = hits.every(h => h.r === hits[0].r);
    if (allSameRow) return 'horizontal';
    const allSameCol = hits.every(h => h.c === hits[0].c);
    if (allSameCol) return 'vertical';
    return null;
  }

  function buildDirectionalTargets(hits, direction) {
    const targets = [];
    if (direction === 'horizontal') {
      const row = hits[0].r;
      const cols = hits.map(h => h.c).sort((a, b) => a - b);
      const minCol = cols[0] - 1;
      const maxCol = cols[cols.length - 1] + 1;
      if (inBounds(row, minCol)) targets.push({ r: row, c: minCol });
      if (inBounds(row, maxCol)) targets.push({ r: row, c: maxCol });
    } else if (direction === 'vertical') {
      const col = hits[0].c;
      const rows = hits.map(h => h.r).sort((a, b) => a - b);
      const minRow = rows[0] - 1;
      const maxRow = rows[rows.length - 1] + 1;
      if (inBounds(minRow, col)) targets.push({ r: minRow, c: col });
      if (inBounds(maxRow, col)) targets.push({ r: maxRow, c: col });
    }
    return targets.filter(t => !triedCells.has(key(t.r, t.c)));
  }

  function rebuildTargetQueue(board) {
    targetQueue = [];
    const direction = detectDirection(hitStack);
    if (direction) {
      targetQueue = buildDirectionalTargets(hitStack, direction);
    } else {
      hitStack.forEach(h => {
        const adj = getAdjacentCells(h.r, h.c);
        adj.forEach(a => {
          if (!triedCells.has(key(a.r, a.c))) {
            const cellState = board[a.r][a.c];
            if (cellState !== CELL_HIT && cellState !== CELL_MISS && cellState !== CELL_SUNK) {
              targetQueue.push(a);
            }
          }
        });
      });
    }
  }

  function chooseTarget(board) {
    while (targetQueue.length > 0) {
      const target = targetQueue.shift();
      const k = key(target.r, target.c);
      if (!triedCells.has(k) && inBounds(target.r, target.c)) {
        const cellState = board[target.r][target.c];
        if (cellState !== CELL_HIT && cellState !== CELL_MISS && cellState !== CELL_SUNK) {
          return target;
        }
      }
    }

    mode = 'hunt';
    const candidates = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (!triedCells.has(key(r, c))) {
          const cellState = board[r][c];
          if (cellState !== CELL_HIT && cellState !== CELL_MISS && cellState !== CELL_SUNK) {
            if ((r + c) % 2 === 0) {
              candidates.push({ r, c });
            }
          }
        }
      }
    }

    if (candidates.length === 0) {
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (!triedCells.has(key(r, c))) {
            const cellState = board[r][c];
            if (cellState !== CELL_HIT && cellState !== CELL_MISS && cellState !== CELL_SUNK) {
              candidates.push({ r, c });
            }
          }
        }
      }
    }

    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  function takeTurn(board, shipTracker) {
    const target = chooseTarget(board);
    if (!target) return null;

    triedCells.add(key(target.r, target.c));
    const result = fireAt(board, shipTracker, target.r, target.c);

    if (result.result === 'hit') {
      mode = 'target';
      hitStack.push(target);
      rebuildTargetQueue(board);
    } else if (result.result === 'sunk') {
      if (result.markedCells) {
        result.markedCells.forEach(mc => triedCells.add(key(mc.r, mc.c)));
      }

      hitStack = hitStack.filter(h => {
        const ship = shipTracker.find(s => s.name === result.shipName);
        return !ship.cells.some(c => c.r === h.r && c.c === h.c);
      });

      if (hitStack.length > 0) {
        mode = 'target';
        rebuildTargetQueue(board);
      } else {
        mode = 'hunt';
        targetQueue = [];
      }
    } else if (result.result === 'miss' && mode === 'target') {
      rebuildTargetQueue(board);
    }

    return { row: target.r, col: target.c, result: result.result, shipName: result.shipName, sunkCells: result.sunkCells, markedCells: result.markedCells };
  }

  return { reset, takeTurn };
})();
