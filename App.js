import React from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { UserProvider } from './UserContext';

import HomeScreen from './HomeScreen';
import LoginScreen from './LoginScreen';
import SignupScreen from './SignupScreen';
import RoomSelection from './components/RoomSelectionScreen';
import CreateRoom from './CreateRoom';
import JoinRoom from './components/JoinRoom';
import Board from './components/Board';

const Stack = createStackNavigator();

const App = () => {
  return (
    <UserProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignupScreen" component={SignupScreen} />
          <Stack.Screen name="RoomSelection" component={RoomSelection} />
          <Stack.Screen name="CreateRoom" component={CreateRoom} />
          <Stack.Screen name="JoinRoom" component={JoinRoom} />
          <Stack.Screen 
            name="Board" 
            component={Board}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#302e2b',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

const handleSquarePress = (row, col) => {
  if (!selectedPiece) {
    const piece = board[row][col];
    if (piece) {
      const isWhitePiece = isPieceWhite(piece);
      if (isWhitePiece === isWhiteTurn) {
        setSelectedPiece({ row, col });
      }
    }
  } else {
    const selectedPieceType = board[selectedPiece.row][selectedPiece.col];
    let isValidMove = false;

    // Validate movement based on piece type
    // (Your existing movement validation logic here)

    if (isValidMove) {
      const newBoard = [...board];
      newBoard[row][col] = board[selectedPiece.row][selectedPiece.col];
      newBoard[selectedPiece.row][selectedPiece.col] = null;

      // Check if the king is in check after the move
      const kingPosition = isWhiteTurn ? findKingPosition(newBoard, 'White') : findKingPosition(newBoard, 'Black');
      if (isInCheck(newBoard, kingPosition, isWhiteTurn)) {
        alert("Move not allowed: King would be in check!");
        return; // Prevent the move
      }

      setBoard(newBoard);
      setIsWhiteTurn(!isWhiteTurn);
    }
    setSelectedPiece(null);
  }

  console.log("Selected Piece:", selectedPiece);
  console.log("Attempting to move to:", row, col);
  console.log("Is Valid Move:", isValidMove);
};

// Function to find the king's position
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
