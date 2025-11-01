import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { RegisterWithEmailAndPassword, RegisterWithGoogle } from '../../services/auth';
import useUserStore from '../../stores/useUserStore';
import useCookie from 'react-use-cookie';
import { getUserById } from '../../services/user';

export const useRegister = () => {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [userCookie, setUserCookie] = useCookie("user");
    const { setUser } = useUserStore();

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors }
    } = useForm();

    const password = watch('password');

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    const handleRegister = async (data) => {
        setIsLoading(true);

        try {
            const result = await RegisterWithEmailAndPassword(data);

            if (result.success) {
                toast.success("Account created successfully! Please verify your email to continue.");
                navigate('/verify-email', { 
                    state: { email: data.email } 
                });
            } else {
                toast.error(result.message || "Registration failed. Please try again.");
            }
        } catch (error) {
            console.error("Unexpected registration error:", error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleRegister = async () => {
        setIsLoading(true);
        try {
            const result = await RegisterWithGoogle();

            if (result.success) {
                const userData = await getUserById(result.user.uid);
                if (userData) {
                    setUser(userData);
                    setUserCookie(JSON.stringify(userData), { 
                        days: 30,
                        path: '/'
                    });
                    toast.success('Welcome! Account created successfully.');
                    navigate('/chat');
                } else {
                    toast.error('Failed to load user data');
                }
            } else {
                toast.error(result.message || 'Google registration failed');
            }
        } catch (err) {
            console.error("Unexpected error:", err);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isLoading,
        register,
        handleSubmit,
        handleRegister,
        handleGoogleRegister,
        errors,
        password,
        togglePasswordVisibility,
        toggleConfirmPasswordVisibility,
        showPassword,
        showConfirmPassword
    };
}