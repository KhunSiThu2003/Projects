import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  collection, 
  query, 
  where, 
  getDocs,
  limit,
  updateDoc,
  deleteDoc,
  arrayRemove
} from "firebase/firestore";
import { db, auth } from "../firebase/config";

let statusUpdateInterval = null;
let lastActivityTime = Date.now();

export const updateUserActivity = () => {
  lastActivityTime = Date.now();
};

export const setupActivityTracking = (userId) => {
  if (!userId) return;

  const activityEvents = ['mousemove', 'keypress', 'click', 'scroll', 'touchstart'];
  
  const updateActivity = () => {
    updateUserActivity();
  };

  activityEvents.forEach(event => {
    document.addEventListener(event, updateActivity, { passive: true });
  });

  if (statusUpdateInterval) {
    clearInterval(statusUpdateInterval);
  }

  statusUpdateInterval = setInterval(async () => {
    const currentTime = Date.now();
    const inactiveTime = currentTime - lastActivityTime;
    
    if (inactiveTime > 30000) {
      await updateUserStatus(userId, 'away');
    } else {
      await updateUserStatus(userId, 'online');
    }
  }, 15000);

  updateUserStatus(userId, 'online');

  return () => {
    if (statusUpdateInterval) {
      clearInterval(statusUpdateInterval);
      statusUpdateInterval = null;
    }
    activityEvents.forEach(event => {
      document.removeEventListener(event, updateActivity);
    });
  };
};

export const cleanupActivityTracking = async (userId) => {
  if (statusUpdateInterval) {
    clearInterval(statusUpdateInterval);
    statusUpdateInterval = null;
  }
  
  if (userId) {
    await setUserOffline(userId);
  }
};

export const searchUsersByEmailOrName = async (searchTerm, currentUserId) => {
  try {
    if (!searchTerm.trim()) {
      return { success: true, users: [] };
    }

    const usersRef = collection(db, "users");
    const searchLower = searchTerm.toLowerCase();
    
    const usersQuery = query(
      usersRef,
      limit(50)
    );

    const snapshot = await getDocs(usersQuery);
    const users = [];

    snapshot.forEach(doc => {
      const userData = doc.data();
      if (doc.id !== currentUserId) {
        const emailMatch = userData.email?.toLowerCase().includes(searchLower);
        const nameMatch = userData.fullName?.toLowerCase().includes(searchLower);
        
        if (emailMatch || nameMatch) {
          users.push({
            uid: doc.id,
            email: userData.email,
            fullName: userData.fullName,
            profilePic: userData.profilePic,
            status: userData.status,
            lastSeen: userData.lastSeen,
            bio: userData.bio
          });
        }
      }
    });

    return { success: true, users };

  } catch (error) {
    return { success: false, error: error.message, users: [] };
  }
};

export const getUserProfile = async (userId) => {
  try {
    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    const userDoc = await getDoc(doc(db, "users", userId));
    
    if (userDoc.exists()) {
      return { success: true, user: { id: userDoc.id, ...userDoc.data() } };
    } else {
      return { success: false, error: "User not found" };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getUserById = async (userId) => {
  try {
    if (!userId) {
      return null;
    }

    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.id, ...userSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
};

export const updateUserProfile = async (userId, updates) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const cleanUpdates = {};
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        cleanUpdates[key] = updates[key];
      }
    });

    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
      ...cleanUpdates,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateUserStatus = async (userId, status = 'online') => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const userRef = doc(db, 'users', userId);
    const updateData = {
      status,
      updatedAt: serverTimestamp()
    };

    if (status === 'offline') {
      updateData.lastSeen = serverTimestamp();
    }

    await setDoc(userRef, updateData, { merge: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const setUserOffline = async (userId) => {
  return await updateUserStatus(userId, 'offline');
};

export const setUserOnline = async (userId) => {
  return await updateUserStatus(userId, 'online');
};

export const setUserAway = async (userId) => {
  return await updateUserStatus(userId, 'away');
};

export const getUsersByIds = async (userIds) => {
  try {
    if (!userIds || !Array.isArray(userIds)) {
      return { success: false, error: 'User IDs array is required', users: [] };
    }

    const users = [];
    for (const userId of userIds) {
      if (userId) {
        const user = await getUserById(userId);
        if (user) {
          users.push(user);
        }
      }
    }

    return { success: true, users };
  } catch (error) {
    return { success: false, error: error.message, users: [] };
  }
};

export const deleteUserAccount = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const userRef = doc(db, "users", userId);
    await deleteDoc(userRef);

    const messagesQuery = query(
      collection(db, "messages"),
      where("senderId", "==", userId)
    );
    const messagesSnapshot = await getDocs(messagesQuery);
    const messageDeletions = messagesSnapshot.docs.map(doc =>
      deleteDoc(doc.ref)
    );

    const requestsQuery = query(
      collection(db, "friendRequests"),
      where("fromUserId", "==", userId)
    );
    const requestsSnapshot = await getDocs(requestsQuery);
    const requestDeletions = requestsSnapshot.docs.map(doc =>
      deleteDoc(doc.ref)
    );

    const friendsQuery = query(
      collection(db, "users"),
      where("friends", "array-contains", userId)
    );
    const friendsSnapshot = await getDocs(friendsQuery);
    const friendUpdates = friendsSnapshot.docs.map(doc =>
      updateDoc(doc.ref, {
        friends: arrayRemove(userId)
      })
    );

    const blockedQuery = query(
      collection(db, "blockedUsers"),
      where("blockedBy", "==", userId)
    );
    const blockedSnapshot = await getDocs(blockedQuery);
    const blockedDeletions = blockedSnapshot.docs.map(doc =>
      deleteDoc(doc.ref)
    );

    await Promise.all([
      ...messageDeletions,
      ...requestDeletions,
      ...friendUpdates,
      ...blockedDeletions
    ]);


    const user = auth.currentUser;
    if (user) {
      await user.delete();
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};