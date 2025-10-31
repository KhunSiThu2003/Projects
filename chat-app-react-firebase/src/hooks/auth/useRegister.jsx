import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { RegisterWithEmailAndPassword, RegisterWithGoogle } from '../../services/auth';

export const useRegister = () => {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
                navigate('/chat');
            } else {
                toast.error(result.message);
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