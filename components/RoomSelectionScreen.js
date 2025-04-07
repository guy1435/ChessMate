import React, { useContext, useEffect } from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { app } from '../firebaseConfig';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { UserContext } from '../UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const db = getFirestore(app);

const RoomSelectionScreen = ({ navigation, route }) => {
  const { userEmail, setUserEmail } = useContext(UserContext);
  const { userEmail: routeUserEmail } = route.params;

  const generateRoomId = () => {
    return 'room_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  };

  const createRoom = async (userEmail) => {
    try {
      console.log("Creating room with email:", userEmail);
      const roomsRef = collection(db, 'rooms');
      
      const roomData = {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        currentTurn: 'white',
        createdBy: userEmail,
        IsEmpty: false,
        IsFull: false,
        whitePlayer: userEmail,
        blackPlayer: null,
        createdAt: new Date()
      };
      
      const newRoomRef = await addDoc(roomsRef, roomData);
      console.log("Room created successfully with ID:", newRoomRef.id);
      Alert.alert("Success", `Room created with ID: ${newRoomRef.id}`);
      return newRoomRef.id;
    } catch (error) {
      console.error("Error creating room:", error);
      Alert.alert("Error creating room", error.message);
      throw error;
    }
  };

  const handleCreateRoom = async () => {
    try {
      const roomId = await createRoom(userEmail);
      setUserEmail(userEmail);
      navigation.navigate('Board', { 
        roomId: roomId,
        userEmail: userEmail,
        isNewRoom: true
      });
    } catch (error) {
      Alert.alert("Error", "Failed to create room: " + error.message);
    }
  };

  const handleJoinRoom = () => {
    navigation.navigate('JoinRoom', { userEmail: userEmail });
  };

  useEffect(() => {
    const getUserEmail = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem('userEmail');
        if (storedEmail !== null) {
          // Use storedEmail here
        }
      } catch (error) {
        console.error('Error retrieving user email:', error);
      }
    };
    
    getUserEmail();
  }, []);

  useEffect(() => {
    if (route.params?.userEmail) {
      setUserEmail(route.params.userEmail);
    }
  }, [route.params?.userEmail, setUserEmail]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select an Option</Text>
      <TouchableOpacity
        style={styles.optionButton}
        onPress={handleCreateRoom}
      >
        <Text style={styles.optionButtonText}>Create a Room</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.optionButton}
        onPress={handleJoinRoom}
      >
        <Text style={styles.optionButtonText}>Join a Room</Text>
      </TouchableOpacity>
      
       
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
  optionButton: {
    padding: 16,
    backgroundColor: '#007bff',
    borderRadius: 8,
    marginBottom: 16,
  },
  optionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default RoomSelectionScreen;
