import { Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import PageLoading from "../PageLoading";
import { Suspense, useEffect, useState } from "react";
import useCookie from "react-use-cookie";
import { getUserById, setUserOnline } from "../../services/user";
import useUserStore from "../../stores/useUserStore";
import { useNavigate } from 'react-router-dom';

const Layout = () => {
  const [userCookie] = useCookie("user");
  const { user, setUser } = useUserStore();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (userCookie) {
          const userData = await getUserById(JSON.parse(userCookie).uid);
          if (userData) {
            setUser(userData);
            
            // Set user online status
            await setUserOnline(userData.uid);
            
            console.log("Loaded user:", userData);
            navigate('/chat');
          } else {
            navigate('/');
          }
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error("Error loading user:", error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userCookie, setUser, navigate]);

  if (loading) return <PageLoading />;

  return (
    <main className="min-h-screen bg-gray-100">
      <Suspense fallback={<PageLoading />}>
        <Outlet />
      </Suspense>
      <Toaster position="top-right" />
    </main>
  );
};

export default Layout;
