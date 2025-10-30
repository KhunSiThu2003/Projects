import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebase/config";
import { toast } from "react-hot-toast";

/**
 * Create or get existing chat room between two users
 */
export const getOrCreateChatRoom = async (currentUserId, otherUserId) => {
  try {
    if (!currentUserId || !otherUserId) {
      throw new Error('User IDs are required');
    }

    if (currentUserId === otherUserId) {
      throw new Error('Cannot create chat with yourself');
    }

    // Generate consistent chat ID for the two users
    const chatId = [currentUserId, otherUserId].sort().join('_');

    const chatRef = doc(db, "chats", chatId);
    const chatDoc = await getDoc(chatRef);

    if (!chatDoc.exists()) {
      // Create new chat room
      await setDoc(chatRef, {
        id: chatId,
        participants: [currentUserId, otherUserId],
        participantsData: {
          [currentUserId]: true,
          [otherUserId]: true
        },
        lastMessage: "",
        lastMessageAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isGroup: false,
        unreadCount: {
          [currentUserId]: 0,
          [otherUserId]: 0
        }
      });
      
      toast.success('Chat started successfully');
    }

    return { success: true, chatId };

  } catch (error) {
    console.error('Error creating chat room:', error);
    toast.error('Failed to start chat');
    return { success: false, error: error.message };
  }
};

/**
 * Get chat room by ID
 */
export const getChatRoom = async (chatId) => {
  try {
    if (!chatId) {
      throw new Error('Chat ID is required');
    }

    const chatRef = doc(db, "chats", chatId);
    const chatDoc = await getDoc(chatRef);

    if (chatDoc.exists()) {
      return { success: true, chat: { id: chatDoc.id, ...chatDoc.data() } };
    } else {
      return { success: false, error: "Chat not found" };
    }
  } catch (error) {
    console.error('Error getting chat room:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all chats for a user
 */
export const getUserChats = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const chatsRef = collection(db, "chats");
    const q = query(
      chatsRef, 
      where(`participantsData.${userId}`, "==", true)
    );

    const snapshot = await getDocs(q);
    const chats = [];

    snapshot.forEach(doc => {
      const chatData = doc.data();
      chats.push({
        id: doc.id,
        ...chatData
      });
    });

    return { success: true, chats };

  } catch (error) {
    console.error('Error getting user chats:', error);
    return { success: false, error: error.message, chats: [] };
  }
};