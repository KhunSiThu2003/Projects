// services/chatService.js
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp,
  doc,
  getDoc,
  setDoc
} from "firebase/firestore";
import { db } from "../firebase/config";

export const createOrGetChat = async (userId, friendId) => {
  try {
    // Check if chat already exists
    const chatsRef = collection(db, "chats");
    const q = query(
      chatsRef, 
      where("participantsArray", "array-contains", userId)
    );
    
    const querySnapshot = await getDocs(q);
    
    // Look for existing chat with both users
    let existingChat = null;
    querySnapshot.forEach((doc) => {
      const chatData = doc.data();
      if (chatData.participantsArray.includes(friendId)) {
        existingChat = { id: doc.id, ...chatData };
      }
    });

    if (existingChat) {
      return existingChat;
    }

    // Create new chat
    const newChat = {
      participantsArray: [userId, friendId],
      participantsData: {
        [userId]: true,
        [friendId]: true
      },
      lastMessage: "Start a conversation",
      lastMessageAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
      createdAt: serverTimestamp(),
      type: "direct",
      unreadCount: {
        [userId]: 0,
        [friendId]: 0
      }
    };

    const docRef = await addDoc(chatsRef, newChat);
    
    return {
      id: docRef.id,
      ...newChat
    };
  } catch (error) {
    console.error('Error creating or getting chat:', error);
    throw error;
  }
};