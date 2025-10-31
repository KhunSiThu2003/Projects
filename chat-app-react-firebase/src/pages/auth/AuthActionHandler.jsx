import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { applyActionCode, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../../firebase/config';
import toast from 'react-hot-toast';

const AuthActionHandler = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('loading');
    
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');
    const apiKey = searchParams.get('apiKey');

    useEffect(() => {
        const handleAction = async () => {
            if (!mode || !oobCode) {
                toast.error('Invalid action link');
                navigate('/', { replace: true });
                return;
            }

            try {
                switch (mode) {
                    case 'resetPassword':
                        await verifyPasswordResetCode(auth, oobCode);
                        navigate(`/reset-password?oobCode=${oobCode}`, { replace: true });
                        break;
                        
                    case 'verifyEmail':
                        await applyActionCode(auth, oobCode);
                        setStatus('success');
                        toast.success('Email verified successfully!');
                        
                        if (auth.currentUser) {
                            await auth.currentUser.reload();
                        }
                        
                        setTimeout(() => {
                            navigate('/chat', { replace: true });
                        }, 3000);
                        break;
                        
                    default:
                        toast.error('Unknown action type');
                        navigate('/', { replace: true });
                }
            } catch (error) {
                console.error('Action handling error:', error);
                setStatus('error');
                
                let message = 'This action link is invalid or has expired.';
                switch (error.code) {
                    case 'auth/invalid-action-code':
                    case 'auth/expired-action-code':
                        message = 'This link has expired. Please request a new one.';
                        break;
                    case 'auth/user-disabled':
                        message = 'This account has been disabled.';
                        break;
                    case 'auth/user-not-found':
                        message = 'No account found.';
                        break;
                }
                
                toast.error(message);
                
                setTimeout(() => {
                    if (mode === 'resetPassword') {
                        navigate('/forgot-password', { replace: true });
                    } else {
                        navigate('/', { replace: true });
                    }
                }, 5000);
            }
        };

        handleAction();
    }, [mode, oobCode, navigate]);

    if (status === 'success') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                        <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Email Verified!</h3>
                    <p className="mt-2 text-sm text-gray-500">
                        Your email has been verified successfully. Redirecting to chat...
                    </p>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Action Failed</h3>
                    <p className="mt-2 text-sm text-gray-500">
                        This link is invalid or has expired. Redirecting...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                    <svg className="h-6 w-6 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16z" />
                    </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Processing...</h3>
                <p className="mt-2 text-sm text-gray-500">
                    Please wait while we process your request...
                </p>
            </div>
        </div>
    );
};

export default AuthActionHandler;