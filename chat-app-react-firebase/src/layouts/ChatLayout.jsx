// ChatLayout.jsx - Complete real-time data subscription
import { Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Suspense, useEffect } from "react";
import PageLoading from "../components/PageLoading";
import useUserStore from "../stores/useUserStore";
import useRealtimeStore from "../stores/useRealtimeStore";

const ChatLayout = () => {
  const { user } = useUserStore();
  const { subscribeToAllData, clearAllData, loading } = useRealtimeStore();

  // Single real-time subscription for all data
  useEffect(() => {
    if (!user?.uid) {
      clearAllData();
      return;
    }

    console.log('🔄 Subscribing to all real-time data for user:', user.uid);

    // Subscribe to all real-time data
    const unsubscribe = subscribeToAllData(user.uid);

    // Cleanup subscription on unmount or user change
    return () => {
      console.log('🧹 Cleaning up real-time subscriptions');
      unsubscribe();
    };
  }, [user?.uid, clearAllData, subscribeToAllData]);

  return (
    <main className="min-h-screen bg-gray-100">
      <Suspense fallback={<PageLoading />}>
        {loading ? <PageLoading /> : <Outlet />}
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