import React, { Suspense, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import PageLoading from "../PageLoading";
import { Toaster } from "react-hot-toast";
import useCookie from "react-use-cookie";

const AuthLayout = () => {
  const [userCookie] = useCookie("user");
  const navigate = useNavigate();

  useEffect(() => {
    if (userCookie) {
      try {
        const user = JSON.parse(userCookie);
        if (user?.uid) {
          navigate("/chat");
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
      <Toaster position="top-right" />
    </main>
  );
};

export default AuthLayout;
