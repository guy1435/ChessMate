import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { getFirestore, doc, setDoc } from 'firebase/firestore'; // Import Firestore functions
import { getAuth } from 'firebase/auth'; // Import Firebase Auth

const CreateRoom = ({ navigation }) => {
  const [roomId, setRoomId] = useState('');

  const handleCreate = async () => {
    const db = getFirestore();
    const auth = getAuth();
    const user = auth.currentUser;

    // Generate a unique room ID (you can customize this logic)
    const newRoomId = `room_${Date.now()}`; // Example: room_1634567890123

    // Create a new room document in Firestore with only the FEN field
    try {
      await setDoc(doc(db, 'rooms', newRoomId), {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // Valid initial FEN for a new game
        currentTurn: 'white', // Starting turn
        createdBy: user.email, // Store the creator's email
      });
      Alert.alert("Room Created", `Room ID: ${newRoomId}`);
      navigation.navigate('Board', { roomId: newRoomId }); // Navigate to the Board with the new room ID
    } catch (error) {
      Alert.alert("Error creating room:", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create a New Room</Text>
      <Button title="Create Room" onPress={handleCreate} />
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
});

export default CreateRoom;
