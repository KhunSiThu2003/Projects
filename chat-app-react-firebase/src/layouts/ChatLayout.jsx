import { Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Suspense, useEffect, useRef } from "react";
import PageLoading from "../components/PageLoading";
import useUserStore from "../stores/useUserStore";
import useRealtimeStore from "../stores/useRealtimeStore";
import { useNavigate } from "react-router-dom";
import { setupActivityTracking, cleanupActivityTracking } from "../services/user";
import notiSoundSrc from "../assets/sounds/noti-sound.mp3";
import messageSoundSrc from "../assets/sounds/message-send.mp3";

const ChatLayout = () => {
  const { user } = useUserStore();
  const { subscribeToAllData, clearAllData, loading, isSubscribed, chats, receivedFriendRequests } = useRealtimeStore();
  const navigate = useNavigate();
  
  const notiSoundRef = useRef(null);
  const messageSoundRef = useRef(null);
  const previousChatsRef = useRef([]);
  const previousFriendRequestsRef = useRef([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Audio) {
      try {
        const notiSound = new Audio();
        notiSound.src = notiSoundSrc;
        notiSoundRef.current = notiSound;
        
        const messageSound = new Audio();
        messageSound.src = messageSoundSrc;
        messageSoundRef.current = messageSound;
      } catch (error) {
        console.error('Error loading notification sounds:', error);
      }
    }
  }, []);

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

  useEffect(() => {
    if (!user?.uid || previousChatsRef.current.length === 0) {
      previousChatsRef.current = chats;
      return;
    }

    const previousChatsMap = new Map(previousChatsRef.current.map(chat => [chat.id, chat]));
    
    for (const chat of chats) {
      const previousChat = previousChatsMap.get(chat.id);
      
      if (previousChat && chat.unreadCount && previousChat.unreadCount) {
        const previousUnread = previousChat.unreadCount[user.uid] || 0;
        const currentUnread = chat.unreadCount[user.uid] || 0;
        
        if (currentUnread > previousUnread && messageSoundRef.current) {
          try {
            messageSoundRef.current.currentTime = 0;
            messageSoundRef.current.play().catch(error => {
              console.log('Could not play notification sound:', error);
            });
          } catch (error) {
            console.log('Error playing notification sound:', error);
          }
          break;
        }
      }
    }
    
    previousChatsRef.current = chats;
  }, [chats, user?.uid]);

  useEffect(() => {
    if (!user?.uid || previousFriendRequestsRef.current.length === 0) {
      previousFriendRequestsRef.current = receivedFriendRequests;
      return;
    }

    if (receivedFriendRequests.length > previousFriendRequestsRef.current.length && notiSoundRef.current) {
      try {
        notiSoundRef.current.currentTime = 0;
        notiSoundRef.current.play().catch(error => {
          console.log('Could not play friend request sound:', error);
        });
      } catch (error) {
        console.log('Error playing friend request sound:', error);
      }
    }
    
    previousFriendRequestsRef.current = receivedFriendRequests;
  }, [receivedFriendRequests, user?.uid]);

  return (
    <main className="min-h-screen bg-gray-100">
      <Suspense fallback={<PageLoading />}>
        {loading && !isSubscribed ? <PageLoading /> : <Outlet />}
      </Suspense>
     
    </main>
  );
};

export default ChatLayout;