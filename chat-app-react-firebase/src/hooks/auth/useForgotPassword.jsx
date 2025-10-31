import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { ForgotPassword } from '../../services/auth';

export const useForgotPassword = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        reset
    } = useForm();

    const email = watch('email');

    const handleResetPassword = async (data) => {
        setIsLoading(true);
        try {
            const result = await ForgotPassword(data.email);
            
            if (result.success) {
                setEmailSent(true);
                toast.success(result.message);
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendEmail = () => {
        if (email) {
            handleResetPassword({ email });
        }
    };

    const handleTryAnotherEmail = () => {
        setEmailSent(false);
        reset();
    };

    const handleBackToLogin = () => {
        navigate('/');
    };

    return {
        isLoading,
        emailSent,
        register,
        handleSubmit,
        handleResetPassword,
        handleResendEmail,
        handleTryAnotherEmail,
        handleBackToLogin,
        errors,
        email
    };
};