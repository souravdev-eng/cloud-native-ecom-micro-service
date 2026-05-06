import React from 'react';
import './Analytics.css';

import TrendingUpIcon from '@mui/icons-material/TrendingUpRounded';
import TrendingDownIcon from '@mui/icons-material/TrendingDownRounded';
import DownloadIcon from '@mui/icons-material/FileDownloadRounded';
import CalendarIcon from '@mui/icons-material/CalendarMonthRounded';

const performanceMetrics = [
    { label: 'Conversion Rate', value: '3.24%', change: 12.5, trend: 'up' },
    { label: 'Avg. Session Duration', value: '4m 32s', change: -5.2, trend: 'down' },
    { label: 'Bounce Rate', value: '42.8%', change: -8.1, trend: 'up' },
    { label: 'Pages/Session', value: '4.7', change: 15.3, trend: 'up' },
];

const trafficSources = [
    { source: 'Organic Search', visitors: 45200, percentage: 42, color: '#3b82f6' },
    { source: 'Direct', visitors: 28400, percentage: 26, color: '#22c55e' },
    { source: 'Social Media', visitors: 18700, percentage: 17, color: '#f59e0b' },
    { source: 'Referral', visitors: 10800, percentage: 10, color: '#8b5cf6' },
    { source: 'Email', visitors: 5400, percentage: 5, color: '#ef4444' },
];

const topPages = [
    { page: '/products/macbook-pro', views: 12480, unique: 8920, avgTime: '3:45' },
    { page: '/products/iphone-15', views: 9840, unique: 7120, avgTime: '2:58' },
    { page: '/cart', views: 8560, unique: 6840, avgTime: '1:24' },
    { page: '/checkout', views: 4280, unique: 3960, avgTime: '4:12' },
    { page: '/products/airpods', views: 3920, unique: 2840, avgTime: '2:31' },
];

const revenueByMonth = [
    { month: 'Jan', revenue: 42000 },
    { month: 'Feb', revenue: 38000 },
    { month: 'Mar', revenue: 52000 },
    { month: 'Apr', revenue: 48000 },
    { month: 'May', revenue: 61000 },
    { month: 'Jun', revenue: 55000 },
    { month: 'Jul', revenue: 72000 },
    { month: 'Aug', revenue: 68000 },
    { month: 'Sep', revenue: 78000 },
    { month: 'Oct', revenue: 82000 },
    { month: 'Nov', revenue: 94000 },
    { month: 'Dec', revenue: 98000 },
];

const maxRevenue = Math.max(...revenueByMonth.map(m => m.revenue));

const Analytics: React.FC = () => {
    return (
        <div className="analytics-page">
            <div className="page-header animate-fade-in">
                <div>
                    <h1 className="page-title">Analytics</h1>
                    <p className="page-subtitle">Track your store's performance and insights</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-secondary">
                        <CalendarIcon />
                        Last 30 Days
                    </button>
                    <button className="btn btn-primary">
                        <DownloadIcon />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Performance Metrics */}
            <div className="metrics-grid animate-fade-in stagger-1">
                {performanceMetrics.map((metric) => (
                    <div key={metric.label} className="metric-card">
                        <div className="metric-header">
                            <span className="metric-label">{metric.label}</span>
                            <span className={`metric-change ${metric.change >= 0 ? 'positive' : 'negative'}`}>
                                {metric.trend === 'up' ? <TrendingUpIcon /> : <TrendingDownIcon />}
                                {Math.abs(metric.change)}%
                            </span>
                        </div>
                        <span className="metric-value">{metric.value}</span>
                    </div>
                ))}
            </div>

            <div className="analytics-grid">
                {/* Revenue Chart */}
                <div className="chart-container full-width animate-fade-in stagger-2">
                    <div className="chart-header">
                        <h3 className="chart-title">Revenue Overview</h3>
                        <div className="chart-legend">
                            <span className="legend-item">
                                <span className="legend-dot" style={{ background: 'var(--accent-primary)' }} />
                                Revenue
                            </span>
                        </div>
                    </div>
                    <div className="revenue-chart">
                        <div className="chart-bars">
                            {revenueByMonth.map((month, i) => (
                                <div key={month.month} className="bar-wrapper">
                                    <div
                                        className="chart-bar"
                                        style={{
                                            height: `${(month.revenue / maxRevenue) * 100}%`,
                                            animationDelay: `${i * 50}ms`
                                        }}
                                    >
                                        <span className="bar-value">${(month.revenue / 1000).toFixed(0)}K</span>
                                    </div>
                                    <span className="bar-label">{month.month}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Traffic Sources */}
                <div className="chart-container animate-fade-in stagger-3">
                    <div className="chart-header">
                        <h3 className="chart-title">Traffic Sources</h3>
                    </div>
                    <div className="traffic-sources">
                        {trafficSources.map((source) => (
                            <div key={source.source} className="traffic-item">
                                <div className="traffic-info">
                                    <span className="traffic-dot" style={{ background: source.color }} />
                                    <div className="traffic-details">
                                        <span className="traffic-name">{source.source}</span>
                                        <span className="traffic-visitors">{source.visitors.toLocaleString()} visitors</span>
                                    </div>
                                </div>
                                <div className="traffic-bar-wrapper">
                                    <div
                                        className="traffic-bar"
                                        style={{
                                            width: `${source.percentage}%`,
                                            background: source.color
                                        }}
                                    />
                                </div>
                                <span className="traffic-percentage">{source.percentage}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Pages */}
                <div className="chart-container animate-fade-in stagger-4">
                    <div className="chart-header">
                        <h3 className="chart-title">Top Pages</h3>
                    </div>
                    <div className="top-pages">
                        <table className="pages-table">
                            <thead>
                                <tr>
                                    <th>Page</th>
                                    <th>Views</th>
                                    <th>Unique</th>
                                    <th>Avg. Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topPages.map((page) => (
                                    <tr key={page.page}>
                                        <td className="page-path">{page.page}</td>
                                        <td>{page.views.toLocaleString()}</td>
                                        <td>{page.unique.toLocaleString()}</td>
                                        <td>{page.avgTime}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;

