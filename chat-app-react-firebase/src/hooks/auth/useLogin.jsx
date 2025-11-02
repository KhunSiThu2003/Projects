import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import useCookie from 'react-use-cookie';
import { LoginWithEmailAndPassword, LoginWithGoogle } from '../../services/auth';
import { getUserById } from '../../services/user';
import useUserStore from '../../stores/useUserStore';

export const useLogin = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [userCookie, setUserCookie] = useCookie("user");
    const { setUser } = useUserStore();
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
                if (result.needsVerification) {
                    toast.success(result.message || "Logged in! Please verify your email.");
                    navigate('/verify-email', {
                        state: { email: result.user.email }
                    });
                } else {
                    const userData = await getUserById(result.user.uid);
                    if (userData) {
                        setUser(userData);
                        setUserCookie(JSON.stringify(userData), { 
                            days: 30,
                            path: '/'
                        });
                        toast.success('Welcome back!');
                        navigate('/chat');
                    } else {
                        toast.error('Failed to load user data');
                    }
                }
            } else {
                toast.error(result.message || 'Login failed');
            }
        } catch (err) {
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
                const userData = await getUserById(result.user.uid);
                if (userData) {
                    setUser(userData);
                    setUserCookie(JSON.stringify(userData));
                    toast.success('Welcome back!');
                    navigate('/chat');
                } else {
                    toast.error('Failed to load user data');
                }
            } else {
                toast.error(result.message || 'Google login failed');
            }
        } catch (err) {
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