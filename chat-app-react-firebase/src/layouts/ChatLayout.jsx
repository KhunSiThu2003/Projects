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
     
    </main>
  );
};

export default ChatLayout;