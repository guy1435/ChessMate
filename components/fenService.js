import { Chess } from 'chess.js';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

const db = getFirestore();
let chessGame = new Chess();

export const getCurrentFen = () => {
  const currentFen = chessGame.fen();
  console.log("Current FEN retrieved:", currentFen);
  return currentFen;
};

export const updateGameState = async (roomId) => {
  const newFen = chessGame.fen();
  const nextTurn = chessGame.turn() === 'w' ? 'white' : 'black';
  console.log("Updating game state with FEN:", newFen);

  try {
    await updateDoc(doc(db, 'rooms', roomId), {
      fen: newFen,
      currentTurn: nextTurn,
    });
    console.log("Firestore updated with new FEN and turn");
    return { success: true, newFen, nextTurn };
  } catch (error) {
    console.error("Error updating Firestore:", error);
    return { success: false, error: "Failed to update Firestore." };
  }
};

export const loadFen = (fen) => {
  console.log("Loading FEN:", fen);
  try {
    const success = chessGame.load(fen);
    if (!success) {
      console.error("Failed to load FEN:", fen);
      return false;
    }
    console.log("FEN loaded successfully");
    return true;
  } catch (error) {
    console.error("Error loading FEN:", error);
    return false;
  }
};

export const resetGame = () => {
  chessGame = new Chess();
  const initialFen = chessGame.fen();
  console.log("Game reset, initial FEN:", initialFen);
  return initialFen;
}; 