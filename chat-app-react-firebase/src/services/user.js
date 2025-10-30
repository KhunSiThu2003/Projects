// user.js - Updated with better status management
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  collection, 
  query, 
  where, 
  getDocs,
  orderBy, 
  limit
} from "firebase/firestore";
import { db, auth } from "../firebase/config";

// Track online status globally
let statusUpdateInterval = null;
let lastActivityTime = Date.now();

/**
 * Update user activity timestamp
 */
export const updateUserActivity = () => {
  lastActivityTime = Date.now();
};

/**
 * Set up activity listeners to track user interaction
 */
export const setupActivityTracking = (userId) => {
  if (!userId) return;

  // Track user activity events
  const activityEvents = ['mousemove', 'keypress', 'click', 'scroll', 'touchstart'];
  
  const updateActivity = () => {
    updateUserActivity();
  };

  // Add event listeners for user activity
  activityEvents.forEach(event => {
    document.addEventListener(event, updateActivity, { passive: true });
  });

  // Start periodic status updates
  if (statusUpdateInterval) {
    clearInterval(statusUpdateInterval);
  }

  statusUpdateInterval = setInterval(async () => {
    const currentTime = Date.now();
    const inactiveTime = currentTime - lastActivityTime;
    
    // If user is inactive for more than 30 seconds, set as away
    if (inactiveTime > 30000) {
      await updateUserStatus(userId, 'away');
    } else {
      await updateUserStatus(userId, 'online');
    }
  }, 15000); // Check every 15 seconds

  // Set initial online status
  updateUserStatus(userId, 'online');

  return () => {
    // Cleanup function
    if (statusUpdateInterval) {
      clearInterval(statusUpdateInterval);
      statusUpdateInterval = null;
    }
    activityEvents.forEach(event => {
      document.removeEventListener(event, updateActivity);
    });
  };
};

/**
 * Clean up activity tracking
 */
export const cleanupActivityTracking = async (userId) => {
  if (statusUpdateInterval) {
    clearInterval(statusUpdateInterval);
    statusUpdateInterval = null;
  }
  
  if (userId) {
    await setUserOffline(userId);
  }
};

/**
 * Search users by email or name
 */
export const searchUsersByEmailOrName = async (searchTerm, currentUserId) => {
  try {
    if (!searchTerm.trim()) {
      return { success: true, users: [] };
    }

    const usersRef = collection(db, "users");
    const searchLower = searchTerm.toLowerCase();
    
    // Get all users and filter client-side (more reliable)
    const usersQuery = query(
      usersRef,
      limit(50) // Limit for performance
    );

    const snapshot = await getDocs(usersQuery);
    const users = [];

    snapshot.forEach(doc => {
      const userData = doc.data();
      if (doc.id !== currentUserId) { // Exclude current user
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
    console.error('Error searching users:', error);
    return { success: false, error: error.message, users: [] };
  }
};

/**
 * Get user profile by ID
 */
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
    console.error('Error getting user profile:', error);
    return { success: false, error: error.message };
  }
};

// User CRUD Operations
export const getUserById = async (userId) => {
  try {
    if (!userId) {
      console.warn('User ID is required');
      return null;
    }

    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.id, ...userSnap.data() };
    } else {
      console.warn(`User with ID ${userId} not found`);
      return null;
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
};

// In user.js - Update the updateUserProfile function
export const updateUserProfile = async (userId, updates) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Filter out undefined values and create clean update object
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
    console.error("Error updating user profile:", error);
    return { success: false, error: error.message };
  }
};

// User Status Management
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

    // Only update lastSeen for offline status
    if (status === 'offline') {
      updateData.lastSeen = serverTimestamp();
    }

    await setDoc(userRef, updateData, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('Error updating user status:', error);
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

// Get multiple users by IDs
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
    console.error('Error getting users by IDs:', error);
    return { success: false, error: error.message, users: [] };
  }
};