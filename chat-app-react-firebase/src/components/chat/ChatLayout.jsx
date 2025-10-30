// ChatLayout.jsx - Updated with proper status management
import { Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import PageLoading from "../PageLoading";
import { Suspense, useEffect, useState } from "react";
import useCookie from "react-use-cookie";
import { 
  getUserById, 
  setUserOnline, 
  setUserOffline, 
  setupActivityTracking, 
  cleanupActivityTracking,
  updateUserActivity 
} from "../../services/user";
import useUserStore from "../../stores/useUserStore";
import { useNavigate, useLocation } from 'react-router-dom';

const ChatLayout = () => {
  const [userCookie, setUserCookie] = useCookie("user");
  const { user, setUser } = useUserStore();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // If no user cookie, redirect to login
        if (!userCookie) {
          navigate('/');
          return;
        }

        const parsedUser = JSON.parse(userCookie);
        if (!parsedUser?.uid) {
          // Clear invalid cookie
          setUserCookie('', { days: 0 });
          navigate('/');
          return;
        }

        const userData = await getUserById(parsedUser.uid);
        if (userData) {
          setUser(userData);
          
          // Set user online status and start activity tracking
          await setUserOnline(userData.uid);
          setupActivityTracking(userData.uid);
          
          console.log("Loaded user:", userData);
          
          // If already on chat page, stay there. Otherwise navigate to chat
          if (!location.pathname.startsWith('/chat')) {
            navigate('/chat');
          }
        } else {
          // User not found in database, clear cookie and redirect to auth
          setUserCookie('', { days: 0 });
          navigate('/');
        }
      } catch (error) {
        console.error("Error loading user:", error);
        // Clear potentially corrupted cookie
        setUserCookie('', { days: 0 });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    // Setup visibility change listener for tab/window focus
    const handleVisibilityChange = async () => {
      if (!user?.uid) return;
      
      if (document.hidden) {
        // User switched to another tab or minimized window
        await setUserOffline(user.uid);
      } else {
        // User came back to the tab
        await setUserOnline(user.uid);
        updateUserActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (user?.uid) {
        cleanupActivityTracking(user.uid);
      }
    };
  }, [userCookie, setUser, navigate, location, setUserCookie, user?.uid]);

  // Handle beforeunload event (when user closes tab/browser)
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (user?.uid) {
        // Use synchronous method or sendBeacon for better reliability
        await setUserOffline(user.uid);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user?.uid]);

  if (loading) return <PageLoading />;

  return (
    <main className="min-h-screen bg-gray-100">
      <Suspense fallback={<PageLoading />}>
        <Outlet />
      </Suspense>
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            theme: {
              primary: 'green',
              secondary: 'black',
            },
          },
        }}
      />
    </main>
  );
};

export default ChatLayout;