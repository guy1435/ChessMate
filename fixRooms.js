import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { updateAllRooms, updateSingleRoom } from './updateRooms';

const FixRoomsScreen = ({ navigation, route }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [result, setResult] = useState(null);
  
  const handleUpdateAllRooms = async () => {
    setIsUpdating(true);
    try {
      const result = await updateAllRooms();
      setResult(result);
      
      if (result.success) {
        Alert.alert(
          "Success", 
          `Updated ${result.updatedCount} rooms with IsEmpty and IsFull fields.`
        );
      } else {
        Alert.alert("Error", result.error);
      }
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", error.message);
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleUpdateSingleRoom = async () => {
    // You could add an input field to enter a room ID
    // For now, let's use a hardcoded room ID for testing
    const roomId = route.params?.roomId;
    
    if (!roomId) {
      Alert.alert("Error", "No room ID provided");
      return;
    }
    
    setIsUpdating(true);
    try {
      const result = await updateSingleRoom(roomId);
      setResult(result);
      
      if (result.success) {
        Alert.alert(
          "Success", 
          result.message || "Room updated successfully"
        );
      } else {
        Alert.alert("Error", result.error);
      }
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", error.message);
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fix Firestore Rooms</Text>
      
      <View style={styles.buttonContainer}>
        <Button
          title={isUpdating ? "Updating..." : "Update All Rooms"}
          onPress={handleUpdateAllRooms}
          disabled={isUpdating}
        />
      </View>
      
      {route.params?.roomId && (
        <View style={styles.buttonContainer}>
          <Button
            title={isUpdating ? "Updating..." : `Update Room ${route.params.roomId}`}
            onPress={handleUpdateSingleRoom}
            disabled={isUpdating}
          />
        </View>
      )}
      
      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Result:</Text>
          <Text>{JSON.stringify(result, null, 2)}</Text>
        </View>
      )}
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
  buttonContainer: {
    width: '80%',
    marginVertical: 10,
  },
  resultContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#eee',
    borderRadius: 5,
    width: '90%',
  },
  resultTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
});

export default FixRoomsScreen; 