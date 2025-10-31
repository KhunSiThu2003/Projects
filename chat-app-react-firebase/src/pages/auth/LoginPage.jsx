import React from 'react'
import LoginForm from '../../components/auth/LoginForm'
import { Link } from 'react-router-dom'

const LoginPage = () => {
  return (

    <div className="flex items-center justify-center min-h-screen md:p-4">
      <div
        className="
      bg-white 
      rounded-xl md:shadow-lg 
      md:w-[450px] w-full h-screen md:h-auto
      p-6 sm:p-8
      flex flex-col justify-center
    "
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            Sign in to your account
          </h1>
          <p className="text-gray-500 text-sm md:text-base">
            Join us and start chatting instantly
          </p>
        </div>

        <LoginForm />

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm md:text-base">
             Don't have an account?{' '}
            <Link
              to="/register"
              className="text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
