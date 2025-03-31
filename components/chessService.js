import { Chess } from 'chess.js'; // Import chess.js
import { getFirestore, doc, updateDoc } from 'firebase/firestore'; // Import Firestore functions

const db = getFirestore(); // Initialize Firestore
let chessGame = new Chess(); // Changed to let since we might need to reinitialize it

// Convert board coordinates to algebraic notation
const toAlgebraic = (row, col) => {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
  return files[col] + ranks[row];
};

// Convert FEN to board representation
const fenToBoard = (fen) => {
  const board = Array(8).fill().map(() => Array(8).fill(null));
  const [position] = fen.split(' ');
  const rows = position.split('/');
  
  rows.forEach((row, rowIndex) => {
    let colIndex = 0;
    for (let char of row) {
      if (isNaN(char)) {
        const color = char === char.toUpperCase() ? 'white' : 'black';
        const piece = char.toLowerCase();
        board[rowIndex][colIndex] = {
          type: getPieceType(piece),
          color: color
        };
        colIndex++;
      } else {
        colIndex += parseInt(char);
      }
    }
  });
  
  return board;
};

// Convert piece character to piece type
const getPieceType = (char) => {
  const pieceTypes = {
    'p': 'Pawn',
    'r': 'Rook',
    'n': 'Knight',
    'b': 'Bishop',
    'q': 'Queen',
    'k': 'King'
  };
  return pieceTypes[char];
};

// Generate FEN from current board position
const generateFENfromPosition = (board, currentTurn) => {
  let fen = '';
  let emptySquares = 0;

  // Process each row
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece) {
        emptySquares++;
      } else {
        if (emptySquares > 0) {
          fen += emptySquares;
          emptySquares = 0;
        }
        const pieceSymbol = getPieceSymbol(piece.type, piece.color);
        fen += pieceSymbol;
      }
    }
    if (emptySquares > 0) {
      fen += emptySquares;
      emptySquares = 0;
    }
    if (row < 7) fen += '/';
  }

  // Add turn and other FEN components
  fen += ` ${currentTurn === 'white' ? 'w' : 'b'} KQkq - 0 1`;
  return fen;
};

// Get piece symbol for FEN notation
const getPieceSymbol = (type, color) => {
  const symbols = {
    Pawn: 'p',
    Rook: 'r',
    Knight: 'n',
    Bishop: 'b',
    Queen: 'q',
    King: 'k'
  };
  const symbol = symbols[type];
  return color === 'white' ? symbol.toUpperCase() : symbol;
};

export const makeMove = (move, board, currentTurn) => {
  try {
    const fromSquare = toAlgebraic(move.from.row || move.from, move.from.col || move.from);
    const toSquare = toAlgebraic(move.to.row || move.to, move.to.col || move.to);
    
    console.log(`Making move from ${fromSquare} to ${toSquare}`);
    
    // Make the move in chess.js instance
    const moveResult = chessGame.move({
      from: fromSquare,
      to: toSquare,
      promotion: 'q'
    });

    if (moveResult) {
      // Update the board state
      const newBoard = JSON.parse(JSON.stringify(board));
      const piece = newBoard[move.from.row][move.from.col];
      newBoard[move.from.row][move.from.col] = null;
      newBoard[move.to.row][move.to.col] = piece;

      // Get the new FEN from chess.js
      const newFen = chessGame.fen();
      const nextTurn = currentTurn === 'white' ? 'black' : 'white';

      console.log("Move made successfully");
      console.log("Previous FEN:", chessGame.fen());
      console.log("New FEN:", newFen);
      console.log("Next turn:", nextTurn);

      return {
        success: true,
        fen: newFen,
        board: newBoard,
        turn: nextTurn
      };
    }
    
    console.log("Move was invalid according to chess.js");
    return { success: false, error: "Invalid move" };
  } catch (error) {
    console.error("Error making move:", error);
    return { success: false, error: error.message };
  }
};

// Helper function to convert numeric coordinates to algebraic notation
function convertToAlgebraic(coord) {
  if (typeof coord === 'string') return coord; // Already in algebraic notation
  
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
  
  // If coord is an object with row and col properties
  if (typeof coord === 'object' && 'row' in coord && 'col' in coord) {
    return files[coord.col] + ranks[coord.row];
  }
  
  // If coord is an array [row, col]
  if (Array.isArray(coord)) {
    return files[coord[1]] + ranks[coord[0]];
  }
  
  console.error("Invalid coordinate format:", coord);
  return null;
}

export const updateGameState = async (roomId, moveResult) => {
  if (!moveResult || !moveResult.success) return false;

  try {
    const nextTurn = chessGame.turn() === 'w' ? 'white' : 'black';
    
    await updateDoc(doc(db, 'rooms', roomId), {
      fen: moveResult.fen,
      currentTurn: nextTurn,
      lastUpdate: new Date().toISOString()
    });

    return true;
  } catch (error) {
    console.error("Error updating game state:", error);
    return false;
  }
};

// export const TestgenerateFEN = ({newBoard}) => {
//   return newBoard.fen();  // Simply return the FEN from chess.js
// };
export const generateFEN = () => {
  return chessGame.fen();  // Simply return the FEN from chess.js
};

export const getCurrentFen = () => {
  return chessGame.fen();
};

export const getCurrentBoard = () => {
  return fenToBoard(chessGame.fen());
};

export const loadFen = (fen) => {
  try {
    const isValid = chessGame.load(fen);
    if (isValid) {
      console.log("FEN loaded successfully:", fen);
      return true;
    }
    console.error("Invalid FEN string:", fen);
    return false;
  } catch (error) {
    console.error("Error loading FEN:", error);
    return false;
  }
};

export const learnAndGenerateFen = (moves) => {
  chessGame.reset();
  moves.forEach(move => {
    const result = chessGame.move(move);
    if (!result) {
      console.error("Invalid move in sequence:", move);
    }
  });
  return chessGame.fen();
};

// Helper function to validate moves
export const isValidMove = (from, to) => {
  try {
    const fromSquare = toAlgebraic(from.row || from, from.col || from);
    const toSquare = toAlgebraic(to.row || to, to.col || to);
    
    const moves = chessGame.moves({ verbose: true });
    return moves.some(move => move.from === fromSquare && move.to === toSquare);
  } catch (error) {
    console.error("Error validating move:", error);
    return false;
  }
};

export const getPossibleMoves = (square) => {
  return chessGame.moves({
    square: square,
    verbose: true
  });
};

export const getGameStatus = () => {
  if (chessGame.isCheckmate()) return 'checkmate';
  if (chessGame.isDraw()) return 'draw';
  if (chessGame.isStalemate()) return 'stalemate';
  if (chessGame.isThreefoldRepetition()) return 'repetition';
  if (chessGame.isInsufficientMaterial()) return 'insufficient';
  if (chessGame.isCheck()) return 'check';
  return 'active';
};

export const resetGame = () => {
  chessGame = new Chess();
  return chessGame.fen();
};

export const isValidFen = (fen) => {
  try {
    const tempGame = new Chess();
    return tempGame.load(fen);
  } catch (error) {
    return false;
  }
};

function updateFEN() {
    // Logic to generate FEN from the current board state
    let newFEN = generateFEN();
    
    // Update the FEN in the state
    chessGame.fen(newFEN);

    // Update Firestore
    updateFirestoreFEN(newFEN);
}

// Add this new function to help with debugging
export const getCurrentGameState = () => {
  return {
    fen: chessGame.fen(),
    turn: chessGame.turn(),
    moves: chessGame.moves({ verbose: true })
  };
}; 