import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore';

const CreateRoom = ({ navigation, route }) => {
  const [creating, setCreating] = useState(false);
  const userEmail = route.params?.userEmail || 'Guest';

  const handleCreateRoom = async () => {
    if (creating) return; // Prevent multiple clicks
    
    try {
      setCreating(true);
      const db = getFirestore();
      const roomsRef = collection(db, 'rooms');
      
      const newRoomId = `room_${Date.now()}`; // Example: room_1634567890123
      
      await setDoc(doc(db, 'rooms', newRoomId), {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // Initial chess position
        currentTurn: 'white', // Starting turn
        createdBy: userEmail, // Store the creator's email
        IsEmpty: true, // Room starts with no players
        IsFull: false, // Room starts not full
        whitePlayer: null, // No white player assigned yet
        blackPlayer: null, // No black player assigned yet
        createdAt: new Date() // Current timestamp
      });
      
      console.log("New room created with ID:", newRoomId);
      console.log("Room data being written:", {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        currentTurn: 'white',
        createdBy: userEmail,
        IsEmpty: true,
        IsFull: false,
        whitePlayer: null,
        blackPlayer: null,
        createdAt: new Date()
      });
      
      // Navigate to the room or show success message
      Alert.alert(
        "Room Created",
        `Your room has been created successfully! Room ID: ${newRoomRef.id}`,
        [
          {
            text: "Join Room",
            onPress: () => navigation.navigate('Board', { 
              roomId: newRoomId,
              userEmail: userEmail
            })
          }
        ]
      );
    } catch (error) {
      console.error("Error creating room:", error);
      Alert.alert("Error", "Failed to create room: " + error.message);
    } finally {
      setCreating(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create a New Chess Room</Text>
      <Text style={styles.subtitle}>Logged in as: {userEmail}</Text>
      
      <View style={styles.buttonContainer}>
        <Button 
          title={creating ? "Creating..." : "Create New Room"} 
          onPress={handleCreateRoom}
          disabled={creating}
        />
      </View>
      
      <Text style={styles.instructions}>
        When you create a room, you'll automatically join as the white player.
        Share the room ID with your opponent so they can join as black.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    color: '#666',
  },
  buttonContainer: {
    width: '80%',
    marginVertical: 20,
  },
  instructions: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
  }
});

export default CreateRoom; 