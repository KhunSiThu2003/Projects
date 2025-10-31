import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { applyActionCode, verifyPasswordResetCode, checkActionCode } from 'firebase/auth';
import { auth } from '../../firebase/config';
import toast from 'react-hot-toast';

const AuthActionHandler = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('loading');
    const [actionProcessed, setActionProcessed] = useState(false);
    
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');

    useEffect(() => {
        const handleAction = async () => {
            if (actionProcessed) {
                return;
            }


            if (!mode || !oobCode) {
                navigate('/', { replace: true });
                return;
            }

            try {
                setActionProcessed(true);
                const processedKey = `processed_${oobCode}`;
                const alreadyProcessed = localStorage.getItem(processedKey);
                
                if (alreadyProcessed) {
                    setStatus('success');
                    
                    if (mode === 'verifyEmail') {
                        setTimeout(() => {
                            navigate('/chat', { replace: true });
                        }, 2000);
                    } else if (mode === 'resetPassword') {
                        navigate(`/reset-password?oobCode=${encodeURIComponent(oobCode)}`, { replace: true });
                    }
                    return;
                }

                const actionCodeInfo = await checkActionCode(auth, oobCode);

                switch (mode) {
                    case 'resetPassword':
                        await verifyPasswordResetCode(auth, oobCode);
                        navigate(`/reset-password?oobCode=${encodeURIComponent(oobCode)}`, { replace: true });
                        break;
                        
                    case 'verifyEmail':
                        await applyActionCode(auth, oobCode);
                        
                        localStorage.setItem(processedKey, 'true');
                        
                        setStatus('success');
 
                        if (auth.currentUser) {
                            await auth.currentUser.reload();
                        }
                        
                        setTimeout(() => {
                            navigate('/chat', { replace: true });
                        }, 3000);
                        break;
                        
                    default:
                        navigate('/', { replace: true });
                }
            } catch (error) {
                
                setStatus('error');
                
                let message = 'This action link is invalid or has expired.';
                let redirectPath = '/';

                switch (error.code) {
                    case 'auth/invalid-action-code':
                        const processedKey = `processed_${oobCode}`;
                        const alreadyProcessed = localStorage.getItem(processedKey);
                        
                        if (alreadyProcessed) {
                            message = 'This verification link was already used. Your email is already verified.';
                            setStatus('success');
                            setTimeout(() => {
                                navigate('/chat', { replace: true });
                            }, 3000);
                            return;
                        } else {
                            message = 'This verification link is invalid. It may have already been used or expired.';
                            redirectPath = mode === 'verifyEmail' ? '/verify-email' : '/forgot-password';
                        }
                        break;
                    case 'auth/expired-action-code':
                        message = 'This verification link has expired. Please request a new one.';
                        redirectPath = mode === 'verifyEmail' ? '/verify-email' : '/forgot-password';
                        break;
                    case 'auth/user-disabled':
                        message = 'This account has been disabled.';
                        break;
                    case 'auth/user-not-found':
                        message = 'No account found with this email.';
                        break;
                }
                
                if (status !== 'success') {
                    toast.error(message);
                    
                    setTimeout(() => {
                        navigate(redirectPath, { replace: true });
                    }, 5000);
                }
            }
        };

        handleAction();
    }, [mode, oobCode, navigate, actionProcessed, status]);

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                        <svg className="h-8 w-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Processing Your Request</h3>
                    <p className="text-sm text-gray-500">
                        Please wait while we verify your action...
                    </p>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                        <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Email Verified Successfully!
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                        Your email has been verified. Redirecting to chat...
                    </p>
                    <button
                        onClick={() => navigate('/chat')}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Go to Chat Now
                    </button>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center max-w-md">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                        <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Verification Failed</h3>
                    <p className="text-sm text-gray-500 mb-6">
                        This link is invalid or has expired. Please request a new verification link.
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={() => navigate('/verify-email')}
                            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Request New Verification Link
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Back to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default AuthActionHandler;