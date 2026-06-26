import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  onSnapshot,
  orderBy,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';
import { v4 as uuidv4 } from 'uuid';

// Generate unique event code (6 characters)
export const generateEventCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Create event
export const createEvent = async (
  organizerId: string,
  eventName: string,
  eventDescription?: string
) => {
  try {
    const eventCode = generateEventCode();
    const eventId = uuidv4();

    await setDoc(doc(db, 'events', eventId), {
      eventId,
      eventCode,
      eventName,
      eventDescription: eventDescription || '',
      organizerId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      photoCount: 0,
      status: 'active',
    });

    return { eventId, eventCode };
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

// Get event by ID
export const getEventById = async (eventId: string) => {
  try {
    const docSnap = await getDoc(doc(db, 'events', eventId));
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting event:', error);
    throw error;
  }
};

// Get event by event code
export const getEventByCode = async (eventCode: string) => {
  try {
    const q = query(
      collection(db, 'events'),
      where('eventCode', '==', eventCode.toUpperCase())
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data();
    }
    return null;
  } catch (error) {
    console.error('Error getting event by code:', error);
    throw error;
  }
};

// Get all events for organizer
export const getOrganizerEvents = async (organizerId: string) => {
  try {
    const q = query(
      collection(db, 'events'),
      where('organizerId', '==', organizerId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => doc.data());
  } catch (error) {
    console.error('Error getting organizer events:', error);
    throw error;
  }
};

// Update event
export const updateEvent = async (
  eventId: string,
  updates: Record<string, any>
) => {
  try {
    await updateDoc(doc(db, 'events', eventId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

// Delete event
export const deleteEvent = async (eventId: string) => {
  try {
    await deleteDoc(doc(db, 'events', eventId));
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};

// Add photo
export const addPhoto = async (
  eventId: string,
  photoData: {
    cloudinaryUrl: string;
    cloudinaryPublicId: string;
    uploaderDevice?: string;
  }
) => {
  try {
    const photosRef = collection(db, 'events', eventId, 'photos');
    const docRef = await addDoc(photosRef, {
      ...photoData,
      uploadedAt: serverTimestamp(),
    });

    // Increment photoCount on the event
    const eventRef = doc(db, 'events', eventId);
    await updateDoc(eventRef, {
      photoCount: increment(1),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error('Error adding photo:', error);
    throw error;
  }
};

// Get event photos
export const getEventPhotos = async (eventId: string) => {
  try {
    const q = query(
      collection(db, 'events', eventId, 'photos'),
      orderBy('uploadedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting photos:', error);
    throw error;
  }
};

// Real-time listener for photos
export const subscribeToPhotos = (
  eventId: string,
  callback: (photos: any[]) => void
) => {
  try {
    const q = query(
      collection(db, 'events', eventId, 'photos'),
      orderBy('uploadedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const photos = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(photos);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to photos:', error);
    throw error;
  }
};

// Delete photo
export const deletePhoto = async (eventId: string, photoId: string) => {
  try {
    await deleteDoc(doc(db, 'events', eventId, 'photos', photoId));

    // Decrement photoCount
    const eventRef = doc(db, 'events', eventId);
    await updateDoc(eventRef, {
      photoCount: increment(-1),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error deleting photo:', error);
    throw error;
  }
};
