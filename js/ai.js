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

  function isUntried(r, c, board) {
    if (!inBounds(r, c)) return false;
    if (triedCells.has(key(r, c))) return false;
    const state = board[r][c];
    return state !== CELL_HIT && state !== CELL_MISS && state !== CELL_SUNK;
  }

  function findBestContiguousLine(hits) {
    if (hits.length < 2) return null;

    let bestLine = null;
    let bestLen = 1;

    const byCol = {};
    hits.forEach(h => {
      if (!byCol[h.c]) byCol[h.c] = [];
      byCol[h.c].push(h.r);
    });

    for (const col in byCol) {
      const rows = byCol[col].sort((a, b) => a - b);
      let start = 0;
      for (let i = 1; i <= rows.length; i++) {
        if (i === rows.length || rows[i] !== rows[i - 1] + 1) {
          const len = i - start;
          if (len > bestLen) {
            bestLen = len;
            bestLine = {
              direction: 'vertical',
              cells: rows.slice(start, i).map(r => ({ r, c: parseInt(col) })),
            };
          }
          start = i;
        }
      }
    }

    const byRow = {};
    hits.forEach(h => {
      if (!byRow[h.r]) byRow[h.r] = [];
      byRow[h.r].push(h.c);
    });

    for (const row in byRow) {
      const cols = byRow[row].sort((a, b) => a - b);
      let start = 0;
      for (let i = 1; i <= cols.length; i++) {
        if (i === cols.length || cols[i] !== cols[i - 1] + 1) {
          const len = i - start;
          if (len > bestLen) {
            bestLen = len;
            bestLine = {
              direction: 'horizontal',
              cells: cols.slice(start, i).map(c => ({ r: parseInt(row), c })),
            };
          }
          start = i;
        }
      }
    }

    return bestLine;
  }

  function rebuildTargetQueue(board) {
    targetQueue = [];

    const line = findBestContiguousLine(hitStack);

    if (line) {
      if (line.direction === 'vertical') {
        const col = line.cells[0].c;
        const rows = line.cells.map(c => c.r).sort((a, b) => a - b);
        const above = { r: rows[0] - 1, c: col };
        const below = { r: rows[rows.length - 1] + 1, c: col };
        if (isUntried(above.r, above.c, board)) targetQueue.push(above);
        if (isUntried(below.r, below.c, board)) targetQueue.push(below);
      } else {
        const row = line.cells[0].r;
        const cols = line.cells.map(c => c.c).sort((a, b) => a - b);
        const left = { r: row, c: cols[0] - 1 };
        const right = { r: row, c: cols[cols.length - 1] + 1 };
        if (isUntried(left.r, left.c, board)) targetQueue.push(left);
        if (isUntried(right.r, right.c, board)) targetQueue.push(right);
      }
    }

    if (targetQueue.length === 0 && hitStack.length > 0) {
      const seen = new Set();
      hitStack.forEach(h => {
        getAdjacentCells(h.r, h.c).forEach(a => {
          const k = key(a.r, a.c);
          if (!seen.has(k) && isUntried(a.r, a.c, board)) {
            seen.add(k);
            targetQueue.push(a);
          }
        });
      });
    }
  }

  function chooseTarget(board) {
    while (targetQueue.length > 0) {
      const target = targetQueue.shift();
      if (isUntried(target.r, target.c, board)) {
        return target;
      }
    }

    if (hitStack.length > 0) {
      rebuildTargetQueue(board);
      while (targetQueue.length > 0) {
        const target = targetQueue.shift();
        if (isUntried(target.r, target.c, board)) {
          return target;
        }
      }
    }

    mode = 'hunt';
    const candidates = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (isUntried(r, c, board)) {
          if ((r + c) % 2 === 0) {
            candidates.push({ r, c });
          }
        }
      }
    }

    if (candidates.length === 0) {
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (isUntried(r, c, board)) {
            candidates.push({ r, c });
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
    } else if (hitStack.length > 0) {
      rebuildTargetQueue(board);
    }

    return { row: target.r, col: target.c, result: result.result, shipName: result.shipName, sunkCells: result.sunkCells, markedCells: result.markedCells };
  }

  return { reset, takeTurn };
})();
