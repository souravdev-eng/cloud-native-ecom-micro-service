import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import './AuthLayout.css';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            setError('Email is required');
            return;
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Please enter a valid email');
            return;
        }

        setLoading(true);
        setError('');

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        setSuccess(true);
        setLoading(false);
    };

    if (success) {
        return (
            <AuthLayout
                title="Check your email"
                subtitle="We've sent a password reset link to your email"
            >
                <div className="success-message">
                    <div className="success-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </div>
                    <p className="success-text">
                        We've sent a password reset link to <strong>{email}</strong>.
                        Please check your inbox and follow the instructions.
                    </p>
                    <p className="success-note">
                        Didn't receive the email? Check your spam folder or{' '}
                        <button
                            className="resend-btn"
                            onClick={() => setSuccess(false)}
                        >
                            try again
                        </button>
                    </p>
                    <Link to="/auth/login" className="back-to-login">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                        Back to sign in
                    </Link>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Forgot password?"
            subtitle="No worries, we'll send you reset instructions"
        >
            <form className="auth-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label" htmlFor="email">Email</label>
                    <div className="input-with-icon">
                        <span className="input-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                            </svg>
                        </span>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            className={`form-input ${error ? 'error' : ''}`}
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setError('');
                            }}
                            autoComplete="email"
                        />
                    </div>
                    {error && <span className="form-error">{error}</span>}
                </div>

                <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? (
                        <>
                            <span className="spinner"></span>
                            Sending...
                        </>
                    ) : (
                        'Send Reset Link'
                    )}
                </button>

                <Link to="/auth/login" className="back-to-login">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="19" y1="12" x2="5" y2="12" />
                        <polyline points="12 19 5 12 12 5" />
                    </svg>
                    Back to sign in
                </Link>
            </form>
        </AuthLayout>
    );
};

export default ForgotPassword;

