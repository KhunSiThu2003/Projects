import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { userResetPassword } from '../../services/auth';

const ForgotPasswordForm = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

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
            const result = await userResetPassword(data.email);
            
            if (result.success) {
                setEmailSent(true);
                toast.success('Password reset email sent! Check your inbox.');
            }
            // Error handling is done in the service function
        } catch (error) {
            console.error('Password reset error:', error);
            toast.error('Failed to send reset email. Please try again.');
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

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Reset your password
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        {emailSent 
                            ? 'Check your email for reset instructions' 
                            : 'Enter your email to receive a password reset link'
                        }
                    </p>
                </div>

                {/* Success State */}
                {emailSent ? (
                    <div className="bg-white py-8 px-6 shadow rounded-lg">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="mt-4 text-lg font-medium text-gray-900">Check your email</h3>
                            <p className="mt-2 text-sm text-gray-500">
                                We've sent a password reset link to <strong>{email}</strong>
                            </p>
                            <div className="mt-6 space-y-4">
                                <button
                                    onClick={handleResendEmail}
                                    disabled={isLoading}
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                >
                                    {isLoading ? 'Sending...' : 'Resend Email'}
                                </button>
                                <button
                                    onClick={handleTryAnotherEmail}
                                    className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors duration-200"
                                >
                                    Try another email
                                </button>
                            </div>
                        </div>
                        
                        {/* Help Text */}
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-blue-800">
                                        Didn't receive the email?
                                    </h3>
                                    <div className="mt-2 text-sm text-blue-700">
                                        <ul className="list-disc list-inside space-y-1">
                                            <li>Check your spam folder</li>
                                            <li>Make sure you entered the correct email</li>
                                            <li>Wait a few minutes and try again</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Form State */
                    <form onSubmit={handleSubmit(handleResetPassword)} className="bg-white py-8 px-6 shadow rounded-lg space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                                    errors.email ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Enter your email address"
                                {...register('email', {
                                    required: 'Email is required',
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: 'Invalid email address'
                                    }
                                })}
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-black text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                            {isLoading ? 'Sending Reset Link...' : 'Send Reset Link'}
                        </button>

                        {/* Back to Login */}
                        <div className="text-center">
                            <a
                                href="/"
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                            >
                                ← Back to Sign In
                            </a>
                        </div>
                    </form>
                )}

                {/* Additional Help */}
                <div className="text-center">
                    <p className="text-xs text-gray-500">
                        Need help? Contact our{' '}
                        <a href="/support" className="text-blue-600 hover:text-blue-700">
                            support team
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordForm;
