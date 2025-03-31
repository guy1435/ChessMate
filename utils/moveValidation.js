export const isValidRookMove = (board, startRow, startCol, endRow, endCol) => {
    // Check if move is horizontal or vertical
    if (startRow !== endRow && startCol !== endCol) {
        return false;
    }

    // Check for pieces in the path
    if (startRow === endRow) {
        // Horizontal movement
        const step = startCol < endCol ? 1 : -1;
        for (let col = startCol + step; col !== endCol; col += step) {
            if (board[startRow][col] !== null) {
                return false; // Path is blocked
            }
        }
    } else {
        // Vertical movement
        const step = startRow < endRow ? 1 : -1;
        for (let row = startRow + step; row !== endRow; row += step) {
            if (board[row][startCol] !== null) {
                return false; // Path is blocked
            }
        }
    }

    // Check if destination has a piece of the same color
    const destinationPiece = board[endRow][endCol];
    if (destinationPiece) {
        const isDestinationWhite = isPieceWhite(destinationPiece);
        const isSourceWhite = isPieceWhite(board[startRow][startCol]);
        if (isDestinationWhite === isSourceWhite) {
            return false; // Can't capture own piece
        }
    }

    return true;
};

export const isValidBishopMove = (board, startRow, startCol, endRow, endCol) => {
    // Check if move is diagonal
    if (Math.abs(startRow - endRow) !== Math.abs(startCol - endCol)) {
        return false;
    }

    // Check for pieces in the path
    const rowStep = startRow < endRow ? 1 : -1;
    const colStep = startCol < endCol ? 1 : -1;
    let currentRow = startRow + rowStep;
    let currentCol = startCol + colStep;

    while (currentRow !== endRow && currentCol !== endCol) {
        if (board[currentRow][currentCol] !== null) {
            return false; // Path is blocked
        }
        currentRow += rowStep;
        currentCol += colStep;
    }

    // Check if destination has a piece of the same color
    const destinationPiece = board[endRow][endCol];
    if (destinationPiece) {
        const isDestinationWhite = isPieceWhite(destinationPiece);
        const isSourceWhite = isPieceWhite(board[startRow][startCol]);
        if (isDestinationWhite === isSourceWhite) {
            return false; // Can't capture own piece
        }
    }

    return true;
};

export const isValidQueenMove = (board, startRow, startCol, endRow, endCol) => {
    // Queen can move like a rook OR a bishop
    return isValidRookMove(board, startRow, startCol, endRow, endCol) || 
           isValidBishopMove(board, startRow, startCol, endRow, endCol);
};

export const isValidKnightMove = (board, startRow, startCol, endRow, endCol) => {
    // Calculate the absolute difference in rows and columns
    const rowDiff = Math.abs(endRow - startRow);
    const colDiff = Math.abs(endCol - startCol);

    // Knight moves in L-shape: 2 squares in one direction and 1 in the other
    const isValidL = (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);

    if (!isValidL) {
        return false;
    }

    // Check if destination square has a piece of the same color
    const destinationPiece = board[endRow][endCol];
    if (destinationPiece) {
        const isDestinationWhite = isPieceWhite(destinationPiece);
        const isSourceWhite = isPieceWhite(board[startRow][startCol]);
        if (isDestinationWhite === isSourceWhite) {
            return false; // Can't capture own piece
        }
    }

    return true;
};

export const isValidPawnMove = (board, startRow, startCol, endRow, endCol) => {
    const direction = board[startRow][startCol].includes('White') ? -1 : 1; // White moves up, Black moves down
    const startRowPawn = board[startRow][startCol].includes('White') ? 6 : 1; // Starting row for pawns

    // Normal move
    if (endCol === startCol && endRow === startRow + direction && board[endRow][endCol] === null) {
        return true;
    }

    // Double move from starting position
    if (endCol === startCol && endRow === startRow + 2 * direction && startRow === startRowPawn && board[endRow][endCol] === null && board[startRow + direction][startCol] === null) {
        return true;
    }

    // Capture move
    if (Math.abs(endCol - startCol) === 1 && endRow === startRow + direction && board[endRow][endCol] !== null) {
        return true;
    }

    return false; // Invalid move
};

export const isValidKingMove = (board, startRow, startCol, endRow, endCol) => {
    const rowDiff = Math.abs(endRow - startRow);
    const colDiff = Math.abs(endCol - startCol);

    // King can move one square in any direction
    if (rowDiff <= 1 && colDiff <= 1) {
        // Check if destination has a piece of the same color
        const destinationPiece = board[endRow][endCol];
        if (destinationPiece) {
            const isDestinationWhite = isPieceWhite(destinationPiece);
            const isSourceWhite = isPieceWhite(board[startRow][startCol]);
            if (isDestinationWhite === isSourceWhite) {
                return false; // Can't capture own piece
            }
        }
        return true;
    }
    return false;
};

export const isPieceWhite = (piece) => {
    return piece && piece.includes('White');
};
