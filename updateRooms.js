import { getFirestore, collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';

/**
 * This utility function updates all existing rooms in Firestore to add the IsEmpty and IsFull fields.
 * Run this function once to fix all existing rooms.
 */
export const updateAllRooms = async () => {
  try {
    const db = getFirestore();
    const roomsRef = collection(db, 'rooms');
    const querySnapshot = await getDocs(roomsRef);
    
    console.log(`Found ${querySnapshot.size} rooms to update`);
    
    let updatedCount = 0;
    
    for (const roomDoc of querySnapshot.docs) {
      const roomData = roomDoc.data();
      const roomId = roomDoc.id;
      
      // Prepare updates
      const updates = {};
      
      // Add IsEmpty field if it doesn't exist
      if (roomData.IsEmpty === undefined) {
        updates.IsEmpty = !(roomData.whitePlayer || roomData.blackPlayer);
      }
      
      // Add IsFull field if it doesn't exist
      if (roomData.IsFull === undefined) {
        updates.IsFull = !!(roomData.whitePlayer && roomData.blackPlayer);
      }
      
      // Only update if there are changes to make
      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, 'rooms', roomId), updates);
        updatedCount++;
        console.log(`Updated room ${roomId} with:`, updates);
      }
    }
    
    console.log(`Successfully updated ${updatedCount} rooms`);
    return { success: true, updatedCount };
  } catch (error) {
    console.error("Error updating rooms:", error);
    return { success: false, error: error.message };
  }
};

/**
 * This function updates a single room to add the IsEmpty and IsFull fields.
 */
export const updateSingleRoom = async (roomId) => {
  try {
    const db = getFirestore();
    const roomRef = doc(db, 'rooms', roomId);
    
    // Get the current room data
    const roomDoc = await getDoc(roomRef);
    
    if (!roomDoc.exists()) {
      console.error(`Room ${roomId} does not exist`);
      return { success: false, error: "Room does not exist" };
    }
    
    const roomData = roomDoc.data();
    
    // Prepare updates
    const updates = {};
    
    // Add IsEmpty field if it doesn't exist
    if (roomData.IsEmpty === undefined) {
      updates.IsEmpty = !(roomData.whitePlayer || roomData.blackPlayer);
    }
    
    // Add IsFull field if it doesn't exist
    if (roomData.IsFull === undefined) {
      updates.IsFull = !!(roomData.whitePlayer && roomData.blackPlayer);
    }
    
    // Only update if there are changes to make
    if (Object.keys(updates).length > 0) {
      await updateDoc(roomRef, updates);
      console.log(`Updated room ${roomId} with:`, updates);
      return { success: true, updates };
    }
    
    return { success: true, message: "No updates needed" };
  } catch (error) {
    console.error(`Error updating room ${roomId}:`, error);
    return { success: false, error: error.message };
  }
}; 