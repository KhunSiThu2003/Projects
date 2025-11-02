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
    const chatsRef = collection(db, "chats");
    const q = query(
      chatsRef, 
      where("participantsArray", "array-contains", userId)
    );
    
    const querySnapshot = await getDocs(q);
    
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
    throw error;
  }
};