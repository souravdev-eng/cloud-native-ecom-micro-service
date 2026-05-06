import React, { useState } from 'react';
import './Settings.css';

import StoreIcon from '@mui/icons-material/StoreRounded';
import PaymentIcon from '@mui/icons-material/PaymentRounded';
import LocalShippingIcon from '@mui/icons-material/LocalShippingRounded';
import NotificationsIcon from '@mui/icons-material/NotificationsRounded';
import SecurityIcon from '@mui/icons-material/SecurityRounded';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructionsRounded';
import PeopleIcon from '@mui/icons-material/PeopleRounded';
import ReceiptIcon from '@mui/icons-material/ReceiptLongRounded';
import SaveIcon from '@mui/icons-material/SaveRounded';

type SettingsTab = 'general' | 'payments' | 'shipping' | 'notifications' | 'security' | 'integrations' | 'team' | 'billing';

const settingsTabs = [
    { id: 'general' as SettingsTab, label: 'General', icon: <StoreIcon /> },
    { id: 'payments' as SettingsTab, label: 'Payments', icon: <PaymentIcon /> },
    { id: 'shipping' as SettingsTab, label: 'Shipping', icon: <LocalShippingIcon /> },
    { id: 'notifications' as SettingsTab, label: 'Notifications', icon: <NotificationsIcon /> },
    { id: 'security' as SettingsTab, label: 'Security', icon: <SecurityIcon /> },
    { id: 'integrations' as SettingsTab, label: 'Integrations', icon: <IntegrationInstructionsIcon /> },
    { id: 'team' as SettingsTab, label: 'Team', icon: <PeopleIcon /> },
    { id: 'billing' as SettingsTab, label: 'Billing', icon: <ReceiptIcon /> },
];

const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');

    return (
        <div className="settings-page">
            <div className="page-header animate-fade-in">
                <div>
                    <h1 className="page-title">Settings</h1>
                    <p className="page-subtitle">Manage your store settings and preferences</p>
                </div>
                <button className="btn btn-primary">
                    <SaveIcon />
                    Save Changes
                </button>
            </div>

            <div className="settings-layout animate-fade-in stagger-1">
                {/* Settings Tabs */}
                <nav className="settings-nav">
                    {settingsTabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </nav>

                {/* Settings Content */}
                <div className="settings-content">
                    {activeTab === 'general' && <GeneralSettings />}
                    {activeTab === 'payments' && <PaymentSettings />}
                    {activeTab === 'shipping' && <ShippingSettings />}
                    {activeTab === 'notifications' && <NotificationSettings />}
                    {activeTab === 'security' && <SecuritySettings />}
                    {activeTab === 'integrations' && <IntegrationSettings />}
                    {activeTab === 'team' && <TeamSettings />}
                    {activeTab === 'billing' && <BillingSettings />}
                </div>
            </div>
        </div>
    );
};

const GeneralSettings = () => (
    <div className="settings-section">
        <h2 className="section-title">General Settings</h2>
        <p className="section-description">Configure your store's basic information</p>

        <div className="settings-form">
            <div className="form-group">
                <label>Store Name</label>
                <input type="text" defaultValue="EcomStore" />
            </div>
            <div className="form-group">
                <label>Store URL</label>
                <input type="text" defaultValue="https://yourstore.com" />
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>Contact Email</label>
                    <input type="email" defaultValue="contact@yourstore.com" />
                </div>
                <div className="form-group">
                    <label>Support Phone</label>
                    <input type="tel" defaultValue="+1 234 567 8900" />
                </div>
            </div>
            <div className="form-group">
                <label>Store Description</label>
                <textarea rows={4} defaultValue="Your one-stop shop for quality products." />
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>Currency</label>
                    <select defaultValue="USD">
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>Timezone</label>
                    <select defaultValue="America/New_York">
                        <option value="America/New_York">Eastern Time (ET)</option>
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                        <option value="Europe/London">Greenwich Mean Time (GMT)</option>
                    </select>
                </div>
            </div>
        </div>
    </div>
);

const PaymentSettings = () => (
    <div className="settings-section">
        <h2 className="section-title">Payment Settings</h2>
        <p className="section-description">Manage payment methods and processors</p>

        <div className="payment-methods">
            <div className="payment-method">
                <div className="method-info">
                    <div className="method-logo stripe">Stripe</div>
                    <span className="method-status connected">Connected</span>
                </div>
                <button className="btn btn-secondary">Configure</button>
            </div>
            <div className="payment-method">
                <div className="method-info">
                    <div className="method-logo paypal">PayPal</div>
                    <span className="method-status connected">Connected</span>
                </div>
                <button className="btn btn-secondary">Configure</button>
            </div>
            <div className="payment-method">
                <div className="method-info">
                    <div className="method-logo apple-pay">Apple Pay</div>
                    <span className="method-status">Not Connected</span>
                </div>
                <button className="btn btn-primary">Connect</button>
            </div>
        </div>
    </div>
);

const ShippingSettings = () => (
    <div className="settings-section">
        <h2 className="section-title">Shipping Settings</h2>
        <p className="section-description">Configure shipping zones and rates</p>

        <div className="settings-form">
            <div className="form-group">
                <label>Default Shipping Origin</label>
                <input type="text" defaultValue="New York, NY 10001, USA" />
            </div>
            <div className="toggle-group">
                <label>
                    <span>Enable Free Shipping</span>
                    <span className="toggle-description">Orders over $100 qualify for free shipping</span>
                </label>
                <input type="checkbox" className="toggle" defaultChecked />
            </div>
            <div className="toggle-group">
                <label>
                    <span>Enable International Shipping</span>
                    <span className="toggle-description">Ship to customers worldwide</span>
                </label>
                <input type="checkbox" className="toggle" />
            </div>
        </div>
    </div>
);

const NotificationSettings = () => (
    <div className="settings-section">
        <h2 className="section-title">Notification Settings</h2>
        <p className="section-description">Configure email and push notifications</p>

        <div className="notification-options">
            <div className="toggle-group">
                <label>
                    <span>Order Confirmations</span>
                    <span className="toggle-description">Send email when order is placed</span>
                </label>
                <input type="checkbox" className="toggle" defaultChecked />
            </div>
            <div className="toggle-group">
                <label>
                    <span>Shipping Updates</span>
                    <span className="toggle-description">Notify customers about shipping status</span>
                </label>
                <input type="checkbox" className="toggle" defaultChecked />
            </div>
            <div className="toggle-group">
                <label>
                    <span>Low Stock Alerts</span>
                    <span className="toggle-description">Get notified when products are low</span>
                </label>
                <input type="checkbox" className="toggle" defaultChecked />
            </div>
            <div className="toggle-group">
                <label>
                    <span>Daily Sales Summary</span>
                    <span className="toggle-description">Receive daily sales reports</span>
                </label>
                <input type="checkbox" className="toggle" />
            </div>
        </div>
    </div>
);

const SecuritySettings = () => (
    <div className="settings-section">
        <h2 className="section-title">Security Settings</h2>
        <p className="section-description">Protect your store and customer data</p>

        <div className="security-options">
            <div className="toggle-group">
                <label>
                    <span>Two-Factor Authentication</span>
                    <span className="toggle-description">Add extra security to your account</span>
                </label>
                <input type="checkbox" className="toggle" defaultChecked />
            </div>
            <div className="toggle-group">
                <label>
                    <span>Login Notifications</span>
                    <span className="toggle-description">Get notified of new login attempts</span>
                </label>
                <input type="checkbox" className="toggle" defaultChecked />
            </div>
            <div className="form-group" style={{ marginTop: '24px' }}>
                <label>Session Timeout (minutes)</label>
                <input type="number" defaultValue="30" min="5" max="120" />
            </div>
        </div>
    </div>
);

const IntegrationSettings = () => (
    <div className="settings-section">
        <h2 className="section-title">Integrations</h2>
        <p className="section-description">Connect third-party services</p>

        <div className="integrations-list">
            <div className="integration-item">
                <div className="integration-info">
                    <span className="integration-name">Google Analytics</span>
                    <span className="integration-status connected">Active</span>
                </div>
                <button className="btn btn-secondary">Configure</button>
            </div>
            <div className="integration-item">
                <div className="integration-info">
                    <span className="integration-name">Mailchimp</span>
                    <span className="integration-status connected">Active</span>
                </div>
                <button className="btn btn-secondary">Configure</button>
            </div>
            <div className="integration-item">
                <div className="integration-info">
                    <span className="integration-name">Slack</span>
                    <span className="integration-status">Not Connected</span>
                </div>
                <button className="btn btn-primary">Connect</button>
            </div>
        </div>
    </div>
);

const TeamSettings = () => (
    <div className="settings-section">
        <h2 className="section-title">Team Members</h2>
        <p className="section-description">Manage who has access to your store</p>

        <div className="team-list">
            <div className="team-member">
                <div className="member-avatar">SM</div>
                <div className="member-info">
                    <span className="member-name">Saurav Majumdar</span>
                    <span className="member-email">saurav@example.com</span>
                </div>
                <span className="badge badge-accent">Owner</span>
            </div>
            <div className="team-member">
                <div className="member-avatar">JD</div>
                <div className="member-info">
                    <span className="member-name">John Doe</span>
                    <span className="member-email">john@example.com</span>
                </div>
                <span className="badge badge-info">Admin</span>
            </div>
            <button className="btn btn-secondary" style={{ marginTop: '16px' }}>+ Add Team Member</button>
        </div>
    </div>
);

const BillingSettings = () => (
    <div className="settings-section">
        <h2 className="section-title">Billing</h2>
        <p className="section-description">Manage your subscription and payment methods</p>

        <div className="billing-card">
            <div className="plan-info">
                <span className="plan-name">Pro Plan</span>
                <span className="plan-price">$49/month</span>
            </div>
            <div className="plan-features">
                <span>✓ Unlimited products</span>
                <span>✓ Advanced analytics</span>
                <span>✓ Priority support</span>
            </div>
            <button className="btn btn-secondary">Change Plan</button>
        </div>

        <div className="payment-info">
            <h3>Payment Method</h3>
            <div className="saved-card">
                <span className="card-brand">•••• •••• •••• 4242</span>
                <span className="card-expiry">Expires 12/26</span>
            </div>
            <button className="btn btn-ghost">Update Payment Method</button>
        </div>
    </div>
);

export default Settings;

