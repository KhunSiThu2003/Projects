import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
const ForgotPasswordForm = () => {

    const [isSubmitted, setIsSubmitted] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm();

    const onSubmit = (data) => {
        console.log('Forgot password data:', data);
        // Handle forgot password logic here
        setIsSubmitted(true);
        // Simulate API call
        setTimeout(() => {
            // Reset form or redirect
        }, 2000);
    };


    return (
        <div className="p-8">
            {!isSubmitted ? (
                <>
                    <div className="text-center mb-8">
                        <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Forgot Password</h1>
                        <p className="text-gray-600">
                            Enter your email address and we'll send you a link to reset your password.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errors.email ? 'border-red-500' : 'border-gray-300'
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
                            className="w-full bg-black text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-900 focus:outline-none"
                        >
                            Send Reset Link
                        </button>

                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-600">
                            Remember your password?{' '}
                            <a href="/" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200">
                                Back to Sign in
                            </a>
                        </p>
                    </div>
                </>
            ) : (
                <div className="text-center py-8">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Check Your Email</h2>
                    <p className="text-gray-600 mb-6">
                        We've sent a password reset link to your email address. Please check your inbox and follow the instructions to reset your password.
                    </p>
                    <div className="space-y-4">

                        <button
                            onClick={() => setIsSubmitted(false)}
                            className="w-full bg-black text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-900 focus:outline-none"
                        >
                            Resend Email
                        </button>

                        <a
                            href="/"
                            className="block w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                        >
                            Back to Login
                        </a>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ForgotPasswordForm
