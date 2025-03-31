export const isKingInCheck = (board, kingPosition, isWhiteTurn) => {
  const opponentColor = isWhiteTurn ? 'Black' : 'White';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && isPieceWhite(piece) !== isWhiteTurn) {
        if (canPieceAttack(board, piece, { row, col }, kingPosition)) {
          return true; // King is in check
        }
      }
    }
  }
  return false; // King is not in check
};

export const canBlockCheck = (board, kingPosition, isWhiteTurn) => {
  const opponentColor = isWhiteTurn ? 'Black' : 'White';
  const kingRow = kingPosition.row;
  const kingCol = kingPosition.col;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && isPieceWhite(piece) !== isWhiteTurn) {
        if (canPieceAttack(board, piece, { row, col }, kingPosition)) {
          for (let blockRow = 0; blockRow < 8; blockRow++) {
            for (let blockCol = 0; blockCol < 8; blockCol++) {
              const blockingPiece = board[blockRow][blockCol];
              if (blockingPiece && isPieceWhite(blockingPiece) === isWhiteTurn) {
                if (canBlockWithPiece(board, blockingPiece, { blockRow, blockCol }, { row, col }, kingPosition)) {
                  return true; // There is a valid block
                }
              }
            }
          }
        }
      }
    }
  }
  return false; // No valid blocks found
};

export const canBlockWithPiece = (board, blockingPiece, blockingPosition, attackingPosition, kingPosition) => {
  const { row: blockRow, col: blockCol } = blockingPosition;
  const { row: attackRow, col: attackCol } = attackingPosition;

  if (blockingPiece.includes('Rook') || blockingPiece.includes('Queen')) {
    if (blockRow === attackRow || blockCol === attackCol) {
      return isPathClear(board, blockingPosition, attackingPosition);
    }
  }

  if (blockingPiece.includes('Bishop') || blockingPiece.includes('Queen')) {
    if (Math.abs(blockRow - attackRow) === Math.abs(blockCol - attackCol)) {
      return isPathClear(board, blockingPosition, attackingPosition);
    }
  }

  return false; // Default case, cannot block
};

const isPathClear = (board, startPosition, endPosition) => {
  const { row: startRow, col: startCol } = startPosition;
  const { row: endRow, col: endCol } = endPosition;

  const rowStep = endRow > startRow ? 1 : endRow < startRow ? -1 : 0;
  const colStep = endCol > startCol ? 1 : endCol < startCol ? -1 : 0;

  let currentRow = startRow + rowStep;
  let currentCol = startCol + colStep;

  while (currentRow !== endRow || currentCol !== endCol) {
    if (board[currentRow][currentCol] !== null) {
      return false; // Path is blocked
    }
    currentRow += rowStep;
    currentCol += colStep;
  }
  return true; // Path is clear
};