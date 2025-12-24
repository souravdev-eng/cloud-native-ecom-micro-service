import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './Sidebar.css';

// Icons
import DashboardIcon from '@mui/icons-material/SpaceDashboardRounded';
import InventoryIcon from '@mui/icons-material/Inventory2Rounded';
import PeopleIcon from '@mui/icons-material/PeopleAltRounded';
import OrdersIcon from '@mui/icons-material/ReceiptLongRounded';
import AnalyticsIcon from '@mui/icons-material/BarChartRounded';
import SettingsIcon from '@mui/icons-material/SettingsRounded';
import SupportIcon from '@mui/icons-material/HeadsetMicRounded';
import LogoutIcon from '@mui/icons-material/LogoutRounded';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightIcon from '@mui/icons-material/ChevronRightRounded';
import StorefrontIcon from '@mui/icons-material/StorefrontRounded';
import LocalShippingIcon from '@mui/icons-material/LocalShippingRounded';
import CampaignIcon from '@mui/icons-material/CampaignRounded';

interface NavItem {
    path: string;
    label: string;
    icon: React.ReactNode;
    badge?: string | number;
}

const mainNavItems: NavItem[] = [
    { path: '/', label: 'Dashboard', icon: <DashboardIcon /> },
    { path: '/products', label: 'Products', icon: <InventoryIcon />, badge: 'New' },
    { path: '/orders', label: 'Orders', icon: <OrdersIcon />, badge: 12 },
    { path: '/customers', label: 'Customers', icon: <PeopleIcon /> },
    { path: '/analytics', label: 'Analytics', icon: <AnalyticsIcon /> },
    { path: '/shipping', label: 'Shipping', icon: <LocalShippingIcon /> },
];

const secondaryNavItems: NavItem[] = [
    { path: '/marketing', label: 'Marketing', icon: <CampaignIcon /> },
    { path: '/storefront', label: 'Storefront', icon: <StorefrontIcon /> },
];

const bottomNavItems: NavItem[] = [
    { path: '/settings', label: 'Settings', icon: <SettingsIcon /> },
    { path: '/support', label: 'Support', icon: <SupportIcon /> },
];

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
    const location = useLocation();

    const renderNavItem = (item: NavItem, index: number) => {
        const isActive = location.pathname === item.path;

        return (
            <NavLink
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''} animate-slide-in stagger-${index + 1}`}
                title={collapsed ? item.label : undefined}
            >
                <span className="nav-icon">{item.icon}</span>
                {!collapsed && (
                    <>
                        <span className="nav-label">{item.label}</span>
                        {item.badge && (
                            <span className={`nav-badge ${typeof item.badge === 'number' ? 'numeric' : ''}`}>
                                {item.badge}
                            </span>
                        )}
                    </>
                )}
                {isActive && <span className="nav-indicator" />}
            </NavLink>
        );
    };

    return (
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
            {/* Logo */}
            <div className="sidebar-header">
                <div className="logo">
                    <div className="logo-icon">
                        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="32" height="32" rx="8" fill="url(#logoGradient)" />
                            <path
                                d="M8 16L14 10L20 16L14 22L8 16Z"
                                fill="white"
                                fillOpacity="0.9"
                            />
                            <path
                                d="M14 16L20 10L26 16L20 22L14 16Z"
                                fill="white"
                                fillOpacity="0.6"
                            />
                            <defs>
                                <linearGradient id="logoGradient" x1="0" y1="0" x2="32" y2="32">
                                    <stop stopColor="#f59e0b" />
                                    <stop offset="1" stopColor="#d97706" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    {!collapsed && (
                        <div className="logo-text">
                            <span className="logo-title">EcomAdmin</span>
                            <span className="logo-subtitle">Control Center</span>
                        </div>
                    )}
                </div>
                <button className="collapse-btn" onClick={onToggle} title={collapsed ? 'Expand' : 'Collapse'}>
                    {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                </button>
            </div>

            {/* Main Navigation */}
            <nav className="sidebar-nav">
                <div className="nav-section">
                    {!collapsed && <span className="nav-section-title">Main Menu</span>}
                    <div className="nav-items">
                        {mainNavItems.map((item, index) => renderNavItem(item, index))}
                    </div>
                </div>

                <div className="nav-section">
                    {!collapsed && <span className="nav-section-title">Store</span>}
                    <div className="nav-items">
                        {secondaryNavItems.map((item, index) => renderNavItem(item, index))}
                    </div>
                </div>
            </nav>

            {/* Bottom Navigation */}
            <div className="sidebar-footer">
                <div className="nav-items">
                    {bottomNavItems.map((item, index) => renderNavItem(item, index))}
                </div>

                {/* User Profile */}
                <div className="user-profile">
                    <div className="user-avatar">
                        <span>SM</span>
                    </div>
                    {!collapsed && (
                        <div className="user-info">
                            <span className="user-name">Saurav Majumdar</span>
                            <span className="user-role">Administrator</span>
                        </div>
                    )}
                    {!collapsed && (
                        <button className="logout-btn" title="Logout">
                            <LogoutIcon />
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;

