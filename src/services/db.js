import { collection, doc, setDoc, deleteDoc, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

// Helper to push a new or updated item to Firestore
export const saveItemToDB = async (collectionName, item) => {
  try {
    const docRef = doc(db, collectionName, item.id);
    await setDoc(docRef, item);
  } catch (error) {
    console.error(`Error saving to ${collectionName}:`, error);
  }
};

// Helper to delete an item from Firestore
export const deleteItemFromDB = async (collectionName, id) => {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting from ${collectionName}:`, error);
  }
};

// Helper to subscribe to a collection
export const subscribeToCollection = (collectionName, callback) => {
  const colRef = collection(db, collectionName);
  return onSnapshot(colRef, (snapshot) => {
    const data = snapshot.docs.map(doc => doc.data());
    callback(data);
  }, (error) => {
    console.error(`Error subscribing to ${collectionName}:`, error);
  });
};
