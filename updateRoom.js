import { getFirestore, doc, updateDoc } from 'firebase/firestore';

// This function directly updates a room with the IsEmpty and IsFull fields
// You can call this from anywhere in your app
export const updateRoomFields = async (roomId) => {
  try {
    const db = getFirestore();
    const roomRef = doc(db, 'rooms', roomId);
    
    // Directly set the fields without checking current values
    await updateDoc(roomRef, {
      IsEmpty: false,  // Since we're updating it, it's not empty
      IsFull: false    // Set to false initially, will be updated when second player joins
    });
    
    console.log(`Directly updated room ${roomId} with IsEmpty and IsFull fields`);
    return true;
  } catch (error) {
    console.error(`Error updating room ${roomId}:`, error);
    return false;
  }
}; 