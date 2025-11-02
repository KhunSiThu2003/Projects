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
    sendPasswordResetEmail,
    signOut,
    confirmPasswordReset,
    verifyPasswordResetCode,
    checkActionCode

} from "firebase/auth";
import { db, auth } from "../firebase/config";

const RegisterWithEmailAndPassword = async (data) => {
  try {
    const res = await createUserWithEmailAndPassword(auth, data.email, data.password);

    try {
      await sendEmailVerification(res.user);
    } catch (error) {
    }

    await setDoc(doc(db, "users", res.user.uid), {
      uid: res.user.uid,
      email: data.email,
      fullName: data.fullName ?? "",
      profilePic: data.profilePic ?? "https://t3.ftcdn.net/jpg/06/19/26/46/360_F_619264680_x2PBdGLF54sFe7kTBtAvZnPyXgvaRw0Y.jpg",
      bio: data.bio ?? "Hey there! I'm using ChatApp 💬",
      status: "offline",
      lastSeen: serverTimestamp(),
      isVerified: false,
      friends: [],
      sentRequests: [],
      receivedRequests: [],
      blocked: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return { success: true, user: res.user };

  } catch (error) {
    let message = "Registration failed. Please try again.";
    switch (error.code) {
      case "auth/email-already-in-use":
        message = "This email is already in use. Please use a different email.";
        break;
      case "auth/invalid-email":
        message = "Invalid email address.";
        break;
      case "auth/weak-password":
        message = "Password should be at least 6 characters.";
        break;
      case "auth/operation-not-allowed":
        message = "Email/password accounts are not enabled.";
        break;
    }
    return { success: false, error, message };
  }
};

const RegisterWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');

    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      await setDoc(userDocRef, {
        status: "online",
        lastSeen: serverTimestamp(),
        isVerified: user.emailVerified,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      return { success: true, user, existing: true };
    }

    await setDoc(userDocRef, {
      uid: user.uid,
      email: user.email,
      fullName: user.displayName || "",
      profilePic: user.photoURL || "https://t3.ftcdn.net/jpg/06/19/26/46/360_F_619264680_x2PBdGLF54sFe7kTBtAvZnPyXgvaRw0Y.jpg",
      bio: "Hey there! I'm using ChatApp 💬",
      status: "online",
      lastSeen: serverTimestamp(),
      isVerified: user.emailVerified,
      friends: [],
      sentRequests: [],
      receivedRequests: [],
      blocked: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { success: true, user, existing: false };

  } catch (error) {
    let message = "Google registration failed. Please try again.";
    switch (error.code) {
      case "auth/popup-closed-by-user":
        message = "Google sign-in was cancelled.";
        break;
      case "auth/popup-blocked":
        message = "Popup was blocked. Please allow popups for this site.";
        break;
      case "auth/unauthorized-domain":
        message = "This domain is not authorized for Google sign-in.";
        break;
      case "auth/account-exists-with-different-credential":
        message = "An account already exists with the same email. Please try signing in with email and password.";
        break;
      case "auth/network-request-failed":
        message = "Network error. Please check your internet connection.";
        break;
    }

    return { success: false, error, message };
  }
};

const LoginWithEmailAndPassword = async (email, password) => {
  try {
    const res = await signInWithEmailAndPassword(auth, email, password);
    const user = res.user;

    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      status: 'online',
      lastSeen: serverTimestamp(),
      isVerified: user.emailVerified,
      updatedAt: serverTimestamp()
    }, { merge: true });

    if (!user.emailVerified) {
      try {
        await sendEmailVerification(user);
        return { 
          success: true, 
          user, 
          needsVerification: true,
          message: 'Please verify your email. A new verification email has been sent.'
        };
      } catch (verErr) {
        return { 
          success: true, 
          user, 
          needsVerification: true,
          message: 'Please verify your email to access all features.'
        };
      }
    }

    return { success: true, user };

  } catch (error) {
    let message = 'Sign in failed. Please try again.';
    switch (error.code) {
      case 'auth/wrong-password':
      case 'auth/user-not-found':
      case 'auth/invalid-credential':
        message = 'Invalid email or password.';
        break;
      case 'auth/too-many-requests':
        message = 'Too many failed attempts. Try again later.';
        break;
      case 'auth/user-disabled':
        message = 'This account has been disabled.';
        break;
      case 'auth/invalid-email':
        message = 'Invalid email address.';
        break;
      case 'auth/network-request-failed':
        message = 'Network error. Please check your connection.';
        break;
    }

    return { success: false, error, message };
  }
};

const LoginWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope("profile");
    provider.addScope("email");

    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        fullName: user.displayName || "",
        profilePic: user.photoURL || "https://t3.ftcdn.net/jpg/06/19/26/46/360_F_619264680_x2PBdGLF54sFe7kTBtAvZnPyXgvaRw0Y.jpg",
        bio: "Hey there! I'm using ChatApp 💬",
        status: "online",
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
      await setDoc(
        userDocRef,
        {
          status: "online",
          lastSeen: serverTimestamp(),
          isVerified: user.emailVerified,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }

    return { success: true, user };

  } catch (error) {
    let message = "Google sign-in failed. Please try again.";

    switch (error.code) {
      case "auth/popup-closed-by-user":
        message = "Google sign-in was cancelled.";
        break;
      case "auth/popup-blocked":
        message = "Popup was blocked. Please allow popups for this site.";
        break;
      case "auth/unauthorized-domain":
        message = "This domain is not authorized for Google sign-in.";
        break;
      case "auth/account-exists-with-different-credential":
        message = "An account already exists with this email using a different sign-in method.";
        break;
      case "auth/network-request-failed":
        message = "Network error. Please check your internet connection.";
        break;
    }

    return { success: false, error, message };
  }
};

const ForgotPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, message: 'Password reset email sent successfully!' };
  } catch (error) {
    let message = 'Failed to send reset email. Please try again.';
    switch (error.code) {
      case 'auth/user-not-found':
        message = 'No account found with this email address.';
        break;
      case 'auth/invalid-email':
        message = 'Invalid email address.';
        break;
      case 'auth/too-many-requests':
        message = 'Too many attempts. Please try again later.';
        break;
      case 'auth/network-request-failed':
        message = 'Network error. Please check your connection.';
        break;
      case 'auth/missing-email':
        message = 'Email address is required.';
        break;
      case 'auth/operation-not-allowed':
        message = 'Password reset is not enabled. Please contact support.';
        break;
    }

    return { success: false, error, message };
  }
};

const ResetPassword = async (oobCode, newPassword) => {
  try {
    await checkActionCode(auth, oobCode);
    
    await confirmPasswordReset(auth, oobCode, newPassword);
    
    return { 
        success: true, 
        message: 'Password reset successfully! You can now sign in with your new password.' 
    };
  } catch (error) {
    let message = 'Failed to reset password. Please try again.';
    switch (error.code) {
      case 'auth/expired-action-code':
        message = 'The reset link has expired. Please request a new one.';
        break;
      case 'auth/invalid-action-code':
        message = 'The reset link is invalid. Please request a new one.';
        break;
      case 'auth/user-disabled':
        message = 'This account has been disabled.';
        break;
      case 'auth/user-not-found':
        message = 'No account found with this email.';
        break;
      case 'auth/weak-password':
        message = 'Password should be at least 6 characters.';
        break;
      case 'auth/network-request-failed':
        message = 'Network error. Please check your connection.';
        break;
    }

    return { success: false, error, message };
  }
};

const SendEmailVerification = async () => {
  try {
    if (!auth.currentUser) {
      return { success: false, message: 'No user is currently signed in.' };
    }

    if (auth.currentUser.emailVerified) {
      return { success: false, message: 'Email is already verified.' };
    }

    await sendEmailVerification(auth.currentUser);
    return { success: true, message: 'Verification email sent successfully!' };
    
  } catch (error) {
    let message = 'Failed to send verification email. Please try again.';
    switch (error.code) {
      case 'auth/too-many-requests':
        message = 'Too many attempts. Please try again later.';
        break;
      case 'auth/user-not-found':
        message = 'User not found. Please sign in again.';
        break;
      case 'auth/network-request-failed':
        message = 'Network error. Please check your connection.';
        break;
    }
    
    return { success: false, error, message };
  }
};

const LogoutUser = async () => {
  try {
    if (auth.currentUser) {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      await setDoc(userDocRef, {
        status: "offline",
        lastSeen: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    }

    await signOut(auth);
    return { success: true, message: 'Logged out successfully!' };
  } catch (error) {
    return { success: false, error, message: 'Failed to log out. Please try again.' };
  }
};

export { 
  RegisterWithEmailAndPassword, 
  RegisterWithGoogle, 
  LoginWithEmailAndPassword, 
  LoginWithGoogle,
  ForgotPassword,
  ResetPassword,
  SendEmailVerification,
  LogoutUser 
};