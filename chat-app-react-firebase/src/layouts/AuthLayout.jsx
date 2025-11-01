import React, { Suspense, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import useCookie from "react-use-cookie";
import PageLoading from "../components/PageLoading";
import useUserStore from "../stores/useUserStore";

const AuthLayout = () => {
  const [userCookie, setUserCookie] = useCookie("user");
  const { user, setUser } = useUserStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (userCookie) {
      try {
        const userData = JSON.parse(userCookie);
        if (userData.uid && userData.email) {
          setUser(userData);         
          if (userData) {
            navigate("/chat");
          }
        }
      } catch {
        console.warn("Invalid cookie format");
      }
    }
  }, [userCookie, navigate]);

  return (
    <main className="min-h-screen bg-gray-100">
      <Suspense fallback={<PageLoading />}>
        <Outlet />
      </Suspense>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
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

export default AuthLayout;
