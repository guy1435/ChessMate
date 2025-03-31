import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Button } from 'react-native';
import Square from './Square';
import Piece from './Piece';
import { isValidRookMove, isValidBishopMove, isValidQueenMove, isValidKnightMove, isValidPawnMove, isValidKingMove, isPieceWhite } from '../utils/moveValidation';
import { isRookAttacking } from '../utils/checkLogic';
import { Chess } from 'chess.js';
import { getFirestore, doc, onSnapshot, updateDoc, collection, query, where, getDocs, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Chessboard } from 'react-chessboard';
import { makeMove, updateGameState, loadFen, getCurrentFen, learnAndGenerateFen, generateFEN, TestgenerateFEN } from './chessService';
import { updateRoomFields } from '../updateRoom';

function boardToFEN(board) {
  const pieceMap = {
      'RookWhite': 'R',
      'KnightWhite': 'N',
      'BishopWhite': 'B',
      'QueenWhite': 'Q',
      'KingWhite': 'K',
      'PawnWhite': 'P',
      'RookBlack': 'r',
      'KnightBlack': 'n',
      'BishopBlack': 'b',
      'QueenBlack': 'q',
      'KingBlack': 'k',
      'PawnBlack': 'p'
  };

  let fen = '';
  for (let row of board) {
      let emptyCount = 0;
      for (let square of row) {
          if (square === null) {
              emptyCount++;
          } else {
              if (emptyCount > 0) {
                  fen += emptyCount;
                  emptyCount = 0;
              }
              fen += pieceMap[square] || ''; // Convert full name to FEN character
          }
      }
      if (emptyCount > 0) {
          fen += emptyCount;
      }
      fen += '/';
  }
  fen = fen.slice(0, -1); // Remove the trailing slash

  // Add additional FEN components (assuming default values for simplicity)
  const activeColor = 'w'; // 'w' or 'b'
  const castlingAvailability = 'KQkq'; // Example: 'KQkq' or '-'
  const enPassantTarget = '-'; // Example: 'e3' o r '-'
  const halfmoveClock = '0'; // Number of halfmoves since last capture or pawn move
  const fullmoveNumber = '1'; // The number of the full move

  fen += ` ${activeColor} ${castlingAvailability} ${enPassantTarget} ${halfmoveClock} ${fullmoveNumber}`;

  return fen;
}

// Add FENToBoard function to convert FEN string back to board array
function FENToBoard(fenString) {
  // Extract just the board position part of the FEN (before the first space)
  const boardPart = fenString.split(' ')[0];
  const rows = boardPart.split('/');
  
  const pieceMap = {
    'R': 'RookWhite',
    'N': 'KnightWhite',
    'B': 'BishopWhite',
    'Q': 'QueenWhite',
    'K': 'KingWhite',
    'P': 'PawnWhite',
    'r': 'RookBlack',
    'n': 'KnightBlack',
    'b': 'BishopBlack',
    'q': 'QueenBlack',
    'k': 'KingBlack',
    'p': 'PawnBlack'
  };
  
  const newBoard = [];
  
  for (let i = 0; i < 8; i++) {
    const row = [];
    let colIndex = 0;
    
    for (let j = 0; j < rows[i].length; j++) {
      const char = rows[i][j];
      
      if (isNaN(char)) {
        // It's a piece
        row.push(pieceMap[char]);
        colIndex++;
      } else {
        // It's a number (empty squares)
        const emptyCount = parseInt(char);
        for (let k = 0; k < emptyCount; k++) {
          row.push(null);
          colIndex++;
        }
      }
    }
    
    newBoard.push(row);
  }
  
  return newBoard;
}

const Board = ({ route, userEmail }) => {
  const { roomId } = route.params;
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [isWhiteTurn, setIsWhiteTurn] = useState(true);
  const [board, setBoard] = useState([
    ['RookBlack', 'KnightBlack', 'BishopBlack', 'QueenBlack', 'KingBlack', 'BishopBlack', 'KnightBlack', 'RookBlack'],
    ['PawnBlack', 'PawnBlack', 'PawnBlack', 'PawnBlack', 'PawnBlack', 'PawnBlack', 'PawnBlack', 'PawnBlack'],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ['PawnWhite', 'PawnWhite', 'PawnWhite', 'PawnWhite', 'PawnWhite', 'PawnWhite', 'PawnWhite', 'PawnWhite'],
    ['RookWhite', 'KnightWhite', 'BishopWhite', 'QueenWhite', 'KingWhite', 'BishopWhite', 'KnightWhite', 'RookWhite'],
  ]);
  const [chess, setChess] = useState(new Chess());
  let [fen, setFen] = useState(getCurrentFen());
  const [currentTurn, setCurrentTurn] = useState('white');
  const db = getFirestore();
  const auth = getAuth();
  const [moveHistory, setMoveHistory] = useState([]);
  const [playerColor, setPlayerColor] = useState(null); // Track player's color
  const [roomIsFull, setRoomIsFull] = useState(false); // Track if room is full

  useEffect(() => {
    const fetchRoomId = async () => {
      const roomsRef = collection(db, 'rooms');
      const q = query(roomsRef, where('IsClear', '==', true));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const firstRoom = querySnapshot.docs[0];
        console.log(firstRoom);
        setFen(firstRoom.data().fen);
        chess.load(firstRoom.data().fen);
        setCurrentTurn(firstRoom.data().currentTurn);
      } else {
        console.log("No available rooms found.");
      }
    };

    fetchRoomId();
  }, [db]);

  // Handle joining room and player assignment
  useEffect(() => {
    const joinRoom = async () => {
      const roomRef = doc(db, 'rooms', roomId);
      const roomDoc = await getDoc(roomRef);

      if (!roomDoc.exists()) {
        Alert.alert("Error", "Room does not exist");
        return;
      }

      const roomData = roomDoc.data();

      // Check if the user is already assigned as a player
      if (roomData.whitePlayer === userEmail) {
        setPlayerColor('white');
        return;
      } else if (roomData.blackPlayer === userEmail) {
        setPlayerColor('black');
        return;
      }

      // Assign player color based on room occupancy
      let updates = {};
      if (!roomData.whitePlayer) {
        // First player joins - assign white
        updates = {
          IsEmpty: false, // Room is no longer empty
          whitePlayer: userEmail, // Assign the user as the white player
        };
        setPlayerColor('white');
      } else if (!roomData.blackPlayer) {
        // Second player joins - assign black
        updates = {
          IsFull: true, // Room is now full
          blackPlayer: userEmail, // Assign the user as the black player
        };
        setPlayerColor('white');
      }

      // Update the room in Firestore
      await updateDoc(roomRef, updates);
    };

    joinRoom();
  }, [roomId, userEmail, db]);

  // Listen for room updates
  useEffect(() => {
    if (roomId) {
      const gameRef = doc(db, 'rooms', roomId);

      const unsubscribe = onSnapshot(gameRef, (doc) => {
        const data = doc.data();
        if (data) {
          console.log("Firestore data received:", data);
          setFen(data.fen);
          chess.load(data.fen);
          setCurrentTurn(data.currentTurn);
          
          // Update room status
          setRoomIsFull(!!(data.whitePlayer && data.blackPlayer));
          
          // Update player color if needed
          if (data.whitePlayer === userEmail) {
            setPlayerColor('white');
          } else if (data.blackPlayer === userEmail) {
            setPlayerColor('black');
          }
          
          // Update the board based on the new FEN
          const newBoard = FENToBoard(data.fen);
          setBoard(newBoard);
          
          // Update isWhiteTurn based on currentTurn
          setIsWhiteTurn(data.currentTurn === 'white');
          
          if (!loadFen(data.fen)) {
            console.error("Failed to load FEN from Firestore");
          }
        }
      });

      return () => unsubscribe();
    }
  }, [db, roomId, userEmail]);

  const findKingPosition = (board, color) => {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (board[row][col] === `King${color}`) {
          return { row, col };
        }
      }
    }
    return null; // King not found (should not happen)
  };

  const updateFirestore = async (newFen, nextTurn) => {
    try {
      await updateDoc(doc(db, 'rooms', roomId), {
        fen: newFen,
        currentTurn: nextTurn,
      });
    } catch (error) {
      console.error("Error updating Firestore:", error);
    }
  };

  const handleSquarePress = (row, col) => {
    // Only allow moves if it's the player's turn
    if (playerColor && playerColor !== currentTurn) {
      console.log("Not your turn");
      Alert.alert("Not Your Turn", `It's ${currentTurn}'s turn to move.`);
      return;
    }
    
    console.log("Selected Piece:", selectedPiece);
    console.log("Attempting to move to:", row, col);

    const currentKingPosition = isWhiteTurn ? findKingPosition(board, 'White') : findKingPosition(board, 'Black');
    const kingInCheck = isKingInCheck(board, currentKingPosition, isWhiteTurn);

    if (kingInCheck && !selectedPiece) {
      alert("You won");
      return; // Prevent any selection if the king is in check
    }

    if (!selectedPiece) {
      // Selecting a piece
      const piece = board[row][col];
      if (piece) {
        const isWhitePiece = isPieceWhite(piece);
        
        // Only allow selecting pieces of your color
        if ((playerColor === 'white' && !isWhitePiece) || (playerColor === 'black' && isWhitePiece)) {
          console.log("Cannot select opponent's piece");
          Alert.alert("Invalid Selection", "You can only move your own pieces.");
          return;
        }
        
        // Make sure it's the right turn
        if (isWhitePiece === isWhiteTurn) {
          setSelectedPiece({ row, col });
          console.log("Piece selected:", piece);
        } else {
          Alert.alert("Wrong Turn", `It's ${isWhiteTurn ? 'white' : 'black'}'s turn to move.`);
        }
      }
    } else {
      // Moving the selected piece
      const selectedPieceType = board[selectedPiece.row][selectedPiece.col];
      
      if (!selectedPieceType) {
        console.log("No piece selected or piece is null.");
        setSelectedPiece(null);
        return;
      }

      // Additional check to ensure player is moving their own color
      const isMovingWhitePiece = isPieceWhite(selectedPieceType);
      if ((playerColor === 'white' && !isMovingWhitePiece) || (playerColor === 'black' && isMovingWhitePiece)) {
        console.log("Attempting to move opponent's piece");
        Alert.alert("Invalid Move", "You can only move your own pieces.");
        setSelectedPiece(null);
        return;
      }

      let isValidMove = false;

      // Validate movement based on piece type
      if (selectedPieceType.includes('Rook')) {
        isValidMove = isValidRookMove(board, selectedPiece.row, selectedPiece.col, row, col);
      } else if (selectedPieceType.includes('Bishop')) {
        isValidMove = isValidBishopMove(board, selectedPiece.row, selectedPiece.col, row, col);
      } else if (selectedPieceType.includes('Queen')) {
        isValidMove = isValidQueenMove(board, selectedPiece.row, selectedPiece.col, row, col);
      } else if (selectedPieceType.includes('Knight')) {
        isValidMove = isValidKnightMove(board, selectedPiece.row, selectedPiece.col, row, col);
      } else if (selectedPieceType.includes('Pawn')) {
        isValidMove = isValidPawnMove(board, selectedPiece.row, selectedPiece.col, row, col);
      } else if (selectedPieceType.includes('King')) {
        isValidMove = isValidKingMove(board, selectedPiece.row, selectedPiece.col, row, col);
      }
                                                 
      console.log("Is Valid Move:", isValidMove);

      // If the move is valid, create a new board state
      if (isValidMove) {
        let newBoard = [...board];
        newBoard[row][col] = board[selectedPiece.row][selectedPiece.col];
        newBoard[selectedPiece.row][selectedPiece.col] = null;
        console.log("new board" , newBoard);
        let newFen = boardToFEN(newBoard);
        // setFen(newFen);
        // let [newFen, setFen] = useState(getCurrentFen());
        console.log(newFen);
        // Check if the king is in check after the move
        const kingPosition = isWhiteTurn ? findKingPosition(newBoard, 'White') : findKingPosition(newBoard, 'Black');
        if (isKingInCheck(newBoard, kingPosition, isWhiteTurn)) {
          alert("Move not allowed: King would be in check!");
          newBoard[selectedPiece.row][selectedPiece.col] = selectedPiece; // Move piece back
          newBoard[row][col] = null; // Clear the attempted move
          setSelectedPiece(null);

          setBoard(newBoard);
          return; // Prevent the move and do not switch turns
        }

        // If the king was in check, check if the move resolves the check
        if (kingInCheck && !selectedPiece) {
          const canBlockCheck = canBlockCheck(newBoard, currentKingPosition, isWhiteTurn);
          if (!canBlockCheck) {
            alert("Move not allowed: You must block the check or move the king!");
            setSelectedPiece(null);
              // Deselect the piece
            return; // Prevent the move and do not switch turns
          }
        }

        // Update the board and switch turns
        setBoard(newBoard);
        setIsWhiteTurn(!isWhiteTurn);
         console.log("Move successful!");
        fen = generateFEN();
        console.log(fen);
        // Generate new FEN and update Firestore
        
        const nextTurn = currentTurn === 'white' ? 'black' : 'white';
        updateFirestore(newFen, nextTurn);  // Call the async function
      } else {
        console.log("Invalid move attempted.");
      }
      // Deselect the piece
      setSelectedPiece(null);
    }
  };

  // Function to check if the king is in check
  const isKingInCheck = (board, kingPosition, isWhiteTurn) => {
    const opponentColor = isWhiteTurn ? 'Black' : 'White';
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && isPieceWhite(piece) !== isWhiteTurn) {
          // Check if the opponent's piece can attack the king
          if (canPieceAttack(board, piece, { row, col }, kingPosition)) {
            return true; // King is in check
          }
        }
      }
    }
    return false; // King is not in check
  };

  // Function to determine if a piece can attack the king
  const canPieceAttack = (board, piece, piecePosition, kingPosition) => {
    // Implement logic to check if the piece can move to the king's position
    // This will depend on the type of piece (Rook, Bishop, etc.)
    const { row: kingRow, col: kingCol } = kingPosition;
    const { row: pieceRow, col: pieceCol } = piecePosition;

    if (piece.includes('Rook')) {
      return isValidRookMove(board, pieceRow, pieceCol, kingRow, kingCol);
    } else if (piece.includes('Bishop')) {
      return isValidBishopMove(board, pieceRow, pieceCol, kingRow, kingCol);
    } else if (piece.includes('Queen')) {
      return isValidQueenMove(board, pieceRow, pieceCol, kingRow, kingCol);
    } else if (piece.includes('Knight')) {
      return isValidKnightMove(board, pieceRow, pieceCol, kingRow, kingCol);
    } else if (piece.includes('Pawn')) {
      // Check for pawn attack (diagonal capture)
      const direction = piece.includes('White') ? -1 : 1; // White pawns move up, Black pawns move down
      return (kingRow === pieceRow + direction && Math.abs(kingCol - pieceCol) === 1);
    } else if (piece.includes('King')) {
      // Kings cannot attack each other directly, but you can implement logic if needed
      return false;
    }
    return false; // Default case
  };

  const getSquareBackground = (isBlack, row, col) => {
    if (selectedPiece && selectedPiece.row === row && selectedPiece.col === col) {
      return '#f6f669';
    }
    return isBlack ? '#769656' : '#eeeed2';
  };

  const updateFen = () => {
    const newFen = getCurrentFen();
    setFen(newFen);
    console.log("Updated FEN:", newFen);
  };

  const handleMove = async (sourceSquare, targetSquare) => {
    const move = { from: sourceSquare, to: targetSquare };
    console.log("Handling move from:", sourceSquare, "to:", targetSquare);

    const moveResult = await makeMove(roomId, move);

    if (moveResult.success) {
      const updateResult = await updateGameState(roomId);
      if (updateResult.success) {
        setFen(updateResult.newFen);
        setCurrentTurn(updateResult.nextTurn);
        setMoveHistory(prev => [...prev, move]);
        console.log("Current FEN after move:", updateResult.newFen);
      } else {
        Alert.alert("Error", updateResult.error);
      }
    } else {
      Alert.alert("Error", moveResult.error);
    }
  };

  const testGenerateFEN = () => {
    const testFen = generateFEN(); // Call the generateFEN function
    console.log("Test FEN:", testFen); // Log the test FEN
  };

  // Call this function somewhere, e.g., in useEffect or a button press
  useEffect(() => {
    testGenerateFEN(); // Test the FEN generation on component mount
  }, []);

  const handleUpdateRoom = async () => {
    const success = await updateRoomFields(roomId);
    if (success) {
      Alert.alert("Success", "Room fields updated successfully");
    } else {
      Alert.alert("Error", "Failed to update room fields");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Hello, {userEmail}!</Text>
      <Text style={styles.roomDisplay}>Room ID: {roomId}</Text>
      <Text style={styles.fenDisplay}>Current FEN: {fen}</Text>
      <Text style={styles.turnDisplay}>Current Turn: {currentTurn}</Text>
      {playerColor && (
        <Text style={styles.playerColor}>You are playing as: {playerColor}</Text>
      )}
      {roomIsFull ? (
        <Text style={styles.roomStatus}>Room is full (2/2 players)</Text>
      ) : (
        <Text style={styles.roomStatus}>Waiting for opponent...</Text>
      )}
      <View style={styles.turnIndicator}>
        <View style={[styles.indicatorCircle, { backgroundColor: isWhiteTurn ? '#fff' : '#000' }]} />
        <Text style={styles.turnText}>{isWhiteTurn ? "White's Turn" : "Black's Turn"}</Text>
      </View>
      <View style={styles.boardContainer}>
        <View style={styles.columnLabels}>
          {[' A', '    B', '    C', '    D', '    E', '    F', '    G', '    H'].map((label) => (
            <View key={label} style={styles.labelContainer}>
              <Text style={styles.label}>{label}</Text>
            </View>
          ))}
        </View>
        <View style={styles.board}>
          {board.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              <Text style={styles.rowLabel}>{8 - rowIndex}</Text>
              {row.map((piece, colIndex) => (
                <Square
                  key={`${rowIndex}-${colIndex}`}
                  isBlack={(rowIndex + colIndex) % 2 === 0}
                  onPress={() => handleSquarePress(rowIndex, colIndex)}
                  backgroundColor={getSquareBackground((rowIndex + colIndex) % 2 === 0, rowIndex, colIndex)}
                >
                  <Piece piece={piece} />
                </Square>
              ))}
            </View>
          ))}
        </View>
      </View>
      <View style={styles.chessboardContainer}>
        <Chessboard
          position={fen}
          onPieceDrop={(sourceSquare, targetSquare) => {
            handleMove(sourceSquare, targetSquare);
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  fenDisplay: {
    fontSize: 14,
    marginBottom: 16,
  },
  turnDisplay: {
    fontSize: 14,
    marginBottom: 16,
  },
  turnIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#4a4a4a',
    borderRadius: 10,
  },
  indicatorCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#666',
  },
  turnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  boardContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  columnLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 400,
    marginBottom: 5,
  },
  labelContainer: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  board: {
    width: 400,
    height: 400,
    borderWidth: 2,
    borderColor: '#666',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  rowLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    alignSelf: 'center',
    marginRight: 5, 
  },
   
  generateButton: {
    marginTop: 20,
    color: 'blue',
    textDecorationLine: 'underline',
  },
  playerColor: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#4a4a4a',
  },
  roomStatus: {
    fontSize: 14,
    marginBottom: 16,
    fontStyle: 'italic',
    color: '#666',
  },
});

export default Board;