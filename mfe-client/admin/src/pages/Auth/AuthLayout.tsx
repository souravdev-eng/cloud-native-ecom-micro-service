import React from 'react';
import './AuthLayout.css';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
    return (
        <div className="auth-layout">
            {/* Background Pattern */}
            <div className="auth-background">
                <div className="auth-pattern"></div>
                <div className="auth-glow auth-glow-1"></div>
                <div className="auth-glow auth-glow-2"></div>
            </div>

            {/* Left Side - Branding */}
            <div className="auth-branding">
                <div className="branding-content">
                    <div className="brand-logo">
                        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="48" height="48" rx="12" fill="url(#authLogoGradient)" />
                            <path
                                d="M12 24L21 15L30 24L21 33L12 24Z"
                                fill="white"
                                fillOpacity="0.9"
                            />
                            <path
                                d="M21 24L30 15L39 24L30 33L21 24Z"
                                fill="white"
                                fillOpacity="0.6"
                            />
                            <defs>
                                <linearGradient id="authLogoGradient" x1="0" y1="0" x2="48" y2="48">
                                    <stop stopColor="#f59e0b" />
                                    <stop offset="1" stopColor="#d97706" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <span className="brand-name">EcomAdmin</span>
                    </div>

                    <h1 className="brand-tagline">
                        Powerful tools for<br />
                        <span className="highlight">modern commerce</span>
                    </h1>

                    <p className="brand-description">
                        Manage your entire e-commerce operation from one beautiful dashboard.
                        Track sales, inventory, customers, and more.
                    </p>

                    <div className="brand-features">
                        <div className="feature">
                            <div className="feature-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                </svg>
                            </div>
                            <span>Real-time Analytics</span>
                        </div>
                        <div className="feature">
                            <div className="feature-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                    <path d="M3 9h18M9 21V9" />
                                </svg>
                            </div>
                            <span>Inventory Management</span>
                        </div>
                        <div className="feature">
                            <div className="feature-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </div>
                            <span>Customer Insights</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Auth Form */}
            <div className="auth-form-container">
                <div className="auth-form-wrapper">
                    <div className="auth-header">
                        <h2 className="auth-title">{title}</h2>
                        <p className="auth-subtitle">{subtitle}</p>
                    </div>
                    {children}
                </div>

                <div className="auth-footer">
                    <p>© 2025 EcomAdmin. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;

