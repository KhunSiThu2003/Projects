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
        if (userData) {
          setUser(userData);         
          if (userData) {
            navigate("/chat");
          }
        }
      } catch {
      }
    }
  }, [userCookie, navigate]);

  return (
    <main className="min-h-screen bg-gray-100">
      <Suspense fallback={<PageLoading />}>
        <Outlet />
      </Suspense>
    </main>
  );
};

export default AuthLayout;
