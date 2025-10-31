// ChatLayout.jsx - Updated with proper status management
import { Outlet } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { Suspense, useEffect, useState } from "react";
import useCookie from "react-use-cookie";
import { useNavigate, useLocation } from 'react-router-dom';
import PageLoading from "../components/PageLoading";

const ChatLayout = () => {
  const [userCookie, setUserCookie] = useCookie("user_id");
  const navigate = useNavigate();

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
            background: '#000',
            color: '#fff',
            borderRadius: '4px',
            padding: '12px 16px',
            fontSize: '0.95rem',
            fontWeight: 500,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            animation: 'toastSlideIn 0.4s ease, toastFadeOut 0.3s ease 3.7s forwards',
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