import { useForm } from 'react-hook-form';
import { HiEye, HiEyeOff } from "react-icons/hi";
import { FcGoogle } from "react-icons/fc";
import { useRegister } from '../../hooks/auth/useRegister';


const RegisterForm = () => {

    const {
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
    } = useRegister();


    return (
        <>
            <form onSubmit={handleSubmit(handleRegister)} className="space-y-6">
                <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                    </label>
                    <input
                        type="text"
                        id="fullName"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errors.fullName ? 'border-red-500' : 'border-gray-300'
                            }`}
                        placeholder="Enter your full name"
                        {...register('fullName', {
                            required: 'Full name is required',
                            minLength: {
                                value: 2,
                                message: 'Full name must be at least 2 characters'
                            }
                        })}
                    />
                    {errors.fullName && (
                        <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                    </label>
                    <input
                        type="email"
                        id="email"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errors.email ? 'border-red-500' : 'border-gray-300'
                            }`}
                        placeholder="Enter your email"
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

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pr-12 ${errors.password ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="Create a password"
                            {...register('password', {
                                required: 'Password is required',
                                minLength: {
                                    value: 6,
                                    message: 'Password must be at least 6 characters'
                                }
                            })}
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                            onClick={togglePasswordVisibility}
                        >
                            {showPassword ? (
                                <HiEyeOff className="h-5 w-5" />
                            ) : (
                                <HiEye className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm Password
                    </label>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            id="confirmPassword"
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pr-12 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="Confirm your password"
                            {...register('confirmPassword', {
                                required: 'Please confirm your password',
                                validate: value => value === password || 'Passwords do not match'
                            })}
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                            onClick={toggleConfirmPasswordVisibility}
                        >
                            {showConfirmPassword ? (
                                <HiEyeOff className="h-5 w-5" />
                            ) : (
                                <HiEye className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                    {errors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-black text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-900 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                </button>
            </form>

            <div className="mt-6">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Or continue with</span>
                    </div>
                </div>

                <div className="mt-6">
                    <button
                        onClick={handleGoogleRegister}
                        type="button"
                        disabled={isLoading}
                        className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FcGoogle className="w-5 h-5" />
                        <span className="ml-2">
                            {isLoading ? 'Signing In...' : 'Google'}
                        </span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default RegisterForm;
