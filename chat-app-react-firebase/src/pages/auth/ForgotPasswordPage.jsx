import ForgotPasswordForm from "../../components/auth/ForgotPasswordForm";


const ForgotPasswordPage = () => {

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                <ForgotPasswordForm />
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
