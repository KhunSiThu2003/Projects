import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../../firebase/config';

export const useEmailVerification = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [countdown, setCountdown] = useState(60);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const oobCode = searchParams.get('oobCode');
    const mode = searchParams.get('mode');

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        reset,
        setValue
    } = useForm();

    const email = watch('email');

    useEffect(() => {
        if (mode === 'verifyEmail' && oobCode) {
            navigate(`/auth/action?mode=verifyEmail&oobCode=${oobCode}`, { replace: true });
            return;
        }

        if (auth.currentUser?.emailVerified) {
            navigate('/');
            return;
        }
    }, [mode, oobCode, navigate]);

    useEffect(() => {
        let emailToSet = '';

        if (location.state?.email) {
            emailToSet = location.state.email;
        } else if (auth.currentUser?.email) {
            emailToSet = auth.currentUser.email;
        }

        if (emailToSet) {
            setUserEmail(emailToSet);
            setValue('email', emailToSet);
            setEmailSent(true);
        }
    }, [location.state, setValue]);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleSendVerification = async (data) => {
        if (!data.email) {
            toast.error('Please enter your email address');
            return;
        }

        setIsLoading(true);
        try {
            if (!auth.currentUser) {
                toast.error('Please sign in first to verify your email.');
                setIsLoading(false);
                return;
            }

            if (auth.currentUser.emailVerified) {
                toast.success('Your email is already verified!');
                navigate('/');
                return;
            }

            await sendEmailVerification(auth.currentUser);
            const emailToVerify = auth.currentUser.email;

            setUserEmail(emailToVerify);
            setEmailSent(true);
            setCountdown(60);
            toast.success('Verification email sent successfully! Check your inbox.');

        } catch (error) {
            let message = "Failed to send verification email. Please try again.";

            switch (error.code) {
                case 'auth/too-many-requests':
                    message = 'Too many attempts. Please try again later.';
                    break;
                case 'auth/user-not-found':
                    message = 'User not found. Please sign in again.';
                    break;
                case 'auth/network-request-failed':
                    message = 'Network error. Please check your internet connection.';
                    break;
                case 'auth/invalid-email':
                    message = 'Invalid email address.';
                    break;
            }

            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendEmail = () => {
        if (userEmail) {
            handleSendVerification({ email: userEmail });
        }
    };

    const handleTryAnotherEmail = () => {
        setEmailSent(false);
        reset();
        setUserEmail('');
    };

    const handleBackToLogin = () => {
        navigate('/');
    };

    const checkVerification = async () => {
        if (auth.currentUser) {
            await auth.currentUser.reload();
            if (auth.currentUser.emailVerified) {
                toast.success('Email verified successfully!');
                navigate('/');
            } else {
                toast.error('Email not verified yet. Please check your inbox and click the verification link.');
            }
        } else {
            toast.error('Please sign in to check verification status.');
        }
    };

    return {
        isLoading,
        isVerifying,
        emailSent,
        userEmail,
        countdown,
        verificationStatus,
        register,
        handleSubmit,
        handleSendVerification,
        handleResendEmail,
        handleTryAnotherEmail,
        handleBackToLogin,
        checkVerification,
        errors,
        email
    };
};