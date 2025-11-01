import { Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Suspense, useEffect } from "react";
import PageLoading from "../components/PageLoading";
import useUserStore from "../stores/useUserStore";
import useRealtimeStore from "../stores/useRealtimeStore";
import { useNavigate } from "react-router-dom";
import { setupActivityTracking, cleanupActivityTracking } from "../services/user";

const ChatLayout = () => {
  const { user } = useUserStore();
  const { subscribeToAllData, clearAllData, loading, isSubscribed } = useRealtimeStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.uid) {
      clearAllData();
      navigate('/');
      return;
    }
    
    const cleanupActivity = setupActivityTracking(user.uid);
    
    const unsubscribe = subscribeToAllData(user.uid);
    
    return () => {
      cleanupActivity();
      unsubscribe();
      cleanupActivityTracking(user.uid);
    };
  }, [user?.uid, clearAllData, subscribeToAllData, navigate]);

  return (
    <main className="min-h-screen bg-gray-100">
      <Suspense fallback={<PageLoading />}>
        {loading && !isSubscribed ? <PageLoading /> : <Outlet />}
      </Suspense>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#000',
            color: '#fff',
            borderRadius: '4px',
            padding: '12px 16px',
            fontSize: '0.95rem',
            fontWeight: 500,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#000',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#000',
            },
          },
        }}
      />
    </main>
  );
};

export default ChatLayout;