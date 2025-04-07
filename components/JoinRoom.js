import React, { useState, useEffect } from 'react';
import { View, Text, Button, TextInput, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { getFirestore, collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';

const JoinRoom = ({ navigation, route }) => {
  const userEmail = route.params?.userEmail || 'Guest';
  const [roomId, setRoomId] = useState('');
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const db = getFirestore();

  // Fetch available rooms
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const roomsRef = collection(db, 'rooms');
        const q = query(roomsRef, where("IsFull", "==", false)); // Only get rooms that aren't full
        const snapshot = await getDocs(q);
        
        const rooms = [];
        snapshot.forEach(doc => {
          rooms.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setAvailableRooms(rooms);
      } catch (error) {
        console.error("Error fetching rooms:", error);
        Alert.alert("Error", "Failed to fetch available rooms");
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
    
    // Set up a timer to refresh the list every 10 seconds
    const intervalId = setInterval(fetchRooms, 10000);
    
    // Clean up the interval when component unmounts
    return () => clearInterval(intervalId);
  }, [db]);

  const handleJoinRoom = async (selectedRoomId) => {
    try {
      const roomRef = doc(db, 'rooms', selectedRoomId);
      const roomDoc = await getDoc(roomRef);
      
      if (!roomDoc.exists()) {
        Alert.alert("Error", "Room does not exist");
        return;
      }
      
      const roomData = roomDoc.data();
      
      if (roomData.IsFull) {
        Alert.alert("Error", "Room is already full");
        return;
      }
      
      // Navigate to the Board screen with the selected room ID
      navigation.navigate('Board', {
        roomId: selectedRoomId,
        userEmail: userEmail,
        isNewRoom: false
      });
    } catch (error) {
      console.error("Error joining room:", error);
      Alert.alert("Error", "Failed to join room");
    }
  };

  const handleSubmitRoomId = () => {
    if (!roomId.trim()) {
      Alert.alert("Error", "Please enter a room ID");
      return;
    }
    
    handleJoinRoom(roomId.trim());
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join a Room</Text>
      <Text style={styles.subtitle}>Logged in as: {userEmail}</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter Room ID"
          value={roomId}
          onChangeText={setRoomId}
        />
        <Button title="Join" onPress={handleSubmitRoomId} />
      </View>
      
      <Text style={styles.sectionTitle}>Available Rooms:</Text>
      
      {loading ? (
        <Text>Loading rooms...</Text>
      ) : availableRooms.length === 0 ? (
        <Text>No available rooms found. Create a room or enter a room ID.</Text>
      ) : (
        <FlatList
          data={availableRooms}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.roomItem}
              onPress={() => handleJoinRoom(item.id)}
            >
              <Text style={styles.roomId}>Room ID: {item.id}</Text>
              <Text>Created by: {item.createdBy || 'Unknown'}</Text>
              <Text>Status: {item.whitePlayer ? 'Waiting for opponent' : 'Open'}</Text>
            </TouchableOpacity>
          )}
        />
      )}
      
      <View style={styles.buttonContainer}>
        <Button 
          title="Back to Room Selection" 
          onPress={() => navigation.navigate('RoomSelection')}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    color: '#666',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginRight: 10,
    paddingHorizontal: 10,
  },
  roomItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  roomId: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  buttonContainer: {
    marginTop: 20,
  }
});

export default JoinRoom;
