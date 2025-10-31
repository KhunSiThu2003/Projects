import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ResetPassword } from '../../services/auth';

export const useResetPassword = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const oobCode = searchParams.get('oobCode');

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch
    } = useForm();

    const password = watch('password');

    const handleResetPassword = async (data) => {
        if (!oobCode) {
            toast.error('Invalid reset link. Please request a new password reset email.');
            return;
        }

        setIsLoading(true);
        try {
            const result = await ResetPassword(oobCode, data.password);
            
            if (result.success) {
                setIsSuccess(true);
                toast.success(result.message);
                
                setTimeout(() => {
                    navigate('/', { replace: true });
                }, 3000);
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            console.error('Unexpected password reset error:', error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToLogin = () => {
        navigate('/');
    };

    return {
        isLoading,
        isSuccess,
        oobCode,
        register,
        handleSubmit,
        handleResetPassword,
        handleBackToLogin,
        errors,
        password
    };
};