import { createBrowserRouter } from "react-router-dom";
import { lazy } from "react";
import ChatLayout from "../components/chat/ChatLayout";
import AuthLayout from "../components/auth/AuthLayout";

const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("../pages/auth/RegisterPage"));
const ChatPage = lazy(() => import("../pages/chat/ChatPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));
const ForgotPasswordPage = lazy(() => import("../pages/auth/ForgotPasswordPage"));

const router = createBrowserRouter([
    {
        path: "/",
        errorElement: <NotFoundPage />,
        element: <AuthLayout />,
        children: [
            {
                index: true,
                element: <LoginPage />,
            },
            {
                path: "/register",
                element: <RegisterPage />,
            },
            {
                path: "/forgot-password",
                element: <ForgotPasswordPage />,
            },
            {
                path: "/chat",
                element: <ChatLayout />,
                children: [
                    {
                        index: true,
                        element: <ChatPage />,
                    },
                ]
            }
        ],
    },
]);

export default router;
