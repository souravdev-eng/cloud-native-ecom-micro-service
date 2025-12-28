import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

import './styles/index.css';
import Sidebar from './components/Sidebar/Sidebar';
import { ProtectedRoute } from './components';
import { AuthProvider } from './hooks';

// Pages
import Dashboard from './pages/Dashboard/Dashboard';
import Products from './pages/Products/Products';
import Orders from './pages/Orders/Orders';
import Customers from './pages/Customers/Customers';
import Analytics from './pages/Analytics/Analytics';
import Shipping from './pages/Shipping/Shipping';
import Marketing from './pages/Marketing/Marketing';
import Storefront from './pages/Storefront/Storefront';
import Settings from './pages/Settings/Settings';
import Support from './pages/Support/Support';

// Auth Pages
import { Login, Signup, ForgotPassword } from './pages/Auth';
import { ThemeProvider } from '@emotion/react';
import { adminTheme } from './themes';

const AppContent: React.FC = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const location = useLocation();

    // Check if current route is an auth route
    const isAuthRoute = location.pathname.startsWith('/auth');

    // Render auth pages without the sidebar layout
    if (isAuthRoute) {
        return (
            <Routes>
                <Route path="/admin/auth/login" element={<Login />} />
                <Route path="/admin/auth/signup" element={<Signup />} />
                <Route path="/admin/auth/forgot-password" element={<ForgotPassword />} />
            </Routes>
        );
    }

    return (
        <ProtectedRoute>
            <div className="admin-layout">
                <Sidebar
                    collapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                />
                <main className={`admin-main ${sidebarCollapsed ? 'collapsed' : ''}`}>
                    <div className="admin-content">
                        <Routes>
                            <Route path="/admin" element={<Dashboard />} />
                            <Route path="/admin/products" element={<Products />} />
                            <Route path="/admin/orders" element={<Orders />} />
                            <Route path="/admin/customers" element={<Customers />} />
                            <Route path="/admin/analytics" element={<Analytics />} />
                            <Route path="/admin/shipping" element={<Shipping />} />
                            <Route path="/admin/marketing" element={<Marketing />} />
                            <Route path="/admin/storefront" element={<Storefront />} />
                            <Route path="/admin/settings" element={<Settings />} />
                            <Route path="/admin/support" element={<Support />} />
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
};

const NotFound: React.FC = () => (
    <div className="not-found">
        <h1>404</h1>
        <p>Page not found</p>
    </div>
);

const App: React.FC = () => {
    return (
        <ThemeProvider theme={adminTheme}>
            <div className="admin-mfe">
                <AuthProvider>
                    <AppContent />
                </AuthProvider>
            </div>
        </ThemeProvider>
    );
};

export default App;
