import { Link } from 'react-router-dom';
import { HiEye, HiEyeOff } from "react-icons/hi";
import { FcGoogle } from "react-icons/fc";
import { useLogin } from '../../hooks/auth/useLogin';

const LoginForm = () => {

    const {
        isLoading,
        register,
        handleSubmit,
        handleLogin,
        handleGoogleLogin,
        errors,
        togglePasswordVisibility,
        showPassword,
    } = useLogin();

    return (
        <>
            <form onSubmit={handleSubmit(handleLogin)} className="space-y-6">
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
                            placeholder="Enter your password"
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

                <div className="flex items-center justify-between">
                    <Link to={'/forgot-password'} className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200">
                        Forgot password?
                    </Link>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-black text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-900 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                    {isLoading ? 'Signing In...' : 'Sign In'}
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
                        onClick={handleGoogleLogin}
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

export default LoginForm;
