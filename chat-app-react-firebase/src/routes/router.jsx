import { createBrowserRouter } from "react-router-dom";
import ChatLayout from "../layouts/ChatLayout";
import AuthLayout from "../layouts/AuthLayout";
import { lazy } from "react";

const ChatPage = lazy(() => import("../pages/chat/ChatPage"));
const RegisterPage = lazy(() => import("../pages/auth/RegisterPage"));
const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const ForgotPasswordPage = lazy(() => import("../pages/auth/ForgotPasswordPage"));
const AuthActionHandler = lazy(() => import("../pages/auth/AuthActionHandler"));
const ResetPasswordPage = lazy(() => import("../pages/auth/ResetPasswordPage"));
const EmailVerificationPage = lazy(() => import("../pages/auth/EmailVerificationPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));

const router = createBrowserRouter([
  {
    path: "/",
    element: <AuthLayout />,
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: <LoginPage />,
      },
      {
        path: "register",
        element: <RegisterPage />,
      },
      {
        path: "forgot-password",
        element: <ForgotPasswordPage />,
      },
      {
        path: "auth-action",
        element: <AuthActionHandler />,
      },
      {
        path: "reset-password",
        element: <ResetPasswordPage />,
      }, {
        path: "verify-email",
        element: <EmailVerificationPage />,
      },
      {
        path: "chat",
        element: <ChatLayout />,
        children: [
          {
            index: true,
            element: <ChatPage />,
          },
        ],
      },
    ],

  },

]);

export default router;
