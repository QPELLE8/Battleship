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

  function detectAxis(hits) {
    if (hits.length < 2) return null;

    const byCol = {};
    hits.forEach(h => {
      if (!byCol[h.c]) byCol[h.c] = [];
      byCol[h.c].push(h.r);
    });
    let bestCol = null;
    let bestColCount = 0;
    for (const col in byCol) {
      if (byCol[col].length > bestColCount) {
        bestColCount = byCol[col].length;
        bestCol = parseInt(col);
      }
    }

    const byRow = {};
    hits.forEach(h => {
      if (!byRow[h.r]) byRow[h.r] = [];
      byRow[h.r].push(h.c);
    });
    let bestRow = null;
    let bestRowCount = 0;
    for (const row in byRow) {
      if (byRow[row].length > bestRowCount) {
        bestRowCount = byRow[row].length;
        bestRow = parseInt(row);
      }
    }

    if (bestColCount >= 2 && bestColCount >= bestRowCount) {
      return {
        direction: 'vertical',
        col: bestCol,
        rows: byCol[bestCol].sort((a, b) => a - b),
      };
    }
    if (bestRowCount >= 2) {
      return {
        direction: 'horizontal',
        row: bestRow,
        cols: byRow[bestRow].sort((a, b) => a - b),
      };
    }
    return null;
  }

  function rebuildTargetQueue(board) {
    targetQueue = [];

    const axis = detectAxis(hitStack);

    if (axis) {
      if (axis.direction === 'vertical') {
        const col = axis.col;
        const minRow = axis.rows[0];
        const maxRow = axis.rows[axis.rows.length - 1];

        for (let r = minRow - 1; r >= 0; r--) {
          if (isUntried(r, col, board)) { targetQueue.push({ r, c: col }); break; }
          const st = board[r][col];
          if (st === CELL_MISS || st === CELL_SUNK) break;
        }
        for (let r = maxRow + 1; r < BOARD_SIZE; r++) {
          if (isUntried(r, col, board)) { targetQueue.push({ r, c: col }); break; }
          const st = board[r][col];
          if (st === CELL_MISS || st === CELL_SUNK) break;
        }
        for (let r = minRow + 1; r < maxRow; r++) {
          if (isUntried(r, col, board)) targetQueue.push({ r, c: col });
        }
      } else {
        const row = axis.row;
        const minCol = axis.cols[0];
        const maxCol = axis.cols[axis.cols.length - 1];

        for (let c = minCol - 1; c >= 0; c--) {
          if (isUntried(row, c, board)) { targetQueue.push({ r: row, c }); break; }
          const st = board[row][c];
          if (st === CELL_MISS || st === CELL_SUNK) break;
        }
        for (let c = maxCol + 1; c < BOARD_SIZE; c++) {
          if (isUntried(row, c, board)) { targetQueue.push({ r: row, c }); break; }
          const st = board[row][c];
          if (st === CELL_MISS || st === CELL_SUNK) break;
        }
        for (let c = minCol + 1; c < maxCol; c++) {
          if (isUntried(row, c, board)) targetQueue.push({ r: row, c });
        }
      }

      if (targetQueue.length === 0) {
        const axisKeys = new Set();
        if (axis.direction === 'vertical') {
          axis.rows.forEach(r => axisKeys.add(key(r, axis.col)));
        } else {
          axis.cols.forEach(c => axisKeys.add(key(axis.row, c)));
        }
        const otherHits = hitStack.filter(h => !axisKeys.has(key(h.r, h.c)));
        if (otherHits.length > 0) {
          const seen = new Set();
          otherHits.forEach(h => {
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
      return;
    }

    if (hitStack.length > 0) {
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
