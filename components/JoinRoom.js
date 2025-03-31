import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { getFirestore, collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';

const JoinRoom = ({ navigation, route }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roomIdInput, setRoomIdInput] = useState('');
  const userEmail = route.params?.userEmail || 'Guest';
  const db = getFirestore();

  // Fetch available rooms from Firestore
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const roomsRef = collection(db, 'rooms');
        // Query for rooms that aren't full
        const q = query(roomsRef, where('IsFull', '==', false));
        const querySnapshot = await getDocs(q);
        
        const availableRooms = [];
        querySnapshot.forEach((doc) => {
          availableRooms.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setRooms(availableRooms);
      } catch (error) {
        console.error("Error fetching rooms:", error);
        Alert.alert("Error", "Failed to fetch available rooms");
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
    
    // Set up a timer to refresh the room list every 10 seconds
    const refreshInterval = setInterval(fetchRooms, 10000);
    return () => clearInterval(refreshInterval);
  }, [db]);

  const handleJoinRoom = async (roomId) => {
    try {
      // Check if room exists
      const roomRef = doc(db, 'rooms', roomId);
      const roomDoc = await getDoc(roomRef);
      
      if (!roomDoc.exists()) {
        Alert.alert("Error", "Room does not exist");
        return;
      }
      
      const roomData = roomDoc.data();
      
      // Check if room is full
      if (roomData.IsFull) {
        Alert.alert("Room Full", "This room already has two players");
        return;
      }
      
      // Navigate to the board with the room ID
      navigation.navigate('Board', { 
        roomId: roomId,
        userEmail: userEmail
      });
    } catch (error) {
      console.error("Error joining room:", error);
      Alert.alert("Error", "Failed to join room");
    }
  };

  const handleManualJoin = () => {
    if (roomIdInput.trim() === '') {
      Alert.alert("Error", "Please enter a room ID");
      return;
    }
    
    handleJoinRoom(roomIdInput.trim());
  };

  const renderRoom = ({ item }) => (
    <TouchableOpacity
      style={styles.roomItem}
      onPress={() => handleJoinRoom(item.id)}
    >
      <Text style={styles.roomId}>Room ID: {item.id}</Text>
      <Text style={styles.roomInfo}>
        Created by: {item.createdBy || 'Unknown'}
      </Text>
      <Text style={styles.roomStatus}>
        Status: {item.whitePlayer ? 'Waiting for black player' : 'Empty'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join a Chess Room</Text>
      
      <View style={styles.manualJoinContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter Room ID"
          value={roomIdInput}
          onChangeText={setRoomIdInput}
        />
        <TouchableOpacity style={styles.joinButton} onPress={handleManualJoin}>
          <Text style={styles.joinButtonText}>Join</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.availableRoomsTitle}>Available Rooms:</Text>
      
      {loading ? (
        <Text style={styles.loadingText}>Loading available rooms...</Text>
      ) : rooms.length > 0 ? (
        <FlatList
          data={rooms}
          renderItem={renderRoom}
          keyExtractor={(item) => item.id}
          style={styles.roomList}
        />
      ) : (
        <Text style={styles.noRoomsText}>No available rooms found</Text>
      )}
      
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={() => {
          setLoading(true);
          // The useEffect will run again and refresh the rooms
          setLoading(false);
        }}
      >
        <Text style={styles.refreshButtonText}>Refresh Rooms</Text>
      </TouchableOpacity>
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
    marginBottom: 20,
    textAlign: 'center',
  },
  manualJoinContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginRight: 10,
    backgroundColor: '#fff',
  },
  joinButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  availableRoomsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  roomList: {
    flex: 1,
    marginBottom: 10,
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
    fontSize: 16,
    fontWeight: 'bold',
  },
  roomInfo: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
  },
  roomStatus: {
    fontSize: 14,
    color: '#777',
    marginTop: 5,
  },
  loadingText: {
    textAlign: 'center',
    marginVertical: 20,
    color: '#777',
  },
  noRoomsText: {
    textAlign: 'center',
    marginVertical: 20,
    color: '#777',
  },
  refreshButton: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default JoinRoom;
