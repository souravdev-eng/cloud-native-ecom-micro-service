import React from 'react';
import './Marketing.css';

import AddIcon from '@mui/icons-material/AddRounded';
import EmailIcon from '@mui/icons-material/EmailRounded';
import DiscountIcon from '@mui/icons-material/LocalOfferRounded';
import CampaignIcon from '@mui/icons-material/CampaignRounded';
import TrendingUpIcon from '@mui/icons-material/TrendingUpRounded';
import EditIcon from '@mui/icons-material/EditRounded';
import PauseIcon from '@mui/icons-material/PauseRounded';
import PlayArrowIcon from '@mui/icons-material/PlayArrowRounded';

interface Campaign {
    id: string;
    name: string;
    type: 'email' | 'discount' | 'social';
    status: 'active' | 'paused' | 'scheduled' | 'ended';
    reach: number;
    conversions: number;
    revenue: number;
    startDate: string;
    endDate: string;
}

const mockCampaigns: Campaign[] = [
    { id: '1', name: 'Holiday Sale 2025', type: 'discount', status: 'active', reach: 45000, conversions: 1250, revenue: 125000, startDate: 'Dec 15, 2025', endDate: 'Dec 31, 2025' },
    { id: '2', name: 'New Year Newsletter', type: 'email', status: 'scheduled', reach: 28000, conversions: 0, revenue: 0, startDate: 'Jan 01, 2026', endDate: 'Jan 01, 2026' },
    { id: '3', name: 'Black Friday Promo', type: 'discount', status: 'ended', reach: 62000, conversions: 3400, revenue: 340000, startDate: 'Nov 24, 2025', endDate: 'Nov 30, 2025' },
    { id: '4', name: 'Product Launch', type: 'social', status: 'paused', reach: 18000, conversions: 450, revenue: 45000, startDate: 'Dec 01, 2025', endDate: 'Dec 15, 2025' },
    { id: '5', name: 'Customer Re-engagement', type: 'email', status: 'active', reach: 12000, conversions: 320, revenue: 28000, startDate: 'Dec 10, 2025', endDate: 'Jan 10, 2026' },
];

const marketingStats = [
    { label: 'Active Campaigns', value: '8', icon: <CampaignIcon />, color: '#3b82f6' },
    { label: 'Email Subscribers', value: '24.5K', icon: <EmailIcon />, color: '#22c55e' },
    { label: 'Active Coupons', value: '12', icon: <DiscountIcon />, color: '#f59e0b' },
    { label: 'Conversion Rate', value: '3.2%', icon: <TrendingUpIcon />, color: '#8b5cf6' },
];

const getStatusClass = (status: string) => {
    switch (status) {
        case 'active': return 'badge-success';
        case 'paused': return 'badge-warning';
        case 'scheduled': return 'badge-info';
        case 'ended': return 'badge-muted';
        default: return '';
    }
};

const getTypeIcon = (type: string) => {
    switch (type) {
        case 'email': return <EmailIcon />;
        case 'discount': return <DiscountIcon />;
        case 'social': return <CampaignIcon />;
        default: return null;
    }
};

const Marketing: React.FC = () => {
    return (
        <div className="marketing-page">
            <div className="page-header animate-fade-in">
                <div>
                    <h1 className="page-title">Marketing</h1>
                    <p className="page-subtitle">Manage campaigns and promotions</p>
                </div>
                <button className="btn btn-primary">
                    <AddIcon />
                    New Campaign
                </button>
            </div>

            {/* Marketing Stats */}
            <div className="marketing-stats animate-fade-in stagger-1">
                {marketingStats.map((stat) => (
                    <div key={stat.label} className="marketing-stat">
                        <div className="stat-icon" style={{ background: `${stat.color}20`, color: stat.color }}>
                            {stat.icon}
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{stat.value}</span>
                            <span className="stat-label">{stat.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Campaigns */}
            <div className="card animate-fade-in stagger-2">
                <div className="card-header">
                    <h3 className="card-title">Campaigns</h3>
                </div>
                <div className="campaigns-list">
                    {mockCampaigns.map((campaign) => (
                        <div key={campaign.id} className="campaign-item">
                            <div className="campaign-icon" data-type={campaign.type}>
                                {getTypeIcon(campaign.type)}
                            </div>
                            <div className="campaign-info">
                                <h4 className="campaign-name">{campaign.name}</h4>
                                <span className="campaign-dates">{campaign.startDate} - {campaign.endDate}</span>
                            </div>
                            <div className="campaign-metrics">
                                <div className="metric">
                                    <span className="metric-value">{campaign.reach.toLocaleString()}</span>
                                    <span className="metric-label">Reach</span>
                                </div>
                                <div className="metric">
                                    <span className="metric-value">{campaign.conversions.toLocaleString()}</span>
                                    <span className="metric-label">Conversions</span>
                                </div>
                                <div className="metric">
                                    <span className="metric-value">${(campaign.revenue / 1000).toFixed(0)}K</span>
                                    <span className="metric-label">Revenue</span>
                                </div>
                            </div>
                            <span className={`badge ${getStatusClass(campaign.status)}`}>
                                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                            </span>
                            <div className="campaign-actions">
                                <button className="action-btn" title={campaign.status === 'active' ? 'Pause' : 'Resume'}>
                                    {campaign.status === 'active' ? <PauseIcon /> : <PlayArrowIcon />}
                                </button>
                                <button className="action-btn" title="Edit">
                                    <EditIcon />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Marketing;

