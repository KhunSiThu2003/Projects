import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail
} from "firebase/auth";
import { db, auth } from "../firebase/config";
import { toast } from "react-hot-toast";

// User CRUD Operations
export const getUserById = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() };
    } else {
      console.warn(`User with ID ${userId} not found`);
      return null;
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
};

export const updateUserProfile = async (userId, updates) => {
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    
    toast.success("Profile updated successfully");
    return true;
  } catch (error) {
    console.error("Error updating user profile:", error);
    toast.error("Failed to update profile");
    return false;
  }
};

// Authentication Functions
export const userRegisterWithEmailAndPassword = async (data) => {
  try {
    const res = await createUserWithEmailAndPassword(auth, data.email, data.password);

    // Send email verification to the new user
    try {
      await sendEmailVerification(res.user);
      toast.success('Verification email sent. Please check your inbox.');
    } catch (verErr) {
      console.error('Error sending verification email:', verErr);
      toast.error('Failed to send verification email.');
    }

    await setDoc(doc(db, "users", res.user.uid), {
      uid: res.user.uid,
      email: data.email,
      fullName: data.fullName || "",
      profilePic:
        data.profilePic ||
        "https://t3.ftcdn.net/jpg/06/19/26/46/360_F_619264680_x2PBdGLF54sFe7kTBtAvZnPyXgvaRw0Y.jpg",
      bio: data.bio || "Hey there! I'm using ChatApp 💬",
      status: "offline",
      lastSeen: serverTimestamp(),
      isVerified: false,
      friends: [],
      sentRequests: [],
      receivedRequests: [],
      blocked: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    toast.success("Registration successful 🎉");
    return { success: true, user: res.user };

  } catch (error) {
    console.error("Registration error:", error);

    switch (error.code) {
      case "auth/email-already-in-use":
        toast.error("This email is already in use.");
        break;
      case "auth/invalid-email":
        toast.error("Invalid email address.");
        break;
      case "auth/weak-password":
        toast.error("Password should be at least 6 characters.");
        break;
      default:
        toast.error("Registration failed. Please try again.");
    }
    return { success: false, error };
  }
};

export const userRegisterWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');

    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // If Google account is not verified, send verification email as a fallback
    if (!user.emailVerified) {
      try {
        await sendEmailVerification(user);
        toast.success('Verification email sent. Please check your inbox.');
      } catch (verErr) {
        console.error('Error sending verification email (Google):', verErr);
      }
    }

    // Check if user document already exists
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    // Only create user document if it doesn't exist
    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        fullName: user.displayName || "",
        profilePic: user.photoURL || "https://t3.ftcdn.net/jpg/06/19/26/46/360_F_619264680_x2PBdGLF54sFe7kTBtAvZnPyXgvaRw0Y.jpg",
        bio: "Hey there! I'm using ChatApp 💬",
        status: "offline",
        lastSeen: serverTimestamp(),
        isVerified: user.emailVerified,
        friends: [],
        sentRequests: [],
        receivedRequests: [],
        blocked: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    toast.success("Google registration successful 🎉");
    return { success: true, user };

  } catch (error) {
    console.error("Google registration error:", error);

    switch (error.code) {
      case "auth/popup-closed-by-user":
        toast.error("Google sign-in was cancelled.");
        break;
      case "auth/popup-blocked":
        toast.error("Popup was blocked. Please allow popups for this site.");
        break;
      case "auth/unauthorized-domain":
        toast.error("This domain is not authorized for Google sign-in.");
        break;
      default:
        toast.error("Google registration failed. Please try again.");
    }
    return { success: false, error };
  }
};

export const userLoginWithEmailAndPassword = async (email, password) => {
  try {
    const res = await signInWithEmailAndPassword(auth, email, password);
    const user = res.user;

    // Update user status in Firestore
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      status: 'online',
      lastSeen: serverTimestamp(),
      isVerified: user.emailVerified,
      updatedAt: serverTimestamp()
    }, { merge: true });

    return { success: true, user };
  } catch (error) {
    console.error('Login error:', error);
    
    switch (error.code) {
      case 'auth/user-not-found':
        toast.error('No account found with this email.');
        break;
      case 'auth/wrong-password':
        toast.error('Incorrect password.');
        break;
      case 'auth/too-many-requests':
        toast.error('Too many failed attempts. Try again later.');
        break;
      case 'auth/user-disabled':
        toast.error('This account has been disabled.');
        break;
      case 'auth/invalid-email':
        toast.error('Invalid email address.');
        break;
      case 'auth/network-request-failed':
        toast.error('Network error. Please check your connection.');
        break;
      default:
        toast.error('Sign in failed. Please try again.');
    }
    return { success: false, error };
  }
};

export const userLoginWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');

    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Ensure user document exists in Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        fullName: user.displayName || '',
        profilePic: user.photoURL || 'https://t3.ftcdn.net/jpg/06/19/26/46/360_F_619264680_x2PBdGLF54sFe7kTBtAvZnPyXgvaRw0Y.jpg',
        bio: "Hey there! I'm using ChatApp 💬",
        status: 'online',
        lastSeen: serverTimestamp(),
        isVerified: user.emailVerified,
        friends: [],
        sentRequests: [],
        receivedRequests: [],
        blocked: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      // Update existing user status
      await setDoc(userDocRef, {
        status: 'online',
        lastSeen: serverTimestamp(),
        isVerified: user.emailVerified,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }

    return { success: true, user };
  } catch (error) {
    console.error('Google login error:', error);
    
    switch (error.code) {
      case 'auth/popup-closed-by-user':
        toast.error('Google sign-in was cancelled.');
        break;
      case 'auth/popup-blocked':
        toast.error('Popup blocked. Allow popups for this site.');
        break;
      case 'auth/unauthorized-domain':
        toast.error('This domain is not authorized for Google sign-in.');
        break;
      case 'auth/account-exists-with-different-credential':
        toast.error('An account already exists with the same email but different sign-in method.');
        break;
      default:
        toast.error('Google sign-in failed. Please try again.');
    }
    return { success: false, error };
  }
};

export const userResetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    toast.success('Password reset email sent! Check your inbox.');
    return { success: true };
  } catch (error) {
    console.error('Password reset error:', error);
    
    switch (error.code) {
      case 'auth/user-not-found':
        toast.error('No account found with this email address.');
        break;
      case 'auth/invalid-email':
        toast.error('Invalid email address format.');
        break;
      case 'auth/too-many-requests':
        toast.error('Too many attempts. Please try again later.');
        break;
      case 'auth/network-request-failed':
        toast.error('Network error. Please check your connection.');
        break;
      default:
        toast.error('Failed to send reset email. Please try again.');
    }
    return { success: false, error };
  }
};

// User Status Management
export const updateUserStatus = async (userId, status = 'online') => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      status,
      lastSeen: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error updating user status:', error);
    return false;
  }
};

export const setUserOffline = async (userId) => {
  return await updateUserStatus(userId, 'offline');
};

export const setUserOnline = async (userId) => {
  return await updateUserStatus(userId, 'online');
};

// Friend Management Functions
export const sendFriendRequest = async (fromUserId, toUserId) => {
  try {
    // Implementation for sending friend requests
    // This would update both users' sentRequests and receivedRequests arrays
    console.log(`Friend request sent from ${fromUserId} to ${toUserId}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending friend request:', error);
    return { success: false, error };
  }
};

export const acceptFriendRequest = async (userId, friendId) => {
  try {
    // Implementation for accepting friend requests
    console.log(`Friend request accepted between ${userId} and ${friendId}`);
    return { success: true };
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return { success: false, error };
  }
};


