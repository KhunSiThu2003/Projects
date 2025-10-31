import React from 'react';
import ResetPasswordForm from './../../components/auth/ResetPasswordForm';

const ResetPasswordPage = () => {
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
                <ResetPasswordForm />
            </div>
        </div>
    );
};

export default ResetPasswordPage;