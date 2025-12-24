import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import './AuthLayout.css';

interface SignupFormData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    agreeTerms: boolean;
}

interface FormErrors {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    agreeTerms?: string;
}

const Signup: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<SignupFormData>({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        agreeTerms: false,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        if (errors[name as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.firstName.trim()) {
            newErrors.firstName = 'First name is required';
        }

        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
        }

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            newErrors.password = 'Password must include uppercase, lowercase, and number';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (!formData.agreeTerms) {
            newErrors.agreeTerms = 'You must agree to the terms';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        // On success, navigate to login
        navigate('/auth/login');
        setLoading(false);
    };

    const getPasswordStrength = (): { level: number; label: string; color: string } => {
        const { password } = formData;
        if (!password) return { level: 0, label: '', color: '' };

        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

        if (strength <= 2) return { level: strength, label: 'Weak', color: 'var(--error)' };
        if (strength <= 3) return { level: strength, label: 'Medium', color: 'var(--warning)' };
        return { level: strength, label: 'Strong', color: 'var(--success)' };
    };

    const passwordStrength = getPasswordStrength();

    return (
        <AuthLayout
            title="Create account"
            subtitle="Join EcomAdmin and start managing your store"
        >
            <form className="auth-form" onSubmit={handleSubmit}>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label" htmlFor="firstName">First name</label>
                        <input
                            id="firstName"
                            name="firstName"
                            type="text"
                            className={`form-input ${errors.firstName ? 'error' : ''}`}
                            placeholder="John"
                            value={formData.firstName}
                            onChange={handleChange}
                            autoComplete="given-name"
                        />
                        {errors.firstName && <span className="form-error">{errors.firstName}</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="lastName">Last name</label>
                        <input
                            id="lastName"
                            name="lastName"
                            type="text"
                            className={`form-input ${errors.lastName ? 'error' : ''}`}
                            placeholder="Doe"
                            value={formData.lastName}
                            onChange={handleChange}
                            autoComplete="family-name"
                        />
                        {errors.lastName && <span className="form-error">{errors.lastName}</span>}
                    </div>
                </div>

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
                            className={`form-input ${errors.email ? 'error' : ''}`}
                            placeholder="admin@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            autoComplete="email"
                        />
                    </div>
                    {errors.email && <span className="form-error">{errors.email}</span>}
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="password">Password</label>
                    <div className="input-with-icon">
                        <span className="input-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </span>
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            className={`form-input ${errors.password ? 'error' : ''}`}
                            placeholder="Create a strong password"
                            value={formData.password}
                            onChange={handleChange}
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                        >
                            {showPassword ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            )}
                        </button>
                    </div>
                    {formData.password && (
                        <div className="password-strength">
                            <div className="strength-bars">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div
                                        key={i}
                                        className={`strength-bar ${i <= passwordStrength.level ? 'active' : ''}`}
                                        style={{ backgroundColor: i <= passwordStrength.level ? passwordStrength.color : undefined }}
                                    />
                                ))}
                            </div>
                            <span className="strength-label" style={{ color: passwordStrength.color }}>
                                {passwordStrength.label}
                            </span>
                        </div>
                    )}
                    {errors.password && <span className="form-error">{errors.password}</span>}
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="confirmPassword">Confirm password</label>
                    <div className="input-with-icon">
                        <span className="input-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </span>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                            placeholder="Confirm your password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            tabIndex={-1}
                        >
                            {showConfirmPassword ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            )}
                        </button>
                    </div>
                    {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
                </div>

                <div className="checkbox-group terms-group">
                    <input
                        id="agreeTerms"
                        name="agreeTerms"
                        type="checkbox"
                        className="checkbox-input"
                        checked={formData.agreeTerms}
                        onChange={handleChange}
                    />
                    <label htmlFor="agreeTerms" className="checkbox-label">
                        I agree to the <a href="#" className="terms-link">Terms of Service</a> and{' '}
                        <a href="#" className="terms-link">Privacy Policy</a>
                    </label>
                </div>
                {errors.agreeTerms && <span className="form-error">{errors.agreeTerms}</span>}

                <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? (
                        <>
                            <span className="spinner"></span>
                            Creating account...
                        </>
                    ) : (
                        'Create Account'
                    )}
                </button>

                <div className="auth-divider">
                    <span>or sign up with</span>
                </div>

                <div className="social-buttons">
                    <button type="button" className="social-btn">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Google
                    </button>
                    <button type="button" className="social-btn">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                        GitHub
                    </button>
                </div>

                <p className="auth-switch">
                    Already have an account?
                    <Link to="/auth/login">Sign in</Link>
                </p>
            </form>
        </AuthLayout>
    );
};

export default Signup;

