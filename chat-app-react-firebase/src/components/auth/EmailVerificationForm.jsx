// EmailVerificationForm.jsx - Updated version
import React from 'react';
import { Link } from 'react-router-dom';
import { useEmailVerification } from '../../hooks/auth/useEmailVerification';

const EmailVerificationForm = () => {
    const {
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
        errors
    } = useEmailVerification();

    // Show verifying state when handling Firebase action URL
    if (isVerifying) {
        return (
            <div className="space-y-6 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                    <svg className="h-6 w-6 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16z" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Verifying Email</h3>
                <p className="text-sm text-gray-500">
                    Please wait while we verify your email address...
                </p>
            </div>
        );
    }

    // Show success state after verification
    if (verificationStatus === 'success') {
        return (
            <div className="space-y-6 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Email Verified Successfully!</h3>
                <p className="text-sm text-gray-500">
                    Your email has been verified. Redirecting to chat...
                </p>
                <div className="flex justify-center space-x-4">
                    <button
                        onClick={() => window.location.href = '/chat'}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Go to Chat Now
                    </button>
                </div>
            </div>
        );
    }

    // Show error state if verification failed
    if (verificationStatus === 'error') {
        return (
            <div className="space-y-6 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Verification Failed</h3>
                <p className="text-sm text-gray-500">
                    The verification link is invalid or has expired.
                </p>
                <div className="space-y-4">
                    <button
                        onClick={handleResendEmail}
                        disabled={isLoading || countdown > 0}
                        className="w-full bg-black text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-900 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                        {isLoading ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend Verification Email'}
                    </button>
                    <button
                        onClick={handleBackToLogin}
                        className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            {emailSent ? (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-lg font-medium text-gray-900">Check your email</h3>
                        <p className="mt-2 text-sm text-gray-500">
                            We've sent a verification link to <strong>{userEmail}</strong>
                        </p>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={handleResendEmail}
                            disabled={isLoading || countdown > 0}
                            className="w-full bg-black text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-900 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                            {isLoading ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend Email'}
                        </button>
                        <button
                            onClick={checkVerification}
                            disabled={isLoading}
                            className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            I've Verified My Email
                        </button>
                        <button
                            onClick={handleTryAnotherEmail}
                            disabled={isLoading}
                            className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Try another email
                        </button>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
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
                <form onSubmit={handleSubmit(handleSendVerification)} className="space-y-6">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Verify Your Email</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            We'll send a verification link to your email address
                        </p>
                    </div>

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
                        className="w-full bg-black text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-900 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                        {isLoading ? 'Sending Verification...' : 'Send Verification Link'}
                    </button>
                </form>
            )}

            <div className="mt-6 text-center">
                <Link
                    to={'/'}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                >
                    Back to Sign In
                </Link>
            </div>
        </>
    );
};

export default EmailVerificationForm;