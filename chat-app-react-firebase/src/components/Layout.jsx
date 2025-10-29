import { Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import PageLoading from "./PageLoading";
import { Suspense } from "react";

const Layout = () => {
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
