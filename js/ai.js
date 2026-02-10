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
      const adj = getAdjacentCells(target.r, target.c);
      adj.forEach(a => {
        if (!triedCells.has(key(a.r, a.c))) {
          targetQueue.push(a);
        }
      });
    } else if (result.result === 'sunk') {
      if (result.markedCells) {
        result.markedCells.forEach(mc => triedCells.add(key(mc.r, mc.c)));
      }

      hitStack = hitStack.filter(h => {
        const ship = shipTracker.find(s => s.name === result.shipName);
        return !ship.cells.some(c => c.r === h.r && c.c === h.c);
      });

      targetQueue = targetQueue.filter(t => {
        return !triedCells.has(key(t.r, t.c));
      });

      if (hitStack.length > 0) {
        mode = 'target';
        targetQueue = [];
        hitStack.forEach(h => {
          const adj = getAdjacentCells(h.r, h.c);
          adj.forEach(a => {
            if (!triedCells.has(key(a.r, a.c))) {
              targetQueue.push(a);
            }
          });
        });
      } else {
        mode = 'hunt';
        targetQueue = [];
      }
    }

    return { row: target.r, col: target.c, result: result.result, shipName: result.shipName, sunkCells: result.sunkCells, markedCells: result.markedCells };
  }

  return { reset, takeTurn };
})();
