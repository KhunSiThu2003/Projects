// useEmailVerification.jsx - Updated version
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { sendEmailVerification, applyActionCode } from 'firebase/auth';
import { auth } from '../../firebase/config';

export const useEmailVerification = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [countdown, setCountdown] = useState(0);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState(null); // 'success', 'error', null
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

    // Handle Firebase action URL when component mounts
    useEffect(() => {
        if (mode === 'verifyEmail' && oobCode) {
            handleEmailVerification(oobCode);
        }
    }, [mode, oobCode]);

    // Pre-fill email from location state or from logged-in user
    useEffect(() => {
        if (location.state?.email) {
            setUserEmail(location.state.email);
            setValue('email', location.state.email);
            setEmailSent(true);
        } else if (auth.currentUser?.email) {
            setUserEmail(auth.currentUser.email);
            setValue('email', auth.currentUser.email);
            setEmailSent(true);
        }
    }, [location.state, setValue]);

    // Countdown timer for resend
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // Handle email verification from Firebase link
    const handleEmailVerification = async (code) => {
        setIsVerifying(true);
        try {
            await applyActionCode(auth, code);
            setVerificationStatus('success');
            toast.success('Email verified successfully!');
            
            // Update user's verification status
            if (auth.currentUser) {
                await auth.currentUser.reload();
            }
            
            // Redirect to chat after 3 seconds
            setTimeout(() => {
                navigate('/chat');
            }, 3000);
            
        } catch (error) {
            console.error('Email verification error:', error);
            setVerificationStatus('error');
            
            let message = 'Failed to verify email. The link may be invalid or expired.';
            switch (error.code) {
                case 'auth/invalid-action-code':
                    message = 'Invalid verification link. Please request a new one.';
                    break;
                case 'auth/expired-action-code':
                    message = 'Verification link has expired. Please request a new one.';
                    break;
                case 'auth/user-disabled':
                    message = 'This account has been disabled.';
                    break;
                case 'auth/user-not-found':
                    message = 'No account found with this email.';
                    break;
            }
            
            toast.error(message);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleSendVerification = async (data) => {
        setIsLoading(true);
        try {
            let emailToVerify = data.email;
            
            // If user is logged in but not verified, use their email
            if (auth.currentUser && !auth.currentUser.emailVerified) {
                await sendEmailVerification(auth.currentUser);
                emailToVerify = auth.currentUser.email;
            } else {
                // For new registration - user should be signed in at this point
                if (auth.currentUser) {
                    await sendEmailVerification(auth.currentUser);
                    emailToVerify = auth.currentUser.email;
                } else {
                    toast.error("Please sign in first to verify your email.");
                    setIsLoading(false);
                    return;
                }
            }
            
            setUserEmail(emailToVerify);
            setEmailSent(true);
            setCountdown(60); // 60 seconds countdown
            toast.success('Verification email sent successfully!');
        } catch (error) {
            console.error('Email verification error:', error);
            let message = "Something went wrong. Please try again.";
            
            switch (error.code) {
                case 'auth/too-many-requests':
                    message = 'Too many attempts. Please try again later.';
                    break;
                case 'auth/user-not-found':
                    message = 'User not found. Please sign in again.';
                    break;
                case 'auth/network-request-failed':
                    message = 'Network error. Please check your connection.';
                    break;
            }
            
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendEmail = () => {
        if (userEmail && countdown === 0) {
            handleSendVerification({ email: userEmail });
        }
    };

    const handleTryAnotherEmail = () => {
        setEmailSent(false);
        reset();
    };

    const handleBackToLogin = () => {
        navigate('/');
    };

    const checkVerification = async () => {
        if (auth.currentUser) {
            await auth.currentUser.reload();
            if (auth.currentUser.emailVerified) {
                toast.success('Email verified successfully!');
                navigate('/chat');
            } else {
                toast.error('Email not verified yet. Please check your inbox.');
            }
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