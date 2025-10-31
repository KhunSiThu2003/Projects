import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import useCookie from 'react-use-cookie';
import { LoginWithEmailAndPassword, LoginWithGoogle } from '../../services/auth';

export const useLogin = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [userCookie, setUserCookie] = useCookie("user");
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm();

    const handleLogin = async (data) => {
        setIsLoading(true);
        try {
            const result = await LoginWithEmailAndPassword(data.email, data.password);

            if (result.success) {
                setUserCookie(JSON.stringify({
                    uid: result.user.uid,
                    email: result.user.email,
                    isVerified: result.user.emailVerified
                }));
                
                if (result.needsVerification) {
                    toast.success(result.message || "Logged in! Please verify your email.");
                    navigate('/verify-email', { 
                        state: { email: result.user.email } 
                    });
                } else {
                    navigate('/chat'); 
                }
            } else {
                toast.error(result.message);
            }
        } catch (err) {
            console.error("Unexpected login error:", err);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            const result = await LoginWithGoogle();

            if (result.success) {
                setUserCookie(JSON.stringify({
                    uid: result.user.uid,
                    email: result.user.email,
                    isVerified: result.user.emailVerified
                }));
                navigate('/chat');
            } else {
                toast.error(result.message);
            }
        } catch (err) {
            console.error("Unexpected Google login error:", err);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return {
        isLoading,
        register,
        handleSubmit,
        handleLogin,
        handleGoogleLogin,
        errors,
        togglePasswordVisibility,
        showPassword,
    };
}